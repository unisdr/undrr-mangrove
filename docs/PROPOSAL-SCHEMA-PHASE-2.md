# Schema phase 2 proposal (unreleased)

This draft renames selected legacy component props to match the component contracts proposed in `schemas/`. It has not shipped in Mangrove 2.3.0 and has no assigned release version. The original v2.0 milestone is historical; the released [2.0 guide](RELEASE-2.0.md) and [changelog](../CHANGELOG.md) remain the release record.

## Proposed input changes

| Component | Proposed change |
| --- | --- |
| VerticalCard, HorizontalCard, HorizontalBookCard | `data` to `items`, `imgback`/`imgalt` to `image.src`/`image.alt`, `label1`/`label2` to `labels`, `summaryText` to `summary` |
| BookCard | `data` to `items`, `imgback`/`imgalt` to `image.src`/`image.alt` |
| IconCard | `data` to `items`, `imgback`/`imgalt` to `image.src`/`image.alt`, `label` to `labels`, `summaryText` to `summary` |
| StatsCard and StatsCardItem | `summaryText` to `summary` inside each statistic |
| QuoteHighlight | `imageSrc`/`imageAlt` to an `image` object with `src` and `alt` |
| ShareButtons | `SharingSubject`/`SharingTextBody` to `sharingSubject`/`sharingBody` |
| TextCta | URL-valued `image` and separate `imageAlt` to an `image` object |

MegaMenu additionally accepts an explicit `ariaLabel`, falling back to its existing translated navigation label. Gallery retains its current API.

The [draft migration guide](MIGRATION-SCHEMA-V2.md) gives before/after React examples and the affected Drupal JSON shapes. Published component imports use their existing `components/Name.js` subpaths; the package root is not an entry point.

## Boundaries retained from main

This draft ports the proposed names onto current component implementations. Existing rendering, card media roles and geometry, HTML sanitization, language catalogues, keyboard/focus behaviour and reduced-motion handling remain owned by those implementations. Sanitization already shipped before this proposal; it is not a new security feature of the draft.

ContentCard and ContentTeaser have separate family/profile projections and renderers. Their editorial fields, media selection and date roles are not migrated by these legacy component renames. Component contracts, editorial archetypes, presentation projections and Drupal adapters remain distinct; this draft does not approve one universal content schema.

Schema metadata version `2.0.0` and `phase: 2` identify the proposed schema iteration, not the published library release. An empty deviations map records this branch’s intended field alignment; contract fixtures are not proof of production-consumer compatibility or complete schema adoption.

## Consumer migration

React callers must update renamed props and nested item fields. QuoteHighlight, TextCta and ShareButtons hydration adapters keep their existing DOM attribute names and construct the draft prop shape. IconCard’s `data-items` and StatsCard’s `data-stats` keep their attribute names but require updated JSON fields. Existing language, direction and explicit-label handling remain supported.

This branch’s documentation and bundles are required to evaluate the new React inputs. Pinned 2.3.0 bundles retain the released API. Read the [migration guide](MIGRATION-SCHEMA-V2.md#drupal-data-attribute-changes) before changing a real consumer.

## Proposed contributor workflow

For the components covered by this draft:

1. Review the component contract and its distinction from editorial content models.
2. Update schema sources and the selected component inputs together.
3. Build the standalone schema JSON with `yarn build:schemas`.
4. Validate representative fixtures against the schema and render those fixtures in contract tests.
5. Run the normal component, hydration, package and documentation checks as well. Schema validity alone does not establish accessibility or integration parity.

The branch keeps the current package assembler and public subpaths. The seven built schemas are versioned under `schemas/dist/` and regenerated from source and are copied into assembled packages under `schemas/`; they are not published merely by committing a schema source file.

## Review before adoption

The proposal remains a draft. Review canonical-contract alignment with existing content patterns, migration coverage in actual React and Drupal consumers, the package/API removal inventory and the release scope before adopting it. Keep these decisions separate from bringing the branch up to date with main.
