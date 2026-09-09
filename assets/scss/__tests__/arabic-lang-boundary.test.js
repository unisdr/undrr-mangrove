/**
 * Arabic typography must respect language boundaries.
 *
 * Mangrove's Arabic overrides used to be written as descendant selectors —
 * `:lang(ar) { h1 { ... } }`, which compiles to `:lang(ar) h1`. `:lang()` there
 * matches the *root* and the `h1` is merely a descendant, so the rule fired on
 * every heading beneath an Arabic root regardless of that heading's own
 * language. An English island inside an Arabic page — a quotation, a citation,
 * an untranslated widget — rendered in Arabic typography.
 *
 * The fix anchors the pseudo-class to the element itself, which matches on
 * *computed* language and therefore stops at a `lang="en"` boundary, and adds a
 * boundary rule that restores the Latin family to the island (anchoring alone
 * is not enough — `font-family` still inherits down from the Arabic root).
 *
 * unisdr/undrr-mangrove#1098 replaced the per-component `:lang(ar)` blocks with
 * five font *roles* (`--mg-font-family-text` / `-heading` / `-display` / `-ui` /
 * `-code`). Script routing now happens in one place: the roles are bound to
 * Latin faces on `:root` and re-pointed to Arabic faces on `:root:lang(ar)` and
 * at each boundary. The shape being protected is unchanged — `:lang(ar)` stays
 * anchored to the styled element, and the boundary rules stay on the switch
 * point — but what the boundary rules *carry* is now four role values plus the
 * inherited `font-family` itself.
 *
 * See unisdr/undrr-mangrove#1092, #1093 and #1098. Assertions run against
 * compiled CSS, not source, because compiled output is what consumers load.
 */
const path = require('path');
const sass = require('sass');

const SCSS_DIR = path.resolve(__dirname, '..');
const ENTRIES = ['style', 'style-all'];

/**
 * The zero-specificity language-boundary rules added by #1092/#1093. Both use a
 * CHILD combinator on purpose: they must match only the element that declares
 * the new language, never its descendants. A descendant form would also match
 * component children meant to inherit their container's family (a
 * `.mg-card__title` link, a `.mg-hero__title` heading) and a matched
 * declaration beats an inherited one at any specificity, so those would lose
 * Roboto Condensed.
 */
const BOUNDARY_TO_LATIN =
  ':where(:lang(ar)) > :where([lang]:not([lang=""], :lang(ar)))';
const BOUNDARY_TO_ARABIC =
  ':where(:not(:lang(ar))) > :where([lang]:not([lang=""]):lang(ar))';
const BOUNDARY_SELECTORS = [BOUNDARY_TO_LATIN, BOUNDARY_TO_ARABIC];

/** The Arabic document root. Re-points the roles for the whole page. */
const ARABIC_ROOT = ':root:lang(ar)';

/**
 * The only `:lang(ar)` font-family rule outside the role map, and the only
 * consumer of the `heading` role. Anchored to the heading itself, like every
 * other `:lang(ar)` rule here, so it stops at a `lang="en"` boundary.
 */
const ARABIC_HEADINGS = ['h1:lang(ar)', 'h2:lang(ar)', 'h3:lang(ar)'];

/**
 * Compiled role values, derived from the face variables in `_variables.scss`
 * rather than retyped, so a deliberate face change is edited in one place. What
 * these tables pin is the role-to-face ASSIGNMENT on each side of a boundary —
 * the decision — not the font names, which are Task 1's to choose.
 *
 * The faces are read back through `mg-font-stack()`, the same helper the role
 * map uses, so both sides of every comparison are rendered identically. That
 * helper exists because plain interpolation strips a list's quotes, which turns
 * a face override such as `"Frutiger 55 Roman", sans-serif` into an invalid
 * custom-ident and silently drops the whole declaration.
 */
const FACES = [
  'mg-font-face-sans',
  'mg-font-face-sans-condensed',
  'mg-font-face-arabic-display',
  'mg-font-face-arabic-sans',
];

const face = (() => {
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
  const found = {};
  for (const name of FACES) {
    const match = new RegExp(`--${name}\\s*:\\s*([^;}]+)`).exec(css);
    // Left null when the probe fails to read a face. The tests below compare
    // against these values, so a null makes every one of them fail loudly
    // rather than pass against a hole.
    found[name] = match && match[1].trim().replace(/\s+/g, ' ');
  }
  return found;
})();

const LATIN_ROLES = {
  '--mg-font-family-text': face['mg-font-face-sans'],
  '--mg-font-family-heading': face['mg-font-face-sans'],
  '--mg-font-family-display': face['mg-font-face-sans-condensed'],
  '--mg-font-family-ui': face['mg-font-face-sans-condensed'],
};
const ARABIC_ROLES = {
  '--mg-font-family-text': face['mg-font-face-arabic-sans'],
  '--mg-font-family-heading': face['mg-font-face-arabic-display'],
  '--mg-font-family-display': face['mg-font-face-arabic-display'],
  '--mg-font-family-ui': face['mg-font-face-arabic-sans'],
};

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

