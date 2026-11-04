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
        // Cached at Vercel's edge for 5 minutes and refreshed in the background, so visitors never wait for a cold
        // function; admin changes show within about 5 minutes. Browsers always ask again: with their own
        // stale-while-revalidate they would keep showing the previous answer.
        'Cache-Control': 'no-cache',
        'Vercel-CDN-Cache-Control': 'max-age=300, stale-while-revalidate=86400',
      },
    );
  },
});
