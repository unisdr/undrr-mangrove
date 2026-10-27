/**
 * Status label and empty state — resolved-token assertions.
 *
 * Both components are CSS only, so there is no render to test. What can go
 * wrong is the token chain: a colour swapped for one that no longer clears
 * WCAG 2.2 AA, or a modifier that stops pointing at its status colour. Neither
 * is visible by reading the stylesheet, because the value only exists once
 * :root, the theme block and the component file are resolved together.
 *
 * Mirrors the resolution and contrast helpers in
 * stories/assets/scss/__tests__/tokens-contract.test.js.
 */
const path = require('path');
const sass = require('sass');

const SCSS_DIR = path.resolve(__dirname, '../../../assets/scss');
const BRANDS = ['preventionweb', 'irp', 'mcr', 'delta'];

const compile = entry =>
  sass.compile(path.join(SCSS_DIR, `${entry}.scss`), {
    loadPaths: [SCSS_DIR],
    silenceDeprecations: ['import'],
    logger: sass.Logger.silent,
  }).css;

const srgb = channel => {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const luminance = ({ r, g, b }) =>
  0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const parseColor = value => {
  if (!value) return null;
  const fn = value
    .trim()
    .match(/^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*([\d.]+))?\s*\)$/);
  if (fn) return { r: +fn[1], g: +fn[2], b: +fn[3], a: fn[4] ? +fn[4] : 1 };
  const triplet = value.trim().match(/^(\d+)\s+(\d+)\s+(\d+)$/);
  return triplet
    ? { r: +triplet[1], g: +triplet[2], b: +triplet[3], a: 1 }
    : null;
};

const declarations = (css, selector) => {
  const out = {};
  for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/g))
    out[m[1]] = m[2].trim();
  if (selector) {
    const block =
      css.match(new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    for (const m of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/g))
      out[m[1]] = m[2].trim();
  }
  return out;
};

const deref = (vars, value, depth = 0) => {
  if (depth > 20 || !value || !value.includes('var('))
    return (value || '').trim();
  const at = value.indexOf('var(');
  let level = 0;
  let end = at + 3;
  for (; end < value.length; end++) {
    if (value[end] === '(') level++;
    else if (value[end] === ')') {
      level--;
      if (level === 0) break;
    }
  }
  const name = value
    .slice(at + 4, end)
    .split(',')[0]
    .trim();
  const replaced =
    value.slice(0, at) + (vars[name] ?? '') + value.slice(end + 1);
  return deref(vars, replaced, depth + 1);
};

const WHITE = { r: 255, g: 255, b: 255, a: 1 };

// The four DELTA statuses, and the token each modifier must resolve to.
const STATUS_INDICATORS = [
  ['draft', '--mg-color-accent-100'],
  ['waiting-validation', '--mg-color-accent-500'],
  ['waiting-information', '--mg-color-accent-600'],
  ['published', '--mg-color-accent-400'],
];

describe('status label + empty state tokens', () => {
  const css = {};

  beforeAll(() => {
    css.base = compile('style');
    BRANDS.forEach(brand => {
      css[brand] = compile(`style-${brand}`);
    });
  });

  const THEMES = [['base', null], ...BRANDS.map(b => [b, `.mg-theme-${b}`])];

  describe.each(THEMES)('%s theme', (theme, selector) => {
    const read = token => {
      const vars = declarations(css[theme], selector);
      return parseColor(deref(vars, vars[token]));
    };

    test.each([
      ['--mg-status-label-color', 4.5],
      ['--mg-empty-state-title-color', 4.5],
      // The empty state's supporting copy. DELTA's own boards set this at
      // black/25% (1.6:1); this token is why that value is not reproduced.
      ['--mg-empty-state-text-color', 4.5],
    ])('%s meets %s:1 on the page', (token, minimum) => {
      const colour = read(token);
      expect(colour).not.toBeNull();
      expect(Number(contrast(colour, WHITE).toFixed(2))).toBeGreaterThanOrEqual(
        minimum
      );
    });

    // SC 1.4.11: the indicator's own fill is too pale to be a boundary
    // (#f4e496 is 1.28:1 on white), so the ring is what makes the dot visible.
    test('the indicator ring meets 3:1 on the page', () => {
      const ring = read('--mg-status-label-indicator-border-color');
      expect(ring).not.toBeNull();
      expect(Number(contrast(ring, WHITE).toFixed(2))).toBeGreaterThanOrEqual(
        3
      );
    });

    test.each(STATUS_INDICATORS)(
      '--%s resolves to its DELTA swatch',
      (modifier, palette) => {
        const vars = declarations(css[theme], selector);
        expect(read(`--mg-status-label-indicator--${modifier}`)).toEqual(
          parseColor(deref(vars, vars[palette]))
        );
      }
    );
  });

  test('the shipped stylesheet carries both components', () => {
    expect(css.base).toContain('.mg-status-label__indicator');
    expect(css.base).toContain('.mg-empty-state__title');
  });

  test('neither component uses a physical box side', () => {
    // RTL: UNDRR ships Arabic, so margin-left/padding-right and friends would
    // mirror the wrong way.
    const rules = css.base.match(
      /\.mg-(?:status-label|empty-state)[^{]*\{[^}]*\}/g
    );
    expect(rules).not.toBeNull();
    expect(
      rules.filter(rule =>
        /(margin|padding|border)-(left|right|top|bottom)\s*:/.test(rule)
      )
    ).toEqual([]);
  });
});
