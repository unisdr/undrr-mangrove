# Drupal teaser baseline

Inspected 16 October 2026 in `/Users/khawkins/Documents/git/drupal-base`, HEAD `226b54812725eb648faa8e09b21b59a338ddf26b`. The files below were unmodified in that working copy. Coverage is the 15 node bundles explicitly selected by `config/default/search_api.index.multidomain.yml`; taxonomy terms are a separate datasource. This is a source-configuration audit, not proof of active production configuration or rendered runtime parity. Drupal was read only; changes are confined to Mangrove.

## Shared layout

All four `config/default/core.entity_view_display.node.{news,publication,resource,event}.teaser.yml` files select Display Suite `teaser_3_9`. `docroot/themes/custom/undrr_common/templates/layout/teaser-3-9.html.twig` uses `mg-card mg-card__hc mg-card-book__hc`, an optional `mg-card__visual` from the left region, and `mg-card__content` containing first/main regions. It does not select vertical cards or a four-column card gallery. The pattern therefore defaults to a responsive horizontal reading-list teaser, using the same shared class contract, including for news photographs.

`undrr_common/scss/base.scss` removes the visual border to accommodate Drupal media wrappers. `layout.scss` spaces inline metadata fields. The new React pattern uses direct images and shared Mangrove image hairlines; wrapper workarounds are not copied. The inspected IRP teaser stylesheet contains page/view-specific presentation, not a replacement content hierarchy.

## Display Suite content order

| Type | Left region | Main region in configured order |
| --- | --- | --- |
| News | `field_image`, media view `landscape_16_9_` | `field_news_type`, `field_release_date`, `field_short_title`, `body`, `field_organization` |
| Publication | `field_image`, media view `por` | `field_publication_type`, `field_arise_resource_type`, `field_irp_publication_subtype`, `field_policy_type`, `field_undrr_publication_types`, `published_at`, `node_title`, `field_symbol`, `body`, `field_organization` |
| Resource | None (`field_image` hidden) | `field_resource_type`, `field_country_region`, `field_online`, `node_title`, `body`, `field_organization` |
| Event | None (`field_image` hidden) | `field_event_type_term`, `field_event_city`, `field_event_date_range`, `field_online`, `node_title`, `body` |

Display Suite lists `field_date_time` in publication content but not in its configured regions. Its formatter depends on `conference_event_date_field_formatter`; it is not treated as part of the ordinary publication teaser contract without runtime evidence.

## Mapping and formatter details

- News uses `field_release_date`, not `published_at`. The short-title formatter links using `[node:canonical-source-domain-url]`. `undrr_content_types_entity_presave()` fills an empty news `field_short_title` from the full title. Mangrove mirrors this fallback for news only; it continues accepting an already-resolved link rather than importing the token's domain policy.
- Publication uses `published_at` before the title and `field_symbol` after it. `field_year_of_publication` is hidden. Do not silently replace the configured date with the publication year.
- Resource type is a label above the title. Country/region and delivery follow. `field_online` renders `Online` when true and nothing when false. Its visually hidden location label must be supplied by an adapter when a location value would otherwise be ambiguous.
- Events show city, occurrence range and delivery before the title. `field_online` renders `Online` or `In person`. Image, organisation, publication timestamp and event-language fields are hidden. An end-only range is not promoted to a start date.
- `undrr_format` is `j F Y`. Event `daterange_default` uses both endpoints and no timezone override. Timed ranges and explicit time-zone strings remain supported extensions in Mangrove; they do not describe the default Drupal date formatter.
- All four bodies use Smart Trim at 255 characters with `summary_handler: full`. News/resource/event enable the text trim option; publication does not. The pattern's plain-text summary is a deliberate safer subset. Exact Smart Trim parity, including publication inline formatting, needs source-adapter fixtures; the renderer does not reproduce trimming with JavaScript string slicing.
- Publication `field_symbol` has a separate 600-character Smart Trim setting.
- Organisation references are unlinked. Resource config formats multiple organisations as a list. Mangrove now uses `sources` arrays and semantic lists; the scalar `source` is only a compatibility fallback for the first experimental draft.

