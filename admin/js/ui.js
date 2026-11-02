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
