/**
 * Mangrove 2.0 token contract — compiled-CSS assertions.
 *
 * The 2.0 migration's safety claim is "the compiled output is equivalent and
 * each brand's tokens live in a `.mg-theme-{brand}` block." Nothing else
 * verifies that, so a mistyped token or a vanished theme block would ship
 * silently. This suite compiles the SCSS entry points and asserts the
 * structural invariants the release depends on. It intentionally checks
 * compiled output (not source) because that is what consumers actually load.
 */
const fs = require('fs');
const path = require('path');
const sass = require('sass');
const {
  perceptualContrast,
  THRESHOLD,
} = require('../../../../scripts/lib/perceptual-contrast.cjs');
const { version } = require('../../../../package.json');

const SCSS_DIR = path.resolve(__dirname, '..');
const BRANDS = ['preventionweb', 'irp', 'mcr', 'delta'];
/**
 * Mangrove's v2 tab colours are var() chains onto theme-owned values, so they
 * are re-emitted inside every runtime theme block rather than declared once at
 * :root — see stories/assets/scss/_tokens-tabs.scss for why. If that mixin
 * ever stops being included in a theme, the tab silently keeps the base
 * theme's colours.
 */
const RUNTIME_TAB_TOKENS = [
  'color',
  'color--hover',
  'color--active',
  'background--hover',
  'background--active',
  'rail-background',
  'rail-border',
  'indicator--hover',
  'indicator--active',
];

// Memoised: the same handful of entry points are compiled by four describe
// blocks, and Sass compilation dominates this file's runtime.
const compiled = new Map();
function compile(entry) {
  if (!compiled.has(entry)) {
    compiled.set(
      entry,
      sass.compile(path.join(SCSS_DIR, `${entry}.scss`), {
        loadPaths: [SCSS_DIR],
        silenceDeprecations: ['import'],
        logger: sass.Logger.silent,
      }).css
    );
  }
  return compiled.get(entry);
}

describe('Mangrove 2.0 token contract (compiled CSS)', () => {
  let base;
  let brandCss;
  let allCss;

  beforeAll(() => {
    base = compile('style');
    brandCss = Object.fromEntries(BRANDS.map(b => [b, compile(`style-${b}`)]));
    allCss = compile('style-all');
  });

  test('base :root emits the palette as channel triplets', () => {
    expect(base).toMatch(/--mg-color-blue-900:\s*0 79 145/);
  });

  test('base bundle carries no brand theme block', () => {
    expect(base).not.toMatch(/\.mg-theme-/);
  });

  test('every bundle identifies the package version in its preserved banner', () => {
    ['style', ...BRANDS.map(b => `style-${b}`), 'style-all'].forEach(name => {
      expect(bundleName(name)).toContain(`Version: ${version}`);
    });
  });

  describe.each(BRANDS)('per-brand bundle: style-%s', brand => {
    test('is activated by its own theme marker and no other', () => {
      const css = brandCss[brand];
      // The marker proves the brand's _theme-*.scss block compiled in — this is
      // the guard against a theme block silently vanishing from the build.
      expect(css).toMatch(new RegExp(`--mg-theme-loaded:\\s*${brand}\\b`));
      BRANDS.filter(other => other !== brand).forEach(other => {
        expect(css).not.toMatch(
          new RegExp(`--mg-theme-loaded:\\s*${other}\\b`)
        );
      });
    });

    test('still carries the base :root palette', () => {
      expect(brandCss[brand]).toMatch(/--mg-color-blue-900:\s*0 79 145/);
    });

    test('refreshes the v2 tab tokens inside the runtime theme', () => {
      const themeBlock = brandCss[brand].match(
        new RegExp(`\\.mg-theme-${brand}\\s*\\{([^}]*)\\}`)
      )?.[1];

      RUNTIME_TAB_TOKENS.forEach(token => {
        expect(themeBlock).toMatch(new RegExp(`--mg-tab-${token}:`));
      });
    });
  });

  test('combined style-all bundle carries every brand theme', () => {
    BRANDS.forEach(brand => {
      expect(allCss).toMatch(new RegExp(`--mg-theme-loaded:\\s*${brand}\\b`));
      expect(allCss).toMatch(new RegExp(`\\.mg-theme-${brand}\\b`));
    });
  });

  const bundleName = name => {
    if (name === 'style' || name === 'style-all')
      return name === 'style' ? base : allCss;
    return brandCss[name.replace('style-', '')];
  };
  const ALL_BUNDLES = ['style', ...BRANDS.map(b => `style-${b}`), 'style-all'];

  // Components standardized on `rgb(var(--x) / a)`; `rgba(var(` is the classic
  // typo that renders inconsistently across browsers.
  test.each(ALL_BUNDLES)(
    '%s leaks no $mg- SCSS variable and no rgba(var(',
    name => {
      const css = bundleName(name);
      expect(css).not.toMatch(/\$mg-/);
      expect(css).not.toContain('rgba(var(');
    }
  );
});

/* -------------------------------------------------------------------------
 * Shared contrast machinery.
 *
 * Contrast is a property of the RESOLVED token chain, not of any one file, so
 * it cannot be reviewed by reading the stylesheet. Everything below resolves a
 * token the way a browser would — walking var() chains with balanced-paren
 * parsing, honouring theme-block shadowing, and compositing alpha — so the two
 * contrast suites that follow measure what is actually painted.
 * ---------------------------------------------------------------------- */
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
// Translucent tokens (selected surfaces) must be composited before measuring.
const flatten = (fg, bg) =>
  fg.a === 1
    ? fg
    : {
        r: fg.r * fg.a + bg.r * (1 - fg.a),
        g: fg.g * fg.a + bg.g * (1 - fg.a),
        b: fg.b * fg.a + bg.b * (1 - fg.a),
        a: 1,
      };

// oklch() reaches the token layer from design-tool exports (DELTA's hero title
// arrives that way). Without this it would parse as null and be reported as a
// missing token, which is a false alarm rather than a finding.
const oklchToRgb = (L, C, H) => {
  const hue = (H * Math.PI) / 180;
  const a = C * Math.cos(hue);
  const b = C * Math.sin(hue);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.089484178 * a - 1.291485548 * b) ** 3;
  const encode = channel => {
    const v =
      channel <= 0.0031308
        ? 12.92 * channel
        : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
    return Math.min(255, Math.max(0, Math.round(v * 255)));
  };
  return {
    r: encode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: encode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: encode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    a: 1,
  };
};

const parseColor = value => {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  const hex = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h =
      hex[1].length === 3 ? [...hex[1]].map(c => c + c).join('') : hex[1];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    };
  }
  const oklch = trimmed.match(
    /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*\)$/
  );
  if (oklch) {
    return oklchToRgb(
      oklch[2] === '%' ? +oklch[1] / 100 : +oklch[1],
      +oklch[3],
      +oklch[4]
    );
  }
  const fn = trimmed.match(
    /^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*([\d.]+))?\s*\)$/
  );
  if (fn) return { r: +fn[1], g: +fn[2], b: +fn[3], a: fn[4] ? +fn[4] : 1 };
  const triplet = trimmed.match(/^(\d+)\s+(\d+)\s+(\d+)$/);
  return triplet
    ? { r: +triplet[1], g: +triplet[2], b: +triplet[3], a: 1 }
    : null;
};

// Custom properties resolve at the element where they are declared, so a
// theme block's declarations must override the :root ones.
const declarations = (css, selector) => {
  const out = {};
  // Last-wins: CSS applies the final declaration at equal specificity, so
  // keeping the first would measure a value the browser never uses.
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

// var() fallbacks can themselves contain var() and rgb(), so the argument
// list has to be split on balanced parentheses rather than by regex.
const substitute = (vars, value, depth = 0) => {
  if (depth > 20 || !value || !value.includes('var(')) return value;
  let out = '';
  let i = 0;
  while (i < value.length) {
    const at = value.indexOf('var(', i);
    if (at === -1) {
      out += value.slice(i);
      break;
    }
    out += value.slice(i, at);
    let level = 0;
    let end = at + 3;
    for (; end < value.length; end++) {
      if (value[end] === '(') level++;
      else if (value[end] === ')') {
        level--;
        if (level === 0) break;
      }
    }
    const inner = value.slice(at + 4, end);
    const comma = (() => {
      let lvl = 0;
      for (let k = 0; k < inner.length; k++) {
        if (inner[k] === '(') lvl++;
        else if (inner[k] === ')') lvl--;
        else if (inner[k] === ',' && lvl === 0) return k;
      }
      return -1;
    })();
    const name = (comma === -1 ? inner : inner.slice(0, comma)).trim();
    const fallback = comma === -1 ? '' : inner.slice(comma + 1).trim();
    out += vars[name] !== undefined ? vars[name] : fallback;
    i = end + 1;
  }
  return substitute(vars, out, depth + 1);
};
const deref = (vars, value) => (substitute(vars, value) || '').trim();

const WHITE = { r: 255, g: 255, b: 255, a: 1 };

// The base theme plus every brand. Every contrast pair is measured in all
// five, because a brand can retint one end of a pair and not the other.
const ALL_THEMES = ['base', ...BRANDS];
const THEME_BLOCK = /\.mg-theme-[a-z0-9-]+\s*\{[^}]*\}/g;

