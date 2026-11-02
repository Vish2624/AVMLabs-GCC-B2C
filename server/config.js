import { createHmac } from 'node:crypto';

// Environment settings. Read lazily so a missing value fails the request
// that needs it with a clear message, not the whole deployment.

function required(name) {
  const value = process.env[name];
  if (!value) throw new ConfigError(`Missing environment variable ${name}`);
  return value;
}

export class ConfigError extends Error {}

export const config = {
  get supabaseUrl() {
    return required('SUPABASE_URL');
  },
  get supabaseServiceKey() {
    return required('SUPABASE_SERVICE_ROLE_KEY');
  },
  get adminPassword() {
    return required('ADMIN_PASSWORD');
  },
  // Signs the login cookie. Optional: without it, a key is derived from the
  // Supabase service key, which is already a server-only secret.
  get sessionSecret() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) return createHmac('sha256', this.supabaseServiceKey).update('avm-admin-session').digest('hex');
    if (secret.length < 32) throw new ConfigError('SESSION_SECRET must be at least 32 characters');
    return secret;
  },
};
