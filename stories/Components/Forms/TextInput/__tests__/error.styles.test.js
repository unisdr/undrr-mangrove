const sass = require('sass');
const path = require('path');
const postcss = require('postcss');

// The error state of a control is CSS only, and jsdom applies no stylesheet,
// so a render test cannot see an invalid control that looks valid in forced
// colours. These guard the compiled output instead.
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

// Every Forms control whose error state is a red edge. The switch has its own
// rules and its own guard in Checkbox/__tests__/switch.styles.test.js.
const INVALID = [
  '.mg-form-input--error',
  '.mg-form-textarea--error',
  '.mg-form-select--error',
  '.mg-form-check__input--error',
  '.mg-form-group--error',
];

const CHECKBOX = '.mg-form-check__input--checkbox';
const CHECKED_INVALID = `${CHECKBOX}:where(.mg-form-check__input--error):checked`;

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

describe('error state in forced colours', () => {
  // Outside forced colours the error is a red edge and nothing else, which
  // forcing repaints as CanvasText, the colour of a valid edge.
  test.each(INVALID)('%s is a red edge outside forced colours', selector => {
    expect(declared(selector, { forced: false })).toEqual({
      'border-color': 'rgb(var(--mg-color-red-900))',
    });
  });

  // No system colour means "error", so the cue cannot be a colour. A dashed
  // edge survives every palette.
  test.each(INVALID)('%s has a dashed edge in forced colours', selector => {
    expect(declared(selector, { forced: true })).toEqual({
      'border-style': 'dashed',
    });
  });

  // An outline is the focus ring, and a box-shadow is dropped by forcing. An
  // error drawn with either would be lost or hide the ring.
  test('the cue leaves the focus ring alone', () => {
    const props = new Set();
    root.walkRules(rule => {
      if (!inForcedColours(rule)) return;
      if (!rule.selectors.some(selector => INVALID.includes(selector))) return;
      rule.walkDecls(decl => props.add(decl.prop));
    });

    expect([...props]).toEqual(['border-style']);
  });

  // A checked checkbox has a Highlight edge on a Highlight fill that runs
  // under it, where dashes would not show.
  test('a checked invalid checkbox keeps a visible dashed edge', () => {
    expect(declared(CHECKED_INVALID, { forced: true })).toEqual({
      'background-clip': 'padding-box',
      'border-color': 'CanvasText',
    });
  });

  // :where() keeps the rule at the specificity of the checked fill and the
  // disabled edge, so it must sit between them to beat one and yield to the
  // other.
  test('the checked invalid edge sits between the checked and disabled rules', () => {
    const order = [];
    root.walkRules(rule => {
      if (!inForcedColours(rule)) return;
      if (rule.parent.type === 'atrule' && rule.parent.name === 'supports') {
        return;
      }
      order.push(...rule.selectors);
    });
    const at = order.indexOf(CHECKED_INVALID);

    expect(at).toBeGreaterThan(order.indexOf(`${CHECKBOX}:checked`));
    expect(at).toBeLessThan(order.indexOf('.mg-form-check__input:disabled'));
  });
});
