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
| 2 | Read / access / download | A labelled list of genuinely available resources near the work identity, preserving primary-versus-backup roles and languages. Use descriptive native links; file metadata belongs to the resource it describes. Readers should not have to pass a long description to find the document. |
| 3 | Cover and description | Optional complete cover, plus the full approved description in a Rich content boundary. Do not reuse a 255-character teaser, invent a cover or crop away publication identity. Missing cover leaves no empty media stage. A wide-screen cover may sit alongside this content without changing the logical sequence. |
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

The source attachment template labels a status line “Last checked”, but the preprocessing value is media **creation time**, not a verified link-check event. The proposed record omits that assurance until a genuine check timestamp/process is supplied, or uses an accurately labelled source date after editorial approval. It must not turn creation time into a claim of verification. The record now labels that date "Added {date}"; see [Resource presentation](#resource-presentation).

## Cover link and download cues

Decided for [#1502](https://github.com/unisdr/undrr-mangrove/issues/1502), November 2026. Readers on PreventionWeb publication pages click the cover expecting the document ([web-backlog#3351](https://gitlab.com/undrr/web-backlog/-/work_items/3351)). Drupal ships an interim answer in [drupal-base!268](https://gitlab.com/undrr/drupal-base/-/merge_requests/268) (UNDRR-6.4). This section records what the record pattern does so the Drupal move to the record ([web-backlog#3362](https://gitlab.com/undrr/web-backlog/-/work_items/3362)) can implement it directly. Points 1, 3, 4 and 5 keep the interim's behaviour. Point 2 replaces the interim's hover shadow with a hover outline and a destination badge. Like the rest of this spec, it is demonstrated in the experimental story only.

| Resources | Cover | "All downloads (N)" |
| --- | --- | --- |
| None | Not linked | Not shown |
| 1 | Links to the first primary resource | Not shown |
| 2 or more | Links to the first primary resource | Shown under the cover |

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
- **New windows.** The cover opens its target the same way as the labelled link it duplicates. A publisher link opens in a new tab (`target="_blank"`, `rel="noopener"`), so the cover does too; a hosted copy opens in the same tab, and so does its cover ([Resource presentation](#resource-presentation)). The labelled link carries the spoken "opens in new tab" warning. The cover's only visual cue is the external-link badge on hover, a gap shared with the Drupal interim.
- **Resource list.** A publisher link in the list ends with the same `external-link` icon, so the badge and the list use one cue for "leaves the site".

### 3. "All downloads (N)" under the cover

**Decision.** With two or more resources, a text link under the cover reads "All downloads (N)" and jumps to the "Read or access this publication" heading. N counts primary resources; backups are not counted separately. There is no modal.

**Why.** A reader who sees one cover can't tell that the record has several files, and the cover only reaches the first one. A modal or menu would be a second download interface to keep in step with the list. An in-page link keeps one list and only points at it. With one resource the cover already reaches everything, so the cue would be noise.

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
| "Show all {count} files" / "Show fewer files" | `undrr-download-box` | `nav_show_all_downloads`, in both states (see [Long resource lists](#long-resource-lists)); mouse clicks only, as for every tracked click |

**Why.** Each rule needs only one match. Region `undrr-download-box` (a prefix match, which also catches `-cover`) or label prefix `download_` finds every download click. Excluding `cover` leaves only the resource list. In-page navigation starts `nav_`, so it never counts as a download. Labels are fixed English strings with no counts, as in the [Collection page](https://mangrove.undrr.org/?path=/docs/patterns-collection-page--docs), so reports don't split by language or by number. The shared script's behaviour is unchanged; see [analytics](ANALYTICS.md).

### Checks recorded

- **Unit tests** (`__tests__/recordAccess.test.jsx`) cover target selection (publisher, hosted, publisher with backup, explicit origin, unsafe primary, no resources), the two-resource threshold, plural selection for every bundled language and all six Arabic categories, the anchor target, the analytics attributes and their prefix rules, informative alt text staying exposed, and axe on linked covers.
- **Browser checks** (play functions run by `yarn test-storybook`): on the standard story, the badge is hidden when not hovered, and the stylesheet reveals it only for `:hover` inside `@media (hover: hover)`. Play functions can't produce a real `:hover`, so the check finds that rule; replacing `:hover` with `:focus` makes it fail. With the badge forced visible, it sits in the cover's bottom inline-end corner in both LTR and RTL, and a click in the middle of the image lands on the link. On the long-content story, which includes the DOI `10.21953/researchonline.lse.ac.uk.00138625` after an Arabic-script identifier, the aside's boxes and text stay inside a 16rem rail in both LTR and RTL. Each list item resolves its own direction (`dir="auto"` on every author, source and identifier), so the DOI stays LTR whatever comes before it. The aside and its metadata use `minmax(0, 1fr)` tracks and the record sets `overflow-wrap: anywhere`, so a long identifier wraps instead of widening the column. With the metadata track and `overflow-wrap: anywhere` removed, the check fails.
- **Manual screenshots** in LTR, Arabic RTL and emulated forced colours, with and without hover; see the pull request for what was and wasn't checked.
- Not done: testing with screen readers, voice control or real Windows High Contrast. These remain part of the acceptance outcomes below.

## Resource presentation

Decided for [#1505](https://github.com/unisdr/undrr-mangrove/issues/1505), November 2026. On PreventionWeb and undrr.org, a publication usually has two copies of each file: the original on the publisher's site and a backup hosted by UNDRR. Hosted-only records are the exception. The record now treats publisher plus backup as the standard case, following Drupal's download box (`field--default--node--field-attachment.html.twig` in drupal-base, from [web-backlog#2363](https://gitlab.com/undrr/web-backlog/-/issues/2363) and [#2453](https://gitlab.com/undrr/web-backlog/-/issues/2453)). Each resource is one list item:

| Case | Primary line | Under it |
| --- | --- | --- |
| A. Publisher + backup (standard) | **Access {title}** to the publisher URL, opening in a new tab | Backup line: **Download a backup copy hosted by this site**, then the file facts, then **What is a backup copy?** |
| B. Hosted only | **{title}** to the hosted file, then the file facts | Nothing |
| C. Publisher only | **Access {title}**, opening in a new tab, then the file facts when known | Nothing |
| Video host | **Watch {title}** instead of Access (youtube.com, youtu.be, vimeo.com) | As A or C |

**Primary and backup.** The publisher's original is the primary route because it is the authoritative copy. The backup is a quieter second route, indented under its primary with an inline-start rule, and never replaces an invalid primary. Its wording is fixed interface text, so a backup needs only a URL. The link's accessible name is that wording followed by the title in visually hidden text ("Download a backup copy hosted by this site: {title}"), so with several files each backup link has a unique name. The visible label stays at the start of the name for voice control, as Drupal's `aria-label` does. Its `hreflang` falls back to the resource's language. The cover still links to the first primary resource, never the backup.

**File facts.** File facts read "TYPE, SIZE · Language", for example "PDF, 1.6 MB · English". Unknown parts are dropped, and the line is omitted when nothing is known. With a backup, the facts sit on the backup line, because they describe the hosted file. Type and size never move from one copy to the other, because each describes one file. Language belongs to the document, so the backup inherits it when it has none. Hosted-only shows the facts on the primary line; publisher-only shows them only when known. Facts follow the interface direction so they line up under their link. The language name carries the file's language (`lang`, falling back to the resource's), so "Français" is pronounced in French. Sizes are supplied text, never computed.

**Verbs and new tabs.** "Access" and "Watch" are interface words around the title. The title keeps its own `lang` and `dir="auto"`, and each language places it where its grammar needs (`{title}にアクセス`). Publisher links open in a new tab with `rel="noopener"`, as Drupal does. They end with the existing `external-link` icon and visually hidden "(opens in new tab)" text. Hosted links open in the same tab, which is a deliberate difference from Drupal (which opens every attachment link in a new window): a download doesn't need a new tab, and an unexpected one is a known usability problem. The cover follows the same rule as the link it duplicates. A hosted-only link's accessible name is the title alone, the same as its visible text. Drupal's `aria-label` replaces it with "Download: {title} (opens in new window)". The record doesn't do that: a name that differs from the visible text breaks voice control (WCAG 2.5.3, Label in Name), and the link no longer opens a new window. The file facts that follow say it's a file.

**Backup explanation.** A native `<details>` element labelled **What is a backup copy?** reveals: "We keep a copy of many documents to improve long-term access. Use this if the publisher's site is slow or unavailable." It is followed by "Problems? Contact us." when the adapter supplies `contactHref`. Drupal pre-fills the contact form's topic, subject and the entry ID in that URL, and the adapter should do the same; the record only renders it. As in Drupal, the contact link opens in a new tab, so the reader keeps the record open while writing to us. It has the same external-link icon and hidden "(opens in new tab)" text as publisher links. The sentence ends with Drupal's full stop in Latin-script languages and Arabic, and with "。" in Japanese and Chinese, matching the ideographic full stops in those languages' explanation text (the `sentenceEnd` label). `<details>` was chosen over Drupal's `?` button with `aria-expanded` for several reasons. It works without JavaScript, which matters because the record must be usable as static HTML. Keyboard, screen-reader and forced-colours support come from the browser. Its visible text label is something voice-control users can say, which a "?" is not. The summary uses Mangrove's global `details > summary` focus ring. Drupal also attaches the explanation to both links with `aria-describedby`. The record doesn't, because the explanation follows directly in reading order and would otherwise be read on every pass through the link.

**Date line.** One line below the list reads **"Added {date}"**, for example "Added 15 March 2026". It gives the date the record's resources were added to the site, and like Drupal it shows in every case, including publisher-only and video records. Drupal labels this value "Last checked", but it is the media item's creation date, not a link check; this spec already says not to present creation time as verification. "Added" states only what the date is. The user may still change the wording. The date is a `<time>` element in the editorial-manual format, with Latin digits as Drupal prints them. It is shown only with resources and a valid ISO date.

### Long resource lists

**Decision.** A record with **3 or more** resources shows the first **2** resource groups in full (primary, backup, file facts and explanation). Groups 3 to N are hidden until a "Show all {count} files" button opens them; it then reads "Show fewer files". The numbers are two constants, `COLLAPSE_FROM = 3` and `VISIBLE = 2`, next to `showAllDownloads` in `recordAccess.js`, so they can be tuned in one place.

**Why.** In the local Drupal database there are 27,839 published publications:

| Files per record | Share |
| --- | --- |
| 1 | 88% |
| 2 | 7.7% |
| 3 | 1.8% |
| 4–5 | 1.4% |
| 6–10 | 0.9% |
| 11–20 | 0.2% |
| 21 or more | 12 records (the largest has 34, node 42346) |

Each group is about three lines, so the largest records run to about 100 lines and push the description and citation far down the page. One or two files are shown as they are. From three, the list collapses: the first two groups stay in view, and the button gives the true total. That threshold was the user's decision.

**How.**

- **True disclosure.** The collapse uses ShowMore's [items mode](https://mangrove.undrr.org/?path=/docs/components-showmore--docs), added in this change. It hides whole groups and never clips them. The list stays one `<ul>`, and groups 3 to N carry `data-mg-show-more-item`. When ShowMore runs, they get `hidden="until-found"`, so they leave the accessibility tree and the tab order. Screen-reader users hear two items and a button that really reveals the rest. Earlier drafts used ShowMore's default, visual-only collapse. That kept all 34 groups in the accessibility tree behind a toggle that changed nothing they could perceive, split the list in two, and let Shift+Tab land on a control 3,500px off-screen.
- **Button.** The toggle is a `<button>` after the list, with `aria-expanded` and `aria-controls`. Enter and Space work it. When the reader opens the list, focus moves to the first link of group 3, and `focus()` scrolls it into view. Before this, a real Enter on the 34-file story scrolled to the button at the end of the list and left the reader past everything revealed. Shift+Tab from there returns to group 2. Closing moves focus to the button from a group that is being hidden. The button needs no hidden context, because it sits inside "Read or access this publication" and its text names what it shows.
- **Find in page.** In Chromium, find-in-page searches `until-found` content and fires `beforematch`, which opens the whole list and keeps the label and `aria-expanded` true; focus stays with the browser. This depends on ShowMore's CSS overriding normalize's `[hidden] { display: none }`; without it the browser never searches the groups. A host stylesheet with `[hidden] { display: none !important }` defeats it (see the ShowMore docs). Browsers without `until-found` use plain `hidden`, where find-in-page can't reach hidden groups until the list is opened. A text-fragment link matched during page load, before the script hides the groups, won't open the list.
- **Without JavaScript.** The groups ship visible and the button ships `hidden`, following ShowMore's documented pattern. Every group shows and no dead button appears.
- **Host integration (web-backlog#3362).** The toggle doesn't opt out of auto-init, so a host page only needs to load `show-more.js`. It initialises `[data-mg-show-more]` toggles on `DOMContentLoaded`. Markup added later can call `mgShowMore(toggle)`, which is idempotent.
- **"All downloads (N)".** The cover cue always shows the true total. If the list is collapsed, its click handler opens it with `mgShowMoreSetOpen(toggle, true)`, without a synthetic click, and the browser then follows the anchor to the resources heading. Without JavaScript it is a plain anchor to an open list.
- **Analytics.** The button carries `data-vf-analytics-label="nav_show_all_downloads"` in both states (ShowMore keeps an author-set label). It is navigation, so it doesn't start `download_`. The drupal-base click tracker listens for `mousedown` only. So it records a mouse click on the toggle; when "All downloads (N)" opens the list, it records only `nav_all_downloads_cover`; and it never records keyboard activation (Enter or Space) of any toggle. That last gap is site-wide and pre-existing.
- **Stories.** "Several files" (3 resources) shows the collapsed state with 2 visible. "Many files" models node 42346 with 34 resources: publisher + backup, every fourth hosted only, and some French and Spanish annexes.

**Checks.** `__tests__/resourcePresentation.test.jsx` covers verb selection (including look-alike hosts), file-fact text and placement for each case, new-tab attributes and icons, the closed-by-default disclosure and its contact link, the date line, analytics labels on every link, and title placement in Arabic, Japanese and Chinese. It checks every story in every interface language for unfilled placeholders, and runs axe with the explanation open. Screenshots cover LTR, Arabic RTL, the explanation opened with the keyboard, and emulated forced colours. Screen readers and voice control were not tested.

**Analytics.** All links sit in region `undrr-download-box`. The labels are `download_publisher` for a publisher primary (including Watch), `download_internal` for a hosted-only primary, and `download_backup` for a backup, matching drupal-base!268. The contact link in the explanation is `contact_download_help`: it isn't a download, so it doesn't start `download_`. That name is new and open to review.

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
| Plain title, early resource access and a simpler one-column/mobile or cover/details composition | A proposed reader-oriented order, including access before a potentially long body, rather than copying the source metadata strip, body-before-download sequence or three-column geometry. No Hero is required for an ordinary record. |
| Complete uncropped cover | Deliberate departure from Drupal `por` cropping, consistent with Mangrove's established publication media-role policy. |
| Explicitly labelled core bibliographic and resource information | Preserves distinct source meanings while making ordinary records easier to scan; it does not promote hidden fields or mandate every field configured for policies/statements. |
| Optional supplied standfirst | Experimental story capability derived from the news-entry introduction, not automatic promotion of hidden `field_short_description` or truncation of the full body. The adapter must obtain approved text or omit it. |
| Optional approved publication citation support | A future integration decision. It is not parity with the source's hazard-profile-only Drupal citation extra field/library and does not unhide `undrr_citation`; future Mangrove CiteThis reuse is a separate proposal. |
| Relabel the apparent “Last checked” assurance as “Added {date}” | Decided in [Resource presentation](#resource-presentation) to avoid representing media creation as a verified check. The Drupal template still needs the matching change. |

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