/**
 * Split a selector list on top-level commas only. A selector may contain
 * commas inside `:not()`, `:is()` or `:where()` — stylelint normalises
 * `:not(a):not(b)` to `:not(a, b)` — so a naive `split(',')` tears those apart.
 */
function splitSelectorList(list) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of list) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.map(part => part.trim().replace(/\s+/g, ' ')).filter(Boolean);
}

const withoutComments = css => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Every individual selector in `css` that mentions `:lang(ar)`. */
function arabicSelectors(css) {
  const selectors = [];
  for (const match of withoutComments(css).matchAll(/([^{}]+)\{[^{}]*\}/g)) {
    for (const trimmed of splitSelectorList(match[1])) {
      if (trimmed.includes(':lang(ar)')) selectors.push(trimmed);
    }
  }
  return selectors;
}

/**
 * The raw declaration block of the rule whose selector list contains
 * `selector` exactly. Returns null when no such rule is emitted.
 */
function blockFor(css, selector) {
  for (const match of withoutComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (splitSelectorList(match[1]).includes(selector)) return match[2].trim();
  }
  return null;
}

/**
 * `blockFor` parsed into `{ property: value }`. Asserting on the declarations,
 * not just the selector text, is what gives this suite teeth: a rule with the
 * right selector and the wrong family must fail. Last-wins, as the cascade is.
 */
function declarationsFor(css, selector) {
  const block = blockFor(css, selector);
  if (block === null) return null;
  const out = {};
  for (const m of block.matchAll(/([-a-z]+)\s*:\s*([^;}]+)/g))
    out[m[1]] = m[2].trim().replace(/\s+/g, ' ');
  return out;
}

/**
 * True when `:lang(ar)` is followed by a combinator — the broken shape, where
 * the pseudo-class constrains an ancestor rather than the styled element.
 */
function usesLangAsAncestor(selector) {
  return /:lang\(ar\)\s*(?:[>+~]|\s)/.test(selector);
}

describe('Arabic typography selectors (compiled CSS)', () => {
  test.each(ENTRIES)(
    '%s.scss anchors :lang(ar) to the styled element',
    entry => {
      const selectors = arabicSelectors(compile(entry)).filter(
        selector => !BOUNDARY_SELECTORS.includes(selector)
      );

      expect(selectors.length).toBeGreaterThan(0);
      expect(selectors.filter(usesLangAsAncestor)).toEqual([]);
    }
  );

  test.each(ENTRIES)('%s.scss re-points the roles on an Arabic root', entry => {
    // Every Arabic face substitution now happens through this one rule. It is
    // deliberately NOT wrapped in `:where()`: `:root` also matches `html`, so a
    // zero-specificity Arabic rule would lose to the Latin `:root` block.
    expect(declarationsFor(compile(entry), ARABIC_ROOT)).toEqual(ARABIC_ROLES);
  });

  test.each(ENTRIES)('%s.scss puts Arabic h1-h3 on the heading role', entry => {
    // Noto Kufi Arabic is a display face and is reserved for narrative h1-h3
    // and the hero title; everything at or below body size takes Noto Sans
    // Arabic. This rule is what keeps Kufi in the product at all — delete it
    // and Latin is unchanged, the suite is green, and Arabic headings quietly
    // become body text.
    const css = compile(entry);
    for (const selector of ARABIC_HEADINGS)
      expect(declarationsFor(css, selector)).toEqual({
        'font-family': 'var(--mg-font-family-heading)',
      });
  });

  test.each(ENTRIES)(
    '%s.scss resets to the Latin roles at a boundary',
    entry => {
      // Anchoring stops the Arabic rules matching non-Arabic elements, but the
      // roles are custom properties and custom properties inherit, so an
      // English island would still resolve every role to an Arabic face.
      //
      // `font-family` is restated as well, and must be: it is an inherited
      // property in its own right, so an element carrying no font-family
      // declaration — a plain `<section lang="en">`, or a `p` inside it — keeps
      // inheriting the *used* Arabic family however the roles below it resolve.
      expect(declarationsFor(compile(entry), BOUNDARY_TO_LATIN)).toEqual({
        ...LATIN_ROLES,
        'font-family': 'var(--mg-font-family-text)',
      });
    }
  );

  test.each(ENTRIES)(
    '%s.scss restores the Arabic roles at a boundary',
    entry => {
      // The mirror case: Arabic resuming inside a non-Arabic island, and an
      // Arabic island on an otherwise Latin page. Without this rule Arabic text
      // inherits Roboto, which has no Arabic coverage.
      expect(declarationsFor(compile(entry), BOUNDARY_TO_ARABIC)).toEqual({
        ...ARABIC_ROLES,
        'font-family': 'var(--mg-font-family-text)',
      });
    }
  );

  test.each(ENTRIES)(
    '%s.scss scopes boundary rules to the switch point',
    entry => {
      // A descendant combinator here would clobber component children that
      // inherit Roboto Condensed from their container. Pin the child combinator.
      const css = compile(entry);
      for (const selector of BOUNDARY_SELECTORS) {
        expect(blockFor(css, selector)).not.toBeNull();
        expect(selector).toContain('> :where(');
      }
      expect(
        blockFor(css, ':where(:lang(ar)) :where(:not(:lang(ar)))')
      ).toBeNull();
    }
  );

  test.each(ENTRIES)(
    '%s.scss routes every script substitution through the role map',
    entry => {
      // #1098's central claim: no component stylesheet carries a `:lang(ar)`
      // font override any more. A component names a role; the three map rules
      // re-point the roles. A new `:lang(ar) { font-family: ... }` block in a
      // component would restore the per-component drift this replaced, and
      // would be invisible to every other assertion here.
      //
      // `h1:lang(ar), h2:lang(ar), h3:lang(ar)` is the one allowed exception,
      // and it is not a component override: it is the `heading` role's only
      // consumer. The rule is scoped to Arabic because in Latin `heading` and
      // `text` are both Roboto, so an unconditional `h1, h2, h3` bought nothing
      // and cost two production themes their brand face — it is a matched
      // declaration at (0,0,1) that ties with the consumer's own `h1` rule and
      // wins on source order. Its VALUE is asserted below.
      const css = compile(entry);
      const ROLE_MAP = [ARABIC_ROOT, ...BOUNDARY_SELECTORS, ...ARABIC_HEADINGS];

      const strays = arabicSelectors(css)
        .filter(selector => !ROLE_MAP.includes(selector))
        .filter(selector => /font-family\s*:/.test(blockFor(css, selector)));

      expect(strays).toEqual([]);
    }
  );
});

