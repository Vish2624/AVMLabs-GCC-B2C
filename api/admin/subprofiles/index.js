// GET  /api/admin/subprofiles — all reusable sub-profiles, with the profiles using each
// POST /api/admin/subprofiles — create a sub-profile
import { requireAdmin } from '../../../server/auth.js';
import { readJson, route, send } from '../../../server/http.js';
import { createSubProfile, listSubProfiles, parseSubProfile } from '../../../server/subprofiles.js';

export default route({
  async GET(req, res) {
    requireAdmin(req);
    send(res, 200, await listSubProfiles(), { 'Cache-Control': 'no-store' });
  },
  async POST(req, res) {
    requireAdmin(req);
    const id = await createSubProfile(parseSubProfile(await readJson(req)));
    send(res, 201, { id });
  },
});
