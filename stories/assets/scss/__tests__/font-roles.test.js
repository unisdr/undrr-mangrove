/**
 * Font role contract — compiled-CSS assertions.
 *
 * unisdr/undrr-mangrove#1098 replaced Mangrove's font-family SCSS variables
 * with five role custom properties (`--mg-font-family-text` / `-heading` /
 * `-display` / `-ui` / `-code`). A component names the job the type is doing;
 * one map re-points the roles per script. The migration's safety claim is
 * "Latin output is byte-identical and Arabic routing happens in one place".
 *
 * A byte-identical Latin diff proves a lot, but it is structurally blind to
 * three things, and each of them has already bitten this change once:
 *
 *  1. Which role a component names. Re-pointing `.mg-tag`, `.mg-tabs__link` or
 *     `.mg-breadcrumb` from `ui` to `text` changes the Latin face from Roboto
 *     Condensed to Roboto on every page — and used to pass the whole suite,
 *     because nothing asserted the assignment. Nor did anything notice when
 *     the `heading` role lost its last consumer, which silently removes Noto
 *     Kufi Arabic from the product. See `describe('every component names the
 *     role it is meant to')`.
 *  2. Build paths. `style-gutenberg.scss` does not import `_foundational.scss`;
 *     a role reference with no definition in scope is invalid at
 *     computed-value time, the declaration is dropped, and the element falls
 *     back to Times. This actually happened twice during #1098. The mirror
 *     failure is worse because it is not invalid at all: the shared import
 *     list every UNDRR Drupal theme compiles reaches `_fonts.scss`,
 *     `_foundational.scss` and `_utility.scss` and no entry point, so while
 *     the Arabic map lived in a file only the entry points reached it carried
 *     the Latin map with no Arabic map behind it, and every Arabic glyph on
 *     every production site fell back to the OS default. See
 *     `describe('the shared Drupal import list')`.
 *  3. Sass variables a consumer sets before the import. The removed names are
 *     silent no-ops now, so the removal is only safe while the `@warn` guard
 *     covers every one of them.
 *
 * Assertions run against compiled CSS, not source, because compiled output is
 * what consumers load. `tokens-contract.test.js` is the sibling suite for the
 * colour and spacing half of the same contract.
 */
const fs = require('fs');
const path = require('path');
const sass = require('sass');

const SCSS_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const STORIES_DIR = path.resolve(__dirname, '../../..');

/** Every entry point Mangrove ships. */
const BUNDLES = [
  'style',
  'style-preventionweb',
  'style-irp',
  'style-mcr',
  'style-delta',
  'style-all',
  'style-gutenberg',
];

const ROLES = ['text', 'heading', 'display', 'ui', 'code'];

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

const withoutComments = css => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Split on `separator` at paren depth 0 — `:is(a, b)` must stay intact. */
function splitBalanced(input, separator) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of input) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === separator && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.map(part => part.trim()).filter(Boolean);
}

/**
 * Every `(selector, declarations)` pair in `css`, one entry per selector in a
 * selector list. Declarations are last-wins, as the cascade is.
 */
function rules(css) {
  const out = [];
  for (const match of withoutComments(css).matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const decls = {};
    for (const d of match[2].matchAll(/(^|;)\s*([-a-z]+)\s*:\s*([^;}]+)/g))
      decls[d[2]] = d[3].trim().replace(/\s+/g, ' ');
    for (const selector of splitBalanced(match[1], ','))
      out.push({ selector: selector.replace(/\s+/g, ' '), decls });
  }
  return out;
}

/**
 * The role custom properties an element carries under `selector`, merged
 * last-wins across every rule with that exact selector — which is how the
 * cascade reads them.
 */
function roleMapIn(css, selector) {
  const merged = {};
  for (const rule of rules(css)) {
    if (rule.selector !== selector) continue;
    for (const role of ROLES) {
      const value = rule.decls[`--mg-font-family-${role}`];
      if (value !== undefined) merged[role] = value;
    }
  }
  return merged;
}

