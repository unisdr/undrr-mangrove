# DTCG foundation validation

This records local checks for the first implementation of [#1495](https://github.com/unisdr/undrr-mangrove/issues/1495). It covers the source-format migration and exchange-file distribution. Delta 2027 and the React Aria ComboBox integration are separate changes.

## Comparison baseline

The feature branch starts from `release/3.0`, with main's 2.5.0 work merged locally at `adae1531513c806456e8fd69c581188ac9114bcd`. The merge preserves the 3.0 icon retirement and isolated preview policy.

Before the token sources changed, the validation agent captured generated Sass, the theme-property dictionary and seven compressed CSS bundles. The comparison uses the same installed Dart Sass 1.108.2 and Node 24.18.0 on both sides.

## Automated checks

- Full Jest run: 223 suites passed, 5,089 tests passed and one existing test skipped.
- Focused typed-source, source-baseline, assembly and published-path checks: 106 tests passed.
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

## Follow-up red-team corrections

A fresh review of commit `826c301b` found four additional compiler defects. Export construction followed inherited object properties for names such as `__proto__`; valid spacing aliases could be converted twice; component-derived colours failed when their source emitted a complete colour; and shadow references to private values did not honour literal resolution recursively. A related literal dimension alias also needed its own output-unit conversion.

The fixes preserve special JSON names with safe dictionaries, retain unit-bearing runtime aliases, lower derived colours from typed values when necessary, and materialise private/literal composite members. Ten additional regression cases reproduced eight failures before correction. The focused post-fix run passes 106 tests across four suites. An additional profile guard confirms that unsupported whole-object dimension pointers inside shadows are rejected before CSS output. The final seven-bundle and twelve-recipe CSS equivalence checks also pass.

Derived colours referencing a complete-colour CSS output are materialised at build time. Source edits propagate on rebuild, but runtime overrides of that complete-colour property do not propagate into the derivative. Channel-based references remain live. This boundary is documented in the source guide.

## Visual and runtime checks

A separate agent inspected before/after renders of all five themes at 1440px, direct pages at 390px and RTL layouts. No migration differences or mobile horizontal overflow were observed in the fixture.

Twenty computed comparisons match: five wrapper themes, each under the default or Delta body theme, with local overrides on or off. Local interactive-colour changes propagate identically, while button sizes resolved at build time remain unchanged when the underlying runtime size scale is overridden.

The fixture can be regenerated after an independent baseline capture:

```sh
node scripts/create-token-review.mjs /tmp/mg-dtcg-baseline .cache/token-review
```

The local review page is served at `http://127.0.0.1:6127/index.html`. Screenshots are retained in `.cache/token-review/evidence/` in the feature worktree.

This visual pass did not emulate forced colours or establish keyboard focus-ring appearance: the available browser keyboard actions did not activate `:focus-visible`. It does not establish Windows High Contrast behaviour, Delta 2027 design acceptance or integration inside a consuming product.
