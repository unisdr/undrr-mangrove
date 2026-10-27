# Mangrove content architecture: schemas

Mangrove's **content architecture** defines the structural contracts between data
and components — what each component _carries_, independent of how it looks.
JSON Schema is the mechanism for formalizing and locking those contracts in.

These files are proposed component contracts on this unmerged branch. Selected
legacy components exercise the Phase 2 field names; this is not a claim that
the published library or all editorial content models implement these schemas.

## Documentation

The full rationale and schema inventory are documented in Storybook:
**[Design decisions / Content architecture](?path=/docs/design-decisions-content-architecture--docs)**

## Status

**Draft Phase 2:** contract tests (`*.contract.test.jsx`) validate selected
schema-valid fixtures and their component rendering in this branch. An empty
`x-mangrove.deviations` map records the proposal’s intended field alignment; it
does not establish production-consumer parity or replace the separate
ContentCard/ContentTeaser presentation contracts.

See [issue #881](https://github.com/unisdr/undrr-mangrove/issues/881) for the
full vision, [issue #883](https://github.com/unisdr/undrr-mangrove/issues/883)
for Phase 1, and [issue #884](https://github.com/unisdr/undrr-mangrove/issues/884)
for Phase 2. For upgrading existing integrations, see
[MIGRATION-SCHEMA-V2.md](../docs/MIGRATION-SCHEMA-V2.md).

## Quick start

The seven built JSON files are versioned under `schemas/dist/` in this draft
and must be regenerated with their sources. The branch’s package assembler
copies them under `schemas/`. These proposal files have not
shipped in the 2.3.0 npm package; build and inspect this branch locally.

To build locally after editing schema sources:

```bash
yarn build:schemas
```

To rebuild with validation:

```bash
yarn build:schemas --validate
```

## Schema inventory

| Schema       | Description                                          | Implementing components                                              |
| ------------ | ---------------------------------------------------- | -------------------------------------------------------------------- |
| card         | Content card with image, labels, title, summary, CTA | VerticalCard, HorizontalCard, BookCard, HorizontalBookCard, IconCard |
| statistic    | Key metrics display with icon, value, labels         | StatsCard, StatsCardItem                                             |
| quote        | Highlighted quote with attribution and image         | QuoteHighlight                                                       |
| navigation   | Multi-level navigation with section banners          | MegaMenu                                                             |
| share-action | Social sharing buttons with localized labels         | ShareButtons                                                         |
| gallery      | Media gallery (images, videos, embeds)               | Gallery                                                              |
| text-cta     | Call-to-action banner with heading, text, buttons    | TextCta                                                              |

## Schema format

Each schema is a [JSON Schema 2020-12](https://json-schema.org/draft/2020-12/schema)
document with these conventions:

- **`$id`**: Stable identifier in the form
  `https://github.com/unisdr/undrr-mangrove/schemas/{name}`
- **`x-mangrove`**: Extension namespace containing:
  - `version` — Schema version
  - `phase` — Implementation phase (currently 2)
  - `implementors` — Mangrove component names that implement this schema
  - `deviations` — Map of canonical field paths to notes about how component
    implementations differ. Empty for the intended Phase 2 alignment. Record any discovered mismatch
    rather than treating an empty map as an audit result.
  - `notes` — Additional context about the schema

### Custom format annotations

- **`"format": "html"`** — The string field accepts sanitized HTML. Consumers
  must sanitize before rendering (Mangrove uses DOMPurify).
- **`"format": "uri"`** — Standard URI format.

### Content and presentation fields

Schemas include both content fields (title, summary, image) and presentation
attributes (variant, iconColor, backgroundColor). If a consumer needs to
provide the value to use the component correctly, it is part of the schema.

## Adding a new schema

1. Create `schemas/{name}.schema.js` exporting a default JSON Schema document
2. Use helpers from `schemas/helpers.js` for DRY field definitions
3. Wrap with `schemaDocument()` to get the standard envelope
4. Document `implementors` in the `meta` object; omit `deviations` or leave it empty — implement the schema field names directly in the component
5. Run `yarn build:schemas --validate` to generate and validate
6. Add tests in `schemas/__tests__/schemas.test.js` (structural + accept/reject cases)
7. Update the schema inventory table in this README **and** in `stories/Documentation/ContentSchemas.mdx`. If the new schema documents deviations, add them only to the table in `ContentSchemas.mdx` (canonical).

## Architecture

```
schemas/
  helpers.js              Field definition factory functions
  *.schema.js             Schema source files (JS modules)
  build.js                Build script (JS -> JSON)
  dist/                   Versioned JSON files (regenerated by build)
    *.schema.json
  __tests__/
    schemas.test.js       Validation tests
```

Source schemas are JS modules (not raw JSON) so they can use helpers, imports,
variables, and comments. The build script imports each and serializes to JSON.

### Build and publication boundary

`yarn build:schemas` compiles source documents into standalone JSON under
`schemas/dist/`. The current assembler copies those documents into the staged
npm package under `schemas/`; source files remain separate from public bundles.
The AI generator can use built schemas when present, but discovery metadata is
not a validator and does not prove consumer compatibility.

Schema metadata version `2.0.0` is the proposal’s contract iteration, not the
released library version. See the [draft migration guide](../docs/MIGRATION-SCHEMA-V2.md).
