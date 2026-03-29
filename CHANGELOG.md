# Changes

This project does not maintain a centralized changelog. Changes are tracked in two places:

- **Project releases**: [GitHub Releases](https://github.com/unisdr/undrr-mangrove/releases) — library-wide version history
- **Component changelogs**: Each component's MDX file has a `## Changelog` section with per-component version history. Browse them in [Storybook](https://unisdr.github.io/undrr-mangrove/) or in the `stories/` directory.

For the changelog format specification, see the [component contribution guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs#changelog-format).

---

## [Unreleased] — 2026-03-28

### Breaking changes

- **Cards** (VerticalCard, HorizontalCard, BookCard, HorizontalBookCard, IconCard): `data` → `items`; `imgback`/`imgalt` → `image.{src,alt}`; `label1`/`label2` → `labels[]`; `label` → `labels[0]` (IconCard); `summaryText` → `summary`
- **StatsCard / StatsCardItem**: `stats[].summaryText` → `stats[].summary`
- **QuoteHighlight**: `imageSrc`/`imageAlt` → `image.{src,alt}`
- **ShareButtons**: `SharingSubject` → `sharingSubject`; `SharingTextBody` → `sharingBody`
- **TextCta**: `image` (URL string) + `imageAlt` → `image.{src,alt}`

See [docs/MIGRATION-SCHEMA-V2.md](docs/MIGRATION-SCHEMA-V2.md) for the full upgrade path including Drupal data attribute notes.

### New features

- **MegaMenu**: new optional `ariaLabel` prop (default: `'Main Navigation'`) for the navigation landmark
- **Contract tests**: `*.contract.test.jsx` files added for all schema-covered components — validate schema fixtures render correctly
- **Schema metadata**: all schemas updated to phase 2, version 2.0.0; all prop deviations resolved
