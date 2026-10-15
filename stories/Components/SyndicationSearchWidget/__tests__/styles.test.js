/**
 * @file styles.test.js
 * @description Rules only CSS can enforce, checked in the compiled bundle:
 * reduced motion, containment of server-rendered results and block images.
 */

const sass = require('sass');
const path = require('path');
const postcss = require('postcss');

const scssDir = path.resolve(__dirname, '../../../assets/scss');
const css = sass
  .compile(path.join(scssDir, 'style.scss'), {
    loadPaths: [scssDir],
    silenceDeprecations: ['import'],
    logger: sass.Logger.silent,
  })
  .css.replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/,\s+/g, ', ');

const ruleIn = (source, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(
    new RegExp(`(?:^|[}\\s,])${escaped}(?:,[^{]*)?\\s*\\{([^}]*)\\}`)
  );
  return match ? match[1] : '';
};

describe('optional motion leaves usable static states', () => {
  const root = postcss.parse(css);
  const gated = rule => {
    for (let node = rule.parent; node; node = node.parent) {
      if (
        node.type === 'atrule' &&
        /prefers-reduced-motion:\s*no-preference/.test(node.params)
      )
        return true;
    }
    return false;
  };

  test('every widget animation/transition and legacy hidden state is gated', () => {
    const violations = [];
    root.walkRules(rule => {
      if (
        !rule.selector.includes('.mg-search') &&
        !rule.selector.includes('.mg-select')
      )
        return;
      rule.walkDecls(decl => {
        const motion = /^(animation|transition)(-|$)/.test(decl.prop);
        const hidden =
          rule.selector.includes('.mg-search__result--pending') &&
          decl.prop === 'opacity' &&
          decl.value === '0';
        if ((motion || hidden) && !gated(rule))
          violations.push(`${rule.selector}: ${decl.toString()}`);
      });
    });
    expect(violations).toEqual([]);
  });

  test('bespoke moving progress, shimmer and pulse have been removed', () => {
    expect(css).not.toMatch(/mg-search-(progress|shimmer|pulse)/);
    expect(css).not.toContain('.mg-search__progress-bar');
  });

  test('skeleton shapes remain visible without colour backgrounds', () => {
    root.walkRules(rule => {
      if (!rule.selector.includes('.mg-search__skeleton-title')) return;
      let forced = false;
      for (let node = rule.parent; node; node = node.parent) {
        if (
          node.type === 'atrule' &&
          /forced-colors:\s*active/.test(node.params)
        )
          forced = true;
      }
      if (forced)
        expect(rule.toString()).toContain('outline: 1px solid GrayText');
    });
    expect(css).toContain('outline: 1px solid GrayText');
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
