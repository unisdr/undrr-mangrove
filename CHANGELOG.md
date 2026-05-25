# Changelog

Detailed change records live in two places:

- **Project releases**: [GitHub Releases](https://github.com/unisdr/undrr-mangrove/releases) — library-wide version history.
- **Component changelogs**: Each component's MDX file has a `## Changelog` section with per-component version history. Browse them in [Storybook](https://unisdr.github.io/undrr-mangrove/) or in the `stories/` directory.

For the changelog format specification, see the [component contribution guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs#changelog-format).

This file collects only cross-cutting library-wide notes that don't fit either location above (e.g. repo-wide build / tooling / policy changes).

## Unreleased

_Notable cross-cutting changes between releases land here. Per-component changes belong in the component's MDX changelog._

- **Brand documentation expansion** ([#983](https://github.com/unisdr/undrr-mangrove/pull/983)) — added eight new Storybook MDX pages under `Brand/`: Where to start (canonical reading order), Layered identity (core UNDRR → sub-brand → campaign), Visual voice, Written voice and tone, Audience mapping, Sub-brand rationale (working hypothesis pending UNDRR Communications review), Anti-patterns, and AI imagery prompts. Reconciled the Arabic typography note in `BrandGuidelines.mdx` with the live Mangrove guidance (Noto Kufi Arabic + Dubai). The AI imagery page is explicit that it is derivative of UNDRR's in-development institutional AI guidance, not a one-to-one match. Also updated the `llms.txt` template in `scripts/ai-manifest/generate-ai-manifest.js` to surface the new pages to external AI agents.
- **AI imagery hard-bans** ([#983](https://github.com/unisdr/undrr-mangrove/pull/983)) — explicit standing rules: no photorealistic AI of human beings (stylised illustration only); no AI imagery for named people or specific real events; no AI-generated images of children; no rendered text or standalone icons in AI outputs (text comes out as gibberish; icons drift from OCHA + Mangrove); named country required (no regional pastiche); within-country diversity must be named explicitly when single-country contexts would otherwise collapse into a single ethnic phenotype; disability inclusion required in every people-inclusive prompt; decolonial framing required; specific hex codes required when prompts mention colour.

### Security

- **Dependency update cooldown.** Renovate now waits until a release is at least 7 days old before it proposes the update (`minimumReleaseAge: "7 days"` with `internalChecksFilter: "strict"`), so a compromised package version that gets detected and unpublished within its first days never reaches a pull request here. Security advisories (`vulnerabilityAlerts`) are exempt, so genuine fixes are not delayed. Dependabot is retired and Renovate is now the sole dependency bot, which also ends the duplicate update PRs. A separate spike tracks evaluating pnpm for its scripts-off-by-default behaviour (#1038). (#1039)

### Deprecations

- **D3 chart components, `MapComponent`, and `Fetcher` are deprecated and will be removed in v1.8.** UNDRR is consolidating on external standards for these capabilities — [Recharts](https://recharts.org/) for charting, UNEP/GRID [MAPX](https://mapx.org/) for mapping, and ecosystem data-fetching libraries ([react-query](https://tanstack.com/query) / [SWR](https://swr.vercel.app/) / server-side load) for data loading. The in-tree wrappers never reached wide-scale implementation. Consumer-facing npm exports affected: `BarChart`, `MapComponent`, `Fetcher`. Internal-only (Storybook stories) affected: `Histogram`, `IndexChart`, `ConnectedScatterplot`. See the [v1.8 removal tracker](https://github.com/unisdr/undrr-mangrove/issues/1011) for the migration plan and removal checklist. Consumers using these three exports should plan to migrate before v1.8 ships.

## 1.7.0 — 2026-05-11

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
