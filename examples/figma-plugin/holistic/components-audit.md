# Reusable components audit

Current source renderers, CSS patterns, curated AI metadata and package exports were reconciled with the normal recipes and isolated drafts. This audit does not use story totals as missing-component totals.

The normal exporter contains **32 families / 383 variants**. Its documented published subset remains **25 families / 297 variants**. The isolated packet now adds **109 committed source-only families / 1460 bounded variants**. Supporting Table cells/rows, ComboBox options and size splits are families within owning source units, not extra complete public widgets. Published status is documented pilot evidence; no fresh Figma publication verification was performed for this audit.

SectionHeader, Imagecaption and EmbedContainer add three families/nine variants; BookCard, HorizontalBookCard and IconCard add three families/19 variants. They are wired into the non-importable draft packet with exact existing Editorial CTA as a cloned dependency (23 variants, counted separately). The normal exporter is unchanged. Bounded source Chromium observations and all-brand actual-builder mock checks exist; native and publication acceptance remain open. The original source audit revision remains recorded in JSON, with the explicit packet follow-up distinguished from a fresh native audit.

The next packet follow-up adds four search-control families/15 variants and five
page dependency families/26 variants: authored prose, closed chrome, bulleted
contents lists and quote patterns. These contracts have source browser evidence
and five-brand builder mocks. They do not close complete-page, full-widget,
native library or publication gates. The original 98-row source classification
remains a historical audit, with current packet additions recorded separately.

The current follow-up also adds three report composition families/six variants
and three open navigation families/24 variants. The report has complete finite
source anatomy at390/1164 with genuine reusable instances and closed chrome.
Other pages, live interaction, native composition/recovery and publication remain
open. Open panels now cover About, OurWork, Sendai and News. Source-wrapped Sendai
actions use a separate capped-action dependency family. Unwrapped actions use an exact source Button clone as
`page-chrome-button` (16 variants), separate from the23-variant Editorial CTA
dependency; neither clone is counted as a new draft family.

Every mapped unit remains partial. A recipe or a passing mock does not establish native/source visual parity, publication or linked consumer uptake. The JSON contains source paths, package exports, authored story names and prop enums, recipe contracts, dependency evidence, missing scope and builder limits for each row.

## Historical remaining-work classification

| Area               | Current coverage                                                                                                       | Next bounded work                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Foundations/layout | Tokens/text styles and bounded component bindings; standalone icon/logo/layout and semantic patterns remain incomplete | Audit source icon/logo/image identities, reusable text/figure/list patterns, container/grid contracts             |
| Forms              | Published bounded input/select/radio/checkbox/switch/segmented/error summary; Range source-only                        | FormGroup, then FormAction joins; extend Range and grouped/long-label contexts after measured presets             |
| Actions/feedback   | Button/Chips/Status/Loader/compact Empty State published; Tag/Notice/User Feedback source-only                         | Copy Button, Service Notice/Snackbar; Share Buttons/Cite This after leaf actions                                  |
| Navigation         | Details/TOC published; Tabs local unpublished; Breadcrumbs/Skip Link/Pager/Accordion source-only                       | Accept bounded drafts; map On This Page Nav, then Tree/Drawer and Mega Menu compositions                          |
| Content/data       | Table/Text CTA published; Card/Hero/Editorial CTA local unpublished; Highlight Box source-only                         | Book/Icon/Stats cards, Quote Highlight, Code Block and Legend; expand media/rich-content scopes deliberately      |
| Media/structure    | Image/video/figure/embed/scroll/gallery helpers and site shells have no integrated reusable family                     | Establish media primitives first, then Gallery/Scroll Container, Page Header/Footer, consent/access/error layouts |
| Search/pages       | Separate holistic audits own widget internals and composed pages                                                       | Reuse verified Pager/FormAction/cards; preserve bespoke search dropdown/chip/drawer source contracts              |

## Historical source-unit matrix

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

