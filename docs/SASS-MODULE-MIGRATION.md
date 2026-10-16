# Sass module migration evidence

Issue: [#683](https://github.com/unisdr/undrr-mangrove/issues/683).

All seven public `style*.scss` paths now load modules with `@use` / `@forward`. Internal helpers use `as *` to retain concise calls such as `mg-rem(16)` and `@include mg-focus-ring`. Components declare their own dependencies. Font URLs and shared font file-name/version configuration live in a module that emits no CSS, avoiding the `fonts → face → fonts` loop produced by a plain automatic migration. Generated token partials are unchanged and remain generator-owned.

## Reproduce the CSS comparison

The baseline is unmodified commit `378dcdcc2d9adfd9e8d56b5ad1f585f8eca0e4c1`, captured before implementation. The checked-in [machine-readable evidence](sass-module-equivalence.json) records both compressed CSS SHA-256 values for every bundle, using Dart Sass 1.105.1.

```sh
yarn test:sass-equivalence
# Optionally record the result or compare a different baseline commit:
SASS_EQUIVALENCE_REPORT=/tmp/sass-equivalence.json \
  node scripts/check-sass-equivalence.mjs 378dcdcc2d9adfd9e8d56b5ad1f585f8eca0e4c1
```

The command archives the baseline into a temporary directory, generates its tokens from its own sources, and compiles baseline and current sources with the same installed compiler. It cleans up the temporary tree. It requires that Git commit locally and installed dependencies; it does not fetch or modify the baseline. This is a migration review guard: subsequent intentional CSS changes should be compared with an appropriate review baseline rather than treated as migration regressions forever.

| Bundle | Compressed bytes | Comparison |
| --- | ---: | --- |
| `style` | 397633 | Four selector-list permutations |
| `style-all` | 409353 | Four selector-list permutations |
| `style-delta` | 401212 | Four selector-list permutations |
| `style-gutenberg` | 103141 | **Exact byte equality** |
| `style-irp` | 400214 | Four selector-list permutations |
| `style-mcr` | 400586 | Four selector-list permutations |
| `style-preventionweb` | 400240 | Four selector-list permutations |

Six bundles have the same four differences from Sass's module-scoped `@extend`. These are permutations within existing comma-separated selector lists, with identical membership:

1. `%paragraph-font-300`: `.mg-segmented-control__legend,.mg-form-group__legend,.mg-accordion>details>summary,details.mg-details>summary` becomes `.mg-segmented-control__legend,.mg-form-group__legend,details.mg-details>summary,.mg-accordion>details>summary`. This occurs twice: the base rule and its media-query rule.
2. `%border-none`: `.mg-table.mg-table--stacked.mg-table--border tr th,.mg-table.mg-table--stacked.mg-table--border tr td,.mg-table.mg-table--striped tr` becomes `.mg-table.mg-table--striped tr,.mg-table.mg-table--stacked.mg-table--border tr th,.mg-table.mg-table--stacked.mg-table--border tr td`.
3. `%img_none`, extended by `%border-none`: `.menu li a,.mg-table.mg-table--stacked.mg-table--border tr th,.mg-table.mg-table--stacked.mg-table--border tr td,.mg-table.mg-table--striped tr` becomes `.menu li a,.mg-table.mg-table--striped tr,.mg-table.mg-table--stacked.mg-table--border tr th,.mg-table.mg-table--stacked.mg-table--border tr td`.

The comparator parses CSS with PostCSS, permits only these three named selector sets at matching rule positions, and then requires exact compressed text equality after restoring those four selector strings. PostCSS's comma parser handles nested functional selectors. It never sorts rules, declarations, at-rules, or arbitrary selector lists. Adversarial comparator tests reject changed URLs, declarations, declaration order, rule order and selector membership.

Thus all declaration values and ordering, cascade rule order, theme blocks, font-face counts and URLs match the baseline. The six full bundles retain 33 font-face rules (32 text faces plus the icon font); Gutenberg retains its 32 text faces. No visual redesign or token changes are included. The existing CSS-version synchroniser corrected the stale source banner from 2.0.1 to package version 2.1.0; compressed CSS excludes that comment.

## Consumer compatibility

Published package paths remain unchanged, including `buttons.scss`, `megamenu.scss`, `textcta.scss` and `sectionheader.scss` aliases. `variables` forwards the generated Sass scale and tab tokens. Shared placeholders remain in `mixins`; components extending them load that upstream module explicitly. SyndicationSearchWidget explicitly loads `form-base` for `%mg-form-input-base`.

Import-only underscore partials preserve assignments before legacy imports of `variables`, `fonts` and each of the seven entry points. They forward into the same modules, pass through remaining `!default` hooks, and inspect the legacy caller scope for removed-variable warnings. Shared warning text lives in `legacy-warnings`. Their underscore filenames prevent additional `style*.import.css` build outputs. New integrations use `with` configuration for faces, icon/font paths, shared `$FontName` / `$font-version` metadata and `$mg-tabs-border-bottom`.

Original Drupal `@use ... as *` and legacy-import prelude tests remain intact, as do removed-font-variable warning tests. The documented per-component recipe is still extracted from the actual MDX and compiled; its parser now also recognises `@use`. Public-path tests still inspect the published paths. Actual assembled-package probes compiled all seven public bundles with both module and legacy face/path/tab overrides and compared their output.

Sass modules load once. Configure hooks before any module loads their owner; configuring an already loaded module is an error. Importing the same module repeatedly no longer duplicates CSS. Legacy callers still receive Sass's own `@import` deprecation warning, while all seven module entries compile without Sass deprecation warnings. The pre-existing search teaser-class removal warning remains intentionally visible.

## Validation

- `yarn build`: production Sass, Storybook, webpack, AI manifest and documentation copy pass.
- `yarn lint:check`: passes, with 21 existing `react/no-danger` warnings and no errors; stylelint and lint coverage pass.
- Full Jest: 170 suites pass, 3737 tests pass, one test skipped.
- Focused Sass/configuration, equivalence-comparator and documentation-path suites after the final font-hook changes: 11 suites pass, 1454 tests pass.
- `yarn validate-manifest`: passes. Existing curated-HTML unverifiability notices remain.
- Assembled npm consumer probes pass for all seven entries with both module and legacy configuration. The package includes the new modules and import-only bridges.
- Built Storybook browser spot checks: desktop Tabs switch selected panels; all five theme classes retain Latin chrome typography; Arabic RTL switches chrome to Noto Sans Arabic; mobile Details at 375px and the Sass integration documentation render correctly. Desktop and mobile screenshots were generated with `scripts/storybook-screenshot.mjs` and visually inspected. No browser errors were reported for the checked stories. Local screenshots are in `/tmp/mangrove-683-browser/`.

These are representative browser checks, not an exhaustive interactive run of every story. The seven-bundle CSS comparison supplies the broader cascade, theme and font-output coverage.

GitHub visibility limitation: this organisation suppresses normal queue listing/search endpoints. Review uses exact-number issue/PR requests and the dedicated REST pulls endpoint; no claim of complete queue visibility is made.