/**
 * Resolve a theme's token table the way a browser would.
 *
 * Deliberately read out of the COMBINED style-all bundle, not the per-brand
 * one. A per-brand bundle contains exactly one theme block, so a flat
 * last-declaration-wins scan happens to land on the right values whether or
 * not the scan is theme-aware — which means a theme-scoping bug would not
 * show up. style-all carries all four blocks, so the two steps below have to
 * be right: strip every brand block to get the `:root` layer, then overlay
 * only the requested brand's.
 */
const themeVars = theme => {
  const css = compile('style-all');
  const vars = declarations(css.replace(THEME_BLOCK, ''), null);
  if (theme === 'base') return vars;
  const block =
    css.match(new RegExp(`\\.mg-theme-${theme}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
  for (const m of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/g))
    vars[m[1]] = m[2].trim();
  return vars;
};

/* -------------------------------------------------------------------------
 * The second measure.
 *
 * WCAG 2's ratio compares relative luminance, which is not perceptually
 * uniform, so it misjudges mid-tones, warm hues and light-on-dark. Every pair
 * defined in this file is therefore graded TWICE — once with WCAG 2 (the
 * assertions that were already here, unchanged) and once with the Oklab
 * lightness measure in scripts/lib/perceptual-contrast.cjs.
 *
 * The two measures share one pair list and one resolved colour, so a
 * disagreement between them can only ever be about the maths, never about
 * measuring different things. `docs/COLOUR-CONTRAST-METHODOLOGY.md` explains
 * the calibration and the limitations.
 * ---------------------------------------------------------------------- */

/**
 * Which perceptual threshold a pair is graded against.
 *
 * Derived from the WCAG role the pair ALREADY declares, rather than restated:
 * a 4.5 minimum is SC 1.4.3 normal text, and a 3 minimum is either SC 1.4.3
 * large text or SC 1.4.11 non-text, which the `why` field distinguishes.
 * BODY_TEXT and LARGE_TEXT/NON_TEXT are the two calibrated anchors (#767676
 * and #949494 on white); LARGE_TEXT and NON_TEXT happen to share a value
 * because WCAG 2's 3:1 boundary serves both, so they are kept apart by name
 * only, to keep the reported role honest.
 */
const perceptualRole = (min, why = '') => {
  if (min >= 4.5) return ['BODY_TEXT', THRESHOLD.BODY_TEXT];
  return /large text/i.test(why)
    ? ['LARGE_TEXT', THRESHOLD.LARGE_TEXT]
    : ['NON_TEXT', THRESHOLD.NON_TEXT];
};

const triple = ({ r, g, b }) => [r, g, b];
const perceptual = (fg, bg) =>
  Number(perceptualContrast(triple(fg), triple(bg)).toFixed(1));

/**
 * Every measured pair in this file, graded by both measures, computed once.
 *
 * The two contrast suites and the disagreement report all read this table, so
 * the WCAG verdict and the perceptual verdict are guaranteed to describe the
 * same composited pixels. Memoised because compositing is cheap but the Sass
 * compile behind `compile()` is not.
 */
let MEASUREMENTS = null;
const measurements = () => {
  if (MEASUREMENTS) return MEASUREMENTS;
  const rows = [];

  const grade = ({ suite, theme, name, min, why, foreground, backdrop }) => {
    const row = {
      suite,
      theme,
      name,
      min,
      why,
      key: `${suite}|${theme}|${name}`,
    };
    const [role, floor] = perceptualRole(min, why);
    row.role = role;
    row.floor = floor;
    if (!foreground || !backdrop) {
      rows.push(row);
      return row;
    }
    const solidBg = flatten(backdrop, WHITE);
    const solidFg = flatten(foreground, solidBg);
    row.ratio = Number(contrast(solidFg, solidBg).toFixed(2));
    row.score = perceptual(solidFg, solidBg);
    row.wcagPasses = row.ratio >= min;
    row.perceptualPasses = row.score >= floor;
    rows.push(row);
    return row;
  };

  // Component tokens including hover and active states, resolved out of the
  // combined bundle with the theme block overlaid.
  for (const theme of ALL_THEMES) {
    const vars = themeVars(theme);
    const resolve = token =>
      token.startsWith('--') ? deref(vars, vars[token]) : token;
    for (const pair of COMPONENT_PAIRS) {
      let backdrop = WHITE;
      let resolved = true;
      for (const token of [...pair.bg].reverse()) {
        const layer = parseColor(resolve(token));
        if (!layer) {
          resolved = false;
          break;
        }
        backdrop = flatten(layer, backdrop);
      }
      grade({
        suite: 'component',
        theme,
        name: pair.name,
        min: pair.min,
        why: pair.why,
        foreground: parseColor(resolve(pair.fg)),
        backdrop: resolved ? backdrop : null,
      });
    }
  }

  MEASUREMENTS = rows;
  return rows;
};

const measurement = key => {
  const row = measurements().find(candidate => candidate.key === key);
  if (!row) throw new Error(`no measurement for ${key}`);
  return row;
};

/**
 * The perceptual half of a pair's verdict, asserted the same way the WCAG half
 * is: a recorded exception must STILL fail and must not get worse, so a fix
 * deletes the exception rather than hiding behind it.
 */
const assertPerceptual = (row, exception) => {
  const label = `${row.score} — ${row.role} needs ${row.floor} — ${row.why}`;
  if (!exception) {
    expect(label).toBe(
      row.perceptualPasses
        ? label
        : `at least ${row.floor} — ${row.role} — ${row.why}`
    );
    return;
  }
  const [recorded] = exception;
  expect(`${row.score} vs the ${row.floor} this pair needs`).toBe(
    row.perceptualPasses
      ? `now passing, so remove this exception (${recorded} was recorded)`
      : `${row.score} vs the ${row.floor} this pair needs`
  );
  // ...and no worse than when it was recorded. 0.1 is the rounding step.
  expect(row.score).toBeGreaterThanOrEqual(recorded - 0.1);
};

/**
 * Mangrove stores colours as channel triplets ("0 79 145") so they can be used
 * with an alpha via `rgb(var(--x) / 0.5)`. A triplet is only valid inside
 * rgb(); dropped raw into a colour position it makes the whole declaration
 * invalid, and CSS discards it silently.
 *
 * That is not theoretical. `--mg-border-color-button` was a triplet consumed
 * inside a `border:` shorthand, so border-style fell back to none and
 * .mg-button-outline, which relies on that border for its entire shape,
 * rendered as bare coloured text. The variant was broken from the day it
 * shipped and no test caught it.
 */
describe('channel triplets are never used raw in a colour position', () => {
  const TRIPLET = /^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/;
  const COLOUR_PROP =
    /(^|[{;\s])(border|border-top|border-right|border-bottom|border-left|border-block|border-block-end|border-block-start|border-inline|border-inline-end|border-inline-start|border-color|border-[a-z-]+-color|background|background-color|color|outline|outline-color|box-shadow|fill|stroke|text-decoration-color)\s*:/;

  test('no Sass source drops a triplet token into a colour declaration', () => {
    const compiled = compile('style');
    const declared = {};
    for (const m of compiled.matchAll(/(--mg-[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/g))
      if (!(m[1] in declared)) declared[m[1]] = m[2].trim();

    const isTriplet = (name, depth = 0) => {
      if (depth > 10) return false;
      const value = declared[name];
      if (!value) return false;
      if (TRIPLET.test(value)) return true;
      const alias = value.match(/^var\(\s*(--mg-[a-z0-9-]+)\s*\)$/);
      return alias ? isTriplet(alias[1], depth + 1) : false;
    };
    const triplets = new Set(
      Object.keys(declared).filter(name => isTriplet(name))
    );

    const offenders = [];
    const walk = dir => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!/node_modules|__tests__/.test(full)) walk(full);
        } else if (entry.name.endsWith('.scss')) {
          fs.readFileSync(full, 'utf8')
            .split('\n')
            .forEach((line, index) => {
              if (!COLOUR_PROP.test(line)) return;
              for (const m of line.matchAll(/var\(\s*(--mg-[a-z0-9-]+)/g)) {
                if (!triplets.has(m[1])) continue;
                // Already inside rgb()/rgba()? then it is correct.
                if (/rgba?\([^)]*$/.test(line.slice(0, m.index))) continue;
                offenders.push(
                  `${path.relative(process.cwd(), full)}:${index + 1} ${m[1]}`
                );
              }
            });
        }
      }
    };
    walk(path.resolve(__dirname, '../../../../stories'));

    expect(offenders).toEqual([]);
  });
});

describe('brand-owned surfaces resolve from semantic tokens', () => {
  // A raw palette alias in a themed surface compiles and looks right in the
  // brand it was written for, so nothing catches it until someone opens another
  // theme. --mg-hero-gradient-color was blue-900 for exactly that reason: the
  // line above it already used --mg-color-hero, and every non-blue brand drew a
  // UNDRR-blue hero. See unisdr/undrr-mangrove#1115.
  const PALETTE =
    /var\(\s*--mg-color-(blue|green|teal|orange|red|purple|yellow|neutral)-\d{2,3}\s*\)/;

  test.each([
    ['stories/Components/Hero/hero.scss', '--mg-hero-gradient-color'],
    ['stories/Components/Hero/hero.scss', '--mg-hero-cta-color'],
  ])('%s does not set %s from the raw palette', (file, prop) => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../../', file),
      'utf8'
    );
    const offenders = source
      .split('\n')
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.includes(`${prop}:`) && PALETTE.test(line))
      .map(({ index }) => `${file}:${index + 1}`);
    expect(offenders).toEqual([]);
  });
});

// The page itself. Asserted rather than assumed, because every pair whose
// lowest layer is translucent composites down onto it.
const PAGE = '--mg-color-neutral-0';

/**
 * fg  — the painted foreground token, or a literal the component hardcodes.
 * bg  — background layers, nearest first; the page is the implicit floor.
 * min — 4.5 (SC 1.4.3 normal text) or 3 (SC 1.4.3 large text / SC 1.4.11).
 */
const COMPONENT_PAIRS = [
  // --- Buttons: cta-button.scss ------------------------------------------
  {
    name: 'button label on primary background',
    fg: '--mg-color-button',
    bg: ['--mg-color-button-background'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-button-primary label text',
  },
  {
    name: 'button label on primary background, hover',
    fg: '--mg-color-button',
    bg: ['--mg-color-button-background--hover'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-button-primary:hover label text',
  },
  {
    name: 'button label on secondary background',
    fg: '--mg-color-button',
    bg: ['--mg-color-button-secondary-background'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-button-secondary label text',
  },
  {
    name: 'button label on secondary background, hover',
    fg: '--mg-color-button',
    bg: ['--mg-color-button-secondary-background--hover'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-button-secondary:hover label text',
  },
  {
    name: 'outline primary button label on the page',
    fg: '--mg-color-button-outline-primary',
    bg: [],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-button-outline is transparent; label and border are the same token',
  },
  {
    name: 'outline primary button label, hover fill',
    fg: '--mg-color-button',
    bg: ['--mg-color-button-outline-primary--hover'],
    min: 4.5,
    why: 'SC 1.4.3 — outline button fills on hover and the label flips to --mg-color-button',
  },
  {
    name: 'outline secondary button label on the page',
    fg: '--mg-color-button-outline-secondary',
    bg: [],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-button-secondary.mg-button-outline label text',
  },
  {
    name: 'outline secondary button label, hover fill',
    fg: '--mg-color-button',
    bg: ['--mg-color-button-outline-secondary--hover'],
    min: 4.5,
    why: 'SC 1.4.3 — outline secondary fills on hover',
  },
  {
    name: 'editorial CTA label on the page',
    fg: '--mg-color-text',
    bg: [],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-button-cta is a transparent text button',
  },
  {
    name: 'editorial CTA label on the page, hover',
    fg: '--mg-color-interactive-active',
    bg: [],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-button-cta:hover recolours its label',
  },
  {
    name: 'editorial CTA chevron badge, resting',
    fg: PAGE,
    bg: ['--mg-color-interactive'],
    min: 3,
    why: 'SC 1.4.11 — the ::after chevron is a graphical affordance, not the label',
  },
  {
    name: 'editorial CTA chevron badge, hover',
    fg: PAGE,
    bg: ['--mg-color-interactive-active'],
    min: 3,
    why: 'SC 1.4.11 — .mg-button-cta:hover::after retints the badge',
  },

  // --- Quiet sharing controls ------------------------------------------
  {
    name: 'share copy label',
    fg: '--mg-color-text',
    bg: ['--mg-color-neutral-25'],
    min: 4.5,
    why: 'SC 1.4.3 — URL and copied feedback on the quiet copy surface',
  },
  {
    name: 'share control hover',
    fg: '--mg-color-text',
    bg: ['--mg-color-neutral-50'],
    min: 4.5,
    why: 'SC 1.4.3 — copy text and icons on the neutral hover surface',
  },

  // --- Tags: tag.scss ----------------------------------------------------
  // Filled tags use neutral-0; outline tags keep the themed foreground.
  {
    name: 'tag label',
    fg: '--mg-color-neutral-0',
    bg: ['--mg-color-tag'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tag label text',
  },
  {
    name: 'tag label, hover',
    fg: '--mg-color-neutral-0',
    bg: ['--mg-color-tag--hover'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tag:hover',
  },
  {
    name: 'secondary tag label',
    fg: '--mg-color-neutral-0',
    bg: ['--mg-color-tag-secondary'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tag--secondary',
  },
  {
    name: 'secondary tag label, hover',
    fg: '--mg-color-neutral-0',
    bg: ['--mg-color-tag-secondary--hover'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tag--secondary:hover',
  },
  {
    name: 'accent tag label',
    fg: '--mg-color-neutral-0',
    bg: ['--mg-color-tag-accent'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tag--accent',
  },
  {
    name: 'accent tag label, hover',
    fg: '--mg-color-neutral-0',
    bg: ['--mg-color-tag-accent--hover'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tag--accent:hover',
  },
  {
    name: 'outline tag label on the page',
    fg: '--mg-color-tag',
    bg: [],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tag--outline is transparent; label and border share the token',
  },
  {
    name: 'outline tag label, hover fill',
    fg: '--mg-color-tag',
    bg: ['--mg-color-blue-50'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tag--outline:hover keeps the label and tints the fill',
  },

  // --- Legacy tabs: tab.scss `.mg-tabs` ----------------------------------
  {
    name: 'legacy tab label, inactive',
    fg: '--mg-color-text-tab',
    bg: ['--mg-color-tab-background--inactive'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tabs__link resting label',
  },
  {
    name: 'legacy tab label, hover',
    fg: '--mg-color-text-tab--hover',
    bg: ['--mg-color-tab-background--hover'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tabs__link:hover and :focus-visible share this rule',
  },
  {
    name: 'legacy tab label, active',
    fg: '--mg-color-text-tab-active',
    bg: ['--mg-color-tab-background'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tabs__link.is-active',
  },
  {
    name: 'legacy tab empty-filter message',
    fg: '--mg-color-text-tab-no-results',
    bg: ['--mg-color-tab-section-background'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-tabs__no-results sits in the tab panel',
  },

  // --- v2 tabs: tab.scss `.mg-tabs--horizontal` --------------------------
  // The rail uses an opaque surface; active and hover fills composite on it.
  {
    name: 'v2 tab label, resting',
    fg: '--mg-tab-color',
    bg: ['--mg-tab-rail-background'],
    min: 4.5,
    why: 'SC 1.4.3 — horizontal tab label on the rail surface',
  },
  {
    name: 'v2 tab label, hover',
    fg: '--mg-tab-color--hover',
    bg: ['--mg-tab-rail-background', '--mg-tab-background--hover'],
    min: 4.5,
    why: 'SC 1.4.3 — hover tints the tab and recolours the label',
  },
  {
    name: 'v2 tab label, active',
    fg: '--mg-tab-color--active',
    bg: ['--mg-tab-rail-background', '--mg-tab-background--active'],
    min: 4.5,
    why: 'SC 1.4.3 — selected label on its brand-tinted pill',
  },
  {
    name: 'v2 tab indicator, active',
    fg: '--mg-tab-indicator--active',
    bg: ['--mg-tab-rail-background', '--mg-tab-background--active'],
    min: 3,
    why: 'SC 1.4.11 — selected pill border remains distinct from its inner fill',
  },

  // --- Form controls: _form-base.scss ------------------------------------
  {
    name: 'input value text',
    fg: '--mg-color-text',
    bg: ['--mg-form-input-background'],
    min: 4.5,
    why: 'SC 1.4.3 — typed value on the resting field',
  },
  {
    name: 'input value text, focused/filled field',
    fg: '--mg-color-text',
    bg: ['--mg-form-input-background--focus'],
    min: 4.5,
    why: 'SC 1.4.3 — the field lifts to a second surface on focus and when filled',
  },
  {
    name: 'input placeholder',
    fg: '--mg-color-neutral-500',
    bg: ['--mg-form-input-background'],
    min: 4.5,
    why: 'SC 1.4.3 — ::placeholder is text',
  },
  {
    name: 'input border',
    fg: '--mg-form-input-border-color',
    bg: [],
    min: 3,
    why: 'SC 1.4.11 — the border is the only thing defining the field boundary',
  },
  {
    name: 'input border, focused',
    fg: '--mg-color-form-focus',
    bg: ['--mg-form-input-background--focus'],
    min: 3,
    why: 'SC 1.4.11 — focus recolours the border against the lifted surface',
  },
  {
    name: 'checkbox/radio border, resting',
    fg: '--mg-color-form-check',
    bg: [],
    min: 3,
    why: 'SC 1.4.11 — an unchecked control is nothing but its 2px border',
  },
  {
    name: 'checkbox/radio border, hover',
    fg: '--mg-color-form-check--hover',
    bg: [],
    min: 3,
    why: 'SC 1.4.11 — :hover recolours that border',
  },
  {
    name: 'checkbox/radio fill, checked',
    fg: '--mg-color-form-check--checked',
    bg: [],
    min: 3,
    why: 'SC 1.4.11 — the fill is how checked is identified',
  },
  {
    name: 'checkbox tick glyph on the checked fill',
    fg: '#fff',
    bg: ['--mg-color-form-check--checked'],
    min: 3,
    why: 'SC 1.4.11 — the tick is an inline SVG stroked #fff by _form-base.scss',
  },
  {
    name: 'field error message',
    fg: '--mg-color-red-900',
    bg: [],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-form-error, and .mg-form-label--required::after',
  },
  {
    name: 'error summary text on its tinted panel',
    fg: '--mg-color-red-900',
    bg: ['--mg-color-red-50'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-form-error-summary__title and its links',
  },
  {
    name: 'form help text',
    fg: '--mg-color-neutral-500',
    bg: [],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-form-help',
  },
  {
    name: 'focus ring against the page',
    fg: '--mg-color-focus-ring',
    bg: [],
    min: 3,
    why: 'SC 1.4.11 — buttons and fields draw the ring on the page, inside a --mg-color-neutral-0 separator',
  },

  // --- Focus ring: every surface it is actually painted on ---------------
  //
  // The headline change of 2.0.0-alpha.3 is that the focus ring stopped being
  // the brand colour, and until now only the two pairs above tested it. These
  // pairs measure the ring where the stylesheets actually paint it, so the
  // numbers stop living as hand-computed prose in code comments.
  //
  // The load-bearing one is the first: mg-focus-ring draws a
  // --mg-color-neutral-0 separator band immediately inside the ring, so the
  // indicator is judged against that band rather than against whatever it
  // happens to sit on. That pair is what makes the ring safe on an arbitrary
  // consumer background, and it is the contract the two-band geometry rests
  // on. The surface pairs below it are defence in depth: they say what the
  // ring would measure if the band were ever removed.
  {
    name: 'focus ring against its own separator band',
    fg: '--mg-color-focus-ring',
    bg: ['--mg-color-neutral-0'],
    min: 3,
    why: 'SC 1.4.11 — the two-band contract: mg-focus-ring paints this band inside the ring, so this is the pair that holds on ANY background',
  },
  {
    name: 'focus ring on the gallery letterbox',
    fg: '--mg-color-focus-ring',
    bg: ['--mg-color-neutral-50'],
    min: 3,
    why: 'SC 1.4.11 — .mg-gallery__arrow and __thumbnail draw the ring clear of the pill, on the neutral-50 letterbox',
  },
  {
    name: 'focus ring on the mega-menu section link tint',
    fg: '--mg-color-focus-ring',
    // The tint is written inline as rgb(var(--mg-color-blue-900) / 0.15).
    // blue-900 is a UNDRR primitive that no sub-brand overrides, so the
    // composited value is the same in all five themes.
    bg: ['rgb(0 79 145 / 0.15)'],
    min: 3,
    why: 'SC 1.4.11 — .mg-mega-content__section-list-link tints its own background on focus, and the ring is drawn on that tint',
  },
  {
    name: 'focus ring on the form error summary',
    fg: '--mg-color-focus-ring',
    bg: ['--mg-color-red-50'],
    min: 3,
    why: 'SC 1.4.11 — .mg-form-error-summary takes focus programmatically after a failed submit, and the ring lands on its red-50 fill',
  },
  // Both of these fail on their own, and that is the whole reason the ring is
  // two-band. They are exposed to consumers as .mg-u-background-color--*
  // utilities, so any component can be dropped onto them; the separator band
  // is what rescues the indicator. Recorded rather than deleted so that if the
  // band is ever removed from mg-focus-ring, the suite says what breaks.
  {
    name: 'focus ring on the neutral-200 utility background',
    fg: '--mg-color-focus-ring',
    bg: ['--mg-color-neutral-200'],
    min: 3,
    why: 'SC 1.4.11 — .mg-u-background-color--neutral-200 under a focused control; rescued by the separator band, not by this pair',
  },
  {
    name: 'focus ring on the neutral-300 utility background',
    fg: '--mg-color-focus-ring',
    bg: ['--mg-color-neutral-300'],
    min: 3,
    why: 'SC 1.4.11 — .mg-u-background-color--neutral-300 under a focused control; rescued by the separator band, not by this pair',
  },
  // The inverse ring is the other half of the story: it is correct on a filled
  // brand surface and wrong on a light one. Pairing it against the letterbox
  // records why Gallery keeps the default ring rather than the inverse.
  {
    name: 'inverse focus ring on the gallery letterbox',
    fg: '--mg-color-focus-ring-inverse',
    bg: ['--mg-color-neutral-50'],
    min: 3,
    why: 'SC 1.4.11 — records why Gallery must NOT use the inverse ring: white on the neutral-50 letterbox is invisible',
  },
  {
    name: 'inverse focus ring on the snackbar',
    fg: '--mg-color-focus-ring-inverse',
    bg: ['--mg-color-interactive'],
    min: 3,
    why: 'SC 1.4.11 — .mg-snackbar is filled with --mg-color-interactive and .mg-snackbar .mg-button draws the inverse ring on it',
  },
  {
    name: 'focus ring on the snackbar, for comparison',
    fg: '--mg-color-focus-ring',
    bg: ['--mg-color-interactive'],
    min: 3,
    why: 'SC 1.4.11 — records why Snackbar, Hero and TextCta use the inverse ring: the default ring cannot reach 3:1 on a filled brand surface',
  },

  // --- Data visualisation: _tokens-data-viz.scss -------------------------
  //
  // ~700 lines of new colour arrived in this release with no contrast
  // coverage at all. The only thing measuring it was
  // stories/Atom/DataVizColors/data-viz-colors.mdx, which computes ratios
  // live in the browser -- useful documentation, but it renders in a story
  // rather than failing a build, so nothing stops a regression landing.
  //
  // These tokens are declared :root-only (no .mg-theme-* block redefines
  // them), so every theme measures identically. They are still graded in all
  // five, because that is what proves they are theme-independent rather than
  // merely assumed to be.
  //
  // Chart chrome: the axis is non-text furniture under SC 1.4.11; the two
  // label tokens carry real text.
  {
    name: 'dataviz axis line on the chart surface',
    fg: '--mg-dataviz-axis',
    bg: ['--mg-dataviz-surface'],
    min: 3,
    why: 'SC 1.4.11 — the axis is a non-text graphical object a reader must perceive to read the chart',
  },
  {
    name: 'dataviz gridline on the chart surface',
    fg: '--mg-dataviz-gridline',
    bg: ['--mg-dataviz-surface'],
    min: 3,
    why: 'SC 1.4.11 — measured so the decorative intent stays a deliberate, recorded choice rather than an oversight',
  },
  {
    name: 'dataviz axis label on the chart surface',
    fg: '--mg-dataviz-label',
    bg: ['--mg-dataviz-surface'],
    min: 4.5,
    why: 'SC 1.4.3 — tick and axis labels',
  },
  {
    name: 'dataviz muted label on the chart surface',
    fg: '--mg-dataviz-muted-label',
    bg: ['--mg-dataviz-surface'],
    min: 4.5,
    why: 'SC 1.4.3 — secondary chart annotations and footnotes',
  },

  // Every categorical fill that can carry a label, against the "on" colour
  // paired with it. Slot 2 is the one that inverts to black; the pairing is
  // the whole point of the on-* tokens, so it is what gets asserted.
  ...Array.from({ length: 7 }, (unused, index) => index + 1).map(slot => ({
    name: `dataviz label on categorical fill ${slot}`,
    fg: `--mg-dataviz-on-categorical-${slot}`,
    bg: [`--mg-dataviz-categorical-${slot}`],
    min: 4.5,
    why: `SC 1.4.3 — a value label printed on categorical slot ${slot}`,
  })),

  // The Sendai target fills, same contract via --mg-sendai-on-target-*.
  ...[...'abcdefg'].map(target => ({
    name: `dataviz label on Sendai target ${target.toUpperCase()}`,
    fg: `--mg-sendai-on-target-${target}`,
    bg: [`--mg-sendai-target-${target}`],
    min: 4.5,
    why: `SC 1.4.3 — a label printed on the Sendai target ${target.toUpperCase()} fill`,
  })),

  // --- Card: card.scss ---------------------------------------------------
  {
    name: 'inverse focus ring on the hero banner',
    fg: '--mg-color-focus-ring-inverse',
    bg: ['--mg-color-hero'],
    min: 3,
    why: 'SC 1.4.11 — Hero, TextCta and Snackbar draw the ring on a filled brand surface, where --mg-color-focus-ring cannot reach 3:1',
  },
  {
    name: 'card body text',
    fg: '--mg-color-text',
    bg: ['--mg-card-background'],
    min: 4.5,
    why: 'SC 1.4.3 — the card is a raised surface, not always the page colour',
  },
  {
    name: 'card title link',
    fg: '--mg-color-interactive',
    bg: ['--mg-card-background'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-card__title a, and .mg-card__text-link',
  },
  {
    name: 'card label',
    fg: '--mg-color-tag',
    bg: ['--mg-card-background'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-card__label is small text',
  },
  {
    name: 'card title, secondary variant',
    fg: '--mg-color-secondary',
    bg: ['--mg-card-background'],
    min: 3,
    why: 'SC 1.4.3 large text — .mg-card__title is 23px bold, over 18.66px bold',
  },
  {
    name: 'card title, tertiary variant',
    fg: '--mg-color-tertiary',
    bg: ['--mg-card-background'],
    min: 3,
    why: 'SC 1.4.3 large text — .mg-card--tertiary title link',
  },
  {
    name: 'card title, quaternary variant',
    fg: '--mg-color-quaternary',
    bg: ['--mg-card-background'],
    min: 3,
    why: 'SC 1.4.3 large text — .mg-card--quaternary title link',
  },
  {
    name: 'card search-hit highlight',
    fg: '--mg-color-neutral-800',
    bg: ['--mg-color-neutral-50'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-card__title .active marks the matched term',
  },

  // --- Hero: hero.scss ---------------------------------------------------
  {
    name: 'hero body text on the split hero',
    fg: PAGE,
    bg: ['--mg-color-hero'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-hero--split has a flat token background, no photo',
  },
  {
    name: 'hero title on the split hero',
    fg: '--mg-color-hero-title',
    bg: ['--mg-color-hero'],
    min: 3,
    why: 'SC 1.4.3 large text — .mg-hero__title clamps from 38px up',
  },
  {
    name: 'hero primary CTA label',
    fg: '--mg-color-hero',
    bg: [PAGE],
    min: 4.5,
    why: 'SC 1.4.3 — the hero CTA inverts: white pill, hero-coloured label',
  },
  {
    name: 'hero secondary CTA label',
    fg: '--mg-color-hero-button-secondary-color',
    bg: ['--mg-color-hero-button-secondary-background', '--mg-color-hero'],
    min: 4.5,
    why: 'SC 1.4.3 — the secondary pill is 90% white over the hero, so it composites',
  },
  {
    name: 'hero secondary CTA border',
    fg: '--mg-border-color-hero-button-secondary',
    bg: ['--mg-color-hero'],
    min: 3,
    why: 'SC 1.4.11 — the border is the pill boundary against the hero',
  },
  {
    name: 'hero body text, secondary variant',
    fg: PAGE,
    bg: ['--mg-color-orange-800'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-hero--split.mg-hero--secondary paints orange-800 flat',
  },
  {
    name: 'hero CTA label, secondary variant',
    fg: '--mg-color-orange-800',
    bg: [PAGE],
    min: 4.5,
    why: 'SC 1.4.3 — the variant CTA is orange-800 on the white pill',
  },
  {
    name: 'hero body text, tertiary variant',
    fg: PAGE,
    bg: ['--mg-color-neutral-900'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-hero--split.mg-hero--tertiary',
  },
  {
    name: 'hero CTA label, tertiary variant',
    fg: '--mg-color-neutral-900',
    bg: [PAGE],
    min: 4.5,
    why: 'SC 1.4.3 — the variant CTA on the white pill',
  },
  {
    name: 'hero body text, quaternary variant',
    fg: PAGE,
    bg: ['--mg-color-red-800'],
    min: 4.5,
    why: 'SC 1.4.3 — .mg-hero--split.mg-hero--quaternary',
  },
  {
    name: 'hero CTA label, quaternary variant',
    fg: '--mg-color-red-800',
    bg: [PAGE],
    min: 4.5,
    why: 'SC 1.4.3 — the variant CTA on the white pill',
  },

  // --- Status label: _variables.scss + status-label.scss ------------------
  {
    name: 'status label text',
    fg: '--mg-status-label-color',
    bg: [],
    min: 4.5,
    why: 'SC 1.4.3 — the text, not the dot, is what names the status',
  },
  {
    name: 'status indicator ring',
    fg: '--mg-status-label-indicator-border-color',
    bg: [],
    min: 3,
    why: 'SC 1.4.11 — the pale swatches sit at 1.3-2.2:1, so the ring is their boundary',
  },
];

/**
 * Known, unfixed contrast failures — a to-do list, not a waiver.
 *
 * Keyed `theme|pair name`, each entry carries the measured ratio so the
 * assertion still bites: the pair must STILL fail (a fix makes this test
 * fail with "remove this exception") and must not get worse. Nothing here is
 * an exemption from WCAG; every line is a brand-colour decision that belongs
 * to a human, which is why no colour was changed to make a test pass.
 */
const WCAG_EXCEPTIONS = {
  // --- Focus ring exceptions -------------------------------------------
  //
  // These four pairs are RECORDED FAILURES BY DESIGN. Each one measures the
  // ring against a surface it is never actually judged against, because
  // mg-focus-ring always paints a --mg-color-neutral-0 separator band between
  // the ring and the surface -- see the 'focus ring against its own separator
  // band' pair, which is the one that has to pass. They are kept so that if
  // the band is ever dropped from the mixin, the suite names exactly which
  // surfaces stop working rather than going quiet.
  ...Object.fromEntries(
    ALL_THEMES.flatMap(theme => [
      [
        `${theme}|focus ring on the neutral-200 utility background`,
        [2.68, 'rescued by the two-band separator, not by this pair'],
      ],
      [
        `${theme}|focus ring on the neutral-300 utility background`,
        [1.95, 'rescued by the two-band separator, not by this pair'],
      ],
      [
        `${theme}|inverse focus ring on the gallery letterbox`,
        [1.24, 'why Gallery keeps the default ring instead of the inverse'],
      ],
    ])
  ),
  // The default ring on a filled brand surface -- the measurement that
  // justifies --mg-color-focus-ring-inverse existing at all.
  'base|focus ring on the snackbar, for comparison': [
    1.49,
    'why Snackbar/Hero/TextCta use the inverse ring',
  ],
  'preventionweb|focus ring on the snackbar, for comparison': [
    1.16,
    'why Snackbar/Hero/TextCta use the inverse ring',
  ],
  'irp|focus ring on the snackbar, for comparison': [
    1.19,
    'why Snackbar/Hero/TextCta use the inverse ring',
  ],
  'mcr|focus ring on the snackbar, for comparison': [
    2.15,
    'why Snackbar/Hero/TextCta use the inverse ring',
  ],
  'delta|focus ring on the snackbar, for comparison': [
    1.49,
    'why Snackbar/Hero/TextCta use the inverse ring',
  ],

  // The gridline is deliberately below 3:1. SC 1.4.11 exempts objects that
  // are purely decorative, and a gridline is readable-by-position rather than
  // by contrast -- the axis and the labels carry the information. Recorded
  // rather than raised so the choice is visible and cannot drift darker or
  // lighter unnoticed.
  ...Object.fromEntries(
    ALL_THEMES.map(theme => [
      `${theme}|dataviz gridline on the chart surface`,
      [1.24, 'decorative by design; the axis and labels carry the meaning'],
    ])
  ),

  // orange-900 is 2.95:1 against white. Affects the primary button and the
  // outline button's hover fill, which share the token chain.
  'preventionweb|button label on primary background, hover': [
    2.95,
    'orange-900 hover fill; needs ~orange-1000 or a dark label',
  ],
  'irp|button label on primary background, hover': [
    2.95,
    'orange-900 hover fill; needs ~orange-1000 or a dark label',
  ],
  'preventionweb|outline primary button label, hover fill': [
    2.95,
    'same orange-900 chain as the primary hover',
  ],
  'irp|outline primary button label, hover fill': [
    2.95,
    'same orange-900 chain as the primary hover',
  ],

  // The accent tag is white on orange in every theme, at rest and on hover.
  'base|accent tag label': [
    2.95,
    'orange-900 fill under #fff; darken the fill or use --mg-color-text',
  ],
  'preventionweb|accent tag label': [2.95, 'orange-900 fill under #fff'],
  'irp|accent tag label': [2.95, 'orange-900 fill under #fff'],
  'mcr|accent tag label': [2.95, 'orange-900 fill under #fff'],
  'delta|accent tag label': [2.95, 'orange-900 fill under #fff'],
  'base|accent tag label, hover': [
    2.65,
    'hover LIGHTENS to orange-800, so hover is worse than rest',
  ],
  'preventionweb|accent tag label, hover': [
    2.65,
    'hover lightens to orange-800',
  ],
  'irp|accent tag label, hover': [2.65, 'hover lightens to orange-800'],
  'mcr|accent tag label, hover': [2.65, 'hover lightens to orange-800'],
  'delta|accent tag label, hover': [2.65, 'hover lightens to orange-800'],

  // IRP's tag colour is its lighter interactive blue; the blue-50 hover wash
  // takes it under 4.5.
  'irp|outline tag label, hover fill': [
    3.99,
    'IRP tag blue on blue-50; a darker tag token or a white hover fill fixes it',
  ],

  // Legacy tabs: three brands tint the hover background without moving the
  // hover label off white.
  'irp|legacy tab label, hover': [
    2.05,
    'white label on IRP tab-background--hover',
  ],
  'mcr|legacy tab label, hover': [
    3.39,
    'white label on MCR tab-background--hover',
  ],
  'delta|legacy tab label, hover': [
    4.0,
    'white label on DELTA tab-background--hover; just short',
  ],

  // v2 tabs.

  // Card and hero share the orange secondary accent.
  'base|card title, secondary variant': [
    2.65,
    'orange-800 title link; fails even the large-text 3:1',
  ],
  'preventionweb|card title, secondary variant': [
    2.65,
    'orange-800 title link',
  ],
  'irp|card title, secondary variant': [2.65, 'orange-800 title link'],
  'mcr|card title, secondary variant': [2.65, 'orange-800 title link'],
  'delta|card title, secondary variant': [
    2.37,
    "orange-800 on DELTA's tinted card surface",
  ],
  'base|hero body text, secondary variant': [
    2.65,
    'white body copy on orange-800',
  ],
  'preventionweb|hero body text, secondary variant': [
    2.65,
    'white body copy on orange-800',
  ],
  'irp|hero body text, secondary variant': [
    2.65,
    'white body copy on orange-800',
  ],
  'mcr|hero body text, secondary variant': [
    2.65,
    'white body copy on orange-800',
  ],
  'delta|hero body text, secondary variant': [
    2.65,
    'white body copy on orange-800',
  ],
  'base|hero CTA label, secondary variant': [
    2.65,
    'orange-800 label on the white pill',
  ],
  'preventionweb|hero CTA label, secondary variant': [
    2.65,
    'orange-800 label on the white pill',
  ],
  'irp|hero CTA label, secondary variant': [
    2.65,
    'orange-800 label on the white pill',
  ],
  'mcr|hero CTA label, secondary variant': [
    2.65,
    'orange-800 label on the white pill',
  ],
  'delta|hero CTA label, secondary variant': [
    2.65,
    'orange-800 label on the white pill',
  ],

  // IRP's hero blue under a 90% white pill.
  'irp|hero secondary CTA label': [
    4.13,
    'IRP hero blue behind a 90%-white pill; marginal',
  ],
};

/**
 * Known perceptual failures, on the same terms as the WCAG table above: a
 * to-do list, not a waiver. Keyed `theme|pair name`, carrying the measured
 * Oklab score so the assertion still bites.
 *
 * A pair can appear here, in EXCEPTIONS, or in both. Where it appears in only
 * one, the two measures disagree about it, and the disagreement report at the
 * bottom of this file is the list of exactly those pairs.
 */
const PERCEPTUAL_EXCEPTIONS = {
  // Mirrors of the focus-ring and dataviz WCAG exceptions above: each pair
  // that is a recorded failure on the WCAG measure is also one here, for the
  // same reason.
  ...Object.fromEntries(
    ALL_THEMES.flatMap(theme => [
      [
        `${theme}|focus ring on the neutral-200 utility background`,
        [28.1, 'rescued by the two-band separator, not by this pair'],
      ],
      [
        `${theme}|focus ring on the neutral-300 utility background`,
        [10.9, 'rescued by the two-band separator, not by this pair'],
      ],
      [
        `${theme}|inverse focus ring on the gallery letterbox`,
        [-2.6, 'why Gallery keeps the default ring instead of the inverse'],
      ],
      [
        `${theme}|dataviz gridline on the chart surface`,
        [-2.6, 'decorative by design; the axis and labels carry the meaning'],
      ],
      // Warm mid-tones are exactly where WCAG 2 and the Oklab measure part
      // company: black on orange clears 4.5 comfortably (6.66) but sits below
      // the perceptual body-text floor. The disagreement is the finding; both
      // are recorded so neither measure gets to hide it.
      [
        `${theme}|dataviz label on categorical fill 2`,
        [
          54.6,
          'black on orange: passes WCAG 2 at 6.66, short of the Oklab floor',
        ],
      ],
      [
        `${theme}|dataviz label on Sendai target C`,
        [54.6, 'same orange fill as categorical slot 2'],
      ],
    ])
  ),
  'base|focus ring on the snackbar, for comparison': [
    -6.9,
    'why Snackbar/Hero/TextCta use the inverse ring',
  ],
  'preventionweb|focus ring on the snackbar, for comparison': [
    -18.1,
    'why Snackbar/Hero/TextCta use the inverse ring',
  ],
  'irp|focus ring on the snackbar, for comparison': [
    -20.7,
    'why Snackbar/Hero/TextCta use the inverse ring',
  ],
  'mcr|focus ring on the snackbar, for comparison': [
    6,
    'why Snackbar/Hero/TextCta use the inverse ring',
  ],
  'delta|focus ring on the snackbar, for comparison': [
    -6.9,
    'why Snackbar/Hero/TextCta use the inverse ring',
  ],

  'base|accent tag label': [46.7, 'orange-900 fill under #fff'],
  'preventionweb|accent tag label': [46.7, 'orange-900 fill under #fff'],
  'irp|accent tag label': [46.7, 'orange-900 fill under #fff'],
  'mcr|accent tag label': [46.7, 'orange-900 fill under #fff'],
  'delta|accent tag label': [46.7, 'orange-900 fill under #fff'],

  'base|accent tag label, hover': [
    42.5,
    'hover lightens to orange-800, so hover is worse than rest',
  ],
  'preventionweb|accent tag label, hover': [
    42.5,
    'hover lightens to orange-800, so hover is worse than rest',
  ],
  'irp|accent tag label, hover': [
    42.5,
    'hover lightens to orange-800, so hover is worse than rest',
  ],
  'mcr|accent tag label, hover': [
    42.5,
    'hover lightens to orange-800, so hover is worse than rest',
  ],
  'delta|accent tag label, hover': [
    42.5,
    'hover lightens to orange-800, so hover is worse than rest',
  ],

  'base|legacy tab label, active': [
    60.8,
    'a mid-tone pair just short of body-text readable (WCAG 2 disagrees: 7.47:1 clears the 4.5:1 minimum)',
  ],

  'base|error summary text on its tinted panel': [
    59.5,
    'red-900 on red-50; a warm hue at this lightness is not body-readable (WCAG 2 disagrees: 5.27:1 clears the 4.5:1 minimum)',
  ],
  'preventionweb|error summary text on its tinted panel': [
    59.5,
    'red-900 on red-50; a warm hue at this lightness is not body-readable (WCAG 2 disagrees: 5.27:1 clears the 4.5:1 minimum)',
  ],
  'irp|error summary text on its tinted panel': [
    59.5,
    'red-900 on red-50; a warm hue at this lightness is not body-readable (WCAG 2 disagrees: 5.27:1 clears the 4.5:1 minimum)',
  ],
  'mcr|error summary text on its tinted panel': [
    59.5,
    'red-900 on red-50; a warm hue at this lightness is not body-readable (WCAG 2 disagrees: 5.27:1 clears the 4.5:1 minimum)',
  ],
  'delta|error summary text on its tinted panel': [
    59.5,
    'red-900 on red-50; a warm hue at this lightness is not body-readable (WCAG 2 disagrees: 5.27:1 clears the 4.5:1 minimum)',
  ],

  'base|card title, secondary variant': [42.5, 'orange-800 title link'],
  'preventionweb|card title, secondary variant': [
    42.5,
    'orange-800 title link',
  ],
  'irp|card title, secondary variant': [42.5, 'orange-800 title link'],
  'mcr|card title, secondary variant': [42.5, 'orange-800 title link'],
  'delta|card title, secondary variant': [34.7, 'orange-800 title link'],

  'base|hero body text, secondary variant': [
    42.5,
    'white body copy on orange-800',
  ],
  'preventionweb|hero body text, secondary variant': [
    42.5,
    'white body copy on orange-800',
  ],
  'irp|hero body text, secondary variant': [
    42.5,
    'white body copy on orange-800',
  ],
  'mcr|hero body text, secondary variant': [
    42.5,
    'white body copy on orange-800',
  ],
  'delta|hero body text, secondary variant': [
    42.5,
    'white body copy on orange-800',
  ],

  'base|hero CTA label, secondary variant': [
    42.5,
    'orange-800 label on the white pill',
  ],
  'preventionweb|hero CTA label, secondary variant': [
    42.5,
    'orange-800 label on the white pill',
  ],
  'irp|hero CTA label, secondary variant': [
    42.5,
    'orange-800 label on the white pill',
  ],
  'mcr|hero CTA label, secondary variant': [
    42.5,
    'orange-800 label on the white pill',
  ],
  'delta|hero CTA label, secondary variant': [
    42.5,
    'orange-800 label on the white pill',
  ],

  'preventionweb|button label on primary background, hover': [
    46.7,
    'orange-900 hover fill under a white label',
  ],
  'irp|button label on primary background, hover': [
    46.7,
    'orange-900 hover fill under a white label',
  ],

  'preventionweb|outline primary button label, hover fill': [
    46.7,
    'same orange-900 chain as the primary hover',
  ],
  'irp|outline primary button label, hover fill': [
    46.7,
    'same orange-900 chain as the primary hover',
  ],

  'irp|outline tag label, hover fill': [54.7, 'IRP tag blue on blue-50'],

  'irp|legacy tab label, hover': [
    34.9,
    'white label on the tinted hover background',
  ],
  'mcr|legacy tab label, hover': [
    52.6,
    'white label on the tinted hover background',
  ],
  'delta|legacy tab label, hover': [
    59.8,
    'white label on the tinted hover background',
  ],

  'irp|hero secondary CTA label': [
    56.6,
    'IRP hero blue behind a 90%-white pill',
  ],

  // The widest disagreement in the file: WCAG 2 clears DELTA's hero title
  // for large text at 3.07:1, the Oklab measure puts it at 27.2 out of 50.
  'delta|hero title on the split hero': [
    27.2,
    'DELTA paints a mid-tone oklch sky blue on blue-900; the two blues are barely 27 apart (WCAG 2 disagrees: 3.07:1 clears the 3:1 minimum)',
  ],
};

/**
 * The union of both exception tables, keyed the same way. The disagreement
 * report reads this to prove that whichever measure fails a disagreeing pair
 * has actually recorded it, rather than the pair slipping between the two.
 */
const EXCEPTION_KEYS = new Set([
  ...Object.keys(WCAG_EXCEPTIONS),
  ...Object.keys(PERCEPTUAL_EXCEPTIONS),
]);

/**
 * Component-token contrast, including INTERACTIVE STATES.
 *
 * A resting-state check is a narrow slice of the design system: a hover
 * background is a different colour from the base one, and a WCAG 1.4.3 failure
 * shipped through that gap — white on DELTA's secondary-button hover at
 * 3.40:1 — because nothing here measured a `--hover` token.
 *
 * Every pair below is derived from a component stylesheet: the foreground
 * token is one a rule actually paints on the background token beneath it, read
 * out of cta-button.scss, tag.scss, tab.scss, _form-base.scss, card.scss,
 * hero.scss and _variables.scss. Pairs that merely look related by name are
 * noise and are not here.
 *
 * Thresholds are per-pair, not global:
 *   4.5 — SC 1.4.3 Contrast (Minimum), normal text.
 *   3   — SC 1.4.3 for LARGE text (>=24px, or >=18.66px bold), or SC 1.4.11
 *         Non-text Contrast for a border, control boundary, state indicator or
 *         meaningful glyph.
 * The per-pair `why` field records which of those applies and why.
 *
 * NOT asserted, deliberately:
 *   - `.mg-button.disabled`, `.mg-form-*--disabled`, `[data-disabled]`. SC
 *     1.4.3 and 1.4.11 both exempt inactive components.
 *   - `--mg-color-tab-border--active` / `--hover` against the tab bar. The
 *     legacy tab's state is carried redundantly by background AND label colour
 *     (both asserted), the underline sits on the link with the section below
 *     it rather than the bar, and picking a single backdrop for it would be
 *     inventing an adjacency the CSS does not have.
 *   - The status-label dots. _variables.scss states the case: the label text
 *     always names the status, so the swatch is decoration under SC 1.4.1 and
 *     its 1px ring is what needs the 3:1 — that ring IS asserted.
 *   - Hero titles over a photographic gradient. No token pair exists there;
 *     it needs a rendered-pixel check, not a token check.
 */
describe('component token contrast, including hover and active states', () => {
  const PAIRS = COMPONENT_PAIRS;

  const EXCEPTIONS = WCAG_EXCEPTIONS;

  test.each(ALL_THEMES)(
    '%s: the page floor --mg-color-neutral-0 really is white',
    theme => {
      // Every translucent stack composites down onto the page, so this is the
      // one value the measurements are allowed to assume.
      const vars = themeVars(theme);
      expect(parseColor(deref(vars, vars[PAGE]))).toEqual(WHITE);
    }
  );

  test('tag.scss uses the foreground token measured by the filled tag pairs', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../Atom/Tag/tag.scss'),
      'utf8'
    );
    expect(source).toMatch(
      /--mg-tag-foreground:\s*rgb\(var\(--mg-color-neutral-0\)\);/
    );
  });

  describe.each(ALL_THEMES)('%s theme', theme => {
    test.each(PAIRS.map(pair => [pair.name, pair]))('%s', (name, pair) => {
      const vars = themeVars(theme);
      const resolve = token =>
        token.startsWith('--') ? deref(vars, vars[token]) : token;

      const foreground = parseColor(resolve(pair.fg));
      // A missing token is a contract bug, not a silent pass.
      expect(`${pair.fg}: ${foreground && 'ok'}`).toBe(`${pair.fg}: ok`);

      // Composite the stack from the page upward.
      let backdrop = WHITE;
      for (const token of [...pair.bg].reverse()) {
        const layer = parseColor(resolve(token));
        expect(`${token}: ${layer && 'ok'}`).toBe(`${token}: ok`);
        backdrop = flatten(layer, backdrop);
      }

      const ratio = Number(
        contrast(flatten(foreground, backdrop), backdrop).toFixed(2)
      );
      const exception = EXCEPTIONS[`${theme}|${name}`];

      if (!exception) {
        // The test name already carries the theme and the pair; `why` names
        // the criterion in the failure output.
        expect(`${ratio}:1 — ${pair.why}`).toBe(
          ratio >= pair.min
            ? `${ratio}:1 — ${pair.why}`
            : `at least ${pair.min}:1 — ${pair.why}`
        );
        return;
      }

      const [recorded] = exception;
      // Still broken — a fix must DELETE the exception, not hide behind it.
      expect(`${ratio}:1 vs the ${pair.min}:1 this pair needs`).toBe(
        ratio < pair.min
          ? `${ratio}:1 vs the ${pair.min}:1 this pair needs`
          : `now passing, so remove this exception (${recorded}:1 was recorded)`
      );
      // ...and no worse than when it was recorded.
      expect(ratio).toBeGreaterThanOrEqual(recorded - 0.01);
    });

    // Same pair, same composited pixels, second measure.
    test.each(PAIRS.map(pair => [pair.name, pair]))(
      '%s, perceptually',
      name => {
        const row = measurement(`component|${theme}|${name}`);
        // Guards the shared table against a token silently resolving to null.
        expect(
          `${name}: ${row.score === undefined ? 'unresolved' : 'ok'}`
        ).toBe(`${name}: ok`);

        assertPerceptual(row, PERCEPTUAL_EXCEPTIONS[`${theme}|${name}`]);
      }
    );
  });
});

/* -------------------------------------------------------------------------
 * The disagreements.
 *
 * This is the artefact the second measure exists to produce. Everywhere the
 * two agree, nothing has been learned. The pairs below are the ones where
 * WCAG 2's luminance ratio and the Oklab lightness measure reach OPPOSITE
 * verdicts, and each is a place where one of the two is wrong about something
 * a person has to read.
 *
 * The list is checked in rather than merely printed, so it cannot drift
 * silently: adding a colour that WCAG 2 over-rates, or fixing one, fails this
 * test with the full before/after table in the diff.
 * ---------------------------------------------------------------------- */
describe('where the two contrast measures disagree', () => {
  const line = row =>
    [
      `${row.theme} | ${row.name}`,
      row.wcagPasses
        ? `WCAG 2 PASSES ${row.ratio}:1 (min ${row.min})`
        : `WCAG 2 fails ${row.ratio}:1 (min ${row.min})`,
      row.perceptualPasses
        ? `perceptual PASSES ${row.score} (${row.role} needs ${row.floor})`
        : `perceptual fails ${row.score} (${row.role} needs ${row.floor})`,
    ].join(' | ');

  /**
   * Every disagreement, in measurement order.
   *
   * Direction matters. They all run the same way — WCAG 2 passes a pair the
   * perceptual measure fails — which is WCAG 2 OVER-rating readability, the
   * failure mode with a user behind it. Nothing here runs the other way: no
   * pair that WCAG 2 rejects is perceptually fine, so adopting the second
   * measure loosens nothing.
   */
  const DISAGREEMENTS = [
    'base | legacy tab label, active | WCAG 2 PASSES 7.47:1 (min 4.5) | perceptual fails 60.8 (BODY_TEXT needs 63)',
    'base | error summary text on its tinted panel | WCAG 2 PASSES 5.27:1 (min 4.5) | perceptual fails 59.5 (BODY_TEXT needs 63)',
    'base | dataviz label on categorical fill 2 | WCAG 2 PASSES 6.66:1 (min 4.5) | perceptual fails 54.6 (BODY_TEXT needs 63)',
    'base | dataviz label on Sendai target C | WCAG 2 PASSES 6.66:1 (min 4.5) | perceptual fails 54.6 (BODY_TEXT needs 63)',
    'preventionweb | error summary text on its tinted panel | WCAG 2 PASSES 5.27:1 (min 4.5) | perceptual fails 59.5 (BODY_TEXT needs 63)',
    'preventionweb | dataviz label on categorical fill 2 | WCAG 2 PASSES 6.66:1 (min 4.5) | perceptual fails 54.6 (BODY_TEXT needs 63)',
    'preventionweb | dataviz label on Sendai target C | WCAG 2 PASSES 6.66:1 (min 4.5) | perceptual fails 54.6 (BODY_TEXT needs 63)',
    'irp | error summary text on its tinted panel | WCAG 2 PASSES 5.27:1 (min 4.5) | perceptual fails 59.5 (BODY_TEXT needs 63)',
    'irp | dataviz label on categorical fill 2 | WCAG 2 PASSES 6.66:1 (min 4.5) | perceptual fails 54.6 (BODY_TEXT needs 63)',
    'irp | dataviz label on Sendai target C | WCAG 2 PASSES 6.66:1 (min 4.5) | perceptual fails 54.6 (BODY_TEXT needs 63)',
    'mcr | error summary text on its tinted panel | WCAG 2 PASSES 5.27:1 (min 4.5) | perceptual fails 59.5 (BODY_TEXT needs 63)',
    'mcr | dataviz label on categorical fill 2 | WCAG 2 PASSES 6.66:1 (min 4.5) | perceptual fails 54.6 (BODY_TEXT needs 63)',
    'mcr | dataviz label on Sendai target C | WCAG 2 PASSES 6.66:1 (min 4.5) | perceptual fails 54.6 (BODY_TEXT needs 63)',
    'delta | error summary text on its tinted panel | WCAG 2 PASSES 5.27:1 (min 4.5) | perceptual fails 59.5 (BODY_TEXT needs 63)',
    'delta | dataviz label on categorical fill 2 | WCAG 2 PASSES 6.66:1 (min 4.5) | perceptual fails 54.6 (BODY_TEXT needs 63)',
    'delta | dataviz label on Sendai target C | WCAG 2 PASSES 6.66:1 (min 4.5) | perceptual fails 54.6 (BODY_TEXT needs 63)',
    'delta | hero title on the split hero | WCAG 2 PASSES 3.07:1 (min 3) | perceptual fails 27.2 (LARGE_TEXT needs 50)',
  ];

  test('the two measures disagree about exactly these pairs', () => {
    const found = measurements()
      .filter(row => row.wcagPasses !== row.perceptualPasses)
      .map(line);

    expect(found).toEqual(DISAGREEMENTS);
  });

  test('every disagreement is recorded as an exception on the failing side', () => {
    // A disagreement is only honest if the failing measure still records it as
    // an unfixed failure. This binds the report to the two exception tables:
    // a pair cannot appear here and be silently unlisted there.
    const unrecorded = measurements()
      .filter(row => row.wcagPasses !== row.perceptualPasses)
      .filter(row => !EXCEPTION_KEYS.has(`${row.theme}|${row.name}`))
      .map(line);

    expect(unrecorded).toEqual([]);
  });

  test('no pair is failed by WCAG 2 and passed perceptually', () => {
    // Stated as its own guard because the day this stops being true is the day
    // the perceptual measure starts WAIVING something the standard rejects,
    // and that needs a human decision rather than a green suite.
    const loosened = measurements()
      .filter(row => !row.wcagPasses && row.perceptualPasses)
      .map(line);

    expect(loosened).toEqual([]);
  });
});
