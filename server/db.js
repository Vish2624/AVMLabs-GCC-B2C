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

// True once supabase/migrations/0002_sub_profile_library.sql has run. Until then the
// website keeps reading the old tables and the admin refuses to save (the old
// save_profile would drop sub-profiles). A "yes" is remembered; a "no" is rechecked
// after a minute so the admin works as soon as the migration is run.
let upgraded = false;
let checkedAt = 0;
export async function libraryReady() {
  if (upgraded || Date.now() - checkedAt < 60_000) return upgraded;
  const { error } = await db().from('sub_profile_library').select('id').limit(1);
  // Only a missing table means "not migrated"; any other failure is a real error, not a reason to fall back.
  const missing =
    error && (['42P01', 'PGRST205'].includes(error.code) || /does not exist|could not find/i.test(error.message || ''));
  if (error && !missing) unwrap({ error });
  checkedAt = Date.now();
  upgraded = !missing;
  if (missing) console.warn('Sub-profile library not found; run supabase/migrations/0002_sub_profile_library.sql');
  return upgraded;
}

export async function requireLibrary() {
  if (!(await libraryReady())) {
    throw new HttpError(
      503,
      'The database needs an update: run supabase/migrations/0002_sub_profile_library.sql in Supabase',
    );
  }
}

// Unwraps a Supabase result, turning database errors into a 500/409.
export function unwrap({ data, error }) {
  if (!error) return data;
  if (error.code === '23505') throw new HttpError(409, 'A profile with this ID already exists');
  if (error.code === '23503') throw new HttpError(409, 'This sub-profile is still used by a profile');
  console.error('Supabase error', error);
  throw new HttpError(500, 'Database error');
}
