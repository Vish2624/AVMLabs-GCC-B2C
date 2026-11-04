// Writes public/sitemap.xml with every page, test and built-in profile. Run by
// `npm run build` after copy-static.js. The site address is the canonical link in
// src/index.html; tests come from src/data/tests.json and profiles from
// src/logic/01-data.js. Profiles and tests added only in the admin are not listed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const site = /<link rel="canonical" href="([^"]+)"/.exec(read('src/index.html'))?.[1]?.replace(/\/$/, '');
const tests = JSON.parse(read('src/data/tests.json')).map((t) => t.id);
const profilesBlock = /static PROFILES = \[([\s\S]*?)\n {2}\];/.exec(read('src/logic/01-data.js'))?.[1] ?? '';
const profiles = [...profilesBlock.matchAll(/^\s*\{ id: '([^']+)'/gm)].map((m) => m[1]);
if (!site || !tests.length || !profiles.length) {
  throw new Error('sitemap: could not read the site address, tests or profiles from src/');
}

// [path, changefreq, priority]. The cart is personal and left out.
const urls = [
  ['/', 'weekly', '1.0'],
  ['/tests', 'weekly', '0.9'],
  ['/profiles', 'weekly', '0.9'],
  ['/about', 'monthly', '0.5'],
  ...profiles.map((id) => ['/profiles/' + encodeURIComponent(id), 'weekly', '0.8']),
  ...tests.map((id) => ['/tests/' + encodeURIComponent(id), 'monthly', '0.7']),
];

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls
    .map(
      ([p, freq, prio]) =>
        `  <url>\n    <loc>${site}${p}</loc>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>\n`,
    )
    .join('') +
  '</urlset>\n';

fs.mkdirSync(path.join(ROOT, 'public'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'public', 'sitemap.xml'), xml);
console.log(`Wrote public/sitemap.xml (${urls.length} URLs)`);
