const sass = require('sass');
const path = require('path');
const postcss = require('postcss');

// The row variant is CSS only, and jsdom applies no stylesheet, so a render
// test cannot see a missing forced-colours rule or a rule that leaks onto a
// check without the modifier. These guard the compiled output instead.
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

const inForcedColours = rule => {
  for (let node = rule.parent; node; node = node.parent) {
    if (node.type === 'atrule' && FORCED.test(node.params)) return true;
  }
  return false;
};

/** Every rule with at least one selector matching `test`. */
const rulesWhere = test => {
  const found = [];
  root.walkRules(rule => {
    if (rule.selectors.some(test)) found.push(rule);
  });
  return found;
};

const ROW = '.mg-form-check--row';
const declarations = rule => rule.nodes.filter(node => node.type === 'decl');

describe('check row variant styles', () => {
  test('the variant is in the compiled stylesheet', () => {
    expect(rulesWhere(selector => selector === ROW).length).toBeGreaterThan(0);
  });

  // Forms and the quiz are the only places that may style a row. Everything
  // the row draws needs the modifier, so a plain radio or checkbox is not
  // affected by it.
  test('no rule gives a plain check the row presentation', () => {
    const offenders = rulesWhere(
      selector =>
        /\.mg-form-check(?![\w-])/.test(selector) &&
        !selector.includes(ROW) &&
        /:has\(/.test(selector) &&
        !selector.includes('.mg-quiz-question')
    ).map(rule => rule.selector);

    expect(offenders).toEqual([]);
  });

  test('uses logical properties, so the row mirrors under dir="rtl"', () => {
    const physical = /(^|-)(left|right)$/;
    const offenders = rulesWhere(selector => selector.includes(ROW)).flatMap(
      rule =>
        declarations(rule)
          .filter(decl => physical.test(decl.prop))
          .map(decl => `${rule.selector} { ${decl.prop} }`)
    );

    expect(offenders).toEqual([]);
  });

  test('forced colours distinguishes rest, hover or focus, checked and disabled', () => {
    const forced = rulesWhere(selector => selector.includes(ROW)).filter(
      inForcedColours
    );
    const borderOf = test =>
      forced
        .filter(rule => rule.selectors.some(test))
        .flatMap(rule =>
          declarations(rule)
            .filter(decl => decl.prop === 'border-color')
            .map(decl => decl.value)
        );

    expect(borderOf(selector => selector === ROW)).toEqual(['Canvas']);
    expect(borderOf(selector => selector === `${ROW}:hover`)).toEqual([
      'CanvasText',
    ]);
    expect(
      borderOf(selector =>
        selector.endsWith(':has(.mg-form-check__input:checked)')
      )
    ).toEqual(['Highlight']);
    expect(
      borderOf(selector =>
        selector.endsWith(':has(.mg-form-check__input:disabled:checked)')
      )
    ).toEqual(['GrayText']);
  });

  // The disabled rules match the hover, focus and checked rules in
  // specificity, so they must come later to win.
  test('the disabled row is declared after the states it cancels', () => {
    const order = [];
    root.walkRules(rule => {
      if (inForcedColours(rule)) return;
      rule.selectors.forEach(selector => {
        if (selector.startsWith(ROW)) order.push(selector);
      });
    });
    const disabled = order.indexOf(
      `${ROW}:has(.mg-form-check__input:disabled)`
    );

    expect(disabled).toBeGreaterThan(
      order.indexOf(`${ROW}:has(.mg-form-check__input:checked)`)
    );
    expect(disabled).toBeGreaterThan(order.indexOf(`${ROW}:hover`));
    expect(disabled).toBeGreaterThan(
      order.indexOf(`${ROW}:has(.mg-form-check__input:focus-visible)`)
    );
  });
});

// The quiz question uses the variant for its options and adds only the
// locked state, which must outrank the variant's hover, focus and checked
// rules.
describe('quiz question option rows', () => {
  const QUIZ_OPTION = /\.mg-quiz-question__option(?![\w-])/;

  test('every quiz option rule is for the locked state', () => {
    const unlocked = rulesWhere(selector => QUIZ_OPTION.test(selector))
      .flatMap(rule => rule.selectors)
      .filter(
        selector =>
          QUIZ_OPTION.test(selector) &&
          !/\.mg-quiz-question--(correct|revealed) /.test(selector)
      );

    expect(unlocked).toEqual([]);
  });
});
