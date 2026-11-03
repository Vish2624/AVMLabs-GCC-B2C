// PUT    /api/admin/subprofiles/:id — update a sub-profile (every profile using it changes too)
// DELETE /api/admin/subprofiles/:id — delete a sub-profile no profile uses
import { requireAdmin } from '../../../server/auth.js';
import { pathParam, readJson, route, send } from '../../../server/http.js';
import { deleteSubProfile, parseSubProfile, parseSubProfileId, updateSubProfile } from '../../../server/subprofiles.js';

export default route({
  async PUT(req, res) {
    requireAdmin(req);
    const id = parseSubProfileId(pathParam(req));
    await updateSubProfile(id, parseSubProfile(await readJson(req)));
    send(res, 200, { id });
  },
  async DELETE(req, res) {
    requireAdmin(req);
    await deleteSubProfile(parseSubProfileId(pathParam(req)));
    send(res, 204);
  },
});
