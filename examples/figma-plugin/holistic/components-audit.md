# Reusable components audit

Current source renderers, CSS patterns, curated AI metadata and package exports were reconciled with the normal recipes and isolated drafts. This audit does not use story totals as missing-component totals.

The normal exporter contains **32 families / 383 variants**. Its documented published subset remains **25 families / 297 variants**. The isolated packet adds **9 source-only families / 28 variants**. Supporting Table cells/rows, ComboBox options and size splits are families within owning source units, not extra complete public widgets. Published status is documented pilot evidence; no fresh Figma publication verification was performed for this audit.

Every mapped unit remains partial. A recipe or a passing mock does not establish native/source visual parity, publication or linked consumer uptake. The JSON contains source paths, package exports, authored story names and prop enums, recipe contracts, dependency evidence, missing scope and builder limits for each row.

## Remaining reusable work

| Area               | Current coverage                                                                                                       | Next bounded work                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Foundations/layout | Tokens/text styles and bounded component bindings; standalone icon/logo/layout and semantic patterns remain incomplete | Audit source icon/logo/image identities, reusable text/figure/list patterns, container/grid contracts             |
| Forms              | Published bounded input/select/radio/checkbox/switch/segmented/error summary; Range source-only                        | FormGroup, then FormAction joins; extend Range and grouped/long-label contexts after measured presets             |
| Actions/feedback   | Button/Chips/Status/Loader/compact Empty State published; Tag/Notice/User Feedback source-only                         | Copy Button, Service Notice/Snackbar; Share Buttons/Cite This after leaf actions                                  |
| Navigation         | Details/TOC published; Tabs local unpublished; Breadcrumbs/Skip Link/Pager/Accordion source-only                       | Accept bounded drafts; map On This Page Nav, then Tree/Drawer and Mega Menu compositions                          |
| Content/data       | Table/Text CTA published; Card/Hero/Editorial CTA local unpublished; Highlight Box source-only                         | Book/Icon/Stats cards, Quote Highlight, Code Block and Legend; expand media/rich-content scopes deliberately      |
| Media/structure    | Image/video/figure/embed/scroll/gallery helpers and site shells have no integrated reusable family                     | Establish media primitives first, then Gallery/Scroll Container, Page Header/Footer, consent/access/error layouts |
| Search/pages       | Separate holistic audits own widget internals and composed pages                                                       | Reuse verified Pager/FormAction/cards; preserve bespoke search dropdown/chip/drawer source contracts              |

## Source-unit matrix

Rows count source-unit identities. Internal support parts and deprecated sources are listed separately below; they are not additional missing public-widget counts.

