import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { STATIC_CENTRES } from '../../server/catalog.js';
import { parseCentres } from '../../server/centres.js';
import { HttpError } from '../../server/http.js';

const rejects = (body, message) =>
  assert.throws(
    () => parseCentres(body),
    (err) => err instanceof HttpError && err.status === 422 && err.message === message,
  );

describe('parseCentres', () => {
  it('accepts the built-in centres: Dubai, Manama, Al Khobar and Riyadh', () => {
    assert.deepEqual(
      parseCentres(STATIC_CENTRES).map((c) => [c.country, c.city]),
      [
        ['AE', 'Dubai'],
        ['BH', 'Manama'],
        ['SA', 'Al Khobar'],
        ['SA', 'Riyadh'],
      ],
    );
  });

  it('keeps only the digits of a WhatsApp number', () => {
    const [dubai] = parseCentres([{ ...STATIC_CENTRES[0], whatsapp: '+971 50 130-4708' }, ...STATIC_CENTRES.slice(1)]);
    assert.equal(dubai.whatsapp, '971501304708');
  });

  it('needs a centre in every country, and every field filled in', () => {
    rejects(
      STATIC_CENTRES.filter((c) => c.country !== 'BH'),
      'Add at least one centre in Bahrain',
    );
    rejects([{ ...STATIC_CENTRES[0], address: ' ' }, ...STATIC_CENTRES.slice(1)], 'Enter the address of every centre');
    rejects(
      [{ ...STATIC_CENTRES[0], maps: 'maps.app.goo.gl/x' }, ...STATIC_CENTRES.slice(1)],
      'Google Maps links start with https://',
    );
    rejects(
      [{ ...STATIC_CENTRES[0], whatsapp: '12345' }, ...STATIC_CENTRES.slice(1)],
      'WhatsApp numbers are 8–15 digits with the country code, e.g. 971501304708',
    );
    rejects([], 'Add at least one centre');
  });
});