describe('every font-family names a role', () => {
  /**
   * The declarations that legitimately name something other than a role.
   * Keyed by the value, because the value is what makes each one legitimate.
   * `@font-face` blocks are excluded before this map is consulted: they name
   * the file being loaded, which is the one place a face name belongs.
   */
  const EXCEPTIONS = {
    // Vendored normalize.css. Not Mangrove's typography — it restores the
    // browser default for `pre` / `code` / `kbd` / `samp` before Mangrove's own
    // code styling (which does use --mg-font-family-code) lands on top.
    monospace: ['pre', 'code, kbd, samp'],
    // FontAwesome is an icon font, not a text face. It has no reader-task role
    // and no Arabic counterpart; icons.scss names it directly (ruling 3 of
    // unisdr/undrr-mangrove#1098, which is also why $mg-font-family-icons was
    // removed with no replacement).
    'FontAwesome, sans-serif': ['.mg-icon, .fa-before:before, .fab, .fas, .fa'],
  };

  test.each(['style', 'style-all'])(
    '%s.css resolves every font-family through --mg-font-family-*',
    entry => {
      const css = withoutComments(compile(entry)).replace(
        /@font-face\s*\{[^}]*\}/g,
        ''
      );

      const strays = [];
      for (const match of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
        const selector = match[1].trim().replace(/\s+/g, ' ');
        for (const d of match[2].matchAll(
          /(^|;)\s*font-family\s*:\s*([^;}]+)/g
        ))
          strays.push({ selector, value: d[2].trim().replace(/\s+/g, ' ') });
      }

      const unexplained = strays.filter(({ selector, value }) => {
        if (value.startsWith('var(--mg-font-family-')) return false;
        // `inherit` names no family: it hands the element back to its
        // container, which is exactly what the role model wants.
        if (value === 'inherit') return false;
        return !(EXCEPTIONS[value] || []).includes(selector);
      });

      expect(unexplained).toEqual([]);
      // A rule that matched nothing would pass the filter above trivially.
      expect(strays.filter(s => s.value.startsWith('var('))).not.toEqual([]);
    }
  );
});

describe('the roles are defined in every bundle', () => {
  test.each(BUNDLES)('%s.css defines all five roles', entry => {
    // style-gutenberg.scss skips _foundational.scss, which is why the role
    // definitions live in _variables.scss rather than there. A regression here
    // does not fail the build or the Latin diff: the references stay, the
    // definitions go, and every element in the bundle silently renders in the
    // browser's default serif. Two rounds of #1098 shipped exactly that bug.
    const css = withoutComments(compile(entry));
    const defined = ROLES.filter(role =>
      new RegExp(`--mg-font-family-${role}\\s*:`).test(css)
    );

    expect(defined).toEqual(ROLES);
  });

  test.each(BUNDLES)('%s.css defines each role before it is used', entry => {
    const css = withoutComments(compile(entry));
    for (const role of ROLES) {
      const declaredAt = css.search(
        new RegExp(`--mg-font-family-${role}\\s*:`)
      );
      const usedAt = css.search(
        new RegExp(`var\\(--mg-font-family-${role}\\)`)
      );
      if (usedAt === -1) continue;
      // Custom properties do not depend on source order for *cascade*, but a
      // reference is only valid if the property is in scope on the element, and
      // the ordering check is a cheap proxy for "the map is in this bundle at
      // all" that also catches a map emitted inside a media query or theme.
      expect({ role, declaredAt: declaredAt !== -1 }).toEqual({
        role,
        declaredAt: true,
      });
      expect(declaredAt).toBeLessThan(usedAt);
    }
  });
});

/**
 * Section: what each role resolves to.
 *
 * Everything above this point asserts that the roles are DEFINED — in every
 * bundle, ahead of first use, and referenced instead of a face name. None of it
 * asserts what they are defined AS. That gap is not theoretical: changing
 * `--mg-font-family-ui` in `_variables.scss` from the condensed face to the
 * plain one restyles every Latin chrome element in the library — cards, tags,
 * tabs, breadcrumbs, nav — and the whole suite stayed green.
 *
 * The Latin map is the primary correctness gate for #1098. The migration's
 * claim is that Latin output is byte-identical to the faces it replaced, and
 * that claim lives entirely in these five values.
 *
 * Expected values are derived from the face variables rather than retyped, so a
 * deliberate face change is a one-line edit in `_variables.scss` and the test
 * follows it. What these assertions pin is the role-to-face ASSIGNMENT, which
 * is the decision; the font names are not.
 */