describe('Arabic typography at a language boundary (DOM)', () => {
  let island;

  beforeEach(() => {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    document.body.innerHTML = `
      <h1 id="ar-heading">عنوان</h1>
      <h2 id="ar-heading-2">عنوان</h2>
      <h3 id="ar-heading-3">عنوان</h3>
      <p id="ar-body">نص</p>
      <span class="mg-tag" id="ar-tag">وسم</span>
      <span class="mg-u-font-size-600" id="ar-size-600">وسم</span>
      <span class="mg-u-font-size-800" id="ar-size-800">وسم</span>
      <span class="mg-u-font-size-900" id="ar-size-900">وسم</span>
      <div lang="en" id="island">
        <h1 id="en-heading">English heading</h1>
        <p id="en-body">English paragraph</p>
        <span class="mg-tag" id="en-tag">tag</span>
        <span class="mg-u-font-size-600" id="en-size-600">size</span>
        <span class="mg-u-font-size-800" id="en-size-800">size</span>
        <span class="mg-u-font-size-900" id="en-size-900">size</span>
        <div><p id="en-nested-body">Nested English paragraph</p></div>
      </div>
    `;
    island = document.getElementById('island');
  });

  test('no Arabic rule matches an element inside a lang="en" island', () => {
    const selectors = arabicSelectors(compile('style')).filter(
      selector => !BOUNDARY_SELECTORS.includes(selector)
    );

    const leaked = [];
    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        if (island.contains(element))
          leaked.push(`${selector} -> #${element.id}`);
      }
    }

    expect(leaked).toEqual([]);
  });

  test('Arabic rules still match outside the island', () => {
    // The guard above passes trivially if the selectors match nothing at all.
    // Every non-boundary Arabic selector must match something on this fixture.
    const selectors = arabicSelectors(compile('style')).filter(
      selector => !BOUNDARY_SELECTORS.includes(selector)
    );

    const inert = selectors.filter(
      selector => document.querySelectorAll(selector).length === 0
    );

    expect(inert).toEqual([]);
    expect(document.documentElement.matches(ARABIC_ROOT)).toBe(true);
  });

  test('the old descendant shape would have leaked into the island', () => {
    // Pins the regression this suite exists for: the pre-#1092 selectors match
    // the island, which is why the anchored form is required.
    expect(document.getElementById('en-heading').matches(':lang(ar) h1')).toBe(
      true
    );
    expect(document.getElementById('en-body').matches(':lang(ar) p')).toBe(
      true
    );
    expect(document.getElementById('en-tag').matches(':lang(ar) .mg-tag')).toBe(
      true
    );
  });

  test('only the island root is a language switch point', () => {
    // jsdom's selector engine (nwsapi) cannot evaluate `:where()` across a
    // combinator, so the boundary selectors are asserted against compiled CSS
    // above and their *shape* is asserted here through the equivalent plain
    // form. What matters is that the island root matches and its descendants
    // do not — a descendant match is what broke Roboto Condensed inheritance,
    // and under the role model it would also hand every descendant its own
    // matched `font-family`, overriding the container it sits in.
    const SWITCH_POINT = ':lang(ar) > [lang]:not([lang=""]):not(:lang(ar))';

    expect(island.matches(SWITCH_POINT)).toBe(true);

    for (const id of [
      'en-heading',
      'en-body',
      'en-nested-body',
      'en-tag',
      'en-size-600',
      'en-size-800',
      'en-size-900',
    ]) {
      expect(document.getElementById(id).matches(SWITCH_POINT)).toBe(false);
    }

    for (const id of ['ar-heading', 'ar-body', 'ar-tag']) {
      expect(document.getElementById(id).matches(':not(:lang(ar))')).toBe(
        false
      );
    }
  });
});
