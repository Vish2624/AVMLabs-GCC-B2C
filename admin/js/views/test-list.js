// All lab tests: search, see where each is used, open to edit.
import { html } from '../html.js';
import { appBar, formatPrice, icon, plural, tabs, view } from '../ui.js';

// Sub-profiles and profiles that include a test (profiles only through their extra tests).
export function testUsage(id, subProfiles, profiles) {
  return [
    ...subProfiles.filter((s) => s.tests.includes(id)).map((s) => s.name),
    ...profiles.filter((p) => p.tests.includes(id)).map((p) => p.name),
  ];
}

export function TestListView({ catalog, subProfiles, profiles, onNew, onEdit, onTab, onLogout }) {
  const categoryLabel = new Map(catalog.testCategories.map((c) => [c.id, c.label]));
  let query = '';

  const card = (t) => {
    const used = testUsage(t.id, subProfiles, profiles);
    const off = t.mrp > t.price ? Math.round((1 - t.price / t.mrp) * 100) : 0;
    return html`
      <section class="card">
        <div class="card-top">
          <span class="card-icon">${icon(t.sample === 'Urine' ? 'flask-conical' : 'test-tube')}</span>
          <div class="card-title">
            <h2>${t.name}</h2>
            <p class="tagline">${t.cat.map((c) => categoryLabel.get(c) || c).join(' · ')} · ${t.sample} sample · Report in ${t.tat}${t.fasting ? ' · Fasting' : ''}</p>
          </div>
          <span class="pill ${t.published ? 'live' : 'draft'}">${t.published ? 'Live' : 'Hidden'}</span>
        </div>
        <div class="card-body">
          <p class="meta">
            ${plural(t.parameters.length, 'parameter')}${t.calculated.length > 0 && html` · <b class="calc-count">${t.calculated.length} calculated</b>`}
          </p>
          <div class="pricebox">
            <div class="price">
              <span class="now">${formatPrice(t.price)}</span>
              ${off > 0 && html`<s>${formatPrice(t.mrp)}</s><span class="off">${off}% off</span>`}
            </div>
            <div class="card-actions">
              ${catalog.testsReadOnly ? html`<button class="btn small" disabled title="${catalog.testsReadOnly}">${icon('lock')}Editing off</button>` : html`<button class="btn small outline" data-act="edit" data-id="${t.id}">${icon('pencil')}Edit</button>`}
            </div>
          </div>
          <p class="used-in">${used.length ? html`Used in ${used.join(', ')}` : 'Not in any sub-profile or profile yet.'}</p>
        </div>
      </section>`;
  };

  const { el, update } = view(() => {
    const q = query.trim().toLowerCase();
    const tests = catalog.tests;
    const shown = tests.filter(
      (t) =>
        !q ||
        `${t.name} ${t.short} ${t.id} ${t.aka} ${t.parameters.join(' ')} ${t.calculated.join(' ')}`
          .toLowerCase()
          .includes(q),
    );
    return html`
      ${appBar(html`
        <button class="btn small" data-act="logout">${icon('log-out')}Log out</button>
        ${!catalog.testsReadOnly && html`<button class="btn primary" data-act="new">${icon('plus')}New test</button>`}`)}
      <main class="page">
        <div class="pagehead">
          <div>
            <div class="eyebrow">Admin</div>
            <h1>Tests</h1>
            <p class="subtitle">Every lab test, with its parameters. Add tests here, then group them into sub-profiles and profiles.</p>
          </div>
        </div>
        ${tabs('tests')}
        <div class="toolbar">
          <label class="search">${icon('search')}<input type="search" data-input="search" placeholder="Search tests or parameters" aria-label="Search tests" value="${query}"></label>
          <span class="stats">${plural(tests.length, 'test')} · ${tests.filter((t) => t.published).length} live</span>
        </div>
        ${catalog.testsReadOnly && html`<div class="note">${icon('info')}<span>${catalog.testsReadOnly}</span></div>`}
        ${!tests.length && html`<div class="empty">No tests yet. Select “New test” to add the first one.</div>`}
        ${tests.length > 0 && !shown.length && html`<div class="empty">No tests match “${query}”.</div>`}
        <div class="cards">${shown.map(card)}</div>
      </main>`;
  });

  el.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const { act, id, tab } = btn.dataset;
    if (act === 'new') onNew();
    else if (act === 'logout') onLogout();
    else if (act === 'edit') onEdit(catalog.tests.find((t) => t.id === id));
    else if (act === 'tab' || act === 'home') onTab(act === 'home' ? 'profiles' : tab);
  });

  el.addEventListener('input', (e) => {
    if (e.target.dataset.input !== 'search') return;
    query = e.target.value;
    const pos = e.target.selectionStart;
    update('[data-input="search"]');
    el.querySelector('[data-input="search"]')?.setSelectionRange(pos, pos);
  });

  update();
  return el;
}
