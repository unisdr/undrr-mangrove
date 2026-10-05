# Authored page content patterns

This isolated source tranche provides two reusable content families and four finite variants. It is not wired into the normal exporter, maintenance packet, core kit or Figma files. Full landing pages and news detail pages remain incomplete.

| Family                          | Authored content                                                                                                | Finite presets               |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `landing-report-article-column` | All four English report sections, h2 headings and paragraphs, with the real final Global Assessment Report link | Source viewport 390 and 1164 |
| `news-detail-article-column`    | All three English news-detail prose sections and nine paragraphs, preserving their real inline HTTPS links      | Source viewport 390 and 1164 |

The module is [figma-page-pattern-recipes.cjs](../../../scripts/figma-page-pattern-recipes.cjs). Its public function is `buildPagePatternRecipes({root,modes,variables,styles})`. The dedicated harness is [mock-page-patterns.cjs](../dev/mock-page-patterns.cjs). Neither family inserts a blank rail, fake quote, substituted highlight, fake video or replacement chrome.

## Source and composition boundary

The report composition is the `mg-reading__article` subtree in the actual `LandingPage` report branch. Its four sections are What the report covers, Key findings, How to use the evidence, and Download and cite. The final authored link points to `https://www.undrr.org/gar`.

The news detail correspondence is actual `ArticleStory`. The source prose is preserved in source order, including the real Words into Action, thematic-report and taxonomy HTTPS links. The source article also inserts a line QuoteHighlight after section one, a secondary floated rich HighlightBox after section two, and a live YouTube iframe inside EmbedContainer after section three. Those enhancements are excluded from this first content slice. The recipe closes the gaps between its prose sections without reserving blank areas. Its resulting height cannot be compared with the complete source article height.

The full exact import graph is recorded in [authored-content.json](assets/page-patterns/authored-content.json) and [provenance.json](assets/page-patterns/provenance.json), with 61 recursively resolved source modules, direct import symbols, external packages and individual SHA256 hashes. The dependency graph separates actual imports from candidate Figma family references. No Footer is imported by either authored page.

| Full authored source composition                               | Available recipe references                                         | Remaining source contract                                                                                                                                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared UndrrChrome, PageHeader and MegaMenu; inserted SkipLink | `skip-link` source draft                                            | Exact chrome is a separate dependency tranche. The source hidden default SkipLink is not a visible page bar.                                                                                   |
| Landing topic                                                  | `hero-split`, `icon-card`, `card-vertical`, `text-cta`              | Actual split media, route/fact content, grids, band and CTA must use page-specific contracts and source assets. This tranche does not represent topic.                                         |
| Landing index                                                  | `book-card`                                                         | Actual nine publication titles and exact source cover image at grid-derived widths remain open. This tranche does not represent index.                                                         |
| Landing report                                                 | `toc-link`, `table-of-contents`                                     | Source feature band, inline breadcrumb and bulleted four-link TOC remain open. Existing numbered six-link TOC is not the correct source contract.                                              |
| ArticleStory header                                            | `hero-split`, `hero-background`, `image-caption`                    | Actual large/compact/none/alternate/split image branches, linked metadata and linked category treatment need exact content/assets and dimensions.                                              |
| Article reading rail and enhancements                          | `toc-link`, `table-of-contents`, `highlight-box`, `embed-container` | ShareButtons, unnumbered three-link TOC, QuoteHighlight, floated rich highlight, and actual iframe appearance remain open. A blank embed wrapper would not cover source media.                 |
| Article lower content                                          | `card-vertical`, `user-feedback`                                    | Exact related image cards, recommendations, linked taxonomy groups, initial source feedback plus rich confirmation remain open. Plain draft Tag and feedback do not establish these contracts. |

No existing family exactly matches these arbitrary rich paragraphs or the h2/prose margin-collapse composition. The content patterns therefore use the supported text/frame primitives with their own source role aliases and typography. `nativeInstancesUsed` is empty and is explicit in the metadata. Family references describe dependency availability, not imported-instance use or whole-page coverage.

## Source browser evidence

Actual mounted English report and no-image ArticleStory stories were observed in Chromium across all five themes at 390, 767, 768, 899, 900, 901, 1164 and 1440px: 80 source cases. Captures wait for the expected theme class, `document.fonts.ready` and two animation frames. Raw DOM content, rich text-node order, source links, styles and geometry are saved separately in `/tmp/mangrove-page-pattern-source-20261005`; `summary.json` records the scope. Representative UNDRR screenshots were inspected.

| Source viewport                      | Report column | News detail column |
| ------------------------------------ | ------------- | ------------------ |
| 390, UNDRR                           | 350px         | 330px              |
| 390, other four captured themes      | 370px         | 350px              |
| 767, UNDRR                           | 440px         | 420px              |
| 768 through 899, all captured themes | 180px         | 160px              |
| 900 and 901, all captured themes     | 600px         | 580px              |
| 1164 and 1440, all captured themes   | 736px         | 722px              |

The later `mg-reading` declaration gives an observed 24px gap, overriding the earlier grid column gap of 30px. At 768px the 48rem rail rule becomes active while the outer container remains capped at 480px, causing the narrow column until the 900px container boundary. This is an observed source condition, not a native layout fix. No source stylesheet was changed.

Narrow demo-shell padding differs between the default theme and later loaded theme bundles in the observed Storybook cascade. The width helpers deliberately record this finite source fixture rather than claiming a universal site equation. Stylesheet ordering, source changes, other consuming themes and other browser engines require new evidence.

The emitted presets are only 390 and 1164px. Width helpers retain separate per-brand observed values. Source typography is Roboto Regular 16px/24px for prose and Roboto Bold 23px/25.3px for h2. Headings balance; paragraphs use ordinary wrapping. Paint roles bind to `color/text` and `color/interactive`. Prose links retain UNDERLINE and their actual HTTPS targets.

Report source sections use a 10px top heading margin, 10px heading-to-paragraph margin, and 30px collapsed section spacing/bottom allocation. Paragraphs use the observed 16px default block-end margin. Native frames depict those relationships with explicit flow allocation. Browser and Figma text measurement, margin collapse, arbitrary wrapping and resulting height equality remain candidate boundaries.

## Verification and open gates

The dedicated harness builds the actual builder in each of five brands. It verifies source widths, section count, padding, paragraph flow, actual link count and stable source IDs. Two ordinary mocked repeats create zero nodes and retain owned identities, positioned consumer instances, edited headings/plain paragraphs, and formatted edits inside actual linked source and consumer TEXT runs.

Raw source/style/token/fixture hashes and the dependency graph fail closed on source drift. Foreign helper/style identities refuse rather than being replaced. Missing exact Roboto Bold refuses before canvas mutation. The extracted fixture stores source-authored text and measurement data. Exact active Regular/Bold source WOFF2 bytes are pinned with hashes, origin URLs and their embedded Apache License 2.0 declarations plus license text. They do not install or establish native font bytes. Remote replacement under an unchanged URL requires a fresh source browser/network comparison. No page media bytes or inferred media licenses are included.

The harness does not establish native rendering, exact font pixels, native shared-style/range-default editing, consumer font inheritance, publication, browser scrolling/navigation, sticky layout, semantic HTML, live responsive reflow or RTL/Arabic acceptance. Canonical library, consumer, recovery checkpoint, normal DTO and deliveries are outside this module's scope. Maintenance recovery drift, style publication, composite publication, novice handoff and reduced merge acceptance remain separate gates.
