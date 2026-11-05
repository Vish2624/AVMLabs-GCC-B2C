// List of all profiles with search, edit and delete.
import { html } from '../html.js';
import { appBar, COUNTRIES, formatMoney, icon, plural, tabs, view } from '../ui.js';

export function ProfileListView({ profiles, catalog, onNew, onEdit, onTab, onLogout }) {
  const tests = new Map(catalog.tests.map((t) => [t.id, t]));
  const categoryLabel = new Map(catalog.categories.map((c) => [c.id, c.label]));
  let query = '';

  const uniqueTests = (p) => [...new Set(p.subs.flatMap((s) => s.tests))];

  const card = (p) => {
    const count = uniqueTests(p).length;
    return html`
      <section class="card">
        <div class="card-top">
          <span class="card-icon">${icon(p.icon)}</span>
          <div class="card-title">
            <h2>${p.name}</h2>
            ${p.tagline && html`<p class="tagline">${p.tagline}</p>`}
          </div>
          <span class="pill ${p.published ? 'live' : 'draft'}">${p.published ? 'Live' : 'Draft'}</span>
        </div>
        <div class="card-body">
          <p class="meta">${categoryLabel.get(p.category) || p.category} · ${plural(count, 'test')} · ${plural(p.subProfiles.length, 'sub-profile')}${p.tests.length ? ` + ${plural(p.tests.length, 'extra test')}` : ''}</p>
          <div class="pricebox">
            <div class="price">${COUNTRIES.map((c) => html`<span class="now">${formatMoney(c.code, p.prices?.[c.code])}</span>`)}</div>
            <div class="card-actions">
              <button class="btn small outline" data-act="edit" data-id="${p.id}">${icon('pencil')}Edit</button>
            </div>
          </div>
        </div>
        <details>
          <summary>View structure</summary>
          <div class="structure">
            ${p.subs.map(
              (s) => html`
              <div>
                <h3>${s.name}</h3>
                ${s.description && html`<p>${s.description}</p>`}
                <ul>${s.tests.map((id) => html`<li>${tests.get(id)?.name || id}</li>`)}</ul>
              </div>`,
            )}
          </div>
        </details>
      </section>`;
  };

  const { el, update } = view(() => {
    const q = query.trim().toLowerCase();
    const shown = profiles.filter((p) => !q || `${p.name} ${p.tag} ${p.category}`.toLowerCase().includes(q));
    const live = profiles.filter((p) => p.published).length;
    return html`
      ${appBar(html`
        <button class="btn small" data-act="logout">${icon('log-out')}Log out</button>
        <button class="btn primary" data-act="new">${icon('plus')}New profile</button>`)}
      <main class="page">
        <div class="pagehead">
          <div>
            <div class="eyebrow">Admin</div>
            <h1>Health profiles</h1>
            <p class="subtitle">Changes show on the website within about 5 minutes.</p>
          </div>
        </div>
        ${tabs('profiles')}
        <div class="toolbar">
          <label class="search">${icon('search')}<input type="search" data-input="search" placeholder="Search profiles" aria-label="Search profiles" value="${query}"></label>
          <span class="stats">${plural(profiles.length, 'profile')} · ${live} live</span>
        </div>
        ${!profiles.length && html`<div class="empty">No profiles yet. Select “New profile” to create the first one.</div>`}
        ${profiles.length > 0 && !shown.length && html`<div class="empty">No profiles match “${query}”.</div>`}
        <div class="cards">${shown.map(card)}</div>
      </main>`;
  });

  el.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const { act, id, tab } = btn.dataset;
    if (act === 'new') onNew();
    else if (act === 'logout') onLogout();
    else if (act === 'edit') onEdit(profiles.find((p) => p.id === id));
    else if (act === 'tab') onTab(tab);
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
