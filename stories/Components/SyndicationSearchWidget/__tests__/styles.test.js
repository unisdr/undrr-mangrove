/**
 * @file styles.test.js
 * @description Rules only CSS can enforce, checked in the compiled bundle:
 * reduced motion, containment of server-rendered results and block images.
 */

const sass = require('sass');
const path = require('path');

const scssDir = path.resolve(__dirname, '../../../assets/scss');
const css = sass
  .compile(path.join(scssDir, 'style.scss'), {
    loadPaths: [scssDir],
    silenceDeprecations: ['import'],
    logger: sass.Logger.silent,
  })
  .css.replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/,\s+/g, ', ');

// Every rule inside `@media (prefers-reduced-motion: reduce)` blocks, as
// "selector { declarations }" strings.
const reducedMotionRules = (() => {
  const rules = [];
  const re = /@media \(prefers-reduced-motion: reduce\)\s*\{/g;
  let match;
  while ((match = re.exec(css))) {
    let depth = 1;
    let i = re.lastIndex;
    while (depth > 0 && i < css.length) {
      if (css[i] === '{') depth += 1;
      if (css[i] === '}') depth -= 1;
      i += 1;
    }
    rules.push(css.slice(re.lastIndex, i - 1));
  }
  return rules.join('\n');
})();

const ruleIn = (source, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(
    new RegExp(`(?:^|[}\\s,])${escaped}(?:,[^{]*)?\\s*\\{([^}]*)\\}`)
  );
  return match ? match[1] : '';
};

describe('reduced motion', () => {
  test.each([
    '.mg-search__progress-bar',
    '.mg-search__skeleton-title',
    '.mg-search__skeleton-card-image',
    '.mg-search__main--stale::after',
    '.mg-search__enter',
  ])('stops the animation on %s', selector => {
    expect(ruleIn(reducedMotionRules, selector)).toMatch(/animation:\s*none/);
  });
});

describe('server-rendered results', () => {
  test('are contained', () => {
    const rule = ruleIn(css, '[data-mg-search-ssr]');
    expect(rule).toMatch(/position:\s*relative/);
    expect(rule).toMatch(/isolation:\s*isolate/);
  });

  test('and client results show card images as blocks', () => {
    expect(
      ruleIn(css, '.mg-search__result :where(.mg-card__visual) img')
    ).toMatch(/display:\s*block/);
    expect(
      ruleIn(css, '[data-mg-search-ssr] :where(.mg-card__visual) img')
    ).toMatch(/display:\s*block/);
  });
});
