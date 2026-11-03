import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { remapTests } from '../../server/catalog.js';
import { HttpError } from '../../server/http.js';
import { expandSubs, parseProfile, sumPrices } from '../../server/profiles.js';
import { parseSubProfile, parseSubProfileId } from '../../server/subprofiles.js';
import { assertKnownTests, parseTest } from '../../server/tests.js';

const valid = () => ({
  id: 'womens-hormone',
  name: "Women's Hormone Profile",
  tag: 'Women',
  category: 'women',
  tagline: 'Cycles, fertility & energy.',
  prices: { AE: 181, SA: 181, BH: 18.8 },
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

  it('rejects bad sub-profile ids, categories and icons', () => {
    rejects(parseProfile, { ...valid(), subProfiles: [0] });
    rejects(parseProfile, { ...valid(), subProfiles: ['9'] });
    rejects(parseProfile, { ...valid(), category: 'pets' });
    rejects(parseProfile, { ...valid(), icon: 'rocket' });
  });

  it('needs a price for every country, with a plain message', () => {
    rejects(parseProfile, { ...valid(), prices: { AE: 181, SA: 181 } }, 'Enter the BHD price');
    rejects(parseProfile, { ...valid(), prices: { AE: -1, SA: 181, BH: 18.8 } }, 'The AED price can’t be negative');
  });

  it('rounds prices to each currency', () => {
    assert.deepEqual(parseProfile({ ...valid(), prices: { AE: 180.6, SA: 181, BH: 18.8000001 } }).prices, {
      AE: 181,
      SA: 181,
      BH: 18.8,
    });
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

  it('requires a name and at least one test', () => {
    rejects(parseSubProfile, { ...sub(), name: '' }, 'Sub-profile name is required');
    rejects(parseSubProfile, { ...sub(), tests: [] }, 'Add at least one test');
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

// Checked against the in-memory store scripts/dev.js uses when Supabase isn't configured.
describe('assertKnownTests', () => {
  it('accepts known tests and names unknown ones', async () => {
    const { createDevStore } = await import('../../scripts/dev-store.js');
    globalThis.AVM_DEV_STORE = createDevStore(new URL('../../supabase/seed.sql', import.meta.url));
    try {
      await assertKnownTests(['vitd', 'cholesterol']);
      await assert.rejects(assertKnownTests(['lipid']), (err) => err.message === 'Unknown test: lipid');
      await assert.rejects(
        assertKnownTests(['vitd', 'nope']),
        (err) => err.status === 422 && err.message === 'Unknown test: nope',
      );
    } finally {
      delete globalThis.AVM_DEV_STORE;
    }
  });
});

describe('parseTest', () => {
  const test = () => ({
    id: 'vitd',
    name: '25-OH Vitamin D (Total)',
    categories: ['vitamins'],
    prices: { AE: 39, SA: 39, BH: 4 },
    tats: { AE: '24 hrs', SA: '24 hrs', BH: '24 hrs' },
    parameters: ['25-OH Vitamin D'],
  });

  it('fills defaults: short name, sample, no calculated parameters, last in popularity', () => {
    const t = parseTest(test());
    assert.equal(t.short, '25-OH Vitamin D (Total)');
    assert.equal(t.sample, 'Blood');
    assert.equal(t.sortOrder, 9999);
    assert.deepEqual(t.calculated, []);
  });

  it('keeps calculated parameters optional and separate from measured ones', () => {
    const t = parseTest({ ...test(), parameters: ['HDL', 'LDL', 'HDL'], calculated: ['LDL / HDL Ratio', 'HDL'] });
    assert.deepEqual(t.parameters, ['HDL', 'LDL']);
    assert.deepEqual(t.calculated, ['LDL / HDL Ratio']);
  });

  it('counts the test itself as its parameter when none are given', () => {
    const { parameters, ...noParams } = test();
    assert.deepEqual(parseTest(noParams).parameters, ['25-OH Vitamin D (Total)']);
  });

  it('requires a name, a category, and a price and report time for every country', () => {
    rejects(parseTest, { ...test(), name: ' ' }, 'Test name is required');
    rejects(parseTest, { ...test(), categories: [] }, 'Pick at least one category');
    rejects(parseTest, { ...test(), prices: { AE: 39, SA: 39 } }, 'Enter the BHD price');
    rejects(
      parseTest,
      { ...test(), tats: { AE: '24 hrs', SA: '', BH: '24 hrs' } },
      'Enter the report time for Saudi Arabia',
    );
    rejects(parseTest, { ...test(), sortOrder: 0 }, 'Popularity rank starts at 1');
    rejects(parseTest, { ...test(), categories: ['pets'] });
    rejects(parseTest, { ...test(), id: 'Vit D' });
  });
});

describe('remapTests', () => {
  it('swaps the old panels for their tests, keeping order and dropping repeats', () => {
    assert.deepEqual(remapTests(['thyroid', 'tsh', 'cbc']), ['t3', 't4', 'tsh', 'cbc']);
    assert.deepEqual(remapTests(['iron', 'ferritin']), ['serum-iron', 'tibc', 'ferritin']);
    assert.deepEqual(remapTests(['vitd']), ['vitd']);
  });
});

describe('sumPrices', () => {
  it('adds up each country and rounds to the currency', () => {
    const tests = new Map([
      ['a', { prices: { AE: 17, SA: 17, BH: 1.7 } }],
      ['b', { prices: { AE: 7, SA: 7, BH: 0.7 } }],
    ]);
    assert.deepEqual(sumPrices(['a', 'b', 'missing'], tests), { AE: 24, SA: 24, BH: 2.4 });
  });
});