describe('the roles resolve to the intended faces', () => {
  const FACES = [
    'mg-font-face-sans',
    'mg-font-face-sans-condensed',
    'mg-font-face-mono',
    'mg-font-face-arabic-display',
    'mg-font-face-arabic-sans',
  ];

  /**
   * Each face variable as Sass emits it. Read out of `_variables.scss` through
   * `mg-font-stack()`, the same helper the role map uses, so both sides of
   * every comparison below are rendered identically. That helper exists
   * because plain interpolation strips a list's quotes: an override such as
   * `"Frutiger 55 Roman", sans-serif` would emit an invalid custom-ident and
   * the role would never be defined at all — see the face-override test below.
   */
  const faces = (() => {
    const probe = FACES.map(
      name => `  --${name}: #{mg-font-stack($${name})};`
    ).join('\n');
    const css = sass.compileString(
      `@import "variables";\n.mg-face-probe {\n${probe}\n}\n`,
      {
        loadPaths: [SCSS_DIR],
        silenceDeprecations: ['import'],
        logger: sass.Logger.silent,
      }
    ).css;
    const found = rules(css).find(rule => rule.selector === '.mg-face-probe');
    return Object.fromEntries(
      FACES.map(name => [name, found && found.decls[`--${name}`]])
    );
  })();

  const roleMap = (entry, selector) => roleMapIn(compile(entry), selector);

  test('the face probe resolved every face variable', () => {
    // Guards the guard. The expectations below build their expected side out of
    // this object, so an empty read has to be caught here rather than produce a
    // comparison of undefined against undefined downstream.
    expect(faces).toEqual(
      Object.fromEntries(FACES.map(name => [name, expect.stringMatching(/\S/)]))
    );
  });

  test.each(BUNDLES)(
    '%s.css maps the Latin roles onto the Latin faces',
    entry => {
      // Faces are bound outside the brand mixin, so every bundle emits the same
      // Latin map; a brand re-pointing a role has to do it at runtime.
      expect(roleMap(entry, ':root')).toEqual({
        text: faces['mg-font-face-sans'],
        heading: faces['mg-font-face-sans'],
        display: faces['mg-font-face-sans-condensed'],
        ui: faces['mg-font-face-sans-condensed'],
        code: faces['mg-font-face-mono'],
      });
    }
  );

  test.each(['style', 'style-all'])(
    '%s.css re-points the roles onto Arabic faces on an Arabic root',
    entry => {
      // Exhaustive, not a subset: `code` must be ABSENT here. The monospace
      // stack is the same in both scripts, so it inherits from `:root`, and a
      // stray Arabic `code` value would be a silently wrong face for every code
      // block on an Arabic page.
      expect(roleMap(entry, ':root:lang(ar)')).toEqual({
        text: faces['mg-font-face-arabic-sans'],
        heading: faces['mg-font-face-arabic-display'],
        display: faces['mg-font-face-arabic-display'],
        ui: faces['mg-font-face-arabic-sans'],
      });
    }
  );

  test('a face override that needs quotes survives into the role', () => {
    // The `!default` on the face variables exists so a consumer compiling from
    // source can drop in a licensed brand face. Frutiger, Univers and Helvetica
    // Neue LT Std all name weights numerically, so the family name MUST stay
    // quoted: `Frutiger 55 Roman` is not a valid custom-ident, the custom
    // property is invalid at computed-value time, the role is never defined,
    // and every element that references it renders in the browser's default
    // serif. That is what plain `#{$face}` interpolation emitted, and it is
    // silent — the build is clean and the page is Times.
    const css = sass.compileString(
      '$mg-font-face-sans: "Frutiger 55 Roman", sans-serif;\n' +
        '@import "variables";\n',
      {
        loadPaths: [SCSS_DIR],
        silenceDeprecations: ['import'],
        logger: sass.Logger.silent,
      }
    ).css;

    expect(roleMapIn(css, ':root')).toMatchObject({
      text: '"Frutiger 55 Roman", sans-serif',
      heading: '"Frutiger 55 Roman", sans-serif',
    });
  });

  test('the two scripts disagree about ui, which is why the role exists', () => {
    // `ui` is the whole point of the split: Latin chrome is condensed, Arabic
    // has no condensed axis and collapses onto the body face. A map where the
    // two scripts agreed would still satisfy every assertion above if the faces
    // were edited to match, and would mean the role model had been abandoned.
    const latin = roleMap('style', ':root');
    const arabic = roleMap('style', ':root:lang(ar)');

    expect(latin.ui).not.toEqual(latin.text);
    expect(arabic.ui).toEqual(arabic.text);
    expect(arabic.heading).not.toEqual(arabic.text);
  });
});

