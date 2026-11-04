// GET /api/profiles — published profiles for the website. Lab codes and short names stay in the admin.
import { route, send } from '../server/http.js';
import { listProfiles } from '../server/profiles.js';

export default route({
  async GET(req, res) {
    const profiles = await listProfiles({ publishedOnly: true });
    send(
      res,
      200,
      profiles.map(({ published, updatedAt, sortOrder, code, shortName, ...p }) => p),
      {
        // Cached at Vercel's edge; admin changes show within a minute.
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    );
  },
});
