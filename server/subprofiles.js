// Reusable sub-profiles: validation and database access. A sub-profile is a
// named group of tests that profiles pick from; editing it updates every
// profile that uses it.
import { z } from 'zod';
import { TEST_IDS } from './catalog.js';
import { db, requireLibrary, unwrap } from './db.js';
import { HttpError } from './http.js';

const text = (max) => z.string().trim().max(max);

export const testList = z
  .array(z.string())
  .max(60)
  .transform((ids) => [...new Set(ids)])
  .refine((ids) => ids.every((id) => TEST_IDS.has(id)), 'Unknown test');

export const subProfileSchema = z.object({
  name: text(80).min(1, 'Sub-profile name is required'),
  description: text(300).default(''),
  tests: testList.refine((ids) => ids.length > 0, 'Add at least one test'),
});

export function parseSubProfile(body) {
  const result = subProfileSchema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    throw new HttpError(422, issues[0].message, issues);
  }
  return result.data;
}

// Sub-profile ids are positive integers; anything else can't exist.
export function parseSubProfileId(raw) {
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id < 1) throw new HttpError(404, 'Sub-profile not found');
  return id;
}

function toApi(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    tests: row.test_ids,
    updatedAt: row.updated_at,
    usedBy: (row.profile_sub_profiles || []).map((l) => l.profile_id),
  };
}

// Set only by scripts/dev.js when Supabase is not configured locally.
const devStore = () => globalThis.AVM_DEV_STORE;

export async function listSubProfiles() {
  if (devStore()) return devStore().listSubs();
  await requireLibrary();
  const rows = unwrap(
    await db()
      .from('sub_profile_library')
      .select('id, name, description, test_ids, updated_at, profile_sub_profiles (profile_id)')
      .order('name')
      .order('id'),
  );
  return rows.map(toApi);
}

export async function createSubProfile(sub) {
  if (devStore()) return devStore().createSub(sub);
  await requireLibrary();
  const row = unwrap(
    await db()
      .from('sub_profile_library')
      .insert({ name: sub.name, description: sub.description, test_ids: sub.tests })
      .select('id')
      .single(),
  );
  return row.id;
}

export async function updateSubProfile(id, sub) {
  if (devStore()) return devStore().updateSub(id, sub);
  await requireLibrary();
  const rows = unwrap(
    await db()
      .from('sub_profile_library')
      .update({
        name: sub.name,
        description: sub.description,
        test_ids: sub.tests,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id'),
  );
  if (!rows.length) throw new HttpError(404, 'Sub-profile not found');
}

// Refuses while any profile still uses it, naming those profiles.
export async function deleteSubProfile(id) {
  if (devStore()) return devStore().removeSub(id);
  await requireLibrary();
  const links = unwrap(await db().from('profile_sub_profiles').select('profiles (name)').eq('sub_profile_id', id));
  if (links.length) throw inUse(links.map((l) => l.profiles?.name).filter(Boolean));
  const rows = unwrap(await db().from('sub_profile_library').delete().eq('id', id).select('id'));
  if (!rows.length) throw new HttpError(404, 'Sub-profile not found');
}

export const inUse = (names) =>
  new HttpError(
    409,
    `Remove it from ${names.length === 1 ? 'this profile' : 'these profiles'} first: ${names.join(', ')}`,
  );