describe('the documented per-component Sass recipe', () => {
  /**
   * SassIntegration.mdx tells consumers they may import `variables`, `fonts`,
   * `breakpoints`, `mixins`, `foundational` and then individual components —
   * no `style*.scss` entry point. Before #1098's fix round it compiled to
   * twelve role references and zero definitions, and rendered every element in
   * Times; before this round it omitted `fonts`, so it carried neither the
   * `@font-face` blocks nor the Arabic script map.
   *
   * The recipe is read out of the doc rather than retyped, so a doc edit that
   * changes the supported path is checked against the SCSS rather than
   * silently diverging from it.
   */
  const MDX = path.join(STORIES_DIR, 'Documentation/SassIntegration.mdx');

  const recipe = () => {
    const source = fs.readFileSync(MDX, 'utf8');
    for (const block of source.matchAll(/```scss\n([\s\S]*?)```/g)) {
      const imports = block[1].match(/^@import\s+"[^"]+";$/gm) || [];
      if (
        imports.some(line => line.includes('scss/variables')) &&
        imports.some(line => line.includes('scss/foundational'))
      )
        return imports;
    }
    return null;
  };

  test('is still documented in SassIntegration.mdx', () => {
    // If this fails the doc moved and the test below is measuring nothing.
    expect(recipe()).not.toBeNull();
  });

  test('compiles with all five role definitions in scope', () => {
    const css = sass.compileString(recipe().join('\n'), {
      loadPaths: [REPO_ROOT],
      silenceDeprecations: ['import'],
      logger: sass.Logger.silent,
    }).css;

    for (const role of ROLES) {
      const declaredAt = css.search(
        new RegExp(`--mg-font-family-${role}\\s*:`)
      );
      const usedAt = css.search(
        new RegExp(`var\\(--mg-font-family-${role}\\)`)
      );
      expect({ role, defined: declaredAt !== -1 }).toEqual({
        role,
        defined: true,
      });
      if (usedAt !== -1) expect(declaredAt).toBeLessThan(usedAt);
    }
  });

  test('carries the Arabic script map too', () => {
    // Defining the roles is not enough: a build with the Latin map and no
    // Arabic map asks for Roboto on an Arabic page, and Roboto has no Arabic
    // coverage, so every glyph falls back to whatever the OS supplies. It is
    // silent — no warning, no invalid declaration, correct-looking Latin.
    const css = sass.compileString(recipe().join('\n'), {
      loadPaths: [REPO_ROOT],
      silenceDeprecations: ['import'],
      logger: sass.Logger.silent,
    }).css;

    expect(Object.keys(roleMapIn(css, ':root:lang(ar)')).sort()).toEqual([
      'display',
      'heading',
      'text',
      'ui',
    ]);
  });
});

