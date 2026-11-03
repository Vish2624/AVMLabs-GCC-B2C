// PUT    /api/admin/profiles/:id — update a profile
// DELETE /api/admin/profiles/:id — delete a profile (its sub-profiles stay, for other profiles)
import { requireAdmin } from '../../../server/auth.js';
import { pathParam, readJson, route, send } from '../../../server/http.js';
import { deleteProfile, parseProfile, updateProfile } from '../../../server/profiles.js';

export default route({
  async PUT(req, res) {
    requireAdmin(req);
    const id = pathParam(req);
    await updateProfile(id, parseProfile(await readJson(req)));
    send(res, 200, { id });
  },
  async DELETE(req, res) {
    requireAdmin(req);
    await deleteProfile(pathParam(req));
    send(res, 204);
  },
});
