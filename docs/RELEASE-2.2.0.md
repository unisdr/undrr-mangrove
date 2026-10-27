Mangrove 2.2 improves card presentation and adds experimental content patterns for reusable teasers and cards. It also brings Sass modules, optional persistent preview access and a faster Storybook development workflow, while retaining the published component bundle toolchain.

Full details: [2.2.0 changelog](https://github.com/PreventionWeb/undrr-mangrove/blob/main/CHANGELOG.md#220-2026-10-17).

## Breaking and visible changes

- **Card media and spacing:** photographs reach the card edges while text stays inset, empty label rows no longer reserve space, and compact statistics use tighter padding. Review custom image, spacing and height overrides against the refined defaults. Publication cards preserve complete covers and use theme-owned surfaces rather than a nested frame. ([#1380](https://github.com/unisdr/undrr-mangrove/pull/1380))
- **Sass configuration:** public paths and documented top-level legacy recipes remain supported through import bridges. New integrations should use `@use` / `@forward` and configure hooks with `with` before the owning module first loads. Unrelated globals assigned after module loading do not reconfigure it, legacy imports can duplicate CSS, and selector-nested full-bundle imports are outside the equivalence guarantee. Read the [Sass migration guidance](https://github.com/PreventionWeb/undrr-mangrove/blob/main/docs/SASS-MODULE-MIGRATION.md) and test custom compositions; compiled-CSS consumers need no Sass migration. ([#1376](https://github.com/unisdr/undrr-mangrove/pull/1376), [#683](https://github.com/unisdr/undrr-mangrove/issues/683))

## New features

- **Content patterns:** experimental `ContentTeaser` and `ContentCard` renderers cover 11 editorial archetypes and 15 profiles. Teasers use horizontal card surfaces; cards offer vertical and book layouts, contained logos and complete covers, linked labels, semantic attribution and distinct date roles. Callers supply localized labels, safe destinations and source visibility decisions. These presentation inputs are provisional; canonical schemas, Drupal field adapters and production search replacement remain separate work. ([#1383](https://github.com/unisdr/undrr-mangrove/pull/1383), [#1381](https://github.com/unisdr/undrr-mangrove/issues/1381))
- **Preview access:** opt into `data-mg-preview-persist="local"` or React `persist="local"` for unlocks shared across visits and tabs, with optional `maxAge`. Session persistence remains the default. A changed PIN invalidates stored local unlocks; `mg-preview-access:unlock` bubbles on entry and restored unlocks. This client-side gate is a preview convenience, not authorization. ([#1384](https://github.com/unisdr/undrr-mangrove/pull/1384), [#1382](https://github.com/unisdr/undrr-mangrove/issues/1382))

## Bug fixes and hardening

- **Publication search cards:** catalogue rows align consistently while retaining complete cover proportions and appropriate standalone sizing. Missing artwork and mixed content reflow without forcing photographs into publication-cover treatment. ([#1380](https://github.com/unisdr/undrr-mangrove/pull/1380))
- **Preview access:** expired, malformed and future-dated local unlock records are rejected, and focus moves into usable page content after unlock while preserving authored focus attributes and inert content. ([#1384](https://github.com/unisdr/undrr-mangrove/pull/1384))

## Documentation and discoverability

- **Content families:** existing full-page references now sit beneath their editorial archetypes, with content hub grouped under landing page and explicit stubs for presentations not yet implemented. Existing story URLs are preserved. Drupal profile bindings publish separately as `DrupalContentPatterns.js`; `content-patterns.json` describes implementation status, needs and projections without presenting stubs as callable components. ([#1383](https://github.com/unisdr/undrr-mangrove/pull/1383))
- **Storybook:** Vite loads themes in cached chunks, and Vitest Browser Mode exercises stories with Chromium. Published library bundles still use Webpack and unit tests still use Jest. The migration adds theme-race/recovery checks; it does not move production consumers to Vite. ([#1385](https://github.com/unisdr/undrr-mangrove/pull/1385), [#1386](https://github.com/unisdr/undrr-mangrove/pull/1386))
- **Release and review guidance:** Chromatic snapshots follow deliberate ready-for-review/manual-run policy. CDN guidance distinguishes the deployed fork-dist snapshot from npm tags and documents the tagged shared-assets build and manual production deployment. ([#1389](https://github.com/unisdr/undrr-mangrove/pull/1389), [#1390](https://github.com/unisdr/undrr-mangrove/pull/1390))

## CDN

The versioned paths become available after npm publication and the shared-web-assets production deployment. Verify the CSS version banner and newly published module paths before upgrading consumers.

```html
<link rel="stylesheet" href="https://assets.undrr.org/mangrove/2.2.0/css/style.css">
```
