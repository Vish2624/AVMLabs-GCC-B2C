// List of all profiles with search, edit and delete.
import { html } from '../html.js';
import { formatPrice, icon, plural, tint, view } from '../ui.js';

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
    const confirming = confirmId === p.id;
    return html`
      <section class="card">
        <div class="card-head">
          <span class="card-icon" style="${tint(p.hue)}">${icon(p.icon)}</span>
          <div class="card-main">
            <div class="row">
              <h2>${p.name}</h2>
              <span class="badge">${categoryLabel.get(p.category) || p.category}</span>
              <span class="badge ${p.published ? 'live' : 'draft'}">${p.published ? 'Live' : 'Draft'}</span>
            </div>
            ${p.tagline && html`<p class="tagline">${p.tagline}</p>`}
            <p class="meta">${plural(p.subs.length, 'sub-profile')} · ${plural(count, 'test')} ·
              <span class="price">${formatPrice(p.price)}</span>${mrp(p) > p.price && html`<s>${formatPrice(mrp(p))}</s>`}</p>
          </div>
          <div class="card-actions">
            <button class="btn small" data-act="edit" data-id="${p.id}">Edit</button>
            ${confirming
              ? html`<button class="btn small danger solid" data-act="delete" data-id="${p.id}" ${deletingId ? 'disabled' : ''}>${deletingId ? 'Deleting…' : 'Confirm delete'}</button>
                     <button class="btn small" data-act="cancel-delete">Cancel</button>`
              : html`<button class="btn small danger" data-act="ask-delete" data-id="${p.id}">Delete</button>`}
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
    return html`
      <header class="topbar">
        <div class="brand">
          <span class="brand-mark">AVM</span>
          <div><h1>Health profiles</h1><p class="subtitle">${plural(profiles.length, 'profile')} · changes show on the website within a minute</p></div>
        </div>
        <div class="row">
          <button class="btn ghost" data-act="logout">Log out</button>
          <button class="btn primary" data-act="new">+ New profile</button>
        </div>
      </header>
      ${profiles.length > 3 && html`
        <div class="toolbar"><input type="search" data-input="search" placeholder="Search profiles" aria-label="Search profiles" value="${query}"></div>`}
      ${!profiles.length && html`<div class="empty">No profiles yet. Select “New profile” to create the first one.</div>`}
      ${profiles.length > 0 && !shown.length && html`<div class="empty">No profiles match “${query}”.</div>`}
      ${shown.map(card)}`;
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
