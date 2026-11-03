// In-memory stand-in for the Supabase tables (tests, sub-profiles, profiles), used by scripts/dev.js when
// SUPABASE_SERVICE_ROLE_KEY is not set. Starts from supabase/seed.sql, brought up to date the way
// migration 0004 does it (old panels swapped for their tests, profile prices = what their tests cost);
// changes last until the dev server restarts.
import fs from 'node:fs';
import { remapTests, STATIC_TESTS } from '../server/catalog.js';
import { HttpError } from '../server/http.js';
import { expandSubs, sumPrices } from '../server/profiles.js';
import { inUse } from '../server/subprofiles.js';
import { fromStatic, testInUse } from '../server/tests.js';

const str = (s) => s.slice(1, -1).replace(/''/g, "'");
const now = () => new Date().toISOString();

function parseSeed(sql) {
  const library = new Map();
  const libRe = /\((\d+), ('(?:[^']|'')*'), ('(?:[^']|'')*'), array\[([^\]]*)\]::text\[\]\)/g;
  for (const m of sql.matchAll(libRe)) {
    const tests = remapTests([...m[4].matchAll(/'([^']+)'/g)].map((t) => t[1]));
    library.set(+m[1], { id: +m[1], name: str(m[2]), description: str(m[3]), tests, updatedAt: now() });
  }

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
      icon: m[7],
      hue: +m[8],
      sortOrder: +m[9],
      published: m[10] === 'true',
      updatedAt: now(),
      subProfiles: [],
      tests: [],
    });
  }

  const links = sql.slice(sql.indexOf('profile_sub_profiles (profile_id'));
  const linkRe = /\('([a-z0-9-]+)', (\d+), (\d+)\)/g;
  const order = [];
  for (const m of links.matchAll(linkRe)) order.push({ profile: m[1], sub: +m[2], at: +m[3] });
  order.sort((a, b) => a.at - b.at).forEach((l) => profiles.get(l.profile)?.subProfiles.push(l.sub));
  return { library, profiles };
}

export function createDevStore(seedFile) {
  const { library, profiles } = parseSeed(fs.readFileSync(seedFile, 'utf8'));
  const tests = new Map(STATIC_TESTS.map((t) => [t.id, fromStatic(t)]));
  for (const p of profiles.values()) {
    const ids = [...new Set([...p.subProfiles.flatMap((id) => library.get(id)?.tests || []), ...p.tests])];
    p.prices = sumPrices(ids, tests);
  }
  let nextSubId = Math.max(0, ...library.keys()) + 1;
  const copy = (x) => structuredClone(x);
  const withSubs = (p) => {
    const subs = p.subProfiles.map((id) => library.get(id)).filter(Boolean);
    return { ...copy(p), subs: expandSubs(copy(subs), copy(p.tests)) };
  };
  const checkSubs = (ids) => {
    if (ids.some((id) => !library.has(id))) throw new HttpError(422, 'A chosen sub-profile no longer exists');
  };
  const store = ({ subs, ...p }) => ({ ...copy(p), updatedAt: now() });

  return {
    list({ publishedOnly = false } = {}) {
      return [...profiles.values()]
        .filter((p) => !publishedOnly || p.published)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map(withSubs);
    },
    create(p) {
      if (profiles.has(p.id)) throw new HttpError(409, 'A profile with this ID already exists');
      checkSubs(p.subProfiles);
      profiles.set(p.id, store(p));
    },
    update(id, p) {
      if (p.id !== id) throw new HttpError(400, 'Profile ID cannot be changed');
      if (!profiles.has(id)) throw new HttpError(404, 'Profile not found');
      checkSubs(p.subProfiles);
      profiles.set(id, store(p));
    },
    remove(id) {
      if (!profiles.delete(id)) throw new HttpError(404, 'Profile not found');
    },

    listTests() {
      return [...tests.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)).map(copy);
    },
    createTest(t) {
      if (tests.has(t.id)) throw new HttpError(409, 'A test with this ID already exists');
      tests.set(t.id, { ...copy(t), updatedAt: now() });
    },
    updateTest(id, t) {
      if (t.id !== id) throw new HttpError(400, 'Test ID cannot be changed');
      if (!tests.has(id)) throw new HttpError(404, 'Test not found');
      tests.set(id, { ...copy(t), updatedAt: now() });
    },
    removeTest(id) {
      if (!tests.has(id)) throw new HttpError(404, 'Test not found');
      const users = [
        ...[...library.values()].filter((s) => s.tests.includes(id)).map((s) => s.name),
        ...[...profiles.values()].filter((p) => p.tests.includes(id)).map((p) => p.name),
      ];
      if (users.length) throw testInUse(users);
      tests.delete(id);
    },

    listSubs() {
      const usedBy = (id) => [...profiles.values()].filter((p) => p.subProfiles.includes(id)).map((p) => p.id);
      return [...library.values()]
        .sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id)
        .map((s) => ({ ...copy(s), usedBy: usedBy(s.id) }));
    },
    createSub(s) {
      const id = nextSubId++;
      library.set(id, { id, ...copy(s), updatedAt: now() });
      return id;
    },
    updateSub(id, s) {
      if (!library.has(id)) throw new HttpError(404, 'Sub-profile not found');
      library.set(id, { id, ...copy(s), updatedAt: now() });
    },
    removeSub(id) {
      if (!library.has(id)) throw new HttpError(404, 'Sub-profile not found');
      const users = [...profiles.values()].filter((p) => p.subProfiles.includes(id));
      if (users.length) throw inUse(users.map((p) => p.name));
      library.delete(id);
    },
  };
}
