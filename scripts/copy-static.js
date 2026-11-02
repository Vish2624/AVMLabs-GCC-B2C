// Copies the files Vercel should serve into public/. Run by `npm run build`
// after build.js. Only the site and admin go out as static files; api/ is
// deployed separately as serverless functions.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public');

const FILES = [
  ['AVM Labs Website.dc.html', 'index.html'],
  ['support.js'], ['icon.js'], ['image-slot.js'], ['.image-slots.state.json'],
  ['assets'], ['admin'],
];

fs.rmSync(OUT, { recursive: true, force: true });
for (const [from, to = from] of FILES) {
  fs.cpSync(path.join(ROOT, from), path.join(OUT, to), { recursive: true });
}
console.log('Copied static files to public/');
