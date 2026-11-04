// In-memory stand-in for the Supabase tables (tests, sub-profiles, profiles), used by scripts/dev.js when
// SUPABASE_SERVICE_ROLE_KEY is not set. Starts from the built-in tests and profiles (src/data/), which is
// what the database holds after migration 0006; changes last until the dev server restarts.
import { STATIC_PROFILES, STATIC_TESTS } from '../server/catalog.js';
import { HttpError } from '../server/http.js';
import { expandSubs } from '../server/profiles.js';
import { inUse } from '../server/subprofiles.js';
import { fromStatic, testInUse } from '../server/tests.js';

const now = () => new Date().toISOString();

export function createDevStore() {
  const library = new Map(
    STATIC_PROFILES.library.map((s) => [
      s.id,
      { id: s.id, name: s.name, description: '', tests: [...s.tests], updatedAt: now() },
    ]),
  );
  const profiles = new Map(
    STATIC_PROFILES.profiles.map((p) => [p.id, { ...structuredClone(p), published: true, updatedAt: now() }]),
  );
  const tests = new Map(STATIC_TESTS.map((t) => [t.id, fromStatic(t)]));
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
