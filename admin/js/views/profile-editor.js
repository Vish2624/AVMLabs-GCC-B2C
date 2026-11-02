// Create or edit a profile: details, look, and sub-profiles with tests.
import { html } from '../html.js';
import { formatPrice, icon, plural, tint, toast, view } from '../ui.js';

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const slugify = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');

let keySeq = 0;
const newSub = (sub = {}, open = true) => ({
  key: ++keySeq, name: sub.name || '', description: sub.description || '', tests: [...(sub.tests || [])], open,
});

export function ProfileEditorView({ profile, catalog, nextSortOrder, onSave, onClose }) {
  const isNew = !profile;
  const tests = new Map(catalog.tests.map((t) => [t.id, t]));
  const byName = new Map(catalog.tests.map((t) => [t.name.toLowerCase(), t]));

  const draft = isNew
    ? { id: '', name: '', tag: '', category: catalog.categories[0].id, tagline: '', price: '', icon: 'layers',
        hue: catalog.colours[0].hue, sortOrder: nextSortOrder, published: true, subs: [newSub()] }
    : { ...profile, price: String(profile.price), subs: profile.subs.map((s, i) => newSub(s, i === 0)) };
  let idTouched = !isNew;
  let dirty = false;
  let saving = false;
  let confirmDiscard = false;
  let error = '';

  const uniqueTests = () => [...new Set(draft.subs.flatMap((s) => s.tests))];
  const subMrp = (s) => s.tests.reduce((sum, id) => sum + (tests.get(id)?.mrp || 0), 0);

  const summary = () => {
    const ids = uniqueTests();
    const mrp = ids.reduce((sum, id) => sum + (tests.get(id)?.mrp || 0), 0);
    const params = ids.reduce((sum, id) => sum + (tests.get(id)?.params || 0), 0);
    const price = Number(draft.price);
    const off = mrp > 0 && price >= 0 && price < mrp ? Math.round((1 - price / mrp) * 100) : 0;
    return html`
      <strong>${plural(ids.length, 'test')}</strong> · ${plural(params, 'parameter')} · MRP <strong>${formatPrice(mrp)}</strong>
      ${draft.price !== '' && html` · Price <strong>${formatPrice(price)}</strong>${off > 0 && html` (${off}% off)`}`}
      ${price > mrp && mrp > 0 && html` · <span class="warn">Price is above MRP</span>`}`;
  };

  const sub = (s, i) => html`
    <div class="sub ${s.open ? 'open' : ''}">
      <div class="sub-head">
        <button class="toggle" type="button" data-act="toggle" data-sub="${i}" aria-expanded="${s.open}">
          <span class="chev" aria-hidden="true">›</span>
          <span class="name" data-sub-title="${i}">${s.name || 'Untitled sub-profile'}</span>
          <span class="count">${plural(s.tests.length, 'test')} · ${formatPrice(subMrp(s))}</span>
        </button>
        <button class="btn small ghost danger" type="button" data-act="remove-sub" data-sub="${i}" aria-label="Remove ${s.name || 'sub-profile'}">Remove</button>
      </div>
      ${s.open && html`
        <div class="sub-body">
          <div class="grid">
            <div class="field">
              <label for="sub-name-${i}">Sub-profile name</label>
              <input id="sub-name-${i}" data-field="sub-name" data-sub="${i}" value="${s.name}" placeholder="e.g. Lipid Profile" autocomplete="off">
            </div>
            <div class="field">
              <label for="sub-desc-${i}">Description <span class="hint">(optional)</span></label>
              <input id="sub-desc-${i}" data-field="sub-desc" data-sub="${i}" value="${s.description}" autocomplete="off">
            </div>
          </div>
          <div class="field">
            <span class="label">Tests</span>
            ${s.tests.length
              ? html`<div class="chips">${s.tests.map((id, j) => html`
                  <span class="chip">${tests.get(id)?.name || id}<small>${formatPrice(tests.get(id)?.mrp)}</small>
                    <button type="button" data-act="remove-test" data-sub="${i}" data-test="${j}" aria-label="Remove ${tests.get(id)?.name || id}">×</button>
                  </span>`)}</div>`
              : html`<p class="empty-note">No tests yet.</p>`}
            <input id="test-add-${i}" data-field="test-add" data-sub="${i}" list="test-options" placeholder="Type to add a test, e.g. Vitamin D" autocomplete="off" aria-label="Add a test">
          </div>
        </div>`}
    </div>`;

  const { el, update } = view(() => html`
    <header class="topbar">
      <div><h1>${isNew ? 'New profile' : 'Edit profile'}</h1><p class="subtitle">${isNew ? 'Build a profile from sub-profiles and tests.' : draft.name}</p></div>
      <button class="btn" type="button" data-act="close">← Back to list</button>
    </header>
    ${error && html`<div class="alert" role="alert">${error}</div>`}

    <section class="panel">
      <h2>Details</h2>
      <div class="grid">
        <div class="field">
          <label for="name">Profile name</label>
          <input id="name" data-field="name" value="${draft.name}" placeholder="e.g. Women's Hormone Profile" autocomplete="off" required>
        </div>
        <div class="field">
          <label for="id">Profile ID</label>
          <input id="id" data-field="id" value="${draft.id}" placeholder="e.g. womens-hormone" autocomplete="off" ${isNew ? '' : 'disabled'}>
          <span class="hint">${isNew ? 'Used in links and the cart. Can’t be changed later.' : 'Can’t be changed.'}</span>
        </div>
        <div class="field">
          <label for="tag">Badge label</label>
          <input id="tag" data-field="tag" value="${draft.tag}" placeholder="e.g. Women" maxlength="24" autocomplete="off">
        </div>
        <div class="field">
          <label for="category">Category</label>
          <select id="category" data-field="category">
            ${catalog.categories.map((c) => html`<option value="${c.id}" ${c.id === draft.category ? 'selected' : ''}>${c.label}</option>`)}
          </select>
          <span class="hint">The filter it appears under on the Profiles page.</span>
        </div>
        <div class="field full">
          <label for="tagline">Tagline</label>
          <input id="tagline" data-field="tagline" value="${draft.tagline}" placeholder="e.g. Cycles, fertility & energy — understand your hormones." maxlength="140" autocomplete="off">
        </div>
        <div class="field">
          <label for="price">Price</label>
          <div class="prefix"><span>₹</span><input id="price" data-field="price" type="number" min="0" step="1" inputmode="numeric" value="${draft.price}"></div>
          <span class="hint">In rupees. Converted automatically for other countries.</span>
        </div>
        <div class="field">
          <label for="sortOrder">Display order</label>
          <input id="sortOrder" data-field="sortOrder" type="number" min="0" step="1" value="${draft.sortOrder}">
          <span class="hint">Lower numbers show first.</span>
        </div>
        <div class="field">
          <span class="label">Visibility</span>
          <label class="check"><input type="checkbox" data-field="published" ${draft.published ? 'checked' : ''}> Show on website</label>
        </div>
      </div>
    </section>

    <section class="panel">
      <h2>Look</h2>
      <div class="grid">
        <div class="field">
          <span class="label">Icon</span>
          <div class="icons">${catalog.icons.map((name) => html`
            <button class="icon-pick" type="button" data-act="icon" data-value="${name}" aria-pressed="${draft.icon === name}" aria-label="${name}">${icon(name)}</button>`)}</div>
        </div>
        <div class="field">
          <span class="label">Colour</span>
          <div class="swatches">${catalog.colours.map((c) => html`
            <button class="swatch" type="button" data-act="hue" data-value="${c.hue}" aria-pressed="${draft.hue === c.hue}" aria-label="${c.label}" style="background:oklch(0.7 0.15 ${c.hue})"></button>`)}</div>
        </div>
      </div>
      <div class="preview" style="${tint(draft.hue)}">
        ${icon(draft.icon)}
        <div><strong data-preview="name">${draft.name || 'Profile name'}</strong><span data-preview="tagline">${draft.tagline || 'Tagline'}</span></div>
      </div>
    </section>

    <div class="section-head">
      <h2>Sub-profiles (${draft.subs.length})</h2>
      <div class="row">
        <button class="btn small ghost" type="button" data-act="expand-all">Expand all</button>
        <button class="btn small ghost" type="button" data-act="collapse-all">Collapse all</button>
      </div>
    </div>
    <div class="subs">${draft.subs.map(sub)}</div>
    <button class="btn" type="button" data-act="add-sub">+ Add sub-profile</button>

    <datalist id="test-options">${catalog.tests.map((t) => html`<option value="${t.name}"></option>`)}</datalist>

    <div class="savebar">
      <p class="summary" data-summary>${summary()}</p>
      <div class="row">
        ${confirmDiscard
          ? html`<span class="summary">Discard changes?</span>
                 <button class="btn" type="button" data-act="keep-editing">Keep editing</button>
                 <button class="btn danger solid" type="button" data-act="discard">Discard</button>`
          : html`<button class="btn" type="button" data-act="close">Cancel</button>
                 <button class="btn primary" type="button" data-act="save" ${saving ? 'disabled' : ''}>${saving ? 'Saving…' : isNew ? 'Create profile' : 'Save changes'}</button>`}
      </div>
    </div>`);

  const refreshSummary = () => { el.querySelector('[data-summary]').innerHTML = summary().toString(); };
  const markDirty = () => { dirty = true; };

  function addTest(i, input) {
    const value = input.value.trim();
    if (!value) return;
    const test = byName.get(value.toLowerCase()) || tests.get(value);
    if (!test) return toast('Pick a test from the list');
    const s = draft.subs[i];
    if (s.tests.includes(test.id)) {
      input.value = '';
      return toast(`${test.name} is already in this sub-profile`);
    }
    s.tests.push(test.id);
    markDirty();
    update(`#test-add-${i}`);
  }

  function validate() {
    if (!draft.name.trim()) return 'Enter a profile name.';
    if (!ID_PATTERN.test(draft.id)) return 'Profile ID can only use lowercase letters, numbers and dashes.';
    if (draft.price === '' || !(Number(draft.price) >= 0)) return 'Enter a price.';
    if (!uniqueTests().length) return 'Add at least one test.';
    return '';
  }

  async function save() {
    error = validate();
    if (error) {
      update();
      return el.querySelector('.alert')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    const payload = {
      id: draft.id, name: draft.name.trim(), tag: draft.tag.trim(), category: draft.category,
      tagline: draft.tagline.trim(), price: Math.round(Number(draft.price)), icon: draft.icon, hue: draft.hue,
      sortOrder: Math.max(0, Math.round(Number(draft.sortOrder) || 0)), published: draft.published,
      subs: draft.subs
        .filter((s) => s.name.trim() || s.description.trim() || s.tests.length)
        .map((s) => ({ name: s.name.trim() || 'Untitled sub-profile', description: s.description.trim(), tests: s.tests })),
    };
    saving = true;
    update();
    try {
      await onSave(payload, isNew);
      dirty = false;
    } catch (err) {
      saving = false;
      error = err.message;
      update();
      el.querySelector('.alert')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  el.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const i = Number(btn.dataset.sub);
    switch (btn.dataset.act) {
      case 'close':
        if (dirty) { confirmDiscard = true; update(); } else onClose();
        break;
      case 'keep-editing': confirmDiscard = false; update(); break;
      case 'discard': dirty = false; onClose(); break;
      case 'save': save(); break;
      case 'icon': draft.icon = btn.dataset.value; markDirty(); update(); break;
      case 'hue': draft.hue = Number(btn.dataset.value); markDirty(); update(); break;
      case 'toggle': draft.subs[i].open = !draft.subs[i].open; update(); break;
      case 'expand-all': draft.subs.forEach((s) => { s.open = true; }); update(); break;
      case 'collapse-all': draft.subs.forEach((s) => { s.open = false; }); update(); break;
      case 'add-sub':
        draft.subs.push(newSub());
        markDirty();
        update(`#sub-name-${draft.subs.length - 1}`);
        break;
      case 'remove-sub':
        draft.subs.splice(i, 1);
        if (!draft.subs.length) draft.subs.push(newSub());
        markDirty();
        update();
        break;
      case 'remove-test':
        draft.subs[i].tests.splice(Number(btn.dataset.test), 1);
        markDirty();
        update(`#test-add-${i}`);
        break;
    }
  });

  el.addEventListener('input', (e) => {
    const t = e.target;
    const field = t.dataset.field;
    if (!field) return;
    const i = Number(t.dataset.sub);
    if (field === 'test-add') {
      // Picking from the suggestion list fills in an exact test name.
      if (byName.has(t.value.trim().toLowerCase())) addTest(i, t);
      return;
    }
    markDirty();
    if (field === 'published') draft.published = t.checked;
    else if (field === 'sub-name') {
      draft.subs[i].name = t.value;
      el.querySelector(`[data-sub-title="${i}"]`).textContent = t.value || 'Untitled sub-profile';
    } else if (field === 'sub-desc') draft.subs[i].description = t.value;
    else if (field === 'id') { draft.id = t.value; idTouched = true; }
    else draft[field] = t.value;

    if (field === 'name') {
      el.querySelector('[data-preview="name"]').textContent = t.value || 'Profile name';
      if (isNew && !idTouched) {
        draft.id = slugify(t.value);
        el.querySelector('#id').value = draft.id;
      }
    }
    if (field === 'tagline') el.querySelector('[data-preview="tagline"]').textContent = t.value || 'Tagline';
    if (field === 'price') refreshSummary();
  });

  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.dataset.field === 'test-add') {
      e.preventDefault();
      addTest(Number(e.target.dataset.sub), e.target);
    }
  });

  window.addEventListener('beforeunload', (e) => {
    if (dirty && el.isConnected) e.preventDefault();
  });

  update(isNew ? '#name' : undefined);
  return el;
}
