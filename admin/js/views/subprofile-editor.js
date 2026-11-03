// Create or edit a reusable sub-profile: a name and the tests it contains.
import { html } from '../html.js';
import { appBar, formatPrices, icon, plural, sumPrices, testOptions, testPicker, toast, view } from '../ui.js';

export function SubProfileEditorView({ sub, profiles, catalog, onSave, onDelete, onClose }) {
  const isNew = !sub;
  const tests = new Map(catalog.tests.map((t) => [t.id, t]));
  const byName = new Map(catalog.tests.map((t) => [t.name.toLowerCase(), t]));
  const profileName = new Map(profiles.map((p) => [p.id, p.name]));
  const usedBy = isNew ? [] : sub.usedBy.map((id) => profileName.get(id) || id);

  const draft = isNew
    ? { name: '', description: '', tests: [] }
    : { name: sub.name, description: sub.description, tests: [...sub.tests] };
  let dirty = false;
  let saving = false;
  let confirmDiscard = false;
  let confirmDelete = false;
  let deleting = false;
  let error = '';

  const summary = () => {
    const params = draft.tests.reduce((sum, id) => sum + (tests.get(id)?.params || 0), 0);
    return html`<span><b>${plural(draft.tests.length, 'test')}</b> · ${plural(params, 'parameter')}</span>
      ${draft.tests.length > 0 && html`<span>Tests total <b>${formatPrices(sumPrices(draft.tests, tests))}</b></span>`}`;
  };

  const { el, update } = view(
    () => html`
    ${appBar(html`<button class="btn small" type="button" data-act="close">${icon('arrow-left')}All sub-profiles</button>`)}
    <main class="page narrow">
    <div class="pagehead">
      <div>
        <div class="eyebrow">${isNew ? 'New sub-profile' : 'Edit sub-profile'}</div>
        <h1>${isNew ? 'Create a sub-profile' : draft.name || 'Untitled sub-profile'}</h1>
        <p class="subtitle">A named group of tests, e.g. “Lipid Profile”. Add it to any number of profiles.</p>
      </div>
    </div>
    ${error && html`<div class="alert" role="alert">${icon('circle-alert')}${error}</div>`}
    ${
      usedBy.length > 0 &&
      html`<div class="note">${icon('info')}<span>Used in <b>${usedBy.join(', ')}</b>. Changes here update ${usedBy.length === 1 ? 'that profile' : `all ${usedBy.length} of them`} on the website.</span></div>`
    }

    <section class="panel">
      <div class="panel-head"><span class="num">1</span><div><h2>Details</h2><p>Shown as a group under “What’s included” on the website.</p></div></div>
      <div class="grid">
        <div class="field">
          <label for="name">Sub-profile name</label>
          <input id="name" data-field="name" value="${draft.name}" placeholder="e.g. Lipid Profile" maxlength="80" autocomplete="off">
        </div>
        <div class="field">
          <label for="description">Description <span class="hint">(optional)</span></label>
          <input id="description" data-field="description" value="${draft.description}" maxlength="300" autocomplete="off">
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head"><span class="num">2</span><div><h2>Tests</h2><p>Add one or more tests. Start typing to search the catalogue.</p></div></div>
      <div class="field">${testPicker('sub', draft.tests, tests)}</div>
    </section>

    ${
      !isNew &&
      html`
      <section class="panel danger-zone">
        <div>
          <h2>Delete sub-profile</h2>
          <p>${usedBy.length ? html`Remove it from ${usedBy.join(', ')} first.` : 'It isn’t used by any profile. This can’t be undone.'}</p>
        </div>
        <div class="row">
          ${
            confirmDelete
              ? html`<button class="btn" type="button" data-act="cancel-delete" ${deleting ? 'disabled' : ''}>Keep</button>
                   <button class="btn danger solid" type="button" data-act="delete" ${deleting ? 'disabled' : ''}>${icon('trash-2')}${deleting ? 'Deleting…' : 'Yes, delete'}</button>`
              : html`<button class="btn danger" type="button" data-act="ask-delete" ${usedBy.length ? 'disabled' : ''}>${icon('trash-2')}Delete sub-profile</button>`
          }
        </div>
      </section>`
    }
    </main>

    ${testOptions(catalog)}

    <div class="savebar"><div class="savebar-in">
      <p class="summary" data-summary>${summary()}</p>
      <div class="row">
        ${
          confirmDiscard
            ? html`<span class="warn">Discard changes?</span>
                 <button class="btn" type="button" data-act="keep-editing">Keep editing</button>
                 <button class="btn danger solid" type="button" data-act="discard">Discard</button>`
            : html`<button class="btn" type="button" data-act="close">Cancel</button>
                 <button class="btn primary" type="button" data-act="save" ${saving ? 'disabled' : ''}>${icon('check')}${saving ? 'Saving…' : isNew ? 'Create sub-profile' : 'Save changes'}</button>`
        }
      </div>
    </div></div>`,
  );

  function addTest(input) {
    const value = input.value.trim();
    if (!value) return;
    const test = byName.get(value.toLowerCase()) || tests.get(value);
    if (!test) return toast('Pick a test from the list');
    if (draft.tests.includes(test.id)) {
      input.value = '';
      return toast(`${test.name} is already in this sub-profile`);
    }
    draft.tests.push(test.id);
    dirty = true;
    update('#test-add-sub');
  }

  async function save() {
    error = !draft.name.trim() ? 'Enter a sub-profile name.' : !draft.tests.length ? 'Add at least one test.' : '';
    if (error) {
      update();
      return el.querySelector('.alert')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    saving = true;
    update();
    try {
      await onSave(
        { name: draft.name.trim(), description: draft.description.trim(), tests: draft.tests },
        isNew ? null : sub.id,
      );
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
    if (await onDelete(sub.id)) {
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
      case 'remove-test':
        draft.tests.splice(Number(btn.dataset.test), 1);
        dirty = true;
        update('#test-add-sub');
        break;
    }
  });

  el.addEventListener('input', (e) => {
    const t = e.target;
    const field = t.dataset.field;
    if (!field) return;
    if (field === 'test-add') {
      // Picking from the suggestion list fills in an exact test name.
      if (byName.has(t.value.trim().toLowerCase())) addTest(t);
      return;
    }
    dirty = true;
    draft[field] = t.value;
  });

  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.dataset.field === 'test-add') {
      e.preventDefault();
      addTest(e.target);
    }
  });

  window.addEventListener('beforeunload', (e) => {
    if (dirty && el.isConnected) e.preventDefault();
  });

  update(isNew ? '#name' : undefined);
  return el;
}