/**
 * Section: the import list real consumers compile.
 *
 * `undrr_common/scss/_mangrove-components.scss` in the Drupal platform repo is
 * the shared list every UNDRR theme builds — twelve of them. It imports
 * `fonts`, `breakpoints`, `mixins`, `foundational`, `utility` and then the
 * component partials one by one. It imports NO `style*.scss` entry point.
 *
 * Until unisdr/undrr-mangrove#1098's fix wave the Arabic script map lived in a
 * separate `_font-roles.scss` reachable only from the entry points — which is
 * what Storybook and `yarn scss` build, and is why three reviews and a green
 * suite missed it. Every production site shipped the role definitions with no
 * Arabic map behind them. The map now lives in `_fonts.scss`, which this list
 * names in its own right.
 *
 * This suite therefore compiles the consumer's shape rather than Mangrove's.
 * The list below is deliberately a re-statement, not a read of the consumer
 * repo: Mangrove cannot see that file, and the contract it has to keep is
 * "importing `foundational` is enough".
 *
 * The shape has two levels, and modelling it as one loses the part that can
 * break. The shared list starts at `fonts` and never names `variables`; the
 * theme entry point that compiles the list supplies `variables` above it. Since
 * unisdr/undrr-mangrove#1098 folded the Arabic map into `_fonts.scss`, that
 * file needs `mg-font-stack()` and the `$mg-font-face-*` variables in scope, so
 * the split is now load-bearing: the list compiles only because of a line in a
 * file it does not contain.
 */
describe('the shared Drupal import list', () => {
  /**
   * The list itself, in its real order — `fonts` first, no `variables`.
   */
  const CONSUMER_IMPORTS = [
    'stories/assets/scss/fonts',
    'stories/assets/scss/breakpoints',
    'stories/assets/scss/mixins',
    'stories/assets/scss/foundational',
    'stories/assets/scss/utility',
    'stories/Atom/Tag/tag',
    'stories/Components/Cards/Card/card',
    'stories/Components/Hero/hero',
    'stories/Components/Tab/tab',
    'stories/Components/Breadcrumbs/breadcrumbs',
  ];

  /**
   * What the theme entry points put above that list. Both flavours ship: the
   * `undrr`, `arise`, `gp` and `sfvc` themes `@use` the variables module with
   * `as *`, while `irp`, `mcr` and `pw` legacy-`@import` it ahead of their
   * sub-brand file. The two do not expose the same members — `@use ... as *`
   * exports only the module's own public names, where `@import` flattens
   * everything into one scope — so a dependency `_fonts.scss` picks up can
   * satisfy one and not the other. Both are compiled for that reason.
   */
  const PRELUDES = {
    'use-as-star': '@use "stories/assets/scss/variables" as *;',
    'legacy-import': '@import "stories/assets/scss/variables";',
  };

  const consumerCache = new Map();
  /** Lazy and memoised: a compile failure has to land inside a named test. */
  const compileConsumer = prelude => {
    if (!consumerCache.has(prelude)) {
      consumerCache.set(
        prelude,
        sass.compileString(
          [prelude, ...CONSUMER_IMPORTS.map(file => `@import "${file}";`)].join(
            '\n'
          ),
          {
            loadPaths: [REPO_ROOT],
            silenceDeprecations: ['import'],
            logger: sass.Logger.silent,
          }
        ).css
      );
    }
    return consumerCache.get(prelude);
  };

  const consumerCss = () => compileConsumer(PRELUDES['use-as-star']);

  test.each(Object.entries(PRELUDES))(
    'compiles under a %s theme entry, list starting at `fonts`',
    (_flavour, prelude) => {
      // The whole point of starting the list at `fonts`: if `_fonts.scss` grows
      // a dependency the entry point's `variables` does not satisfy, this is
      // where a real theme's build breaks, and the failure is a thrown
      // `Undefined variable` rather than a missing declaration.
      expect(roleMapIn(compileConsumer(prelude), ':root:lang(ar)')).toEqual({
        text: expect.stringContaining('Noto Sans Arabic'),
        heading: expect.stringContaining('Noto Kufi Arabic'),
        display: expect.stringContaining('Noto Kufi Arabic'),
        ui: expect.stringContaining('Noto Sans Arabic'),
      });
    }
  );

  test('defines all five roles', () => {
    expect(
      ROLES.filter(role =>
        new RegExp(`--mg-font-family-${role}\\s*:`).test(consumerCss())
      )
    ).toEqual(ROLES);
  });

  test('carries both language-boundary rules', () => {
    // Custom properties inherit, so a `lang="en"` island inside an Arabic page
    // keeps resolving the roles to Arabic faces unless they are restated at the
    // switch point — and `font-family` itself inherits as a used value, so the
    // boundary has to restate that too. See unisdr/undrr-mangrove#1093.
    const boundaries = rules(consumerCss()).filter(rule =>
      rule.selector.includes('[lang]:not([lang=""]')
    );

    expect(boundaries).toHaveLength(2);
    for (const boundary of boundaries)
      expect(boundary.decls['font-family']).toBe('var(--mg-font-family-text)');
  });

  test('emits the script map exactly once', () => {
    // `_fonts.scss` carries the map and the `@font-face` blocks, and Sass's
    // legacy `@import` re-emits, so any build path that reaches it twice would
    // duplicate both. Duplicated rules are not a rendering bug, but they are
    // dead weight in a file every UNDRR page loads, and a second copy would
    // mask an ordering mistake in the first.
    const once = css => (css.match(/:root:lang\(ar\)\s*\{/g) || []).length;

    expect(once(consumerCss())).toBe(1);
    for (const entry of BUNDLES) expect(once(compile(entry))).toBe(1);
  });

  test('emits every @font-face block exactly once', () => {
    // The guard the map used to carry cannot be extended to the faces: Sass
    // forbids `@import` inside `@if`, so `_fonts.scss` cannot make itself
    // idempotent. Importing it twice — from an entry point and again from a
    // partial that entry point pulls in — silently doubles 32 `@font-face`
    // blocks in a file every UNDRR page loads. Counting them here is what
    // keeps "import _fonts.scss exactly once" enforceable.
    const faceKeys = css =>
      [...css.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)].map(block =>
        ['font-family', 'font-weight', 'font-style', 'src', 'unicode-range']
          .map(prop => {
            const found = new RegExp(`${prop}:\\s*([^;]+);`).exec(block[1]);
            return found ? found[1].trim() : '';
          })
          .join('|')
      );

    for (const [name, css] of [
      ['the consumer import list', consumerCss()],
      ...BUNDLES.map(entry => [entry, compile(entry)]),
    ]) {
      const keys = faceKeys(css);
      expect(keys.length).toBeGreaterThan(0);
      expect({ name, duplicates: keys.length - new Set(keys).size }).toEqual({
        name,
        duplicates: 0,
      });
    }
  });
});

