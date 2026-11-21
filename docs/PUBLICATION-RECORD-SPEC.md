# Publication record specification

> **Provisional; experimental story composition only.** This specifies an ordinary bibliographic publication record within the existing Publication archetype. The [record prototype](https://mangrove.undrr.org/?path=/docs/patterns-publication-record--docs) now demonstrates the proposed hierarchy in story-owned source. It adds no published renderer, package import, canonical schema, Gutenberg block, production adapter or claim of production parity. The current [Publication full-page references](https://mangrove.undrr.org/?path=/docs/patterns-content-publication-full-page--docs) demonstrate curated report landing pages instead.

Reviewed 29 October 2026 for [PR #1436](https://github.com/unisdr/undrr-mangrove/pull/1436), tracked in [#1432](https://github.com/unisdr/undrr-mangrove/issues/1432). Experimental story composition added in [PR #1437](https://github.com/unisdr/undrr-mangrove/pull/1437), stacked on the specification work. Drupal was inspected read only; no Drupal configuration or content was changed.

## Purpose and presentation boundary

| Ordinary publication record / catalogue entry | Curated report landing page |
| --- | --- |
| Identify one work, assess its relevance and provenance, and find a usable reading resource. | Explain a report through an editorially composed narrative, selected findings, web reading sections and report actions. |
| Plain title, description, optional complete cover, bibliographic metadata, available resources and approved citation support. | Masthead/Hero, selected statistics, thematic sections, quotations and chapter/download routes where editorially justified. |
| Consistent structure across records; omission of absent optional information. | Report-specific composition and branding within the host theme. |
| An experimental story-only Mangrove record composition now demonstrates this hierarchy. Production integration remains unimplemented; existing Drupal templates remain a separate consumer implementation. | Existing Storybook references demonstrate composition, not a canonical bibliographic record contract. |

These are full-page purposes within **Publication**, not new top-level archetypes or CMS bundle names. One work may have both experiences, linked according to the host's URL/editorial policy. A landing page's promotional title, selected figures or download action is not automatically the work's bibliographic title, citation or canonical URL. Do not require a landing page for every PDF, or infer the full-page presentation from a teaser/card input.

The Drupal `publication → publication/default` binding selects provisional editorial meaning only. It does not implement field extraction or choose this record layout. A Gutenberg-authored report landing can also concern a Publication; the authoring mechanism alone does not redefine its content type.

## Reader needs

Readers should be able to:

- Identify the work and its edition or version, subject and intended use before downloading it.
- Distinguish personal authors from issuing/source organizations, and identify the information needed for attribution.
- Understand publication year/date without confusing it with content posting, policy validity, speech dates or a period covered by a report.
- Assess the description and find a suitable language/format, with honest file, external-access and backup information.
- Cite or share the approved record/work without mistaking a campaign page or a guessed identifier for its canonical identity.

These are design requirements, not mandatory source fields or evidence that a reader study has validated this structure.

## Inspected Drupal baseline

Source: `undrr/drupal-base`, revision **`4d84703f76a39467dd1b40f31599c253dce5ffdf`**. Links below identify the inspected source revision and require access to that repository. This is a source/configuration audit, not proof of deployed configuration, populated content, permissions or rendered runtime parity. A local configuration check corroborated the selected full display; an anonymous local node request redirected, so it did not establish a rendered record baseline.

| Evidence | What it establishes |
| --- | --- |
| [Publication full display](https://gitlab.com/undrr/drupal-base/-/blob/4d84703f76a39467dd1b40f31599c253dce5ffdf/config/default/core.entity_view_display.node.publication.full.yml#L86) | Enabled bundle-specific `full` display; Display Suite layout `full_content_3_column_2_7_3_header_footer`, explicit region lists and field groups. Do not use the fallback `default` display as the record contract or simply sort field weights. |
| [Shared layout template](https://gitlab.com/undrr/drupal-base/-/blob/4d84703f76a39467dd1b40f31599c253dce5ffdf/docroot/themes/custom/undrr_common/templates/layout/full-content-3-column-2-7-3-header-footer.html.twig#L1) | Metadata/title first region, main content and right details/cover region. An empty left region expands main from 7/12 to 9/12; right remains 3/12. The template adds sharing and domain badges. It does not require a report Hero. |
| [Attachment preprocessing](https://gitlab.com/undrr/drupal-base/-/blob/4d84703f76a39467dd1b40f31599c253dce5ffdf/docroot/themes/custom/undrr_common/undrr_common.theme#L392) and [attachment template](https://gitlab.com/undrr/drupal-base/-/blob/4d84703f76a39467dd1b40f31599c253dce5ffdf/docroot/themes/custom/undrr_common/templates/field/field--default--node--field-attachment.html.twig#L79) | The public download experience is more than a generic media view: primary external access, local downloads/backups, file metadata and attachment-language links are selected here. |
| [Year field definition](https://gitlab.com/undrr/drupal-base/-/blob/4d84703f76a39467dd1b40f31599c253dce5ffdf/config/default/field.field.node.publication.field_year_only.yml#L14) and [full formatter](https://gitlab.com/undrr/drupal-base/-/blob/4d84703f76a39467dd1b40f31599c253dce5ffdf/config/default/core.entity_view_display.node.publication.full.yml#L1021) | `field_year_only` is an actual stored publication year rendered by `yearonly_default`, not a boolean selector or a date extracted from posting time. |
| [Media language definition](https://gitlab.com/undrr/drupal-base/-/blob/4d84703f76a39467dd1b40f31599c253dce5ffdf/config/default/field.field.media.file.field_language.yml#L15) | File media has a required language taxonomy field; legacy/incomplete values still need handling. The attachment template uses the term's ISO 639-1 value for `hreflang` when available. Node `langcode` is not a substitute for document language. |
| [Cover view](https://gitlab.com/undrr/drupal-base/-/blob/4d84703f76a39467dd1b40f31599c253dce5ffdf/config/default/core.entity_view_display.media.image.por.yml) and [portrait image style](https://gitlab.com/undrr/drupal-base/-/blob/4d84703f76a39467dd1b40f31599c253dce5ffdf/config/default/image.style.por.yml) | Source full display uses media `por`, with a 720 × 960 focal-point crop. The complete-cover proposal below deliberately follows Mangrove's media-role policy instead. |
| [Citation integration](https://gitlab.com/undrr/drupal-base/-/blob/4d84703f76a39467dd1b40f31599c253dce5ffdf/docroot/modules/custom/undrr_custom/undrr_custom.module#L1659) and [hidden fields](https://gitlab.com/undrr/drupal-base/-/blob/4d84703f76a39467dd1b40f31599c253dce5ffdf/config/default/core.entity_view_display.node.publication.full.yml#L1045) | `undrr_citation` is hidden in the publication full display. The inspected Drupal citation extra field/library (`undrr_citation`, loading `js/undrr_citation.js`) renders for hazard profiles, not ordinary publication records. It is not the Mangrove CiteThis primitive, and the library does not establish publication integration. |

The `status: false` flag on `core.entity_view_mode.node.full` governs the default custom-settings policy; it does not disable this enabled bundle-specific full display. Drupal's view-display selection and controller default still select full where configured. Field-group preprocessing moves grouped children out of the root, and Display Suite assigns effective order from the region lists. Do not duplicate group children or interpret an unassigned content entry as necessarily visible.

### Observed regions and conditional selection

The inspected shared full layout selects the following order, omitting empty values and respecting formatter/domain restrictions. This is the **source order**, not the proposed Mangrove reading order below.

| Region | Effective visible selection |
| --- | --- |
| First / identity strip | Statement type; eligible ARISE resource type; linked policy type; target audience; eligible linked UNDRR publication types; eligible linked IRP subtype; author names; policy time frame; policy thematic area; H1; resolution/report date; legacy original-language title; linked source organizations; symbol. Moderation/editorial controls are excluded from this public-content interpretation. |
| Main | Speaker name, speaker title/position and statement date where populated; full formatted description/body; Download attachments; Editors' recommendations (related links/video); Explore further (eligible hazard, theme, country/region, ARISE priority, SDGs and Sendai priorities). Group children appear within their groups, not again at root. |
| Right | Portrait cover; ISBN/ISSN/DOI value; number of pages; publication year (`field_year_only`); shared sharing controls and domain badges. |

These bundle-wide fields cover reports, policies, statements and other publication meanings; they are not all requirements for an ordinary record. Preserve per-record meaning, domain eligibility, field access and editorial publication decisions. Never infer domain visibility from the selected Mangrove theme. A configured field that is empty, hidden, inaccessible or outside its rendered region does not create a public requirement.

Domain restrictions are explicit: ARISE resource type is unlinked and limited to `ariseglobalnetwork_org`; IRP subtype is linked and limited to `recovery_preventionweb_net`; UNDRR publication types are linked and limited to `www_undrr_org`. The formatter removes those fields on other domains. The base publication type is hidden in the full display but may still participate in the host breadcrumb; field visibility in one region does not define all page-shell behaviour.

The authoring form has type-specific conditions for documents/publications, policies/plans, educational materials, statements and UN resolutions/reports. Those are **form conditions**, not evidence that the full renderer suppresses every historical cross-profile value. Do not silently remove populated public values by guessing a type from a label. Likewise, `flag_content` is configured as a component but absent from the selected region lists; this audit does not establish a visible favourite action.

The inspected themes share the common full layout/attachment foundations through inheritance (PW/UNDRR/GP from common, IRP from PW), but surface expression and some contextual output differ. IRP publication styling hides domain badges; GP statement rendering adds source identifiers. The PW title truncation block is disabled. These observations do not establish visual parity across sites or authorize copying their theme-specific CSS into the shared record presentation.

In particular, the source full display hides `published_at`, legacy `field_year_of_publication`, node `langcode`, base `field_publication_type`, `undrr_citation`, short-description and submitter/editorial metadata. Hidden status in this display does not establish field-level or API access control; those permissions were not proved by this audit. This differs from the [teaser baseline](CONTENT-TEASER-DRUPAL-AUDIT.md), where posting date and publication-type selection have different roles. The visible original-language-title field is itself marked deprecated in source authoring guidance; retain populated public historical content until an explicit migration/replacement decision, rather than silently dropping it because it is deprecated.

## Proposed record anatomy and order

This is a **proposed simpler presentation**, not a reproduction of the source's three-column layout or a committed input schema. The host supplies its approved site shell and breadcrumb policy. Inside the record:

| Order | Region | Content and omission rule |
| --- | --- | --- |
| 1 | Identity | One plain H1 for the work, followed by eligible document classification and core attribution/publication-year information. Use the existing typography hierarchy; no Hero or stats band is required. Preserve an approved alternate/original title where supplied, with language metadata only when known. |
| 2 | Cover and description | Optional complete cover, plus the full approved description in a Rich content boundary. Do not reuse a 255-character teaser, invent a cover or crop away publication identity. Missing cover leaves no empty media stage. A wide-screen cover may sit alongside this content without changing the logical sequence. |
| 3 | Files (read / access / download) | A labelled list of genuinely available resources after the description, reached through the link under the cover, the cover and the "Files (N)" jump link in the header, preserving primary-versus-backup roles and languages. Use descriptive native links; file metadata belongs to the resource it describes. The files section always follows the description and is reached from a "Files (N)" link in the header, the cover and the link under it; see [Order and the files heading](#order-and-the-files-heading). |
| 4 | Bibliographic details | A compact labelled group for remaining authors/issuing organizations, identifiers, edition/series and pagination where known. Avoid repeating the same attribution twice; a compact identity summary can link to a fuller list. There are no empty labelled rows or invented values. |
| 5 | Citation and sharing | Approved citation text or a clearly documented host-approved citation mechanism when available, plus approved stable-link sharing. Do not display the hidden Drupal citation field automatically. Without approved citation data/integration, retain usable bibliographic details and the record URL instead of fabricating a citation. |
| 6 | Optional context | Approved related resources, taxonomy and conditional policy/statement/resolution information. Retain their source meaning and privacy/domain decisions; they do not become universal metadata. Omit empty sections. |

On a wide screen a cover/details aside may accompany the description, but the reading sequence and information selection stay the same. The proposed geometry does not create a new archetype or a published reusable `PublicationRecord` component. The experimental story owns its layout and does not satisfy the consumer-integration gates below.

## Semantic and adapter requirements

This table records adapter decisions to implement and verify later; it does not define renderer props.

| Information | Required interpretation |
| --- | --- |
| Authors | Preserve the authored names, their order and multi-value structure. The inspected `field_authors` string formatter is unlinked. Do not split people on commas or replace authors with organization sources. |
| Issuers / sources | Preserve the multi-value `field_organization` references and their source-approved links (`entity_reference_label`, linked in full display). “Source” is not automatically “author”, “publisher” or copyright owner; use a more specific role only when supported. |
| Publication year/date | Use the actual `field_year_only` year as publication year when supplied. Do not manufacture day/month precision, convert it into a boolean, substitute hidden `published_at` or legacy year fields, or label media/node creation time as publication time. A future source with a reliable full publication date may supply that date explicitly without rewriting its role. |
| Other dates | Keep policy validity (`field_date_time`, a year-range formatter), resolution/report date (`field_closing_date`, `j F Y`) and statement/speech date (`field_release_date`, `d M Y`) separately labelled and conditional. They are not fallbacks for publication year. A report's covered period is also distinct. |
| Identifiers | Preserve the authored symbol and ISBN/ISSN/DOI value. Treat a combined/untyped identifier as opaque unless its type is reliably established; do not guess a DOI link or parse every number as an ISBN. |
| Edition, series and pages | Display only approved known values. Do not derive edition or page count from a title, filename, download size or generic card projection. |
| Languages | Distinguish page/interface locale, work language and each attachment language. Use attachment taxonomy names/codes where available; missing/legacy language stays unknown, not the page's language. Apply `lang`/`hreflang` only with a reliable value. |
| Description | Preserve approved substance and qualifications, with the host's sanitization policy for trusted formatted editorial HTML. Do not reuse Smart Trim as a canonical record description or apply arbitrary client-side slicing. |
| Access and URLs | The adapter owns canonical/source-domain resolution, field/media access and safe URL handling. An available CMS field is not automatically public. Preserve access decisions and cache/permission boundaries; no fabricated public link or automatic file mirroring. |
| Citation | Decide the approved bibliographic source and stable work/record URL explicitly. A landing URL, node language, hidden field or filename alone does not establish a citation contract. A future integration may reuse CiteThis after fixture/rendered-output validation; this spec does not ship it. |

### Resource states

- **External plus local file:** preserve the source's primary external Access/Watch route and separately labelled locally hosted backup. Local format/size metadata must describe the local file, not promise the external resource is byte-identical or the same version.
- **Local file only:** offer the genuine internal download as the primary action. Use the host-resolved media download route, not a guessed original storage path.
- **External only:** offer truthful external access; use Watch only for a supported video destination. Show format, size and language only when known. Do not invent a PDF extension, local backup or file size.
- **No public resource:** keep the bibliographic record useful. Omit the empty action region, or show a source-approved availability/access statement if supplied. Do not fabricate a disabled Download button, infer an embargo from the clock or expose an inaccessible media URL.
- **Multiple resources:** preserve editorial order and distinguish language, edition and format without assuming one file per language. Keep each resource and its backup together in a semantic list.

The inspected template opens resource links in new windows with `rel="noopener"` and an accessible warning. Preserve the host's reviewed policy and communicate the actual behaviour; this spec does not introduce a different global new-window rule. A linked cover follows the same policy as the first resource link; see [Cover link and download cues](#cover-link-and-download-cues). Retain meaningful action names and file context in accessible names, not icon/colour-only affordances. A format badge alone does not identify an available file.

The source attachment template labels a status line “Last checked”, but the preprocessing value is media **creation time**, not a verified link-check event. The proposed record omits that assurance until a genuine check timestamp/process is supplied, or uses an accurately labelled source date after editorial approval. It must not turn creation time into a claim of verification. The record shows that date as "Added" in Bibliographic details; see [Adaptive resource presentation](#adaptive-resource-presentation).

## Cover link and download cues

Decided for [#1502](https://github.com/unisdr/undrr-mangrove/issues/1502), November 2026. Readers on PreventionWeb publication pages click the cover expecting the document ([web-backlog#3351](https://gitlab.com/undrr/web-backlog/-/work_items/3351)). Drupal ships an interim answer in [drupal-base!268](https://gitlab.com/undrr/drupal-base/-/merge_requests/268) (UNDRR-6.4). This section records what the record pattern does so the Drupal move to the record ([web-backlog#3362](https://gitlab.com/undrr/web-backlog/-/work_items/3362)) can implement it directly. Points 1, 3, 4 and 5 keep the interim's behaviour. Point 2 replaces the interim's hover shadow with a hover outline and a destination badge. Like the rest of this spec, it is demonstrated in the experimental story only.

| Resources | Cover | Link under the cover |
| --- | --- | --- |
| None | Not linked | Not shown |
| 1 | Links to the first primary resource | "Download options" |
| 2 or more | Links to the first primary resource | "All downloads (N)" |

### 1. The cover links to the first primary resource

**Decision.** The cover links to the same URL as the first primary resource link: the publisher's copy when there is one, otherwise the hosted copy. It never links to a hosted backup when a publisher copy exists, and it is not linked when there are no resources.

**Why.** The cover must not add a selection rule of its own; otherwise it can disagree with the resource list. In the story, `coverAccess()` in `recordAccess.js` reads the first item of the same projected resource list that the list renders, so they cannot drift apart. Drupal reaches the same result with one helper that both the cover and the download box call. The projection already keeps a backup out of the primary slot ("a backup cannot silently become the primary access route"), so "first primary" never resolves to a backup.

**Origin.** Each primary resource is marked `publisher` (the external copy) or `hosted`. Adapters must supply it; Drupal knows which field each link came from, and a missing origin is an adapter error. The story fills a gap only where the data settles it: a primary with a hosted backup is the publisher copy, and a root-relative URL is hosted. An absolute URL with no origin could be either (a hosted file can be linked as `https://www.undrr.org/media/123/download`), so the story warns in development and treats it as hosted. That keeps the analytics label an internal click instead of claiming an external publisher.

**Alt text.** The cover keeps the alt guidance above: empty alt when the cover only repeats the title, real alt text when it adds information. The link is drawn over the image instead of wrapping it, so informative alt text stays exposed even though the link itself is hidden (point 4).

### 2. A badge appears on hover only

**Decision.** When a pointer is over a linked cover, a small round badge appears in its bottom inline-end corner (bottom right in LTR, bottom left in RTL), and the cover gets a focus-ring-width outline in the interactive colour. The badge uses the existing `download` icon for a hosted copy and `external-link` for a publisher copy, in the interactive colour with a white ring. Both appear only under `@media (hover: hover)`. When the cover isn't hovered, and on touch devices, the cover shows no badge.

**Why.** A permanent icon on top of a publisher's cover can be unwelcome. It can clash with the cover art or get lost in it, and the cover is the publisher's identity. Most readers already expect clicking a cover to open the publication, so the icon is only a hint, shown on hover. The labelled resource list and "All downloads (N)" stay the real, always-visible ways in. Matching the icon to the destination tells a pointer user whether they'll stay on the site or leave it. Both icons are Lucide icons already in the Mangrove set. The outline is kept so the whole cover reads as one click target, not just the badge.

- **Touch.** There's no badge and no hover outline on touch, which is accepted. Touch readers can still tap the cover, and the resource list (which comes first) and the jump link carry access. Gating both on `(hover: hover)` keeps a tapped cover from leaving a stuck badge.
- **Keyboard.** There's no focus state to design. The link is `aria-hidden` with `tabindex="-1"`, so it is never in the tab order (point 4).
- **Decorative.** The badge sits inside the hidden link, so it has no accessible name and adds no new strings.
- **Forced colours.** On hover, the badge is a `Canvas` circle with a `LinkText` border and a `LinkText` icon, and the outline uses system colours.
- **Motion.** The badge and outline appear instantly, with no transition, so reduced motion needs nothing extra ([motion guidance](MOTION.md): hover feedback may be instant).
- **RTL.** The badge uses logical insets. Neither icon is in the icon system's RTL mirror list, so neither flips.
- **Size.** The badge is 2.25rem. The click target is the whole cover, not the badge.
- **New windows.** The cover opens its target the same way as the labelled link it duplicates. A publisher link opens in a new tab (`target="_blank"`, `rel="noopener"`), so the cover does too; a hosted copy opens in the same tab, and so does its cover ([Adaptive resource presentation](#adaptive-resource-presentation)). The labelled link carries the spoken "opens in new tab" warning. The cover's only visual cue is the external-link badge on hover, a gap shared with the Drupal interim.
- **Resource list.** A publisher link in the row or table ends with the same `external-link` icon, so the badge and the list use one cue for "leaves the site".

### 3. A link under the cover, always

**Decision.** A linked cover always has a text link under it, which jumps to the "Files" heading after the Description. With two or more resources it reads "All downloads (N)": N counts primary resources, and backups are not counted separately. With one resource it reads **"Download options"**, because "All downloads (1)" would be odd and the section offers the file and, usually, a backup. Both use `nav_all_downloads_cover`. There is no modal. When the table is filtered by language, the link first resets the filter to All (see [Adaptive resource presentation](#adaptive-resource-presentation)).

**Why.** A reader who sees one cover can't tell how many files the record has, and the cover only reaches the first one. Readers who look under the cover for the files should always find a link there, so it no longer depends on the count. With the files section after the Description, a single-file record also has three routes to its file: the cover, the link under it, and the header's "File (1)" jump link. A modal or menu would be a second download interface to keep in step with the list; an in-page link keeps one list and only points at it.

**Plurals.** The string has CLDR plural forms, chosen with `Intl.PluralRules` for the interface language, as in the search widget's labels. The count is written in ASCII digits, as Drupal's `@count` is, so locales such as `ar-EG` don't switch to Arabic-Indic digits. Arabic supplies all six forms. The English, Arabic, Spanish, French, Japanese and Chinese strings are the drupal-base!268 translations. Russian is a draft that needs review. The `one` forms (and Arabic `zero`) are never shown by this rule, but they are kept so the catalogue matches Drupal's.

**Placement.** The cue sits directly under the cover, in the same analytics region. On narrow screens the aside stacks after the main column, so the cue then points back up the page. That still works, but it matters less there because the resource list already comes first.

### 4. Accessibility: the cover link duplicates the labelled link

**Decision.** Keep the duplicate-link approach: the cover link has `aria-hidden="true"` and `tabindex="-1"`. Keyboard and screen-reader users use the labelled resource links, which come first in the reading order. "All downloads (N)" is an ordinary focusable link with visible text.

**Why.** The cover link goes to the same place as the first resource link, which has a full name with title, language and format. Exposing both would add a tab stop and a second, weaker link name for the same action. The alternative, giving the cover link its own name such as "Download: [title]", would duplicate the labelled link for screen-reader users and still need a new translated string.

**Known limits.**

- Voice-control users can't target the cover by name, because hidden links have no name. They can say the visible name of the labelled resource link, or use grid or mouse-grid commands to click the cover. Nothing is lost, but the cover is not a voice target.
- Because the link is drawn over the image, the image is no longer a separate click target, so a browser's "open image in new tab" menu applies to the link. A long-press on touch devices also acts on the link.
- Without CSS the overlay link is empty and the cover is just an image; the labelled links still work.

### 5. Analytics: `download_`, `_cover` and `nav_`

**Decision.** Keep the drupal-base!268 names so reports carry over when the record replaces the interim. The access section is the region `undrr-download-box`; the cover and its cue are the region `undrr-download-box-cover`.

| Link | Region | `data-vf-analytics-label` |
| --- | --- | --- |
| Primary resource, publisher copy | `undrr-download-box` | `download_publisher` |
| Primary resource, hosted copy | `undrr-download-box` | `download_internal` |
| Hosted backup | `undrr-download-box` | `download_backup` |
| Cover, publisher copy | `undrr-download-box-cover` | `download_publisher_cover` |
| Cover, hosted copy | `undrr-download-box-cover` | `download_internal_cover` |
| "All downloads (N)" | `undrr-download-box-cover` | `nav_all_downloads_cover` |
| Language buttons / select | `undrr-download-box` | `nav_filter_language: <code>` / `nav_filter_language` |
| "Files (N)" jump link in the header | none (page header) | `nav_files_jump` |

**Why.** Each rule needs only one match. Region `undrr-download-box` (a prefix match, which also catches `-cover`) or label prefix `download_` finds every download click. Excluding `cover` leaves only the resource list. In-page navigation starts `nav_`, so it never counts as a download. Labels are fixed English strings with no counts, as in the [Collection page](https://mangrove.undrr.org/?path=/docs/patterns-collection-page--docs), so reports don't split by language or by number. The shared script's behaviour is unchanged; see [analytics](ANALYTICS.md).

### Checks recorded

- **Unit tests** (`__tests__/recordAccess.test.jsx`) cover target selection (publisher, hosted, publisher with backup, explicit origin, unsafe primary, no resources), the two-resource threshold, plural selection for every bundled language and all six Arabic categories, the anchor target, the analytics attributes and their prefix rules, informative alt text staying exposed, and axe on linked covers.
- **Browser checks** (play functions run by `yarn test-storybook`): on the standard story, the badge is hidden when not hovered, and the stylesheet reveals it only for `:hover` inside `@media (hover: hover)`. Play functions can't produce a real `:hover`, so the check finds that rule; replacing `:hover` with `:focus` makes it fail. With the badge forced visible, it sits in the cover's bottom inline-end corner in both LTR and RTL, and a click in the middle of the image lands on the link. On the long-content story, which includes the DOI `10.21953/researchonline.lse.ac.uk.00138625` after an Arabic-script identifier, the aside's boxes and text stay inside a 16rem rail in both LTR and RTL. That is measured in the real two-column layout: Vitest sets the viewport to 1164px, above the 900px article-grid breakpoint from [#1508](https://github.com/unisdr/undrr-mangrove/pull/1508). Storybook's UI can't resize, so there the check forces the grid's columns instead. Every record story also runs #1508's article grid check, composed with its own play. Each list item resolves its own direction (`dir="auto"` on every author, source and identifier), so the DOI stays LTR whatever comes before it. The aside and its metadata use `minmax(0, 1fr)` tracks and the record sets `overflow-wrap: anywhere`, so a long identifier wraps instead of widening the column. With the metadata track and `overflow-wrap: anywhere` removed, the check fails.
- **Manual screenshots** in LTR, Arabic RTL and emulated forced colours, with and without hover; see the pull request for what was and wasn't checked.
- Not done: testing with screen readers, voice control or real Windows High Contrast. These remain part of the acceptance outcomes below.

## Adaptive resource presentation

Decided for [#1505](https://github.com/unisdr/undrr-mangrove/issues/1505) and its follow-up, November 2026. On PreventionWeb and undrr.org a publication usually has two copies of each file: the original on the publisher's site and a backup hosted by UNDRR (Drupal's download box, `field--default--node--field-attachment.html.twig`, from [web-backlog#2363](https://gitlab.com/undrr/web-backlog/-/issues/2363) and [#2453](https://gitlab.com/undrr/web-backlog/-/issues/2453)).

A UX review measured the earlier stacked list at 237px for one file and 454px for three at 1378px wide. That pushed the Description below the fold. The repeated "What is a backup copy?", the stacked backup and fact lines, the large button and the date line cost the most. The presentation now grows with the number of files and languages.

The local Drupal database has 27,839 published publications:

| Files per record | Share |
| --- | --- |
| 1 | 88% |
| 2 | 7.7% |
| 3 | 1.8% |
| 4–5 | 1.4% |
| 6–10 | 0.9% |
| 11 or more | 57 records (the largest has 34, node 42346) |

### Tiers

The thresholds are named constants in `recordAccess.js` (`TABLE_FROM`, `LANGUAGE_FILTER_FROM`, `LANGUAGE_SELECT_FROM`), and each boundary has a test.

| Tier | When | Presentation | Measured at 1378px |
| --- | --- | --- | --- |
| 1 | 1 resource | One access row (in the Files section after the Description, like every tier): **Access {title}** ↗ (or **Watch**, or the plain title for hosted-only), then "Language · Format, size", then the backup as a download-icon link | 115px (was 237px) |
| 2 | 2+ resources, one language | A compact table with every row, no filters, no Language column. Columns: Title, Format / size, Original, Backup | 166px for 2 files |
| 3 | 2+ languages | Tier 2 plus a language filter ("All (N) \| English (k) \| …", default All) above the table, and a Language column while All is selected. From 6 languages the filter is a native `<select>` | 273px for 3 files in 2 languages (was 454px) |

- **Every row, always.** The table never collapses, and there is no text filter. Only 57 of 27,839 publications (0.2%) have 11 or more files, and 12 have 21 or more; most have 5 or fewer. The browser's find-in-page is enough to search a long table, but only if its rows aren't hidden. Table rows can't use `hidden="until-found"` (it has no effect on `<tr>` in Chromium: the row stays visible and isn't revealed by find-in-page), so a collapsed row would have to use plain `hidden` and would be unsearchable. That is why the collapse was removed rather than kept behind a text filter. It also means the server-rendered (vanilla) and React tables show the same rows.
- **Language filter.** It needs 2 or more languages to be useful, so a one-language record has none. A resource with no known language appears only under "All".

### Order and the files heading

**Decision.** One order for every tier: the Description always comes first, and the **Files** section (heading, language control, and the single row or the table) always follows it. A compact "Files (N) ↓" link under the header metadata (authors, sources, year) jumps to it at every width, including "File (1) ↓" for a single file. The link under the cover jumps there too ("All downloads (N)", or "Download options" for one file), resetting the language filter to All.

**Why.** It's consistent: the page has the same shape whatever the number of files, so readers and the Drupal template don't have to handle a moving section. The files stay findable from the top: the header's jump link names the count, the cover links straight to the first file, and the link under the cover is always there. An earlier draft kept the single-file row before the Description (it's only 115px, and 88% of records have one file), but a moving section cost more in consistency than it saved. This replaces the earlier rule that access comes before a long description.

**Heading.** "Files" replaces "Read or access this publication", which is gone. A short noun matches the jump link ("Files (3)") and the heading readers land on. "Download this publication" would mislabel publisher links that open a web page. The jump link uses CLDR plural forms (`filesJump`, separate from "All downloads" because the wording differs); the singular reads "File (1)" in English, French, Spanish and Arabic. Japanese and Chinese have one form, and Russian uses "Файлы (1)" because its `one` category also covers 21 and 31. The arrow is decorative text (`aria-hidden`); Mangrove's icon set has no down arrow. The heading has a scroll margin so the jump doesn't land flush against the viewport edge. Analytics: `nav_files_jump`.

### Rows and cells

- **Primary action.** The primary action column reads **Access** ↗ for a publisher copy, **Watch** ↗ on a video host (youtube.com, youtu.be, vimeo.com), or **Download** for a hosted-only row. Hosted-only rows show "—" in the Backup column, hidden from assistive technology.
- **Accessible names.** Each repeated action names its file: "Access {title} (opens in new tab)", "Download {title}". The title is visually hidden text after the visible verb, so the visible label starts the name (WCAG 2.5.3).
- **Backup link.** The backup is a download-icon link named "Download a backup copy hosted by this site: {title}", reusing the Drupal string with the title as hidden text, so every backup link is unique. On narrow screens a short visible "Backup" label appears beside the icon. The target is 28px in the table (above WCAG 2.5.8's 24px) and 44px in the tier-1 row and on narrow screens.
- **File facts.** File facts describe the hosted backup when there is one, because that is the file we host. Type and size never move between copies; language is inherited. Sizes are supplied text. Formats and sizes sit in `<bdi>`, and titles carry their own `lang` and `dir="auto"`, so Latin text reads correctly in RTL.
- **New tabs.** Publisher links open in a new tab with `rel="noopener"`, the `external-link` icon and hidden "(opens in new tab)". Hosted links open in the same tab, which is a deliberate difference from Drupal, which opens every attachment link in a new window. The cover follows the link it duplicates.
- **Title cells.** The title is the row header (`<th scope="row">`), as plain text. The mockups also made it a link; this design doesn't, so each row has one Access link and one Backup link rather than two links to the same file.

### Table semantics

The table has a visually hidden `<caption>` ("Files for this publication"), `<th scope="col">` column headers and a `<th scope="row">` title per row. Below 48rem each row is restyled as a stacked card (CSS grid), as in the mobile mockup.

Changing `display` on table parts drops their table semantics in some browsers, so the table also carries explicit ARIA table roles (`table`, `rowgroup`, `row`, `columnheader`, `rowheader`, `cell`). Screen readers still get rows and headers in card layout. I chose this over switching to a list on narrow screens because it keeps one structure, and the column headers name every cell. In card layout the column headers are visually hidden but still read. Language and facts share one line ("English · HTML, 360 bytes"); the separator is CSS generated content with empty alternative text.

### Language filter

- **Controls.** The filter is a native radio group: Mangrove's SegmentedControl. It is not the ARIA tabs pattern, because it filters one table rather than switching panels. Arrow keys move between options and select as they go, which is the browser's radio behaviour. From 6 languages the control is Mangrove's Select, with "All languages (N)" first. Every language option has at least one row, so a filter never empties the table.
- **Placement.** The control sits on the same row as the "Files" heading, at its inline end (right in LTR, left in RTL), in a wrapping flex row, for both the buttons and the select. When the row is too narrow (a long button group, or 390px), it wraps under the heading instead of clipping. This layout is local to the record; Mangrove has no shared inline label-and-control pattern, and this change doesn't add one.
- **No visible label.** The group's legend and the select's `<label>` read "Language" but are visually hidden. Mangrove's `languages` icon (the one the site header uses) sits before the control as a decorative cue (`aria-hidden`) in place of the visible label (WCAG 3.3.2). The hidden text is the accessible name, so voice control can still say "click Language".
- **Feedback.** Focus stays on the control. A polite live region announces "Showing {shown} of {total} files" at once when the language changes.
- **Language names in the select.** `<option>` elements can't carry their own `lang`, so in the select a language name such as "Français" is spoken in the interface language. The radio-group labels are ordinary elements, but they also inherit the interface language.
- **"All downloads (N)".** In tier 3 it resets the filter to All, and the anchor then moves to the "Files" heading after the Description. In tiers 1 and 2, and without JavaScript, it is a plain anchor. Its count is always the true total.
- **Cover.** The cover always targets the first primary resource in source order, whatever the filter.

### Vanilla and React

The server-rendered HTML is the contract for Drupal ([web-backlog#3362](https://gitlab.com/undrr/web-backlog/-/work_items/3362)). The only difference from React is the language filter: it renders only after the React component has mounted, so no control appears without a working script.

| Feature | Vanilla (server HTML, no script needed) | React |
| --- | --- | --- |
| Tier 1 row; tier 2–3 table with every row and link | Yes | Yes |
| Caption, scoped headers, ARIA table roles, mobile cards (CSS) | Yes | Yes |
| Find-in-page reaches every file | Yes | Yes (rows in the selected language) |
| Language filter (buttons or select) and live count | No; not rendered | Yes |
| "All downloads (N)" | Plain anchor | Resets the filter to All, then jumps |
| Shared "What is a backup copy?" | Yes (`<details>`) | Yes |

A vanilla language filter would be a small enhancement that hides rows by language. I left it out: it would add a second filtering implementation to keep in step with React, and an unfiltered table already works. It can be added later if Drupal needs it.

### Shared explanation and date

- **"What is a backup copy?"** One shared `<details>` follows the row or table, rendered only if some resource has a backup. The text is the Drupal explanation, plus "Problems? Contact us." with the adapter's pre-filled contact URL, opening in a new tab. The per-file disclosure is gone. `<details>` works without JavaScript, and its visible label can be said by voice-control users.
- **"Added".** The date moves out of the access block into Bibliographic details, as "Added" with the date (the date the record's resources were added; Drupal's media creation date). Drupal labels it "Last checked", but it isn't a link check, so this spec doesn't use that label.

### Analytics

Every access link keeps `download_publisher`, `download_internal` or `download_backup` in region `undrr-download-box`. The new controls are navigation:

| Control | Label |
| --- | --- |
| Language buttons | `nav_filter_language: <language code>`. SegmentedControl appends the stable option value |
| Language select | `nav_filter_language`. Only the opening is recorded: the tracker listens to `mousedown`, which fires before a choice is made, so the chosen language isn't known |
| "Files (N)" jump link in the header (tiers 2 and 3) | `nav_files_jump` |

None of them starts `download_`. Count language-filter use by the prefix `nav_filter_language`, which matches both the buttons and the select. Split by language only from the buttons' `: <code>` suffix. The drupal-base tracker records `mousedown` only, so keyboard use of these controls isn't recorded. That gap is site-wide and pre-existing.

### Checks

- **Unit tests.** `__tests__/resourceTiers.test.jsx` covers tier boundaries (0, 1, 2, 5, 6, 11 and 34 files in one language; 5, 6 and 7 languages), language groups, filtering, each tier's markup and names, table semantics, RTL isolation, the shared explanation, "Added" in Bibliographic details, placeholders in every language, and axe. `__tests__/resourceFilters.test.jsx` covers the order (Description, then Files, plus the jump link, in every tier), the inline control with its hidden "Language" name and decorative icon, the radio group, the select, the live region, every row of the 34-file table being shown, "All downloads (N)" resetting the filter, the cover target under a filter, and the server-rendered (vanilla) markup having no filter and no collapse.
- **Browser checks.** In every tier the Description starts within 120px of the header, the files section follows it, the header's "Files (N)" link points at the files heading (which has a scroll margin), and the link under the cover is present with "All downloads (N)" or "Download options". In Many files, all 34 rows show; `window.find("Annex 30")` with wrap-around finds a late row; the language filter keeps focus and announces the count; "All downloads (34)" resets it to All. In Many languages, the select filters to one row.
- **Screenshots.** Every story at 1378px and 390px, plus Arabic.
- **Not done.** Screen readers, voice control, and real Windows High Contrast.

## Responsive and accessibility requirements

- One H1, logical section headings and semantic metadata/resource lists. Composed controls remain outside Rich content styling; preserve native focus/hover/visited states.
- Give the cover source-approved alternative text when it adds information. If it only repeats the adjacent work identity, use decorative empty alt text rather than announcing the title twice; do not use a filename as alt text. Preserve approved visible captions/credits independently.
- Stack the same reading sequence at narrow widths. A missing cover, short description or absent metadata group must not leave a blank column. Complete covers retain their natural ratio; do not turn the source's fixed portrait crop into a new default.
- Test all five themes with the existing font roles, contrast and focus tokens. Keep long titles, long author/source lists, typed and untyped identifiers, expanded labels and RTL usable without page-wide overflow.
- Make any unusually wide authored table/code block locally keyboard-scrollable. Do not hide essential metadata or downloads in a modal, hover tooltip, carousel or mandatory accordion.
- Resource link names include enough title/language/format context to distinguish choices. Use actual visible language text as well as reliable codes; flags are not language selectors. Describe new-window behaviour where the host actually uses it.
- Check keyboard order and target size, 320px reflow, 200% text sizing/400% actual zoom, forced colours, reduced motion and representative assistive technologies. Shared components do not remove the need to test their composition.
- If citation copying or another action is later enhanced, preserve its documented fallback, focus and status-feedback contract. Do not combine independent overlay lifecycles merely because the record can cite a work.

## Deliberate proposals and unverified boundaries

| Proposal | Relationship to the inspected source |
| --- | --- |
| Plain title, files after the description (reached through the cover link, the cover and the Files jump link) and a simpler one-column/mobile or cover/details composition | A proposed reader-oriented order, with the description first and a header jump link to the files for every record, rather than copying the source metadata strip, body-before-download sequence or three-column geometry. No Hero is required for an ordinary record. |
| Complete uncropped cover | Deliberate departure from Drupal `por` cropping, consistent with Mangrove's established publication media-role policy. |
| Explicitly labelled core bibliographic and resource information | Preserves distinct source meanings while making ordinary records easier to scan; it does not promote hidden fields or mandate every field configured for policies/statements. |
| Optional supplied standfirst | Experimental story capability derived from the news-entry introduction, not automatic promotion of hidden `field_short_description` or truncation of the full body. The adapter must obtain approved text or omit it. |
| Optional approved publication citation support | A future integration decision. It is not parity with the source's hazard-profile-only Drupal citation extra field/library and does not unhide `undrr_citation`; future Mangrove CiteThis reuse is a separate proposal. |
| Relabel the apparent “Last checked” assurance as “Added” | Decided in [Adaptive resource presentation](#adaptive-resource-presentation) to avoid representing media creation as a verified check. The Drupal template still needs the matching change. |

No production adapter, data migration, Gutenberg serialization, live-domain parity, accessibility certification or current deployment is established here. Keep Drupal extraction, eligibility and URLs in the consumer adapter; Mangrove owns the presentation requirements and shared component contracts. The teaser/card contracts remain separate and unchanged.

## Acceptance outcomes before promotion

1. **A distinct, approved record composition.** Readers can identify the work and find genuine resources without a campaign Hero or passing a long body. Approved omissions and departures preserve public historical content and distinct bibliographic roles; the result is clearly different from the curated report landing.
2. **Adapter and rendered evidence agree.** Real consumer fixtures and rendered output demonstrate authors versus sources, year/date/language/identifier semantics, original versus backup access, truthful availability/check information and reviewed URL/access/citation decisions. Hidden fields are not promoted by default, and a discovery manifest is not treated as a validator.
3. **The implemented composition and integration are reviewed.** Responsive/text-expansion, all-theme, RTL, keyboard, screen-reader, forced-colour and reduced-motion checks meet the agreed acceptance conditions with declared limits. The actual Drupal/template or applicable editor integration is demonstrated before publishing a callable renderer/import or claiming a round trip. Until then, the story composition remains experimental and production integration remains unimplemented.

## Implementation and verification checklist

1. Review the full display, field-group handling, theme overrides and access/domain selection at the target deployment revision; record any source drift from this audit.
2. Approve the proposed order and each departure, including complete covers, citation integration and truthful access/check-status language. Confirm which policy/statement extras remain public for the specific record.
3. Build adapter fixtures for minimal records, no cover, multi-author/source records, publication year only, distinct policy/statement dates, untyped identifiers, external-only/local-only/combined/no-file resources, multiple languages/formats and inaccessible media. Verify omissions rather than filling placeholders.
4. Validate real rendered output and metadata against those fixtures, including links, authors/source list structure, date roles, canonical/citation decisions and disclosure of new-window behaviour. A discovery manifest is not a validator or proof of production parity.
5. Review the experimental story composition using existing components/tokens before promoting it to a reusable renderer or consumer integration. Test themes, viewport/text expansion, RTL, keyboard, screen readers, forced colours and reduced motion with declared limits.
6. Validate the actual Drupal/template or editor integration separately. Only then publish renderer/import contracts or claim a Gutenberg round trip; keep existing report-landing routes compatible.

## References

- [Publication archetype](https://mangrove.undrr.org/?path=/docs/patterns-content-publication--docs) and [curated report landing references](https://mangrove.undrr.org/?path=/docs/patterns-content-publication-full-page--docs).
- [Building landing pages](LANDING-PAGE-GUIDE.md), [Drupal teaser baseline](CONTENT-TEASER-DRUPAL-AUDIT.md), [review checklist](REVIEW-CHECKLIST.md) and [experience principles](https://mangrove.undrr.org/?path=/docs/design-decisions-experience-principles--docs).