The current packet follow-up includes actual no-image news headers, sharing and related cards,76 search result/field/state presets, four news taxonomy/recommendation presets and thirteen ContentHub families/151 presets. ContentHub includes34 genuinely nested scenes across all17 finite recorded contexts; additional Hub callers and full article/widget assembly stay in scope. Source-shadow, linked underline and measured finite caret evidence are separate from native title-link, edited caret reflow, typography and UA-marker acceptance. The historical98-row classification is preserved rather than relabeled as a fresh full-source audit. See [ContentHub](content-hub.md), [news](news-detail.md) and [search results](search-results.md).

The historical committed source46/334 checkpoint and its immutable delivery remain preserved. The original98-row reusable-unit classification is unchanged; these current packet counts do not constitute a fresh whole-catalogue or native acceptance audit.

A clean `5693c581` source packet scan after the targeted text-context corrections finds zero differing family-local defaults among1170 directly referenced TEXT records in51/370 plus the separate exact CTA/Button dependencies. Independent review confirms the source/counts/empty working inputs and scan. The preserved source46 checkpoint had50 potential defaults across14 families. This scan does not expand nested instances or inspect native effective defaults, old property overrides or published consumers; those remain separate acceptance work.

The current source packet also registers eight image-bearing article-header presets, with genuine reusable no-image header dependencies where the source uses them. All five brand-mode source/mock checks and an independent expert review pass for this finite cohort. Header images, fonts, native cropping/pixels and full article composition remain open. See [the header contract](news-detail.md).

Copy/Cite adds four source families/60 finite presets with350 actual source captures. Source copies, supported edits, all-five rebuilds and expert review pass. The current source owns idle/copied/failed feedback, a genuine citation trigger,18 dialog states and four authored fallback details states. Historical copying/download assumptions are corrected in a separate source reconciliation. Native Menlo availability, glyph pixels, reflow, dialog/clipboard behaviour and publication remain open. See [Copy/Cite](copy-cite.md).

The contextual article HighlightBox adds one family/two source presets, preserving its titleless rich paragraph, source inset shadow and finite float allocation. All-five source/mock rebuilds, rich consumer edits and an independent review pass. The following desktop paragraph's varying line widths and native inset-shadow pixels remain composition gates. See [the float contract](news-float.md).

The reviewed syndicated widget adds seven source families/383 presets, preserving actual contextual dependencies and finite authored result/filter/drawer/pager surfaces. FormGroup, joined FormAction and Newsletter add three families/28 presets, with exact normal Checkbox/Radio dependencies kept separate. Initial article media adds one family/10 immutable brand/viewport player captures. All-five dedicated source-builder repeats and independent reviews pass. Native pixels, arbitrary content reflow, live search/submission/playback, library integration and publication remain open. See [the widget contract](search-widget.md), [forms](form-compositions.md) and [article media](news-article.md).

The source article exclusion adds one family/two presets: a normal editable narrow rich paragraph and the exact four desktop rich source lines around the highlight. The current-page frozen-copy guard refuses edited desktop copy before permanent writes. All-five actual builder tests and an independent review pass; native font/line pixels and changed-content reflow remain open. See [the exclusion contract](news-exclusion.md).

The complete finite NoHeroImage article adds one family/10 captured brand/viewport scenes with genuine nested prose, quotes, float/exclusion, player appearance, chrome, sharing, related cards, taxonomy, recommendations and initial feedback. Legend adds one family/10 authored continuous, categorical, stepped, vertical and grid presets. Dedicated all-five builder repeats and independent source reviews pass; source capture allocations, numeric/native font shapes, pixel equivalence, runtime states, library integration and publication remain open. See [article scenes](news-article-scene.md) and [Legend](legend.md).

The current packet follow-up reaches75 families/941 bounded variants with
one further image-bearing article-scene family/40 presets and three notification
families/18 presets. The seven-variant exact normal status-label clone is a
separate dependency. Actual image scenes use individual full-viewport source
header slots; source ServiceNotice/Snackbar/confirmation retain authored status,
actions, countdown and rich links. Dedicated all-five source-builder reviews
pass; native pixels/reflow/focus/blur, timers/playback, publication and consumer
integration remain open. See [image article scenes](news-image-article-scene.md)
and [notification states](notification-states.md).

