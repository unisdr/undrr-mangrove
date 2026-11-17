import assert from 'node:assert/strict';
import postcss from 'postcss';

// These are the only selector lists reordered by Dart Sass when legacy
// global @extend becomes an extension of an upstream module (#683).
const EXTEND_LISTS = [
  '.mg-segmented-control__legend,.mg-form-group__legend,.mg-accordion>details>summary,details.mg-details>summary',
  '.mg-table.mg-table--stacked.mg-table--border tr th,.mg-table.mg-table--stacked.mg-table--border tr td,.mg-table.mg-table--striped tr',
  '.menu li a,.mg-table.mg-table--stacked.mg-table--border tr th,.mg-table.mg-table--stacked.mg-table--border tr td,.mg-table.mg-table--striped tr',
].map(selector => postcss.list.comma(selector).sort().join(','));

export function compareSassCss(before, after) {
  if (before === after) return { exact: true, selectorPermutations: 0 };
  const baseline = postcss.parse(before);
  const candidate = postcss.parse(after);
  const beforeRules = [];
  const afterRules = [];
  baseline.walkRules(rule => beforeRules.push(rule));
  candidate.walkRules(rule => afterRules.push(rule));
  assert.equal(afterRules.length, beforeRules.length, 'CSS rule count changed');
  let selectorPermutations = 0;
  beforeRules.forEach((rule, index) => {
    const other = afterRules[index];
    if (rule.selector === other.selector) return;
    const members = postcss.list.comma(rule.selector).sort().join(',');
    assert.ok(
      EXTEND_LISTS.includes(members),
      `Unexpected selector change: ${rule.selector}`
    );
    assert.equal(
      postcss.list.comma(other.selector).sort().join(','),
      members,
      'Selector membership changed'
    );
    other.selector = rule.selector;
    selectorPermutations += 1;
  });
  // Preserve every declaration, at-rule, rule position and compressed byte
  // outside those lists; never sort rules or declarations to hide a change.
  assert.equal(
    candidate.toString(),
    before,
    'CSS differs beyond approved selector permutations'
  );
  assert.equal(
    selectorPermutations,
    4,
    'Expected exactly four @extend list permutations'
  );
  return { exact: false, selectorPermutations };
}
