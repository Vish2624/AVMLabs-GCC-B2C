// Profile validation and database access. A profile is built from reusable
// sub-profiles (server/subprofiles.js) plus any tests added on their own.
import { z } from 'zod';
import { CATEGORIES, COUNTRIES, ICONS, remapTests } from './catalog.js';
import {
  benefitsReady,
  db,
  libraryReady,
  pricesReady,
  requireBenefits,
  requireLibrary,
  requirePrices,
  unwrap,
} from './db.js';
import { HttpError } from './http.js';
import { testList } from './subprofiles.js';
import { assertKnownTests, listTests, pricesSchema } from './tests.js';

const text = (max) => z.string().trim().max(max);

// A short list shown on the profile's reel; blank lines and repeats are dropped.
const lines = (label, maxItems, maxLength) =>
  z
    .array(z.string().trim().max(maxLength, `Keep each ${label} to ${maxLength} characters`))
    .max(maxItems, `Add up to ${maxItems} ${label}s`)
    .transform((items) => [...new Set(items.filter(Boolean))])
    .default([]);

export const profileSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(1)
      .max(40)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes'),
    name: text(80).min(1, 'Profile name is required'),
    tag: text(24).default(''),
    category: z.enum(CATEGORIES.map((c) => c.id)),
    tagline: text(140).default(''),
    ideal: lines('"Ideal for" item', 6, 40),
    benefits: lines('reason', 6, 120),
    prices: pricesSchema,
    icon: z.enum(ICONS).default('layers'),
    hue: z.number().int().min(0).max(359).default(275),
    sortOrder: z
      .number({ message: 'Enter a display order' })
      .int('Display order must be a whole number')
      .min(0, 'Display order can’t be negative')
      .max(9999, 'Display order must be 9999 or less')
      .default(0),
    published: z.boolean().default(true),
    subProfiles: z
      .array(z.number().int().positive())
      .max(30)
      .transform((ids) => [...new Set(ids)])
      .default([]),
    tests: testList.default([]),
  })
  .refine((p) => p.subProfiles.length || p.tests.length, {
    message: 'Add at least one sub-profile or test',
    path: ['subProfiles'],
  });

export function parseProfile(body) {
  const result = profileSchema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    throw new HttpError(422, issues[0].message, issues);
  }
  return result.data;
}

// The website reads `subs`: each chosen sub-profile, then the profile's own tests as one more group.
export function expandSubs(subs, tests) {
  const out = subs.map((s) => ({ id: s.id, name: s.name, description: s.description, tests: s.tests }));
  if (tests.length) out.push({ id: null, name: subs.length ? 'Additional tests' : 'Tests', description: '', tests });
  return out;
}

// `prices` exists from migration 0004; before it, profiles had one rupee price that no longer applies.
// `ideal` and `benefits` exist from migration 0005.
const select = (prices, benefits) =>
  `id, name, tag, category, tagline, ${benefits ? 'ideal, benefits, ' : ''}${prices ? 'prices, ' : ''}icon, hue, sort_order, published, test_ids, updated_at, ` +
  'profile_sub_profiles (sort_order, sub_profile_library (id, name, description, test_ids))';

// What the profile's tests cost together in each country, rounded like a price.
export function sumPrices(ids, testsById) {
  return Object.fromEntries(
    COUNTRIES.map((c) => [
      c.code,
      Number(ids.reduce((sum, id) => sum + (testsById.get(id)?.prices?.[c.code] || 0), 0).toFixed(c.decimals)),
    ]),
  );
}

