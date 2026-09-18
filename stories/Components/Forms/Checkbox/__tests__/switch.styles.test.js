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
    // The track carries its inset as a transparent border at every size, so
    // forced colours only colours it. See the geometry tests for the rest.
    expect(declared(rule, 'border-color')).toEqual(['CanvasText']);
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

// ---------------------------------------------------------------------------
// A small CSS evaluator, so the geometry tests can assert real lengths rather
// than pinning the text of a calc(). Resolves var() chains (an override map
// stands in for a consumer setting a hook) and then works the arithmetic out
// in px, which is what a wrong ratio or a stale magic number gets caught by.
// ---------------------------------------------------------------------------
const splitTopLevel = text => {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '(') depth += 1;
    else if (text[i] === ')') depth -= 1;
    else if (text[i] === ',' && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
};

const resolveVars = (value, overrides = {}) => {
  let out = value;
  for (let at = out.indexOf('var('); at !== -1; at = out.indexOf('var(')) {
    let depth = 0;
    let end = at + 3;
    for (; end < out.length; end += 1) {
      if (out[end] === '(') depth += 1;
      else if (out[end] === ')') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    const [name, ...fallback] = splitTopLevel(out.slice(at + 4, end));
    const key = name.trim();
    const replacement =
      key in overrides ? overrides[key] : fallback.join(',').trim();
    out = out.slice(0, at) + replacement + out.slice(end + 1);
  }
  return out;
};

/** A length in px, or NaN if anything is left that is not arithmetic. */
const toPx = (value, overrides = {}) => {
  const expression = resolveVars(value, overrides)
    .replace(/calc\(/g, '(')
    .replace(/(-?[\d.]+)rem/g, (_, n) => `(${Number(n) * 16})`)
    .replace(/(-?[\d.]+)px/g, (_, n) => `(${n})`)
    .trim();
  if (!/^[\d\s().+\-*/]+$/.test(expression)) return NaN;

  return Number(new Function(`return ${expression};`)());
};

const SWITCH_ERROR_SELECTORS = [
  '.mg-switch__input[aria-invalid=true] + .mg-switch__track',
  '.mg-switch__input--error + .mg-switch__track',
  '.mg-switch--error .mg-switch__track',
];

// Forced colours repeats the three markups with an extra .mg-switch, so that
// each one reaches the checked Highlight fill's specificity rather than only
// the first. See "the forced-colours error rule outranks the checked fill".
const SWITCH_ERROR_SELECTORS_FORCED = [
  '.mg-switch .mg-switch__input[aria-invalid=true] + .mg-switch__track',
  '.mg-switch .mg-switch__input--error + .mg-switch__track',
  '.mg-switch.mg-switch--error .mg-switch__track',
];

/**
 * Specificity as [ids, classes, elements]; enough for the selectors here,
 * which are classes, attributes, pseudo-classes and combinators only.
 */
const specificity = selector => {
  const parts = selector.replace(/[>+~]/g, ' ').split(/\s+/).filter(Boolean);
  let classes = 0;
  let elements = 0;
  parts.forEach(part => {
    classes += (part.match(/\.[\w-]+/g) || []).length;
    classes += (part.match(/\[[^\]]+\]/g) || []).length;
    classes += (part.match(/:(?!:)[\w-]+/g) || []).length;
    elements += (part.match(/::[\w-]+/g) || []).length;
    if (/^[a-z]/i.test(part)) elements += 1;
  });
  return [0, classes, elements];
};

const atLeastAsSpecific = (a, b) => {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return true;
};

describe('switch error state follows the other form controls', () => {
  const errorRules = forced =>
    rulesWhere(selector =>
      (forced
        ? SWITCH_ERROR_SELECTORS_FORCED
        : SWITCH_ERROR_SELECTORS
      ).includes(selector)
    ).filter(({ rule }) => inMedia(rule, FORCED) === forced);

  test('all three error markups are styled, in one rule', () => {
    const [match, ...extra] = errorRules(false);
    expect(match).toBeDefined();
    expect(extra).toEqual([]);
    expect(match.selectors.sort()).toEqual([...SWITCH_ERROR_SELECTORS].sort());
  });

  test('forced colours styles the same three markups, in one rule', () => {
    const [match, ...extra] = errorRules(true);
    expect(match).toBeDefined();
    expect(extra).toEqual([]);
    expect(match.selectors.sort()).toEqual(
      [...SWITCH_ERROR_SELECTORS_FORCED].sort()
    );
  });

  // .mg-form-input--error, .mg-form-check__input--error and the rest say
  // "invalid" with border-color and nothing else. The switch had no border to
  // colour until its inset became one; now it makes the same declaration.
  test('the error is a border-color change, as it is on a text input', () => {
    const [{ rule }] = errorRules(false);
    const props = rule.nodes.filter(node => node.type === 'decl');
    expect(props.map(node => node.prop)).toEqual(['border-color']);

    const [{ rule: textInput }] = rulesWhere(
      selector => selector === '.mg-form-input--error'
    );
    expect(textInput.nodes.map(node => node.prop)).toEqual(['border-color']);
  });

  // The reported workaround painted the error with a box-shadow, which
  // replaced the focus ring's separator band. Mangrove's own error state must
  // not make the same mistake: the focus ring owns outline and box-shadow.
  test('the error state touches neither outline nor box-shadow', () => {
    const [{ rule }] = errorRules(false);
    expect(declared(rule, 'box-shadow')).toEqual([]);
    expect(declared(rule, 'outline')).toEqual([]);
  });

  test('the colour is a hook defaulting to the shared error red', () => {
    const [{ rule }] = errorRules(false);
    expect(declared(rule, 'border-color')[0]).toBe(
      'var(--mg-switch-track-border-color--error, rgb(var(--mg-color-red-900)))'
    );
  });

  // The track sets forced-color-adjust: none, so an author colour would be
  // painted unchanged in forced colours while the states around it adapt.
  test('forced colours repaints the error in a system colour and a dashed edge', () => {
    const [match] = errorRules(true);
    expect(match).toBeDefined();
    expect(declared(match.rule, 'border-color')).toEqual(['CanvasText']);
    expect(declared(match.rule, 'border-style')).toEqual(['dashed']);
  });

  // Order alone is not enough: the Highlight fill is three classes, so a
  // two-class error selector loses `border-color` to it and keeps only
  // `border-style`, painting a dashed Highlight edge on a Highlight track --
  // an invalid checked switch with no visible boundary. Every error selector
  // has to be at least as specific as the fill AND come after it.
  test('the forced-colours error rule outranks the checked fill', () => {
    const index = rule =>
      root.index(rule.parent) * 1000 + rule.parent.index(rule);
    const [error] = errorRules(true);
    const [checked] = rulesWhere(
      selector => selector === '.mg-switch__input:checked + .mg-switch__track'
    ).filter(({ rule }) => inMedia(rule, FORCED));
    expect(checked).toBeDefined();
    expect(index(error.rule)).toBeGreaterThan(index(checked.rule));

    const fill = specificity(checked.selectors[0]);
    error.selectors.forEach(selector => {
      expect([
        selector,
        atLeastAsSpecific(specificity(selector), fill),
      ]).toEqual([selector, true]);
    });
  });
});

describe('switch geometry derives from its size hooks', () => {
  const only = (test, forced = false) => {
    const [match] = rulesWhere(test).filter(
      ({ rule }) => inMedia(rule, FORCED) === forced
    );
    expect(match).toBeDefined();
    return match.rule;
  };

  const trackRule = () => only(selector => selector === '.mg-switch__track');
  const thumbRule = () => only(selector => selector === '.mg-switch__thumb');
  const travelRule = () =>
    only(
      selector =>
        selector ===
        '.mg-switch__input:checked + .mg-switch__track .mg-switch__thumb'
    );
  const rtlRule = () =>
    only(selector =>
      selector.startsWith('[dir=rtl] .mg-switch__input:checked')
    );

  const translate = rule => {
    const value = declared(rule, 'transform')[0];
    const inner = value.match(/^translateX\((.*)\)$/s);
    expect(inner).not.toBeNull();
    return inner[1];
  };

  const geometry = (overrides = {}) => {
    const track = trackRule();
    const thumb = thumbRule();
    return {
      trackInline: toPx(declared(track, 'inline-size')[0], overrides),
      trackBlock: toPx(declared(track, 'block-size')[0], overrides),
      inset: toPx(
        declared(track, 'border')[0].replace(/\s+solid\s+transparent$/, ''),
        overrides
      ),
      thumb: toPx(declared(thumb, 'inline-size')[0], overrides),
      travel: toPx(translate(travelRule()), overrides),
      travelRtl: toPx(translate(rtlRule()), overrides),
    };
  };

  // The sizes rc.2 shipped. Nothing about this change moves a default switch.
  test('the defaults are the 42x24 track, 20px thumb and 18px travel', () => {
    expect(geometry()).toEqual({
      trackInline: 42,
      trackBlock: 24,
      inset: 2,
      thumb: 20,
      travel: 18,
      travelRtl: -18,
    });
  });

  // The regression reported in unisdr/undrr-mangrove#1199: a consumer resized
  // the track and thumb, had to re-declare the transform to match, and their
  // one declaration then beat Mangrove's [dir=rtl] rule, so the thumb moved
  // the wrong way by the wrong distance in Arabic. Setting the hooks has to
  // carry both directions, at any size, with no transform in consumer CSS.
  test.each([
    ['--mg-switch-size', { '--mg-switch-size': '1.125rem' }],
    [
      'the three part hooks',
      {
        '--mg-switch-track-inline-size': '2rem',
        '--mg-switch-track-block-size': '1.125rem',
        '--mg-switch-thumb-size': '1rem',
      },
    ],
  ])('a switch resized with %s still mirrors in RTL', (_, overrides) => {
    const { travel, travelRtl, trackInline, thumb, inset } =
      geometry(overrides);

    expect(travel).toBeGreaterThan(0);
    expect(travel).toBeCloseTo(trackInline - thumb - 2 * inset, 10);
    expect(travelRtl).toBeCloseTo(-travel, 10);
  });

  test('no part of the switch box is a literal length', () => {
    const track = trackRule();
    const thumb = thumbRule();
    const literals = [
      ...declared(track, 'inline-size'),
      ...declared(track, 'block-size'),
      ...declared(thumb, 'inline-size'),
      ...declared(thumb, 'block-size'),
      translate(travelRule()),
      translate(rtlRule()),
    ].filter(value => !value.includes('var('));

    expect(literals).toEqual([]);
  });

  // Forced colours used to take 1px off a hard-coded padding to make room for
  // its border. With the inset already a border, it only sets a colour, so it
  // cannot change the travel at any size.
  test('forced colours only colours the boundary it inherited', () => {
    const rule = only(selector => selector === '.mg-switch__track', true);
    expect(declared(rule, 'border-color')).toEqual(['CanvasText']);
    expect(declared(rule, 'border')).toEqual([]);
    expect(declared(rule, 'border-width')).toEqual([]);
    expect(declared(rule, 'padding')).toEqual([]);
  });

  // The shared small variant is the proof that resizing needs one number:
  // if it had to re-declare a size or a transform, so would every consumer.
  test('the small variant re-declares no length of its own', () => {
    const [{ rule }] = rulesWhere(selector => selector === '.mg-switch--small');
    const sizeHook = rule.nodes.find(node => node.prop === '--mg-switch-size');
    expect(sizeHook).toBeDefined();
    expect(toPx(sizeHook.value)).toBe(18);
    expect(
      rule.nodes.filter(node =>
        /^(inline-size|block-size|width|height|padding|transform)$/.test(
          node.prop
        )
      )
    ).toEqual([]);
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
