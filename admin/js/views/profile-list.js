// List of all profiles with search, edit and delete.
import { html } from '../html.js';
import { appBar, cardBg, formatPrice, icon, ink, plural, view } from '../ui.js';

export function ProfileListView({ profiles, catalog, onNew, onEdit, onDelete, onLogout }) {
  const tests = new Map(catalog.tests.map((t) => [t.id, t]));
  const categoryLabel = new Map(catalog.categories.map((c) => [c.id, c.label]));
  let query = '';
  let confirmId = null;
  let deletingId = null;

  const uniqueTests = (p) => [...new Set(p.subs.flatMap((s) => s.tests))];
  const mrp = (p) => uniqueTests(p).reduce((sum, id) => sum + (tests.get(id)?.mrp || 0), 0);

  const card = (p) => {
    const count = uniqueTests(p).length;
    const full = mrp(p);
    const off = full > p.price ? Math.round((1 - p.price / full) * 100) : 0;
    const confirming = confirmId === p.id;
    return html`
      <section class="card">
        <div class="card-top" style="${cardBg(p.hue)}">
          <div class="row">
            <span class="card-icon" style="${ink(p.hue)}">${icon(p.icon)}</span>
            <div class="row">
              <span class="pill">${categoryLabel.get(p.category) || p.category}</span>
              <span class="pill ${p.published ? 'live' : 'draft'}">${p.published ? 'Live' : 'Draft'}</span>
            </div>
          </div>
          <h2>${p.name}</h2>
          ${p.tagline && html`<p class="tagline">${p.tagline}</p>`}
        </div>
        <div class="card-body">
          <div class="facts">
            <div class="fact"><span class="fact-icon">${icon('test-tubes')}</span><span><small>Includes</small><b>${plural(count, 'test')}</b></span></div>
            <div class="fact"><span class="fact-icon">${icon('layers')}</span><span><small>Sub-profiles</small><b>${p.subs.length}</b></span></div>
          </div>
          <div class="pricebox">
            <div>
              ${off > 0 && html`<div class="was"><s>${formatPrice(full)}</s><span class="pill off">${off}% off</span></div>`}
              <div class="now">${formatPrice(p.price)}</div>
            </div>
            <div class="card-actions">
              ${confirming
                ? html`<button class="btn small danger solid" data-act="delete" data-id="${p.id}" ${deletingId ? 'disabled' : ''}>${deletingId ? 'Deleting…' : 'Delete'}</button>
                       <button class="btn small" data-act="cancel-delete">Keep</button>`
                : html`<button class="btn small icon-only danger" data-act="ask-delete" data-id="${p.id}" aria-label="Delete ${p.name}">${icon('trash-2')}</button>
                       <button class="btn small outline" data-act="edit" data-id="${p.id}">${icon('pencil')}Edit</button>`}
            </div>
          </div>
        </div>
        <details>
          <summary>View structure</summary>
          <div class="structure">
            ${p.subs.map((s) => html`
              <div>
                <h3>${s.name}</h3>
                ${s.description && html`<p>${s.description}</p>`}
                <ul>${s.tests.map((id) => html`<li>${tests.get(id)?.name || id}</li>`)}</ul>
              </div>`)}
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
            <p class="subtitle">Changes show on the website within a minute.</p>
          </div>
        </div>
        <div class="toolbar">
          <label class="search">${icon('search')}<input type="search" data-input="search" placeholder="Search profiles" aria-label="Search profiles" value="${query}"></label>
          <span class="stats">${plural(profiles.length, 'profile')} · ${live} live</span>
        </div>
        ${!profiles.length && html`<div class="empty">No profiles yet. Select “New profile” to create the first one.</div>`}
        ${profiles.length > 0 && !shown.length && html`<div class="empty">No profiles match “${query}”.</div>`}
        <div class="cards">${shown.map(card)}</div>
      </main>`;
  });

  el.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const { act, id } = btn.dataset;
    if (act === 'new') onNew();
    else if (act === 'logout') onLogout();
    else if (act === 'edit') onEdit(profiles.find((p) => p.id === id));
    else if (act === 'ask-delete') { confirmId = id; update(); }
    else if (act === 'cancel-delete') { confirmId = null; update(); }
    else if (act === 'delete') {
      deletingId = id;
      update();
      const ok = await onDelete(id);
      deletingId = null;
      confirmId = null;
      if (ok) profiles = profiles.filter((p) => p.id !== id);
      update();
    }
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
