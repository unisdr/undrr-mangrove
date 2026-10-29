# Publication record specification

> **Provisional; experimental story composition only.** This specifies an ordinary bibliographic publication record within the existing Publication archetype. The [record prototype](https://mangrove.undrr.org/?path=/docs/patterns-publication-record--docs) now demonstrates the proposed hierarchy in story-owned source. It adds no published renderer, package import, canonical schema, Gutenberg block, production adapter or claim of production parity. The current [Publication full-page references](https://mangrove.undrr.org/?path=/docs/patterns-content-publication-full-page--docs) demonstrate curated report landing pages instead.

Reviewed 29 October 2026 for [PR #1436](https://github.com/unisdr/undrr-mangrove/pull/1436), tracked in [#1432](https://github.com/unisdr/undrr-mangrove/issues/1432). Drupal was inspected read only; no Drupal configuration or content was changed.

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

The inspected themes share the common full layout/attachment foundations through inheritance (PW/UNDRR/GP from common, IRP from PW), but surface expression and some contextual output differ. IRP publication styling hides domain badges; GP statement rendering adds source identifiers. PW's title truncation block is disabled. These observations do not establish visual parity across sites or authorize copying their theme-specific CSS into the shared record presentation.

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

The inspected template opens resource links in new windows with `rel="noopener"` and an accessible warning. Preserve the host's reviewed policy and communicate the actual behaviour; this spec does not introduce a different global new-window rule. Retain meaningful action names and file context in accessible names, not icon/colour-only affordances. A format badge alone does not identify an available file.

The source attachment template labels a status line “Last checked”, but the preprocessing value is media **creation time**, not a verified link-check event. The proposed record omits that assurance until a genuine check timestamp/process is supplied, or uses an accurately labelled source date after editorial approval. It must not turn creation time into a claim of verification.

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
| Omit or relabel the apparent “Last checked” assurance | A proposed correction to avoid representing media creation as a verified check. Needs an approved consumer decision before migration. |

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
