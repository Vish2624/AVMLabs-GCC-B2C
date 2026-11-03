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

export const formatPrice = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

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
  </nav>`;

// Editable list of names (e.g. a test's parameters): removable chips plus a box to add more.
export const nameList = (key, items, placeholder, emptyText) => html`
  ${
    items.length
      ? html`<div class="chips">${items.map(
          (name, j) => html`
        <span class="chip">${name}<button type="button" data-act="remove-name" data-list="${key}" data-i="${j}" aria-label="Remove ${name}">×</button></span>`,
        )}</div>`
      : html`<p class="empty-note">${emptyText}</p>`
  }
  <div class="add-row">
    <label class="add-test">${icon('plus')}<input id="name-add-${key}" data-field="name-add" data-list="${key}" placeholder="${placeholder}" autocomplete="off" aria-label="${placeholder}"></label>
    <button class="btn small" type="button" data-act="add-name" data-list="${key}">Add</button>
  </div>
  <span class="hint">Press Enter to add. Paste several separated by commas or new lines.</span>`;

// Chips for a list of test ids, each removable, plus a type-to-add box.
// `key` keeps several pickers on one screen apart (data-picker).
export const testPicker = (key, ids, testsById, emptyText = 'No tests yet.') => html`
  ${
    ids.length
      ? html`<div class="chips">${ids.map(
          (id, j) => html`
        <span class="chip">${testsById.get(id)?.name || id}<small>${formatPrice(testsById.get(id)?.mrp)}</small>
          <button type="button" data-act="remove-test" data-picker="${key}" data-test="${j}" aria-label="Remove ${testsById.get(id)?.name || id}">×</button>
        </span>`,
        )}</div>`
      : html`<p class="empty-note">${emptyText}</p>`
  }
  <label class="add-test">${icon('plus')}<input id="test-add-${key}" data-field="test-add" data-picker="${key}" list="test-options" placeholder="Type to add a test, e.g. Vitamin D" autocomplete="off" aria-label="Add a test"></label>`;

export const testOptions = (catalog) =>
  html`<datalist id="test-options">${catalog.tests.map((t) => html`<option value="${t.name}"></option>`)}</datalist>`;

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
