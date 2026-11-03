// Profile validation and database access. A profile is built from reusable
// sub-profiles (server/subprofiles.js) plus any tests added on their own.
import { z } from 'zod';
import { CATEGORIES, ICONS } from './catalog.js';
import { db, libraryReady, requireLibrary, unwrap } from './db.js';
import { HttpError } from './http.js';
import { testList } from './subprofiles.js';

const text = (max) => z.string().trim().max(max);

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
    price: z.number().int().min(0).max(1_000_000),
    icon: z.enum(ICONS).default('layers'),
    hue: z.number().int().min(0).max(359).default(275),
    sortOrder: z.number().int().min(0).max(9999).default(0),
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

const SELECT =
  'id, name, tag, category, tagline, price, icon, hue, sort_order, published, test_ids, updated_at, ' +
  'profile_sub_profiles (sort_order, sub_profile_library (id, name, description, test_ids))';

function toApi(row) {
  const subs = [...(row.profile_sub_profiles || [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((l) => l.sub_profile_library)
    .filter(Boolean)
    .map((s) => ({ id: s.id, name: s.name, description: s.description, tests: s.test_ids }));
  return {
    id: row.id,
    name: row.name,
    tag: row.tag,
    category: row.category,
    tagline: row.tagline,
    price: row.price,
    icon: row.icon,
    hue: row.hue,
    sortOrder: row.sort_order,
    published: row.published,
    updatedAt: row.updated_at,
    subProfiles: subs.map((s) => s.id),
    tests: row.test_ids || [],
    subs: expandSubs(subs, row.test_ids || []),
  };
}

// Set only by scripts/dev.js when Supabase is not configured locally.
const devStore = () => globalThis.AVM_DEV_STORE;

// Before migration 0002: each profile's own sub-profile rows, shaped like the new API.
const LEGACY_SELECT =
  'id, name, tag, category, tagline, price, icon, hue, sort_order, published, updated_at, sub_profiles (name, description, test_ids, sort_order)';

function legacyToApi(row) {
  const subs = [...(row.sub_profiles || [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => ({ id: null, name: s.name, description: s.description, tests: s.test_ids }));
  const { sub_profiles, ...rest } = row;
  return { ...toApi({ ...rest, test_ids: [], profile_sub_profiles: [] }), subs };
}

export async function listProfiles({ publishedOnly = false } = {}) {
  if (devStore()) return devStore().list({ publishedOnly });
  const ready = await libraryReady();
  let query = db()
    .from('profiles')
    .select(ready ? SELECT : LEGACY_SELECT)
    .order('sort_order')
    .order('name');
  if (publishedOnly) query = query.eq('published', true);
  return unwrap(await query).map(ready ? toApi : legacyToApi);
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
  if (devStore()) return devStore().create(profile);
  await requireLibrary();
  if (await exists(profile.id)) throw new HttpError(409, 'A profile with this ID already exists');
  await checkSubProfiles(profile.subProfiles);
  await save(profile);
}

export async function updateProfile(id, profile) {
  if (devStore()) return devStore().update(id, profile);
  await requireLibrary();
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
        price: p.price,
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
