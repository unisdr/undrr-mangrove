/** @jest-environment node */

/**
 * The manifest's custom property inventory.
 *
 * A component's custom properties are its theming API, and before
 * undrr-mangrove#1207 they appeared nowhere machine-readable — a consuming
 * team had to grep the compiled CSS for them. The inventory is only worth
 * having if it is right, so this checks the extraction itself against fixed
 * CSS, and then checks the real library in both directions: nothing described
 * that the CSS does not have, and nothing exposed that nobody described.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  collectCustomProperties,
  GLOBAL_PREFIXES,
  MIN_PROPERTIES,
  NOT_PUBLIC,
  OWNERS,
  PROPERTY_DOCS,
} from '../ai-manifest/custom-properties.js';

const ROOT = path.resolve(__dirname, '../..');
const CSS_DIR = path.join(ROOT, 'stories/assets/css');
const compiled = fs.existsSync(path.join(CSS_DIR, 'style.css'));

/** Run the collector over one throwaway bundle of CSS. */
const collectFrom = (css, themeTokens = []) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-custom-props-'));
  try {
    fs.writeFileSync(path.join(dir, 'style.css'), css);
    return collectCustomProperties(dir, themeTokens);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

describe('collectCustomProperties', () => {
  it('separates a property with a default from an input hook', () => {
    const result = collectFrom(`
      .mg-notice { --mg-notice-bg: rebeccapurple; background: var(--mg-notice-bg); }
      .mg-card__icon { color: var(--mg-icon-fg, rgb(var(--mg-color-neutral-700))); }
    `);

    expect(result.byComponent['components-notice-notice']).toEqual([
      {
        name: '--mg-notice-bg',
        type: 'default',
        description: PROPERTY_DOCS['--mg-notice-bg'],
        default: 'rebeccapurple',
      },
    ]);
    expect(result.byComponent['components-cards-icon-card']).toEqual([
      {
        name: '--mg-icon-fg',
        type: 'hook',
        description: PROPERTY_DOCS['--mg-icon-fg'],
        default: 'rgb(var(--mg-color-neutral-700))',
      },
    ]);
  });

  it('treats :root, :where() and :is() as plain, not as modifiers', () => {
    // A bare "contains a colon" test called all three modifiers, which marked
    // about thirty properties declared on :root as modifier-only and took
    // their reported default from a var() fallback instead of the
    // declaration. The two agreed, so nothing was wrong — until one changed.
    const result = collectFrom(`
      :root { --mg-show-more-height: 200px; }
      :where(.mg-notice) { --mg-notice-bg: rebeccapurple; }
      .mg-show-more--collapsed { max-height: var(--mg-show-more-height, 999px); }
      .mg-notice { background: var(--mg-notice-bg, rebeccablue); }
    `);

    expect(result.byComponent['components-showmore']).toEqual([
      expect.objectContaining({ type: 'default', default: '200px' }),
    ]);
    expect(result.byComponent['components-notice-notice']).toEqual([
      expect.objectContaining({ type: 'default', default: 'rebeccapurple' }),
    ]);
  });

  it('calls a property only a modifier declares a hook', () => {
    // An unmodified switch computes --mg-switch-size to the empty string, so
    // it is a hook like its siblings. Typing it `default` made an artefact of
    // the parser read as a real difference between it and them.
    const result = collectFrom(`
      .mg-switch--small { --mg-switch-size: 1.125rem; }
      .mg-switch__track { inline-size: var(--mg-switch-size, 1.5rem); }
    `);

    expect(result.byComponent['components-forms-checkbox']).toEqual([
      expect.objectContaining({ type: 'hook', default: '1.5rem' }),
    ]);
  });

  it('does not read a property or a fallback out of a comment', () => {
    // Every component stylesheet opens with a docblock, and ShowMore's quotes
    // its own property. Parsed as CSS, a comment can invent a default that no
    // rule has, or a property that does not exist.
    const result = collectFrom(`
      /* --mg-notice-invented: 1px; */
      .mg-notice { background: var(--mg-notice-bg); }
    `);

    // The invented property is not published as Notice's fifth.
    expect(result.undocumented).toEqual([]);
    expect(result.byComponent['components-notice-notice']).toEqual([
      { name: '--mg-notice-bg', type: 'hook', description: expect.any(String) },
    ]);
  });

  it('does not take a fallback out of a comment', () => {
    const result = collectFrom(`
      /* Use var(--mg-notice-bg, red) to tint the panel. */
      .mg-notice { background: var(--mg-notice-bg); }
    `);

    expect(
      result.byComponent['components-notice-notice'][0].default
    ).toBeUndefined();
  });

  it('does not take a default from inside a media query', () => {
    // The at-rule used to be dropped, so a plain selector inside one looked
    // unconditional and its value was published as the default.
    const result = collectFrom(`
      @media (forced-colors: active) {
        .mg-notice { --mg-notice-bg: Canvas; }
      }
      .mg-notice { background: var(--mg-notice-bg, rebeccapurple); }
    `);

    expect(result.byComponent['components-notice-notice']).toEqual([
      expect.objectContaining({ type: 'hook', default: 'rebeccapurple' }),
    ]);
  });

  it('does not take a default from inside @supports', () => {
    // MegaMenu's mobile viewport is declared twice, the second time behind
    // @supports (height: 100dvh). Dropping the at-rule published whichever
    // came last as the value at rest.
    const result = collectFrom(`
      @supports (height: 100dvh) {
        .mg-notice { --mg-notice-bg: blue; }
      }
      .mg-notice { background: var(--mg-notice-bg, rebeccapurple); }
    `);

    expect(result.byComponent['components-notice-notice']).toEqual([
      expect.objectContaining({ type: 'hook', default: 'rebeccapurple' }),
    ]);
  });

  it('carries the at-rule context down through nesting', () => {
    // The stack has to carry `modifierOnly` into child blocks: a @keyframes
    // frame and a rule inside a nested at-rule both look like plain selectors
    // on their own.
    const nested = collectFrom(`
      @supports (x: y) { @media (min-width: 1px) {
        .mg-notice { --mg-notice-bg: blue; }
      } }
      .mg-notice { background: var(--mg-notice-bg, rebeccapurple); }
    `);
    const frame = collectFrom(`
      @keyframes in { from { --mg-notice-bg: blue; } }
      .mg-notice { background: var(--mg-notice-bg, rebeccapurple); }
    `);

    for (const result of [nested, frame]) {
      expect(result.byComponent['components-notice-notice']).toEqual([
        expect.objectContaining({ type: 'hook', default: 'rebeccapurple' }),
      ]);
    }
  });

  it('treats @layer as unconditional, but not a media query inside one', () => {
    // A cascade layer always applies, so a plain rule in one still declares
    // the value at rest. The condition, if there is one, is the inner at-rule.
    const layered = collectFrom(`
      @layer components { .mg-notice { --mg-notice-bg: blue; } }
      .mg-notice { background: var(--mg-notice-bg, rebeccapurple); }
    `);
    const conditional = collectFrom(`
      @layer components { @media print { .mg-notice { --mg-notice-bg: blue; } } }
      .mg-notice { background: var(--mg-notice-bg, rebeccapurple); }
    `);

    expect(layered.byComponent['components-notice-notice']).toEqual([
      expect.objectContaining({ type: 'default', default: 'blue' }),
    ]);
    expect(conditional.byComponent['components-notice-notice']).toEqual([
      expect.objectContaining({ type: 'hook', default: 'rebeccapurple' }),
    ]);
  });

  it.each([
    ['a text-direction scope', '[dir=rtl] .mg-notice'],
    ['a theme data attribute', '[data-theme=dark] .mg-notice'],
    ['a brand block', '.mg-theme-delta .mg-notice'],
    ['a state class', '.mg-notice.is-open'],
    ['a has- state class', '.mg-notice.has-icon'],
    // :has() is a condition in its own right, not a specificity wrapper like
    // :is() and :where(). Unwrapped alongside them, a rule that applies only
    // when the element contains something read as the value at rest.
    // .mg-card__hc:has(.mg-card__visual) is that exact shape in the bundles.
    ['a :has() condition', '.mg-notice:has(.mg-notice__icon)'],
    // A numeric BEM modifier: .mg-embed-container--1x1 is one in the bundles,
    // and a `--[a-z]` test read every one of them as a plain selector.
    ['a numeric modifier', '.mg-notice--2up'],
  ])('does not take a default from %s', (_label, selector) => {
    // A "-- or :" test called none of these conditional, so a declaration
    // made only under one published that case's value as everyone's. The 14
    // --mg-tab-* properties have .mg-theme-* declarations and were right only
    // because each also has a generic declaration that wins here.
    const result = collectFrom(`
      ${selector} { --mg-notice-bg: conditional; }
      .mg-notice { background: var(--mg-notice-bg, resting); }
    `);

    expect(result.byComponent['components-notice-notice']).toEqual([
      expect.objectContaining({ type: 'hook', default: 'resting' }),
    ]);
  });

  it('does not mistake a class that merely contains "is-" for a state', () => {
    // The state test matches at a class boundary. Without that, every
    // .mg-*-is-* and .mg-*-has-* class would read as conditional and a real
    // default would be thrown away.
    const result = collectFrom(`
      .mg-notice-has-icon .mg-notice { --mg-notice-bg: resting; }
      .mg-notice { background: var(--mg-notice-bg, fallback); }
    `);

    expect(result.byComponent['components-notice-notice']).toEqual([
      expect.objectContaining({ type: 'default', default: 'resting' }),
    ]);
  });

  it('does not let a brace inside a quoted value desync the brace walk', () => {
    // The stray "{" pushed a frame that the rule's own "}" then popped,
    // leaving the modifier's frame open. Every declaration after it inherited
    // `modifierOnly`, so a neighbouring property's default read as a hook.
    const result = collectFrom(`
      .mg-notice--warning { background-image: url("chrome{less"); }
      .mg-notice { --mg-notice-bg: resting; }
    `);

    expect(result.byComponent['components-notice-notice']).toEqual([
      expect.objectContaining({ type: 'default', default: 'resting' }),
    ]);
  });

  it('does not let a semicolon inside a quoted value truncate it', () => {
    // --mg-icon-svg carries one today, in an SVG style='fill-rule:evenodd;…'
    // attribute. It is inert only because the value exceeds the length cap.
    const result = collectFrom(
      '.mg-notice { --mg-notice-bg: url("a;b"); background: var(--mg-notice-bg); }'
    );

    expect(result.byComponent['components-notice-notice'][0].default).toBe(
      'url("a;b")'
    );
  });

  it('does not treat a comment marker inside a string as a comment', () => {
    // Paired with a "*/" in a later string, everything between them was
    // deleted — including the declaration in the middle.
    const result = collectFrom(`
      .mg-tag::before { content: "/*"; }
      .mg-notice { --mg-notice-bg: resting; }
      .mg-tag::after { content: "*/"; }
    `);

    expect(result.byComponent['components-notice-notice']).toEqual([
      expect.objectContaining({ type: 'default', default: 'resting' }),
    ]);
  });

  it('reads a var() fallback with a parenthesis inside a quoted url()', () => {
    const result = collectFrom(
      '.mg-notice { background: var(--mg-notice-bg, url("a)b")); }'
    );

    expect(result.byComponent['components-notice-notice'][0].default).toBe(
      'url("a)b")'
    );
  });

  it('publishes no default for a hook only a modifier declares', () => {
    // `default` is the value at rest, and a modifier's declaration is not
    // one. Publishing it anyway contradicted the field's own description, and
    // for --mg-mega-mobile-viewport published a 90vh that @supports
    // (height: 100dvh) re-declares — the one value no current browser uses.
    const result = collectFrom(`
      .mg-tree--guides .mg-tree__group { --mg-tree-guide-offset: 1rem; }
      .mg-tree__group { margin-inline-start: var(--mg-tree-guide-offset); }
    `);

    expect(result.byComponent['components-navigation-tree']).toEqual([
      {
        name: '--mg-tree-guide-offset',
        type: 'hook',
        description: PROPERTY_DOCS['--mg-tree-guide-offset'],
      },
    ]);
  });

  it('flags a property every stylesheet reads inside rgb()', () => {
    const result = collectFrom(`
      .mg-hub-header { background: rgb(var(--mg-hub-header-surface, 255 255 255)); }
      .mg-notice { background: var(--mg-notice-bg, rebeccapurple); }
    `);

    expect(result.byComponent['patterns-content-hub'][0]).toMatchObject({
      format: 'srgb-channels',
      wrapInRgb: true,
    });
    expect(
      result.byComponent['components-notice-notice'][0].wrapInRgb
    ).toBeUndefined();
  });

  it('does not flag a property one stylesheet reads unwrapped', () => {
    const result = collectFrom(`
      .a { background: rgb(var(--mg-hub-header-surface)); }
      .b { background: var(--mg-hub-header-surface); }
    `);

    expect(
      result.byComponent['patterns-content-hub'][0].wrapInRgb
    ).toBeUndefined();
  });

  it('takes the default from the plain rule, not from a modifier', () => {
    // .mg-switch--small declares --mg-switch-size first in the real bundle.
    // Reporting 1.125rem as the default would be wrong in both directions:
    // it is neither what an unmodified switch measures nor what a reader can
    // set to get one.
    const result = collectFrom(`
      .mg-switch--small { --mg-switch-size: 1.125rem; }
      .mg-switch__track { inline-size: var(--mg-switch-size, 1.5rem); }
    `);

    expect(result.byComponent['components-forms-checkbox']).toEqual([
      expect.objectContaining({ name: '--mg-switch-size', default: '1.5rem' }),
    ]);
  });

  it('reads a var() fallback that is itself a function call', () => {
    const result = collectFrom(
      '.mg-switch { background: var(--mg-switch-track-overlay--pending, rgb(var(--mg-color-neutral-500) / 0.4)); }'
    );

    expect(result.byComponent['components-forms-checkbox'][0].default).toBe(
      'rgb(var(--mg-color-neutral-500) / 0.4)'
    );
  });

  it('leaves theme tokens to tokens.json', () => {
    const result = collectFrom(
      ':root { --mg-spacing-100: 0.5rem; --mg-card-border-radius: 4px; }',
      ['--mg-spacing-100', '--mg-card-border-radius']
    );

    expect(result.unattributed).toEqual([]);
    expect(result.byComponent).toEqual({});
  });

  it('reports a described property the CSS does not have', () => {
    const result = collectFrom('.mg-notice { color: red; }');

    expect(result.absent).toContain('--mg-notice-bg');
  });

  it('reports an exposed property nothing describes', () => {
    const result = collectFrom('.mg-notice { --mg-notice-invented: 1px; }');

    expect(result.undocumented).toEqual([
      'components-notice-notice: --mg-notice-invented',
    ]);
  });

  it('reports a property no component claims', () => {
    const result = collectFrom('.thing { --mg-unclaimed-thing: 1px; }');

    expect(result.unattributed).toEqual(['--mg-unclaimed-thing']);
  });

  it('says so rather than reporting an empty library when nothing is compiled', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-custom-props-'));
    try {
      expect(collectCustomProperties(dir).skipped).toMatch(/yarn scss/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('authored data', () => {
  it('describes every property it claims, and claims every one it describes', () => {
    const unclaimed = Object.keys(PROPERTY_DOCS).filter(
      name =>
        !Object.values(OWNERS).some(matchers =>
          matchers.some(matcher =>
            matcher.endsWith('-') ? name.startsWith(matcher) : name === matcher
          )
        )
    );

    expect(unclaimed).toEqual([]);
  });

  it('gives a reason for every property held back from the API', () => {
    for (const [name, reason] of Object.entries(NOT_PUBLIC)) {
      expect(typeof reason).toBe('string');
      expect(reason.length).toBeGreaterThan(20);
      expect(PROPERTY_DOCS[name]).toBeUndefined();
    }
  });

  it('records a count floor for every component that owns properties', () => {
    // NOT_PUBLIC is the one way to take a property out of the published API,
    // and on its own it did so in silence: moving --mg-tab-radius into it
    // printed "Validation passed", kept the suite green, and dropped Tabs
    // from 14 properties to 13 with nothing to notice it. The floor is what
    // notices.
    expect(Object.keys(MIN_PROPERTIES).sort()).toEqual(
      Object.keys(OWNERS).sort()
    );
    for (const count of Object.values(MIN_PROPERTIES)) {
      expect(count).toBeGreaterThan(0);
    }
  });

  it('says where each theme-layer group lives', () => {
    // These are the fourth list. Naming a prefix here is what keeps llms.txt
    // from claiming a partition it does not have.
    for (const [prefix, meta] of Object.entries(GLOBAL_PREFIXES)) {
      expect(prefix.startsWith('--mg-')).toBe(true);
      expect(meta.label.length).toBeGreaterThan(5);
      expect(meta.where).toMatch(/\.scss/);
    }
  });
});

// The library itself, which needs `yarn scss` to have run. Skipped rather
// than failed without it, the same way the manifest's own CSS class check is
// — locally. In CI it must not skip: these are the only assertions that check
// the real library, and a skipped assertion passes. `.github/workflows/
// storybook.yml` runs `yarn build` (so `yarn scss`) before `yarn test`;
// reorder those steps and every check below would quietly stop running.
const describeCompiled = compiled ? describe : describe.skip;

(process.env.CI ? describe : describe.skip)('CI preconditions', () => {
  it('has compiled CSS, so the library checks below are not skipped', () => {
    expect(compiled).toBe(true);
  });
});

describeCompiled('the compiled library', () => {
  const { buildTokensDictionary } = require('../build-tokens.cjs');
  const result = collectCustomProperties(
    CSS_DIR,
    buildTokensDictionary().tokens.map(token => token.name)
  );

  it('exposes no component property that is undescribed', () => {
    expect(result.undocumented).toEqual([]);
  });

  it('leaves no --mg-* property belonging to nobody', () => {
    expect(result.unattributed).toEqual([]);
  });

  it('describes no property the compiled CSS has dropped', () => {
    expect(result.absent).toEqual([]);
  });

  it('covers every component that exposes properties', () => {
    // A partial rollout reads as "this component has none", which is the
    // failure mode the hydration contracts had before #1194.
    expect(Object.keys(result.byComponent).sort()).toEqual(
      Object.keys(OWNERS).sort()
    );
  });

  it('publishes at least as many properties as each floor records', () => {
    const shrunk = Object.entries(MIN_PROPERTIES)
      .filter(([id, floor]) => (result.byComponent[id]?.length ?? 0) < floor)
      .map(
        ([id, floor]) =>
          `${id}: ${result.byComponent[id]?.length ?? 0}, was ${floor}`
      );

    expect(shrunk).toEqual([]);
  });
});
