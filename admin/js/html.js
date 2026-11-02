// Tagged template for building HTML strings. Interpolated values are
// escaped unless wrapped in raw() or produced by another html`` call.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

class Safe {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
export const raw = (value) => new Safe(String(value));

function format(value) {
  if (value instanceof Safe) return value.value;
  if (Array.isArray(value)) return value.map(format).join('');
  if (value === false || value === null || value === undefined) return '';
  return esc(value);
}

export function html(strings, ...values) {
  return new Safe(strings.reduce((out, s, i) => out + s + (i < values.length ? format(values[i]) : ''), ''));
}
