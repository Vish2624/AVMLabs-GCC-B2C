// GET /api/admin/catalog — tests (managed in the admin), categories, icons and colours for the editors.
import { requireAdmin } from '../../server/auth.js';
import { CATEGORIES, COLOURS, ICONS, SAMPLES, TEST_CATEGORIES } from '../../server/catalog.js';
import { route, send } from '../../server/http.js';
import { tableReady } from '../../server/db.js';
import { listTests } from '../../server/tests.js';

export default route({
  async GET(req, res) {
    requireAdmin(req);
    const editable = !!globalThis.AVM_DEV_STORE || (await tableReady('tests'));
    send(
      res,
      200,
      {
        tests: await listTests(),
        categories: CATEGORIES,
        testCategories: TEST_CATEGORIES,
        samples: SAMPLES,
        icons: ICONS,
        colours: COLOURS,
        // Until migration 0003 runs, tests come from the built-in list and can't be edited.
        testsReadOnly: editable
          ? ''
          : 'Tests can’t be edited yet: run supabase/migrations/0003_tests.sql in Supabase. Until then the built-in tests are used.',
      },
      { 'Cache-Control': 'no-store' },
    );
  },
});
