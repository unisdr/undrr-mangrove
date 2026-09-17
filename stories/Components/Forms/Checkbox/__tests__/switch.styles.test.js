const sass = require('sass');
const path = require('path');
const postcss = require('postcss');

// The switch is CSS only, and jsdom applies no stylesheet, so jest-axe cannot
// see a faded focus ring or a missing forced-colours rule. These guard the
// compiled output instead.
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

// Sass drops the quotes around attribute values, so compare without them.
const normalise = selector =>
  selector.replace(/"/g, '').replace(/\s+/g, ' ').trim();

const inMedia = (rule, pattern) => {
  for (let node = rule.parent; node; node = node.parent) {
    if (node.type === 'atrule' && pattern.test(node.params)) return true;
  }
  return false;
};

const FORCED = /forced-colors:\s*active/;
const NO_MOTION_PREFERENCE = /prefers-reduced-motion:\s*no-preference/;

/** Every rule with at least one selector matching `test`. */
const rulesWhere = test => {
  const found = [];
  root.walkRules(rule => {
    const selectors = rule.selectors.map(normalise).filter(test);
    if (selectors.length) found.push({ rule, selectors });
  });
  return found;
};

const declared = (rule, prop) =>
  rule.nodes
    .filter(node => node.type === 'decl' && node.prop === prop)
    .map(node => node.value);

const TRACK = /\.mg-switch__track$/;

describe('switch focus ring is never faded', () => {
  // The track draws the focus ring (outline plus separator band), so opacity
  // on the track fades the ring. `aria-disabled` keeps the switch focusable,
  // so it must dim without opacity. `:disabled` cannot take focus, so its
  // long-standing opacity is allowed outside forced colours.
  test('no aria-disabled or focus rule puts opacity on the track', () => {
    const offenders = rulesWhere(
      selector => TRACK.test(selector) && /aria-disabled|focus/.test(selector)
    )
      .filter(({ rule }) => declared(rule, 'opacity').some(v => v !== '1'))
      .map(({ selectors }) => selectors.join(', '));

    expect(offenders).toEqual([]);
  });

  // Faded system colours lose their contrast (GrayText on Highlight at 0.45
  // composited to about 1:1), so every switch selector that fades outside
  // forced colours must be restored to full opacity inside it.
  test('forced colours restores full opacity wherever a switch part fades', () => {
    const switchRules = rulesWhere(selector => selector.includes('.mg-switch'));
    const faded = switchRules
      .filter(({ rule }) => !inMedia(rule, FORCED))
      .filter(({ rule }) => declared(rule, 'opacity').some(v => v !== '1'))
      .flatMap(({ selectors }) => selectors);
    const restored = new Set(
      switchRules
        .filter(({ rule }) => inMedia(rule, FORCED))
        .filter(({ rule }) => declared(rule, 'opacity').includes('1'))
        .flatMap(({ selectors }) => selectors)
    );
    const fadedInForced = switchRules
      .filter(({ rule }) => inMedia(rule, FORCED))
      .filter(({ rule }) => declared(rule, 'opacity').some(v => v !== '1'));

    expect(faded.length).toBeGreaterThan(0);
    expect(faded.filter(selector => !restored.has(selector))).toEqual([]);
    expect(fadedInForced).toEqual([]);
  });

  test('aria-disabled dims the track with a layer the same weight as :disabled', () => {
    const [disabled] = rulesWhere(
      selector => selector === '.mg-switch__input:disabled + .mg-switch__track'
    ).filter(({ rule }) => !inMedia(rule, FORCED));
    const opacity = Number(declared(disabled.rule, 'opacity')[0]);

    const overlay = root
      .toString()
      .match(
        /--mg-switch-track-overlay--disabled,\s*rgb\(var\(--mg-color-neutral-0\)\s*\/\s*([\d.]+)\)/
      );
    expect(overlay).not.toBeNull();
    // A page-coloured layer at (1 - opacity) paints the same pixels as the
    // track at `opacity` over the page.
    expect(Number(overlay[1])).toBeCloseTo(1 - opacity, 5);
  });
});

describe('switch in forced colours', () => {
  const forcedRule = selector =>
    rulesWhere(candidate => candidate === normalise(selector))
      .filter(({ rule }) => inMedia(rule, FORCED))
      .map(({ rule }) => rule);

  test('the focus rule drops the separator band box-shadow', () => {
    const [rule] = forcedRule(
      '.mg-switch__input:focus-visible + .mg-switch__track'
    );
    expect(rule).toBeDefined();
    expect(declared(rule, 'box-shadow')).toEqual(['none']);
  });

  test('the track boundary is a border, so the focus outline cannot replace it', () => {
    const [rule] = forcedRule('.mg-switch__track');
    expect(declared(rule, 'outline')).toEqual([]);
    expect(declared(rule, 'border')).toEqual(['1px solid CanvasText']);
    // 1px border + 1px padding keeps the 2px inset the thumb is sized for.
    expect(declared(rule, 'padding')).toEqual(['1px']);
  });

  test.each([':disabled', '[aria-disabled="true"]'])(
    'a checked %s switch uses a Canvas track and GrayText parts',
    state => {
      const rules = forcedRule(
        `.mg-switch .mg-switch__input${state}:checked + .mg-switch__track`
      );
      expect(rules.length).toBeGreaterThan(0);
      const values = prop => rules.flatMap(rule => declared(rule, prop));
      expect(values('background-color')).toContain('Canvas');
      expect(values('border-color')).toContain('GrayText');
    }
  );

  test('the spinning ring gap covers the class and aria variants, on and off', () => {
    const gap = rulesWhere(selector => selector.endsWith('::after')).filter(
      ({ rule }) =>
        inMedia(rule, FORCED) &&
        inMedia(rule, NO_MOTION_PREFERENCE) &&
        declared(rule, 'border-block-start-color').includes('transparent')
    );
    const selectors = gap.flatMap(({ selectors: list }) => list);

    expect(selectors).toEqual(
      expect.arrayContaining(
        [
          '.mg-switch__input[aria-busy="true"] + .mg-switch__track .mg-switch__thumb::after',
          '.mg-switch__input[aria-busy="true"]:checked + .mg-switch__track .mg-switch__thumb::after',
          '.mg-switch--pending .mg-switch__track .mg-switch__thumb::after',
          '.mg-switch--pending .mg-switch__input:checked + .mg-switch__track .mg-switch__thumb::after',
        ].map(normalise)
      )
    );
  });
});

describe('switch pending selectors stay symmetric', () => {
  // Every pending rule is written for both markups: aria-busy on the input
  // and the .mg-switch--pending class on the label.
  test('each rule naming aria-busy also names the pending class', () => {
    const busyRules = rulesWhere(selector =>
      selector.includes('[aria-busy=true]')
    );
    const offenders = busyRules
      .filter(({ rule }) => !rule.selectors.some(s => s.includes('--pending')))
      .map(({ selectors }) => selectors.join(', '));

    expect(busyRules.length).toBeGreaterThan(0);
    expect(offenders).toEqual([]);
  });
});
