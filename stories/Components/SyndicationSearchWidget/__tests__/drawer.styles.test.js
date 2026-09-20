const sass = require('sass');
const path = require('path');
const postcss = require('postcss');

// The mobile filter drawer's direction handling is CSS only, and jsdom applies
// no stylesheet, so a render test cannot see which edge the panel rests on,
// which way it slides in, or which side its shadow falls on. These guard the
// compiled output instead. See unisdr/undrr-mangrove#1204.
const SCSS_DIR = path.resolve(__dirname, '../../../assets/scss');

let root;
beforeAll(() => {
  const { css } = sass.compile(path.join(SCSS_DIR, 'style.scss'), {
    loadPaths: [SCSS_DIR],
    silenceDeprecations: ['import'],
    logger: sass.Logger.silent,
  });
  root = postcss.parse(css);
});

const normalise = selector =>
  selector.replace(/"/g, '').replace(/\s+/g, ' ').trim();

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

const inMedia = (rule, pattern) => {
  for (let node = rule.parent; node; node = node.parent) {
    if (node.type === 'atrule' && pattern.test(node.params)) return true;
  }
  return false;
};

const REDUCED_MOTION = /prefers-reduced-motion:\s*reduce/;

/** True when no at-rule wraps this rule, so it applies unconditionally. */
const unconditional = rule => {
  for (let node = rule.parent; node; node = node.parent) {
    if (node.type === 'atrule') return false;
  }
  return true;
};

const only = test => {
  const [match, ...extra] = rulesWhere(test).filter(({ rule }) =>
    unconditional(rule)
  );
  expect(match).toBeDefined();
  expect(extra).toEqual([]);
  return match.rule;
};

const panelRule = () => only(selector => selector === '.mg-search__drawer');
const panelRtlRule = () =>
  only(selector => selector === '.mg-search__drawer:dir(rtl)');

/**
 * Resolve a value's `var()` chain against a map of custom properties, so the
 * assertions can compare real lengths and offsets rather than pin the text of
 * a `var()` that could be redefined anywhere.
 */
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
  return out.replace(/\s+/g, ' ').trim();
};

/** The custom properties a rule sets, as an override map. */
const customProperties = rule =>
  Object.fromEntries(
    rule.nodes
      .filter(node => node.type === 'decl' && node.prop.startsWith('--'))
      .map(node => [node.prop, node.value])
  );

const ltr = () => customProperties(panelRule());
const rtl = () => ({ ...ltr(), ...customProperties(panelRtlRule()) });

describe('the mobile filter drawer is anchored to the inline start', () => {
  test('the panel positions itself with logical properties only', () => {
    const rule = panelRule();
    expect(declared(rule, 'inset-inline-start')).toEqual(['0']);
    expect(declared(rule, 'inset-block')).toEqual(['0']);
    // A physical edge is what #1204 was: it pins the panel to the left in
    // Arabic as well, and a later `inset-inline-start` would not undo it.
    ['left', 'right', 'top', 'bottom', 'inset'].forEach(prop => {
      expect([prop, declared(rule, prop)]).toEqual([prop, []]);
    });
    expect(declared(rule, 'position')).toEqual(['fixed']);
  });

  test('the shadow falls towards the page content in both directions', () => {
    const shadow = direction =>
      resolveVars(declared(panelRule(), 'box-shadow')[0], direction);

    // Unchanged from before #1204: the LTR panel sits on the left, so its
    // shadow is cast to the right, over the content.
    expect(shadow(ltr())).toBe('4px 0 20px rgba(0, 0, 0, 0.15)');
    // In Arabic the panel sits on the right, so the offset mirrors.
    expect(shadow(rtl())).toBe('-4px 0 20px rgba(0, 0, 0, 0.15)');
  });
});

describe('the drawer slides in from the inline start', () => {
  const keyframesFrom = name => {
    let value;
    root.walkAtRules('keyframes', atRule => {
      if (atRule.params !== name) return;
      atRule.walkRules('from', rule => {
        value = declared(rule, 'transform')[0];
      });
    });
    return value;
  };

  const animationName = () => {
    const [name] = declared(panelRule(), 'animation')[0].split(/\s+/);
    return name;
  };

  test('the panel travels on the offset it declares, not a literal', () => {
    const from = keyframesFrom(animationName());
    expect(from).toBeDefined();
    // The keyframe translates on a physical axis, so the direction has to come
    // from the panel. A literal `-100%` here would send the Arabic drawer out
    // through the left edge and back, away from where it now rests.
    expect(from).toBe('translateX(var(--mg-search-drawer-offset))');
  });

  test('it starts off-screen on the resting edge in both directions', () => {
    const from = keyframesFrom(animationName());
    // Unchanged from before #1204 in LTR.
    expect(resolveVars(from, ltr())).toBe('translateX(-100%)');
    // Mirrored, so the panel enters from the right in Arabic.
    expect(resolveVars(from, rtl())).toBe('translateX(100%)');
  });

  test('every offset the RTL rule flips is defined in the base rule', () => {
    // An undefined custom property is dropped silently, which would leave the
    // panel with no travel at all rather than the wrong travel.
    Object.keys(customProperties(panelRtlRule())).forEach(property => {
      expect([property, property in ltr()]).toEqual([property, true]);
    });
  });

  test('reduced motion drops the slide', () => {
    const [match] = rulesWhere(
      selector => selector === '.mg-search__drawer'
    ).filter(({ rule }) => inMedia(rule, REDUCED_MOTION));
    expect(match).toBeDefined();
    expect(declared(match.rule, 'animation')).toEqual(['none']);
  });
});
