import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HttpError } from '../../server/http.js';
import { expandSubs, parseProfile } from '../../server/profiles.js';
import { parseSubProfile, parseSubProfileId } from '../../server/subprofiles.js';

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
  subProfiles: [9, 6],
  tests: ['amh'],
});

const rejects = (parse, body, message) =>
  assert.throws(
    () => parse(body),
    (err) => err instanceof HttpError && err.status === 422 && (!message || err.message === message),
  );

describe('parseProfile', () => {
  it('accepts a valid profile and trims text', () => {
    const profile = parseProfile({ ...valid(), name: '  Women  ' });
    assert.equal(profile.name, 'Women');
    assert.deepEqual(profile.subProfiles, [9, 6]);
    assert.deepEqual(profile.tests, ['amh']);
  });

  it('fills defaults for optional fields', () => {
    const { tag, tagline, icon, hue, sortOrder, published, tests, ...required } = valid();
    const profile = parseProfile(required);
    assert.equal(profile.icon, 'layers');
    assert.equal(profile.published, true);
    assert.equal(profile.sortOrder, 0);
    assert.deepEqual(profile.tests, []);
  });

  it('removes duplicate sub-profiles and tests', () => {
    const profile = parseProfile({ ...valid(), subProfiles: [9, 9, 6], tests: ['amh', 'amh', 'lh'] });
    assert.deepEqual(profile.subProfiles, [9, 6]);
    assert.deepEqual(profile.tests, ['amh', 'lh']);
  });

  it('accepts a profile made of only sub-profiles or only tests', () => {
    assert.deepEqual(parseProfile({ ...valid(), tests: [] }).tests, []);
    assert.deepEqual(parseProfile({ ...valid(), subProfiles: [] }).subProfiles, []);
  });

  it('rejects ids that are not lowercase slugs', () => {
    rejects(parseProfile, { ...valid(), id: 'Women Hormone' }, 'Use lowercase letters, numbers and dashes');
    rejects(parseProfile, { ...valid(), id: '-women' });
  });

  it('rejects unknown tests, bad sub-profile ids, categories and icons', () => {
    rejects(parseProfile, { ...valid(), tests: ['not-a-test'] }, 'Unknown test');
    rejects(parseProfile, { ...valid(), subProfiles: [0] });
    rejects(parseProfile, { ...valid(), subProfiles: ['9'] });
    rejects(parseProfile, { ...valid(), category: 'pets' });
    rejects(parseProfile, { ...valid(), icon: 'rocket' });
  });

  it('rejects a negative or fractional price', () => {
    rejects(parseProfile, { ...valid(), price: -1 });
    rejects(parseProfile, { ...valid(), price: 10.5 });
  });

  it('requires at least one sub-profile or test', () => {
    rejects(parseProfile, { ...valid(), subProfiles: [], tests: [] }, 'Add at least one sub-profile or test');
  });

  it('requires a name', () => {
    rejects(parseProfile, { ...valid(), name: '   ' }, 'Profile name is required');
  });
});

describe('parseSubProfile', () => {
  const sub = () => ({ name: 'Hormones', description: '', tests: ['fsh', 'lh', 'amh'] });

  it('accepts a valid sub-profile and removes duplicate tests', () => {
    assert.deepEqual(parseSubProfile({ ...sub(), name: ' Hormones ', tests: ['fsh', 'fsh'] }), {
      name: 'Hormones',
      description: '',
      tests: ['fsh'],
    });
  });

  it('requires a name and at least one known test', () => {
    rejects(parseSubProfile, { ...sub(), name: '' }, 'Sub-profile name is required');
    rejects(parseSubProfile, { ...sub(), tests: [] }, 'Add at least one test');
    rejects(parseSubProfile, { ...sub(), tests: ['not-a-test'] }, 'Unknown test');
  });

  it('only accepts positive whole-number ids', () => {
    assert.equal(parseSubProfileId('12'), 12);
    for (const bad of ['0', '-1', '1.5', 'abc', '']) {
      assert.throws(
        () => parseSubProfileId(bad),
        (err) => err.status === 404,
      );
    }
  });
});

describe('expandSubs', () => {
  const heart = { id: 2, name: 'Heart', description: '', tests: ['lipid'] };

  it('lists sub-profiles, then extra tests as one more group', () => {
    assert.deepEqual(
      expandSubs([heart], ['crp']).map((s) => s.name),
      ['Heart', 'Additional tests'],
    );
  });

  it('calls the group just "Tests" when there are no sub-profiles', () => {
    assert.deepEqual(expandSubs([], ['crp']), [{ id: null, name: 'Tests', description: '', tests: ['crp'] }]);
  });

  it('adds no extra group without extra tests', () => {
    assert.equal(expandSubs([heart], []).length, 1);
  });
});
