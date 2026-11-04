// GET /api/admin/catalog — tests (managed in the admin), countries, categories, icons and colours for the editors.
import { requireAdmin } from '../../server/auth.js';
import { CATEGORIES, COLOURS, COUNTRIES, ICONS, SAMPLES, TEST_CATEGORIES } from '../../server/catalog.js';
import { route, send } from '../../server/http.js';
import { dbReady } from '../../server/db.js';
import { listTests } from '../../server/tests.js';

export default route({
  async GET(req, res) {
    requireAdmin(req);
    const editable = !!globalThis.AVM_DEV_STORE || (await dbReady());
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
        // Until the database is up to date, tests and profiles come from the built-in lists and can't be edited.
        testsReadOnly: editable
          ? ''
          : 'Tests and profiles can’t be edited yet: run supabase/migrations/0006_b2c_profiles.sql in Supabase (after the earlier migrations, if not done). Until then the built-in tests and profiles are used.',
      },
      { 'Cache-Control': 'no-store' },
    );
  },
});
