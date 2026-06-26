# Changelog

Detailed change records live in two places:

- **Project releases**: [GitHub Releases](https://github.com/unisdr/undrr-mangrove/releases) — library-wide version history.
- **Component changelogs**: Each component's MDX file has a `## Changelog` section with per-component version history. Browse them in [Storybook](https://unisdr.github.io/undrr-mangrove/) or in the `stories/` directory.

For the changelog format specification, see the [component contribution guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs#changelog-format).

This file collects only cross-cutting library-wide notes that don't fit either location above (e.g. repo-wide build / tooling / policy changes).

## Unreleased

_Notable cross-cutting changes between releases land here. Per-component changes belong in the component's MDX changelog._

## 2.0.0 — unreleased

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0) and [Storybook release notes](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-release-notes-v2-0--docs) for full details.

### Breaking: CSS custom properties replace SCSS variable theming API

Color and spacing tokens are now CSS custom properties on `:root`. The SCSS backward-compat aliases (`$mg-color-*`, `$mg-spacing-*`) are removed. All component stylesheets use `var(--mg-color-*)` and `var(--mg-spacing-*)` internally.

**Palette format:** colors use space-separated RGB channels (`--mg-color-blue-900: 0 79 145`) so alpha compositing is available without twin variables: `rgb(var(--mg-color-blue-900) / 0.5)`.

**Consumer migration:**

- Replace `$mg-color-*` and `$mg-spacing-*` SCSS variable references with the equivalent CSS custom property: `$mg-color-interactive` becomes `var(--mg-color-interactive)`, etc.
- Anywhere you used `rgba($mg-color-X, 0.N)`, use `rgb(var(--mg-color-X) / 0.N)` instead.
- SCSS variables that remain (BUILD-TIME ONLY — `@media` queries, font sizes, font families, `$mg-html-font-size`, `$mg-tabs-border-bottom`): no change required.

### Breaking: sub-brand theming moves from SCSS `!default` to CSS custom property selector blocks

The `_variables-irp.scss`, `_variables-preventionweb.scss`, `_variables-delta.scss`, and `_variables-mcr.scss` files are deleted. Each is replaced by a `_theme-{name}.scss` file containing a `.mg-theme-{name} { }` selector block that overrides CSS custom properties at runtime.

**Consumer migration:**

- Replace `@import "./variables-{name}"` with `@import "./theme-{name}"` in custom entry-point SCSS files.
- Apply the `.mg-theme-{name}` class to `<body>` or a wrapping element at runtime instead of relying on SCSS compile-time overrides.
- SCSS `$mg-color-* !default` overrides in downstream stylesheets no longer take effect for color/spacing tokens; move those overrides to CSS custom properties inside `.mg-theme-{name} { }`.

### Breaking: `hero.scss` variant colour map

The `$variant-colour-props` map in `hero.scss` now stores CSS custom property name strings (`"--mg-color-orange-800"`) rather than resolved SCSS color values. Consumers that previously overrode `$mg-color-hero--secondary !default` must switch to overriding the relevant `--mg-color-*` custom property on `:root`.

### Removed: `storybook-design-token` plugin

The `storybook-design-token` npm package is removed. The Design decisions/Colors, Spacing, Widths, Breakpoints, and Typography Storybook pages now render token values directly from `getComputedStyle` (for CSS custom properties) or as static tables (for build-time SCSS tokens). (#1061)

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
- React Doctor health badge added to `README.md` and the Storybook *Introduction* page. The badge is a manually-refreshed periodic snapshot — see `docs/AI-CODING-AGENTS.md#refreshing-the-score-badge`. (#992, #996.)
- **Consumer-visible API note:** `Component.defaultProps` has been removed from `FooterIcons`, `FooterConditions`, `FooterConditions2`, `FooterLists`, `Link`, and `ScrollContainer`. React 19 deprecates `defaultProps` on function components; the defaults are now declared via destructured parameters, so component behaviour is unchanged. Only consumers that read `Component.defaultProps` for introspection (rare) need to adjust. (#985, #988)
- `useContext(SearchContext)` swapped to React 19's `use(SearchContext)` in `SyndicationSearchWidget` (#988). Internal change; identical behaviour at top-level call sites.

### Documentation

- `docs/AI-CODING-AGENTS.md` extended with the *Component quality checks with react-doctor* section (above), linked from `CONTRIBUTING.md`, `docs/DEVELOPMENT.md`, and `docs/REVIEW-CHECKLIST.md`. (#992)
- Tracking issue [#986](https://github.com/unisdr/undrr-mangrove/issues/986) documents the remaining `react-doctor` work, organised into risk buckets for future sweeps.
