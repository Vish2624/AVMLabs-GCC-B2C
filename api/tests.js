// GET /api/tests — published tests for the website. Lab codes and short names stay in the admin.
import { route, send } from '../server/http.js';
import { listTests } from '../server/tests.js';

export default route({
  async GET(req, res) {
    const tests = await listTests({ publishedOnly: true });
    send(
      res,
      200,
      tests.map(({ published, updatedAt, sortOrder, code, shortName, ...t }) => t),
      {
        // Cached at Vercel's edge; admin changes show within a minute.
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    );
  },
});
