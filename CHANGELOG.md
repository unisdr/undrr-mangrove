# Changelog

Detailed change records live in two places:

- **Project releases**: [GitHub Releases](https://github.com/unisdr/undrr-mangrove/releases) — library-wide version history.
- **Component changelogs**: Each component's MDX file has a `## Changelog` section with per-component version history. Browse them in [Storybook](https://unisdr.github.io/undrr-mangrove/) or in the `stories/` directory.

For the changelog format specification, see the [component contribution guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs#changelog-format).

This file collects only cross-cutting library-wide notes that don't fit either location above (e.g. repo-wide build / tooling / policy changes).

## Unreleased

_Notable cross-cutting changes between releases land here. Per-component changes belong in the component's MDX changelog._

- Storybook inline Docs canvases now receive the selected locale’s language and direction, fixing Arabic examples that inherited an explicit English canvas boundary and preserving RTL across theme or control changes. ([#1109](https://github.com/unisdr/undrr-mangrove/issues/1109))

- CDN references now use the canonical `assets.undrr.org/` root across documentation, examples, font URLs and component defaults. The release URL updater emits canonical paths while continuing to accept legacy paths as migration inputs.

## 2.0.0-alpha.4 — 2026-09-09

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-alpha.4) for the release when published. This prerelease is prepared for the npm `next` tag; `latest` stays on 1.x.

This section is intentionally brief. Full detail and migration steps are in the [v2.0 release notes](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-release-notes-v2-0--docs) (source: [`docs/RELEASE-2.0.md`](docs/RELEASE-2.0.md)).

- Arabic typography and font roles were finalized for v2.0 (including removal of legacy font-family SCSS variables). ([#1089](https://github.com/unisdr/undrr-mangrove/issues/1089), [#1092](https://github.com/unisdr/undrr-mangrove/issues/1092), [#1098](https://github.com/unisdr/undrr-mangrove/issues/1098))
- Tabs and MegaMenu received the alpha.4 navigation refinements. ([#1097](https://github.com/unisdr/undrr-mangrove/pull/1097), [#1100](https://github.com/unisdr/undrr-mangrove/pull/1100))
- Release tooling updates included `_site` Jest exclusion and prerelease CDN URL updates. ([#1090](https://github.com/unisdr/undrr-mangrove/pull/1090))

## 2.0.0 — unreleased

This section is intentionally brief. The complete 2.0 record, migration guidance, and numbered breaking changes are in the [v2.0 release notes](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-release-notes-v2-0--docs) (source: [`docs/RELEASE-2.0.md`](docs/RELEASE-2.0.md)).

Development releases:
- [2.0.0-alpha.1](https://github.com/unisdr/undrr-mangrove/pull/1061)
- [2.0.0-alpha.2](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-alpha.2)
- [2.0.0-alpha.3](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-alpha.3)
- [2.0.0-alpha.4](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-alpha.4) (release candidate)

- Pre-beta.1 paper-cuts pass: PageHeader adds `languageDisplay="links"` and tighter icon-only accessibility semantics, MegaMenu desktop flyout/refined reduced-motion behavior lands, and Storybook/docs guidance adds screenshot workflow and token-generation reminders. ([#1134](https://github.com/unisdr/undrr-mangrove/pull/1134))

## 1.8.2 — 2026-08-27

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v1.8.2) for full details.

### Features

- **Grid layout extended to 12 columns with an auto-fit fallback.** Numbered column classes now cover `col-7`–`col-12`, and a new `.mg-grid--auto-fit` modifier lays any larger item count out in a single row. Fixes StatsCard collapsing to a stacked single column past 6 stats. ([#1081](https://github.com/unisdr/undrr-mangrove/pull/1081))

### Bug fixes

- **Card z-index no longer conflicts with the mega menu.** Cards no longer overlap the open mega-menu overlay. ([#1075](https://github.com/unisdr/undrr-mangrove/pull/1075))
- **Syndication search strips hidden teaser fields.** Hidden teaser fields are now removed programmatically from the React search output. ([#1077](https://github.com/unisdr/undrr-mangrove/pull/1077))

### Build & tooling

- Major toolchain upgrades: Babel 8, `sass-loader` 17, and `jest-axe` 11. ([#1083](https://github.com/unisdr/undrr-mangrove/pull/1083))
- Storybook to 10.5.10, React to 19.2.8, PostCSS to 8.5.26, and a roundup of patch and minor dependency updates. ([#1078](https://github.com/unisdr/undrr-mangrove/pull/1078), [#1082](https://github.com/unisdr/undrr-mangrove/pull/1082), [#1071](https://github.com/unisdr/undrr-mangrove/pull/1071))

## 1.8.1 — 2026-07-06

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v1.8.1) for full details.

### Bug fixes

- **Syndication search organization routing.** Organization results now always resolve to PreventionWeb instead of whichever domain appears first in `field_domain_access`, fixing incorrect organization links in multi-domain index data. ([#1066](https://github.com/unisdr/undrr-mangrove/pull/1066))

### Security

- **DOMPurify patched to 3.4.11.** Security dependency update merged as part of patch release maintenance. ([#1051](https://github.com/unisdr/undrr-mangrove/pull/1051))

### Build & tooling

- Dependency maintenance updates: `chromaui/action` v17, `actions/checkout` v7, `serialize-javascript` v7.0.6, `babel-plugin-polyfill-corejs3` v1, Yarn v4.17.0, `autoprefixer` v10.5.2, and `postcss` v8.5.16. ([#1042](https://github.com/unisdr/undrr-mangrove/pull/1042), [#1059](https://github.com/unisdr/undrr-mangrove/pull/1059), [#1062](https://github.com/unisdr/undrr-mangrove/pull/1062), [#1063](https://github.com/unisdr/undrr-mangrove/pull/1063), [#1065](https://github.com/unisdr/undrr-mangrove/pull/1065), [#1067](https://github.com/unisdr/undrr-mangrove/pull/1067), [#1068](https://github.com/unisdr/undrr-mangrove/pull/1068), [#1069](https://github.com/unisdr/undrr-mangrove/pull/1069))

### Documentation

- Added Drupal hydration wrapper integration guidance to `README.md` and expanded release-writing guidance in `docs/RELEASES.md` (curated, themed GitHub Release notes format). ([#1016](https://github.com/unisdr/undrr-mangrove/pull/1016))

## 1.8.0 — 2026-06-19

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v1.8.0) for full details.

### Security

- **Dependency update cooldown.** Renovate now waits until a release is at least 7 days old before it proposes the update (`minimumReleaseAge: "7 days"` with `internalChecksFilter: "strict"`), so a compromised package version that gets detected and unpublished within its first days never reaches a pull request here. Security advisories (`vulnerabilityAlerts`) are exempt, so genuine fixes are not delayed. Dependabot is retired and Renovate is now the sole dependency bot, which also ends the duplicate update PRs. A separate spike tracks evaluating pnpm for its scripts-off-by-default behaviour (#1038). (#1039)

### Removed

- **D3 chart components, `MapComponent`, and `Fetcher` removed.** The npm exports `BarChart`, `MapComponent`, and `Fetcher` are no longer published. The internal-only Storybook stories `Histogram`, `IndexChart`, and `ConnectedScatterplot` are also removed. D3 and Leaflet packages are dropped from the dependency tree. Migrate charting to [Recharts](https://recharts.org/), mapping to [MAPX](https://mapx.org/), and data loading to [react-query](https://tanstack.com/query) / [SWR](https://swr.vercel.app/) or server-side load. ([#1011](https://github.com/unisdr/undrr-mangrove/issues/1011))

## 1.7.0 — 2026-05-11

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v1.7.0) for full details.

### Runtime

- **Node.js 22 is now the declared minimum** (Node 20 reached EOL on 2026-04-30). `engines.node` set to `>=22.0.0`. CI and Docker continue to run Node 24. `.nvmrc` added so `nvm use` picks the CI-pinned version. (#1003)

### Build & tooling

- TypeScript 5 → 6, ESLint 9 → 10 majors (#977).
- React 19.2.5 → 19.2.6 (#991).
- Yarn 4.14.1 (#952).
- Batch dep updates: `jest` 30.4.x monorepo (#997), `typescript-eslint` 8.59.2 (#993), `@babel/preset-env` 7.29.5 (#961), `stylelint` ~17.11.0 (#937), `globals` 17.6.0 (#964), `sass-loader` 16.0.8 (#990), plus batched minor/patch (#960, #984).

### Security

- Patched 17 Dependabot security alerts via yarn resolutions (#978).
- Patched `brace-expansion` ReDoS via resolution (#979).

### Code quality

- New `react-doctor` component-quality linter codified as a project convention. Health score moved 57 → 68 across the sweep, with 66 of the original 398 findings cleared. (#985, #987, #988, #989, #996.)
- House conventions for component authors documented in `docs/AI-CODING-AGENTS.md`: no em-dashes or three-period ellipses in JSX text; prefer `use()` over `useContext()` on React 19+; hoist default `[]` / `{}` props to module-level constants; no inline render helpers (extract as named subcomponents); lazy `useState` init; effect cleanup discipline; per-call-site triage for `dangerouslySetInnerHTML` (inline DOMPurify vs documented caller contract). (#992)
- React Doctor health badge added to `README.md` and the Storybook _Introduction_ page. The badge is a manually-refreshed periodic snapshot — see `docs/AI-CODING-AGENTS.md#refreshing-the-score-badge`. (#992, #996.)
- **Consumer-visible API note:** `Component.defaultProps` has been removed from `FooterIcons`, `FooterConditions`, `FooterConditions2`, `FooterLists`, `Link`, and `ScrollContainer`. React 19 deprecates `defaultProps` on function components; the defaults are now declared via destructured parameters, so component behaviour is unchanged. Only consumers that read `Component.defaultProps` for introspection (rare) need to adjust. (#985, #988)
- `useContext(SearchContext)` swapped to React 19's `use(SearchContext)` in `SyndicationSearchWidget` (#988). Internal change; identical behaviour at top-level call sites.

### Documentation

- `docs/AI-CODING-AGENTS.md` extended with the _Component quality checks with react-doctor_ section (above), linked from `CONTRIBUTING.md`, `docs/DEVELOPMENT.md`, and `docs/REVIEW-CHECKLIST.md`. (#992)
- Tracking issue [#986](https://github.com/unisdr/undrr-mangrove/issues/986) documents the remaining `react-doctor` work, organised into risk buckets for future sweeps.
