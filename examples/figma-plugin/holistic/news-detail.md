# Authored ArticleStory assembly prerequisites

The existing news-detail source correspondence is `stories/Patterns/ArticleStory/ArticleStory.jsx`, a story fixture with real article metadata and deliberately authored layout-test body copy. There is no separately invented NewsPage. This tranche audits remaining assembly prerequisites and prepares isolated source dependencies. It does not claim a complete native page.

`inspectNewsDetailPrerequisites({root})` in `scripts/figma-news-detail-recipes.cjs` verifies pinned source, compiled source CSS, actual source fonts and browser evidence, then returns twelve dependency contracts with `assemblyReady:false` and `families:[]`. `buildNewsDetailRecipes()` deliberately refuses full assembly while the named prerequisites remain unsupported. The dedicated `dev/mock-news-detail.cjs` tests source, font, geometry-fixture and provenance drift plus honest refusal. The audit portion is a prerequisite test. The source dependency portion separately exercises the actual builder with documented API fixtures, without native acceptance.

## Actual source measurements

Fifty authored English source cases cover the five actual stories, five themes and viewport390/1164 after `document.fonts.ready` and two animation frames. Two initial captures caught pending images and were retained externally, then remeasured after awaiting image decode. All archived final source images report loaded natural dimensions. Ten additional source diagnostics record actual next-paragraph text fragments, source float bounds and native-share feature presence.

Full receipts and one full-page screenshot are external at `/tmp/mangrove-news-detail-source-20261005`. [Source footprints](assets/news-detail/source-footprints.json) archives the relevant geometry and layout fields. [Provenance](assets/news-detail/provenance.json) pins the exact31-module transitive ArticleStory import graph plus source cascade, tokens, font dependencies and evidence. No Figma mutation or publication occurred. External image response bytes are not pinned for a native image family here. Live iframe pixels are not authored source assets or accepted native media.

| Source viewport | Article content width               | Rail placement                     | Share icon bar                          | Secondary callout                                                 | Related cards                               |
| --------------- | ----------------------------------- | ---------------------------------- | --------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| 390             | 330px UNDRR,350px other four themes | Before article, same content width | 40px tall with six actions              | Full content width, float none                                    | One column,350px UNDRR or370px other themes |
| 1164            | 722px all five themes               | 256px right rail,30px column gap   | 85px tall, five actions then one action | 216.59375px, source30percent inline-end float,20px logical margin | Three368px columns,20px gap                 |

All captures expose `navigator.share`, so they observe six icon actions: device share, LinkedIn, Facebook, X, email and QR code. The source conditionally omits device share when that API is absent. A future source family must explicitly model that five-action branch instead of treating the captured browser feature as universal. The copy action is a separate46px-high source button, not the normal Button recipe. QR, copy, device share, analytics, clipboard and external-window behavior remain runtime contracts.

The actual five header presets are LargeImage, CompactImage, NoHeroImage, AlternateHeroImage and SplitHero. Large/compact non-split headers retain the category Tag, title, summary, date and two real source organization links. SplitHero instead uses the actual Hero split2/3 composition and plain source detail text. Header images use the two exact ArticleStory URLs, with distinct alt, caption and credit fields. Related cards use their own third source image URL. The alternate caption and body lorem ipsum are authored layout-test fixtures, not new placeholder copy added by this audit.

## Exact remaining composition

Reuse the page-chrome closed390/1164 contracts, with independently scoped open desktop/mobile surfaces for authored menus. ArticleStory does not import Footer. The existing article prose slice preserves three headings and nine linked rich paragraphs but compacts them. Full assembly must decompose it into sections to insert the actual quote after section1, secondary rich HighlightBox after section2 and embed after section3. Its omitted-enhancement metadata must not be treated as full-page coverage.

The existing article bulleted TOC and source-context light QuoteHighlight are reusable finite contracts. The article quote uses32px/116percent at390 and40px/115percent at1164, rather than standalone quote typography. Native source fonts, alpha and wrapping remain open. Source related news uses three actual VerticalCards with its authored copy and destinations. Editors recommendations use a real unnumbered three-link list. Explore further uses three bold taxonomy group labels and six Tag-compatible links; the narrow Themes group wraps into a61px-high two-row container. Initial UserFeedback follows the shell in its actual viewport allocation.

## Demonstrated float and media limits

The desktop secondary HighlightBox is not a standalone full-width plain body box. Its source paragraph contains bold45 and11 within one editable sentence. It floats outside the section's normal height and affects the following section. In the measured UNDRR1164 no-image case the box starts atx586.40625/y1682.59375 and ends aty1800.59375. The next section starts aty1696.59375. Its first paragraph begins aty1731.890625; the first three line fragments stop beforex557.46875, while its fourth line extends tox692.9375 after the float ends. The next heading still has a722px block box and fits beside the float. At390 the box is stacked and no paragraph uses this varying available width.

The current builder has one fixed available width per editable rich TEXT node. It cannot preserve this variable-width single paragraph by splitting the sentence into several independent nodes. Full assembly needs a reviewed float-aware editable-text capability or another explicitly source-faithful solution. A padded or side-by-side full paragraph would change the measured layout. Arbitrary edited copy also requires a clear reflow contract.

