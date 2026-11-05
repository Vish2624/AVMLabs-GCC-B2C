// Local development server: serves the site and admin as static files and
// runs api/ handlers the way Vercel routes them.
//
//   npm run dev   ->  http://localhost:3000  (admin at /admin/)
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 3000;

if (fs.existsSync(path.join(ROOT, '.env'))) process.loadEnvFile(path.join(ROOT, '.env'));

// No ADMIN_PASSWORD locally -> skip the admin login so /admin/ opens straight away.
if (!process.env.ADMIN_PASSWORD) {
  globalThis.AVM_DEV_NO_LOGIN = true;
  console.warn('ADMIN_PASSWORD is not set: admin login is disabled on this dev server.');
}

// No Supabase key locally -> serve the built-in tests and profiles (src/data/), kept in memory.
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const { createDevStore } = await import('./dev-store.js');
  globalThis.AVM_DEV_STORE = createDevStore();
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set: using the built-in tests and profiles (in memory).');
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};
// Site pages with their own path (see setPath() in src/logic/04-navigation-cart.js) get the site file,
// like the rewrites in vercel.json.
const PAGE = /^\/((tests|profiles)(\/[^/]+)?|cart)\/?$/;
const PRIVATE = /^\/(\.env[^/]*|\.git|node_modules|server|scripts|supabase)(\/|$)/;

// /api/admin/profiles/abc -> api/admin/profiles/[id].js, like Vercel's file routing.
function findHandler(urlPath) {
  const rel = urlPath.replace(/^\/+|\/+$/g, '');
  const candidates = [`${rel}.js`, `${rel}/index.js`, `${path.posix.dirname(rel)}/[id].js`];
  return candidates
    .map((c) => path.join(ROOT, c))
    .find((f) => f.startsWith(path.join(ROOT, 'api')) && fs.existsSync(f));
}

async function serveApi(req, res, urlPath) {
  const file = findHandler(urlPath);
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Not found' }));
  }
  const { default: handler } = await import(pathToFileURL(file).href + '?t=' + fs.statSync(file).mtimeMs);
  await handler(req, res);
}

function serveStatic(res, urlPath) {
  if (urlPath === '/' || PAGE.test(urlPath)) urlPath = '/AVM Labs Website.dc.html';
  // Written by scripts/sitemap.js during `npm run build`.
  if (urlPath === '/sitemap.xml') urlPath = '/public/sitemap.xml';
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT + path.sep) || PRIVATE.test(urlPath)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      // Like Vercel, which serves public/404.html.
      res.writeHead(404, { 'Content-Type': TYPES['.html'] });
      return res.end(fs.readFileSync(path.join(ROOT, '404.html')));
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
}

http
  .createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://local').pathname);
      if (urlPath.startsWith('/api/')) await serveApi(req, res, urlPath);
      else if (urlPath === '/admin') res.writeHead(301, { Location: '/admin/' }).end();
      // The About page is gone; old links go home, like the redirect in vercel.json.
      else if (/^\/about\/?$/.test(urlPath)) res.writeHead(301, { Location: '/' }).end();
      else serveStatic(res, urlPath);
    } catch (err) {
      console.error(err);
      if (!res.headersSent) res.writeHead(500);
      res.end();
    }
  })
  .listen(PORT, () => console.log(`Dev server on http://localhost:${PORT}  (admin: http://localhost:${PORT}/admin/)`));
