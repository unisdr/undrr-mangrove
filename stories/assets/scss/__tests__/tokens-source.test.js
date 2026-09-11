/**
 * Design-token source contract.
 *
 * `tokens/*.yaml` is the single source every brand is built from;
 * `scripts/build-tokens.cjs` emits the Sass partials Mangrove's own stylesheet
 * compiles against. Three ways that can rot, all silent:
 *
 *   1. someone edits a generated partial, or edits the YAML without
 *      rebuilding, so the working copy the SCSS compiles against and the YAML
 *      disagree. The partials are build output and are not committed, so this
 *      no longer guards a file in the repo; it guards the tree the rest of the
 *      suite — and `yarn storybook` — actually compiles. Jest's globalSetup
 *      writes them only when they are MISSING, precisely so a stale one still
 *      fails here instead of being repaired behind the developer's back;
 *   2. someone re-hardcodes a brand value into a hand-written Sass file,
 *      which is exactly how _theme-delta.scss came to hold a second,
 *      independent copy of the DELTA brand;
 *   3. the generated partials are build output and are not committed, so
 *      nothing in the repository records what the generator produces. On a
 *      fresh clone — every CI run — globalSetup writes the partials from
 *      `build()`, and comparing `build()` to them compares the generator to
 *      itself. tokens/output-baseline.json is the committed digest that makes
 *      "the generator's output moved" fail somewhere;
 *   4. the generator quietly produces wrong output instead of failing —
 *      the failure mode the whole architecture exists to prevent. The
 *      second half of this file mutation-tests each guard, because a guard
 *      nobody has watched fail is not a guard.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../../..');
const { build, TokenError, baselineOf, readBaseline } = require(
  path.join(ROOT, 'scripts/build-tokens.cjs')
);

const BRANDS = ['mangrove', 'preventionweb', 'irp', 'mcr', 'delta'];

describe('design-token generator', () => {
  test('generated Sass partials are up to date with the YAML sources', () => {
    const stale = [];
    for (const [relative, expected] of build()) {
      const absolute = path.join(ROOT, relative);
      const actual = fs.existsSync(absolute)
        ? fs.readFileSync(absolute, 'utf8')
        : null;
      if (actual !== expected) stale.push(relative);
    }

    // Run `yarn build:tokens` to fix. (A partial that is absent entirely
    // cannot reach here: globalSetup generates missing ones before any suite
    // runs, so a fresh clone starts from an up-to-date tree.)
    expect(stale).toEqual([]);
  });

  test('emitted bytes match the committed baseline', () => {
    // The stale-partial test above cannot catch this. On a fresh clone the
    // partials are written from `build()` by globalSetup, so it compares the
    // generator to its own output. This compares it to a digest committed at
    // the time the output was last reviewed.
    const baseline = readBaseline();
    const actual = baselineOf(build());
    expect(actual.algorithm).toBe(baseline.algorithm);

    const moved = [];
    for (const name of new Set([
      ...Object.keys(baseline.files),
      ...Object.keys(actual.files),
    ])) {
      if (baseline.files[name] === actual.files[name]) continue;
      if (!baseline.files[name])
        moved.push(`${name} — emitted, not in the baseline`);
      else if (!actual.files[name])
        moved.push(`${name} — in the baseline, no longer emitted`);
      else moved.push(`${name} — different bytes`);
    }

    const report = moved.length
      ? [
          'The generator no longer emits what tokens/output-baseline.json records:',
          ...moved.sort().map(line => `  ${line}`),
          '',
          'If a tokens/*.yaml change caused this, it is expected. Regenerate the',
          'partials and the baseline together, in that same commit:',
          '',
          '    yarn build:tokens',
          '    node scripts/build-tokens.cjs --baseline',
          '',
          'and review the resulting diff of stories/assets/scss/generated/.',
          '',
          'If nothing in tokens/ changed, then scripts/build-tokens.cjs changed',
          'what it produces — that is the regression this test exists to catch.',
        ].join('\n')
      : '';
    expect(report).toBe('');
  });

  test('emits one partial per distributed brand', () => {
    expect([...build().keys()].sort()).toEqual(
      BRANDS.map(
        brand => `stories/assets/scss/generated/_tokens-${brand}.scss`
      ).sort()
    );
  });

  test('generated partials warn against hand-editing and name the command', () => {
    for (const [relative, contents] of build()) {
      expect(contents).toContain('GENERATED FILE — DO NOT EDIT.');
      expect(contents).toContain('Regenerate: yarn build:tokens');
      expect(fs.readFileSync(path.join(ROOT, relative), 'utf8')).toContain(
        'GENERATED FILE — DO NOT EDIT.'
      );
    }
  });

  test('writes are idempotent: a second build changes no bytes', () => {
    // Generated output sits inside webpack's watch scope. Rewriting identical
    // bytes bumps mtime, rebuilds, and invalidates the chunk hash held by any
    // open Storybook tab.
    const first = build();
    const second = build();
    for (const [relative, contents] of first) {
      expect(second.get(relative)).toBe(contents);
    }
  });

  test('$description reasoning survives into the generated files', () => {
    // These record real decisions — a hover step that is deliberately lighter
    // than its base, and a deliberate WCAG divergence. Losing them would make
    // the next reader "fix" them.
    const delta = build().get(
      'stories/assets/scss/generated/_tokens-delta.scss'
    );
    expect(delta).toContain('LIGHTER than the base colour');
    expect(delta).toContain('#006968 is 6.52:1');
  });

  test('no hand-written Sass re-hardcodes a generated brand value', () => {
    const literals = [];
    for (const contents of build().values()) {
      for (const match of contents.matchAll(
        /^(?:\$|\s+--)[a-z0-9_-]+: (.+);$/gim
      )) {
        // Channel triplets and rgb() values are distinctive enough to match
        // literally; a bare "1rem" would not be.
        if (/^\d+ \d+ \d+$|^rgb\(\d/.test(match[1])) literals.push(match[1]);
      }
    }
    expect(literals.length).toBeGreaterThan(10);

    // Scoped to the hand-written theme files, which are where the duplication
    // actually happened: _theme-delta.scss held an independent copy of the
    // DELTA brand alongside the generated one. (_tokens-data-viz.scss does
    // re-state neutral and DELTA channel values; that palette is a separate
    // concern and is not migrated here.)
    const hardcoded = [];
    const guarded = [
      ...['preventionweb', 'irp', 'mcr', 'delta'].map(
        brand => `stories/assets/scss/_theme-${brand}.scss`
      ),
      'stories/assets/scss/_tokens-tabs.scss',
      'stories/assets/scss/_variables.scss',
    ];
    for (const relative of guarded) {
      const contents = fs.readFileSync(path.join(ROOT, relative), 'utf8');
      for (const value of literals) {
        // Anchored: a bare substring search matches "0 0 0" inside a
        // box-shadow offset list and reports a duplication that is not one.
        const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (
          new RegExp(`(?::\\s*|\\(\\s*)${escaped}\\s*(?:[;)]|/)`).test(contents)
        ) {
          hardcoded.push(`${relative}: ${value}`);
        }
      }
    }

    expect(hardcoded).toEqual([]);
  });
});

/**
 * Mutation tests for the loud-failure guards. Each writes a deliberately
 * broken token source into a temporary directory and asserts the generator
 * refuses it rather than emitting something plausible-looking.
 */
