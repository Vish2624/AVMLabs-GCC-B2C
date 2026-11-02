// Small request/response helpers for plain Node handlers. Used instead of
// Vercel's helpers so the same handlers also run under scripts/dev.js.
import { ConfigError } from './config.js';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function send(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(body === undefined ? '' : JSON.stringify(body));
}

const MAX_BODY = 100_000;

export async function readJson(req) {
  if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) {
    throw new HttpError(415, 'Expected a JSON body');
  }
  // Vercel may have parsed the body already.
  if (req.body !== undefined && typeof req.body !== 'string') return req.body;
  let raw = typeof req.body === 'string' ? req.body : '';
  if (!raw) {
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > MAX_BODY) throw new HttpError(413, 'Request body too large');
    }
  }
  try {
    return JSON.parse(raw || '{}');
  } catch {
    throw new HttpError(400, 'Invalid JSON');
  }
}

// Last path segment, e.g. "essential" for /api/admin/profiles/essential.
export function pathParam(req) {
  const path = new URL(req.url, 'http://local').pathname.replace(/\/+$/, '');
  return decodeURIComponent(path.slice(path.lastIndexOf('/') + 1));
}

// Wraps a map of method -> handler with method checks and error handling.
export function route(methods) {
  return async (req, res) => {
    const fn = methods[req.method];
    if (!fn) return send(res, 405, { error: 'Method not allowed' }, { Allow: Object.keys(methods).join(', ') });
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof HttpError) return send(res, err.status, { error: err.message, details: err.details });
      console.error(err);
      const message = err instanceof ConfigError ? 'Server is not configured: ' + err.message : 'Something went wrong';
      send(res, 500, { error: message });
    }
  };
}
