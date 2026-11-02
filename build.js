// Assembles src/ into "AVM Labs Website.dc.html".
//
//   node build.js          build the site file
//   node build.js --check  verify the site file is up to date (no write)
//
// src/index.html is the page skeleton. Inside it:
//   @include <path>                 (a whole line) is replaced by that file from src/
//   data-props="@settings <path>"   is filled with the JSON settings, HTML-encoded
// The Claude Design runtime (support.js) only reads markup and logic from inside
// the single .dc.html file, so the output must stay one file.
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const OUT = path.join(__dirname, 'AVM Labs Website.dc.html');

const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');

function build() {
  return read('index.html')
    .split('\n')
    .map((line) => {
      const inc = /^@include (.+)$/.exec(line);
      if (inc) return read(inc[1]).replace(/\n$/, '');
      return line.replace(/@settings ([^"]+)/, (_, rel) =>
        JSON.stringify(JSON.parse(read(rel))).replace(/&/g, '&amp;').replace(/"/g, '&quot;'));
    })
    .join('\n');
}

const html = build();
if (process.argv.includes('--check')) {
  const same = fs.existsSync(OUT) && fs.readFileSync(OUT, 'utf8') === html;
  console.log(same ? 'Up to date.' : 'OUT OF DATE — run: node build.js');
  process.exit(same ? 0 : 1);
}
fs.writeFileSync(OUT, html);
console.log('Built ' + path.basename(OUT) + ' (' + html.length + ' chars)');
