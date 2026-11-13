const sass = require('sass');
const path = require('path');
const postcss = require('postcss');

// The arrow of the select is CSS only, and jsdom applies no stylesheet, so a
// render test cannot see an arrow that is lost on a dark forced palette. These
// guard the compiled output instead.
const SCSS_DIR = path.resolve(__dirname, '../../../../assets/scss');

let root;
beforeAll(() => {
  const { css } = sass.compile(path.join(SCSS_DIR, 'style.scss'), {
    loadPaths: [SCSS_DIR],
    silenceDeprecations: ['import'],
    logger: sass.Logger.silent,
  });
  root = postcss.parse(css);
});

const FORCED = /forced-colors:\s*active/;
const SELECT = '.mg-form-select';

const inForcedColours = rule => {
  for (let node = rule.parent; node; node = node.parent) {
    if (node.type === 'atrule' && FORCED.test(node.params)) return true;
  }
  return false;
};

/** Declarations of every rule that lists `selector`, as `{ prop: value }`. */
const declared = (selector, { forced }) => {
  const found = {};
  root.walkRules(rule => {
    if (!rule.selectors.includes(selector)) return;
    if (inForcedColours(rule) !== forced) return;
    rule.walkDecls(decl => {
      found[decl.prop] = decl.value;
    });
  });
  return found;
};

describe('select in forced colours', () => {
  // Forcing keeps a url() image as it is, and the image is one fixed colour,
  // so it cannot contrast with Canvas in every palette.
  test('the fixed arrow image is removed', () => {
    expect(declared(SELECT, { forced: true })['background-image']).toBe('none');
  });

  // The browser paints its own arrow in the forced text colour, which also
  // covers the disabled state and the reading direction.
  test('the arrow is handed back to the browser', () => {
    expect(declared(SELECT, { forced: true }).appearance).toBe('auto');
  });

  // No second image for dark palettes, no author colour and no opt-out: any
  // of them would leave the arrow a fixed colour again.
  test('nothing else about the select is repainted', () => {
    const props = new Set();
    const selectors = [];
    root.walkRules(rule => {
      if (!inForcedColours(rule)) return;
      const matching = rule.selectors.filter(
        selector =>
          selector.startsWith(SELECT) || selector.includes(` ${SELECT}`)
      );
      if (!matching.length) return;
      selectors.push(...matching);
      rule.walkDecls(decl => props.add(decl.prop));
    });

    expect(selectors.sort()).toEqual([SELECT, `${SELECT}--error`]);
    expect([...props].sort()).toEqual([
      'appearance',
      'background-image',
      'border-style',
    ]);
  });

  // The forced-colours rules must not leak into normal rendering.
  test('outside forced colours the select rules are unchanged', () => {
    const select = declared(SELECT, { forced: false });
    const rtl = declared(`[dir=rtl] ${SELECT}`, { forced: false });

    expect(select.appearance).toBe('none');
    expect(select['background-image']).toMatch(/^url\("data:image\/svg\+xml/);
    expect(select['background-position']).toMatch(/^right /);
    expect(rtl['background-position']).toMatch(/^left /);
  });
});
