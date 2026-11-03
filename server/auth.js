// Single-password admin login. A successful login sets an HttpOnly cookie
// holding an expiry time signed with SESSION_SECRET.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';
import { HttpError } from './http.js';

const COOKIE = 'avm_admin';
const MAX_AGE = 12 * 60 * 60; // seconds

const sha256 = (s) => createHash('sha256').update(s).digest();
const sign = (value) => createHmac('sha256', config.sessionSecret).update(value).digest('base64url');

export function passwordMatches(input) {
  return timingSafeEqual(sha256(String(input ?? '')), sha256(config.adminPassword));
}

function cookieHeader(req, value, maxAge) {
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host || '');
  return [
    `${COOKIE}=${value}`,
    'Path=/api/admin',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
    local ? '' : 'Secure',
  ]
    .filter(Boolean)
    .join('; ');
}

export function sessionCookie(req) {
  const expires = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  return cookieHeader(req, `${expires}.${sign(expires)}`, MAX_AGE);
}

export function clearedCookie(req) {
  return cookieHeader(req, '', 0);
}

function readCookie(req) {
  const match = (req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return match ? match[1] : '';
}

export function isAuthed(req) {
  // Set only by scripts/dev.js when ADMIN_PASSWORD is empty; never on Vercel.
  if (globalThis.AVM_DEV_NO_LOGIN) return true;
  const [expires, sig] = readCookie(req).split('.');
  if (!expires || !sig) return false;
  const expected = Buffer.from(sign(expires));
  const given = Buffer.from(sig);
  return given.length === expected.length && timingSafeEqual(given, expected) && +expires > Date.now() / 1000;
}

export function requireAdmin(req) {
  if (!isAuthed(req)) throw new HttpError(401, 'Please log in');
}
