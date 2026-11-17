const sass = require('sass');
const path = require('path');
const postcss = require('postcss');

// The checked state of a checkbox or radio is CSS only, and jsdom applies no
// stylesheet, so a render test cannot see a control that looks unchecked in
// forced colours. These guard the compiled output instead.
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
const SYSTEM_COLOURS = [
  'Canvas',
  'CanvasText',
  'Highlight',
  'HighlightText',
  'GrayText',
  'ButtonText',
];

const CHECKBOX = '.mg-form-check__input--checkbox';
const RADIO = '.mg-form-check__input--radio';
const INPUT = '.mg-form-check__input';

const inForcedColours = rule => {
  for (let node = rule.parent; node; node = node.parent) {
    if (node.type === 'atrule' && FORCED.test(node.params)) return true;
  }
  return false;
};

const inSupports = rule => {
  for (let node = rule.parent; node; node = node.parent) {
    if (node.type === 'atrule' && node.name === 'supports') return node.params;
  }
  return null;
};

/** Declarations of every rule that lists `selector`, as `{ prop: value }`. */
const declared = (selector, { forced, supports = false }) => {
  const found = {};
  root.walkRules(rule => {
    if (!rule.selectors.includes(selector)) return;
    if (inForcedColours(rule) !== forced) return;
    if (Boolean(inSupports(rule)) !== supports) return;
    rule.walkDecls(decl => {
      found[decl.prop] = decl.value;
    });
  });
  return found;
};

describe('checkbox and radio in forced colours', () => {
  // Forcing repaints an author fill as Canvas and keeps only a system colour.
  test('a checked checkbox is filled with Highlight', () => {
    const checked = declared(`${CHECKBOX}:checked`, { forced: true });

    expect(checked['background-color']).toBe('Highlight');
    expect(checked['border-color']).toBe('Highlight');
  });

  // The image is one fixed colour, so it cannot contrast with Highlight in
  // every palette. The fill alone has to read as checked.
  test('a checked checkbox does not rely on the tick image', () => {
    const checked = declared(`${CHECKBOX}:checked`, { forced: true });

    expect(checked['background-image']).toBe('none');
  });

  // A mask clips the focus outline unless mask-clip: no-clip is honoured, so
  // the cut-out tick may only apply where it is.
  test('the cut-out tick is gated on mask-clip: no-clip', () => {
    const selector = `${CHECKBOX}:checked`;
    const ungated = declared(selector, { forced: true });
    const gated = declared(selector, { forced: true, supports: true });

    expect(Object.keys(ungated).filter(prop => /mask/.test(prop))).toEqual([]);
    expect(gated['mask-clip']).toBe('no-clip');
    expect(gated['mask-composite']).toBe('exclude');
    expect(gated['mask-image']).toMatch(/^url\(.+\),\s*linear-gradient\(/s);

    let params;
    root.walkRules(rule => {
      if (rule.selectors.includes(selector) && inSupports(rule)) {
        params = inSupports(rule);
      }
    });
    expect(params).toMatch(/mask-clip:\s*no-clip/);
  });

  // Forcing drops box-shadow, which draws the dot outside forced colours.
  test('a checked radio draws its dot with a fill, not a shadow', () => {
    const checked = declared(`${RADIO}:checked`, { forced: true });

    expect(checked['background-color']).toBe('Highlight');
    expect(checked['background-clip']).toBe('content-box');
    expect(checked.padding).toBe('3px');
    expect(checked['box-shadow']).toBeUndefined();
  });

  test('a disabled control takes GrayText, checked or not', () => {
    expect(declared(`${INPUT}:disabled`, { forced: true })).toEqual({
      'border-color': 'GrayText',
    });
    expect(
      declared(`${CHECKBOX}:disabled:checked`, { forced: true })[
        'background-color'
      ]
    ).toBe('GrayText');
    expect(
      declared(`${RADIO}:disabled:checked`, { forced: true })[
        'background-color'
      ]
    ).toBe('GrayText');
  });

  // The disabled edge matches the checked checkbox's edge in specificity, so
  // it must come later to win.
  test('the disabled edge is declared after the checked fill', () => {
    const order = [];
    root.walkRules(rule => {
      if (!inForcedColours(rule) || inSupports(rule)) return;
      rule.selectors.forEach(selector => {
        if (selector.startsWith(INPUT)) order.push(selector);
      });
    });

    expect(order.indexOf(`${INPUT}:disabled`)).toBeGreaterThan(
      order.indexOf(`${CHECKBOX}:checked`)
    );
  });

  // Nothing here opts out of forcing, so an author colour would be repainted
  // rather than shown, and the state it carried would be lost again.
  test('every colour in these rules is a system colour', () => {
    const offenders = [];
    root.walkRules(rule => {
      if (!inForcedColours(rule) || inSupports(rule)) return;
      if (!rule.selectors.some(selector => selector.startsWith(INPUT))) return;
      rule.walkDecls(/color$/, decl => {
        if (!SYSTEM_COLOURS.includes(decl.value)) {
          offenders.push(`${rule.selector} { ${decl.prop}: ${decl.value} }`);
        }
      });
    });

    expect(offenders).toEqual([]);
  });

  // The forced-colours rules must not leak into normal rendering.
  test('outside forced colours the checked rules are unchanged', () => {
    const checkbox = declared(`${CHECKBOX}:checked`, { forced: false });
    const radio = declared(`${RADIO}:checked`, { forced: false });

    expect(Object.keys(checkbox).sort()).toEqual([
      'background-color',
      'background-image',
      'border-color',
    ]);
    expect(checkbox['background-image']).toMatch(/^url\(/);
    expect(Object.keys(radio).sort()).toEqual([
      'background-color',
      'box-shadow',
    ]);
    expect(radio['box-shadow']).toMatch(/^inset 0 0 0 3px /);
  });
});
