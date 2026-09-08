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
 *  1. DOM nesting. `_foundational.scss` now gives `h1, h2, h3` a *matched*
 *     `font-family` where Latin previously had only inheritance. A `ui`
 *     container that wraps a heading must therefore claim its own subtree, or
 *     the heading silently drops to the body face. Latin output is unchanged
 *     either way (`text` and `heading` are both Roboto), so only Arabic breaks,
 *     and only when a consumer nests a heading. See `describe('ui containers')`.
 *  2. Build paths. `style-gutenberg.scss` does not import `_foundational.scss`;
 *     a role reference with no definition in scope is invalid at
 *     computed-value time, the declaration is dropped, and the element falls
 *     back to Times. This actually happened twice during #1098.
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
// @babel/parser ships with @babel/core and babel-jest, both direct
// devDependencies, so it is always installed. Used here only to read JSX
// structure — see the ui-container section for why a regex will not do.
const parser = require('@babel/parser');

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
 * A selector's compound selectors, outermost first. Splits on combinators and
 * descendant whitespace at paren depth 0, so `.a :is(h1, h2)` yields
 * `['.a', ':is(h1, h2)']` rather than tearing the `:is()` list apart.
 */
function compounds(selector) {
  const out = [];
  let depth = 0;
  let current = '';
  for (const char of selector) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (depth === 0 && /[\s>+~]/.test(char)) {
      if (current) out.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current) out.push(current);
  return out;
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

describe('the documented per-component Sass recipe', () => {
  /**
   * SassIntegration.mdx tells consumers they may import `variables`,
   * `breakpoints`, `mixins`, `foundational` and then individual components —
   * no `style*.scss` entry point. That path never reaches `_font-roles.scss`.
   * Before #1098's fix round it compiled to twelve role references and zero
   * definitions, and rendered every element in Times.
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
 * Section: `ui` containers that wrap a heading.
 *
 * `_foundational.scss` sets `h1, h2, h3 { font-family: var(--mg-font-family-heading) }`.
 * That is a MATCHED declaration, and a matched declaration beats an inherited
 * one at any specificity. So a container that sets a different role — a card
 * title on `ui`, a hero title on `display` — loses that role for any heading
 * nested inside it unless it claims its own subtree explicitly.
 *
 * In Latin this is invisible: `text`, `heading` and the container's role all
 * resolve to a Roboto variant that happens to look right, and `ui` vs `heading`
 * is the difference between Roboto Condensed and Roboto — which the
 * byte-identical Latin gate DOES catch for the containers that exist today, but
 * cannot catch at all for markup a consumer writes. In Arabic it is a visible
 * face change: Noto Kufi Arabic instead of Noto Sans Arabic.
 *
 * Both the container list and the claim list are derived from compiled CSS, and
 * the nesting is derived from Mangrove's own JSX. Nothing here is a
 * hand-maintained list of components, because a hand-maintained list is exactly
 * what stops being true when someone adds the ninth card variant.
 */
describe('ui containers that wrap a heading claim their subtree', () => {
  /** Headings that carry a matched declaration from _foundational.scss. */
  const MATCHED_HEADINGS = ['h1', 'h2', 'h3'];

  /** Roles that differ from `heading` and therefore need a subtree claim. */
  const CONTAINER_ROLES = ['ui', 'display'];

  const mentionsHeading = compound =>
    MATCHED_HEADINGS.some(tag =>
      new RegExp(`(^|[^-\\w])${tag}([^-\\w]|$)`).test(compound)
    );

  /**
   * Split the `ui`/`display` rules into the containers (subject is not a
   * heading) and the claims (subject is, or includes, a heading).
   */
  const partition = entry => {
    const containers = [];
    const claims = [];

    for (const { selector, decls } of rules(compile(entry))) {
      const role = /^var\(--mg-font-family-([a-z]+)\)$/.exec(
        decls['font-family'] || ''
      )?.[1];
      if (!CONTAINER_ROLES.includes(role)) continue;
      // A pseudo-element is generated content, not a container for markup.
      if (selector.includes('::')) continue;

      const parts = compounds(selector);
      const subject = parts[parts.length - 1];

      if (mentionsHeading(subject)) {
        claims.push({
          selector,
          role,
          container: parts.slice(0, -1).join(' '),
          subject,
        });
        continue;
      }

      containers.push({
        selector,
        role,
        // What an element must look like to be this container: every class on
        // the subject compound, the subject's element type when it names one,
        // and every class the selector requires of an ancestor.
        classes: [...subject.matchAll(/\.([-\w]+)/g)].map(m => m[1]),
        tag: (/^[a-z][-\w]*/.exec(subject) || [null])[0],
        ancestors: parts
          .slice(0, -1)
          .flatMap(part => [...part.matchAll(/\.([-\w]+)/g)].map(m => m[1])),
      });
    }

    return { containers, claims };
  };

  /** Every .jsx file Mangrove ships, tests excluded. */
  const jsxFiles = (dir = STORIES_DIR, out = []) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '__tests__' || entry.name === 'node_modules')
          continue;
        jsxFiles(full, out);
      } else if (entry.name.endsWith('.jsx')) {
        out.push(full);
      }
    }
    return out;
  };

  /**
   * Class names a `className` attribute can put on the element. Every string
   * literal in the expression counts, which over-collects for a ternary — a
   * false positive here asks for a subtree claim the component may not strictly
   * need, which is harmless; a false negative would hide a real defect.
   */
  const classTokens = node => {
    const out = [];
    (function walk(n) {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) return n.forEach(walk);
      if (n.type === 'StringLiteral') out.push(...n.value.split(/\s+/));
      if (n.type === 'TemplateElement')
        out.push(...(n.value.cooked || '').split(/\s+/));
      for (const key of Object.keys(n)) if (key !== 'loc') walk(n[key]);
    })(node);
    return out.filter(Boolean);
  };

  const elementName = element => {
    const name = element.openingElement.name;
    return name.type === 'JSXIdentifier' ? name.name : null;
  };

  /**
   * A literal h1-h3, or a dynamic tag whose name says it renders a heading
   * (`<HeadingTag>`, the level-configurable pattern Hero and TextCta use). h4-h6
   * are deliberately excluded: _foundational.scss gives them no matched
   * declaration, so they inherit their container's role and are safe.
   */
  const isHeading = name =>
    Boolean(name) && (/^h[1-3]$/.test(name) || /heading/i.test(name));

  /** Every (container, heading) nesting in Mangrove's own JSX. */
  const nestings = containers => {
    const found = [];
    for (const file of jsxFiles()) {
      // The JSX as written, not the transformed output.
      const ast = parser.parse(fs.readFileSync(file, 'utf8'), {
        sourceType: 'module',
        plugins: ['jsx'],
      });
      const stack = [];
      (function walk(node) {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) return node.forEach(walk);
        let pushed = false;
        if (node.type === 'JSXElement') {
          const attribute = (node.openingElement.attributes || []).find(
            a => a.type === 'JSXAttribute' && a.name.name === 'className'
          );
          const classes = attribute ? classTokens(attribute.value) : [];
          const name = elementName(node);
          stack.push(classes);
          pushed = true;
          const ancestorClasses = new Set(stack.slice(0, -1).flat());

          for (const container of containers) {
            if (!container.classes.every(c => classes.includes(c))) continue;
            if (container.tag && container.tag !== name) continue;
            if (!container.ancestors.every(c => ancestorClasses.has(c)))
              continue;
            (function find(child) {
              if (!child || typeof child !== 'object') return;
              if (Array.isArray(child)) return child.forEach(find);
              if (child.type === 'JSXElement' && isHeading(elementName(child)))
                found.push({
                  container: container.selector,
                  role: container.role,
                  heading: elementName(child),
                  where: `${path.relative(REPO_ROOT, file)}:${
                    child.loc.start.line
                  }`,
                });
              for (const key of Object.keys(child))
                if (key !== 'loc') find(child[key]);
            })(node.children);
          }
        }
        for (const key of Object.keys(node)) if (key !== 'loc') walk(node[key]);
        if (pushed) stack.pop();
      })(ast.program);
    }
    return found;
  };

  /** True when `claims` gives `container`'s whole subtree the container role. */
  const coversEveryHeading = subject =>
    MATCHED_HEADINGS.every(tag =>
      new RegExp(`(^|[^-\\w])${tag}([^-\\w]|$)`).test(subject)
    );

  const claimed = (claims, container, role) =>
    claims.some(
      claim =>
        claim.container === container &&
        claim.role === role &&
        coversEveryHeading(claim.subject)
    );

  test('every such container in Mangrove’s JSX has a claim', () => {
    const { containers, claims } = partition('style');
    const unclaimed = nestings(containers)
      .filter(n => !claimed(claims, n.container, n.role))
      .map(
        n =>
          `${n.container} wraps <${n.heading}> at ${n.where} — add ` +
          `\`${n.container} :is(h1, h2, h3, a) { font-family: var(--mg-font-family-${n.role}); }\``
      );

    expect(unclaimed).toEqual([]);
  });

  test('the derivation is not vacuous', () => {
    // Everything above passes trivially if the compiled CSS stops yielding
    // containers or the JSX walk stops yielding nestings. Both numbers are
    // floors, not exact counts, so adding a component does not fail the suite.
    const { containers, claims } = partition('style');
    expect(containers.length).toBeGreaterThanOrEqual(10);
    expect(claims.length).toBeGreaterThanOrEqual(2);
    expect(nestings(containers).length).toBeGreaterThanOrEqual(1);
  });

  test.each(['style', 'style-gutenberg'])(
    '%s.css: every claim restates its container’s own role',
    entry => {
      // A claim that names the wrong role is worse than no claim: it looks like
      // protection and silently repaints the subtree. Assert the declaration,
      // not the selector.
      const { containers, claims } = partition(entry);
      const byRole = new Map(containers.map(c => [c.selector, c.role]));

      expect(claims.length).toBeGreaterThanOrEqual(2);
      for (const claim of claims) {
        expect({
          selector: claim.selector,
          role: claim.role,
          coversHeadings: coversEveryHeading(claim.subject),
        }).toEqual({
          selector: claim.selector,
          role: byRole.get(claim.container),
          coversHeadings: true,
        });
      }
    }
  );
});
