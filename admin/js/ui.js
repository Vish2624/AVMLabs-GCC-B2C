// Shared UI helpers.
import { html } from './html.js';

let toastTimer;

export function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// The countries the site serves, as in server/catalog.js (COUNTRIES). Prices are set per country.
export const COUNTRIES = [
  { code: 'AE', label: 'AED', name: 'UAE', decimals: 0 },
  { code: 'SA', label: 'SAR', name: 'Saudi Arabia', decimals: 0 },
  { code: 'BH', label: 'BD', name: 'Bahrain', decimals: 2 },
];

const round = (n, decimals) => Number(Number(n || 0).toFixed(decimals));
export const formatMoney = (code, n) => {
  const c = COUNTRIES.find((x) => x.code === code);
  return `${c.label} ${round(n, c.decimals).toLocaleString('en-US')}`;
};
// e.g. "AED 17 · SAR 17 · BD 1.7"
export const formatPrices = (prices) => COUNTRIES.map((c) => formatMoney(c.code, prices?.[c.code])).join(' · ');

// What a set of tests costs together in each country.
export const sumPrices = (ids, testsById) =>
  Object.fromEntries(
    COUNTRIES.map((c) => [
      c.code,
      round(
        ids.reduce((sum, id) => sum + (testsById.get(id)?.prices?.[c.code] || 0), 0),
        c.decimals,
      ),
    ]),
  );

// One price box per country. `values` holds what is typed, keyed by country code.
export const priceInputs = (values) => html`
  <div class="country-prices">${COUNTRIES.map(
    (c) => html`
    <div class="field">
      <label for="price-${c.code}">${c.name}</label>
      <div class="prefix"><span>${c.label}</span><input id="price-${c.code}" data-field="price" data-country="${c.code}" type="number" min="0" step="${c.decimals ? '0.1' : '1'}" inputmode="decimal" value="${values[c.code] ?? ''}"></div>
    </div>`,
  )}</div>`;

// The typed price boxes as numbers; the first empty or invalid one is reported as a message.
export function readPrices(values) {
  const prices = {};
  for (const c of COUNTRIES) {
    const raw = values[c.code];
    if (raw === '' || raw === undefined || raw === null || !(Number(raw) >= 0))
      return { error: `Enter the ${c.label} price for ${c.name}.` };
    prices[c.code] = round(raw, c.decimals);
  }
  return { prices };
}

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Lucide icon drawn with a CSS mask, same source as the website's <avm-i>.
export const icon = (name) =>
  html`<span class="ico" aria-hidden="true" style="--ico:url('https://cdn.jsdelivr.net/npm/lucide-static@0.469.0/icons/${name}.svg')"></span>`;

// Soft tint and ink colours for a profile hue, matching the website.
export const tint = (hue) => `background:oklch(0.94 0.045 ${hue});color:oklch(0.42 0.16 ${hue})`;
export const ink = (hue) => `color:oklch(0.45 0.16 ${hue})`;
export const cardBg = (hue) => `background:linear-gradient(160deg, oklch(0.94 0.04 ${hue}), oklch(0.985 0.012 ${hue}))`;

// Frosted header with the website logo, shared by every signed-in screen.
export const appBar = (actions) => html`
  <header class="appbar">
    <div class="appbar-in">
      <button class="logo" type="button" data-act="home" aria-label="Back to all profiles"><img src="/assets/avm-logo.png" alt="AVM Labs"></button>
      <span class="appbar-tag">Admin</span>
      <span class="grow"></span>
      ${actions}
    </div>
  </header>`;

// The admin sections. Views handle data-act="tab" and pass data-tab to main.js.
export const tabs = (active) => html`
  <nav class="tabs" aria-label="Admin sections">
    <button type="button" data-act="tab" data-tab="profiles" aria-current="${active === 'profiles' ? 'page' : 'false'}">${icon('layers')}Profiles</button>
    <button type="button" data-act="tab" data-tab="subs" aria-current="${active === 'subs' ? 'page' : 'false'}">${icon('list-checks')}Sub-profiles</button>
    <button type="button" data-act="tab" data-tab="tests" aria-current="${active === 'tests' ? 'page' : 'false'}">${icon('test-tube')}Tests</button>
    <button type="button" data-act="tab" data-tab="centres" aria-current="${active === 'centres' ? 'page' : 'false'}">${icon('map-pin')}Centres</button>
  </nav>`;

// Chips for a list of test ids, each removable, plus a type-to-add box.
// `key` keeps several pickers on one screen apart (data-picker).
export const testPicker = (key, ids, testsById, emptyText = 'No tests yet.') => html`
  ${
    ids.length
      ? html`<div class="chips">${ids.map(
          (id, j) => html`
        <span class="chip">${testsById.get(id)?.name || id}<small>${formatPrices(testsById.get(id)?.prices)}</small>
          <button type="button" data-act="remove-test" data-picker="${key}" data-test="${j}" aria-label="Remove ${testsById.get(id)?.name || id}">×</button>
        </span>`,
        )}</div>`
      : html`<p class="empty-note">${emptyText}</p>`
  }
  <div class="test-combo"><label class="add-test">${icon('plus')}<input id="test-add-${key}" data-field="test-add" data-picker="${key}" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="test-menu" placeholder="Type to add a test, e.g. Vitamin D" autocomplete="off" aria-label="Add a test"></label></div>`;