The embed wrapper is the actual16:9 source utility around `https://www.youtube.com/embed/lJWNmqYmKEQ` with the authored accessibility title. It measures330x185.625px for UNDRR390,350x196.875px for the other narrow themes, and722x406.125px at1164. Current native recipes cannot host the live iframe. The source does not provide a static poster. A blank ratio frame, fabricated thumbnail or invented media card would not complete the authored surface. Native media representation requires a concrete separately reviewed contract.

## Next work and remaining acceptance

The next implementation units are source-specific header/data/image contracts, ShareButtons with exact source icon assets and capability branches, rich floating HighlightBox/text reflow, authored media representation, actual related-card data, recommendation-list markers and finite wrapping taxonomy groups. They must be composed with the existing chrome/prose/reading/feedback dependencies before any full news-detail family is counted.

This audit preserves source order and honest missing gates. It establishes no native rendering, native fonts, source image bytes, consumer edits, component publication or full composite acceptance. Canonical library, consumer and recovery checkpoint remain untouched. Recovery drift, deliberately changed text/effect-style publication, human novice handoff and reduced merge acceptance remain separate gates.

## Initial source dependencies: article header and ShareButtons

`buildNewsDetailDependencyRecipes({root,modes,variables,styles})` now emits the
`article-header` with two no-image source presets and standalone `share-buttons`
with four finite initial presets:
SourceViewport390/1164 and NativeShareAvailable/Unavailable. The real authored
ArticleStory no-image source uses six actions in Chromium. A separately recorded
pre-render `navigator.share` absent diagnostic uses the source's five-action
branch. Twenty source cases cover all five themes at both widths after fonts
ready, image decode and two animation frames. The archived dependency footprint
and provenance include exact source/font/CSS hashes and executed raw case hashes.
The capture script is archived with whitespace formatting and its executed raw
hash. Browser sessions were closed. No source React/SCSS/story edits were made.

The narrow share allocation is330px for UNDRR and350px for the other themes. Its
six or five40px actions fit in one row. The256px desktop rail wraps six actions
into85px, while five fit40px. The heading uses actual Roboto16px/24px, requested
600 mapped to source available Bold700. Actions use the exact source CSS-mask
SVG assets with18px glyphs. Lucide uniform strokes bind size and corresponding
source2px/24 scaling; filled social assets keep their exact source paths. The
copy button remains its own source treatment:46px initial height from24px icon
slots,10px padding and1px border, neutral25 fill and neutral300 at0.4 alpha,
14px/21px editable visible link. It is not the normal Mangrove Button.

The source factory stages helper/style upserts and refuses foreign identity or
foundation/source drift without changing caller arrays. Dedicated tests cover
all five brands, two zero-create rebuilds, edited consumer Heading/Visible link,
links and positioning, exact source asset whitelist and synthetic SVG
viewport/paint sizing. Missing required Roboto Bold or Roboto Condensed Regular
fonts and archived dependency evidence/capture/icon-source drift refuse. The
missing-font tests record unchanged scene, styles, variables and collections
after refusal. Existing native SVG stroke/path edits refuse before
style/scene writes. The fixture does not reconstruct every path's native bounds,
vector topology, rendering or browser font pixels; those remain native gates.

All twenty guarded single-variant ShareButtons cloud payloads exceed the unchanged50,000-byte
ceiling, measuring58,848..59,836bytes. This is an explicit transport blocker,
not native import/build acceptance. The separate article-header scopes also
exceed the ceiling; those header payloads are not included in the twenty ShareButtons
measurements. Full desktop plugin runtime testing still
requires working desktop control. No dynamic execution or validation deletion
was introduced. Device sharing, platform URLs, clipboard, QR generation/dialog,
Copied state, focus/hover and arbitrary-width edited wrapping remain functional
or rendering acceptance gates. These six variants complete two bounded source dependencies only; four image-bearing
header treatments, exact related cards, recommendation markers, taxonomy,
float/media and full news assembly remain work in progress.

The `article-header` presets preserve the actual no-image English intro at390
and1164. Narrow title typography is36px/45px and summary18px/22.5px. Desktop uses
40px/50px title and23px/28.75px summary; the source lede max width is49rem/784px.
Title tracking is0.72px narrow and0.8px desktop. Title, summary and metadata use
the captured source balanced wrapping policy. These policies do not establish
native line-break or font-ink equivalence.
The outer intro widths are350px UNDRR and370px other themes at390,1022px at1164,
with10px inline padding. A native Tag Default instance carries actual Update
copy and exposes its supported Label. Category destination remains explicit
source metadata because existing Tag excludes browser linked interaction states.

Title and Summary are plain component properties. Date and both source names
remain one editable rich TEXT with the two exact HTTPS source URLs,14px/21px
Regular typography and source link paint without underlining. It has no whole
string component property. Margin groups preserve16px after category,10px after
title and18px/23px after narrow/desktop summary. The final metadata paragraph's
14px margin is outside the measured intro component and belongs to enclosing
header flow. All-five combined actual-builder tests now retain plain consumer
properties plus source and consumer formatted metadata edits through two
zero-create repeats. Native text widths/heights, exact font file matching,
exposed nested Tag consumer edits, full header nesting/reflow and publication
remain open. These are finite allocations, not a responsive engine.
