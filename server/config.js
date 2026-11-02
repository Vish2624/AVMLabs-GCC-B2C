// Environment settings. Read lazily so a missing value fails the request
// that needs it with a clear message, not the whole deployment.

function required(name) {
  const value = process.env[name];
  if (!value) throw new ConfigError(`Missing environment variable ${name}`);
  return value;
}

export class ConfigError extends Error {}

export const config = {
  get supabaseUrl() { return required('SUPABASE_URL'); },
  get supabaseServiceKey() { return required('SUPABASE_SERVICE_ROLE_KEY'); },
  get adminPassword() { return required('ADMIN_PASSWORD'); },
  get sessionSecret() {
    const secret = required('SESSION_SECRET');
    if (secret.length < 32) throw new ConfigError('SESSION_SECRET must be at least 32 characters');
    return secret;
  },
};
