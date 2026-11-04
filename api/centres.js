// GET /api/centres — every centre (country, city, address, Google Maps link, WhatsApp number) for the website
// PUT /api/centres — replace the list (admin only)
import { requireAdmin } from '../server/auth.js';
import { listCentres, parseCentres, saveCentres } from '../server/centres.js';
import { readJson, route, send } from '../server/http.js';

export default route({
  async GET(req, res) {
    send(res, 200, await listCentres(), {
      // Same caching as /api/profiles: Vercel's edge for 5 minutes, refreshed in the background.
      'Cache-Control': 'no-cache',
      'Vercel-CDN-Cache-Control': 'max-age=300, stale-while-revalidate=86400',
    });
  },
  async PUT(req, res) {
    requireAdmin(req);
    const list = parseCentres(await readJson(req));
    await saveCentres(list);
    send(res, 200, list, { 'Cache-Control': 'no-store' });
  },
});
