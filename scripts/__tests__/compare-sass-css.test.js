const { execFileSync } = require('node:child_process');
const path = require('node:path');

// Run the ESM comparator in Node, as Jest transpiles .js source to CJS.
test('equivalence rejects declaration, font URL, cascade and selector changes', () => {
  const script = `
    import assert from 'node:assert/strict';
    import { compareSassCss } from './scripts/compare-sass-css.mjs';
    const css = '@font-face{src:url(/fonts/a.woff2)}.a{color:red;color:blue}.b{color:green}';
    assert.deepEqual(compareSassCss(css, css), {exact:true, selectorPermutations:0});
    for(const changed of [
      css.replace('a.woff2','b.woff2'),
      css.replace('color:red;color:blue','color:blue;color:red'),
      css.replace('.a{color:red;color:blue}.b{color:green}', '.b{color:green}.a{color:red;color:blue}'),
      css.replace('.a{','.x{'),
      css.replace('color:green','color:red')
    ]) assert.throws(() => compareSassCss(css, changed));
  `;
  execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: path.resolve(__dirname, '../..'),
  });
});
