# Authored ArticleStory assembly prerequisites

The existing news-detail source correspondence is `stories/Patterns/ArticleStory/ArticleStory.jsx`, a story fixture with real article metadata and deliberately authored layout-test body copy. There is no separately invented NewsPage. This tranche audits remaining assembly prerequisites. It adds no importer-ready family and does not claim a complete native page.

`inspectNewsDetailPrerequisites({root})` in `scripts/figma-news-detail-recipes.cjs` verifies pinned source, compiled source CSS, actual source fonts and browser evidence, then returns twelve dependency contracts with `assemblyReady:false` and `families:[]`. `buildNewsDetailRecipes()` deliberately refuses full assembly while the named prerequisites remain unsupported. The dedicated `dev/mock-news-detail.cjs` tests source, font, geometry-fixture and provenance drift plus honest refusal. It is a prerequisite test, not a builder or two-repeat native test.

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
