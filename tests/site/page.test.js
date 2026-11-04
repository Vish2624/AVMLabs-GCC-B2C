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

  it('never labels a parameter as calculated', () => {
    assert.ok(!/Calculated|"calculated"|data-calc/.test(page));
  });

  it("sends WhatsApp messages to the centre in the visitor's city, else their country's first centre", () => {
    const start = page.indexOf('class Component extends DCLogic');
    const Component = new Function(
      'DCLogic',
      'React',
      page.slice(start, page.lastIndexOf('</script>')) + '\nreturn Component;',
    )(class {}, {});
    const at = (code, city) => {
      const c = Object.create(Component.prototype);
      Object.assign(c, { props: {}, state: { region: { code, city } } });
      return [c.centre().city, c.opts().wa];
    };
    assert.deepEqual(at('SA', 'Riyadh'), ['Riyadh', '966506399959']);
    assert.deepEqual(at('SA', 'Khobar'), ['Al Khobar', '966506399959']);
    assert.deepEqual(at('SA', 'Jeddah'), ['Al Khobar', '966506399959']);
    assert.deepEqual(at('AE', ''), ['Dubai', '971501304708']);
    assert.deepEqual(at('BH', 'Manama'), ['Manama', '97333627273']);
  });
});
