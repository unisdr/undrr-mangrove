# Drupal teaser baseline

Inspected 16 October 2026 in `/Users/khawkins/Documents/git/drupal-base`, HEAD `226b54812725eb648faa8e09b21b59a338ddf26b`. The files below were unmodified in that working copy. This is a source-configuration audit, not proof of active production configuration or rendered runtime parity. Drupal was read only; changes are confined to Mangrove.

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
- Organisation references are unlinked. Resource config formats multiple organisations as a list; the current provisional `source` string does not preserve that structure. Reconcile this field with the canonical schema before adapter adoption.

## Conditional publication labels

`domain_restriction_formatter` limits ARISE resource type to `ariseglobalnetwork_org`, IRP publication subtype to `recovery_preventionweb_net`, and UNDRR publication types to `www_undrr_org`. Policy type and the base publication type have no domain restriction. UNDRR publication types are taxonomy links; other listed labels are unlinked. Mangrove accepts already-selected text labels, preserves order and omits duplicate values; selection and optional taxonomy-link semantics need explicit adapter/contract decisions. Do not show every domain's labels together or infer their visibility from a theme name.

## Deliberate departures and remaining evidence

- Complete publication covers remain uncropped, following the merged Mangrove card refinements. Drupal's `por` image style explicitly focal-point crops to 720 × 960; copying it would undo that decision.
- Native semantic heading links replace Drupal's `header` title wrapper. Metadata remains before the title, without extra duplicate tab stops.
- Supplied language labels and explicit event time zones are optional extensions, not claims about current teaser output.
- Verify active config, representative rendered teasers and actual indexed fields before claiming Drupal parity. Next steps remain source adapters, multiple-source structure, link resolution, conditional linked labels, search highlights, SSR integration and measured migration criteria.
