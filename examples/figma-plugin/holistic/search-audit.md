# Syndicated search source audit

Audit date: 5 October 2026. Source revision and audited file SHA256 values are in
[search-audit.json](search-audit.json). This is a source contract and implementation
backlog. It adds no recipe, rendered search baseline or native acceptance.

## Inventory and coverage

`SyndicationSearchWidget` is one public component family. `SearchWidget` is a
compatibility alias of the same function. `src/index.js` exposes the widget and
label helpers; `package.json` exports only the package root. The local search
`index.js` also re-exports internals for in-repo composition, but its deep path is
not a supported package entry. Layouts, DisplayModes, Filters, Integrations and
Toggles are documentation/story groups, not additional public components.

The current 32 normal construction families and nine source draft families have
no search widget family. The normal Button, TextInput, horizontal/vertical Card
and draft Pager offer partial foundations. Their presence does not cover local
search overrides, arbitrary result data or the compositions below. The published
checkpoint has its own limited evidence and does not establish search coverage.

| Required source unit                                       | Exact dependency and gap                                                                                                                                                                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SearchForm                                                 | `mg-form-action`, search input, actual primary Button with local rules, search icon, stable loading label and conditional 36px clear action. TextInput alone is incomplete.                                                                       |
| SelectDropdown                                             | Custom `mg-select` trigger and option surface, selected dot/check, counts, type indentation, search and empty matches. Normal native Select and ComboBox use different contracts.                                                                 |
| FacetsSidebar, FacetSelect, CustomFacetSelect, SortOptions | Real aggregation buckets/taxonomy/custom fields and retained selected values. Eligible multiple facets with two selections expose OR/AND; Sort uses the same custom dropdown.                                                                     |
| ActiveFilters                                              | Own removable `mg-search__filter-chip` buttons, grouped AND connectors and conditional Clear all. Normal Chips is a different CSS pattern.                                                                                                        |
| ResultItem                                                 | Preferred trusted server teaser, fallback fields, highlighted title/snippet, source/type badges, organization exception, taxonomy terms and missing-domain error article. Normal Cards cover only part; Book and response mapping remain missing. |
| SearchResults states                                       | Own initializing/error/initial empty/query empty/list or card skeleton/stale populated layouts. Loader, CompactEmptyState and Notice are different patterns.                                                                                      |
| SearchPager                                                | Imports the actual standalone Pager; derives pages from result count, localizes labels and renders nothing for zero/one page. Three draft snapshots do not cover general pagination.                                                              |
| MobileFilterDrawer                                         | Own logical-start drawer, backdrop, count/title, close action, scrolling body and apply footer. Similarity to NavigationDrawer does not prove source identity.                                                                                    |
| Widget composition                                         | Exact optional search/filter/result regions, sidebar/horizontal layouts, external portals and mobile drawer. Still absent.                                                                                                                        |

## State and data contracts

SearchResults branches in source order: initializing, error, initial loading with
no results, initial empty without query, empty results for a query, then populated
results. Populated stale results retain their content with opacity 0.7. The root
progress indicator is its own 3px moving gradient, and skeletons have separate
list/card anatomy. A static Figma drawing cannot establish network or animation
behavior.

Dropdown search appears when `options.length > 8`, so fixtures must test eight
and nine options. Multiple selected eligible facets expose the operator toggle;
language, domain, year and type remain OR. Include missing selected buckets,
subtype indentation/allowlists and custom facets. Sort values are relevance,
newest and oldest. Result counts distinguish exact totals from `gte` approximate
totals and include query/timer only when configured.

Fixture hits need `nid`, `title`, `url`, `type`, `vid`, `field_domain_access`,
`published_at`, `teaser`, envelope `_id`/`_score` and title/body highlight markup.
Seven independent visibility fields are image, contentType, publicationType,
date, summary, siteName and organization. Title always remains visible.

The source intentionally renders trusted endpoint teaser/highlight HTML without
escaping. Do not equate arbitrary server HTML with a finite native component
schema. Pin safe authored fixtures and define a supported HTML anatomy contract.
Relative URLs use domain mapping; taxonomy vocabulary defaults to PreventionWeb;
organization results use PreventionWeb and suppress site attribution. A non-term
result without domain data renders its source error article. Card mode rewrites
Drupal image paths to `landscape_16_9`; Book mode uses `por` for 3:4 covers. List
mode preserves source teaser classes. Real assets and crops must be measured.

Runtime defaults differ from story defaults: the runtime timer is off, while
`_storyHelpers.defaultConfig` turns it on. Explicit `facets` false/sidebar/
horizontal wins over legacy `showFacets`. Grid column configuration clamps to
2..6, but the CSS does not keep that many columns at all viewport widths.
Hydration has explicit dataset parsing, JSON complex props and tri-state hash
sync. Function labels, including locale pluralization, cannot be serialized in
`data-labels`.

## Authored higher-order contracts

