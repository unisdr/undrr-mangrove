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
 * The fix anchors the pseudo-class to the element itself (`h1:lang(ar)`), which
 * matches on *computed* language and therefore stops at a `lang="en"` boundary,
 * and adds a boundary fallback that restores the Latin family to the island
 * (anchoring alone is not enough — `font-family` still inherits down from
 * `body:lang(ar)`).
 *
 * See unisdr/undrr-mangrove#1092. Assertions run against compiled CSS, not
 * source, because compiled output is what consumers load.
 */
const path = require('path');
const sass = require('sass');

const SCSS_DIR = path.resolve(__dirname, '..');
const ENTRIES = ['style', 'style-all'];

/**
 * The zero-specificity language-boundary rules added by #1092. Both use a
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

/** Compiled values of the family tokens the boundary rules must set. */
const LATIN_FAMILY = '"Roboto", sans-serif';
const ARABIC_BODY_FAMILY = '"Noto Sans Arabic", sans-serif';

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

/** Every individual selector in `css` that mentions `:lang(ar)`. */
function arabicSelectors(css) {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = [];
  for (const match of withoutComments.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
    for (const trimmed of splitSelectorList(match[1])) {
      if (trimmed.includes(':lang(ar)')) selectors.push(trimmed);
    }
  }
  return selectors;
}

/**
 * The declaration block of the rule whose selector list contains `selector`
 * exactly. Returns null when no such rule is emitted. Asserting on the
 * declarations, not just the selector text, is what gives this suite teeth:
 * a rule with the right selector and the wrong family must fail.
 */
function declarationsFor(css, selector) {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (splitSelectorList(match[1]).includes(selector)) return match[2].trim();
  }
  return null;
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

  test.each(ENTRIES)(
    '%s.scss resets to the Latin family at a boundary',
    entry => {
      // Anchoring stops the Arabic rules matching non-Arabic elements, but
      // font-family still inherits from body:lang(ar). Without this rule an
      // English island keeps the Arabic family by inheritance.
      expect(declarationsFor(compile(entry), BOUNDARY_TO_LATIN)).toBe(
        `font-family: ${LATIN_FAMILY};`
      );
    }
  );

  test.each(ENTRIES)(
    '%s.scss restores the Arabic family at a boundary',
    entry => {
      // The mirror case: Arabic resuming inside a non-Arabic island, and an
      // Arabic island on an otherwise Latin page. Without this rule Arabic text
      // inherits Roboto, which has no Arabic coverage.
      expect(declarationsFor(compile(entry), BOUNDARY_TO_ARABIC)).toBe(
        `font-family: ${ARABIC_BODY_FAMILY};`
      );
    }
  );

  test.each(ENTRIES)(
    '%s.scss scopes boundary rules to the switch point',
    entry => {
      // A descendant combinator here would clobber component children that
      // inherit Roboto Condensed from their container. Pin the child combinator.
      const css = compile(entry);
      for (const selector of BOUNDARY_SELECTORS) {
        expect(declarationsFor(css, selector)).not.toBeNull();
        expect(selector).toContain('> :where(');
      }
      expect(
        declarationsFor(css, ':where(:lang(ar)) :where(:not(:lang(ar)))')
      ).toBeNull();
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
      <p id="ar-body">نص</p>
      <span class="mg-tag" id="ar-tag">وسم</span>
      <div lang="en" id="island">
        <h1 id="en-heading">English heading</h1>
        <p id="en-body">English paragraph</p>
        <span class="mg-tag" id="en-tag">tag</span>
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

  test('Arabic rules still match their elements outside the island', () => {
    // The guard above passes trivially if the selectors match nothing at all.
    expect(document.getElementById('ar-heading').matches('h1:lang(ar)')).toBe(
      true
    );
    expect(document.getElementById('ar-body').matches('p:lang(ar)')).toBe(true);
    expect(document.getElementById('ar-tag').matches('.mg-tag:lang(ar)')).toBe(
      true
    );
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
    // do not — a descendant match is what broke Roboto Condensed inheritance.
    const SWITCH_POINT = ':lang(ar) > [lang]:not([lang=""]):not(:lang(ar))';

    expect(island.matches(SWITCH_POINT)).toBe(true);

    for (const id of ['en-heading', 'en-body', 'en-nested-body', 'en-tag']) {
      expect(document.getElementById(id).matches(SWITCH_POINT)).toBe(false);
    }

    for (const id of ['ar-heading', 'ar-body', 'ar-tag']) {
      expect(document.getElementById(id).matches(':not(:lang(ar))')).toBe(
        false
      );
    }
  });
});
