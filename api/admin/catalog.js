// GET /api/admin/catalog — tests, categories, icons and colours for the editor.
import { requireAdmin } from '../../server/auth.js';
import { CATEGORIES, COLOURS, ICONS, TESTS } from '../../server/catalog.js';
import { route, send } from '../../server/http.js';

export default route({
  GET(req, res) {
    requireAdmin(req);
    send(res, 200, { tests: TESTS, categories: CATEGORIES, icons: ICONS, colours: COLOURS });
  },
});