// Best matches first: name starts with the search, then a word in it does, then anywhere in the
// name or its "also known as" names.
function searchTests(tests, query) {
  const q = query.trim().toLowerCase();
  if (!q) return tests;
  const rank = (t) => {
    const name = t.name.toLowerCase();
    if (name.startsWith(q)) return 0;
    if (name.split(/[\s(/-]+/).some((word) => word.startsWith(q))) return 1;
    if (name.includes(q)) return 2;
    return (t.aka || '').toLowerCase().includes(q) ? 3 : 4;
  };
  return tests
    .map((test) => ({ test, r: rank(test) }))
    .filter((m) => m.r < 4)
    .sort((a, b) => a.r - b.r)
    .map((m) => m.test);
}

const highlight = (name, query) => {
  const q = query.trim().toLowerCase();
  const at = q ? name.toLowerCase().indexOf(q) : -1;
  if (at < 0) return name;
  return html`${name.slice(0, at)}<mark>${name.slice(at, at + q.length)}</mark>${name.slice(at + q.length)}`;
};

// The dropdown for testPicker's search box. Browsers don't let a <datalist> be styled, so this draws
// its own. Listens on the view's root element, so it keeps working when the view re-renders.
// onPick(input) adds the test named in input.value; statusOf(test) gives a note like "Added" for a
// test that can't be picked, or nothing.
export function attachTestSearch(root, tests, { onPick, statusOf }) {
  let input = null;
  let menu = null;
  let shown = [];
  let active = -1;

  const pickable = (test) => !statusOf(test);

  function close() {
    menu?.remove();
    menu = null;
    active = -1;
    input?.setAttribute('aria-expanded', 'false');
    input?.removeAttribute('aria-activedescendant');
    input = null;
  }

  function setActive(i) {
    active = i;
    menu.querySelector('.active')?.classList.remove('active');
    const row = i >= 0 ? menu.querySelector(`#test-option-${i}`) : null;
    row?.classList.add('active');
    row?.scrollIntoView({ block: 'nearest' });
    if (row) input.setAttribute('aria-activedescendant', row.id);
    else input.removeAttribute('aria-activedescendant');
  }

  function open(box) {
    if (input !== box) close();
    input = box;
    const query = box.value;
    shown = searchTests(tests, query);
    if (!menu) {
      menu = document.createElement('ul');
      menu.id = 'test-menu';
      menu.className = 'test-menu';
      menu.setAttribute('role', 'listbox');
      menu.setAttribute('aria-label', 'Tests');
      box.closest('.test-combo').append(menu);
      // Open upward when there isn't room below.
      const rect = box.getBoundingClientRect();
      menu.classList.toggle('up', window.innerHeight - rect.bottom < 240 && rect.top > 240);
      box.setAttribute('aria-expanded', 'true');
    }
    menu.innerHTML = shown.length
      ? shown
          .map((test, i) => {
            const status = statusOf(test);
            return html`<li id="test-option-${i}" role="option" data-i="${i}" aria-selected="false" aria-disabled="${status ? 'true' : 'false'}">
              <span>${highlight(test.name, query)}</span>
              ${status ? html`<small class="status">${status}</small>` : html`<small class="price">${formatPrices(test.prices)}</small>`}
            </li>`;
          })
          .join('')
      : html`<li class="none">No test matches "${query.trim()}"</li>`.toString();
    menu.scrollTop = 0;
    // While searching, the best match is ready for Enter.
    setActive(query.trim() ? shown.findIndex(pickable) : -1);
  }

  function move(step) {
    for (let i = active + step; i >= 0 && i < shown.length; i += step) {
      if (pickable(shown[i])) return setActive(i);
    }
  }

  function pick(box, test) {
    if (test) box.value = test.name;
    close();
    onPick(box);
  }

  const isSearchBox = (t) => t.dataset?.field === 'test-add';

  root.addEventListener('click', (e) => {
    if (isSearchBox(e.target)) return open(e.target);
    const row = e.target.closest?.('.test-menu li[data-i]');
    if (row && row.getAttribute('aria-disabled') !== 'true') pick(input, shown[Number(row.dataset.i)]);
  });
  // Keep focus in the box while clicking the list, including its scrollbar.
  root.addEventListener('mousedown', (e) => {
    if (e.target.closest?.('.test-menu')) e.preventDefault();
  });
  root.addEventListener('input', (e) => {
    if (isSearchBox(e.target)) open(e.target);
  });
  root.addEventListener('focusout', (e) => {
    if (isSearchBox(e.target)) close();
  });
  root.addEventListener('keydown', (e) => {
    if (!isSearchBox(e.target)) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!menu) open(e.target);
      move(e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(e.target, menu && active >= 0 ? shown[active] : null);
    } else if (e.key === 'Escape' && menu) {
      e.stopPropagation();
      close();
    }
  });
}

// Element with the given HTML that re-renders itself; event handlers are
// attached once to the element and survive re-renders.
export function view(render) {
  const el = document.createElement('div');
  const update = (focusSelector) => {
    el.innerHTML = render().toString();
    if (focusSelector) el.querySelector(focusSelector)?.focus();
  };
  return { el, update };
}
