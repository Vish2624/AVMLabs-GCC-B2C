// In-memory stand-in for the Supabase profiles tables, used by scripts/dev.js
// when SUPABASE_SERVICE_ROLE_KEY is not set. Starts from supabase/seed.sql;
// changes last until the dev server restarts.
import fs from 'node:fs';
import { HttpError } from '../server/http.js';

const str = (s) => s.slice(1, -1).replace(/''/g, "'");

function parseSeed(sql) {
  const profiles = new Map();
  const profileRe =
    /values \('([^']+)', ('(?:[^']|'')*'), ('(?:[^']|'')*'), '([^']+)', ('(?:[^']|'')*'), (\d+), '([^']+)', (\d+), (\d+), (true|false)\);/g;
  for (const m of sql.matchAll(profileRe)) {
    profiles.set(m[1], {
      id: m[1],
      name: str(m[2]),
      tag: str(m[3]),
      category: m[4],
      tagline: str(m[5]),
      price: +m[6],
      icon: m[7],
      hue: +m[8],
      sortOrder: +m[9],
      published: m[10] === 'true',
      updatedAt: new Date().toISOString(),
      subs: [],
    });
  }
  const subRe = /\('([^']+)', ('(?:[^']|'')*'), ('(?:[^']|'')*'), array\[([^\]]*)\]::text\[\], (\d+)\)/g;
  for (const m of sql.matchAll(subRe)) {
    const tests = [...m[4].matchAll(/'([^']+)'/g)].map((t) => t[1]);
    profiles.get(m[1])?.subs.push({ name: str(m[2]), description: str(m[3]), tests, order: +m[5] });
  }
  for (const p of profiles.values()) {
    p.subs = p.subs.sort((a, b) => a.order - b.order).map(({ order, ...s }) => s);
  }
  return profiles;
}

export function createDevStore(seedFile) {
  const profiles = parseSeed(fs.readFileSync(seedFile, 'utf8'));
  const copy = (p) => structuredClone(p);
  return {
    list({ publishedOnly = false } = {}) {
      return [...profiles.values()]
        .filter((p) => !publishedOnly || p.published)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map(copy);
    },
    create(p) {
      if (profiles.has(p.id)) throw new HttpError(409, 'A profile with this ID already exists');
      profiles.set(p.id, { ...copy(p), updatedAt: new Date().toISOString() });
    },
    update(id, p) {
      if (p.id !== id) throw new HttpError(400, 'Profile ID cannot be changed');
      if (!profiles.has(id)) throw new HttpError(404, 'Profile not found');
      profiles.set(id, { ...copy(p), updatedAt: new Date().toISOString() });
    },
    remove(id) {
      if (!profiles.delete(id)) throw new HttpError(404, 'Profile not found');
    },
  };
}