Exact source config objects and wrapper geometry are recorded in the JSON.
Default, prefilled query, Minimal, HiddenFacets and HorizontalFacets are widget
presets. The complete configuration surface also includes display modes, hidden
teaser fields, custom filters/facets, allowed types, taxonomy results, custom
endpoint, NoPager and DebugMetrics. These are meaningful acceptance cases rather
than independent component counts.

ExternalSearchRegion places the real SearchForm in the authored hero wrapper:
2rem padding, gradient #003366 to #00558a at 135deg, 4px radius and 1.5rem bottom
margin. ExternalFacetsRegion uses the authored grid `240px 1fr`, 1.5rem gap and
left rail with 1rem padding, #f7f7f7 background, 4px radius and 4rem minimum height.
Both are same-page portal compositions. Missing targets fall back in place with
a warning. Successful external facets suppress in-widget sidebar/strip and the
mobile filter button/drawer. The story About this example decorator is excluded
from widget anatomy. PageTemplateExample integration belongs to the coordinated
page audit, with these exact search dependencies.

SyndicatedPublicationBooks is four newest publication-filtered Book cards with
search chrome, timer and pager hidden. SyndicatedCards is four cards for `early
warning systems`, newest sort, `requireImage: true`, four configured columns and
only image/title/date visible, with search chrome and pager hidden. Generic card
placeholders do not satisfy either preset. Fixture queries/configuration remain
recorded metadata; static Figma drawings do not perform live syndication.

## Responsive, brand and script boundaries

The sidebar is 280px and is hidden at <=800px after an earlier <=768px rule.
Horizontal facets are hidden only at <=768px. At 769..800 the horizontal strip can
remain while the mobile filter button is visible. Content becomes a column at
<=800, and mobile button/backdrop are hidden at >=801. Capture 768/769/800/801;
do not impose one invented breakpoint. Fallback result images are 120px and
hidden at <=480px, requiring 480/481 captures.

The shared Grid stylesheet uses tablet 900px and the separately declared desktop
breakpoint, 1164px. At tablet, configured four columns become two and five/six become
three; at desktop they become four/five/six. Below tablet the modern CSS grid has
no explicit 2..6 column template. Measure source container and 899/900 plus the
1163/1164 boundary before defining fixed responsive presets.

The mobile drawer is `min(320px, 85vw)`, fixed full-height at logical start, with a
44px close action, scrolling body and opaque apply footer. RTL changes physical
translation and shadow; reduced motion disables transition. Static open/closed
presets must not claim focus trapping, scroll locking, Escape or return focus.

Verify all five brand modes. Token roles coexist with hardcoded white surfaces,
fixed story gradients and domain identities; changing every paint by brand would
alter the source. Spanish, French, Russian, Japanese, Chinese and Arabic labels
need actual font inventories, wrapping and source direction rules. Arabic and
Russian function pluralization requires React contract tests or explicitly
resolved fixture strings. Computed requested font weight is not proof of the
realized native font face.

## Dependency-ordered implementation

1. **S1: Pin source and fixture contracts.** Hash source/foundations/fonts and
   create deterministic hits, teasers, assets, aggregations and all result states.
   Verify public metadata and hydration boundaries without live endpoint drift.
2. **S2: Complete capabilities and exact primitives.** Resolve editable styled
   runs, supported HTML anatomy and images/crops. Implement measured FormAction,
   dropdown, filter chips/operators, badges, Book and exact icons. Refuse missing
   fonts, wrong role types and foreign identities before mutation.
3. **S3: Build results and states.** All seven field toggles, fallback/domain
   cases, list/card/book, custom progress/skeleton/error/empty/stale, exact/gte
   counts and general source Pager states must pass source/browser comparison.
4. **S4: Compose desktop widget configurations.** Use linked reusable anatomy,
   actual sidebar/horizontal/hidden/Minimal rules and all five brand bindings.
   Require two zero-create repeats and supported edited-content retention.
5. **S5: Measure mobile and script presets.** Verify exact breakpoint transitions,
   drawer overflow/footer, LTR/RTL, fonts and expanded translations. Keep browser
   keyboard/network/hash behavior separate from native visual acceptance.
6. **S6: Compose authored higher-order presets.** External hero/left rail and
   syndicated books/cards retain their exact wrappers, config, assets and shared
   instances. Coordinate PageTemplateExample with the page dependency graph.
7. **S7: Stage integration acceptance.** Isolated unpublished native builds need
   machine file guarding, source/code mappings, instance/override checks and
   recorded geometry/visual evidence. Library promotion, selective publication,
   consumer update/restoration and reviewer acceptance remain separate gates.

Existing frames, text, SVG, fills/effects and finite auto-layout can support parts
of these contracts. Styled inline text, HTML mapping, actual image assets/crops,
responsive wrapping and modal/portal compositions need explicit capability and
acceptance work. Implement those capabilities or retain the affected contract as
open. An easier Loader, Notice, Select, Chips or generic card substitute closes
none of the source-specific gaps.
