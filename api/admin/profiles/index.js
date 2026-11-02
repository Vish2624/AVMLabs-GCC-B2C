// GET  /api/admin/profiles — all profiles, including unpublished
// POST /api/admin/profiles — create a profile
import { requireAdmin } from '../../../server/auth.js';
import { readJson, route, send } from '../../../server/http.js';
import { createProfile, listProfiles, parseProfile } from '../../../server/profiles.js';

export default route({
  async GET(req, res) {
    requireAdmin(req);
    send(res, 200, await listProfiles(), { 'Cache-Control': 'no-store' });
  },
  async POST(req, res) {
    requireAdmin(req);
    const profile = parseProfile(await readJson(req));
    await createProfile(profile);
    send(res, 201, { id: profile.id });
  },
});
