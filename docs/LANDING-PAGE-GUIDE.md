# Building landing pages

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/LANDING-PAGE-GUIDE.md) and in [Storybook](https://mangrove.undrr.org/?path=/docs/patterns-building-landing-pages--docs).

Guidance for editors building landing pages on UNDRR websites: which page shape to start from, how to structure sections and which Mangrove component suits each job. The structure and editorial advice comes first in each section; the Drupal Gutenberg markup that produces it follows.

The [Landing page patterns](https://mangrove.undrr.org/?path=/docs/patterns-landing-pages--docs) page shows the three common page shapes rendered side by side. [Drupal Gutenberg integration](DRUPAL-GUTENBERG.md) covers how each UNDRR block serializes and has the current markup for every block; this guide links to it rather than repeating it.

> **Tip:** An AI tool can read this guide and the integration guide as one plain-text file: <https://mangrove.undrr.org/llms-page-building.txt>. [Using this guide with an AI tool](DRUPAL-GUTENBERG.md#using-this-guide-with-an-ai-tool) has a prompt to start from.

## Writing for landing pages

This guide covers structure, not prose. For the words on the page:

- [Editorial manual](EDITORIAL-MANUAL.md): capitalization, punctuation, numbers and dates, abbreviations, spelling, UNDRR terminology and inclusive language. It is the single source for these rules; the other guides link to it rather than restating it.
- [Writing guidelines](WRITING.md): plain language, front-loading and descriptive link text. Its rules on second person are written for interface copy; body copy on a landing page follows the editorial manual.
- UNDRR editorial guides for news, events, publications and blogs, being published at <https://assets.undrr.org/docs/editorial-guides/README.md>.

Points specific to landing pages:

- Write for the people who use UNDRR websites: Member States, disaster risk reduction practitioners, researchers and policymakers.
- Give every H2 section a short introduction of one or two sentences that says what the reader will find below. Keep it factual and action-oriented, and reference the Sendai Framework where it fits naturally.
- Use "disaster risk reduction" rather than "disaster management" or "disaster prevention", and spell it out before abbreviating it to DRR. Use "hazard" for the natural phenomenon and "disaster" for its impact on people.
- Headings are in sentence case.

## Choose a page shape

Decide what the page is for before choosing blocks. Most UNDRR landing pages are one of these:

| The page… | Shape | Start from |
| --- | --- | --- |
| Introduces a subject and points several ways into it | Topic or initiative | A split hero, an on-this-page bar, then routes and recent material |
| Is one long document that people cite sections of | Report or publication | A coloured header with a contents sidebar, or a hero with an on-this-page bar; see [Publication landing page](#publication-landing-page) |
| Exists to reach many items | Collection index | A plain H1, a contents block and rows of book cards; see [Card grid rows](#card-grid-rows) |
| Presents several charts about one place or theme | Data page | See [Data chart page](#data-chart-page) |
| Is returned to repeatedly, with movement between sections | Content hub | See [Content hub](https://mangrove.undrr.org/?path=/docs/patterns-content-hub--docs) |

The inserter's **UNDRR pages** pattern category has starting points for a reading page, an initiative overview, a publication collection and a frequently asked questions section.

## Page structure

### Page title

Every page has exactly one H1. Either the hero supplies it (`headingLevel` `h1`) or a level 1 heading block does. Do not use the Drupal page title block (`drupalblock/page-title-block`) in the page body.

```html
<!-- wp:heading {"level":1} -->
<h1 class="wp-block-heading">Page title</h1>
<!-- /wp:heading -->
```

For a large display title on a publication or campaign page, set the font size to **Huge**, which saves `has-huge-font-size mg-u-font-size-800`.

### Choosing a hero

The hero block has two layouts:

- **Split** (preferred for new pages): text in one column and an image, video or custom HTML in the other, on a solid theme colour. Contrast is predictable because the text never sits over a photograph.
- **Background** (legacy): text over a full-bleed image. Existing background heroes do not need migrating, but new pages should use split.

A newly inserted hero block starts on the background layout, so switch **Layout** to split in the block sidebar.

Split ratios describe the **content** column, which is the easiest thing to get backwards:

| Ratio | Content column | Use for |
| --- | --- | --- |
| 2/3 (default) | Two thirds | Text-led heroes: a long lede, several buttons, a supporting image |
| 1/2 | Half | Equal weight for a short lede and a strong image |
| 1/3 | One third | Video heroes, and any hero where the media is the message |

Use 1/3 for video: a video in a one-third column is too small to watch. Use custom HTML media for a statistic callout, a small chart or a captioned figure.

A hero has no slot for a contents list. Pair a hero with the [on-this-page bar](#in-page-navigation) directly below it, or use the [page header with a contents sidebar](#page-header-with-a-contents-sidebar) instead of a hero. A page with both reads as two headers.

Markup and attributes: [Drupal Gutenberg integration: Hero](DRUPAL-GUTENBERG.md#hero).

### In-page navigation

Long pages need a way to jump between sections. There are two blocks for this, and a page uses one of them:

- **On this page navigation** (`undrr/undrr-on-this-page-nav-block`): a sticky horizontal bar built from the H2 headings. Use it on narrative and campaign pages, directly after the hero. To keep a download in view as the reader scrolls, turn on its call-to-action link.
- **Table of contents** (`undrr/undrr-table-of-contents-block`): a contents list, usually in a sidebar of the page header. Use it on index and reference pages.

Both read the page's headings, so the headings are the navigation: keep H2 text short and specific. To leave a heading out, add a class to it: `mg-on-this-page-nav--exclude` for the on-this-page bar, `mg-table-of-contents--exclude` for the contents list.

Markup: [Table of contents](DRUPAL-GUTENBERG.md#table-of-contents) and [On this page navigation](DRUPAL-GUTENBERG.md#on-this-page-navigation).

### Page header with a contents sidebar

The reference-page alternative to a hero: a full-width coloured band with the title and lede on the left and the contents block on the right. The colour attributes go on the outer columns block, and the contents block sits directly in the right column.

```html
<!-- wp:columns {"backgroundColor":"undrr-blue","textColor":"white","style":{"elements":{"link":{"color":{"text":"var:preset|color|white"}}}},"undrrUtilityClasses":["mg-container-full-width"]} -->
<div class="wp-block-columns has-white-color has-undrr-blue-background-color has-text-color has-background has-link-color mg-container-full-width"><!-- wp:column {"width":"66.66%"} -->
<div class="wp-block-column" style="flex-basis:66.66%"><!-- wp:heading {"level":1,"fontSize":"huge"} -->
<h1 class="wp-block-heading has-huge-font-size mg-u-font-size-800">Page title</h1>
<!-- /wp:heading -->

  [lede paragraphs and a left-aligned outline download button]

</div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"center","width":"33.33%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:33.33%">[table of contents block]</div>
<!-- /wp:column --></div>
<!-- /wp:columns -->
```

When the introduction runs on after the header, continue it in a plain 66.66/33.33 columns block so the text stays aligned under the header.

### Section introductions

Each H2 section opens with its heading and a one- or two-sentence introduction, then its content. On campaign and long narrative pages, section H2s can be set to the **Huge** font size for a stronger break between sections; keep default sizing on index and reference pages.

### Section backgrounds

A full-width tinted band marks a change of job, such as a hand-off or a call to action at the end of a narrative run. On index pages, alternating white and light grey sections give a long page some rhythm. Used on every ordinary section, tinted bands just stripe the page.

Wrap the section in a columns block with one column. Do not use a group block as the wrapper; it breaks in Drupal Gutenberg.

```html
<!-- wp:columns {"backgroundColor":"undrr-light-grey","undrrUtilityClasses":["mg-container-full-width"]} -->
<div class="wp-block-columns has-undrr-light-grey-background-color has-background mg-container-full-width"><!-- wp:column -->
<div class="wp-block-column">

  [H2, introduction and the section content]

</div>
<!-- /wp:column --></div>
<!-- /wp:columns -->
```

To hold the section content to the default content width inside the band, put a constrained group inside the column. This is the one place a group block works:

```html
<!-- wp:columns {"backgroundColor":"undrr-light-grey","undrrUtilityClasses":["mg-container-full-width"]} -->
<div class="wp-block-columns has-undrr-light-grey-background-color has-background mg-container-full-width"><!-- wp:column {"width":"100%"} -->
<div class="wp-block-column" style="flex-basis:100%"><!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group">

  [H2, introduction and the section content]

</div>
<!-- /wp:group --></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->
```

For a band that also needs a centred reading column, put the percentage columns (below) directly in the band's columns block rather than nesting a second one.

Background colours belong on a container, not on a column in a row. A coloured column has no padding, so the text runs to its edges. For a call-out beside body text, put a [Highlight box](DRUPAL-GUTENBERG.md#highlight-box) in a plain column instead.

### Reading column widths

Long lines are hard to read. On narrative pages (annual reports, flagship publications, concept notes), centre body text in a narrower column and let full-width elements such as the hero, the on-this-page bar and stats cards break out of it. The side columns collapse on mobile.

| Split | Use for |
| --- | --- |
| 15/70/15 | Wide featured text, a hero-style lede, full-width call-to-action bars and download buttons |
| 20/60/20 | Body prose: roughly four or more consecutive paragraphs, and show-more targets |

```html
<!-- wp:columns -->
<div class="wp-block-columns"><!-- wp:column {"width":"20%"} -->
<div class="wp-block-column" style="flex-basis:20%"></div>
<!-- /wp:column -->

<!-- wp:column {"width":"60%"} -->
<div class="wp-block-column" style="flex-basis:60%">

  [paragraphs]

</div>
<!-- /wp:column -->

<!-- wp:column {"width":"20%"} -->
<div class="wp-block-column" style="flex-basis:20%"></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->
```

Do not use reading columns on index and reference pages, where full-width card rows use the space better.

### Spacing

Headings carry the rhythm, not spacers. A spacer between every H2 is usually the wrong tool; default block spacing plus clear section headings reads better, with a spacer kept for a genuine break. Where spacers are used, these values keep pages consistent:

| Where | Spacer |
| --- | --- |
| Between H2 sections on index and reference pages | 60px |
| Between H2 sections on campaign and narrative pages | 45px |
| Above the contents block, and below it | 32px, 40px |
| Between chart rows in a data page section | 40px |
| Top and bottom inside a tinted band | 48px |
| Between two tightly coupled blocks | 8px |

Card rows within a section need no spacer; default block spacing handles them.

### Composition defaults

Observations from pages that have been through editorial review, offered as defaults rather than rules:

- **Fill the short column or do not split.** A 66.66/33.33 split with an empty right column looks like a mistake once it repeats down a page. Put the pull quote, supporting image or diagram there.
- **Stats cards want full width.** In a one-third column their figures stack into a narrow strip. Place them between sections, not inside a split.
- **Buttons align left**, on the same axis as the text they follow. Centred buttons float free of the reading column.
- **A large first paragraph works as a lede.** The **Large** font size on a section's opening paragraph gives readers a way in without another heading level.

## Page archetypes

### Card grid rows

For collection index pages, which exist to reach many items:

- Put a full-width H3 above each row of cards, not inside a column.
- Below the H3, add a paragraph linking to the subsection's own landing page. Name the destination in the link text ("All early warning resources"), not a generic "View landing page", which reads the same for every row to a screen reader user scanning links. When the subsection covers two related topics, add both links separated by a line break.
- Lay book cards out in five-column rows, and pad a short row with empty columns so the covers keep their size.
- When two neighbouring subsections have only one or two cards each, merge them under one H3.
- Turn items that do not suit a card (training modules, other landing pages) into text links.
- Put editorial labels such as "(Suggested)" in the title text rather than the card's label.

```html
<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Subsection name</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><a href="https://www.undrr.org/example">All early warning resources</a></p>
<!-- /wp:paragraph -->

<!-- wp:columns -->
<div class="wp-block-columns"><!-- wp:column -->
<div class="wp-block-column">[book card]</div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column">[book card]</div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column">[book card]</div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->
```

Book card markup is in [Drupal Gutenberg integration: Card](DRUPAL-GUTENBERG.md#card).

### Publication landing page

For annual reports and other PDF-led publications, the web page is a guided tour that sends readers to the full document, not a copy of it:

1. A hero with the cover image or a video.
2. An on-this-page bar with a download call to action.
3. The foreword or introduction in a 15/70/15 reading column.
4. Key figures in full-width stats cards.
5. Thematic H2 sections, each with a story preview cut to two or three paragraphs and a "Read more in the full report (PDF)" link.
6. Quote highlights for official quotes from named people.
7. Cross-cutting themes as vertical cards linking to the thematic pages, rather than repeating text that is already in the PDF.
8. A download section with book cards for the PDF and any annexes.
9. A "More on UNDRR" section with vertical cards linking to related pages.

Alternate white and grey section backgrounds down the page. Global Assessment Report 2025 and the UNDRR Annual Reports 2024 and 2025 follow this shape.

```html
<!-- wp:paragraph -->
<p>The first two or three paragraphs of the story from the report.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><a href="/media/12345/download">Read more in the full report (PDF)</a></p>
<!-- /wp:paragraph -->
```

### Data chart page

For pages built around several charts, such as country resilience profiles or thematic dashboards, with three to five thematic sections. Keep prose brief: one framing sentence per section and one key finding per chart.

1. A full-width blue header: a back link, the H1, a row of metadata in four columns, a separator and a one- or two-sentence lead paragraph, in white text.
2. An on-this-page bar built from the H2s.
3. Thematic sections, alternating white and grey. Each opens with a short section label, an H2 with an anchor and a framing paragraph, followed by one row per chart.

Each chart row is a columns block split 33.33/66.66: an H3 stating the key message, one or two sentences of supporting data and an outline button on the left; the chart and its caption on the right.

```html
<!-- wp:columns -->
<div class="wp-block-columns"><!-- wp:column {"verticalAlignment":"top","width":"33.33%"} -->
<div class="wp-block-column is-vertically-aligned-top" style="flex-basis:33.33%"><!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Floods dominate expected annual disaster losses</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>One or two sentences supporting the key message with specific data.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"top","width":"66.66%"} -->
<div class="wp-block-column is-vertically-aligned-top" style="flex-basis:66.66%"><!-- wp:html -->
<iframe title="Floods dominate expected annual disaster losses" src="https://datawrapper.dwcdn.net/XXXXX/1/" scrolling="no" frameborder="0" style="width: 0; min-width: 100% !important; border: none;" height="425" data-external="1"></iframe>
<!-- /wp:html -->

<!-- wp:paragraph {"fontSize":"small"} -->
<p class="has-small-font-size mg-u-font-size-250">Share of total average annual loss by hazard type (%). <em>Source</em>: United Nations Office for Disaster Risk Reduction (2025)</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->
```

Chart titles and captions follow a convention:

| Element | Content | Example |
| --- | --- | --- |
| H3 in the left column | The key takeaway, stated as a message | "Floods dominate expected annual disaster losses" |
| `iframe` `title` | The same text as the H3; it is the chart's accessible name | "Floods dominate expected annual disaster losses" |
| Caption paragraph | Neutral: metric, units, scope and source, with the source in the [editorial manual's attribution form](EDITORIAL-MANUAL.md#undrr-specific-terminology) | "Share of total average annual loss by hazard type (%). *Source*: United Nations Office for Disaster Risk Reduction (2025)" |
| Title inside the chart | Can be hidden in the chart tool's publish settings | |

Datawrapper's own embed code adds a script that resizes the iframe; include it in the same `wp:html` block.

### Logo wall

For partner and consortium logos, use icon cards with `imageScale` `full` and `centered` on, six to a row, inside a 10/80/10 centring wrapper.

- For an organization with no usable logo, use a text-only icon card.
- For a logo that only exists in white, give that one column `"backgroundColor":"undrr-blue","textColor":"white"`.
- A first version can hotlink logos from the organizations' own websites by setting the image URL and leaving out `mediaID`; upload them to the media library before the page is final.

Icon card markup is in [Drupal Gutenberg integration: Card](DRUPAL-GUTENBERG.md#card).

## Choosing components

### Cards

| Content | Card |
| --- | --- |
| Topics, programmes or pages, each with a picture and a short description | Vertical card (`vc`) |
| The same, where a row of vertical cards would be too tall | Horizontal card (`hc`) |
| Publications and documents with a cover | Book card (`book`), or horizontal book card (`hc_book`) in a list |
| Partner logos and short route links | Icon card (`icon`) |

- Always give vertical and horizontal cards an image. Without one they lose their border, background and padding and render as bare text.
- Keep summaries to two or three sentences. Long summaries make rows ragged, because each card grows to its own content.
- Cover images are decorative when the title is beside them: set `mediaAlt` to an empty string. Photographs in content cards need descriptive alt text.
- Publication cover scans (the generated document thumbnails in the media library) look wrong in a vertical card; use a photograph.

### Figures and statistics

Use the [stats card](DRUPAL-GUTENBERG.md#stats-card) for headline figures, at full width. When there are more figures than fit one row, put several single-stat cards, each without a title, inside a [scroll container](DRUPAL-GUTENBERG.md#scroll-container) rather than stacking rows. Write figures the way the [editorial manual](EDITORIAL-MANUAL.md#numbers-and-dates) sets out.

### Quotes

Use the [Quote highlight](DRUPAL-GUTENBERG.md#quote-highlight) block for a quote with a named speaker, their title and optionally a portrait. For a pull quote with no attribution beside body text, a blockquote in the right-hand column of a 60/40 split is lighter:

```html
<!-- wp:columns {"backgroundColor":"undrr-light-grey","undrrUtilityClasses":["mg-container-full-width"]} -->
<div class="wp-block-columns has-undrr-light-grey-background-color has-background mg-container-full-width"><!-- wp:column {"width":"60%"} -->
<div class="wp-block-column" style="flex-basis:60%">

  [H2 and body paragraphs]

</div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"center","width":"40%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:40%"><!-- wp:html -->
<blockquote class="mg-quote-highlight mg-u-font-size-600">Pull quote text.</blockquote>
<!-- /wp:html --></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->
```

### Show more

The show more button collapses a long block, such as a list of resources, behind a toggle. It needs two things: a unique class on the block to collapse, and a layout that centres the button.

1. Give the content's columns block a class such as `show-more-target-k7q2xa`, with a random six- to eight-character suffix so that two show more blocks on one page cannot collide.
2. Put the button in its own columns row directly below, in the middle column of a 40/20/40 split.
3. Add a page-level style to centre the button.

```html
<!-- wp:columns {"className":"show-more-target-k7q2xa"} -->
<div class="wp-block-columns show-more-target-k7q2xa"><!-- wp:column {"width":"20%"} -->
<div class="wp-block-column" style="flex-basis:20%"></div>
<!-- /wp:column -->

<!-- wp:column {"width":"60%"} -->
<div class="wp-block-column" style="flex-basis:60%">

  [content to collapse]

</div>
<!-- /wp:column -->

<!-- wp:column {"width":"20%"} -->
<div class="wp-block-column" style="flex-basis:20%"></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->

<!-- wp:columns -->
<div class="wp-block-columns"><!-- wp:column {"width":"40%"} -->
<div class="wp-block-column" style="flex-basis:40%"></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"center","width":"20%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:20%"><!-- wp:undrr/undrr-show-more-button {"targetSelector":".show-more-target-k7q2xa","collapsedHeight":300} -->
<div class="wp-block-undrr-undrr-show-more-button"><style>.show-more-target-k7q2xa{--mg-show-more-height:300px}</style><a href="#" class="mg-button mg-button-primary mg-show-more--button" data-mg-show-more="true" data-mg-show-more-target=".show-more-target-k7q2xa" data-mg-show-more-label-collapsed="Show more" data-mg-show-more-label-open="Show less">Show more</a></div>
<!-- /wp:undrr/undrr-show-more-button --></div>
<!-- /wp:column -->

<!-- wp:column {"width":"40%"} -->
<div class="wp-block-column" style="flex-basis:40%"></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->

<!-- wp:html -->
<style>
.wp-block-undrr-undrr-show-more-button {
  text-align: center;
}
</style>
<!-- /wp:html -->
```

### Frequently asked questions and long reference content

There are two tools for content that readers expand one item at a time:

- **A short set of questions** (up to about ten): use the **Frequently asked questions** pattern from the **UNDRR pages** category. It inserts core Details blocks with the Mangrove presentation switched on, one per question. Details are native HTML disclosures, so they need no script and the browser's find-in-page search reaches the answers.
- **Long reference content**, such as a long question list or the Sendai Framework targets and indicators: use stacked tabs with **Show filter input** and **Single open (accordion)** turned on, so readers can type a word and go straight to the matching section. Horizontal tabs are the wrong tool here; they truncate their labels and make readers click through each tab. Write section labels with the words a reader would search for.

When a stacked tab set sits inside an H2 section and the tab labels are the only headings needed, turn on **Hide heading** for each section. Otherwise each open panel repeats its label as a visible H2 below the tab, which duplicates the heading.

Markup: [Drupal Gutenberg integration: Tabs](DRUPAL-GUTENBERG.md#tabs).

### Images and video

- Use images from the media library, with alt text that describes what the image shows. Every photograph needs a credit.
- Put images inside a reading column rather than full width, unless the image is the point of the section.
- For video, use the embed block with the ordinary YouTube or Vimeo URL, and put the caption in a small paragraph after it. Hero video is different: it needs the `/embed/` URL.

Markup: [Drupal Gutenberg integration: Core blocks](DRUPAL-GUTENBERG.md#core-blocks-used-alongside-the-undrr-blocks).

## Starter page

A minimal index page: title, contents, one white section of book cards and one grey section. Paste it through the Code editor, then replace the placeholder text, links and images. Elsewhere in this guide, text in square brackets such as `[book card]` marks where other blocks go; it is not valid block markup, so replace it with real blocks before pasting.

```html
<!-- wp:heading {"level":1} -->
<h1 class="wp-block-heading">Landing page title</h1>
<!-- /wp:heading -->

<!-- wp:spacer {"height":"32px"} -->
<div style="height:32px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:undrr/undrr-table-of-contents-block -->
<section class="wp-block-undrr-undrr-table-of-contents-block mg-table-of-contents" data-mg-table-of-contents="true" data-mg-table-of-contents-title="On this page" data-mg-table-of-contents-show-title="true" data-mg-table-of-contents-skip-auto-init="true"></section>
<!-- /wp:undrr/undrr-table-of-contents-block -->

<!-- wp:spacer {"height":"40px"} -->
<div style="height:40px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:heading -->
<h2 class="wp-block-heading">First section</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>One or two sentences on what readers will find in this section.</p>
<!-- /wp:paragraph -->

<!-- wp:columns -->
<div class="wp-block-columns"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:undrr/undrr-card {"title":"Resource A","titleLink":"https://www.undrr.org/example-a","cardType":"book","mediaAlt":""} -->
<article class="wp-block-undrr-undrr-card mg-card mg-card__book"><div class="mg-card__visual"><img src="/sites/default/files/2024-01/cover-a.jpg" alt="" class="mg-card__image" loading="lazy"/></div><div class="mg-card__content"><header class="mg-card__title"><a href="https://www.undrr.org/example-a">Resource A</a></header></div></article>
<!-- /wp:undrr/undrr-card --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:undrr/undrr-card {"title":"Resource B","titleLink":"https://www.undrr.org/example-b","cardType":"book","mediaAlt":""} -->
<article class="wp-block-undrr-undrr-card mg-card mg-card__book"><div class="mg-card__visual"><img src="/sites/default/files/2024-01/cover-b.jpg" alt="" class="mg-card__image" loading="lazy"/></div><div class="mg-card__content"><header class="mg-card__title"><a href="https://www.undrr.org/example-b">Resource B</a></header></div></article>
<!-- /wp:undrr/undrr-card --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->

<!-- wp:spacer {"height":"60px"} -->
<div style="height:60px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:columns {"backgroundColor":"undrr-light-grey","undrrUtilityClasses":["mg-container-full-width"]} -->
<div class="wp-block-columns has-undrr-light-grey-background-color has-background mg-container-full-width"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:heading -->
<h2 class="wp-block-heading">Second section</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>One or two sentences on what readers will find in this section.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Replace this paragraph with a row of cards, as in the first section.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->
```

## Related documentation

- [Drupal Gutenberg integration](DRUPAL-GUTENBERG.md): block reference, serialization rules and rendering constraints
- [Search widget editor configuration](SEARCH-WIDGET-EDITOR-GUIDE.md): adding a search or "latest content" panel to a page
- [Landing page patterns](https://mangrove.undrr.org/?path=/docs/patterns-landing-pages--docs) and [Content hub](https://mangrove.undrr.org/?path=/docs/patterns-content-hub--docs): rendered examples of these shapes
- [Component gallery](https://mangrove.undrr.org/?path=/docs/brand-component-gallery--docs): every component, grouped by what it is for
