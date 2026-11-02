// Assembles src/ into "AVM Labs Website.dc.html".
//
//   node build.js          build the site file
//   node build.js --check  verify the site file is up to date (no write)
//
// src/index.html is the page skeleton. Inside it:
//   @include <path>                 (a whole line) is replaced by that file from src/
//   data-props="@settings <path>"   is filled with the JSON settings, HTML-encoded
//   @json <path>                    (inline) is replaced by that JSON file, minified
// The Claude Design runtime (support.js) only reads markup and logic from inside
// the single .dc.html file, so the output must stay one file.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'AVM Labs Website.dc.html');

const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');
const json = (rel) => JSON.stringify(JSON.parse(read(rel)));

function build() {
  return (
    read('index.html')
      .split('\n')
      .map((line) => {
        const inc = /^@include (.+)$/.exec(line);
        if (inc) return read(inc[1]).replace(/\n$/, '');
        return line
          .replace(/@settings ([^"]+)/, (_, rel) => json(rel).replace(/&/g, '&amp;').replace(/"/g, '&quot;'))
          .replace(/@json ([^\s;]+)/, (_, rel) => json(rel));
      })
      .join('\n')
      // Included files can contain directives too (e.g. @json in logic/01-data.js).
      .replace(/@json ([^\s;]+)/g, (_, rel) => json(rel))
  );
}

const html = build();
if (process.argv.includes('--check')) {
  const same = fs.existsSync(OUT) && fs.readFileSync(OUT, 'utf8') === html;
  console.log(same ? 'Up to date.' : 'OUT OF DATE — run: npm run build');
  process.exit(same ? 0 : 1);
}
fs.writeFileSync(OUT, html);
console.log('Built ' + path.basename(OUT) + ' (' + html.length + ' chars)');
