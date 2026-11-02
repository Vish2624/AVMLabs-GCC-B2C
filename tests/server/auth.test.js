import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { clearedCookie, isAuthed, passwordMatches, requireAdmin, sessionCookie } from '../../server/auth.js';
import { HttpError } from '../../server/http.js';

const req = (cookie = '', host = 'example.com') => ({ headers: { cookie, host } });
const cookieValue = (header) => header.split(';')[0];

beforeEach(() => {
  process.env.ADMIN_PASSWORD = 'correct horse';
  process.env.SESSION_SECRET = 'x'.repeat(32);
});

describe('passwordMatches', () => {
  it('accepts only the configured password', () => {
    assert.equal(passwordMatches('correct horse'), true);
    assert.equal(passwordMatches('wrong'), false);
    assert.equal(passwordMatches(undefined), false);
  });
});

describe('session cookie', () => {
  it('authenticates a request carrying a fresh cookie', () => {
    assert.equal(isAuthed(req(cookieValue(sessionCookie(req())))), true);
  });

  it('rejects missing, tampered and expired cookies', () => {
    assert.equal(isAuthed(req()), false);
    const [expires, sig] = cookieValue(sessionCookie(req())).split('=')[1].split('.');
    assert.equal(isAuthed(req(`avm_admin=${Number(expires) + 1}.${sig}`)), false);
    assert.equal(isAuthed(req(`avm_admin=1.${sig}`)), false);
  });

  it('stops working when the signing secret changes', () => {
    const cookie = cookieValue(sessionCookie(req()));
    process.env.SESSION_SECRET = 'y'.repeat(32);
    assert.equal(isAuthed(req(cookie)), false);
  });

  it('is HttpOnly, SameSite=Strict, scoped to the admin API, and Secure outside localhost', () => {
    const header = sessionCookie(req());
    for (const part of ['HttpOnly', 'SameSite=Strict', 'Path=/api/admin', 'Secure'])
      assert.ok(header.includes(part), part);
    assert.ok(!sessionCookie(req('', 'localhost:3000')).includes('Secure'));
    assert.ok(clearedCookie(req()).includes('Max-Age=0'));
  });

  it('derives a signing key from the Supabase key when SESSION_SECRET is unset', () => {
    delete process.env.SESSION_SECRET;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
    assert.equal(isAuthed(req(cookieValue(sessionCookie(req())))), true);
  });
});

describe('requireAdmin', () => {
  it('throws a 401 without a session', () => {
    assert.throws(
      () => requireAdmin(req()),
      (err) => err instanceof HttpError && err.status === 401,
    );
  });
});