## Conditional publication labels

`domain_restriction_formatter` limits ARISE resource type to `ariseglobalnetwork_org`, IRP publication subtype to `recovery_preventionweb_net`, and UNDRR publication types to `www_undrr_org`. Policy type and the base publication type have no domain restriction. UNDRR publication types are taxonomy links; other listed labels are unlinked. Mangrove accepts already-selected text labels, preserves order and omits duplicate values; Mangrove now accepts `{ label, link? }` values and preserves supplied native taxonomy destinations. Visibility selection still belongs to the adapter and needs an explicit policy. Do not show every domain's labels together or infer their visibility from a theme name.

## Deliberate departures and remaining evidence

- Complete publication covers remain uncropped, following the merged Mangrove card refinements. Drupal's `por` image style explicitly focal-point crops to 720 × 960; copying it would undo that decision.
- Native semantic heading links replace Drupal's `header` title wrapper. Metadata remains before the title, without extra duplicate tab stops.
- Supplied language labels and explicit event time zones are optional extensions, not claims about current teaser output.
- Verify active config, representative rendered teasers and actual indexed fields before claiming Drupal parity. Next steps remain verified source adapters, canonical schema reconciliation, link resolution and conditional visibility, search highlights, SSR integration and measured migration criteria.


## Remaining indexed bundles

The same audit was extended to every selected node bundle. All rows below except people use `teaser_3_9`. Fields are in the configured region order; the pattern preserves that hierarchy rather than exposing all available entity fields.

| Drupal bundle → normalised type | Left region | Before title | After title |
| --- | --- | --- | --- |
| `blog` → `blog` | `field_image`, landscape thumbnail | `field_blog_type`, `field_publication_date`, `field_authors` | `body` |
| `organization` → `organization` | `field_image`, full media | `field_simple_country` | `body`, `field_organization_type` |
| `collections` → `collection` | `field_image`, landscape media | `field_collection_type`, `collection_freshness` | `body` |
| `vacancy` → `vacancy` | None | bundle label, `field_city_additional_location`, `field_closing_date` | `body` |
| `hazard_information_profile` → `hazard-profile` | None | `field_hip_cluster_type`, `field_hip_notation` | `body` |
| `conference_event` → `conference-session` | `field_image`, landscape thumbnail | `field_event_bucket`, `field_date_time`, `field_exhibit_date`, `field_room_location`, `field_format` | `body`, `field_conference_event_type_term`, `field_conference_theme` |
| `commitment` → `commitment` | `field_image`, landscape media | `field_geographic_scope`, `field_status`, `published_at` | `body` |
| `landing_page_gutenberg` → `landing-page` | `field_image`, landscape media | bundle label | `body` |
| `national_platform` → `national-platform` | None | bundle label | `body` |
| `terminology` → `terminology` | None | bundle label | `body` |
| `people` → `person` | None | No configured DS fields | `body` in core content region |

### Content-specific formatter rules