| Unit                           | Coverage                                   | Families                                                             | Order |
| ------------------------------ | ------------------------------------------ | -------------------------------------------------------------------- | ----- |
| CTA Button                     | partial, published-bounded                 | button                                                               | 1     |
| Chips                          | partial, published-bounded                 | chips                                                                | 1     |
| Copy Button                    | absent, no-family                          | none                                                                 | 2     |
| Share Buttons                  | absent, no-family                          | none                                                                 | 4     |
| Cite This                      | absent, no-family                          | none                                                                 | 4     |
| Text Input                     | partial, published-bounded                 | text-input                                                           | 1     |
| Textarea                       | partial, published-bounded                 | textarea                                                             | 1     |
| Select                         | partial, published-bounded                 | select                                                               | 1     |
| ComboBox                       | partial, published-bounded                 | combobox, combobox-option                                            | 1     |
| Checkbox                       | partial, published-bounded                 | checkbox                                                             | 1     |
| Radio                          | partial, published-bounded                 | radio                                                                | 1     |
| Switch CSS pattern             | partial, published-bounded                 | switch, switch-small                                                 | 1     |
| Segmented Control              | partial, published-bounded                 | segmented-control.segment, segmented-control.full-width-below-medium | 1     |
| Form Error Summary             | partial, published-bounded                 | form-error-summary                                                   | 1     |
| Form Group                     | absent, no-family                          | none                                                                 | 1     |
| Form Action                    | absent, no-family                          | none                                                                 | 2     |
| Range                          | partial, source-only-unpublished           | range                                                                | 2     |
| Status Label                   | partial, published-bounded                 | status-label                                                         | 1     |
| Empty State                    | partial, published-bounded                 | empty-state-compact                                                  | 2     |
| Loader                         | partial, published-bounded                 | loader                                                               | 1     |
| Notice                         | partial, source-only-unpublished           | notice                                                               | 2     |
| Service Notice                 | absent, no-family                          | none                                                                 | 3     |
| Snackbar                       | absent, no-family                          | none                                                                 | 3     |
| User Feedback                  | partial, source-only-unpublished           | user-feedback                                                        | 2     |
| Tag                            | partial, source-only-unpublished           | tag                                                                  | 2     |
| Table                          | partial, published-bounded                 | table, table-row, table-header-cell, table-body-cell                 | 2     |
| Tabs                           | partial, normal-unpublished                | tabs, tabs-trigger                                                   | 3     |
| Styled Details                 | partial, published-bounded                 | details                                                              | 1     |
| Accordion CSS pattern          | partial, source-only-unpublished           | accordion                                                            | 2     |
| Breadcrumbs                    | partial, source-only-unpublished           | breadcrumbs                                                          | 2     |
| Skip Link                      | partial, source-only-unpublished           | skip-link                                                            | 2     |
| Pager                          | partial, source-only-unpublished           | pager                                                                | 2     |
| Table of Contents              | partial, published-bounded                 | table-of-contents, toc-link                                          | 1     |
| On This Page Nav               | absent, no-family                          | none                                                                 | 3     |
| Mega Menu                      | absent, no-family                          | none                                                                 | 4     |
| Drawer                         | absent, no-family                          | none                                                                 | 4     |
| Tree                           | absent, no-family                          | none                                                                 | 4     |
| Vertical Card                  | partial, normal-unpublished                | card-vertical                                                        | 2     |
| Horizontal Card                | partial, normal-unpublished                | card-horizontal                                                      | 2     |
| Book Card                      | absent, no-family                          | none                                                                 | 3     |
| Horizontal Book Card           | absent, no-family                          | none                                                                 | 3     |
| Icon Card                      | absent, no-family                          | none                                                                 | 3     |
| Stats Card                     | absent, no-family                          | none                                                                 | 3     |
| Text CTA                       | partial, published-bounded                 | text-cta                                                             | 2     |
| Editorial CTA support patterns | partial, normal-unpublished                | editorial-cta                                                        | 2     |
| Hero                           | partial, normal-unpublished                | hero-background, hero-split                                          | 3     |
| Child Hero (deprecated)        | deprecated-unmapped, no-family             | none                                                                 | 5     |
| Highlight Box                  | partial, source-only-unpublished           | highlight-box                                                        | 2     |
| Quote Highlight                | absent, no-family                          | none                                                                 | 3     |
| Code Block                     | absent, no-family                          | none                                                                 | 3     |
| DataViz Legend                 | absent, no-family                          | none                                                                 | 3     |
| Gallery                        | absent, no-family                          | none                                                                 | 4     |
| Scroll Container               | absent, no-family                          | none                                                                 | 4     |
| Show More                      | absent, no-family                          | none                                                                 | 3     |
| Image primitive                | absent, no-family                          | none                                                                 | 1     |
| Author Image                   | absent, no-family                          | none                                                                 | 2     |
| Image Caption and Credit       | absent, no-family                          | none                                                                 | 2     |
| Image Credit primitive         | absent, no-family                          | none                                                                 | 2     |
| Video primitive                | absent, no-family                          | none                                                                 | 3     |
| Embed Container                | absent, no-family                          | none                                                                 | 2     |
| Full Width breakout            | absent, no-family                          | none                                                                 | 2     |
| Container                      | absent, no-family                          | none                                                                 | 1     |
| Grid                           | absent, no-family                          | none                                                                 | 1     |
| Reading column/Page Patterns   | absent, no-family                          | none                                                                 | 2     |
| Icons system                   | style-foundation-only, no-component-family | none                                                                 | 1     |
| Logo system                    | style-foundation-only, no-component-family | none                                                                 | 1     |
| Links                          | style-foundation-only, no-component-family | none                                                                 | 1     |
| Typography foundations         | style-foundation-only, no-component-family | none                                                                 | 1     |
| Page Header                    | absent, no-family                          | none                                                                 | 4     |
| Footer                         | absent, no-family                          | none                                                                 | 4     |
| Cookie Consent Banner          | absent, no-family                          | none                                                                 | 4     |
| Preview Access                 | absent, no-family                          | none                                                                 | 4     |
| Error Page                     | absent, no-family                          | none                                                                 | 4     |
| Syndication Search Widget      | absent, no-family                          | none                                                                 | 4     |
| Menu Items source primitive    | absent, no-family                          | none                                                                 | 3     |
| Section Header                 | absent, no-family                          | none                                                                 | 2     |
| Imagecaption molecule          | absent, no-family                          | none                                                                 | 2     |
| Body Column example molecules  | absent, no-family                          | none                                                                 | 5     |
| Hub Header                     | absent, no-family                          | none                                                                 | 4     |
| Abbreviation                   | style-foundation-only, no-component-family | none                                                                 | 2     |
| Blockquote                     | style-foundation-only, no-component-family | none                                                                 | 2     |
| Citation                       | style-foundation-only, no-component-family | none                                                                 | 2     |
| Inline Code                    | style-foundation-only, no-component-family | none                                                                 | 2     |
| Horizontal Rule                | style-foundation-only, no-component-family | none                                                                 | 2     |
| Mark                           | style-foundation-only, no-component-family | none                                                                 | 2     |
| Paragraph                      | style-foundation-only, no-component-family | none                                                                 | 2     |
| Inline Quotation               | style-foundation-only, no-component-family | none                                                                 | 2     |
| Small text                     | style-foundation-only, no-component-family | none                                                                 | 2     |
| Heading primitive              | style-foundation-only, no-component-family | none                                                                 | 1     |
| List primitives                | style-foundation-only, no-component-family | none                                                                 | 2     |
| Figcaption primitive           | absent, no-family                          | none                                                                 | 2     |

## Boundaries and exclusions

MegaMenu Section/TopBar are owning-widget parts. Footer molecules are historical adjacent source parts; current Footer does not import them. Translation exports, documentation galleries, contribution boilerplate, commented-out legacy files and example page/form stories do not create additional component requirements. Child Hero is explicitly deprecated and needs a retention decision rather than automatic expansion.

Some source atoms are demonstrations with narrow or hard-coded content. Their source APIs and assets must be checked before claiming production-ready reusable media or semantic patterns. Curated manifest metadata is evidence, not an authoritative replacement for current JSX/SCSS. No matching curated override does not prove generated metadata is absent.

Native interactions, browser CSS grid/breakpoints, arbitrary content, responsive overflow, media playback, focus/keyboard and runtime collection changes remain browser/code responsibilities. A Figma component may depict finite appearances after scoped verification.

The recovery drift, changed text/effect publication, composite publication, novice handoff and reduced merge acceptance gates remain open. This audit closes none of them.

Detailed evidence: [components-audit.json](components-audit.json).
