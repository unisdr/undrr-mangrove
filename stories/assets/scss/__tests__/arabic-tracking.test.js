const fs = require('fs');
const path = require('path');
const sass = require('sass');
const postcss = require('postcss');

const scssDir = path.resolve(__dirname, '..');
const entries = fs
  .readdirSync(scssDir)
  .filter(name => /^style(?:-[\w-]+)?\.scss$/.test(name));

describe.each(entries)('Arabic tracking in %s', entry => {
  test('protects every Arabic element and generated label against component tracking', () => {
    const css = sass.compile(path.join(scssDir, entry), {
      logger: sass.Logger.silent,
    }).css;
    const declarations = [];
    postcss.parse(css).walkDecls('letter-spacing', declaration => {
      declarations.push(declaration);
    });
    const protectedRules = declarations.filter(
      declaration => declaration.important
    );
    expect(protectedRules).toHaveLength(1);
    expect(protectedRules[0].value).toBe('normal');
    expect(protectedRules[0].parent.selectors).toEqual([
      ':lang(ar)',
      ':lang(ar)::before',
      ':lang(ar)::after',
    ]);
    // Every other library tracking declaration is non-important, so neither
    // specificity nor later import order can displace the script constraint.
    expect(declarations.length).toBeGreaterThan(1);
  });
});

test('the documented partial-import path carries the same protection', () => {
  const css = sass.compileString('@import "variables"; @import "fonts";', {
    loadPaths: [scssDir],
    logger: sass.Logger.silent,
  }).css;
  expect(css).toMatch(
    /:lang\(ar\)::after\s*\{\s*letter-spacing: normal !important;/
  );
});
