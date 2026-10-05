# Source search result tranche

`buildSearchResultRecipes({ root, modes, variables, styles })` in
`scripts/figma-search-result-recipes.cjs` returns three internal source draft
families: `search-result-item` (42 variants), `search-result-fields` (14), and
`search-result-state` (20). They represent finite ResultItem and SearchResults
anatomy. They are not three additional public Mangrove components or a complete
SyndicationSearchWidget. The normal exporter and maintenance kit are unchanged.

The source browser baseline contains 38 actual source-rendered cases across all
five brand themes at viewports 390 and 1164. It uses the current padded search
Storybook context, so standalone result content widths are 358 and 1132. These
widths are not the width of a sidebar-enabled widget's result region. Source
fixtures, static React markup, computed CSS, loaded font inventory and measured
DOM/text ranges and per-line character allocations were captured after fonts and images were ready. Raw captures
and the capture program are retained under
`/tmp/mangrove-search-results-source-20261006`. The deterministic, interned
`assets/search-results/source-footprints.json` is an input to the recipe and
records each source contract, measured allocation, style and foundational role.
Its hash is pinned, together with JSX/SCSS/foundations/font declarations and
required font bytes. Updating a capture requires a source re-audit.

## Exact fixtures and branches

The original authored test teaser remains unchanged. It references `/image.jpg`,
which is not a verified image. Its finite variants explicitly hide the image
field through the real source API. The cohort also includes authored fallback,
missing-domain and organization cases, plus clearly labelled taxonomy and
highlight structural mutations of those authored test hits. List/card/Book
variants exercise the actual `swapCardVariant` result transformation, not a
substituted native generic Card. All seven independent hidden-field configurations
are retained. The authored teaser lacks some corresponding fields, so those
absences establish selector behavior, not populated field visual fidelity.

A separate, explicitly source-derived image fixture uses the original test teaser
anatomy with exact title, summary, alt and cover metadata from
`ScrollContainerExamples[1]`, and its authored `#scroll-example-2` destination.
The retained date is the existing ResultItem test date, not a claim about the
publication's actual date. This input is not a captured search endpoint response
and does not silently repair `/image.jpg`.

The fixture uses the exact existing UNDRR Bali cover, already inspected and
pinned at `assets/card-content/bali-publication-cover.jpg`, 720 by 960 pixels,
SHA256 `4770262ae2ee8715facebeb0ff0c70b45ce8831e9fb36f79fafbeecfeed50370`.
The portrait URL was fetched again and the current bytes match that hash. The
actual source card transform produces
`https://www.undrr.org/sites/default/files/styles/landscape_16_9/public/2022-08/Bali.JPG.jpg`.
Those bytes were downloaded and visually inspected as the corresponding Bali
Agenda landscape crop. `assets/search-results/bali-landscape.jpg` is 2048 by
1152 pixels, SHA256
`5aef058e2b3e9d08cb8605406f4fc6bc31cd9424113a31594bb01fd1d309a5ea`.
No asset-specific redistribution license is established by the source URL.

SearchResults includes initializing, initial no-query empty, query empty,
structural error, list/card/Book initial skeleton, populated exact count,
approximate count and stale populated branches. Count/query/timer/error values
are explicit source fixture inputs. Pager is disabled for this standalone
result tranche; the real widget assembly must link the actual source Pager
contract. Source stale opacity is retained on its owning frame.

## Native recipe boundaries

The recipes retain the source DOM anatomy as fixed positioned frames with stable
explicit IDs. Border edges, corner geometry, source paint, loaded image bytes,
alpha, inline highlight backgrounds/padding and metadata pseudo bullets remain
separate source elements. Wrapped direct-text segments retain actual per-line source characters and line starts, including the regular suffix following a bold error prefix. Plain editable text line segments are placed in finite
auto-layout slots because the existing builder requires TEXT HUG to have an
auto-layout parent. They do not pretend that rich TEXT alone models CSS inline
padding. Source hyperlink destinations remain in the fixture and browser
artifact; this plain builder cohort does not install navigation behavior.