describe('the generator fails loudly', () => {
  let dir;

  const BASE = `
$brand: { id: mangrove, base: true, title: Base, selector: ':root' }
color:
  $type: color
  neutral-0: { $value: '#ffffff' }
  interactive: { $value: '{color.neutral-0}' }
`;
  const DEFAULT_BRAND = `
$brand: { id: undrr, output: mangrove, default: true, title: UNDRR, selector: ':root' }
color:
  $type: color
  blue-900: { $value: '#004f91' }
  interactive: { $value: '{color.blue-900}' }
`;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-tokens-'));
    fs.writeFileSync(path.join(dir, 'mangrove.yaml'), BASE);
    fs.writeFileSync(path.join(dir, 'undrr.yaml'), DEFAULT_BRAND);
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  const write = (name, body) => fs.writeFileSync(path.join(dir, name), body);
  const run = () => () => build({ tokensDir: dir });

  test('the fixture itself builds, so every failure below is the mutation', () => {
    expect(run()).not.toThrow();
  });

  test('unknown reference', () => {
    write(
      'x.yaml',
      `$brand: { id: x, title: X, selector: '.x' }
color: { $type: color, tag: { $value: '{color.nope}' } }`
    );
    expect(run()).toThrow(/references unknown token "\{color\.nope\}"/);
    expect(run()).toThrow(TokenError);
  });

  test('circular reference', () => {
    write(
      'x.yaml',
      `$brand: { id: x, title: X, selector: '.x' }
color:
  $type: color
  a: { $value: '{color.b}' }
  b: { $value: '{color.a}' }`
    );
    expect(run()).toThrow(/circular reference/);
  });

  test('duplicate output name across brands', () => {
    write(
      'x.yaml',
      `$brand: { id: x, output: shared, title: X, selector: '.x' }
color: { $type: color, tag: { $value: '{color.interactive}' } }`
    );
    write(
      'y.yaml',
      `$brand: { id: y, output: shared, title: Y, selector: '.y' }
color: { $type: color, tag: { $value: '{color.interactive}' } }`
    );
    expect(run()).toThrow(/two brands write the same output name "shared"/);
  });

  test('a $value with nothing after it', () => {
    // A YAML key with an empty value parses as null. It used to reach the
    // emitter and print the string "null" -- invalid CSS a browser drops in
    // silence, which is the failure mode this whole suite exists to prevent.
    write(
      'x.yaml',
      `$brand: { id: x, title: X, selector: '.x' }
size: { $type: dimension, gap: { $value: } }`
    );
    expect(run()).toThrow(/\$value with nothing after it/);
  });

  test('unknown format', () => {
    write(
      'x.yaml',
      `$brand: { id: x, title: X, selector: '.x' }
color: { $type: color, tag: { $value: '#ff0000', $format: srgb-hex } }`
    );
    expect(run()).toThrow(/unknown format "srgb-hex"/);
  });

  test('linking to a $private token, which has no custom property', () => {
    // The mistake that produces a dead var() chain: a brand primitive is not
    // emitted as a property, so it can only be resolved at build time.
    write(
      'x.yaml',
      `$brand: { id: x, title: X, selector: '.x' }
brand: { $type: color, $private: true, primary: { $value: '#123456' } }
color: { $type: color, tag: { $value: '{brand.primary}' } }`
    );
    expect(run()).toThrow(/is \$private and has no custom property/);
  });

  test('a colour that cannot be expressed in the shape it is emitted in', () => {
    // The value-type trap, caught at the source. A named colour, an oklch()
    // value or a finished rgb() cannot be channels; a triplet in a colour
    // position is invalid CSS and is discarded silently.
    write(
      'x.yaml',
      `$brand: { id: x, title: X, selector: '.x' }
color: { $type: color, tag: { $value: 'papayawhip' } }`
    );
    expect(run()).toThrow(/is not sRGB channels/);
  });

  test('a hex colour that is not 6 digits', () => {
    write(
      'x.yaml',
      `$brand: { id: x, title: X, selector: '.x' }
color: { $type: color, tag: { $value: '#f00' } }`
    );
    expect(run()).toThrow(/must be 6-digit hex/);
  });

  test('casting a non-colour token to rgb()', () => {
    write(
      'x.yaml',
      `$brand: { id: x, title: X, selector: '.x' }
size: { $type: dimension, gap: { $value: '4px' } }
color: { $type: color, tag: { $value: '{rgb(size.gap)}' } }`
    );
    expect(run()).toThrow(/casts .* to rgb\(\) but its \$type is "dimension"/);
  });

  test('two tokens claiming the same custom property', () => {
    write(
      'x.yaml',
      `$brand: { id: x, title: X, selector: '.x' }
color: { $type: color, tag: { $value: '#123456' } }
alias: { $type: color, dup: { $name: '--mg-color-tag', $value: '#654321' } }`
    );
    expect(run()).toThrow(/is emitted by both/);
  });

  test('a $brand block with no id', () => {
    write('x.yaml', 'color: { $type: color, tag: { $value: "#123456" } }');
    expect(run()).toThrow(/missing \$brand\.id/);
  });

  test('an extends chain naming a brand that does not exist', () => {
    write(
      'x.yaml',
      `$brand: { id: x, extends: ghost, title: X, selector: '.x' }
color: { $type: color, tag: { $value: '{color.interactive}' } }`
    );
    expect(run()).toThrow(/\$brand\.extends "ghost" is not a known brand/);
  });

  test('an override that re-values a rem token as a link', () => {
    // The shape an override inherits is enforced, not quietly abandoned.
    // tokens/delta.yaml did exactly this: it re-valued a `$format: rem`
    // token as `{width.600}`, and because the missing $format silently
    // reverted the token to `literal` the generator emitted a var() chain
    // where the base declared a rem conversion. Now it says so.
    write(
      'mangrove.yaml',
      `${BASE}
size:
  $type: dimension
  $format: rem
  wide: { $value: 600 }
  gap: { $value: 8 }`
    );
    write(
      'x.yaml',
      `$brand: { id: x, title: X, selector: '.x' }
size: { $type: dimension, gap: { $value: '{size.wide}' } }`
    );
    expect(run()).toThrow(/format "rem" needs a number/);
  });
});

