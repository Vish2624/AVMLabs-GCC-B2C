// PUT    /api/admin/tests/:id — update a test (every sub-profile and profile using it changes too)
// DELETE /api/admin/tests/:id — delete a test no sub-profile or profile uses
import { requireAdmin } from '../../../server/auth.js';
import { pathParam, readJson, route, send } from '../../../server/http.js';
import { deleteTest, parseTest, updateTest } from '../../../server/tests.js';

export default route({
  async PUT(req, res) {
    requireAdmin(req);
    const id = pathParam(req);
    await updateTest(id, parseTest(await readJson(req)));
    send(res, 200, { id });
  },
  async DELETE(req, res) {
    requireAdmin(req);
    await deleteTest(pathParam(req));
    send(res, 204);
  },
});