All five measured coordinate allocations are identical. Existing positioned
FRAME/TEXT support needs finite literal coordinates, so those coordinates are
checked for equality across modes and emitted as literals. Source sizing, paint,
font size and opacity use variable roles. A mode-varying coordinate refuses
rather than silently using UNDRR coordinates. Foundations are checked in every
mode before helper/style changes; source token changes require a fresh measured
contract. Helper variables and text styles use collision-safe identities.

Requested Roboto 600 maps to bundled Bold 700 and requested Roboto Condensed 500
maps to bundled Regular 400 as explicit font matching inferences. Computed
requested weights and loaded face inventory do not prove native font byte or
glyph equivalence. Font declarations/imports and relevant source WOFF2 bytes are
pinned. Missing required native fonts must refuse before style or scene writes.

Skeleton animation is deliberately paused at the source's initial keyframe:
`background-position: 200% 0`, with its source 200% background image. The finite
visible first half uses neutral at positions 0 and 0.5 and the source highlight
at 1. This is a source snapshot candidate; native gradient pixels and animation
acceptance remain open.

## Evidence and remaining work

Run the dedicated actual builder harness with:

```sh
node examples/figma-plugin/dev/mock-search-results.cjs
```

The harness checks deterministic generation and idempotent helper/style upserts,
all five mode derivations, source FRAME allocations and positions, original
fixture preservation, exact image hashes, two zero-create recorded scene
repeats, and edited linked consumer text. It rejects changed foundation roles,
alias cycles, foreign variable/style identities, duplicate anatomy, missing
fonts and source/font/asset drift. The mock does not calculate native glyph
metrics, intrinsic TEXT height or image/gradient rasterization.

Full widget regions, facet/sidebar/horizontal allocation, mobile drawer,
progress animation, configuration portals, source Pager integration, rich
field-filled endpoint markup and additional responsive/script contracts still
need genuine source assembly and evidence. Isolated native construction, live
mode changes, text/image/gradient pixels, ordinary plugin behavior, selective
publication and consumer restoration remain separate gates. The connector's
50,000-byte ceiling is unchanged.

## Generated CSS refresh verification

After regenerating the current source CSS with the ten committed control aliases, a fresh browser pass remeasured all 38 source cases across five themes and both viewport widths. All 380 recorded scene arrays are exactly equal to the preserved earlier captures: geometry, computed style, DOM text and per-character line ranges, destinations, image URLs and loaded natural dimensions. The [complete semantic parity receipt](assets/search-results/css-refresh-semantic-parity.json) records each before/after scene digest and the current compiled CSS SHA256 `1806dd1446f5df7252676c69ad2a0da168aa46343c3e668cf17fc06f2dd3fd60`. A separate narrow results-browser load check records nonempty new control aliases and the loaded style-element digests after the recapture. Original source footprint bytes and capture metadata remain intact. This is actual source-browser equivalence for these finite cases, with native typography, rendering and publication still open.

The guarded Roboto Condensed Regular source bytes are shared with the separately owned ContentHub asset inventory, at `assets/content-hub/source-fonts/RobotoCondensed-Regular.woff2` (SHA256 `0cdd3d13492236edd2bc1c3d48f7d7f7270b2d52214d2a3d114d6fcb0c6f04d2`). The exact source URL is `https://assets.undrr.org/fonts/roboto-condensed/v1.0.0/Regular/RobotoCondensed-Regular.woff2?v=2.137`, derived from the repository's font declaration and fontdef mixin. Its adjacent `LICENSE.txt` is byte-identical to the bundled Roboto Condensed Apache License 2.0 file, with a guarded SHA256 `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4`. These font files must accompany clean source generation; their presence does not register ContentHub or establish native installed-font equivalence.
