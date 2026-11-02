import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HttpError } from '../../server/http.js';
import { parseProfile } from '../../server/profiles.js';

const valid = () => ({
  id: 'womens-hormone',
  name: "Women's Hormone Profile",
  tag: 'Women',
  category: 'women',
  tagline: 'Cycles, fertility & energy.',
  price: 2999,
  icon: 'flower-2',
  hue: 345,
  sortOrder: 3,
  published: true,
  subs: [{ name: 'Hormones', description: '', tests: ['fsh', 'lh', 'amh'] }],
});

const rejects = (body, message) =>
  assert.throws(
    () => parseProfile(body),
    (err) => err instanceof HttpError && err.status === 422 && (!message || err.message === message),
  );

describe('parseProfile', () => {
  it('accepts a valid profile and trims text', () => {
    const profile = parseProfile({ ...valid(), name: '  Women  ' });
    assert.equal(profile.name, 'Women');
    assert.deepEqual(profile.subs[0].tests, ['fsh', 'lh', 'amh']);
  });

  it('fills defaults for optional fields', () => {
    const { tag, tagline, icon, hue, sortOrder, published, ...required } = valid();
    const profile = parseProfile(required);
    assert.equal(profile.icon, 'layers');
    assert.equal(profile.published, true);
    assert.equal(profile.sortOrder, 0);
  });

  it('removes duplicate tests within a sub-profile', () => {
    const body = valid();
    body.subs[0].tests = ['fsh', 'fsh', 'lh'];
    assert.deepEqual(parseProfile(body).subs[0].tests, ['fsh', 'lh']);
  });

  it('rejects ids that are not lowercase slugs', () => {
    rejects({ ...valid(), id: 'Women Hormone' }, 'Use lowercase letters, numbers and dashes');
    rejects({ ...valid(), id: '-women' });
  });

  it('rejects unknown tests, categories and icons', () => {
    rejects({ ...valid(), subs: [{ name: 'A', tests: ['not-a-test'] }] }, 'Unknown test');
    rejects({ ...valid(), category: 'pets' });
    rejects({ ...valid(), icon: 'rocket' });
  });

  it('rejects a negative or fractional price', () => {
    rejects({ ...valid(), price: -1 });
    rejects({ ...valid(), price: 10.5 });
  });

  it('requires at least one sub-profile and one test', () => {
    rejects({ ...valid(), subs: [] }, 'Add at least one sub-profile');
    rejects({ ...valid(), subs: [{ name: 'Empty', tests: [] }] }, 'Add at least one test');
  });

  it('requires names', () => {
    rejects({ ...valid(), name: '   ' }, 'Profile name is required');
    rejects({ ...valid(), subs: [{ name: '', tests: ['fsh'] }] }, 'Sub-profile name is required');
  });
});
