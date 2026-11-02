// Profile validation and database access.
import { z } from 'zod';
import { CATEGORIES, ICONS, TEST_IDS } from './catalog.js';
import { db, unwrap } from './db.js';
import { HttpError } from './http.js';

const text = (max) => z.string().trim().max(max);

const subProfileSchema = z.object({
  name: text(80).min(1, 'Sub-profile name is required'),
  description: text(300).default(''),
  tests: z.array(z.string()).max(60)
    .transform((ids) => [...new Set(ids)])
    .refine((ids) => ids.every((id) => TEST_IDS.has(id)), 'Unknown test'),
});

export const profileSchema = z.object({
  id: z.string().trim().min(1).max(40).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes'),
  name: text(80).min(1, 'Profile name is required'),
  tag: text(24).default(''),
  category: z.enum(CATEGORIES.map((c) => c.id)),
  tagline: text(140).default(''),
  price: z.number().int().min(0).max(1_000_000),
  icon: z.enum(ICONS).default('layers'),
  hue: z.number().int().min(0).max(359).default(275),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  published: z.boolean().default(true),
  subs: z.array(subProfileSchema).min(1, 'Add at least one sub-profile').max(20),
}).refine((p) => p.subs.some((s) => s.tests.length), { message: 'Add at least one test', path: ['subs'] });

export function parseProfile(body) {
  const result = profileSchema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    throw new HttpError(422, issues[0].message, issues);
  }
  return result.data;
}

const SELECT = 'id, name, tag, category, tagline, price, icon, hue, sort_order, published, updated_at, sub_profiles (name, description, test_ids, sort_order)';

function toApi(row) {
  return {
    id: row.id, name: row.name, tag: row.tag, category: row.category, tagline: row.tagline,
    price: row.price, icon: row.icon, hue: row.hue, sortOrder: row.sort_order,
    published: row.published, updatedAt: row.updated_at,
    subs: [...(row.sub_profiles || [])].sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => ({ name: s.name, description: s.description, tests: s.test_ids })),
  };
}

export async function listProfiles({ publishedOnly = false } = {}) {
  let query = db().from('profiles').select(SELECT).order('sort_order').order('name');
  if (publishedOnly) query = query.eq('published', true);
  return unwrap(await query).map(toApi);
}

async function exists(id) {
  const rows = unwrap(await db().from('profiles').select('id').eq('id', id).limit(1));
  return rows.length > 0;
}

export async function createProfile(profile) {
  if (await exists(profile.id)) throw new HttpError(409, 'A profile with this ID already exists');
  await save(profile);
}

export async function updateProfile(id, profile) {
  if (profile.id !== id) throw new HttpError(400, 'Profile ID cannot be changed');
  if (!(await exists(id))) throw new HttpError(404, 'Profile not found');
  await save(profile);
}

async function save(p) {
  unwrap(await db().rpc('save_profile', {
    payload: {
      id: p.id, name: p.name, tag: p.tag, category: p.category, tagline: p.tagline, price: p.price,
      icon: p.icon, hue: p.hue, sort_order: p.sortOrder, published: p.published, subs: p.subs,
    },
  }));
}

export async function deleteProfile(id) {
  const rows = unwrap(await db().from('profiles').delete().eq('id', id).select('id'));
  if (!rows.length) throw new HttpError(404, 'Profile not found');
}
