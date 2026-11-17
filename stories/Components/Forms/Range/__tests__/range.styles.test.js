const sass = require('sass');
const path = require('path');
const postcss = require('postcss');

// The track, thumb and tick marks of the slider are CSS only, and jsdom
// applies no stylesheet, so a render test cannot see a slider that vanishes in
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

const RANGE = '.mg-range';
const TICK = '.mg-range__ticks span::before';
const ENGINES = {
  WebKit: {
    track: '::-webkit-slider-runnable-track',
    thumb: '::-webkit-slider-thumb',
  },
  Mozilla: { track: '::-moz-range-track', thumb: '::-moz-range-thumb' },
};

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

const forcedRangeRules = () => {
  const rules = [];
  root.walkRules(rule => {
    if (!inForcedColours(rule)) return;
    if (!rule.selectors.some(selector => selector.startsWith(RANGE))) return;
    rules.push(rule);
  });
  return rules;
};

describe('range in forced colours', () => {
  // Forcing repaints an author background as Canvas and keeps only a system
  // colour, and the track has no border to fall back on.
  test.each(Object.entries(ENGINES))(
    'the %s track is drawn in CanvasText',
    (engine, { track }) => {
      expect(declared(`${RANGE}${track}`, { forced: true })).toEqual({
        'background-color': 'CanvasText',
      });
    }
  );

  // The edge alone left a ring with nothing in it. The fill marks the thumb
  // and the edge keeps it visible where Highlight is close to Canvas.
  test.each(Object.entries(ENGINES))(
    'the %s thumb is a Highlight fill inside a CanvasText edge',
    (engine, { thumb }) => {
      expect(declared(`${RANGE}${thumb}`, { forced: true })).toEqual({
        'background-color': 'Highlight',
        'border-color': 'CanvasText',
      });
    }
  );

  // The hover rule outranks the plain thumb rule and sets an author fill,
  // which forcing would repaint as Canvas.
  test.each(Object.entries(ENGINES))(
    'the %s thumb keeps its fill under the pointer',
    (engine, { thumb }) => {
      const selector = `${RANGE}:hover:not(:disabled)${thumb}`;

      expect(declared(selector, { forced: false })['background-color']).toBe(
        'var(--mg-color-button-background--hover)'
      );
      expect(declared(selector, { forced: true })).toEqual({
        'background-color': 'Highlight',
        'border-color': 'CanvasText',
      });
    }
  );

  test.each(Object.entries(ENGINES))(
    'a disabled slider takes GrayText in %s',
    (engine, { track, thumb }) => {
      expect(declared(`${RANGE}:disabled${track}`, { forced: true })).toEqual({
        'background-color': 'GrayText',
      });
      expect(declared(`${RANGE}:disabled${thumb}`, { forced: true })).toEqual({
        'background-color': 'GrayText',
        'border-color': 'GrayText',
      });
    }
  );

  // The disabled rules match the enabled ones in specificity or exceed them,
  // but the hover rule is excluded by :not(:disabled), so order only matters
  // against the plain rules.
  test('the disabled rules are declared after the enabled ones', () => {
    const order = forcedRangeRules().flatMap(rule => rule.selectors);

    Object.values(ENGINES).forEach(({ track, thumb }) => {
      [track, thumb].forEach(part => {
        expect(order.indexOf(`${RANGE}:disabled${part}`)).toBeGreaterThan(
          order.indexOf(`${RANGE}${part}`)
        );
      });
    });
  });

  test('the tick marks are drawn in CanvasText', () => {
    expect(declared(TICK, { forced: true })).toEqual({
      'background-color': 'CanvasText',
    });
  });

  // A browser drops a whole rule when its selector list holds a
  // pseudo-element it does not recognise.
  test('no rule mixes WebKit and Mozilla pseudo-elements', () => {
    const mixed = forcedRangeRules()
      .filter(
        rule =>
          /::-webkit-/.test(rule.selector) && /::-moz-/.test(rule.selector)
      )
      .map(rule => rule.selector);

    expect(forcedRangeRules().length).toBeGreaterThan(0);
    expect(mixed).toEqual([]);
  });

  // Nothing here opts out of forcing, so an author colour would be repainted
  // rather than shown, and the part it drew would be lost again.
  test('every colour in these rules is a system colour', () => {
    const offenders = [];
    const rules = forcedRangeRules();
    rules.forEach(rule => {
      rule.walkDecls(decl => {
        if (decl.prop === 'forced-color-adjust') {
          offenders.push(`${rule.selector} { ${decl.prop}: ${decl.value} }`);
        }
        if (/color$/.test(decl.prop) && !SYSTEM_COLOURS.includes(decl.value)) {
          offenders.push(`${rule.selector} { ${decl.prop}: ${decl.value} }`);
        }
      });
    });

    expect(offenders).toEqual([]);
  });

  // The focus ring is an outline on the thumb, which forcing repaints. These
  // rules must leave it alone.
  test('the focus ring is left to the outline', () => {
    const props = new Set();
    forcedRangeRules().forEach(rule => {
      rule.walkDecls(decl => props.add(decl.prop));
    });

    expect([...props].sort()).toEqual(['background-color', 'border-color']);
    Object.values(ENGINES).forEach(({ thumb }) => {
      expect(
        declared(`${RANGE}:focus-visible${thumb}`, { forced: false }).outline
      ).toMatch(/solid/);
    });
  });

  // The forced-colours rules must not leak into normal rendering.
  test('outside forced colours the slider rules are unchanged', () => {
    Object.values(ENGINES).forEach(({ track, thumb }) => {
      expect(
        declared(`${RANGE}${track}`, { forced: false })['background-color']
      ).toBe('rgb(var(--mg-color-neutral-300))');
      expect(
        declared(`${RANGE}${thumb}`, { forced: false })['background-color']
      ).toBe('rgb(var(--mg-color-interactive))');
      expect(
        declared(`${RANGE}:disabled${thumb}`, { forced: false })[
          'background-color'
        ]
      ).toBe('rgb(var(--mg-color-neutral-400))');
    });
    expect(declared(TICK, { forced: false })['background-color']).toBe(
      'rgb(var(--mg-color-neutral-400))'
    );
  });
});
