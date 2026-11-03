// Create or edit a lab test: details, price, the parameters it measures and
// (optionally) calculated parameters worked out from other results.
import { html } from '../html.js';
import { appBar, formatPrice, icon, nameList, plural, toast, view } from '../ui.js';
import { testUsage } from './test-list.js';

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const slugify = (s) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');

export function TestEditorView({ test, catalog, subProfiles, profiles, onSave, onDelete, onClose }) {
  const isNew = !test;
  const usedBy = isNew ? [] : testUsage(test.id, subProfiles, profiles);
  const draft = isNew
    ? {
        id: '',
        name: '',
        short: '',
        categories: [],
        price: '',
        mrp: '',
        tat: '24 hrs',
        fasting: false,
        sample: 'Blood',
        aka: '',
        about: '',
        parameters: [],
        calculated: [],
        sortOrder: catalog.tests.reduce((max, t) => Math.max(max, t.sortOrder + 1), 0),
        published: true,
      }
    : {
        ...test,
        categories: [...test.cat],
        price: String(test.price),
        mrp: String(test.mrp),
        parameters: [...test.parameters],
        calculated: [...test.calculated],
      };
  let idTouched = !isNew;
  let dirty = false;
  let saving = false;
  let confirmDiscard = false;
  let confirmDelete = false;
  let deleting = false;
  let error = '';

  const summary = () => {
    const price = Number(draft.price);
    const mrp = Number(draft.mrp);
    const off = mrp > 0 && price >= 0 && price < mrp ? Math.round((1 - price / mrp) * 100) : 0;
    return html`
      ${draft.price !== '' && html`<span class="now">${formatPrice(price)}</span>`}
      ${draft.mrp !== '' && mrp > price && html`<s>${formatPrice(mrp)}</s>`}${off > 0 && html`<span class="pill off">${off}% off</span>`}
      <span><b>${draft.calculated.length ? plural(draft.calculated.length, 'calculated parameter') : 'No calculated parameters'}</b></span>
      ${draft.mrp !== '' && draft.price !== '' && mrp < price && html`<span class="warn">MRP is below the price</span>`}`;
  };

  const { el, update } = view(
    () => html`
    ${appBar(html`<button class="btn small" type="button" data-act="close">${icon('arrow-left')}All tests</button>`)}
    <main class="page narrow">
    <div class="pagehead">
      <div>
        <div class="eyebrow">${isNew ? 'New test' : 'Edit test'}</div>
        <h1>${isNew ? 'Add a lab test' : draft.name || 'Untitled test'}</h1>
        <p class="subtitle">Once saved, it can be added to sub-profiles and profiles, and booked on its own.</p>
      </div>
    </div>
    ${error && html`<div class="alert" role="alert">${icon('circle-alert')}${error}</div>`}
    ${
      usedBy.length > 0 &&
      html`<div class="note">${icon('info')}<span>Used in <b>${usedBy.join(', ')}</b>. Changes here show everywhere it’s used.</span></div>`
    }

    <section class="panel">
      <div class="panel-head"><span class="num">1</span><div><h2>Details</h2><p>How the test appears on the website.</p></div></div>
      <div class="grid">
        <div class="field">
          <label for="name">Test name</label>
          <input id="name" data-field="name" value="${draft.name}" placeholder="e.g. Vitamin D (25-OH)" maxlength="120" autocomplete="off">
        </div>
        <div class="field">
          <label for="id">Test ID</label>
          <input id="id" data-field="id" value="${draft.id}" placeholder="e.g. vitd" autocomplete="off" ${isNew ? '' : 'disabled'}>
          <span class="hint">${isNew ? 'Used in links and the cart. Can’t be changed later.' : 'Can’t be changed.'}</span>
        </div>
        <div class="field">
          <label for="short">Short name <span class="hint">(optional)</span></label>
          <input id="short" data-field="short" value="${draft.short}" placeholder="e.g. Vitamin D" maxlength="60" autocomplete="off">
          <span class="hint">Used where space is tight. Defaults to the test name.</span>
        </div>
        <div class="field">
          <label for="sample">Sample</label>
          <select id="sample" data-field="sample">
            ${catalog.samples.map((s) => html`<option value="${s}" ${s === draft.sample ? 'selected' : ''}>${s}</option>`)}
          </select>
        </div>
        <div class="field">
          <label for="tat">Report time</label>
          <input id="tat" data-field="tat" value="${draft.tat}" placeholder="e.g. 24 hrs" maxlength="30" autocomplete="off">
        </div>
        <div class="field">
          <span class="label">Preparation</span>
          <label class="switch"><input type="checkbox" data-field="fasting" ${draft.fasting ? 'checked' : ''}><span class="track"></span>Fasting needed</label>
        </div>
        <div class="field full">
          <span class="label">Categories</span>
          <div class="toggles">${catalog.testCategories.map(
            (c) =>
              html`<button type="button" class="toggle-chip" data-act="category" data-value="${c.id}" aria-pressed="${draft.categories.includes(c.id)}">${c.label}</button>`,
          )}</div>
          <span class="hint">The filters it appears under on the Tests page. The first one sets its icon and colour.</span>
        </div>
        <div class="field">
          <span class="label">Visibility</span>
          <label class="switch"><input type="checkbox" data-field="published" ${draft.published ? 'checked' : ''}><span class="track"></span>Show on website</label>
        </div>
        <div class="field">
          <label for="sortOrder">Display order</label>
          <input id="sortOrder" data-field="sortOrder" type="number" min="0" step="1" value="${draft.sortOrder}">
          <span class="hint">Lower numbers show first.</span>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head"><span class="num">2</span><div><h2>Price</h2><p>In rupees. Converted automatically for other countries.</p></div></div>
      <div class="grid">
        <div class="field">
          <label for="price">Price</label>
          <div class="prefix"><span>₹</span><input id="price" data-field="price" type="number" min="0" step="1" inputmode="numeric" value="${draft.price}"></div>
        </div>
        <div class="field">
          <label for="mrp">MRP</label>
          <div class="prefix"><span>₹</span><input id="mrp" data-field="mrp" type="number" min="0" step="1" inputmode="numeric" value="${draft.mrp}"></div>
          <span class="hint">Shown struck through, with the discount.</span>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head"><span class="num">3</span><div><h2>Calculated parameters (${draft.calculated.length}) <span class="hint">optional</span></h2><p>Worked out from other results rather than measured, e.g. LDL / HDL Ratio. Many tests have none.</p></div></div>
      <div class="field">${nameList('calculated', draft.calculated, 'Add a calculated parameter, e.g. LDL / HDL Ratio', 'None — that’s fine for most tests.')}</div>
    </section>

    <section class="panel">
      <div class="panel-head"><span class="num">4</span><div><h2>About this test</h2><p>Shown on the test’s page.</p></div></div>
      <div class="grid">
        <div class="field full">
          <label for="aka">Also known as <span class="hint">(optional)</span></label>
          <input id="aka" data-field="aka" value="${draft.aka}" placeholder="e.g. 25-Hydroxy Vitamin D, Calcidiol" maxlength="200" autocomplete="off">
        </div>
        <div class="field full">
          <label for="about">Description <span class="hint">(optional)</span></label>
          <textarea id="about" data-field="about" maxlength="800" placeholder="What it checks and why it matters, in plain words.">${draft.about}</textarea>
        </div>
      </div>
    </section>

    ${
      !isNew &&
      html`
      <section class="panel danger-zone">
        <div>
          <h2>Delete test</h2>
          <p>${usedBy.length ? html`Remove it from ${usedBy.join(', ')} first. Or switch off “Show on website” to hide it.` : 'It isn’t used anywhere. This can’t be undone.'}</p>
        </div>
        <div class="row">
          ${
            confirmDelete
              ? html`<button class="btn" type="button" data-act="cancel-delete" ${deleting ? 'disabled' : ''}>Keep</button>
                   <button class="btn danger solid" type="button" data-act="delete" ${deleting ? 'disabled' : ''}>${icon('trash-2')}${deleting ? 'Deleting…' : 'Yes, delete'}</button>`
              : html`<button class="btn danger" type="button" data-act="ask-delete" ${usedBy.length ? 'disabled' : ''}>${icon('trash-2')}Delete test</button>`
          }
        </div>
      </section>`
    }
    </main>

    <div class="savebar"><div class="savebar-in">
      <p class="summary" data-summary>${summary()}</p>
      <div class="row">
        ${
          confirmDiscard
            ? html`<span class="warn">Discard changes?</span>
                 <button class="btn" type="button" data-act="keep-editing">Keep editing</button>
                 <button class="btn danger solid" type="button" data-act="discard">Discard</button>`
            : html`<button class="btn" type="button" data-act="close">Cancel</button>
                 <button class="btn primary" type="button" data-act="save" ${saving ? 'disabled' : ''}>${icon('check')}${saving ? 'Saving…' : isNew ? 'Add test' : 'Save changes'}</button>`
        }
      </div>
    </div></div>`,
  );

  const refreshSummary = () => {
    el.querySelector('[data-summary]').innerHTML = summary().toString();
  };

  // Adds one or more names (comma or new-line separated) to the parameters or calculated list.
  function addNames(key) {
    const input = el.querySelector(`#name-add-${key}`);
    const names = input.value
      .split(/[\n,]/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (!names.length) return;
    const other = key === 'parameters' ? draft.calculated : draft.parameters;
    let skipped = 0;
    for (const n of names) {
      if (draft[key].includes(n) || other.includes(n)) skipped++;
      else draft[key].push(n);
    }
    if (skipped) toast(skipped === names.length ? 'Already added' : `${skipped} already added, skipped`);
    dirty = true;
    update(`#name-add-${key}`);
  }

  function validate() {
    if (!draft.name.trim()) return 'Enter a test name.';
    if (!ID_PATTERN.test(draft.id)) return 'Test ID can only use lowercase letters, numbers and dashes.';
    if (!draft.categories.length) return 'Pick at least one category.';
    if (draft.price === '' || !(Number(draft.price) >= 0)) return 'Enter a price.';
    if (draft.mrp === '' || !(Number(draft.mrp) >= 0)) return 'Enter the MRP.';
    if (Number(draft.mrp) < Number(draft.price)) return 'MRP can’t be lower than the price.';
    if (!draft.tat.trim()) return 'Enter the report time.';
    return '';
  }

  async function save() {
    error = validate();
    if (error) {
      update();
      return el.querySelector('.alert')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    const payload = {
      id: draft.id,
      name: draft.name.trim(),
      short: draft.short.trim(),
      categories: draft.categories,
      price: Math.round(Number(draft.price)),
      mrp: Math.round(Number(draft.mrp)),
      tat: draft.tat.trim(),
      fasting: draft.fasting,
      sample: draft.sample,
      aka: draft.aka.trim(),
      about: draft.about.trim(),
      // Measured parameters aren't edited here: keep the saved list; a new test counts as its own parameter.
      parameters: draft.parameters.length ? draft.parameters : [draft.name.trim()],
      calculated: draft.calculated,
      sortOrder: Math.max(0, Math.round(Number(draft.sortOrder) || 0)),
      published: draft.published,
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

  async function remove() {
    deleting = true;
    update();
    if (await onDelete(test.id)) {
      dirty = false;
      return;
    }
    deleting = false;
    confirmDelete = false;
    update();
  }

  el.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    switch (btn.dataset.act) {
      case 'home':
      case 'close':
        if (dirty) {
          confirmDiscard = true;
          update();
        } else onClose();
        break;
      case 'keep-editing':
        confirmDiscard = false;
        update();
        break;
      case 'discard':
        dirty = false;
        onClose();
        break;
      case 'save':
        save();
        break;
      case 'ask-delete':
        confirmDelete = true;
        update();
        break;
      case 'cancel-delete':
        confirmDelete = false;
        update();
        break;
      case 'delete':
        remove();
        break;
      case 'category': {
        const id = btn.dataset.value;
        draft.categories = draft.categories.includes(id)
          ? draft.categories.filter((c) => c !== id)
          : [...draft.categories, id];
        dirty = true;
        update();
        break;
      }
      case 'add-name':
        addNames(btn.dataset.list);
        break;
      case 'remove-name':
        draft[btn.dataset.list].splice(Number(btn.dataset.i), 1);
        dirty = true;
        update(`#name-add-${btn.dataset.list}`);
        break;
    }
  });

  el.addEventListener('input', (e) => {
    const t = e.target;
    const field = t.dataset.field;
    if (!field || field === 'name-add') return;
    dirty = true;
    if (field === 'fasting' || field === 'published') draft[field] = t.checked;
    else if (field === 'id') {
      draft.id = t.value;
      idTouched = true;
    } else draft[field] = t.value;
    if (field === 'name' && isNew && !idTouched) {
      draft.id = slugify(t.value);
      el.querySelector('#id').value = draft.id;
    }
    if (field === 'price' || field === 'mrp') refreshSummary();
  });

  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.dataset.field === 'name-add') {
      e.preventDefault();
      addNames(e.target.dataset.list);
    }
  });

  // Pasting a list adds every line at once.
  el.addEventListener('paste', (e) => {
    const t = e.target;
    if (t.dataset.field !== 'name-add') return;
    const text = e.clipboardData?.getData('text') || '';
    if (!/[\n,]/.test(text)) return;
    e.preventDefault();
    t.value = text;
    addNames(t.dataset.list);
  });

  window.addEventListener('beforeunload', (e) => {
    if (dirty && el.isConnected) e.preventDefault();
  });

  update(isNew ? '#name' : undefined);
  return el;
}
