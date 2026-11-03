// GET  /api/admin/tests — all tests, including unpublished
// POST /api/admin/tests — create a test
import { requireAdmin } from '../../../server/auth.js';
import { readJson, route, send } from '../../../server/http.js';
import { createTest, listTests, parseTest } from '../../../server/tests.js';

export default route({
  async GET(req, res) {
    requireAdmin(req);
    send(res, 200, await listTests(), { 'Cache-Control': 'no-store' });
  },
  async POST(req, res) {
    requireAdmin(req);
    const test = parseTest(await readJson(req));
    await createTest(test);
    send(res, 201, { id: test.id });
  },
});