function toApi(row) {
  const subs = [...(row.profile_sub_profiles || [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((l) => l.sub_profile_library)
    .filter(Boolean)
    .map((s) => ({ id: s.id, name: s.name, description: s.description, tests: remapTests(s.test_ids) }));
  const tests = remapTests(row.test_ids);
  return {
    id: row.id,
    name: row.name,
    tag: row.tag,
    category: row.category,
    tagline: row.tagline,
    // null before migration 0005, so the website keeps its built-in text; an empty list means none.
    ideal: row.ideal || null,
    benefits: row.benefits || null,
    prices: row.prices || null,
    icon: row.icon,
    hue: row.hue,
    sortOrder: row.sort_order,
    published: row.published,
    updatedAt: row.updated_at,
    subProfiles: subs.map((s) => s.id),
    tests,
    subs: expandSubs(subs, tests),
  };
}

// Set only by scripts/dev.js when Supabase is not configured locally.
const devStore = () => globalThis.AVM_DEV_STORE;

// Before migration 0002: each profile's own sub-profile rows, shaped like the new API.
const LEGACY_SELECT =
  'id, name, tag, category, tagline, icon, hue, sort_order, published, updated_at, sub_profiles (name, description, test_ids, sort_order)';

function legacyToApi(row) {
  const subs = [...(row.sub_profiles || [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => ({ id: null, name: s.name, description: s.description, tests: remapTests(s.test_ids) }));
  const { sub_profiles, ...rest } = row;
  return { ...toApi({ ...rest, test_ids: [], profile_sub_profiles: [] }), subs };
}

export async function listProfiles({ publishedOnly = false } = {}) {
  if (devStore()) return devStore().list({ publishedOnly });
  const [ready, priced, listed] = await Promise.all([libraryReady(), pricesReady(), benefitsReady()]);
  let query = db()
    .from('profiles')
    .select(ready ? select(priced, listed) : LEGACY_SELECT)
    .order('sort_order')
    .order('name');
  if (publishedOnly) query = query.eq('published', true);
  const profiles = unwrap(await query).map(ready ? toApi : legacyToApi);
  if (priced) return profiles;
  // Until migration 0004 runs, a profile costs what its tests cost together.
  const testsById = new Map((await listTests()).map((t) => [t.id, t]));
  return profiles.map((p) => ({ ...p, prices: sumPrices([...new Set(p.subs.flatMap((s) => s.tests))], testsById) }));
}

async function exists(id) {
  const rows = unwrap(await db().from('profiles').select('id').eq('id', id).limit(1));
  return rows.length > 0;
}

async function checkSubProfiles(ids) {
  if (!ids.length) return;
  const rows = unwrap(await db().from('sub_profile_library').select('id').in('id', ids));
  if (rows.length !== ids.length) throw new HttpError(422, 'A chosen sub-profile no longer exists');
}

export async function createProfile(profile) {
  await assertKnownTests(profile.tests);
  if (devStore()) return devStore().create(profile);
  await requireLibrary();
  await requirePrices();
  await requireBenefits();
  if (await exists(profile.id)) throw new HttpError(409, 'A profile with this ID already exists');
  await checkSubProfiles(profile.subProfiles);
  await save(profile);
}

export async function updateProfile(id, profile) {
  await assertKnownTests(profile.tests);
  if (devStore()) return devStore().update(id, profile);
  await requireLibrary();
  await requirePrices();
  await requireBenefits();
  if (profile.id !== id) throw new HttpError(400, 'Profile ID cannot be changed');
  if (!(await exists(id))) throw new HttpError(404, 'Profile not found');
  await checkSubProfiles(profile.subProfiles);
  await save(profile);
}

async function save(p) {
  unwrap(
    await db().rpc('save_profile', {
      payload: {
        id: p.id,
        name: p.name,
        tag: p.tag,
        category: p.category,
        tagline: p.tagline,
        ideal: p.ideal,
        benefits: p.benefits,
        prices: p.prices,
        icon: p.icon,
        hue: p.hue,
        sort_order: p.sortOrder,
        published: p.published,
        test_ids: p.tests,
        sub_profile_ids: p.subProfiles,
      },
    }),
  );
}

export async function deleteProfile(id) {
  if (devStore()) return devStore().remove(id);
  const rows = unwrap(await db().from('profiles').delete().eq('id', id).select('id'));
  if (!rows.length) throw new HttpError(404, 'Profile not found');
}
