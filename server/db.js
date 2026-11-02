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

// Unwraps a Supabase result, turning database errors into a 500/409.
export function unwrap({ data, error }) {
  if (!error) return data;
  if (error.code === '23505') throw new HttpError(409, 'A profile with this ID already exists');
  console.error('Supabase error', error);
  throw new HttpError(500, 'Database error');
}
