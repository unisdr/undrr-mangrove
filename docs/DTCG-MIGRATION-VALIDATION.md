# DTCG foundation validation

This records local checks for the first implementation of [#1495](https://github.com/unisdr/undrr-mangrove/issues/1495). It covers the source-format migration and exchange-file distribution. Delta 2027 and the React Aria ComboBox integration are separate changes.

## Comparison baseline

The feature branch starts from `release/3.0`, with main's 2.5.0 work merged locally at `adae1531513c806456e8fd69c581188ac9114bcd`. The merge preserves the 3.0 icon retirement and isolated preview policy.

Before the token sources changed, the validation agent captured generated Sass, the theme-property dictionary and seven compressed CSS bundles. The comparison uses the same installed Dart Sass 1.108.2 and Node 24.18.0 on both sides.

## Automated checks

- Full Jest run: 223 suites passed, 5,078 tests passed and one existing test skipped.
- Focused typed-source, source-baseline, assembly and published-path checks: 95 tests passed.
- Repository formatting and lint checks pass; lint reports 26 existing warnings and no errors.
- Production build, dependency consistency and manifest validation pass.
- A watcher smoke test confirms a source save regenerates both Sass and portable exchange files.

## Compatibility results

- Seven compiled bundles match exactly: `style`, `style-all`, `style-delta`, `style-gutenberg`, `style-irp`, `style-mcr` and `style-preventionweb`.
- Twelve Drupal import/use recipes, three Sass reassignments and the shared helper API checks pass.
- All 221 public theme-property dictionary records retain their values. Generated Sass changes are limited to source-path/editing comments, and dictionary scope prose now names the JSON sources.
- The five assembled-package exchange files contain no Mangrove build extensions or CSS-only recipes. Independent literal-document traversal resolves 403 aliases and 87 JSON Pointers with no missing targets.
- An assembled npm package dry run contains all five exchange documents at `tokens/{brand}.tokens.json`, without source authoring fragments or the `stories/` tree.

The distinction between authoring fragments and self-contained exchange files is documented in [Design-token sources](DESIGN-TOKENS.md). The compiler supports the representations used by these sources; it is not a universal implementation of every DTCG input feature.

## Independent review findings fixed

Review and mutation tests found defects that initial output comparisons did not detect:

- Typed alpha and colour-component edits could be hidden by old output settings.
- Shadow edits could remain suppressed by a previous `none` or omitted-spread convention.
- A brand dimension override could lose an inherited output format.
- Invalid composite values were accepted too broadly.
- Exported JSON Pointers could target properties beneath an unresolved alias string.

Regression tests cover the fixes. Matching the unchanged theme output alone does not establish that future authored edits behave correctly.

## Visual and runtime checks

A separate agent inspected before/after renders of all five themes at 1440px, direct pages at 390px and RTL layouts. No migration differences or mobile horizontal overflow were observed in the fixture.

Twenty computed comparisons match: five wrapper themes, each under the default or Delta body theme, with local overrides on or off. Local interactive-colour changes propagate identically, while button sizes resolved at build time remain unchanged when the underlying runtime size scale is overridden.

The fixture can be regenerated after an independent baseline capture:

```sh
node scripts/create-token-review.mjs /tmp/mg-dtcg-baseline .cache/token-review
```

The local review page is served at `http://127.0.0.1:6127/index.html`. Screenshots are retained in `.cache/token-review/evidence/` in the feature worktree.

This visual pass did not emulate forced colours or establish keyboard focus-ring appearance: the available browser keyboard actions did not activate `:focus-visible`. It does not establish Windows High Contrast behaviour, Delta 2027 design acceptance or integration inside a consuming product.
