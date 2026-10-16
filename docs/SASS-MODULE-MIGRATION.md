# Sass module migration evidence

Issue: [#683](https://github.com/unisdr/undrr-mangrove/issues/683).

All seven public `style*.scss` paths now load modules with `@use` / `@forward`. Internal helpers use `as *` to retain concise calls such as `mg-rem(16)` and `@include mg-focus-ring`. Components declare their own dependencies. Font URLs and shared font file-name/version configuration live in a module that emits no CSS, avoiding the `fonts → face → fonts` loop produced by a plain automatic migration. Generated token partials are unchanged and remain generator-owned.

Public `variables` remains the root-emitting wrapper: data-viz roots precede brand/tab defaults and the role/component root block, preserving baseline order. It forwards its original Sass API from internal CSS-free `config`. The 43 helper-only dependency headers now use that internal owner, so legacy partial composition does not re-emit foundation roots over caller CSS. Shared placeholders/extends and the CSS-free `font-paths` owner remain in place.

## Reproduce the CSS comparison

The refreshed baseline is unmodified v2.1.1 / `origin/main` commit `ed107d51fa5e76d99ea8381f020d96cde4f057a6`, merged into this feature branch without rewriting its existing work. All release changes are retained, including the search book-card CSS. The checked-in [machine-readable evidence](sass-module-equivalence.json) records both compressed CSS SHA-256 values for every bundle, using Dart Sass 1.105.1.

```sh
yarn test:sass-equivalence
# Optionally record the result or compare a different baseline commit:
SASS_EQUIVALENCE_REPORT=/tmp/sass-equivalence.json \
  node scripts/check-sass-equivalence.mjs ed107d51fa5e76d99ea8381f020d96cde4f057a6
```

The command archives the baseline into a temporary directory, generates its tokens from its own sources, and compiles baseline and current sources with the same installed compiler. It regenerates tokens in the current checkout as well and cleans up the temporary tree. It requires that Git commit locally and installed dependencies; it does not fetch or modify the baseline. This is a migration review guard: subsequent intentional CSS changes should be compared with an appropriate review baseline rather than treated as migration regressions forever.

| Bundle | Compressed bytes | Comparison |
| --- | ---: | --- |
| `style` | 397689 | Four selector-list permutations |
| `style-all` | 409409 | Four selector-list permutations |
| `style-delta` | 401268 | Four selector-list permutations |
| `style-gutenberg` | 103141 | **Exact byte equality** |
| `style-irp` | 400270 | Four selector-list permutations |
| `style-mcr` | 400642 | Four selector-list permutations |
| `style-preventionweb` | 400296 | Four selector-list permutations |

Six bundles have the same four differences from Sass's module-scoped `@extend`. These are permutations within existing comma-separated selector lists, with identical membership:

1. `%paragraph-font-300`: `.mg-segmented-control__legend,.mg-form-group__legend,.mg-accordion>details>summary,details.mg-details>summary` becomes `.mg-segmented-control__legend,.mg-form-group__legend,details.mg-details>summary,.mg-accordion>details>summary`. This occurs twice: the base rule and its media-query rule.
2. `%border-none`: `.mg-table.mg-table--stacked.mg-table--border tr th,.mg-table.mg-table--stacked.mg-table--border tr td,.mg-table.mg-table--striped tr` becomes `.mg-table.mg-table--striped tr,.mg-table.mg-table--stacked.mg-table--border tr th,.mg-table.mg-table--stacked.mg-table--border tr td`.
3. `%img_none`, extended by `%border-none`: `.menu li a,.mg-table.mg-table--stacked.mg-table--border tr th,.mg-table.mg-table--stacked.mg-table--border tr td,.mg-table.mg-table--striped tr` becomes `.menu li a,.mg-table.mg-table--striped tr,.mg-table.mg-table--stacked.mg-table--border tr th,.mg-table.mg-table--stacked.mg-table--border tr td`.

The comparator parses CSS with PostCSS, permits only these three named selector sets at matching rule positions, and then requires exact compressed text equality after restoring those four selector strings. PostCSS's comma parser handles nested functional selectors. It never sorts rules, declarations, at-rules, or arbitrary selector lists. Positive comparator tests exercise all four approved permutations together; adversarial tests reject changed URLs, declarations, declaration order, rule order, media conditions, extra rules and selector membership alongside those permitted permutations. The exact-four guard remains narrow.

Thus all declaration values and ordering, cascade rule order, theme blocks, font-face counts and URLs match the baseline. The six full bundles retain 33 font-face rules (32 text faces plus the icon font); Gutenberg retains its 32 text faces. No visual redesign or token changes are included. Package version 2.1.1 is inherited from main; no version bump, tag or publication is part of this migration. The existing CSS-version synchroniser updates the source banner to that package version; compressed CSS excludes the comment. Each full bundle is 56 bytes larger than the earlier pre-release evidence due to legitimate 2.1.1 CSS, while Gutenberg is unchanged.

## Consumer compatibility

Published package paths remain unchanged, including `buttons.scss`, `megamenu.scss`, `textcta.scss` and `sectionheader.scss` aliases. `variables` forwards the generated Sass scale and tab tokens. All seven full entries forward `breakpoints` and `mixins` at their original load positions. Audited public helpers include `devicebreak`, focus rings, typography, list/image helpers, transform/animation helpers, `mg-rem`, `mg-font-stack`, font-role mixins and generated scale/tab exports; incidental component mixins are not newly exported. Shared placeholders remain in `mixins`; components extending them load that upstream module explicitly. SyndicationSearchWidget explicitly loads `form-base` for `%mg-form-input-base`.

Import-only underscore partials preserve assignments before legacy imports of `variables`, `fonts` and each of the seven entry points. They forward into the same modules using Sass's standard implicit legacy global configuration on first load, and inspect the legacy caller scope for removed-variable warnings. No redundant configuration lists or bridge generator are needed. Shared warning text lives in `legacy-warnings`. Their underscore filenames prevent additional `style*.import.css` build outputs. New integrations use `with` configuration for faces, icon/font paths, shared `$FontName` / `$font-version` metadata and `$mg-tabs-border-bottom`.

Original Drupal `@use ... as *` and legacy-import prelude tests remain intact, as do removed-font-variable warning tests. The documented per-component recipe is still extracted from the actual MDX and compiled; its parser now also recognises `@use`. Public-path tests still inspect the published paths. Automated assembled-package probes compile actual working-tree SCSS copied by the release assembly script, resolve all seven public paths with both module and legacy face/path/tab/tag/font-metadata overrides, compare source and package output, exercise shared helpers and resolve four aliases. Their dist prerequisite is minimal: they test Sass packaging, not registry publication.

The supported base recipe explicitly loads public `variables`, `fonts` and `foundational` before selected components. The public wrapper supplies the base root defaults and font roles; `fonts` supplies faces and Arabic routing; components alone do not newly promise foundation CSS. The existing MDX-extracted recipe tests remain intact.

The review-time guard now compares complete Drupal recipes against the baseline, using both actual preludes (`@use "variables" as *` followed by legacy partials, and all-legacy imports), the original ten-partial list, default plus IRP/MCR/PreventionWeb/DELTA wrappers, and intervening caller root overrides. All twelve consumer outputs are exactly equal. The default Drupal recipe is restored from the reviewed regression's 221,056 compressed bytes to **99,774 bytes** (baseline equality); override recipes are 99,802 bytes. This establishes compatibility for those recipes, not arbitrary compositions. The same guard compiles concrete shared-helper calls against baseline for both APIs across all seven entries; only the existing four bundle permutations are allowed.

Configure supported hooks before their owner first loads for predictable composition. Explicit `@use ... with (...)` after load still errors. Unrelated globals assigned after a namespaced module load do not reconfigure that module merely because a legacy import follows. Assignments to imported or used module members are reassignment and may affect subsequent module evaluation, but never already-emitted CSS. A complete legacy `variables` / `breakpoints` / `mixins` prelude followed by tab-border, retained tag-variable or custom Arabic-face reassignment remains supported; three additional exact baseline comparisons and regression tests cover these cases. The retained `$mg-font-tag` alias is read in explicit consumer CSS; Tag itself continues to use runtime CSS type tokens. Mixed modern/legacy use remains tested, including configured `variables` followed by a legacy full entry and namespaced font paths followed by an unrelated global assignment. Repeated `@use` references emit CSS once per compilation; **legacy imports can still re-emit transitive CSS**. This is not a promise of deduplicated repeated legacy imports or identical error behaviour for late configuration. Legacy callers retain Sass's upstream `@import` warning; all seven modern entries compile without Sass deprecation warnings. The pre-existing search teaser-class removal warning remains intentionally visible.

The supported equivalence boundary is the documented **top-level module and legacy recipes and component subsets**. Selector-nested full-bundle imports can change parent-selector evaluation: `.scope { @import "style-gutenberg"; }` changes two Card hover selectors because module CSS evaluates before nesting. Arbitrary scoped/full-bundle import equivalence is not promised. The strict seven-bundle guard does not certify mixed repeated full-entry compositions beyond its named probes.

No known direct Mangrove Sass consumers were identified. Actual Drupal and microsite integrations use versioned CDN compiled CSS; local theme Sass is separate. Sass remains an optional public contract for prospective consumers. The twelve historical Drupal-style recipe comparisons are contract probes, not evidence of a deployed consumer setup or downstream project build. No downstream build was required or run.

## Validation

Refreshed integration validation (Dart Sass 1.105.1, Node 24.18.0):

- Seven-bundle review comparison passes: Gutenberg exact; only the four approved selector-list permutations in six bundles. Evidence is regenerated against the real integrated v2.1.1 baseline, including release CSS; no comparison solely against the old `378dcdcc` base is used for this gate.
- Twelve complete Drupal consumer outputs match baseline exactly, including both variable preludes, four sub-brands and intervening root overrides. Fourteen baseline/current full-entry helper probes pass across both APIs. Three imported-member reassignment probes also match exactly.
- Full Jest: **170 suites pass, 3779 tests pass, one skipped**. Final focused Sass module/package/helper/configuration, comparator and documentation/path checks: **5 suites, 156 tests pass**.
- `yarn build` passes: Sass, Storybook, webpack, AI manifest and documentation copy. `yarn validate-manifest` passes; existing curated-HTML unverifiability notices remain.
- The actual CI sequence from `.github/workflows/storybook.yml` passes after staging the intended changes: **`yarn lint`, `yarn prettier:check`, `git diff --exit-code`**. There are 21 existing `react/no-danger` warnings and zero errors; lint coverage also passes for all 520 source files. The ten SCSS formatting failures from the reviewed CI log are corrected.
- Automated assembled-source Sass tests pass. A prior separate check against the complete production assembly passed for all seven public paths with modern/legacy face, four font paths, icon/tab/tag and shared font-metadata hooks, shared helpers, source/package output equality and all four aliases in both loading modes. The new config and import bridges are included at unchanged assembled paths; this does not verify a future registry release.
- Prior built Storybook spot checks remain representative evidence because refreshed CSS matches v2.1.1 under the strict comparator: desktop Tabs switch selected panels, all five theme classes retain Latin Roboto Condensed chrome and route Arabic RTL chrome to Noto Sans Arabic, mobile Details opens at 375px without horizontal overflow, and the corrected Sass integration documentation renders. The repository screenshot helper produced desktop Tabs and mobile Details images, both visually inspected; local evidence is in `/tmp/mangrove-683-corrections-browser/`. No page errors were reported in the checked pages.

Browser checks are representative, not an exhaustive interaction run of every story. The baseline guard is review-time evidence for this migration and these named consumers, not a permanent restriction on future intentional CSS work or a claim about all possible consumer compositions. No dependable compilation/watch speedup is claimed.

GitHub visibility limitation: this organisation suppresses normal queue listing/search endpoints. Review uses exact-number issue/PR requests and the dedicated REST pulls endpoint; no claim of complete queue visibility is made.

Remote CI remains a separate merge gate monitored by the coordinator. The earlier Build and Deploy run was cancelled, not green; prior Chromatic passed. Exact-head refreshed CI, including Storybook play tests, must complete before landing.
