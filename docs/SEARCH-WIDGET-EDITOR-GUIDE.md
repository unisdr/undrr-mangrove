# Search widget editor configuration

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/SEARCH-WIDGET-EDITOR-GUIDE.md) and in [Storybook](https://mangrove.undrr.org/?path=/docs/components-syndicated-search-editor-configuration--docs).

> **About this guidance:** this page brings together guidance maintained elsewhere and is provided for reference and ease of access. It is not the authoritative source. Where it differs from a source, or doesn't cover a point, follow the source: the [syndication search widget](https://mangrove.undrr.org/?path=/docs/components-syndicated-search--docs) component and its code (for search behaviour), the search configuration of the UNDRR platform as deployed (for fields, scoring and settings) and the production taxonomy (for term IDs and names).

How to configure the **UNDRR Search Widget** block (`undrr/search-widget`) on UNDRR websites: what each sidebar setting does, what readers can type in the search box and the `field:value` filters that scope a widget to a content type, theme, country, website or date range. The block renders the [Syndicated search](https://mangrove.undrr.org/?path=/docs/components-syndicated-search--docs) component; that page documents the component's props and behaviour for developers.

The search widget turns up on landing pages, country pages, topic hubs and conference microsites. On most of them an editor sets hidden filters that sandbox the results. The sidebar handles the common cases; this guide covers the rest.

> **Integration note:** Backend notes (relevance scoring and synonyms, the configuration modifier pattern other Drupal modules use to inject filters, library load order and the source file inventory) are maintained with the `undrr_gutenberg_blocks` Drupal module in the UNDRR platform codebase, because they change with the backend rather than with the component.

An AI tool can read this guide as plain text at <https://mangrove.undrr.org/llms-search-widget.txt>.

## Quick reference

**Append to queries** adds hidden terms to every search, and every result must match them. It narrows results; it does not merely rank matching content higher:

- `sendai framework` limits every search to content that also mentions the Sendai Framework
- `"early warning systems"` limits every search to content containing the exact phrase

The appended text joins the reader's own words in a single search whose default operator is AND. A search for `flood` with `sendai framework` appended returns only items that match all three words, a small fraction of the plain `flood` results. For a hard scope, **Custom filters** are clearer and more predictable.

**Custom filters** are a JSON array of hard filters applied to every query:

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
| `["has_image:true"]` | Only results with an image, useful in card display modes |

Separate entries combine with AND: `["type:news", "field_theme:311"]` means news **and** climate change. For OR, use parentheses inside a single entry. Field filters and free-text terms such as `DRR` can be mixed in one expression.

**Search modifiers** use Elasticsearch `query_string` syntax and work in both **Append to queries** and **Custom filters**. The widget processes appended text separately from the reader's search and combines the two as `(reader search) AND (appended text)`, so an OR typed by a reader cannot loosen the requirement, and special characters in the appended text do not change how the reader's words are searched:

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

**Custom filters**: `["type:publication"]`

### Publications from 2020–2024

**Custom filters**: `["type:publication", "published_at:[2020-01-01 TO 2024-12-31]"]`

### Lock results to one website

In **Search settings**, set **Website** to the domain (for example `www_preventionweb_net`) and turn off **Override with current website domain**. Then, under **Display**, uncheck **Website** in the filter dropdowns. The widget is filtered to that website and the dropdown is hidden.

### One widget that follows the site it is published on

Leave **Override with current website domain** on (the default). When the same landing page is published on several websites, the widget reads the current website when the page loads and filters to it, so no per-site configuration is needed. Hide the **Website** dropdown if readers should not change it. The **Website** setting remains the fallback if the site cannot be detected.

**Override with current page language** works the same way for translated pages, so a translation shows results in its own language.

### Pre-filter by theme, hidden from readers

**Custom filters**: `["field_theme:311"]` (Climate change). Then uncheck the **Theme** filter dropdown.

### Content from a collection, narrowed by hazard

**Custom filters**: `["field_collections:65548", "field_hazard:357"]`

This limits results to content in the "Artificial intelligence (AI) for disaster risk reduction" collection (node 65548) that is tagged Wildfire and Bushfire (term 357). `field_collections` holds collection **node** IDs, not taxonomy term IDs. To let readers choose between several collections, add a custom facet whose options are `field_collections:<node ID>` queries.

### Require terms in every search

Set **Append to queries** to `sendai framework`. Every search a reader makes must then also match those words, so the widget only ever returns content that mentions the Sendai Framework. Use it sparingly: readers cannot see or remove the appended terms, and a search that returns nothing gives them no clue why.

### Custom facet for UNDRR document types

Add a custom facet titled "Document type", with position weight 10 and multiple selections allowed:

| Label | Query |
| --- | --- |
| Reports | `field_undrr_publication_types:746` |
| Policy briefs | `field_undrr_publication_types:1027` |
| Fact sheets | `field_undrr_publication_types:744` |
| Working papers | `field_undrr_publication_types:748` |

### PreventionWeb publications by type

Goal: only PreventionWeb publications, with a facet readers can use to narrow by publication category.

**Custom filters**: `["type:publication", "field_domain_access:www_preventionweb_net"]`

Add a custom facet titled "Publication type":

| Label | Query |
| --- | --- |
| Documents and publications | `field_publication_type:"Documents and publications"` |
| Policies and plans | `field_publication_type:"Policies and plans"` |
| Educational materials | `field_publication_type:"Educational materials"` |
| Statements | `field_publication_type:Statements` |
| UN resolutions and reports | `field_publication_type:"UN resolutions and reports"` |

Values with spaces must be quoted. Hide the **Website** dropdown, since the website is already fixed.

### Latest research: combining subtypes across content types

Goal: research briefs and publications together as one research feed, as on [PreventionWeb's latest research page](https://www.preventionweb.net/knowledge-base/type-content/latest-research).

**Custom filters**: `["(field_news_type:755 OR type:publication)"]`

- `field_news_type:755` matches news items with the subtype "Research briefs".
- `type:publication` matches all publications.
- `OR` means either condition qualifies a result.

In the sidebar, set **Website** to PreventionWeb, hide the **Website** dropdown and sort by **Newest first**. Under **Limit by content type**, check only News and Publication so the **Type** dropdown stays short.

Two separate entries, `["field_news_type:755", "type:publication"]`, would return nothing: entries combine with AND, and no item is both a news item and a publication. The OR has to sit inside one entry.

To filter publications by the type of organization that produced them, use `org_type_ref`, which carries the organization type onto the publication. `field_organization_type` exists only on organization records and matches nothing on publications:

```json
["(field_news_type:755 OR (type:publication AND org_type_ref:academicscientific))"]
```

### Curated feed: a "latest content" panel

With every piece of search interface switched off, the widget becomes a self-updating list, the right tool for a "Latest news" or "Related resources" panel on a landing page. Unlike hand-placed cards, it never goes stale.

| Setting | Value |
| --- | --- |
| Search box, results count, search timer, facets, pagination, active filter chips | Off |
| Every filter dropdown | Off |
| URL hash sync | `false` |
| Results per page | 3–6 |
| Custom filters | The scope of the panel |

Set **URL hash sync** to `false` explicitly. The default, `auto`, lets the widget write its state into the page URL, which on a page where the widget is a supporting panel breaks sharing and the back button.

Scope the panel with **Custom filters** rather than **Default search query**. A default query is a full-text search that stray words can dilute; a custom filter always applies. Prefer a taxonomy term to a phrase, because term IDs are exact and phrases match unpredictably. The syndication vocabulary exists for exactly this job:

```json
["field_syndication:1018"]
```

Check that content is actually tagged before building the panel: a filter that matches nothing renders an empty widget with no error. The block preview in the editor runs the same query, but it always uses the fixed **Language** and **Website** values, so it matches the published panel only when **Override with current page language** and **Override with current website domain** are off, or when the fixed values are the ones the page is published with.

### Card grid with no empty image slots

Set **Display mode** to **Card**, then turn on **Only show results with images** under **Filtering**. The hidden `has_image:true` filter means every result has an image, so the grid has no blank slots.

### Horizontal facets above the results

Set **Facets layout** to **Horizontal strip above results**. The facets render as one row between the search box and the results, which frees the side of the page for other content.

### Search box in the hero, facets in a side column

The search input and the facets can render in other parts of the page while the results stay where the widget block is.

1. Insert an **UNDRR Search Bar Container** block where the search box should appear, for example in the hero area.
2. Insert an **UNDRR Search Facets Container** block where the facets should appear, for example a side column.
3. Insert the **UNDRR Search Widget** block where the results should appear.

A newly inserted widget finds exactly one of each container on the page and links to them. After adding or moving containers, choose **Auto-link target containers on this page** in the widget's **Advanced** panel, under **Detached layout targets**. With more than one widget on a page, link them by hand: each container has a **Copy selector** button, and the selectors go in the widget's **Search input target selector** and **Facets target selector** settings.

If a container is missing when the page loads, the widget shows the search box or facets in its own area instead.

For tabs where each tab holds its own widget and all of them share one search box, turn on **Share with all search widgets on this page** on the container. Use it only when the tabs mount one widget at a time. Nothing arbitrates between widgets that are on screen together, so do not point two mounted widgets at the same container.

To put a search box on one page and the results on another, use a plain HTML form that submits to the results page with a `#query=` fragment instead.

### Restrict the Type dropdown

Under **Filtering**, in **Limit by content type**, uncheck the types to hide. For example, to offer only News, Events and Publications, uncheck all the others.

## Block settings reference

The sidebar has four panels: **Search settings**, **Filtering**, **Display** and **Advanced**. The tables follow that layout.

### Search settings

| Setting | Attribute | Default | Description |
| --- | --- | --- | --- |
| Default search query | `defaultQuery` | Empty | Pre-fills the search box |
| Sort results by | `defaultSort` | `newest` | `newest`, `oldest` or `relevance` |
| Results per page | `resultsPerPage` | 10 | 1–100 |

**Page-context defaults**:

| Setting | Attribute | Default | Description |
| --- | --- | --- | --- |
| Language | `defaultLanguage` | `en` | Pre-selected language; also the fallback for the override below |
| Override with current page language | `useCurrentLanguage` | On | Uses the page's language when it loads, falling back to **Language** |
| Website | `defaultDomain` | Empty (all websites) | Pre-selected website; also the fallback for the override below |
| Override with current website domain | `useCurrentDomain` | On | Uses the website the page is published on, falling back to **Website** |

Both overrides are on by default so a new widget adapts to whichever website and language it appears on. Widgets saved before these defaults were switched on ([undrr/web-backlog#2822](https://gitlab.com/undrr/web-backlog/-/work_items/2822)) keep both off, through the block's deprecation, until an editor turns them on. Detection happens once, when the page loads. The editor preview always uses the fixed **Language** and **Website** values, because the editor is not the published page.

### Filtering

**Limit by content type** restricts which types and subtypes appear in the **Type** dropdown: content types, news subtypes, PreventionWeb publication subtypes and taxonomy vocabularies. With everything checked there is no restriction.

**Hidden filters applied to all queries** constrain results without showing the constraint to readers:

| Setting | Attribute | Description |
| --- | --- | --- |
| Only show results with images | `requireImage` | Adds a hidden `has_image:true` filter |
| Append to queries | `queryAppend` | Terms added to every search; every result must match them |
| Custom filters (JSON array) | `customFilters` | `query_string` filters applied to every query. A bare expression such as `type:news` is wrapped into a one-item array automatically |

**Editorial ranking filters** limit results by the interestingness or longevity an editor set on each item. Leave both empty for no filter.

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

Items with no value set are ranked as if their longevity were 80, but a tier filter does not include them: selecting **Year** matches only items whose stored value is 66–85.

**Custom facet dropdowns**: up to three filter dropdowns defined by the editor. Each has a title, a position weight (0–100; lower appears first), a multiple-selection toggle and a list of options, each a label and a `query_string` expression. Multiple selections combine with OR.

### Display

**Layout**:

| Setting | Attribute | Default | Description |
| --- | --- | --- | --- |
| Display mode | `displayMode` | `list` | `list`, `card` (image card grid) or `card-book` (book card grid) |
| Grid columns | `gridColumns` | Automatic | 2–6 columns, card modes only; automatic derives it from results per page |
| Facets layout | `facetsLayout` | `sidebar` | `sidebar`, `horizontal` (a strip above the results) or `hidden` |

**Show or hide UI elements**: search box, results count, search timer, facets sidebar (a legacy switch; prefer **Facets layout**), pagination and active filter chips.

**Filter dropdowns** show or hide each reader-facing filter:

| Dropdown | Attribute | Field |
| --- | --- | --- |
| Website | `showWebsiteFilter` | `field_domain_access` |
| Type | `showTypeFilter` | `type` |
| News type | `showNewsTypeFilter` | `field_news_type` |
| Year | `showYearFilter` | `year`, from `published_at` |
| Country | `showCountryFilter` | `field_country_region` |
| Hazard | `showHazardFilter` | `field_hazard` |
| Theme | `showThemeFilter` | `field_theme` |
| Language | `showLanguageFilter` | `_language` |

A fixed filter is a default value plus a hidden dropdown: set **Website** to `www_undrr_org` in **Search settings** and uncheck the **Website** dropdown here, for example.

**Result teaser fields** hide parts of each result: image, content type, publication type, date, site name, summary and organization.

### Advanced

| Setting | Attribute | Default | Description |
| --- | --- | --- | --- |
| Facets target selector | `facetsTarget` | Empty | CSS selector of a region elsewhere on the page for the facets |
| Search input target selector | `searchTarget` | Empty | The same, for the search box |
| Facet count limit | `facetCountToShow` | 500 | Options per facet dropdown, 100–1000 |
| Debounce delay (ms) | `debounceDelay` | 750 | Wait after typing before a search runs, 100–2000 |
| URL hash sync | `enableHashSync` | `auto` | `auto` turns sync off when there is more than one widget on the page; `true`; `false` |
| Show search quality metrics | `showSearchMetrics` | Off | Debugging information in results |
| Search endpoint URL | `searchEndpoint` | `/search-endpoint` | Do not change without a reason |
| Widget container ID | `widgetId` | Generated | Read-only |

On a page with more than one widget, `auto` hash sync stops the widgets fighting over the URL. To keep sync on one of them, set it to `true` on exactly one widget and `false` on the rest.

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

These are used in **Custom filters**, **Append to queries** and custom facet queries.

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

The **Only show results with images** setting adds `has_image:true` in one click.

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

## Related documentation

- [Syndicated search](https://mangrove.undrr.org/?path=/docs/components-syndicated-search--docs): the component, its props and its query syntax, for developers
- [Search syndication](https://mangrove.undrr.org/?path=/docs/platform-services-search-syndication--docs): what the search backend is and where the widget can be used
- [Drupal Gutenberg integration](DRUPAL-GUTENBERG.md): the other UNDRR blocks
- [Building landing pages](LANDING-PAGE-GUIDE.md): where a search or "latest content" panel fits on a page
- [Elasticsearch query string syntax](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/query-dsl-query-string-query.html): the full syntax behind custom filters
