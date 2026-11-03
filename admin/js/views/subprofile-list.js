// Reusable sub-profiles: search, see where each is used, open to edit.
import { html } from '../html.js';
import { appBar, formatPrices, icon, plural, sumPrices, tabs, view } from '../ui.js';

export function SubProfileListView({ subProfiles, profiles, catalog, onNew, onEdit, onTab, onLogout }) {
  const tests = new Map(catalog.tests.map((t) => [t.id, t]));
  const profileName = new Map(profiles.map((p) => [p.id, p.name]));
  let query = '';

  const card = (s) => {
    const params = s.tests.reduce((sum, id) => sum + (tests.get(id)?.params || 0), 0);
    const used = s.usedBy.map((id) => profileName.get(id) || id);
    return html`
      <section class="card">
        <div class="card-top">
          <span class="card-icon">${icon('list-checks')}</span>
          <div class="card-title">
            <h2>${s.name}</h2>
            ${s.description && html`<p class="tagline">${s.description}</p>`}
          </div>
          <span class="pill ${used.length ? 'live' : 'draft'}">${used.length ? `In ${plural(used.length, 'profile')}` : 'Not used'}</span>
        </div>
        <div class="card-body">
          <p class="meta">${plural(s.tests.length, 'test')} · ${plural(params, 'parameter')} · ${formatPrices(sumPrices(s.tests, tests))}</p>
          <ul class="test-list">${s.tests.map((id) => html`<li>${tests.get(id)?.name || id}</li>`)}</ul>
          <div class="pricebox">
            <p class="used-in">${used.length ? html`Used in ${used.join(', ')}` : 'Add it to a profile from the Profiles tab.'}</p>
            <div class="card-actions">
              <button class="btn small outline" data-act="edit" data-id="${s.id}">${icon('pencil')}Edit</button>
            </div>
          </div>
        </div>
      </section>`;
  };

  const { el, update } = view(() => {
    const q = query.trim().toLowerCase();
    const shown = subProfiles.filter(
      (s) =>
        !q ||
        `${s.name} ${s.description} ${s.tests.map((id) => tests.get(id)?.name || id).join(' ')}`
          .toLowerCase()
          .includes(q),
    );
    return html`
      ${appBar(html`
        <button class="btn small" data-act="logout">${icon('log-out')}Log out</button>
        <button class="btn primary" data-act="new">${icon('plus')}New sub-profile</button>`)}
      <main class="page">
        <div class="pagehead">
          <div>
            <div class="eyebrow">Admin</div>
            <h1>Sub-profiles</h1>
            <p class="subtitle">Groups of tests you reuse across profiles. Editing one updates every profile that uses it.</p>
          </div>
        </div>
        ${tabs('subs')}
        <div class="toolbar">
          <label class="search">${icon('search')}<input type="search" data-input="search" placeholder="Search sub-profiles or tests" aria-label="Search sub-profiles" value="${query}"></label>
          <span class="stats">${plural(subProfiles.length, 'sub-profile')}</span>
        </div>
        ${!subProfiles.length && html`<div class="empty">No sub-profiles yet. Select “New sub-profile” to create the first one.</div>`}
        ${subProfiles.length > 0 && !shown.length && html`<div class="empty">No sub-profiles match “${query}”.</div>`}
        <div class="cards">${shown.map(card)}</div>
      </main>`;
  });

  el.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const { act, id, tab } = btn.dataset;
    if (act === 'new') onNew();
    else if (act === 'logout') onLogout();
    else if (act === 'edit') onEdit(subProfiles.find((s) => String(s.id) === id));
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