/**
 * An override states a new VALUE. Everything else the base declared about the
 * token — the shape it is emitted in, the property it is emitted as, whether
 * it is emitted at all — carries, because `flatten` writes every key and a
 * key the override did not state used to arrive at `mergeLayers` as
 * `undefined` and delete the base's. Same fixture style as the suite above:
 * a deliberately minimal source tree, built through the real generator.
 */
describe('an override inherits the shape it does not restate', () => {
  let dir;

  const BASE = `
$brand: { id: mangrove, base: true, title: Base, selector: ':root' }
color:
  $type: color
  neutral-0: { $value: '#ffffff' }
  interactive: { $value: '{color.neutral-0}' }
  # A colour consumed inside a \`border:\` shorthand, so it must be emitted
  # as a finished colour. A bare triplet there is invalid CSS and is dropped
  # silently — the .mg-button-outline bug, documented in tokens/mangrove.yaml.
  button-border: { $value: '#004f91', $format: srgb-rgb-function }
  # A property whose name consumers hardcode, so it cannot follow the id.
  legacy: { $name: '--mg-legacy-alias', $value: '#112233' }
brand:
  $type: color
  $private: true
  primary: { $value: '#abcdef' }
`;
  const DEFAULT_BRAND = `
$brand: { id: undrr, output: mangrove, default: true, title: UNDRR, selector: ':root' }
color: { $type: color, blue-900: { $value: '#004f91' } }
`;
  // Every token here is re-valued and NOTHING else is restated.
  const SUB_BRAND = `
$brand: { id: sub, title: Sub, selector: '.mg-theme-sub' }
color:
  $type: color
  button-border: { $value: '#ff0000' }
  legacy: { $value: '#445566' }
brand:
  $type: color
  primary: { $value: '#000000' }
`;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-tokens-'));
    fs.writeFileSync(path.join(dir, 'mangrove.yaml'), BASE);
    fs.writeFileSync(path.join(dir, 'undrr.yaml'), DEFAULT_BRAND);
    fs.writeFileSync(path.join(dir, 'sub.yaml'), SUB_BRAND);
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  const sub = () =>
    build({ tokensDir: dir }).get(
      'stories/assets/scss/generated/_tokens-sub.scss'
    );

  test('the fixture builds and the base emits each token as declared', () => {
    const base = build({ tokensDir: dir }).get(
      'stories/assets/scss/generated/_tokens-mangrove.scss'
    );
    expect(base).toContain('--mg-color-button-border: rgb(0 79 145);');
    expect(base).toContain('--mg-legacy-alias: 17 34 51;');
    expect(base).not.toContain('--mg-brand-primary');
  });

  test('$format carries, so a re-valued colour keeps its emitted shape', () => {
    expect(sub()).toContain('--mg-color-button-border: rgb(255 0 0);');
    expect(sub()).not.toContain('--mg-color-button-border: 255 0 0;');
  });

  test('$name carries, so the override reaches the property consumers read', () => {
    expect(sub()).toContain('--mg-legacy-alias: 68 85 102;');
    // Writing --mg-color-legacy instead would leave --mg-legacy-alias at the
    // base value: the override would be a silent no-op.
    expect(sub()).not.toContain('--mg-color-legacy');
  });

  test('$private carries, so re-valuing a primitive does not publish it', () => {
    expect(sub()).not.toContain('--mg-brand-primary');
  });

  test('an override may still turn a private token public, by saying so', () => {
    // Inheritance must not become a trapdoor: a stated value wins, including
    // a stated `false`.
    fs.writeFileSync(
      path.join(dir, 'sub.yaml'),
      `${SUB_BRAND}\n`.replace(
        "  primary: { $value: '#000000' }",
        "  primary: { $private: false, $value: '#000000' }"
      )
    );
    expect(sub()).toContain('--mg-brand-primary: 0 0 0;');
  });
});
