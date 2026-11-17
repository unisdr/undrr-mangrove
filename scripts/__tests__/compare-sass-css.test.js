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

test('equivalence permits exactly four approved permutations and rejects mutations alongside them', () => {
  const script = `
    import assert from 'node:assert/strict';
    import { compareSassCss } from './scripts/compare-sass-css.mjs';
    const paragraph = '.mg-segmented-control__legend,.mg-form-group__legend,.mg-accordion>details>summary,details.mg-details>summary';
    const border = '.mg-table.mg-table--stacked.mg-table--border tr th,.mg-table.mg-table--stacked.mg-table--border tr td,.mg-table.mg-table--striped tr';
    const image = '.menu li a,' + border;
    const before = '@font-face{src:url(/a.woff2)}' + paragraph + '{font-size:1rem}@media(width >= 48em){' + paragraph + '{font-size:2rem}}' + border + '{border:none}' + image + '{background:none}.a{color:red;color:blue}.b{color:green}';
    const permitted = before.replaceAll(paragraph, paragraph.split(',').reverse().join(',')).replace(border + '{border', border.split(',').reverse().join(',') + '{border').replace(image + '{background', image.split(',').reverse().join(',') + '{background');
    assert.deepEqual(compareSassCss(before, permitted), {exact:false, selectorPermutations:4});
    for (const css of [
      permitted.replace('a.woff2','b.woff2'),
      permitted.replace('font-size:2rem','font-size:3rem'),
      permitted.replace('color:red;color:blue','color:blue;color:red'),
      permitted.replace('.a{color:red;color:blue}.b{color:green}', '.b{color:green}.a{color:red;color:blue}'),
      permitted.replace('width >= 48em','width >= 49em'),
      permitted.replace('details.mg-details>summary','details.other>summary'),
      permitted + '.extra{color:red}',
      permitted.replace('.a{','.a,.b{'),
      permitted.replace(paragraph.split(',').reverse().join(','), paragraph),
    ]) assert.throws(() => compareSassCss(before, css));
  `;
  execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: path.resolve(__dirname, '../..'),
  });
});