StatsCard adds two source families/58 presets, with44 genuine item contexts and
14 nested scenes across seven authored configurations at390/1164. Tree adds
one family/14 finite source appearances, with real nested rows, links, selected
and toggle states. Their all-five dedicated builder, edit and exact-repeat
checks and independent reviews pass. Stats uppercase labels and translucent
linked summaries use reviewed shared capabilities. Numeric glyphs and native
raster remain open; Tree guide dash cadence is an explicit projection candidate.
See [StatsCard](stats-card.md) and [Tree](tree.md).

Gallery adds44 genuine image contexts, eight HTML appearances and four real mixed-media image states in three families. Real image responses are pinned; contained image extents and actual scaled HTML thumbnails retain source allocations. CodeBlock adds16 source presets with whole logical rich syntax TEXT, genuine language/filename/gutter/overflow branches and source font candidates. Their all-five dedicated actual-builder edit/two-repeat checks and independent source reviews pass. Gallery video/embed remain references, with remote loading failures recorded; native media/runtime, arbitrary HTML reflow, Menlo availability, font/glyph/raster and publication gates remain open. See [Gallery](gallery.md), [Gallery HTML](gallery-html.md) and [CodeBlock](code-block.md).

ShowMore and Scroll add five source families with63 presets, including real photo card identities and actual settled carousel positions. ErrorPage adds four families with26 presets and genuine search/challenge/request-details anatomy. Preview Access adds two families with10 actual static/live overlay states. Independent all-five actual-builder tests cover source fields, edited text and two zero-create repeats. Native mask fading, dashed outline raster, Menlo/source font equivalence, runtime behaviour, native integration and publication remain open. See [Scroll and ShowMore](scroll-show-more.md), [ErrorPage](error-page.md) and [Preview Access](preview-access.md).

## Current registry crosswalk

[current-source-coverage.json](current-source-coverage.json) reconciles the original98 source identities with the current109-family registry. All391 recorded source fingerprints still match; no source drift was found. The historical tables above retain their original classification and are not the current implementation queue. Named source associations cover bounded contexts only, including page chrome and contextual media; they do not establish standalone public coverage or native acceptance. Topic/Index, Drawer, Cookie consent and Footer now have registered bounded source cohorts; their additional callers and native gates remain open. Standalone PageHeader44, OnThisPageNav46 and composed ImageFigure72 are now registered bounded source cohorts. Layout3/28 and semantic typography6/96 remain reviewed unregistered candidates, with36 further semantic specimens unsupported. Remaining media and foundational patterns are still part of the queue. All native, publication, recovery and human handoff gates stay explicit.

## Saved source118 registration

The saved source118 registry adds independently reviewed Layout foundations3/28 and semantic typography6/96 to the saved source109 checkpoint, giving118 families/1584 bounded variants. Its immutable combined packet and CLI checks passed with terminal exit0. Deterministic118/1584 source DTO and dependencies, actual source-only importer refusal, the original9/28 combined scene lifecycle and CLI output/check/overwrite/source guards passed. The registry checkpoint was committed as `7ae4a12f781640d5cef592a167f29b732313d465`; the immutable source109 delivery remains a separate preserved artifact. Dedicated all-five source, supported-edit and two-repeat evidence remains separate from the combined original9/28 scene fixture. The actual caller-dependent Container/Grid and FullWidth specimens retain their finite source limits. The semantic cohort covers Heading, Paragraph, copy separators, DescriptionList, Figcaption and inline emphasis;36 further Cite/Quotation/OL/UL/mixed Code/Abbr specimens remain unsupported. The packet remains non-importable, with native capacity, typography/rendering, publication, recovery and human acceptance gates open.
