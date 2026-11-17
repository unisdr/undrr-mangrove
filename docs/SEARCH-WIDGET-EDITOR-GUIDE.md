# Search widget editor configuration

> Edits to this file show up on both [GitHub](https://github.com/PreventionWeb/undrr-mangrove/blob/main/docs/SEARCH-WIDGET-EDITOR-GUIDE.md) and in [Storybook](https://mangrove.undrr.org/?path=/docs/components-syndicated-search-editor-configuration--docs).

> **About this guidance:** this page brings together guidance maintained elsewhere and is provided for reference and ease of access. It is not the authoritative source. Where it differs from a source, or doesn't cover a point, follow the source: the [syndication search widget](https://mangrove.undrr.org/?path=/docs/components-syndicated-search--docs) component and its code (for search behaviour), the search configuration of the UNDRR platform as deployed (for fields, scoring and settings) and the production taxonomy (for term IDs and names).

How to configure the **Search and listings** block (`undrr/search-widget`) on UNDRR websites: what each sidebar setting does, what readers can type in the search box and the `field:value` filters that scope a widget to a content type, theme, country, website or date range. The block renders the [Syndicated search](https://mangrove.undrr.org/?path=/docs/components-syndicated-search--docs) component; that page documents the component's props and behaviour for developers.

The search widget turns up on landing pages, country pages, topic hubs and conference microsites. On most of them an editor sets hidden filters that sandbox the results. The sidebar handles the common cases; this guide covers the rest.

> **Integration note:** Backend notes (relevance scoring and synonyms, the configuration modifier pattern other Drupal modules use to inject filters, library load order and the source file inventory) are maintained with the `undrr_gutenberg_blocks` Drupal module in the UNDRR platform codebase, because they change with the backend rather than with the component.

An AI tool can read this guide as plain text at <https://mangrove.undrr.org/llms-search-widget.txt>.

## Quick reference

**Hidden search terms** (under **Expert narrowing**) adds terms to every search, and every result must match them. It narrows results; it does not merely rank matching content higher:

- `sendai framework` limits every search to content that also mentions the Sendai Framework
- `"early warning systems"` limits every search to content containing the exact phrase

The hidden terms join the reader's own words in a single search whose default operator is AND. A search for `flood` with `sendai framework` hidden returns only items that match all three words, a small fraction of the plain `flood` results. For a hard scope, **Content types** under **Narrow results** or **Custom query filters** are clearer and more predictable.

**Custom query filters** (under **Expert narrowing**) are a JSON array of hard filters applied to every query:

| Filter | Shows |
| --- | --- |
| `["type:publication"]` | Only publications |
| `["type:news"]` | Only news |
| `["type:news", "field_theme:311"]` | News about climate change |
| `["type:publication", "published_at:[2020-01-01 TO 2024-12-31]"]` | Publications from 2020–2024 |
| `["field_domain_access:www_preventionweb_net"]` | Only PreventionWeb content |
| `["field_country_region:172"]` | Only content tagged Japan |
| `["field_hazard:345"]` | Only earthquake content |
| `["field_collections:65548"]` | Only content in the "Artificial intelligence (AI) for disaster risk reduction" collection |
| `["(type:news OR type:event)"]` | News or events |
| `["(field_theme:311 OR (type:publication AND DRR))"]` | Climate change content, or publications that mention DRR |
| `["(field_news_type:755 OR type:publication)"]` | Research briefs, or any publication |
| `["type:publication", "field_theme:(311 OR 317)"]` | Publications about climate change or financing DRR |
| `["has_image:true"]` | Only results with an image, useful in card displays |

Separate entries combine with AND: `["type:news", "field_theme:311"]` means news **and** climate change. For OR, use parentheses inside a single entry. Field filters and free-text terms such as `DRR` can be mixed in one expression.

> **Website filters and automatic website detection:** **Website** under **Narrow results** is set to **This page's website (automatic)** by default and filters every widget to the website it is published on. A `field_domain_access` entry in **Custom query filters** applies as well, not instead, so on any other website the two website filters combine with AND and the widget returns almost nothing. Whenever **Custom query filters** fix the website, set **Website** to that website instead of automatic.

> **Straight quotes only:** type **Custom query filters** with straight double quotes (`"`). Curly quotes (`“` and `”`), which Word and many email and chat tools put in automatically, make the JSON invalid: the field shows "Preview not updated: invalid JSON." and the widget keeps its previous filters. Type the filters in the sidebar, or paste them from a plain-text editor. The same goes for quoted values in custom filter dropdown queries and **Hidden search terms**, where curly quotes do not mark a phrase, so the words are searched separately.

**Search modifiers** use Elasticsearch `query_string` syntax and work in both **Hidden search terms** and **Custom query filters**. The widget processes hidden terms separately from the reader's search and combines the two as `(reader search) AND (hidden terms)`, so an OR typed by a reader cannot loosen the requirement, and special characters in the hidden terms do not change how the reader's words are searched:

| Modifier | Syntax | Example |
| --- | --- | --- |
| Exact phrase | `"..."` | `"disaster risk reduction"` |
| Proximity | `"..."~N` | `"sendai framework"~3` matches the two words within three words of each other |
| Wildcard | `*` or `?` | `disast*` matches disaster and disasters; `te?t` matches test and text |
| Boosting | `^N` | `climate^3 resilience` weights "climate" three times higher |
| Required term | `+term` | `+earthquake tsunami`: earthquake must appear |
| Excluded term | `-term` | `earthquake -tsunami` excludes tsunami |
| Range, inclusive | `[A TO B]` | `published_at:[2020-01-01 TO 2024-12-31]` |
| Range, exclusive | `{A TO B}` | `published_at:{2020-01-01 TO 2024-12-31}` |
| Open-ended range | `[A TO *]` | `published_at:[2023-01-01 TO *]`, from 2023 onward |
| Grouping | `(...)` | `(earthquake OR tsunami) AND preparedness` |
| Field-scoped | `field:value` | `type:news`, `field_theme:(311 OR 317)` |
| Fuzzy | `~N` | `tsunmi~1` matches "tsunami" with one typo |

The widget already adds `~1` fuzziness to plain reader searches, so fuzzy syntax is mainly useful in editor-configured filters. Field names and term IDs are in [Field and value filters](#field-and-value-filters).

## Practical examples

### Show only publications

Under **Narrow results**, set **Content types** to **Only these** and tick **Publication**. The equivalent **Custom query filters** entry is `["type:publication"]`; use it when the scope needs a subtype or an OR that **Content types** can't express.

### Publications from 2020–2024

**Custom query filters**: `["type:publication", "published_at:[2020-01-01 TO 2024-12-31]"]`

### Lock results to one website

Under **Narrow results**, set **Website** to the website, for example PreventionWeb. Then, under **Search and filters**, untick **Website** in **Filters offered**. The widget is filtered to that website and the dropdown is hidden.

### One widget that follows the site it is published on

Leave **Website** on **This page's website (automatic)** (the default). When the same landing page is published on several websites, the widget reads the current website when the page loads and filters to it, so no per-site configuration is needed. Hide the **Website** dropdown if readers should not change it. **Fallback website** applies if the site cannot be detected.

**Language** works the same way for translated pages, so a translation shows results in its own language.

### Pre-filter by theme, hidden from readers

**Custom query filters**: `["field_theme:311"]` (Climate change). Then untick **Theme** in **Filters offered**.

### Content from a collection, narrowed by hazard

**Custom query filters**: `["field_collections:65548", "field_hazard:357"]`

This limits results to content in the "Artificial intelligence (AI) for disaster risk reduction" collection (node 65548) that is tagged Wildfire and Bushfire (term 357). `field_collections` holds collection **node** IDs, not taxonomy term IDs. To let readers choose between several collections, add a custom filter dropdown whose options are `field_collections:<node ID>` queries.

### Require terms in every search

Set **Hidden search terms** to `sendai framework`. Every search a reader makes must then also match those words, so the widget only ever returns content that mentions the Sendai Framework. Use it sparingly: readers cannot see or remove the hidden terms, and a search that returns nothing gives them no clue why.

### Custom filter dropdown for UNDRR document types

Under **Search and filters**, choose **+ Add custom filter dropdown**, title it "Document type", give it order 10 and allow multiple selections:

| Label | Query |
| --- | --- |
| Reports | `field_undrr_publication_types:746` |
| Policy briefs | `field_undrr_publication_types:1027` |
| Fact sheets | `field_undrr_publication_types:744` |
| Working papers | `field_undrr_publication_types:748` |

### PreventionWeb publications by type

Goal: only PreventionWeb publications, with a dropdown readers can use to narrow by publication category.

Set **Content types** to **Only these** with **Publication** ticked, and set **Website** to PreventionWeb, both under **Narrow results**. Untick **Website** in **Filters offered**, since the website is fixed.

Add a custom filter dropdown titled "Publication type":

| Label | Query |
| --- | --- |
| Documents and publications | `field_publication_type:"Documents and publications"` |
| Policies and plans | `field_publication_type:"Policies and plans"` |
| Educational materials | `field_publication_type:"Educational materials"` |
| Statements | `field_publication_type:Statements` |
| UN resolutions and reports | `field_publication_type:"UN resolutions and reports"` |

Values with spaces must be quoted.

### Latest research: combining subtypes across content types

Goal: research briefs and publications together as one research feed, as on [PreventionWeb's latest research page](https://www.preventionweb.net/knowledge-base/type-content/latest-research).

**Custom query filters**: `["(field_news_type:755 OR type:publication)"]`

- `field_news_type:755` matches news items with the subtype "Research briefs".
- `type:publication` matches all publications.
- `OR` means either condition qualifies a result.

In the sidebar, set **Website** to PreventionWeb so the setting holds on every website, hide the **Website** dropdown and order by **Newest first**. Under **Limit Type filter options**, tick only News and Publication so the **Type** dropdown stays short.

Two separate entries, `["field_news_type:755", "type:publication"]`, would return nothing: entries combine with AND, and no item is both a news item and a publication. The OR has to sit inside one entry.

To filter publications by the type of organization that produced them, use `org_type_ref`, which carries the organization type onto the publication. `field_organization_type` exists only on organization records and matches nothing on publications:

```json
["(field_news_type:755 OR (type:publication AND org_type_ref:academicscientific))"]
```

### Curated feed: a "latest content" panel

Without any search interface, the widget becomes a self-updating list, the right tool for a "Latest news" or "Related resources" panel on a landing page. Unlike hand-placed cards, it never goes stale.

Start from **Latest content**, or turn off **Let visitors search and filter** under **Search and filters**. Either way the widget hides the search box, filters, results count, search time and filter chips, and sets **Keep search in the URL** to **Never**. On a page where the widget is a supporting panel, writing its state into the page URL would break sharing and the back button. Then set **Items per page** to 3–6, turn off **Pagination** if the panel should not page, and scope the panel.

Scope the panel with **Content types** or **Custom query filters** rather than **Keyword**. A keyword is a full-text search that stray words can dilute; a filter always applies. Prefer a taxonomy term to a phrase, because term IDs are exact and phrases match unpredictably. The syndication vocabulary exists for exactly this job:

```json
["field_syndication:1018"]
```

Check that content is actually tagged before building the panel: a filter that matches nothing renders an empty widget with no error. The block preview in the editor runs the same query, but it always uses the fallback website and language, so it matches the published panel only when **Website** and **Language** are fixed, or when the fallbacks are the ones the page is published with.

### Card grid with no empty image slots

Under **Appearance**, set **Display** to **Cards**, then add **Only with images** under **Narrow results**. The hidden `has_image:true` filter means every result has an image, so the grid has no blank slots.

### Filters above the results

Under **Search and filters**, set **Filters** to **Above**. The filters render as one row between the search box and the results, which frees the side of the page for other content.

### Search box in the hero, filters in a side column

The search box and the filters can render in other parts of the page while the results stay where the widget block is.

1. Insert the **Search and listings** block where the results should appear.
2. Under **Search and filters**, set **Search box** to **Container** and choose **+ Add a Search Bar Container above**. Do the same for **Filters** with **+ Add a Facets Container above**.
3. Move the **UNDRR Search Bar Container** and **UNDRR Search Facets Container** blocks where they should appear, for example into the hero and a side column.

After adding or moving containers by hand, choose **Auto-link container blocks on this page** in the widget's **Advanced** panel. With more than one widget on a page, link them by hand: each container shows its selector, which goes in the widget's **Search box target selector** and **Filters target selector** settings.

If a container is missing when the page loads, the widget shows the search box or filters in its own area instead.

To put a search box on one page and the results on another, use a plain HTML form that submits to the results page with a `#query=` fragment instead.

### One search and filters for several result lists

_(UNDRR 6.3)_ To have one search box and one set of filters drive several result lists, for example news, events and publications side by side, turn on **Control all connected results** on an **UNDRR Search Facets Container**. Choose the filters offered there, then connect each **Search and listings** block in the container's list. A Search Bar Container connected to the same widgets shares the search term too.

Connected widgets keep their own content restrictions, ordering and layout; the shared filters combine options from all of them and show no counts. A connected widget's **Keyword** is managed by the container, and **Edit shared filters** in the widget opens the container. Containers without this setting stay independent.

On UNDRR 6.2, the containers instead have **Share with all search widgets on this page**, for tabs that mount one widget at a time. Nothing arbitrates between widgets that are on screen together, so don't point two mounted widgets at the same container.

### Restrict the Type dropdown

Under **Search and filters**, open **Limit Type filter options** and untick the types to hide. For example, to offer only News, Events and Publications, untick all the others. This changes only the visitor's choices; **Content types** under **Narrow results** changes which results appear.

### Offer a metadata download

_(UNDRR 6.3)_ Researchers can download the widget's results as a spreadsheet or for software, for example "the 100 newest publications on drought". Under **Downloads**, turn on **Download results**. A **Download results** button appears below the results; it downloads metadata for the widget's matching content as CSV or JSON, using the visitor's current search, filters and sort order.

Leave the overrides off unless the widget needs something different from the shared defaults:

- **Override initial download quantity**, for example 10 for a "top 10" list. Visitors can still choose another quantity.
- **Override contact URL** to send requests for larger exports or API access to a team other than PreventionWeb's.
- **Override available download fields** to leave out fields that don't suit the list, for example **Summary**.

Downloads contain metadata and links, not publication files. Each file holds up to 1,000 records. For more, visitors download several ranges or use the contact link.

## Block settings reference

This reference follows the sidebar as of UNDRR 6.3. Items marked _(UNDRR 6.3)_ are not on websites still running UNDRR 6.2.

A new widget starts with a **What are you building?** picker, also offered as variations in the block inserter. Each starting point only pre-fills settings, so everything can be changed afterwards:

| Starting point | Sets up |
| --- | --- |
| Search page | Search box, filters in a sidebar, a list of 10 results per page, sorted by relevance |
| Latest content | Three image cards of the newest items, with no search box, filters or pagination |
| Upcoming events | Events that have not ended, soonest first, with no search box or filters |
| Publication library | Publications as book-cover cards, 12 per page, with search and filters |

At the top of the sidebar, a summary describes what the widget lists in plain words, for example "All content types, matching "flood", from this page's website, in this page's language, sorted by newest first, 10 per page". Check it after changing settings. The block toolbar switches between list, card and book-cover display, and its **Display settings** button sets items per page, columns and pagination.

### Narrow results

What the widget lists. **Content types** (and, when events can appear, **Events to show**) always show; add the other settings from the panel's ⋮ menu. A setting with a value shows automatically, and **Reset all** in the same menu clears the panel.

| Setting | Attribute | Default | Description |
| --- | --- | --- | --- |
| Content types | `resultTypes`, `excludedTypes` | All | **All**, **Only these** (list only the ticked types) or **All except** (leave out the ticked types; everything else stays, including taxonomy pages and types not listed) |
| Events to show | `eventStatus` | All | **All**, **Upcoming** or **Past**, judged by each event's end date. Shown when events can appear |
| Event dates | `eventDateFrom`, `eventDateTo` | Empty | Only events that overlap the period |
| Keyword | `defaultQuery` | Empty | On a search page, pre-fills the search box and visitors can change it. On a listing, only results matching these words appear. Read-only when a Facets Container controls the widget |
| Only with images | `requireImage` | Off | Adds a hidden `has_image:true` filter, so card grids have no empty image slots |
| Website | `useCurrentDomain`, `defaultDomain` | This page's website (automatic) | Choose a website to fix the results to it. On automatic, **Fallback website** applies if the page's website cannot be detected, and in the editor preview |
| Language | `useCurrentLanguage`, `defaultLanguage` | This page's language (automatic) | The same, for language, with **Fallback language** |

Automatic website and language detection happens once, when the page loads. The editor preview always uses the fallback values, because the editor is not the published page. Widgets saved before automatic detection became the default ([undrr/web-backlog#2822](https://gitlab.com/undrr/web-backlog/-/work_items/2822)) keep a fixed website and language until an editor changes them.

### Expert narrowing

Hand-written query settings, also added from the panel's ⋮ menu. The summary names them when they are set, because readers cannot see or remove them.

| Setting | Attribute | Description |
| --- | --- | --- |
| Hidden search terms | `queryAppend` | Terms added to every search; every result must match them. See [Quick reference](#quick-reference) |
| Custom query filters | `customFilters` | A JSON array of `query_string` filters applied to every search. A bare expression such as `type:news` is wrapped into a one-item array automatically |
| Ranking tiers | `interestingnessTiers`, `longevityTiers` | Untick a tier to leave out items an editor ranked in it. With every tier ticked there is no filter |

A website fixed in **Custom query filters** needs **Website** set to that website rather than automatic, and the JSON needs straight quotes; see the two warnings under [Quick reference](#quick-reference).

Ranking tiers use the interestingness and longevity an editor set on each item:

| Interestingness tier | Range |
| --- | --- |
| Demoted | 0–10 |
| Deferred | 11–30 |
| Average | 31–50 |
| Promoted | 51–75 |
| Announced | 76–100 |

| Longevity tier | Range | Meaning |
| --- | --- | --- |
| Today | 0–3 | Breaking news |
| Days | 4–20 | Relevant for about a week |
| Week | 21–40 | Relevant for about two weeks |
| Month | 41–65 | Relevant for about three months |
| Year | 66–85 | Relevant for about a year |
| Long time | 86–95 | Relevant for years |
| Always | 96–100 | Permanently relevant |

Items with no value set are ranked as if their longevity were 80, but a tier filter does not include them: leaving only **Year** ticked matches only items whose stored value is 66–85.

### Order and pagination

| Setting | Attribute | Default | Description |
| --- | --- | --- | --- |
| Order by | `defaultSort` | Newest first | **Newest first**, **Oldest first** or **Relevance**; when events can appear, also **Event date (earliest first)** and **Event date (latest first)** |
| Let visitors change sorting _(UNDRR 6.3)_ | `showSort` | On | Off hides the sort control; results keep the order chosen above |
| Items per page | `resultsPerPage` | 10 | 1–100 |
| Pagination | `showPager` | On | Lets visitors page through more results |

**Newest first** and **Oldest first** use the CMS publication timestamp, so an older report added recently can appear first.

### Search and filters

**Let visitors search and filter** switches between a search page (on) and an editor-curated listing (off). Turning it off hides the search box, filters, results count, search time and filter chips, and stops the widget writing its state into the page URL. If a listing still shows a search box or filters, the panel offers to hide them or to make the widget a search page.

On a search page:

| Setting | Attribute | Description |
| --- | --- | --- |
| Search box | `showSearchBox`, `searchTarget` | **In widget**, **Container** (in a Search Bar Container block elsewhere on the page) or **Hidden** |
| Filters | `facetsLayout`, `facetsTarget` | **Sidebar**, **Above** (a strip between the search box and the results), **Container** (in a Search Facets Container block) or **Hidden** |
| Filters offered | `showWebsiteFilter`, `showTypeFilter`, `showNewsTypeFilter`, `showYearFilter`, `showCountryFilter`, `showHazardFilter`, `showThemeFilter`, `showLanguageFilter`, `showEventStatusFilter` | Which filter dropdowns visitors see: Website, Type, News type, Year, Country, Hazard, Theme, Language and, for events, Upcoming / past |
| Limit Type filter options | `allowedTypes` | Only changes the choices in the visitor's **Type** dropdown: content types, news subtypes, PreventionWeb publication subtypes and taxonomy pages. To change which results appear, use **Content types** under **Narrow results** |
| Custom filter dropdowns | `customFacets` | Up to three dropdowns whose options each run a predefined query. Each has a title, an order (lower numbers come first), a multiple-selection toggle and a list of options, each a label and a `query_string` expression. Multiple selections combine with OR |
| Also show | `showResultsCount`, `showSearchTimer`, `showActiveFilters` | Results count, search time and active filter chips |

Choosing **Container** for the search box or filters offers to add the container block above the widget and links the two. See [Search box in the hero, filters in a side column](#search-box-in-the-hero-filters-in-a-side-column).

A fixed filter is a narrowing setting plus a hidden dropdown: fix **Website** under **Narrow results** and untick **Website** under **Filters offered**, for example.

Once Drupal's reader-facing date mode is activated, **Year** follows the editorial date shown with each result. A report with publication year 2020 is found under 2020 even if added in 2026; undated records do not match a selected year.

### Appearance

| Setting | Attribute | Default | Description |
| --- | --- | --- | --- |
| Display | `displayMode` | List | **List**, **Cards** (image card grid) or **Book covers** (book card grid) |
| Columns | `gridColumns` | Matches items per page | 2–6 columns, card displays only; fewer on small screens |
| Fields shown on each result | `visibleTeaserFields` | All | Image, content type, publication type, date, site name, summary and organization |

### Downloads

_(UNDRR 6.3)_ **Download results** adds a **Download results** button below the results. It opens a dialog in which visitors download the matching content's metadata as CSV, for spreadsheets, or JSON, for software. The download uses the widget's settings and the visitor's current search terms, filters and sort order. See [Offer a metadata download](#offer-a-metadata-download).

| Setting | Attribute | Default | Description |
| --- | --- | --- | --- |
| Download results | `showExport` | Off | Shows the download button |
| Override initial download quantity | `exportDefaultCount` | Off (100) | How many results the dialog starts with, 1–1,000. Visitors can choose another quantity |
| Override contact URL | `exportContactUrl` | Off (PreventionWeb contact page) | Where the dialog's **Contact us** link for larger requests or API access goes. A blank URL uses the shared route |
| Override available download fields | `exportFields` | Off (all fields) | Which optional fields visitors can include |

Each override has its own toggle. While a toggle is off, the widget uses the shared default, so a later change to that default reaches the widget too. Turning a toggle off clears its value.

Visitors choose which fields to include. Record ID and URL are always included. The optional fields are title, summary, content type, language, website posting date, date shown in results, countries or regions, hazards and themes; summary starts unticked. A field override removes fields from the visitor's choices and from the file. The dates shown in results stay paired with their precision, and countries, hazards and themes give both term IDs and names.

One file holds at most 1,000 records, taken from the first 10,000 matches. With 1,000 or more matches, visitors can choose where to start, so they can download a large set in several files. Downloads are generated in the visitor's browser from the same search service; they include only content the widget can show. They are not a stable snapshot: content added or re-indexed between two downloads can shift results between files.

### Advanced

Technical options are in Gutenberg's own **Advanced** panel, below the block's other settings. Most widgets don't need them.

| Setting | Attribute | Default | Description |
| --- | --- | --- | --- |
| Search box target selector | `searchTarget` | Empty | Set by the **Search box** setting. Edit only to point at hand-coded markup |
| Filters target selector | `facetsTarget` | Empty | Set by the **Filters** setting, likewise |
| Max options per filter | `facetCountToShow` | 500 | Options per filter dropdown, 100–1000 |
| Typing delay (ms) | `debounceDelay` | 750 | Wait after typing before a search runs, 100–2000 |
| Keep search in the URL | `enableHashSync` | Auto (off if several widgets) | **Auto**, **Always** or **Never**. Lets visitors bookmark and share a search |
| Show search quality metrics | `showSearchMetrics` | Off | Scoring debug information on results |
| Search endpoint URL | `searchEndpoint` | `/search-endpoint` | Do not change without a reason |
| Widget container ID | `widgetId` | Generated | Read-only |

**Auto-link container blocks on this page**, under the selectors, links the widget to the page's Search Bar and Search Facets Container blocks after they are added or moved.

On a page with more than one widget, **Auto** stops the widgets fighting over the URL. To keep it on for one of them, set **Always** on exactly one widget and **Never** on the rest.

### Shareable filtered links

With **Keep search in the URL** on, the widget writes the search text, the selected filters, the match mode, the sort order and the page into the end of the page address, for example `#query=flood&sort=newest&f.field_hazard=357`. Copying the address shares that exact view, and the browser's back button steps back through filter changes.

- A link with filters in it replaces the block's default filters, including the automatic current-language and current-domain filters. A link without filters uses the defaults as normal.
- To build a link by hand, add `f.<filter key>=<value>` for each value, using the filter keys and term IDs in this guide, for example `#f.field_theme=339&f.field_theme=340`. Unknown filter keys and invalid values are ignored.
- Ordinary page anchors, such as `#main-content` or a table of contents link, are left alone and don't reset the search.
- Custom filter dropdowns are not included in the link. Their selections are stored by position in the option list, so a saved link would pick a different option once the options are edited.

### Saved markup

The block saves its settings as attributes in the block comment, leaving out any that are at their default, and writes them again as `data-*` attributes on an empty container that the platform's wrapper script reads when the page loads. A new widget with the default settings saves:

```html
<!-- wp:undrr/search-widget {"widgetId":"search-widget-sample-default"} -->
<div class="wp-block-undrr-search-widget undrr-search-widget-container" data-undrr-search-widget="true" data-widget-id="search-widget-sample-default" data-search-endpoint="/search-endpoint" data-results-per-page="10" data-facet-count-to-show="500" data-debounce-delay="750" data-default-filters="[{&quot;key&quot;:&quot;_language&quot;,&quot;value&quot;:&quot;en&quot;,&quot;checked&quot;:true}]" data-visible-filters="{&quot;field_domain_access&quot;:true,&quot;type&quot;:true,&quot;field_news_type&quot;:true,&quot;year&quot;:true,&quot;field_country_region&quot;:true,&quot;field_hazard&quot;:true,&quot;field_theme&quot;:true,&quot;_language&quot;:true}" data-enable-hash-sync="auto" data-default-sort="newest" data-default-query="" data-show-search-box="true" data-show-results-count="true" data-show-search-timer="true" data-show-facets="true" data-show-pager="true" data-show-search-metrics="false" data-show-active-filters="true" data-use-current-language="true" data-use-current-domain="true"><div id="search-widget-sample-default" class="undrr-search-widget-target"></div></div>
<!-- /wp:undrr/search-widget -->
```

A widget with downloads turned on also saves `data-show-export="true"`, plus `data-export-default-count`, `data-export-contact-url` or `data-export-fields` for each override that is turned on. A widget with downloads off saves none of them.

The `widgetId` is generated when the block is inserted, so every widget on a page has its own. Configure the widget in the sidebar rather than editing this markup. Every setting is a block comment attribute, so if the editor offers "Attempt block recovery" for this block, recovery rebuilds the container from the comment and loses nothing. To change a setting by hand, edit the block comment and let recovery rewrite the container.

## What readers can type

### Plain text

Each word gets automatic typo tolerance: `climate change` is searched as `climate~1 change~1`. Searches need at least three characters. All words must match; the default operator is AND.

### Exact phrases

Double quotes search for the exact phrase, with no typo tolerance and with short common words kept: `"Draft Articles on the Protection of Persons"`.

### Operators and wildcards

Every word must match; there is no need to type AND.

| To | Type | Example |
| --- | --- | --- |
| Match either of two words | `OR` | `earthquake OR tsunami` |
| Exclude a word | `NOT` or `-term` | `disaster NOT earthquake`, `disaster -earthquake` |
| Exclude a word from everything | `NOT` at the start | `NOT earthquake` |
| Group conditions | `(...)` | `(earthquake OR tsunami) AND preparedness` |
| Match the start of a word | `*` | `disast*` matches disaster, disasters and disastrous |

Operators must be typed in capitals. Lowercase "and" and "or" are common words and are removed before searching, so `flood and drought or storm` is searched as `flood drought storm`, which requires all three words.

Typo tolerance is not added when the search contains any of `: ~ ^ / + - ! ( ) { } [ ] * ? \ & | < > = @`, so `field:value` searches and wildcards pass through unchanged.

### Common words

Outside quotes, these words are removed before searching: the, a, an, and, or, but, in, on, at, to, for, of, with, by, from, as, is, was, are, been, be, have, has, had, do, does, did, will, would, should, could, may, might, must, can, this, that, these, those, it, its. `The Draft Articles on the Protection` is searched as `Draft Articles Protection`.

### Automatic fixes

The widget repairs common mistakes: an unmatched quotation mark is removed, AND or OR at the start of a search and any operator at the end are dropped, an operator left without a word after common words are removed is dropped (`earthquake OR the` becomes `earthquake`), a search that is only an operator becomes empty and a trailing `-` or `+` is removed. `NOT` at the start is kept, because it is a valid exclusion.

## Field and value filters

These are used in **Custom query filters**, **Hidden search terms** and custom filter dropdown queries.

### Content types

Field: `type`

| Value | Name | Notes |
| --- | --- | --- |
| `news` | News | |
| `event` | Event | |
| `conference_event` | Conference event | |
| `landing` | Landing and thematic pages | Includes landing pages built with Gutenberg |
| `vacancy` | Vacancy | |
| `resource` | Resources and training | |
| `collections` | Collection guide | |
| `publication` | Publication | |
| `blog` | DRR Voices | |
| `terminology` | Term | Includes hazard information profiles |
| `organization` | Organization | |
| `national_platform` | National Platform | |
| `conference` | Conference | |
| `commitment` | Commitment | |
| `focal_point` | Focal point | |
| `people` | People | |

Two Drupal content types are renamed in the search index: landing pages (`landing_page_gutenberg`) are indexed as `landing`, and hazard information profiles (`hazard_information_profile`) as `terminology`. Filter on the indexed names; `type:landing_page_gutenberg` matches nothing.

```
type:publication
type:news OR type:blog
type:(news OR event OR publication)
```

### Content subtypes

Subtypes appear indented under their type in the **Type** dropdown. Each has its own field.

**News**: `field_news_type`

| Term ID | Name |
| --- | --- |
| `751` | Update |
| `752` | Press release |
| `1` | Statements and messages |
| `754` | Feature |
| `755` | Research briefs |
| `797` | Opportunities |
| `756` | Op Ed |

**Blog**: `field_blog_type`

| Term ID | Name |
| --- | --- |
| `822` | Blog |
| `880` | Interview |

Publication subtypes use a different field on each website. An item has at most one of them, so do not combine them with AND; use each with its own website filter.

**UNDRR publications**: `field_undrr_publication_types`, paired with `field_domain_access:www_undrr_org`

| Term ID | Name |
| --- | --- |
| `744` | Fact sheet |
| `749` | Newsletter |
| `750` | Other |
| `1027` | Policy brief |
| `746` | Reports |
| `743` | Tool kit |
| `745` | UNDRR Document |
| `747` | Words into Action |
| `748` | Working paper |

**PreventionWeb publications**: `field_publication_type`, a text field, paired with `field_domain_access:www_preventionweb_net`. Quote values that contain spaces.

| Value |
| --- |
| `Documents and publications` |
| `Policies and plans` |
| `Educational materials` |
| `Statements` |
| `UN resolutions and reports` |

**International Recovery Platform publications**: `field_irp_publication_subtype`

| Term ID | Name |
| --- | --- |
| `893` | Case Study |
| `894` | CRNA: COVID-19 Recovery Needs Assessments |
| `895` | CRNA Guidance |
| `896` | Disaster Recovery Guidance |
| `898` | DRF: Disaster Recovery Frameworks |
| `897` | DRF Guidance |
| `899` | Events documents |
| `900` | IRP Herald |
| `972` | IRP Herald in Japanese |
| `934` | Meetings and conferences |
| `935` | News |
| `936` | Organizations |
| `902` | PDNA: Post Disaster Needs Assessments |
| `901` | PDNA Guidance |
| `903` | Publications |
| `904` | Reports and analysis |
| `905` | Tools and guidelines |
| `937` | Training |

**Resources**: `field_resource_type`

| Term ID | Name |
| --- | --- |
| `61` | Academic programme |
| `1181` | Case study |
| `62` | Training course |

**Collections**: `field_collection_type` (a collection has at most one type)

| Term ID | Name |
| --- | --- |
| `823` | Topic guide |
| `847` | Disaster learnings |
| `852` | Words into Action resource |
| `858` | Community collection |

Example: `["type:collections", "field_collection_type:847"]` shows only "Disaster learnings" collections.

**Organizations**: `field_organization_type`, a text field that exists only on organization records. To filter other content by the type of organization it references, use `org_type_ref` with the same values.

| Value | Name |
| --- | --- |
| `academicscientific` | Academic & scientific |
| `governments` | Governments |
| `nongovernmentalorganizations` | Non-governmental organizations |
| `newsandmedia` | News & media |
| `privatesector` | Private sector |
| `networksandothers` | Networks & others |
| `arise_member` | ARISE member |
| `uninternationalorganizations` | UN & international organizations |
| `regionalintergovernmentalorganizations` | Regional intergovernmental organizations |
| `arise_network` | ARISE network |

### Taxonomy and collection fields

| Field | Holds | Notes |
| --- | --- | --- |
| `field_theme` | Theme term IDs | |
| `field_hazard` | Hazard term IDs | |
| `field_country_region` | Country and region term IDs | Covers every content type tagged with a country |
| `field_syndication` | Syndication term IDs | On blogs, conference events, events, landing pages, news, publications, resources and vacancies |
| `field_collections` | Collection node IDs | On blogs, news, publications and resources; an item can be in several collections |

```
field_theme:311                  Climate change
field_hazard:345                 Earthquake
field_country_region:172         Japan
field_country_region:69          Africa, the whole continent
field_collections:65548          Artificial intelligence for DRR collection
```

**Themes**: `field_theme`

| Term ID | Name |
| --- | --- |
| `307` | Disaster risk communication |
| `308` | Capacity development |
| `309` | Children and Youth |
| `310` | Civil Society/NGOs |
| `311` | Climate change |
| `312` | Community-based DRR |
| `313` | Critical infrastructure |
| `314` | Cultural heritage |
| `315` | Preparedness |
| `316` | Early warning |
| `317` | Financing DRR |
| `318` | Education and school safety |
| `319` | Environment and ecosystems |
| `320` | Food security and agriculture |
| `321` | Fragility and conflict |
| `322` | Gender |
| `323` | GIS and mapping |
| `324` | Governance |
| `325` | Health and health facilities |
| `326` | Human mobility |
| `327` | Inclusion |
| `328` | Traditional and Indigenous knowledges |
| `329` | Data and information management |
| `330` | Insurance and risk transfer |
| `331` | Private sector |
| `332` | Recovery |
| `333` | Risk identification and assessment |
| `334` | Science-policy-practice interface |
| `335` | Small Island Developing States (SIDS) |
| `336` | Social impacts and social resilience |
| `337` | Earth Observation (EO) |
| `338` | Structural safety |
| `339` | Urban risk and planning |
| `340` | Water |
| `889` | Livelihood |
| `890` | Recovery planning |
| `891` | Shelter and housing |
| `892` | Social protection |
| `1013` | Systemic risk |
| `1176` | Disaster losses |

Term 1177 is a duplicate "Financing DRR"; use `317`.

**Hazards**: `field_hazard`

| Term ID | Name |
| --- | --- |
| `341` | Avalanche |
| `342` | Cold Wave |
| `343` | Cyclone, Hurricane and Typhoon |
| `344` | Drought and Desertification |
| `345` | Earthquake |
| `346` | Epidemic and Pandemic |
| `347` | Flood |
| `348` | Heatwave and Extreme Heat |
| `349` | Insect infestation |
| `350` | Landslide |
| `351` | NBC: Nuclear, Biological, Chemical |
| `352` | Storm surge |
| `353` | Technological hazard |
| `354` | Tornado |
| `355` | Tsunami |
| `356` | Volcano |
| `357` | Wildfire and Bushfire |
| `1178` | Sea level rise |
| `1179` | Thunderstorm |
| `1180` | Land subsidence |

**Countries and regions**: `field_country_region`. The vocabulary has 235 terms: continents, country groupings and countries. Commonly used regions and groupings:

| Term ID | Name |
| --- | --- |
| `69` | Africa |
| `70` | Americas |
| `71` | Asia |
| `72` | Europe |
| `73` | Oceania |
| `1102` | LDCs (Least Developed Countries) |
| `1103` | LLDCs (Landlocked Developing Countries) |
| `1104` | SIDS (Small Island Developing States) |

A selection of countries:

| Term ID | Name |
| --- | --- |
| `74` | Afghanistan |
| `85` | Australia |
| `90` | Bangladesh |
| `101` | Brazil |
| `110` | Canada |
| `116` | China |
| `117` | Colombia |
| `133` | Egypt |
| `139` | Ethiopia |
| `140` | Fiji |
| `142` | France |
| `148` | Germany |
| `158` | Haiti |
| `164` | India |
| `165` | Indonesia |
| `172` | Japan |
| `175` | Kenya |
| `202` | Mexico |
| `214` | Nepal |
| `218` | New Zealand |
| `221` | Nigeria |
| `228` | Pakistan |
| `234` | Peru |
| `235` | Philippines |
| `262` | South Africa |
| `288` | United Kingdom of Great Britain and Northern Ireland |
| `289` | United States of America |

**Syndication**: `field_syndication`. The syndication vocabulary marks content for curated collections, microsite homepages and campaign pages. It has about 50 terms; commonly used ones:

| Term ID | Name |
| --- | --- |
| `805` | Highlights |
| `827` | Country profile |
| `906` | Statistics |
| `970` | GP2022 |
| `976` | Anticipatory action |
| `1011` | Homepage publications |
| `1014` | Careers in Resilience |
| `1017` | International Day for Disaster Risk Reduction (IDDRR) |
| `1020` | COP |
| `1024` | Climate change |
| `1095` | GAR |
| `1097` | Financing DRR |
| `1101` | Featured: UNDRR |
| `1106` | GP2025 |
| `1174` | EW4All |
| `1411` | Sendai Framework papers |

```
field_syndication:1101                          Featured: UNDRR content
field_syndication:(1097 OR 1024)                Financing DRR or Climate change
type:publication AND field_syndication:1095     Publications in the GAR collection
```

### Language

Field: `_language`

| Code | Language |
| --- | --- |
| `en` | English |
| `es` | Spanish |
| `fr` | French |
| `de` | German |
| `ja` | Japanese |
| `ar` | Arabic |
| `ko` | Korean |
| `zh-hans` | Chinese |
| `ru` | Russian |
| `pt-pt` | Portuguese |
| `und` | Undetermined |
| `zxx` | No language specified |

### Website

Field: `field_domain_access`

| Value | Website |
| --- | --- |
| `www_undrr_org` | UNDRR.org |
| `www_preventionweb_net` | PreventionWeb |
| `recovery_preventionweb_net` | International Recovery Platform |
| `gp_preventionweb_net` | Global Platform |
| `mcr2030_undrr_org` | MCR2030 |
| `iddrr_undrr_org` | IDDRR |
| `rp_americas_undrr_org` | RP Americas |
| `sendaiframework_mtr_undrr_org` | MTR SF |
| `tsunamiday_undrr_org` | World Tsunami Awareness Day |
| `rp_arabstates_undrr_org` | RP Arab States |
| `g20drrwg_preventionweb_net` | G20 DRRWG |
| `afrp_undrr_org` | Africa Regional Platform |
| `efdrr_undrr_org` | EFDRR |
| `apmcdrr_undrr_org` | APMCDRR |
| `coecdr_preventionweb_net` | Centre of Excellence |
| `ariseglobalnetwork_org` | ARISE |

### Dates

Field: `published_at`

```
published_at:[2020-01-01 TO 2024-12-31]
published_at:[2023-01-01 TO *]
published_at:[* TO 2022-12-31]
```

### Images

Field: `has_image`. `true` when the item has an image. Items of these types can have one: blog, collections, commitment, conference event, event, landing page, news, organization, people, publication and resource. Items of these types never do: hazard information profile, national platform, terminology, vacancy, conference and focal point. Taxonomy terms never have one.

```
has_image:true
has_image:false
```

The **Only with images** setting under **Narrow results** adds `has_image:true` in one click.

### Published status

Only published content is searched. There is no need to add a status filter.

## Looking up term IDs

The term IDs in this guide come from the original data migration and match production. Terms created later can have different IDs on development, staging and production, so check a new term on the website the widget will be published on.

| Where | What |
| --- | --- |
| `/admin/structure/taxonomy/manage/theme/overview` | Theme terms |
| `/admin/structure/taxonomy/manage/hazard/overview` | Hazard terms |
| `/admin/structure/taxonomy/manage/prevention_web_regions/overview` | Country and region terms |
| `/admin/structure/taxonomy/manage/news_type/overview` | News types |
| `/admin/structure/taxonomy/manage/undrr_publication_type/overview` | UNDRR publication types |
| `/admin/structure/taxonomy/manage/collections/overview` | Collection types |
| `/admin/structure/taxonomy/manage/syndication/overview` | Syndication terms |
| `/api/v1/taxonomy?vid=prevention_web_regions&items_per_page=1000` | Every country and region term, as JSON |
| `/api/v1/taxonomy?vid=syndication&items_per_page=1000` | Every syndication term, as JSON |
| `/taxonomy/term/{tid}` | One term, to confirm an ID |

The widget labels the **Country and region**, **Hazard** and **Theme** facets from PreventionWeb's `/api/v1/taxonomy` view. A term ID that content still references but that list does not return (an unpublished or deleted term) is left out of the facet dropdown rather than shown as a bare number. If a reader arrives with such a value already selected, it stays in the dropdown and the filter chips, shown by its ID, so it can be removed. The block does not change the taxonomy source; developers can, with the `taxonomyEndpoint` setting described in [Syndicated search](https://mangrove.undrr.org/?path=/docs/components-syndicated-search--docs).

## Related documentation

- [Syndicated search](https://mangrove.undrr.org/?path=/docs/components-syndicated-search--docs): the component, its props and its query syntax, for developers
- [Search syndication](https://mangrove.undrr.org/?path=/docs/platform-services-search-syndication--docs): what the search backend is and where the widget can be used
- [Drupal Gutenberg integration](DRUPAL-GUTENBERG.md): the other UNDRR blocks
- [Building landing pages](LANDING-PAGE-GUIDE.md): where a search or "latest content" panel fits on a page
- [Elasticsearch query string syntax](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/query-dsl-query-string-query.html): the full syntax behind custom filters
