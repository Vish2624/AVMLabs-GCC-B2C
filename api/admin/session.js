// GET    /api/admin/session  — { authed }
// POST   /api/admin/session  — log in with { password }
// DELETE /api/admin/session  — log out
import { clearedCookie, isAuthed, passwordMatches, sessionCookie } from '../../server/auth.js';
import { HttpError, readJson, route, send } from '../../server/http.js';

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

export default route({
  GET(req, res) {
    send(res, 200, { authed: isAuthed(req) }, { 'Cache-Control': 'no-store' });
  },
  async POST(req, res) {
    const { password } = await readJson(req);
    if (!passwordMatches(password)) {
      await pause(800); // slows down password guessing
      throw new HttpError(401, 'Wrong password');
    }
    send(res, 200, { authed: true }, { 'Set-Cookie': sessionCookie(req) });
  },
  DELETE(req, res) {
    send(res, 200, { authed: false }, { 'Set-Cookie': clearedCookie(req) });
  },
});
