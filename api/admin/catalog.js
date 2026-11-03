// GET /api/admin/catalog — tests (managed in the admin), countries, categories, icons and colours for the editors.
import { requireAdmin } from '../../server/auth.js';
import { CATEGORIES, COLOURS, COUNTRIES, ICONS, SAMPLES, TEST_CATEGORIES } from '../../server/catalog.js';
import { route, send } from '../../server/http.js';
import { pricesReady } from '../../server/db.js';
import { listTests } from '../../server/tests.js';

export default route({
  async GET(req, res) {
    requireAdmin(req);
    const editable = !!globalThis.AVM_DEV_STORE || (await pricesReady());
    send(
      res,
      200,
      {
        tests: await listTests(),
        countries: COUNTRIES,
        categories: CATEGORIES,
        testCategories: TEST_CATEGORIES,
        samples: SAMPLES,
        icons: ICONS,
        colours: COLOURS,
        // Until migrations 0003 and 0004 run, tests come from the built-in list and can't be edited.
        testsReadOnly: editable
          ? ''
          : 'Tests and profile prices can’t be edited yet: run supabase/migrations/0003_tests.sql (if not done) and 0004_country_prices.sql in Supabase. Until then the built-in tests are used.',
      },
      { 'Cache-Control': 'no-store' },
    );
  },
});
