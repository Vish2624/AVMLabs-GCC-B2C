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

// The newest migration. It can only run after all the earlier ones, so once it has run the database has
// everything: profiles then have a `code` column.
const LATEST = '0006_b2c_profiles.sql';

// True once the database is up to date. Until then the API serves the built-in tests and profiles (src/data/)
// and the admin can't save. A "yes" is remembered; a "no" is rechecked after a minute, so the database takes
// over soon after the migration runs. One query, only on a function's first request.
let state = null;
export async function dbReady() {
  if (state && (state.ready || Date.now() - state.at < 60_000)) return state.ready;
  const { error } = await db().from('profiles').select('code').limit(1);
  // A missing table or column means "not migrated yet"; any other failure is a real error, not a reason to fall back.
  const missing =
    error &&
    (['42P01', '42703', 'PGRST204', 'PGRST205'].includes(error.code) ||
      /does not exist|could not find/i.test(error.message || ''));
  if (error && !missing) unwrap({ error });
  state = { ready: !missing, at: Date.now() };
  if (missing) console.warn(`The database is not up to date; run supabase/migrations/${LATEST}`);
  return !missing;
}

export async function requireDb() {
  if (!(await dbReady())) {
    throw new HttpError(503, `The database needs an update: run supabase/migrations/${LATEST} in Supabase`);
  }
}

// Unwraps a Supabase result, turning database errors into a 500/409.
export function unwrap({ data, error }) {
  if (!error) return data;
  if (error.code === '23505') throw new HttpError(409, 'Something with this ID already exists');
  if (error.code === '23503') throw new HttpError(409, 'This is still used elsewhere');
  console.error('Supabase error', error);
  throw new HttpError(500, 'Database error');
}
