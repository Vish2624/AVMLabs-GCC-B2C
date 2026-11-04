// Supabase client using the service role key. Server-only: never send this
// key to the browser.
import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';
import { HttpError } from './http.js';

let client;

export function db() {
  client ??= createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

// Tables added by later migrations, and the file that adds each.
const MIGRATIONS = {
  sub_profile_library: '0002_sub_profile_library.sql',
  tests: '0003_tests.sql',
};

// True once the migration that adds `table` has run. Until then callers fall back
// (the website keeps working) or refuse to save. A "yes" is remembered; a "no" is
// rechecked after a minute, so things work as soon as the migration is run.
const known = new Map();
export async function tableReady(table) {
  const k = known.get(table);
  if (k && (k.ready || Date.now() - k.at < 60_000)) return k.ready;
  const { error } = await db().from(table).select('*').limit(1);
  // Only a missing table means "not migrated"; any other failure is a real error, not a reason to fall back.
  const missing =
    error && (['42P01', 'PGRST205'].includes(error.code) || /does not exist|could not find/i.test(error.message || ''));
  if (error && !missing) unwrap({ error });
  known.set(table, { ready: !missing, at: Date.now() });
  if (missing) console.warn(`Table ${table} not found; run supabase/migrations/${MIGRATIONS[table]}`);
  return !missing;
}

export async function requireTable(table) {
  if (!(await tableReady(table))) {
    throw new HttpError(503, `The database needs an update: run supabase/migrations/${MIGRATIONS[table]} in Supabase`);
  }
}

// Per-country prices (migration 0004): true once tests and profiles have a `prices` column.
// Until then the site serves the built-in tests and works out profile prices from them.
const PRICES_MIGRATION = '0004_country_prices.sql';
export async function pricesReady() {
  const k = known.get('prices');
  if (k && (k.ready || Date.now() - k.at < 60_000)) return k.ready;
  let ready = await tableReady('tests');
  if (ready) {
    const { error } = await db().from('tests').select('prices').limit(1);
    // 42703: undefined column. Any other failure is a real error.
    if (error && !(error.code === '42703' || /column .* does not exist/i.test(error.message || ''))) unwrap({ error });
    ready = !error;
  }
  known.set('prices', { ready, at: Date.now() });
  if (!ready) console.warn(`Per-country prices not set up; run supabase/migrations/${PRICES_MIGRATION}`);
  return ready;
}

export async function requirePrices() {
  if (!(await pricesReady())) {
    throw new HttpError(503, `The database needs an update: run supabase/migrations/${PRICES_MIGRATION} in Supabase`);
  }
}

// The "Ideal for" and "Why take this profile" lists (migration 0005): true once profiles have those columns.
// Until then the website keeps its built-in text, and saving is refused because the old save_profile would drop them.
const BENEFITS_MIGRATION = '0005_profile_benefits.sql';
export async function benefitsReady() {
  const k = known.get('benefits');
  if (k && (k.ready || Date.now() - k.at < 60_000)) return k.ready;
  const { error } = await db().from('profiles').select('benefits').limit(1);
  // 42703: undefined column. Any other failure is a real error.
  if (error && !(error.code === '42703' || /column .* does not exist/i.test(error.message || ''))) unwrap({ error });
  known.set('benefits', { ready: !error, at: Date.now() });
  if (error) console.warn(`Profile lists not set up; run supabase/migrations/${BENEFITS_MIGRATION}`);
  return !error;
}

export async function requireBenefits() {
  if (!(await benefitsReady())) {
    throw new HttpError(503, `The database needs an update: run supabase/migrations/${BENEFITS_MIGRATION} in Supabase`);
  }
}

// The sub-profile library (migration 0002). Until it runs, the old save_profile would drop sub-profiles.
export const libraryReady = () => tableReady('sub_profile_library');
export const requireLibrary = () => requireTable('sub_profile_library');

// Unwraps a Supabase result, turning database errors into a 500/409.
export function unwrap({ data, error }) {
  if (!error) return data;
  if (error.code === '23505') throw new HttpError(409, 'Something with this ID already exists');
  if (error.code === '23503') throw new HttpError(409, 'This is still used elsewhere');
  console.error('Supabase error', error);
  throw new HttpError(500, 'Database error');
}
