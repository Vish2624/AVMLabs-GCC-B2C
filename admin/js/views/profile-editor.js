// Create or edit a profile: details, look, the sub-profiles it's built from, and any extra tests.
import { html } from '../html.js';
import {
  appBar,
  cardBg,
  COUNTRIES,
  formatMoney,
  formatPrices,
  icon,
  ink,
  plural,
  priceInputs,
  readPrices,
  sumPrices,
  attachTestSearch,
  testPicker,
  toast,
  view,
} from '../ui.js';

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// A box with one item per line, as the list the API takes. Lines, not commas: reasons contain commas.
const toLines = (s) =>
  s
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const slugify = (s) =>
  s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');

export function ProfileEditorView({
  profile,
  catalog,
  subProfiles,
  nextSortOrder,
  onSave,
  onDelete,
  onClose,
  onManageSubs,
}) {
  const isNew = !profile;
  const tests = new Map(catalog.tests.map((t) => [t.id, t]));
  const byName = new Map(catalog.tests.map((t) => [t.name.toLowerCase(), t]));
  const library = new Map(subProfiles.map((s) => [s.id, s]));

  const draft = isNew
    ? {
        id: '',
        code: '',
        shortName: '',
        name: '',
        tag: '',
        category: catalog.categories[0].id,
        tagline: '',
        ideal: '',
        benefits: '',
        prices: Object.fromEntries(COUNTRIES.map((c) => [c.code, ''])),
        icon: 'layers',
        hue: catalog.colours[0].hue,
        sortOrder: nextSortOrder,
        published: true,
        inReels: true,
        subProfiles: [],
        tests: [],
      }
    : {
        ...profile,
        inReels: profile.inReels !== false,
        code: profile.code || '',
        shortName: profile.shortName || '',
        ideal: (profile.ideal || []).join('\n'),
        benefits: (profile.benefits || []).join('\n'),
        prices: Object.fromEntries(COUNTRIES.map((c) => [c.code, String(profile.prices?.[c.code] ?? '')])),
        subProfiles: profile.subProfiles.filter((id) => library.has(id)),
        tests: [...profile.tests],
      };
  let idTouched = !isNew;
  let dirty = false;
  let saving = false;
  let confirmDiscard = false;
  let confirmDelete = false;
  let deleting = false;
  let error = '';

  const chosen = () => draft.subProfiles.map((id) => library.get(id)).filter(Boolean);
  const uniqueTests = () => [...new Set([...chosen().flatMap((s) => s.tests), ...draft.tests])];
  const testNames = (ids) => ids.map((id) => tests.get(id)?.name || id).join(', ');

  const summary = () => {
    const ids = uniqueTests();
    const params = ids.reduce((sum, id) => sum + (tests.get(id)?.params || 0), 0);
    const total = sumPrices(ids, tests);
    const above = COUNTRIES.filter((c) => draft.prices[c.code] !== '' && Number(draft.prices[c.code]) > total[c.code]);
    return html`
      ${COUNTRIES.filter((c) => draft.prices[c.code] !== '').map((c) => html`<span class="now">${formatMoney(c.code, draft.prices[c.code])}</span>`)}
      <span><b>${plural(ids.length, 'test')}</b> · ${plural(params, 'parameter')}</span>
      ${above.length > 0 && html`<span class="warn">Above the tests’ total in ${above.map((c) => c.name).join(', ')}</span>`}`;
  };

  // The tests' total per country, shown beside the price boxes.
  const totalHint = () => {
    const ids = uniqueTests();
    return ids.length
      ? html`Tests booked separately: ${formatPrices(sumPrices(ids, tests))}`
      : 'Add tests to see what they cost separately.';
  };

  // A chosen sub-profile: its tests, what they cost, and controls to reorder or remove it.
  const chosenRow = (sp, i, n) => html`
    <div class="pick">
      <div class="pick-main">
        <span class="pick-name">${sp.name}</span>
        <span class="pick-tests">${testNames(sp.tests)}</span>
      </div>
      <span class="count">${plural(sp.tests.length, 'test')} · ${formatPrices(sumPrices(sp.tests, tests))}</span>
      <div class="pick-actions">
        <button class="btn small icon-only" type="button" data-act="sub-up" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Move ${sp.name} up">${icon('arrow-up')}</button>
        <button class="btn small icon-only" type="button" data-act="sub-down" data-i="${i}" ${i === n - 1 ? 'disabled' : ''} aria-label="Move ${sp.name} down">${icon('arrow-down')}</button>
        <button class="btn small icon-only danger" type="button" data-act="sub-remove" data-i="${i}" aria-label="Remove ${sp.name}">${icon('x')}</button>
      </div>
    </div>`;

  // Sub-profiles not yet in this profile, for the "Add" menu.
  const available = () => subProfiles.filter((sp) => !draft.subProfiles.includes(sp.id));

  const { el, update } = view(
    () => html`
    ${appBar(html`<button class="btn small" type="button" data-act="close">${icon('arrow-left')}All profiles</button>`)}
    <main class="page narrow">
    <div class="pagehead">
      <div>
        <div class="eyebrow">${isNew ? 'New profile' : 'Edit profile'}</div>
        <h1>${isNew ? 'Create a health profile' : draft.name}</h1>
        <p class="subtitle">Build it from sub-profiles, then add any extra tests. Then set its price for each country.</p>
      </div>
    </div>
    ${error && html`<div class="alert" role="alert">${icon('circle-alert')}${error}</div>`}

    <section class="panel">
      <div class="panel-head"><span class="num">1</span><div><h2>Details</h2><p>What customers see on the profile card.</p></div></div>
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
          <label for="code">Lab code</label>
          <input id="code" data-field="code" value="${draft.code}" placeholder="e.g. EW_PRO" maxlength="40" autocomplete="off">
          <span class="hint">For the lab only. Not shown on the website.</span>
        </div>
        <div class="field">
          <label for="shortName">Lab short name</label>
          <input id="shortName" data-field="shortName" value="${draft.shortName}" placeholder="e.g. EW_PRO" maxlength="40" autocomplete="off">
          <span class="hint">For the lab only. Not shown on the website.</span>
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
        <div class="field full">
          <span class="label">Price per country</span>
          ${priceInputs(draft.prices)}
          <span class="hint"><span data-total>${totalHint()}</span> <button class="linkish" type="button" data-act="fill-prices">Use these</button></span>
        </div>
        <div class="field">
          <label for="sortOrder">Display order</label>
          <input id="sortOrder" data-field="sortOrder" type="number" min="0" step="1" value="${draft.sortOrder}">
          <span class="hint">Lower numbers show first.</span>
        </div>
        <div class="field">
          <span class="label">Visibility</span>
          <label class="switch"><input type="checkbox" data-field="published" ${draft.published ? 'checked' : ''}><span class="track"></span>Show on website</label>
          <label class="switch"><input type="checkbox" data-field="inReels" ${draft.inReels ? 'checked' : ''}><span class="track"></span>Show in reels</label>
          <span class="hint">Off: only on the Profiles page, not in the reels or the home reel row.</span>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head"><span class="num">2</span><div><h2>Look</h2><p>Icon and colour of the profile tile.</p></div></div>
      <div class="grid">
        <div class="field">
          <span class="label">Icon</span>
          <div class="icons">${catalog.icons.map(
            (name) => html`
            <button class="icon-pick" type="button" data-act="icon" data-value="${name}" aria-pressed="${draft.icon === name}" aria-label="${name}">${icon(name)}</button>`,
          )}</div>
        </div>
        <div class="field">
          <span class="label">Colour</span>
          <div class="swatches">${catalog.colours.map(
            (c) => html`
            <button class="swatch" type="button" data-act="hue" data-value="${c.hue}" aria-pressed="${draft.hue === c.hue}" aria-label="${c.label}" style="background:oklch(0.7 0.15 ${c.hue})"></button>`,
          )}</div>
        </div>
      </div>
      <div class="preview" style="${cardBg(draft.hue)}">
        <span class="preview-icon" style="${ink(draft.hue)}">${icon(draft.icon)}</span>
        <div><strong data-preview="name">${draft.name || 'Profile name'}</strong><span data-preview="tagline">${draft.tagline || 'Tagline'}</span></div>
        <span class="pill">Preview</span>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head"><span class="num">3</span><div><h2>Sub-profiles (${draft.subProfiles.length})</h2><p>Groups of tests from the Sub-profiles tab, shown in this order.</p></div></div>
      ${
        draft.subProfiles.length
          ? html`<div class="picks">${chosen().map((sp, i, all) => chosenRow(sp, i, all.length))}</div>`
          : html`<p class="empty-note">No sub-profiles yet.</p>`
      }
      <div class="add-row">
        <select id="sub-add" data-field="sub-add" aria-label="Add a sub-profile">
          <option value="">${available().length ? '+ Add a sub-profile…' : 'All sub-profiles are added'}</option>
          ${available().map((sp) => html`<option value="${sp.id}">${sp.name} — ${testNames(sp.tests)}</option>`)}
        </select>
        <button class="btn link" type="button" data-act="manage-subs">${icon('external-link')}Create or edit sub-profiles</button>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head"><span class="num">4</span><div><h2>Additional tests (${draft.tests.length})</h2><p>Tests on their own, outside any sub-profile. Shown as one more group.</p></div></div>
      <div class="field">${testPicker('extra', draft.tests, tests, 'None — optional.')}</div>
    </section>

    <section class="panel">
      <div class="panel-head"><span class="num">5</span><div><h2>Reel text</h2><p>What customers read on this profile’s reel. Leave a box empty to hide that part.</p></div></div>
      <div class="grid">
        <div class="field full">
          <label for="benefits">Why take this profile</label>
          <textarea id="benefits" data-field="benefits" rows="4" placeholder="One reason per line, e.g.&#10;Full T3, T4 & TSH with antibody check&#10;Helps spot autoimmune thyroid early">${draft.benefits}</textarea>
          <span class="hint">One reason per line, up to 6. Keep each under 120 characters.</span>
        </div>
        <div class="field full">
          <label for="ideal">Ideal for</label>
          <textarea id="ideal" data-field="ideal" rows="4" placeholder="One per line, e.g.&#10;Weight changes&#10;Family history">${draft.ideal}</textarea>
          <span class="hint">One per line, up to 6. Keep each under 40 characters.</span>
        </div>
      </div>
    </section>
    ${
      !isNew &&
      html`
      <section class="panel danger-zone">
        <div>
          <h2>Delete profile</h2>
          <p>Removes “${profile.name}” from the website. This can’t be undone.</p>
        </div>
        <div class="row">
          ${
            confirmDelete
              ? html`<button class="btn" type="button" data-act="cancel-delete" ${deleting ? 'disabled' : ''}>Keep</button>
                   <button class="btn danger solid" type="button" data-act="delete" ${deleting ? 'disabled' : ''}>${icon('trash-2')}${deleting ? 'Deleting…' : 'Yes, delete'}</button>`
              : html`<button class="btn danger" type="button" data-act="ask-delete">${icon('trash-2')}Delete profile</button>`
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
                 <button class="btn primary" type="button" data-act="save" ${saving ? 'disabled' : ''}>${icon('check')}${saving ? 'Saving…' : isNew ? 'Create profile' : 'Save changes'}</button>`
        }
      </div>
    </div></div>`,
  );

  const refreshSummary = () => {
    el.querySelector('[data-summary]').innerHTML = summary().toString();
  };
  const markDirty = () => {
    dirty = true;
  };

  function addTest(input) {
    const value = input.value.trim();
    if (!value) return;
    const test = byName.get(value.toLowerCase()) || tests.get(value);
    if (!test) return toast('Pick a test from the list');
    input.value = '';
    if (draft.tests.includes(test.id)) return toast(`${test.name} is already added`);
    const inSub = chosen().find((sp) => sp.tests.includes(test.id));
    if (inSub) return toast(`${test.name} is already in ${inSub.name}`);
    draft.tests.push(test.id);
    markDirty();
    update('#test-add-extra');
  }

  function validate() {
    if (!draft.name.trim()) return 'Enter a profile name.';
    if (!ID_PATTERN.test(draft.id)) return 'Profile ID can only use lowercase letters, numbers and dashes.';
    if (!uniqueTests().length) return 'Add at least one sub-profile or test.';
    const { error: priceError } = readPrices(draft.prices);
    if (priceError) return priceError;
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
      code: draft.code.trim(),
      shortName: draft.shortName.trim(),
      name: draft.name.trim(),
      tag: draft.tag.trim(),
      category: draft.category,
      tagline: draft.tagline.trim(),
      ideal: toLines(draft.ideal),
      benefits: toLines(draft.benefits),
      prices: readPrices(draft.prices).prices,
      icon: draft.icon,
      hue: draft.hue,
      sortOrder: Math.max(0, Math.round(Number(draft.sortOrder) || 0)),
      published: draft.published,
      inReels: draft.inReels,
      subProfiles: draft.subProfiles,
      tests: draft.tests,
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
    if (await onDelete(profile.id)) {
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
    const i = Number(btn.dataset.i);
    switch (btn.dataset.act) {
      case 'home': // logo: same as Cancel, so unsaved changes still ask first
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
      case 'fill-prices': {
        const total = sumPrices(uniqueTests(), tests);
        for (const c of COUNTRIES) draft.prices[c.code] = String(total[c.code]);
        markDirty();
        update();
        break;
      }
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
      case 'icon':
        draft.icon = btn.dataset.value;
        markDirty();
        update();
        break;
      case 'hue':
        draft.hue = Number(btn.dataset.value);
        markDirty();
        update();
        break;
      case 'sub-up':
      case 'sub-down': {
        const j = btn.dataset.act === 'sub-up' ? i - 1 : i + 1;
        [draft.subProfiles[i], draft.subProfiles[j]] = [draft.subProfiles[j], draft.subProfiles[i]];
        markDirty();
        update();
        break;
      }
      case 'sub-remove':
        draft.subProfiles.splice(i, 1);
        markDirty();
        update();
        break;
      case 'remove-test':
        draft.tests.splice(Number(btn.dataset.test), 1);
        markDirty();
        update('#test-add-extra');
        break;
      case 'manage-subs':
        if (dirty) {
          confirmDiscard = true;
          update();
        } else onManageSubs();
        break;
    }
  });

  el.addEventListener('input', (e) => {
    const t = e.target;
    const field = t.dataset.field;
    if (!field) return;
    if (field === 'test-add') return; // handled by attachTestSearch
    if (field === 'sub-add') {
      const id = Number(t.value);
      if (library.has(id) && !draft.subProfiles.includes(id)) {
        draft.subProfiles.push(id);
        markDirty();
        update('#sub-add');
      }
      return;
    }
    markDirty();
    if (field === 'published' || field === 'inReels') draft[field] = t.checked;
    else if (field === 'price') draft.prices[t.dataset.country] = t.value;
    else if (field === 'id') {
      draft.id = t.value;
      idTouched = true;
    } else draft[field] = t.value;

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

  attachTestSearch(el, catalog.tests, {
    onPick: addTest,
    statusOf: (test) => {
      if (draft.tests.includes(test.id)) return 'Added';
      const inSub = chosen().find((sp) => sp.tests.includes(test.id));
      return inSub ? `In ${inSub.name}` : '';
    },
  });

  window.addEventListener('beforeunload', (e) => {
    if (dirty && el.isConnected) e.preventDefault();
  });

  update(isNew ? '#name' : undefined);
  return el;
}
