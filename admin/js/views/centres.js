// Centres: the address, Google Maps link and WhatsApp number of each centre, by country. The website shows the
// centres of the visitor's country (home page and footer) and sends WhatsApp messages to that country's number
// (the centre in the visitor's city, else the first one listed for the country).
import { html } from '../html.js';
import { appBar, COUNTRIES, icon, plural, tabs, view } from '../ui.js';

const blank = (country) => ({ country, city: '', address: '', maps: '', whatsapp: '' });
const digits = (s) => s.replace(/[\s+\-()]/g, '');

export function CentresView({ catalog, onSave, onTab, onLogout }) {
  const draft = catalog.centres.map((c) => ({ ...c }));
  const readOnly = catalog.testsReadOnly;
  let dirty = false;
  let saving = false;
  let error = '';

  const row = (c, i) => html`
    <section class="panel centre">
      <div class="panel-head">
        <span class="num">${i + 1}</span>
        <div><h2>${c.city || 'New centre'}</h2><p>${COUNTRIES.find((x) => x.code === c.country)?.name || ''}</p></div>
        <div class="row centre-moves">
          <button class="btn small" type="button" data-act="up" data-i="${i}" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>${icon('arrow-up')}</button>
          <button class="btn small" type="button" data-act="down" data-i="${i}" aria-label="Move down" ${i === draft.length - 1 ? 'disabled' : ''}>${icon('arrow-down')}</button>
          <button class="btn small danger" type="button" data-act="remove" data-i="${i}" ${draft.length < 2 ? 'disabled' : ''}>${icon('trash-2')}Remove</button>
        </div>
      </div>
      <div class="grid">
        <div class="field">
          <label for="country-${i}">Country</label>
          <select id="country-${i}" data-field="country" data-i="${i}">
            ${COUNTRIES.map((x) => html`<option value="${x.code}" ${x.code === c.country ? 'selected' : ''}>${x.name}</option>`)}
          </select>
        </div>
        <div class="field">
          <label for="city-${i}">City</label>
          <input id="city-${i}" data-field="city" data-i="${i}" value="${c.city}" placeholder="e.g. Riyadh" maxlength="60" autocomplete="off">
          <span class="hint">Visitors located in this city are sent to this centre first.</span>
        </div>
        <div class="field full">
          <label for="address-${i}">Address</label>
          <input id="address-${i}" data-field="address" data-i="${i}" value="${c.address}" placeholder="e.g. Al Malaz, Riyadh, KSA" maxlength="200" autocomplete="off">
        </div>
        <div class="field">
          <label for="maps-${i}">Google Maps link</label>
          <input id="maps-${i}" data-field="maps" data-i="${i}" value="${c.maps}" placeholder="https://maps.app.goo.gl/…" maxlength="300" autocomplete="off" inputmode="url">
          <span class="hint">Opens when a visitor taps Directions.</span>
        </div>
        <div class="field">
          <label for="whatsapp-${i}">WhatsApp number</label>
          <input id="whatsapp-${i}" data-field="whatsapp" data-i="${i}" value="${c.whatsapp}" placeholder="e.g. 971501304708" maxlength="20" autocomplete="off" inputmode="tel">
          <span class="hint">With the country code. Bookings from this centre’s visitors go here.</span>
        </div>
      </div>
    </section>`;

  const { el, update } = view(
    () => html`
    ${appBar(html`<button class="btn small" data-act="logout">${icon('log-out')}Log out</button>`)}
    <main class="page narrow">
      <div class="pagehead">
        <div>
          <div class="eyebrow">Admin</div>
          <h1>Centres</h1>
          <p class="subtitle">Addresses, Google Maps links and WhatsApp numbers. The website shows the centres in the visitor’s country.</p>
        </div>
      </div>
      ${tabs('centres')}
      ${readOnly && html`<div class="note">${icon('info')}<span>${readOnly}</span></div>`}
      ${error && html`<div class="alert" role="alert">${icon('circle-alert')}${error}</div>`}
      ${draft.map(row)}
      <div class="row centre-add">${COUNTRIES.map(
        (x) =>
          html`<button class="btn" type="button" data-act="add" data-country="${x.code}">${icon('plus')}Add a centre in ${x.name}</button>`,
      )}</div>
    </main>
    <div class="savebar"><div class="savebar-in">
      <p class="summary">${plural(draft.length, 'centre')} · ${COUNTRIES.map((x) => `${x.name} ${draft.filter((c) => c.country === x.code).length}`).join(' · ')}</p>
      <div class="row">
        <button class="btn primary" type="button" data-act="save" ${saving || readOnly ? 'disabled' : ''}>${icon('check')}${saving ? 'Saving…' : 'Save centres'}</button>
      </div>
    </div></div>`,
  );

  function validate() {
    for (const [i, c] of draft.entries()) {
      const name = c.city.trim() || `centre ${i + 1}`;
      if (!c.city.trim()) return `Enter the city of centre ${i + 1}.`;
      if (!c.address.trim()) return `Enter the address of ${name}.`;
      if (!/^https:\/\/\S+$/.test(c.maps.trim()))
        return `Enter the Google Maps link of ${name} (it starts with https://).`;
      if (!/^\d{8,15}$/.test(digits(c.whatsapp))) return `Enter the WhatsApp number of ${name}, with the country code.`;
    }
    const missing = COUNTRIES.find((x) => !draft.some((c) => c.country === x.code));
    return missing ? `Add at least one centre in ${missing.name}.` : '';
  }

  async function save() {
    error = validate();
    if (!error) {
      saving = true;
      update();
      try {
        const saved = await onSave(
          draft.map((c) => ({
            ...c,
            city: c.city.trim(),
            address: c.address.trim(),
            maps: c.maps.trim(),
            whatsapp: digits(c.whatsapp),
          })),
        );
        if (!saved) return; // session ended; the login screen is showing
        draft.splice(0, draft.length, ...saved.map((c) => ({ ...c })));
        dirty = false;
      } catch (err) {
        error = err.message;
      }
      saving = false;
    }
    update();
    if (error) el.querySelector('.alert')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  const leave = (fn) => {
    if (dirty && !window.confirm('Leave without saving your changes to the centres?')) return;
    dirty = false;
    fn();
  };

  el.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const i = Number(btn.dataset.i);
    switch (btn.dataset.act) {
      case 'logout':
        return leave(onLogout);
      case 'tab':
      case 'home':
        return leave(() => onTab(btn.dataset.act === 'home' ? 'profiles' : btn.dataset.tab));
      case 'save':
        return save();
      case 'add': {
        // After the country's last centre, so a country's centres stay together.
        const at = draft.findLastIndex((c) => c.country === btn.dataset.country) + 1 || draft.length;
        draft.splice(at, 0, blank(btn.dataset.country));
        dirty = true;
        update(`#city-${at}`);
        return;
      }
      case 'remove':
        draft.splice(i, 1);
        break;
      case 'up':
        [draft[i - 1], draft[i]] = [draft[i], draft[i - 1]];
        break;
      case 'down':
        [draft[i + 1], draft[i]] = [draft[i], draft[i + 1]];
        break;
      default:
        return;
    }
    dirty = true;
    update();
  });

  el.addEventListener('input', (e) => {
    const { field, i } = e.target.dataset;
    if (!field || i === undefined) return;
    draft[Number(i)][field] = e.target.value;
    dirty = true;
    if (field === 'country') update();
  });

  window.addEventListener('beforeunload', (e) => {
    if (dirty && el.isConnected) e.preventDefault();
  });

  update();
  return el;
}