describe('the removed font variables warn at compile time', () => {
  /**
   * The six names #1098 deleted, each with the role that replaces it.
   * `$mg-font-family-icons` has none: it had no stylesheet consumer, and
   * icons.scss names FontAwesome directly.
   *
   * Setting one of these before importing Mangrove used to change the type on
   * every page. It is now a silent no-op, which is the worst possible failure
   * mode for a consumer, so each must produce a compile-time warning that names
   * its replacement.
   */
  const REMOVED = {
    'mg-font-family': 'text',
    'mg-font-family-headings': 'ui',
    'mg-font-family-condensed': 'ui',
    'mg-font-family-icons': null,
    'mg-font-family-arabic-headings': 'heading',
    'mg-font-family-arabic-body': 'text',
  };

  const warningsFor = name => {
    const warnings = [];
    sass.compileString(
      `$${name}: "Consumer Face", sans-serif;\n@import "variables";\n`,
      {
        loadPaths: [SCSS_DIR],
        silenceDeprecations: ['import'],
        logger: {
          warn(message) {
            warnings.push(message);
          },
          debug() {},
        },
      }
    );
    return warnings.filter(message => message.includes(`$${name}`));
  };

  test.each(Object.keys(REMOVED))('$%s warns when a consumer sets it', name => {
    expect(warningsFor(name)).not.toEqual([]);
  });

  test.each(Object.entries(REMOVED).filter(([, role]) => role))(
    '$%s names --mg-font-family-%s as its replacement',
    (name, role) => {
      expect(warningsFor(name).join('\n')).toContain(
        `--mg-font-family-${role}`
      );
    }
  );

  test('$mg-font-family-icons says it has no replacement', () => {
    const message = warningsFor('mg-font-family-icons').join('\n');
    expect(message).toContain('no replacement');
    expect(message).not.toMatch(/--mg-font-family-[a-z]/);
  });

  test('a name that was never removed does not warn', () => {
    // Guards the guard: a loop that warned unconditionally would pass every
    // assertion above.
    expect(warningsFor('mg-font-face-sans')).toEqual([]);
  });
});