- Blogs link their type taxonomy, use `undrr_format_short` (`d M Y`), and show author strings before the title. They trim body text at 150 characters with Smart Trim; linked authors are not configured.
- Organisation country is a linked taxonomy label; organisation type is plain text after the summary. The image uses the full media display, not a landscape crop. `base.scss` centres organisation logos inside Drupal's wrapped media. Mangrove preserves the full logo ratio with no photo cropping or surrounding image border.
- Collection type is linked. `_undrr_custom_build_collection_freshness()` in `undrr_custom.module` uses the newest published date of linked published content and labels it Last updated; if none exists it uses the collection's `published_at` labelled Created. It formats `j M Y`. Mangrove accepts the chosen kind/date explicitly and does not query linked content or guess freshness from its own clock.
- Vacancy closing dates are date-only fields, displayed using `undrr_format_short`. The teaser does not include the separate `closed_vacancy` Display Suite field. Mangrove's optional vacancy status is a declared extension; upstream supplies it and any deadline label. No client-side expiry inference is introduced.
- Hazard classification is linked taxonomy; notation is a plain string before the title. `content_moderation_control` appears outside the configured DS main region and is not public teaser content.
- Conference session date/exhibit fields both use `ConferenceEventDateFieldFormatter.php`. It supports ranges and time/zone output, resolving the entity time zone, then parent event time zone when applicable, otherwise UTC. Mangrove preserves separate arrays of already-localised schedule/exhibition ranges. It does not recreate Drupal entity loading or time zone resolution.
- Session room uses `hierarchical_term_formatter` with all ancestors, unlinked, separated by ` - `. `FormatFieldFormatter.php` maps its known taxonomy identifiers to Onsite, Online or Onsite & Online. Adapters must resolve these presentation strings; no taxonomy IDs are embedded in Mangrove logic. Session type and conference theme are linked taxonomy fields after the summary.
- Commitments use geographic scope, status and `published_at`, rather than an event occurrence or closing date. No additional type label is configured.
- Landing pages and national platforms use Smart Trim at 300 characters; national platforms select the authored summary (`summary_handler: trim`) while landing pages use `full`. Terminology uses `text_summary_or_trimmed` at 255. The plain-text pattern does not reproduce these formatter algorithms.
- People use the core teaser display with body trimmed to 600 characters and no DS layout. Image, job title, organisation and publication date are hidden. Mangrove supplies a native title/destination and summary without importing those hidden full-profile fields. This is a conservative search pattern, not claimed exact core node-wrapper parity.

### Search scope boundary

The selected node set is blog, collections, commitment, conference_event, event, hazard_information_profile, landing_page_gutenberg, national_platform, news, organization, people, publication, resource, terminology and vacancy. The repository also contains conference and focal-point view displays, but those bundles are not selected in this index; their runtime teaser and search eligibility are not claimed as covered. Taxonomy-term results likewise retain their existing renderer until a separate contract is reviewed.


## Red-team contract checks

Storage configuration confirms unlimited cardinality for resource country/region, organisation type and commitment status. These inputs preserve ordered arrays as well as scalar shorthand; adapters must not discard extra values. Displayed collection freshness and closing dates require localised role labels. Exhibition ranges require labels, and schedules displayed alongside exhibitions require their own labels. Native text boundaries supplement visual CSS gaps, including for multiple after-title taxonomy links. Combined session `topics` is a presentation-only list; canonical session-type and theme taxonomies remain distinct.


## Content-family ownership

The audited teaser hierarchy is a presentation projection owned by each `stories/Patterns/Content/{Family}/patterns.js` file. Other presentations have separate status records: an existing reference, an experimental implementation or a stub with no implementation. The shared `ContentTeaser` renderer consumes only teaser layouts. These source-configured fields do not define a canonical model for full pages or compact cards. Full resource, event and other missing page designs remain explicit stubs; news, publication, collection and landing-page examples are linked as references rather than claimed complete canonical implementations.

## Archetype/profile integration boundary

The audited Drupal bundle names below remain source identities, not the pattern hierarchy. Mangrove retains their provisional bindings in `stories/Integrations/Drupal/contentPatterns.js`, exported as `DRUPAL_CONTENT_PATTERNS` (`DRUPAL_TEASER_TYPES` is a draft alias with descriptor values). News/blog select Article news/commentary; event/conference_event select Event general/programme-session; terminology/hazard_information_profile select Reference entry definition/hazard-profile; vacancy selects Opportunity/job. National platform provisionally selects Organisation/coordination-platform, preserving its labels, summary and absent media; an activity-led portal may instead use Landing page after consumer review. Remaining bundles select their matching archetype's default/general profile. No source field order or omission rule changes in this consolidation. These are editable consumer bindings, not canonical CMS-independent schemas or production field adapters.
