// Lab tests: validation and database access. Each test lists the parameters it
// measures and, optionally, calculated parameters (worked out from other
// results, e.g. LDL / HDL Ratio). Prices and report times are set per country.
// Until the database is up to date (server/db.js), the built-in tests
// (src/data/tests.json) are served and editing is refused.
import { z } from 'zod';
import { COUNTRIES, SAMPLES, STATIC_TESTS, TEST_CATEGORIES } from './catalog.js';
import { db, dbReady, requireDb, unwrap } from './db.js';
import { HttpError } from './http.js';

const text = (max) => z.string().trim().max(max);
const names = (maxItems) =>
  z
    .array(text(120).min(1, 'Parameter names can’t be empty'))
    .max(maxItems)
    .transform((list) => [...new Set(list)]);

// One value per country, e.g. { AE: 17, SA: 17, BH: 1.7 }.
const perCountry = (value) => z.object(Object.fromEntries(COUNTRIES.map((c) => [c.code, value(c)])));
const priceIn = (c) =>
  z
    .number({ message: `Enter the ${c.currency} price` })
    .min(0, `The ${c.currency} price can’t be negative`)
    .max(100_000, `The ${c.currency} price looks too high`)
    .transform((n) => Number(n.toFixed(c.decimals)));
export const pricesSchema = perCountry(priceIn);
const tatIn = (c) => text(30).min(1, `Enter the report time for ${c.name}`);

export const testSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(1)
      .max(40)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes'),
    // The lab's code and short name (e.g. HEMOGRAM - 6 PART (DIFF), H6): kept for the lab and the admin,
    // never shown on the site. `short` below is the name the site shows on buttons and chips.
    code: text(60).default(''),
    shortName: text(40).default(''),
    name: text(120).min(1, 'Test name is required'),
    short: text(60).default(''),
    categories: z
      .array(z.enum(TEST_CATEGORIES.map((c) => c.id)))
      .min(1, 'Pick at least one category')
      .max(6)
      .transform((ids) => [...new Set(ids)]),
    prices: pricesSchema,
    tats: perCountry(tatIn),
    fasting: z.boolean().default(false),
    sample: z.enum(SAMPLES).default('Blood'),
    aka: text(200).default(''),
    about: text(800).default(''),
    // What it measures; not edited in the admin. Defaults to the test itself.
    parameters: names(80).default([]),
    calculated: names(40).default([]),
    // Popularity rank: 1 is the most booked. The first 20 are shown as popular tests.
    sortOrder: z
      .number({ message: 'Enter a popularity rank' })
      .int('Popularity rank must be a whole number')
      .min(1, 'Popularity rank starts at 1')
      .max(9999, 'Popularity rank must be 9999 or less')
      .default(9999),
    published: z.boolean().default(true),
  })
  .transform((t) => ({
    ...t,
    short: t.short || t.name,
    parameters: t.parameters.length ? t.parameters : [t.name],
    // A name listed in both stays measured.
    calculated: t.calculated.filter((n) => !t.parameters.includes(n)),
  }));

export function parseTest(body) {
  const result = testSchema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    throw new HttpError(422, issues[0].message, issues);
  }
  return result.data;
}

// Same shape the website already uses (cat, params), plus the full details.
export function toApi(t) {
  return {
    id: t.id,
    code: t.code,
    shortName: t.shortName,
    name: t.name,
    short: t.short || t.name,
    cat: t.categories,
    rank: t.sortOrder,
    params: t.parameters.length + t.calculated.length,
    prices: t.prices,
    tats: t.tats,
    fasting: t.fasting,
    aka: t.aka,
    about: t.about,
    sample: t.sample,
    parameters: t.parameters,
    calculated: t.calculated,
    sortOrder: t.sortOrder,
    published: t.published,
    updatedAt: t.updatedAt,
  };
}

// The built-in tests.json rows in the stored shape.
export const fromStatic = (t) => ({
  id: t.id,
  code: t.code || '',
  shortName: t.shortName || '',
  name: t.name,
  short: t.short,
  categories: t.cat,
  prices: t.prices,
  tats: t.tats,
  fasting: t.fasting,
  sample: t.sample || 'Blood',
  aka: t.aka || '',
  about: t.about || '',
  parameters: t.parameters || [t.name],
  calculated: t.calculated || [],
  sortOrder: t.rank,
  published: true,
  updatedAt: null,
});

const fromRow = (r) => ({
  id: r.id,
  code: r.code || '',
  shortName: r.short_name || '',
  name: r.name,
  short: r.short,
  categories: r.categories,
  prices: r.prices,
  tats: r.tats,
  fasting: r.fasting,
  sample: r.sample,
  aka: r.aka,
  about: r.about,
  parameters: r.parameters,
  calculated: r.calculated,
  sortOrder: r.sort_order,
  published: r.published,
  updatedAt: r.updated_at,
});

const toRow = (t) => ({
  id: t.id,
  code: t.code,
  short_name: t.shortName,
  name: t.name,
  short: t.short,
  categories: t.categories,
  prices: t.prices,
  tats: t.tats,
  fasting: t.fasting,
  sample: t.sample,
  aka: t.aka,
  about: t.about,
  parameters: t.parameters,
  calculated: t.calculated,
  sort_order: t.sortOrder,
  published: t.published,
});

// Set only by scripts/dev.js when Supabase is not configured locally.
const devStore = () => globalThis.AVM_DEV_STORE;

export async function listTests({ publishedOnly = false } = {}) {
  let tests;
  if (devStore()) tests = devStore().listTests();
  else if (!(await dbReady())) tests = STATIC_TESTS.map(fromStatic);
  else tests = unwrap(await db().from('tests').select('*').order('sort_order').order('name')).map(fromRow);
  return tests.filter((t) => !publishedOnly || t.published).map(toApi);
}

// Every test id the admin may use in a sub-profile or profile (unpublished included).
export async function assertKnownTests(ids) {
  if (!ids.length) return;
  const known = new Set((await listTests()).map((t) => t.id));
  const unknown = ids.filter((id) => !known.has(id));
  if (unknown.length) throw new HttpError(422, `Unknown test: ${unknown.join(', ')}`);
}

export async function createTest(t) {
  if (devStore()) return devStore().createTest(t);
  await requireDb();
  const rows = unwrap(await db().from('tests').select('id').eq('id', t.id).limit(1));
  if (rows.length) throw new HttpError(409, 'A test with this ID already exists');
  unwrap(await db().from('tests').insert(toRow(t)));
}

export async function updateTest(id, t) {
  if (devStore()) return devStore().updateTest(id, t);
  await requireDb();
  if (t.id !== id) throw new HttpError(400, 'Test ID cannot be changed');
  const rows = unwrap(
    await db()
      .from('tests')
      .update({ ...toRow(t), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id'),
  );
  if (!rows.length) throw new HttpError(404, 'Test not found');
}

// Refuses while a sub-profile or profile still includes it, naming them.
export async function deleteTest(id) {
  if (devStore()) return devStore().removeTest(id);
  await requireDb();
  const subs = unwrap(await db().from('sub_profile_library').select('name').contains('test_ids', [id]));
  const profiles = unwrap(await db().from('profiles').select('name').contains('test_ids', [id]));
  const users = [...subs.map((s) => s.name), ...profiles.map((p) => p.name)];
  if (users.length) throw testInUse(users);
  const rows = unwrap(await db().from('tests').delete().eq('id', id).select('id'));
  if (!rows.length) throw new HttpError(404, 'Test not found');
}

export const testInUse = (names) => new HttpError(409, `Remove it from these first: ${names.join(', ')}`);