/**
 * Section: which role each component names.
 *
 * Everything above pins what the five roles are DEFINED as. None of it pins
 * which role a given component asks for, and that is the other half of the
 * decision: the red team re-pointed `.mg-tag`, `.mg-tabs__link` and
 * `.mg-breadcrumb` from `ui` to `text` — Roboto Condensed to Roboto on every
 * Latin page, Mangrove's whole chrome voice — and the entire suite passed. It
 * also deleted the heading rule outright, removing Noto Kufi Arabic from the
 * product, and the entire suite passed.
 *
 * The Latin byte-identical gate cannot help here either: it compares this
 * branch against its own base, so once a wrong assignment is in the base it IS
 * the baseline. What follows is therefore an explicit table, checked in.
 * Changing a component's role is a legitimate design decision; it just has to
 * be made on purpose, in this file, next to the SCSS edit.
 */
describe('every component names the role it is meant to', () => {
  /**
   * `selector -> role`, exhaustive over compiled `style.css`. Derived from the
   * compiled output rather than the source so that a change reaching the
   * cascade by any route — a nested rule, a mixin, a theme partial — shows up.
   *
   * The six non-Gutenberg bundles emit exactly this map; `style-gutenberg.css`
   * emits a subset, because it compiles four components rather than all of
   * them.
   */
  const ROLE_BY_SELECTOR = new Map([
    ['#cc-main .c-bn', 'text'],
    ['#cc-main .cm__btn', 'text'],
    ['#cc-main .pm__btn', 'text'],
    ['.mg-breadcrumb', 'ui'],
    ['.mg-button', 'text'],
    ['.mg-button.mg-button-cta::after', 'text'],
    ['.mg-card__label', 'ui'],
    ['.mg-card__title', 'ui'],
    ['.mg-chip', 'text'],
    ['.mg-code', 'code'],
    ['.mg-empty-state', 'text'],
    ['.mg-empty-state__title', 'ui'],
    ['.mg-footer--about-footer--links', 'ui'],
    ['.mg-form-input', 'text'],
    ['.mg-form-select', 'text'],
    ['.mg-form-textarea', 'text'],
    ['.mg-gallery__title', 'ui'],
    ['.mg-hero__label', 'ui'],
    ['.mg-hero__title', 'display'],
    ['.mg-mega-content__banner header', 'ui'],
    [
      '.mg-mega-mobile-sidebar--progressive .mg-mega-mobile-sidebar__back',
      'text',
    ],
    [
      '.mg-mega-mobile-sidebar--progressive .mg-mega-mobile-sidebar__close',
      'text',
    ],
    [
      '.mg-mega-mobile-sidebar--progressive .mg-mega-mobile-sidebar__page--section .mg-mega-sidebar-section__item',
      'text',
    ],
    [
      '.mg-mega-mobile-sidebar--progressive .mg-mega-mobile-sidebar__title',
      'ui',
    ],
    [
      '.mg-mega-mobile-sidebar--progressive .mg-mega-sidebar-section__item',
      'ui',
    ],
    ['.mg-hub-header__name', 'ui'],
    ['.mg-mega-topbar__item-link', 'ui'],
    ['.mg-on-this-page-nav__cta', 'ui'],
    ['.mg-on-this-page-nav__link', 'ui'],
    ['.mg-preview-access__body', 'text'],
    ['.mg-preview-access__contact', 'text'],
    ['.mg-preview-access__error', 'text'],
    ['.mg-preview-access__eyebrow', 'ui'],
    ['.mg-preview-access__input', 'text'],
    ['.mg-preview-access__label', 'ui'],
    ['.mg-preview-access__submit', 'text'],
    ['.mg-preview-access__title', 'ui'],
    ['.mg-search__input', 'text'],
    ['.mg-share__copy-button', 'text'],
    ['.mg-share__header', 'text'],
    ['.mg-stats-card-item__bottom-label', 'ui'],
    ['.mg-stats-card-item__label', 'ui'],
    ['.mg-stats-card-item__value', 'ui'],
    ['.mg-status-label', 'text'],
    [
      '.mg-tabs--stacked > .mg-tabs-content > .mg-tabs__mobile-item > .mg-tabs__mobile-link::before',
      'text',
    ],
    [
      '.mg-tabs--stacked > .mg-tabs__list > .mg-tabs-content > .mg-tabs__mobile-item > .mg-tabs__mobile-link::before',
      'text',
    ],
    [
      '.mg-tabs--stacked > .mg-tabs__list > .mg-tabs__item > .mg-tabs__link::before',
      'text',
    ],
    [
      '.mg-tabs--stacked > .mg-tabs__panels > .mg-tabs-content > .mg-tabs__mobile-item > .mg-tabs__mobile-link::before',
      'text',
    ],
    ['.mg-tabs__link', 'ui'],
    ['.mg-tag', 'ui'],
    ['.mg-tag-container > :where(span, div, a, li)', 'ui'],
    ['.mg-user-feedback__question', 'text'],
    [':where(:lang(ar)) > :where([lang]:not([lang=""], :lang(ar)))', 'text'],
    [
      ':where(:not(:lang(ar))) > :where([lang]:not([lang=""]):lang(ar))',
      'text',
    ],
    ['body', 'text'],
    ['button', 'text'],
    ['code', 'code'],
    ['details.mg-details > summary::before', 'text'],
    ['figure.mg-code-block figcaption', 'text'],
    ['h1:lang(ar)', 'heading'],
    ['h2:lang(ar)', 'heading'],
    ['h3:lang(ar)', 'heading'],
    ['pre:has(> code[class*=language-])::after', 'text'],
    ['pre[data-language]::after', 'text'],
  ]);

  /** `selector -> role` for every rule in `entry` whose family names a role. */
  const roleBySelector = entry => {
    const found = new Map();
    for (const { selector, decls } of rules(compile(entry))) {
      const role = /^var\(--mg-font-family-([a-z]+)\)$/.exec(
        decls['font-family'] || ''
      )?.[1];
      if (role) found.set(selector, role);
    }
    return found;
  };

  const sorted = map =>
    [...map].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  test.each(BUNDLES.filter(entry => entry !== 'style-gutenberg'))(
    '%s.css assigns exactly the roles the table records',
    entry => {
      expect(sorted(roleBySelector(entry))).toEqual(sorted(ROLE_BY_SELECTOR));
    }
  );

  test('style-gutenberg.css is a subset, with the same roles', () => {
    // It compiles container, grid, cta-button, card, hero, tab and full-width
    // and skips _foundational.scss, so it carries fewer selectors — but a
    // selector it does carry must not have drifted to a different role.
    const found = roleBySelector('style-gutenberg');

    expect(found.size).toBeGreaterThan(0);
    expect(sorted(found)).toEqual(
      sorted(found).map(([selector]) => [
        selector,
        ROLE_BY_SELECTOR.get(selector),
      ])
    );
  });

  test('every role has at least one consumer', () => {
    // `heading` is the one at risk: after unisdr/undrr-mangrove#1098's fix wave
    // its only consumer is `h1:lang(ar), h2:lang(ar), h3:lang(ar)` in
    // _foundational.scss. Deleting that rule is invisible in Latin — heading
    // and text are both Roboto — and silently takes Noto Kufi Arabic out of the
    // product. A role no one asks for is a role that has been abandoned.
    const consumers = Object.fromEntries(
      ROLES.map(role => [
        role,
        [...roleBySelector('style')]
          .filter(([, assigned]) => assigned === role)
          .map(([selector]) => selector),
      ])
    );

    expect(
      Object.fromEntries(ROLES.map(role => [role, consumers[role].length > 0]))
    ).toEqual(Object.fromEntries(ROLES.map(role => [role, true])));
    expect(consumers.heading).toContain('h1:lang(ar)');
  });
});
