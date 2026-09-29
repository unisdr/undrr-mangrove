# Drupal Gutenberg integration

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/DRUPAL-GUTENBERG.md) and in [Storybook](https://mangrove.undrr.org/?path=/docs/getting-started-integration-drupal-gutenberg--docs).

> **About this guidance:** this page brings together guidance maintained elsewhere and is provided for reference and ease of access. It is not the authoritative source. Where it differs from a source, or doesn't cover a point, follow the source: the block definitions and `save()` output in the Drupal `undrr_gutenberg_blocks` module as deployed (for blocks, attributes and markup), the [Editorial manual](https://mangrove.undrr.org/?path=/docs/contributing-editorial-manual--docs) and the sources it cites (for writing and style) and the [UNDRR Web Style Guide](https://unitednations.sharepoint.com/sites/UNDRR-DRR-COMMS/SitePages/Web-Style-Guide.aspx) (UNDRR staff only) (for UNDRR web style).

UNDRR websites (undrr.org, preventionweb.net, mcr2030.undrr.org and the microsites) run on a shared Drupal platform, and editors build landing pages there with the Gutenberg block editor. Most of what an editor places on a page is a Mangrove component wrapped in a Gutenberg block. This page is the thin layer between the two: which block renders which component, how the blocks serialize, what the deployed build can and cannot render, and the current markup for each block.

It has two companions:

- [Building landing pages](LANDING-PAGE-GUIDE.md): the editorial and structural guidance, meaning which page shapes to use and how to compose them. Start there if you are planning a page.
- [Search widget editor configuration](SEARCH-WIDGET-EDITOR-GUIDE.md): filters, facets and search syntax for the UNDRR search widget block.

## Using this guide with an AI tool

The Storybook site is a single-page app, so an AI tool that fetches a Storybook URL gets an empty shell. Every build publishes this guide and [Building landing pages](LANDING-PAGE-GUIDE.md) as one plain-text file instead: <https://mangrove.undrr.org/llms-page-building.txt>. The search widget reference has its own file: <https://mangrove.undrr.org/llms-search-widget.txt>.

Use this prompt in any AI tool that can fetch URLs:

> Using the UNDRR page building guide at https://mangrove.undrr.org/llms-page-building.txt, draft a Drupal Gutenberg landing page about disaster preparedness with a split hero, an on-this-page navigation bar and three sections of book cards.

Replace everything after "draft" with your page brief. Add <https://mangrove.undrr.org/llms-editorial-manual.txt> to the prompt when the tool is also writing the copy, and <https://mangrove.undrr.org/llms-search-widget.txt> when the page needs a search widget.

If you use Claude Code or Cursor with access to the block module source, the [drupal-gutenberg-llm-skills](https://github.com/khawkins98/drupal-gutenberg-llm-skills) plugin gives better results because it validates against the full block definitions.

Review AI output in the editor before publishing. A block the editor cannot validate shows an "Attempt block recovery" prompt; recovering it rewrites the markup to what the block would save, which usually drops attributes.

## Platform context

The platform uses the [Drupal Gutenberg module](https://www.drupal.org/project/gutenberg), a port of the WordPress block editor to Drupal. Block comments keep the WordPress `wp:` prefix, but a few things differ from WordPress:

- Landing pages use the `landing_page_gutenberg` content type.
- Blocks are registered in JavaScript and `*.gutenberg.yml`; there is no `block.json`.
- Libraries load through Drupal's `*.libraries.yml`, not `wp_enqueue_script()`.
- Translations use `Drupal.t()`, wrapped as `__()` in block code.
- `wp:group` does not work as a standalone section wrapper. Use `wp:columns` with a single `wp:column` child instead (see [Serialization rules](#serialization-rules)).

The UNDRR blocks live in the `undrr_gutenberg_blocks` Drupal module, in the platform codebase. Each block's `save()` function writes Mangrove markup (the `mg-` classes and `data-mg-*` attributes documented on each component page), and the Mangrove CSS and scripts that the theme loads style and hydrate it on the published page.

## Pasting markup into the editor

1. Open the page in the block editor.
2. Open the three-dot menu at the top right and choose **Code editor**.
3. Paste the markup where it belongs, then choose **Exit code editor**.
4. Check every block in the visual editor. A block with a validation warning has markup that does not match what the block saves; fix the markup or rebuild that block in the visual editor.

The body field's text format must be **Gutenberg**. It is the only format that parses block comments, renders dynamic blocks and resolves embeds. Markup saved under any other format, Full HTML included, is stored without complaint and then rendered as plain HTML: embeds print their URL as text, dynamic blocks such as the media entity block render nothing, and every block comment appears in the page source. Static blocks still look right, so a page can seem mostly fine while every dynamic block is broken. `<!-- wp:` in the page source is the give-away. Saving the page once through the editor sets the format.

## Where the markup comes from

The source of truth for every UNDRR block's serialized markup is that block's `save()` output in the `undrr_gutenberg_blocks` module. The examples on this page reproduce it so that editors and AI tools can work without access to the platform codebase. The module's maintainers keep the two in step: when a block's `save()` output changes, the matching example here is updated in the same round of work.

When an example here and the editor disagree, the editor wins. Build the block in the visual editor, open the Code editor and copy what it saved.

Blocks keep older save formats as deprecations, so pages saved with earlier markup (nested card wrappers, the previous stats card format, heroes without `mg-hero--no-image`) still validate and are rewritten to the current format the next time the block is saved.

## UNDRR blocks and the Mangrove components they render

All UNDRR blocks sit in the **UNDRR** category of the block inserter.

| Block (inserter name) | Registration name | Renders | Notes |
| --- | --- | --- | --- |
| UNDRR Hero | `undrr/undrr-hero-block` | [Hero](https://mangrove.undrr.org/?path=/docs/components-hero-hero--docs) | Split layout preferred; see [Hero](#hero) |
| UNDRR Card | `undrr/undrr-card` | [Vertical card](https://mangrove.undrr.org/?path=/docs/components-cards-vertical-card--docs), [Horizontal card](https://mangrove.undrr.org/?path=/docs/components-cards-horizontal-card--docs), [Book card](https://mangrove.undrr.org/?path=/docs/components-cards-book-card--docs), [Horizontal book card](https://mangrove.undrr.org/?path=/docs/components-cards-horizontal-book-card--docs), [Icon card](https://mangrove.undrr.org/?path=/docs/components-cards-icon-card--docs) | One block, five card types via `cardType` |
| Stats card | `undrr/stats-card` | [Stats card](https://mangrove.undrr.org/?path=/docs/components-cards-stats-card--docs) | Hydrated from `data-stats` |
| Tabs V2 and Tab section V2 | `undrr/undrr-tabs-v2-block`, `undrr/undrr-tabs-v2-section` | [Tabs](https://mangrove.undrr.org/?path=/docs/components-tabs--docs) | Horizontal or stacked |
| Table of contents | `undrr/undrr-table-of-contents-block` | [Table of contents](https://mangrove.undrr.org/?path=/docs/components-navigation-table-of-contents--docs) | Sidebar contents list |
| On this page navigation | `undrr/undrr-on-this-page-nav-block` | [On this page nav](https://mangrove.undrr.org/?path=/docs/components-navigation-on-this-page-nav--docs) | Sticky bar built from headings |
| Show more button | `undrr/undrr-show-more-button` | [Show more](https://mangrove.undrr.org/?path=/docs/components-showmore--docs) | Collapses another block |
| Scroll container | `undrr/undrr-scroll-container` | [Scroll container](https://mangrove.undrr.org/?path=/docs/components-scrollcontainer--docs) | Horizontal scrolling row |
| Highlight box | `undrr/highlight-box` | [Highlight box](https://mangrove.undrr.org/?path=/docs/components-highlightbox--docs) | Call-out with inner blocks |
| Quote highlight | `undrr/undrr-quote-highlight-block` | [Quote highlight](https://mangrove.undrr.org/?path=/docs/components-quotehighlight--docs) | Quote with attribution |
| Social share | `undrr/undrr-social-share-block` | [Share buttons](https://mangrove.undrr.org/?path=/docs/components-buttons-sharebuttons--docs) | No attributes |
| Gallery | `undrr/gallery` | [Gallery](https://mangrove.undrr.org/?path=/docs/components-gallery--docs) | Hydrated from `data-mg-gallery-data` |
| UNDRR Call to Action | `undrr/cta-band` | [CTA](https://mangrove.undrr.org/?path=/docs/components-cta--docs) | Full-width call-to-action band |
| UNDRR Notice | `undrr/notice` | [Notice](https://mangrove.undrr.org/?path=/docs/components-notice-notice--docs) | Deadlines, corrections, milestones |
| UNDRR Hub Header | `undrr/hub-header` | Hub header, shown in [Content hub](https://mangrove.undrr.org/?path=/docs/patterns-content-hub--docs) | Persistent identity and section links for a hub |
| UNDRR Search Widget | `undrr/search-widget` | [Syndicated search](https://mangrove.undrr.org/?path=/docs/components-syndicated-search--docs) | See [Search widget editor configuration](SEARCH-WIDGET-EDITOR-GUIDE.md) |
| UNDRR Search Bar Container, UNDRR Search Facets Container | `undrr/search-bar-target`, `undrr/search-facets-target` | Regions for the search widget | Place the search input or facets elsewhere on the page |

The module also extends some core blocks rather than adding new ones:

- Every core block gains an `undrrUtilityClasses` attribute, which is how Mangrove utility classes such as `mg-container-full-width` reach the saved markup.
- **Columns** gains a **Mangrove grid** toggle. Columns inserted from the layout picker start on the grid: the block saves `"mgGrid":true` and adds [`mg-grid mg-grid__col-N`](https://mangrove.undrr.org/?path=/docs/design-decisions-grid-layout--docs) to the wrapper, and columns stack below 900px. Existing columns, and hand-written markup without `mgGrid`, keep the standard Gutenberg flex columns. The layout examples in these guides use the flex form, which is what most existing pages use.
- **Details** and **Table** gain an opt-in **Mangrove presentation** panel. Details keep their native disclosure behaviour. Tables offer compact density, stripes, borders and a named, keyboard-focusable scrolling region; give tables proper header cells and a descriptive caption, because these controls do not add sorting or stacked mobile labels.

The **UNDRR pages** pattern category in the inserter provides a reading page with contents, an initiative overview, a publication collection and a frequently asked questions section. Patterns insert ordinary editable blocks, so replace the starter text, figures, images and link destinations before publishing.

Deprecated blocks remain valid on existing pages but should not be used in new content. Nor should the Drupal page title block (`drupalblock/page-title-block`): use a level 1 heading block instead.

| Deprecated block | Use instead |
| --- | --- |
| Tabs V1 (`undrr/undrr-tabs-block`) | Tabs V2 (`undrr/undrr-tabs-v2-block`) |
| Tab section V1 (`undrr/undrr-tabs-section`) | Tab section V2 (`undrr/undrr-tabs-v2-section`) |

## Serialization rules

Drupal Gutenberg 3.x does not always serialize the way WordPress Gutenberg does. Markup written the WordPress way causes validation warnings or block recovery prompts.

### Wrap HTML comments in `wp:html`

The block parser is confused by bare HTML comments between blocks. To keep an editorial note in the saved page, wrap it in a `wp:html` block:

```html
<!-- wp:html -->
<!-- Editorial note: replace the placeholder images before publishing. -->
<!-- /wp:html -->
```

A notes block like this at the top of a page is a useful place for editors to leave instructions for each other.

### Headings

Level 2 is the default, so `{"level":2}` can be omitted. An anchor goes in the HTML `id`; `{"anchor":"my-section"}` in the block comment also works and survives round trips through the editor better.

```html
<!-- wp:heading -->
<h2 class="wp-block-heading" id="my-section">Section heading</h2>
<!-- /wp:heading -->
```

### Font sizes write two classes

A `fontSize` attribute writes the Gutenberg class and a paired Mangrove utility class from a fixed map, so the markup also renders correctly where Mangrove CSS is loaded without the Gutenberg styles:

| `fontSize` | Saved classes |
| --- | --- |
| `small` | `has-small-font-size mg-u-font-size-250` |
| `regular` | `has-regular-font-size mg-u-font-size-300` |
| `medium` | `has-medium-font-size mg-u-font-size-400` |
| `large` | `has-large-font-size mg-u-font-size-500` |
| `huge` | `has-huge-font-size mg-u-font-size-800` |

On `wp:buttons`, Gutenberg also adds `has-custom-font-size`.

```html
<!-- wp:heading {"level":1,"fontSize":"huge"} -->
<h1 class="wp-block-heading has-huge-font-size mg-u-font-size-800">Page title</h1>
<!-- /wp:heading -->
```

Older pages set `{"className":"has-large-font-size"}` on paragraphs instead. That still renders, but new content should use the `fontSize` attribute from the editor's typography panel.

### Buttons carry Mangrove classes

`wp:button` writes the core `wp-element-button` class and a Mangrove button class. The default style maps to `mg-button-primary`; the **Outline** style maps to `mg-button-secondary`. `mg-button-arrow` appears only in the hero block's own buttons, never in `wp:button`.

```html
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"left"}} -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button mg-button mg-button-primary" href="/path">Primary action</a></div>
<!-- /wp:button -->

<!-- wp:button {"className":"is-style-outline"} -->
<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button mg-button mg-button-secondary" href="/path">Secondary action</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->
```

`is-style-primary is-style-outline` together still produce `mg-button-secondary`; the outline style wins.

### Lists

`wp:list` is saved with an explicit `className` even though `wp-block-list` is its default, and every item needs its own `wp:list-item` wrapper. Bare `<li>` elements fail validation.

```html
<!-- wp:list {"className":"wp-block-list"} -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>First item</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Second item with a <a href="https://www.undrr.org">link</a></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->
```

### Separators and spacers

```html
<!-- wp:separator {"opacity":"css"} -->
<hr class="wp-block-separator has-css-opacity"/>
<!-- /wp:separator -->

<!-- wp:spacer {"height":"40px"} -->
<div style="height:40px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->
```

### Images from the media library

An image inserted from the Drupal media library records the Drupal file in a `mediaAttrs` object and mirrors it as `data-*` attributes on the `<img>`. Captions use `wp-element-caption`.

```html
<!-- wp:image {"id":95062,"sizeSlug":"full","linkDestination":"none","mediaAttrs":{"data-entity-type":"file","data-entity-uuid":"c406fed6-d9d1-413c-9ed0-f067d4c2f93f","data-image-style":"original"}} -->
<figure class="wp-block-image size-full"><img src="/sites/default/files/2025-10/photo.jpg" alt="Alt text" class="wp-image-95062" data-entity-type="file" data-entity-uuid="c406fed6-d9d1-413c-9ed0-f067d4c2f93f" data-image-style="original"/><figcaption class="wp-element-caption">Caption. Photo: UNDRR</figcaption></figure>
<!-- /wp:image -->
```

When drafting without a real media item, use a placeholder `src` and leave out `mediaAttrs`; the editor fills them in when an image is chosen.

Image paths start with `/sites/default/files/`. A Drupal `public://` path becomes `/sites/default/files/`, and spaces in file names are URL-encoded.

### Media URLs are not stored in the block comment

For `undrr/undrr-card` and `undrr/undrr-hero-block`, `mediaURL` is read back from the `src` of the saved `<img>`, so it does not belong in the block comment; the editor drops it there on the next save. `mediaID` and the alt text attribute (`mediaAlt` on cards, `mediaAltText` on heroes) do belong in the comment.

### Special characters

In the JSON block comment, characters can be written literally when pasting: `"Climate & Disaster"`. In the saved HTML, use entities: `Climate &amp; Disaster`, which matches what the blocks' `save()` functions produce.

When the editor saves, it escapes `<`, `>`, `&` and `"` inside attribute values as Unicode sequences (`\u003c`, `\u003e`, `\u0026`, `\u0022`), so an attribute that holds HTML, such as a hero `summaryText` with a link, reads `\u003ca href=\u0022…\u0022\u003e` in the block comment. Write it that way when composing by hand: an unescaped `"` inside an attribute value ends the JSON string and breaks the block.

### Section wrappers use columns, not groups

`wp:group` breaks when it is used as a standalone section or background wrapper. Use `wp:columns` with a single `wp:column` child instead:

```html
<!-- wp:columns {"backgroundColor":"undrr-light-grey","undrrUtilityClasses":["mg-container-full-width"]} -->
<div class="wp-block-columns has-undrr-light-grey-background-color has-background mg-container-full-width"><!-- wp:column -->
<div class="wp-block-column">

  [section content]

</div>
<!-- /wp:column --></div>
<!-- /wp:columns -->
```

One exception works: `wp:group {"layout":{"type":"constrained"}}` nested inside a `wp:column` of such a wrapper, which holds the section content to the default content width without percentage columns. [Building landing pages](LANDING-PAGE-GUIDE.md#section-backgrounds) shows both.

## Rendering constraints

Valid markup can still render wrongly because of the Mangrove CSS and scripts a site loads. Several limits of older builds are fixed in current Mangrove, so check which Mangrove version the site loads before applying a workaround. Page-level CSS goes in a `wp:html` block containing a `<style>` element, and each workaround should be removed once the site runs a version with the fix.

- **Root font size.** Mangrove 1.x sites use a 10px root (`html { font-size: 62.5% }`), so in page-level CSS `1rem` is 10px: write `1.6rem` for 16px text and `1.4rem` for 14px. Mangrove 2.0 removes the 10px root and uses the browser-standard 16px, so on 2.0 write plain rem values. A rule written for the wrong root looks as if it was ignored.
- **Stats card column count.** Before Mangrove 1.8.2 the grid had classes for 1–6 columns only, and a stats card with seven or more stats collapsed to one stacked column. Current Mangrove supports 1–12 columns, and the block saves `mg-grid--auto-fit` for larger sets. Keep groups small enough for values and labels to stay readable on a phone.
- **Icon cards.** Before Icon card 1.4, `centered: true` centred the label but left the glyph pinned to the left, and `iconSize` was dropped at hydration. Current Mangrove centres both and applies custom glyph sizes in the editor and on the published card.
- **Cards without an image.** Vertical and horizontal cards hang their border, background and padding on the image area. With no image they render as bare text. Give them an image, or choose another pattern for imageless content.
- **Highlight box primary tone.** Before Highlight box 1.2, text inside the dark blue `primary` tone inherited near-black and failed contrast. Current Mangrove sets the text to white.
- **Hero without an image.** Since Hero 1.9.0 the background layout shows the photograph as a banner above the copy on narrow screens. The block adds `mg-hero--no-image` to a background hero saved without an image, so the empty banner collapses. Heroes saved before the block added the class still carry the empty banner until they are saved again.

## Block reference

Attributes and current markup for each UNDRR block. Blocks whose markup is long or depends on the media library (Gallery, Call to Action, Notice, Hub Header, Search Bar Container, Search Facets Container) are best built in the visual editor; their attributes are listed in the block's sidebar.

### Hero

`undrr/undrr-hero-block` renders the [Hero](https://mangrove.undrr.org/?path=/docs/components-hero-hero--docs) component. [Building landing pages](LANDING-PAGE-GUIDE.md#choosing-a-hero) covers when to use each layout.

| Attribute | Values | Notes |
| --- | --- | --- |
| `layout` | `background` (default), `split` | Prefer `split` for new pages. `background` is still the default, so set `layout` explicitly |
| `splitRatio` | `2/3` (default), `1/2`, `1/3` | Split only. The fraction is the **content** column: `2/3` is text-led, `1/3` is media-led. Saves `mg-hero--split-2-3`, `-1-2` or `-1-3`; an unrecognized value falls back to `2-3` |
| `mediaType` | `image` (default), `video`, `html` | Split only. `background` accepts an image only |
| `headingLevel` | `h1` (default), `h2`, `h3`, `header` | Use `h1` when the hero opens the page. `header` (no heading level) saves the title in a `<span>` |
| `title` | Plain text | Accepts `<br>` and `&nbsp;` for line breaks |
| `summaryText` | Rich text | Saved raw when it holds inline markup only; wrap it in `<p>` in the attribute to get a `<p>` in the output |
| `labelText`, `labelLink`, `toggleLabel` | Text, URL, boolean | Short eyebrow label above the title |
| `primaryButtonText`, `primaryButtonLink` | Text, URL | The title links to `primaryButtonLink`; there is no separate title link |
| `secondaryButtonText`, `secondaryButtonLink`, `toggleButtonSecondary` | Text, URL, boolean | Second button |
| `tertiaryButtonText`, `tertiaryButtonLink`, `toggleButtonTertiary` | Text, URL, boolean | Third button |
| `openTab` | Boolean | Opens every hero link in a new tab |
| `overlayBackgroundColor` | `primary`, `secondary`, `tertiary`, `quaternary` | Saves `mg-hero--{value}`, except `primary`, which saves `mg-hero--` with an empty suffix; unset saves `mg-hero--undefined` |
| `mediaID`, `mediaAltText` | Media ID, text | Image media |
| `videoEmbedUrl`, `videoTitle` | URL, text | Video media. Use the `/embed/` URL; a watch URL renders a refused frame. `videoTitle` is the iframe's accessible name and is required |
| `customHtml` | HTML string | HTML media. Rendered verbatim, so it must be sanitized before saving. A bare `<figure>` with `<img>` and `<figcaption>` gets an attribution overlay |

The `heroType` option (`parent` or `child`) was retired in April 2026; leave it unset.

Current split hero with an image and no label, as the editor saves it today:

```html
<!-- wp:undrr/undrr-hero-block {"title":"Monitoring the Sendai Framework","summaryText":"Strong accountability is a cornerstone of the \u003ca href=\u0022https://www.undrr.org/implementing-sendai-framework/what-sendai-framework\u0022\u003eSendai Framework for Disaster Risk Reduction\u003c/a\u003e","primaryButtonText":"Go to the SFM analytics portal","primaryButtonLink":"https://sendaimonitor.undrr.org/analytics","layout":"split","splitRatio":"1/2","headingLevel":"h1","mediaType":"image","mediaID":"119162","mediaAltText":"Firefighters amongst a brush fire","undrrUtilityClasses":[]} -->
<section class="wp-block-undrr-undrr-hero-block mg-hero mg-hero--split mg-hero--split-1-2 mg-hero--undefined"><div class="mg-hero__split-grid mg-container"><article class="mg-hero__content"><header class="mg-hero__title"><h1 class="text-xxl"><a href="https://sendaimonitor.undrr.org/analytics">Monitoring the Sendai Framework</a></h1></header><div class="mg-hero__summaryText">Strong accountability is a cornerstone of the <a href="https://www.undrr.org/implementing-sendai-framework/what-sendai-framework">Sendai Framework for Disaster Risk Reduction</a></div><div class="mg-hero__buttons"><a href="https://sendaimonitor.undrr.org/analytics" target="_self" rel="noreferrer" role="button" type="Primary" class="mg-button mg-button-primary mg-button-arrow">Go to the SFM analytics portal</a></div></article><div class="mg-hero__media"><img src="/sites/default/files/styles/ultrawide_16_6/public/2026-07/smoke-firefighters.jpg?h=c673cd1c&amp;itok=DmrYvrbd" alt="Firefighters amongst a brush fire" class="mg-hero__media-img" data-mg-media-id="119162"/></div></div></section>
<!-- /wp:undrr/undrr-hero-block -->
```

Details that trip up hand-written hero markup:

- `mg-hero--undefined` when `overlayBackgroundColor` is unset. Heroes saved before the current block version have a trailing space after it; both forms validate.
- No `mg-hero__meta` element when there is no label.
- The title is `<h1 class="text-xxl"><a href="…">Text</a></h1>`.
- The `<img>` carries `data-mg-media-id`, and its `src` is a Drupal image style derivative with an `?h=…&itok=…` query. Copy the URL the media library generates rather than writing one.

Current split hero with a video, media-led (`1/3`):

```html
<!-- wp:undrr/undrr-hero-block {"title":"El Niño","summaryText":"A shift in the Pacific Ocean that raises the odds of drought, flood, heat and fire across large parts of the world.","primaryButtonText":"Explore the evidence on PreventionWeb","primaryButtonLink":"https://www.preventionweb.net/hubs/el-nino","layout":"split","splitRatio":"1/3","headingLevel":"h1","mediaType":"video","videoEmbedUrl":"https://www.youtube.com/embed/FVTESdSeWnw","videoTitle":"What can be done to protect Southern Africa from El Niño?","undrrUtilityClasses":[]} -->
<section class="wp-block-undrr-undrr-hero-block mg-hero mg-hero--split mg-hero--split-1-3 mg-hero--undefined"><div class="mg-hero__split-grid mg-container"><article class="mg-hero__content"><header class="mg-hero__title"><h1 class="text-xxl"><a href="https://www.preventionweb.net/hubs/el-nino">El Niño</a></h1></header><div class="mg-hero__summaryText">A shift in the Pacific Ocean that raises the odds of drought, flood, heat and fire across large parts of the world.</div><div class="mg-hero__buttons"><a href="https://www.preventionweb.net/hubs/el-nino" target="_self" rel="noreferrer" role="button" type="Primary" class="mg-button mg-button-primary mg-button-arrow">Explore the evidence on PreventionWeb</a></div></article><div class="mg-hero__media mg-hero__media--video"><iframe src="https://www.youtube.com/embed/FVTESdSeWnw" title="What can be done to protect Southern Africa from El Niño?" class="mg-hero__media-iframe" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen=""></iframe></div></div></section>
<!-- /wp:undrr/undrr-hero-block -->
```

Copy the iframe's `allow` list and `allowfullscreen` exactly; the block writes a fixed list and anything else fails validation. When a hero has both `mediaID` and `videoEmbedUrl`, the video wins and the image is ignored.

For a hero with a label, extra buttons or custom HTML media, build it in the visual editor and copy the result from the Code editor: those options change the saved structure in ways that are easy to get wrong by hand.

### Card

`undrr/undrr-card` renders one of five Mangrove cards, chosen by `cardType`.

| `cardType` | Wrapper classes | Renders | Image style picked by the editor |
| --- | --- | --- | --- |
| `vc` (default) | `mg-card mg-card__vc` | [Vertical card](https://mangrove.undrr.org/?path=/docs/components-cards-vertical-card--docs) | `landscape_16_9` |
| `hc` | `mg-card mg-card__hc` | [Horizontal card](https://mangrove.undrr.org/?path=/docs/components-cards-horizontal-card--docs) | `landscape_16_9` |
| `book` | `mg-card mg-card__book` | [Book card](https://mangrove.undrr.org/?path=/docs/components-cards-book-card--docs) | `por` (portrait) |
| `hc_book` | `mg-card mg-card__hc mg-card-book__hc` | [Horizontal book card](https://mangrove.undrr.org/?path=/docs/components-cards-horizontal-book-card--docs) | `por` (portrait) |
| `icon` | `mg-card mg-card__icon` | [Icon card](https://mangrove.undrr.org/?path=/docs/components-cards-icon-card--docs) | `thumbnail` |

Every attribute except `title` is optional, and each element is saved only when its attribute is set: no image means no `mg-card__visual`, no label means no `mg-card__meta`.

| Attribute | Saved as |
| --- | --- |
| `title`, `titleLink` | `<header class="mg-card__title"><a href="{titleLink}">{title}</a></header>` |
| `labelText`, `labelLink` | `<div class="mg-card__meta"><a href="{labelLink}" class="mg-card__label">{labelText}</a></div>` |
| `summary` | `<div class="mg-card__summary">{summary}</div>` |
| `mediaID`, `mediaAlt` | `<div class="mg-card__visual"><img … class="mg-card__image" loading="lazy"/></div>`. Use `"mediaAlt":""` for a decorative cover |
| `primaryButtonText`, `primaryButtonLink` | `<a class="mg-button mg-button-primary mg-button-arrow" role="button" type="Primary">` |
| `colorVariant` | `mg-card--{value}` for `secondary`, `tertiary` or `quaternary`; `primary` (the default) saves no class |
| `plainTitle` | `mg-card--plain-title`, which drops the title link's underline and hover colour |

Vertical, horizontal and book cards save a single `<article>` that carries both the block class and the Mangrove card classes (`wp-block-undrr-undrr-card mg-card mg-card__vc`). Icon cards keep an inner `<div class="mg-card mg-card__icon">`, because their hydration reads it. The saved order is `mg-card__visual` before `mg-card__content`, and inside the content the meta, then the title, then the summary.

Vertical card with image and summary:

```html
<!-- wp:undrr/undrr-card {"title":"Drought","titleLink":"/hazard-information-profiles","summary":"Rainfall deficits tend to concentrate in Central America's Dry Corridor, parts of southern Africa, Australia and Southeast Asia.","mediaID":"118479","mediaAlt":"A farmer in Mozambique receives agricultural inputs"} -->
<article class="wp-block-undrr-undrr-card mg-card mg-card__vc"><div class="mg-card__visual"><img src="/sites/default/files/2026-06/example.jpg" alt="A farmer in Mozambique receives agricultural inputs" data-mg-media-id="118479" class="mg-card__image" loading="lazy"/></div><div class="mg-card__content"><header class="mg-card__title"><a href="/hazard-information-profiles">Drought</a></header><div class="mg-card__summary">Rainfall deficits tend to concentrate in Central America's Dry Corridor, parts of southern Africa, Australia and Southeast Asia.</div></div></article>
<!-- /wp:undrr/undrr-card -->
```

Book card with a cover, and without one:

```html
<!-- wp:undrr/undrr-card {"title":"Global Assessment Report 2024","titleLink":"https://www.undrr.org/gar/2024","cardType":"book","mediaAlt":""} -->
<article class="wp-block-undrr-undrr-card mg-card mg-card__book"><div class="mg-card__visual"><img src="/sites/default/files/2024-06/gar2024-cover.jpg" alt="" class="mg-card__image" loading="lazy"/></div><div class="mg-card__content"><header class="mg-card__title"><a href="https://www.undrr.org/gar/2024">Global Assessment Report 2024</a></header></div></article>
<!-- /wp:undrr/undrr-card -->

<!-- wp:undrr/undrr-card {"title":"Document title","titleLink":"https://www.undrr.org/publication/example","cardType":"book"} -->
<article class="wp-block-undrr-undrr-card mg-card mg-card__book"><div class="mg-card__content"><header class="mg-card__title"><a href="https://www.undrr.org/publication/example">Document title</a></header></div></article>
<!-- /wp:undrr/undrr-card -->
```

Icon cards are the standard pattern for partner logo walls. They add `imageScale` (`"full"` fills the card), `centered` and `variant`, and the `<article>` carries four `data-mg-icon-card*` attributes that the component hydrates from. An icon card can show a Mangrove icon instead of an image through the `icon` attribute (for example `"icon":"mg-icon mg-icon-globe"`); see the [Icons gallery](https://mangrove.undrr.org/?path=/docs/components-icons--docs) for names.

```html
<!-- wp:undrr/undrr-card {"title":"WMO","titleLink":"https://wmo.int/","mediaID":"116764","mediaAlt":"WMO","cardType":"icon","imageScale":"full","centered":true} -->
<article class="wp-block-undrr-undrr-card" data-mg-icon-card="" data-mg-icon-card-data="[{&quot;imgback&quot;:&quot;/sites/default/files/2026-04/wmo-logo.png&quot;,&quot;imgalt&quot;:&quot;WMO&quot;,&quot;iconSize&quot;:72,&quot;imageScale&quot;:&quot;full&quot;,&quot;title&quot;:&quot;WMO&quot;,&quot;srOnlyTitle&quot;:false,&quot;link&quot;:&quot;https://wmo.int/&quot;,&quot;buttonType&quot;:&quot;Primary&quot;}]" data-mg-icon-card-centered="true" data-mg-icon-card-variant="default"><div class="mg-card mg-card__icon mg-card__icon--centered"><div class="mg-card__visual"><img src="/sites/default/files/2026-04/wmo-logo.png" alt="WMO" data-mg-media-id="116764" class="mg-card__image mg-card__image--full"/></div><div class="mg-card__content"><header class="mg-card__title"><a href="https://wmo.int/">WMO</a></header></div></div></article>
<!-- /wp:undrr/undrr-card -->
```

For an organization with no usable logo, leave out `mediaID` and the image; the card saves a text-only tile. Recent block versions add further keys to `data-mg-icon-card-data` (`icon`, `label`, `summaryText`, `linkText`, `button`) and save `imageScale` as `null` when it is unset, so copy icon cards from the editor when using those options.

### Stats card

`undrr/stats-card` renders the [Stats card](https://mangrove.undrr.org/?path=/docs/components-cards-stats-card--docs). Attributes: `title`, `variant` (`default`, `compact`, `highlighted`, `negative`) and `stats`, an array of `{icon, label, value, bottomLabel, summaryText, link}`.

```html
<!-- wp:undrr/stats-card {"title":"Global reporting snapshot","stats":[…]} -->
<section class="wp-block-undrr-stats-card" data-mg-stats-card="" data-stats="[…]" data-variant="default" data-title="Global reporting snapshot"><div class="mg-stats-card mg-stats-card--default"><h2 class="mg-stats-card__title">Global reporting snapshot</h2><div class="mg-grid mg-grid__col-3">
  <article class="mg-stats-card-item mg-card">…</article>
</div></div></section>
<!-- /wp:undrr/stats-card -->
```

- With no `title`, the block saves no `<h2>` and no `data-title`. That makes single-stat cards usable as items in a scroll container.
- The stats sit in an `mg-stats-card mg-stats-card--{variant}` wrapper, and the grid is saved with its column class: `mg-grid__col-N` for 1–12 stats, `mg-grid--auto-fit` above that.
- Older pages use earlier formats: a grid without a column class, or everything in one `data-mg-stats-card-data` object. They still validate and render, but new markup should use the format above. Enter the stats in the block sidebar rather than writing the JSON by hand.

### Tabs

`undrr/undrr-tabs-v2-block` holds `undrr/undrr-tabs-v2-section` children and renders [Tabs](https://mangrove.undrr.org/?path=/docs/components-tabs--docs).

| Attribute | Block | Effect |
| --- | --- | --- |
| `tabOrientation` | Tabs | `horizontal` (default) or `stacked` (an accordion) |
| `hasFullWidthBackground` | Tabs | Full-width background band |
| `defaultOpen` | Tabs, stacked only | **Default open state**: `default` (first section open), `true` (all open) or `false` (all closed); saves `data-mg-js-tabs-default-open` unless it is `default` |
| `filterable` | Tabs, stacked only | **Show filter input**: a keyword search field above the sections; saves `data-mg-js-tabs-filterable=""` |
| `filterPlaceholder` | Tabs, stacked only | Placeholder for that field |
| `singleOpen` | Tabs, stacked only | **Single open (accordion)**: only one section open at a time; saves `data-mg-js-tabs-single-open=""` |
| `id` | Section | Used raw in the link `href` and section `id`, prefixed with `mg-tabs__section-` |
| `label` | Section | Tab text, and the section's `<h2>` |
| `unlabelled` | Section | **Hide heading**: saves that `<h2>` as `mg-u-sr-only`, for when the tab label is already the visible heading |
| `defaultOpen` | Section | Opens this section first |

Serialization details:

- The outer `<div>` has only Mangrove classes, not the `wp-block-undrr-undrr-tabs-v2-block` class, and `mg-tabs__list` has a trailing space in its `class`.
- The editor writes a `dirty` attribute holding a timestamp when the block is saved. It does not appear in the saved HTML.
- Boolean options save as empty-string attributes (`=""`), not `="true"`, and the stacked-only options are dropped from the output of a horizontal tab set.
- Each section saves **two sibling `<li>` elements**: a link item and a content item. Writing one `<li>` per section is the most common cause of an invalid tabs block.

Horizontal tabs with one section:

```html
<!-- wp:undrr/undrr-tabs-v2-block -->
<div class="mg-tabs mg-tabs--horizontal" data-mg-js-tabs="true" data-mg-js-tabs-variant="horizontal"><ul class="mg-tabs__list "><!-- wp:undrr/undrr-tabs-v2-section {"id":"overview","label":"Overview","defaultOpen":true} -->
<li class="mg-tabs__item"><a class="mg-tabs__link" href="#mg-tabs__section-overview" data-mg-js-tabs-default="true" role="tab">Overview</a></li><li class="mg-tabs-content" data-mg-js-tabs-content="true"><section class="mg-tabs__section" id="mg-tabs__section-overview"><h2>Overview</h2><!-- wp:paragraph -->
<p>Section content.</p>
<!-- /wp:paragraph --></section></li>
<!-- /wp:undrr/undrr-tabs-v2-section --></ul></div>
<!-- /wp:undrr/undrr-tabs-v2-block -->
```

Stacked tabs with a keyword filter, the right tool for long reference content such as frequently asked questions:

```html
<!-- wp:undrr/undrr-tabs-v2-block {"tabOrientation":"stacked","singleOpen":true,"filterable":true,"filterPlaceholder":"Search targets, indicators and topics"} -->
<div class="mg-tabs mg-tabs--stacked" data-mg-js-tabs="true" data-mg-js-tabs-variant="stacked" data-mg-js-tabs-single-open="" data-mg-js-tabs-filterable="" data-mg-js-tabs-filter-placeholder="Search targets, indicators and topics"><ul class="mg-tabs__list "><!-- wp:undrr/undrr-tabs-v2-section {"id":"target-a","label":"Target A: Mortality"} -->
<li class="mg-tabs__item"><a class="mg-tabs__link" href="#mg-tabs__section-target-a" data-mg-js-tabs-default="false" role="tab">Target A: Mortality</a></li><li class="mg-tabs-content" data-mg-js-tabs-content="true"><section class="mg-tabs__section" id="mg-tabs__section-target-a"><h2>Target A: Mortality</h2><!-- wp:paragraph -->
<p>Section content.</p>
<!-- /wp:paragraph --></section></li>
<!-- /wp:undrr/undrr-tabs-v2-section --></ul></div>
<!-- /wp:undrr/undrr-tabs-v2-block -->
```

The filter matches section labels, so write labels with the words a reader would search for.

### Table of contents

`undrr/undrr-table-of-contents-block` renders the [Table of contents](https://mangrove.undrr.org/?path=/docs/components-navigation-table-of-contents--docs) from the page's `<h2>` headings. Attributes: `title` (default "On this page") and `showTitle`. It is not self-closing: it needs its `<section>`, and the saved markup always includes `data-mg-table-of-contents-skip-auto-init="true"`, which stops the Mangrove script initializing it twice.

```html
<!-- wp:undrr/undrr-table-of-contents-block -->
<section class="wp-block-undrr-undrr-table-of-contents-block mg-table-of-contents" data-mg-table-of-contents="true" data-mg-table-of-contents-title="On this page" data-mg-table-of-contents-show-title="true" data-mg-table-of-contents-skip-auto-init="true"></section>
<!-- /wp:undrr/undrr-table-of-contents-block -->
```

To leave a heading out of the list, add the `mg-table-of-contents--exclude` class to it through its utility classes or `className`:

```html
<!-- wp:heading {"className":"mg-table-of-contents--exclude"} -->
<h2 class="wp-block-heading mg-table-of-contents--exclude">Introduction</h2>
<!-- /wp:heading -->
```

### On this page navigation

`undrr/undrr-on-this-page-nav-block` renders the [On this page nav](https://mangrove.undrr.org/?path=/docs/components-navigation-on-this-page-nav--docs), a sticky bar built from the page headings when the page loads.

| Attribute | Default | Notes |
| --- | --- | --- |
| `depth` | `"2"` | `"2"` for H2 only, `"3"` adds H3, `"4"` adds H4 |
| `contentSelector` | `".landing-page-body"` | Container scanned for headings |
| `label` | `"On this page"` | Text before the links |
| `showCta`, `ctaText`, `ctaUrl` | `false`, empty, empty | Optional call-to-action link at the end of the bar |

```html
<!-- wp:undrr/undrr-on-this-page-nav-block {"showCta":true,"ctaText":"Download the concept note","ctaUrl":"/media/118609"} -->
<nav class="wp-block-undrr-undrr-on-this-page-nav-block mg-on-this-page-nav" data-mg-on-this-page-nav="true" data-mg-on-this-page-nav-depth="2" data-mg-on-this-page-nav-content=".landing-page-body" data-mg-on-this-page-nav-label="On this page"><a href="/media/118609" class="mg-on-this-page-nav__cta">Download the concept note</a></nav>
<!-- /wp:undrr/undrr-on-this-page-nav-block -->
```

Without the call to action, the `<nav>` is empty.

Some older pages build this bar by hand in a `wp:html` block marked with a `prototype: mga-nav-on-this-page` comment (tracked in [undrr/web-backlog#337](https://gitlab.com/undrr/web-backlog/-/issues/337)). Use the block for new pages.

### Show more button

`undrr/undrr-show-more-button` renders a [Show more](https://mangrove.undrr.org/?path=/docs/components-showmore--docs) toggle that collapses another block. Attributes: `targetSelector` (a class selector on the block to collapse), `labelCollapsed`, `labelOpen`, `collapsedHeight` (pixels) and `buttonStyle` (`primary` or `secondary`). `collapsedHeight` defaults to 200; any other value saves a `<style>` element that sets `--mg-show-more-height` on the target.

```html
<!-- wp:undrr/undrr-show-more-button {"targetSelector":".show-more-target-k7q2xa","collapsedHeight":300} -->
<div class="wp-block-undrr-undrr-show-more-button"><style>.show-more-target-k7q2xa{--mg-show-more-height:300px}</style><a href="#" class="mg-button mg-button-primary mg-show-more--button" data-mg-show-more="true" data-mg-show-more-target=".show-more-target-k7q2xa" data-mg-show-more-label-collapsed="Show more" data-mg-show-more-label-open="Show less">Show more</a></div>
<!-- /wp:undrr/undrr-show-more-button -->
```

[Building landing pages](LANDING-PAGE-GUIDE.md#show-more) has the full layout with the target block.

### Scroll container

`undrr/undrr-scroll-container` renders a [Scroll container](https://mangrove.undrr.org/?path=/docs/components-scrollcontainer--docs) around its inner blocks. Each direct child becomes one scroll item.

| Attribute | Default | Effect |
| --- | --- | --- |
| `itemWidth` | `auto` | Width of each item. Set a value such as `"300px"`, or items shrink to their content |
| `stepSize` | `300` | Pixels scrolled per arrow click. Set it a little larger than `itemWidth` so a click advances one item and the gap |
| `showArrows` | `true` | Previous and next buttons |
| `height`, `minWidth`, `padding` | `auto`, `auto`, `0` | Row height, minimum item width, inner padding |
| `ariaLabel` | Empty | Accessible name for the row, such as "Publications" or "Partners"; saved as `data-aria-label` only when set |

The six layout attributes are saved as `data-*` attributes whether or not they differ from the default. Name every scroll container, so screen reader users can tell one collection from another.

```html
<!-- wp:undrr/undrr-scroll-container {"itemWidth":"300px","stepSize":320} -->
<div class="wp-block-undrr-undrr-scroll-container mg-scroll" data-mg-scroll-container="" data-height="auto" data-min-width="auto" data-item-width="300px" data-padding="0" data-show-arrows="true" data-step-size="320"><div class="mg-scroll__content">

  [inner blocks]

</div></div>
<!-- /wp:undrr/undrr-scroll-container -->
```

### Highlight box

`undrr/highlight-box` renders a [Highlight box](https://mangrove.undrr.org/?path=/docs/components-highlightbox--docs) around its inner blocks. `tone` is `default`, `primary` or `secondary`; `layout` is `full` (default), `centered`, `float-start` or `float-end`. Non-default values add `mg-highlight-box--{value}`.

```html
<!-- wp:undrr/highlight-box {"tone":"secondary","layout":"centered"} -->
<div class="wp-block-undrr-highlight-box mg-highlight-box mg-highlight-box--secondary mg-highlight-box--centered"><!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Did you know?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Between 2000 and 2019, disasters affected 4 billion people worldwide.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:undrr/highlight-box -->
```

### Quote highlight

`undrr/undrr-quote-highlight-block` renders a [Quote highlight](https://mangrove.undrr.org/?path=/docs/components-quotehighlight--docs). Attributes: `attribution`, `attributionTitle`, `imageSrc`, `imageAlt`, `backgroundColor` (`light` or `dark`), `variant` (`line` or `image`) and `alignment`. The quote itself is inner paragraph blocks.

```html
<!-- wp:undrr/undrr-quote-highlight-block {"attribution":"Name Surname","attributionTitle":"Title and organization"} -->
<div class="wp-block-undrr-undrr-quote-highlight-block mg-quote-highlight mg-quote-highlight--light mg-quote-highlight--line mg-quote-highlight--full "><div class="mg-quote-highlight__content"><blockquote class="mg-quote-highlight__quote"><div class="mg-quote-highlight__quote-text"><!-- wp:paragraph -->
<p>Disaster risk reduction is everyone's business. It requires the engagement of all sectors and all people.</p>
<!-- /wp:paragraph --></div></blockquote><div class="mg-quote-highlight__separator"></div><div class="mg-quote-highlight__attribution"><div class="mg-quote-highlight__attribution-wrapper"><div class="mg-quote-highlight__attribution-text"><p class="mg-quote-highlight__attribution-name">Name Surname</p><p class="mg-quote-highlight__attribution-title">Title and organization</p></div></div></div></div></div>
<!-- /wp:undrr/undrr-quote-highlight-block -->
```

For a pull quote with no attribution, a lighter pattern is in [Building landing pages](LANDING-PAGE-GUIDE.md#quotes).

### Social share

`undrr/undrr-social-share-block` has no attributes and renders [Share buttons](https://mangrove.undrr.org/?path=/docs/components-buttons-sharebuttons--docs).

```html
<!-- wp:undrr/undrr-social-share-block -->
<div class="wp-block-undrr-undrr-social-share-block mg-share"><section data-mg-share-buttons="true"></section></div>
<!-- /wp:undrr/undrr-social-share-block -->
```

### Search widget

`undrr/search-widget` renders the [Syndicated search](https://mangrove.undrr.org/?path=/docs/components-syndicated-search--docs) widget. The block writes around 20 `data-*` attributes on a container with `data-undrr-search-widget="true"`, and a wrapper script in the Drupal theme reads them and mounts the Mangrove component. Mangrove's own hydration does not read that attribute; it is specific to the platform wrapper. Widgets saved before [undrr/web-backlog#2822](https://gitlab.com/undrr/web-backlog/-/work_items/2822) keep **Override with current website domain** and **Override with current page language** off through the block's deprecation; new widgets have both on. Configure it in the block sidebar rather than by hand; [Search widget editor configuration](SEARCH-WIDGET-EDITOR-GUIDE.md) documents every setting and the filter syntax.

### Core blocks used alongside the UNDRR blocks

**Video.** Use `wp:embed` with the ordinary watch URL; the Gutenberg text format swaps it for the player at render time. Put the caption in a paragraph after the embed, not in a `<figcaption>`.

```html
<!-- wp:embed {"url":"https://www.youtube.com/watch?v=VIDEO_ID","type":"rich","providerNameSlug":"youtube","responsive":true,"className":"wp-embed-aspect-16-9 wp-has-aspect-ratio"} -->
<figure class="wp-block-embed is-type-rich is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio"><div class="wp-block-embed__wrapper">
https://www.youtube.com/watch?v=VIDEO_ID
</div></figure>
<!-- /wp:embed -->

<!-- wp:paragraph {"fontSize":"small"} -->
<p class="has-small-font-size mg-u-font-size-250">Caption. Video: UNDRR</p>
<!-- /wp:paragraph -->
```

**Drupal media.** `drupalmedia/drupal-media-entity` embeds a media entity (image, video or document) and is self-closing, because the server renders it. `viewMode` is a Drupal image style: `ultrawide_16_6`, `landscape_16_9`, `portrait_3_4`, `thumbnail` or `full`. A video media entity is worth it when the same video appears on several pages; for a one-off, `wp:embed` needs no media entity.

```html
<!-- wp:drupalmedia/drupal-media-entity {"mediaEntityIds":["84501"],"viewMode":"ultrawide_16_6"} /-->
```

**Page-level CSS.** A `wp:html` block with a `<style>` element holds CSS that no block attribute can express. Keep it at the end of the page body and keep it small; each rule is a page-level patch that someone has to find later.

## Related documentation

- [Building landing pages](LANDING-PAGE-GUIDE.md): page structure, layout patterns and component choice
- [Search widget editor configuration](SEARCH-WIDGET-EDITOR-GUIDE.md): search widget settings and filter syntax
- [Landing page patterns](https://mangrove.undrr.org/?path=/docs/patterns-landing-pages--docs): topic, report and collection index examples
- [Hydration guide](HYDRATION.md): how Mangrove turns saved markup into interactive components
- [Editorial manual](EDITORIAL-MANUAL.md): capitalization, punctuation, numbers, spelling and UNDRR terminology
