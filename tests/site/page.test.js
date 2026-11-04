// Checks on the built site file (npm run build), so a broken page can't be committed or deployed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { describe, it } from 'node:test';

const page = fs.readFileSync(new URL('../../AVM Labs Website.dc.html', import.meta.url), 'utf8');

describe('site file', () => {
  it('has logic that parses: a syntax error would stop the whole site from loading', () => {
    const start = page.indexOf('class Component extends DCLogic');
    const end = page.lastIndexOf('</script>');
    assert.ok(start > 0 && end > start, 'the logic script was not found');
    // Parsing only: Function() compiles the class without running it.
    assert.doesNotThrow(() => new Function('DCLogic', 'React', page.slice(start, end) + '\nreturn Component;'));
  });

  it('leaves out lab codes and short names', () => {
    assert.ok(!/"shortName"|EW_PRO|HEMOGRAM - 6 PART/.test(page));
  });
});
