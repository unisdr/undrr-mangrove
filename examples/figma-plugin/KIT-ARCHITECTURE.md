# Figma kit organisation and update contract

Updated 4 October 2026 after designer review and a native migration attempt. **This acceptance gate remains open.** Section migration and reconciliation are implemented locally, but native migration is blocked by an unavailable existing font. Table grid compaction and separation from Review are accepted within the native scope below. Complete the remaining gate before expanding the catalogue.

The subsequent [user experience review](UX-REVIEW.md) finds that the planned six-section migration still leaves discovery and family-level comparison problems. It proposes task-based component groups, nearby examples, clear readiness labels and a separate maintenance destination. That proposal is not implemented; changing destination identities requires a reviewed versioned migration. The novice task targets below supplement the existing structural and preservation gate.

## Why the Table selection is so large

The purple selection in the reported screenshot is the Table component set, containing eight variants. Selecting a set includes the empty space between its variants. It does not mean that the neighbouring Review examples are Table children.

The preceding builder had two layout defects:

1. Every variant uses a grid cell based on the largest width and largest height in the family. Table variants range from about 148px to 1,117px high, so the small tables inherit very large empty row gaps.
2. `Mangrove / Main components` has a fixed 1,200px width, while Table's set is 2,328px wide and clipping is off. The Review root was positioned beside the nominal main width when first created; later growth does not reposition it. Table therefore extends into the Review area.

The pre-change inspection confirms a 2,328 × 3,518.34375px Table set, a 1,200px main root and a Review root beginning within the Table set's horizontal extent. Individual component acceptance does not establish a usable canvas layout. Clipping the main frame would hide the defect rather than repair it.

## Implementation and native checkpoint

`kit-layout.js` implements the six SECTION destinations below, variable-bound colour and spacing specimens, five available Regular text-style specimens, family/source headings, explicit missing page-pattern coverage, compact grids and versioned reconciliation. It moves whole canonical sets and existing review-family frames under stable presentation keys; it does not recreate their anatomy. **Organize file** applies the initial migration. Ordinary desktop builds subsequently reconcile it. **Kit destination > Go** navigates without producing build evidence.

Native section migration did not complete. Reparenting the legacy auto-layout main root requires its existing `Roboto Condensed` Bold face. All 26 existing TEXT nodes with that face report a missing font. Exact loading fails. A bounded experiment fixing only the main presentation root's primary sizing also failed to append; its original fields were restored exactly. No font was substituted, installed or reassigned.

The first attempt created 74 presentation nodes before the native append failure. Its saved partial receipt supports explicit recovery. Exact cleanup removed those 74 nodes, retained none and restored all 6,453 pre-existing inspected assets byte-for-byte in their saved field records. The production runtime now loads all required existing managed fonts before writes, and the same refusal creates or updates zero nodes. Never delete a mixed or partially migrated section as a shortcut; use its exact receipt and fresh inspection.

The smaller native correction succeeded without moving the font-blocked subtree. A Table build updates its four dependency families and their grids, creates zero nodes, updates 199 and reports zero errors. Initial compaction measured 1,504 × 1,632.703125px. Native visual review then separated short-state rows from Story/NarrowStory, removing the remaining wide column gap. Table now measures **1,108.703125 × 1,632.703125px** and fits the legacy main frame. Review moves beyond the measured main render/direct-child extents, with a measured 112px rendered gap (the rule requires at least 80px). Canonical variant and descendant dimensions, local source anatomy, property IDs, fonts, style associations, paints, aliases, instance links and existing review-local content/placement remain unchanged. Only presentation-set grids, the main root's resulting HUG height and Review's page position change. Two ordinary repeats, including a plugin restart, retain all resulting saved asset records exactly. Independent verification passes 6,019 checks with zero failures and retains all 6,453 original asset IDs. Native review confirms the compact rows at 77% zoom. A fresh local backup is saved; cloud synchronisation remains unconfirmed.

The main root still has its legacy nominal width, and the six-section reading sequence is not yet present in the native file. Mock coverage proves migration, two repeats, bounded source propagation, inherited instance ownership, manual preservation, conflicts and interrupted/restarted recovery; it does not establish native hierarchy acceptance, all-family rendered containment or novice usability.

## Welcome checkpoint

A branded, source-bound welcome board and persistent **Open Start here** action are now implemented. This can give a novice an entry point before the font-blocked migration: a reading sequence, Assets/instance instructions, supported and pending scope, brand limitations, and the maintenance boundary. It is not a substitute for the six-section organization. `welcome` and its generated child identities survive reruns and later reparenting into `layout/start`; direct manual root notes are preserved. Historical focus diagnostics are spaced beyond legacy content using x/y only and a stable rendered-bounds anchor.

Desktop access recovered on 4 October 2026. Native Welcome is now applied and reviewed at 100% zoom: 1,440 × 1,169px, 23 new guidance nodes, one historical diagnostic x/y move and a 160px rendered gap. All 6,453 original inspected asset IDs remain; source/component/style/variable records and diagnostic-local anatomy are unchanged. Two final zero-create repeats, including a plugin restart, retain all 6,476 resulting inspected asset records exactly. Independent verification passes 19,482 checks with zero failures, including live-alias/literal paint agreement. Document-free navigation works, and a fresh local backup is saved. Cloud sync, reopening persistence, a file thumbnail, native manual-note tests and novice handoff are not established.

- [x] Standalone creation, restart/rerun identities, direct manual-note preservation, typed variable/font/ownership refusals and later full-migration reuse pass the actual-runtime mock.
- [x] Apply to the native file after a fresh backup and inspection; capture exact affected IDs and unchanged source/consumer records.
- [x] Review the welcome board at normal zoom for readable headings, unclipped cards and the correct brand. Novice usability is a separate gate.
- [x] Match contents to actual owned destination names and Layers order; exclude absent planned sections. Native correction is reviewed at 100% zoom, measures 1,440 × 1,223px, creates zero nodes and retains all 6,476 inspected asset IDs. Non-Welcome records are unchanged and a repeat preserves the complete result. The mock also verifies switching to actual section names after migration.
- [x] Confirm historical diagnostics clear Main, Review and Welcome without changing child geometry or fonts.
- [x] Keep maintenance diagnostics last in legacy Layers. Native first update and repeat create zero nodes, preserve all 6,476 inspected asset IDs, retain exact diagnostic/component/style/variable records and other-root order, and update only the index text. The final 100% view shows the collapsed diagnostic root last. Placement in the pending-work section remains part of the full migration gate.
- [x] Repeat from a plugin restart, create zero duplicate nodes, and navigate Start here without loading JSON.
- [ ] Add a native manual note and verify its preservation through update and later section migration.
- [ ] Ask a novice to find a foundation, component, composition and pending item; retain the broader designer-handoff gate below.

## Intended reading sequence

Use numbered native sections on the existing page for the first migration. These are named destinations in the Layers panel, with headings and a visual index. Multiple pages can follow when useful, but building on another page currently creates a separate scope, not a migration. Do not require a paid plan merely to make the local kit understandable.

| Destination                         | What a designer finds                                                                                                                      | Ownership                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| **00 Start here**                   | Purpose, current brand, supported core, acceptance labels, how to insert/edit components, links to Storybook and maintenance, visual index | Generated skeleton; separately identified manual guidance                      |
| **01 Foundations**                  | Colours and semantic roles, typography, spacing, radii, shadows/focus, layout rules and eventually icons/logos                             | Source-generated specimens; manual usage annotations                           |
| **02 Components**                   | Reusable controls and content elements, grouped by task, with compact variant sets and nearby instance-based examples                      | Generated main components and generated review examples in distinct containers |
| **03 Compositions (organisms)**     | Table with rows/cells, ComboBox with options, Text CTA, TOC and Segmented composition; documented dependencies and supported edits         | Generated source-backed compositions and examples                              |
| **04 Page patterns**                | Clearly labelled article, landing, search/results and form examples as they become accepted; current missing coverage listed               | Explicit generated recipes or designer-owned instances; ownership labelled     |
| **90 Diagnostics and pending work** | Temporary tests, known font/style failures and unsupported assets, visually separate from the usable library                               | Explicit diagnostic ownership and exact cleanup records                        |

Table rows and cells remain real reusable dependencies, with links from Table's documentation. Their physical grouping must not change the dependency model. A composition and a page example are distinct deliverables; do not invent empty production components to fill the index.

Tokens remain variables in the Variables interface. Foundations specimens explain those variables on the canvas. Start with the current collection and aliases; a Primitives/Brand collection split is a separate migration decision.

## Layout rules

- Size each variant row from the variants in that row, rather than the tallest variant anywhere in the set. Use measured column widths and explicit padding/gaps. Arrange or label extreme content presets separately within the family where useful.
- Fit generated containers to their actual child extents, including declared overflow. Place neighbouring sections from their measured bounds after layout. Check both selection bounds and rendered overflow; a nominal frame width is insufficient.
- Keep main components, review instances, manual examples and diagnostics visibly distinct. Shared dependencies stay linked; no detachment or duplication is needed for presentation.
- Use readable headings, source/usage descriptions, consistent labels and a visual index. Verify at normal zoom with someone unfamiliar with the file. A vertical build-order dump is not the intended designer navigation.
- Restrict automatic repositioning to generated containers and main-component presentation. Preserve section-local placement of manual additions; a containing generated section can move as its contents grow. Preserve absolute placement of unowned page roots. Do not change reusable component internal geometry as a side effect of tidying the canvas.

## Automatic and manual synchronisation

This table defines the maintenance boundary. Section migration and reconciliation are implemented and mock-tested; native acceptance remains open.

| Change                                               | Automatic update contract                                                                        | Manual or reviewed step                                                                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Token values and aliases                             | Import into existing variable IDs, maintaining valid aliases and style bindings                  | Review affected brands and rendered consumers; skipped values and fonts remain explicit issues                                    |
| Existing component visuals/anatomy under stable keys | Update existing sets, variants, properties and nested dependencies in place                      | Review affected consumer overrides and source fidelity; stable paths do not make arbitrary anatomy refactors safe                 |
| Canvas section or family placement                   | Reconcile a versioned generated layout; preserve main, variant, property and instance identities | Perform the first migration from the existing page; capture a baseline and explicitly map old container locations                 |
| Generated review specimens                           | Create missing specimens; preserve existing edited content on an ordinary update                 | Review changed seed content; use explicit reseeding or supported refresh when intended                                            |
| Documentation                                        | Update separately keyed generated headings, metadata and source examples                         | Keep manual annotations and designer examples in identified, preserved areas; never replace a whole mixed-content frame           |
| Family, variant, property or anatomy rename/removal  | Report a migration or retirement requirement                                                     | Supply an explicit old-to-new mapping and test existing overrides before applying it; no automatic name-based recreation/deletion |
| Designer-authored page/example                       | Existing linked instances inherit accepted main-component changes                                | Designer reviews composition, content, crop, layout and interaction; plugin does not regenerate the page from its appearance      |
| Published library update                             | Later: publish accepted assets and offer updates to consuming files                              | Maintainer describes release; consumers review/accept updates and verify preserved overrides                                      |

Current anatomy identity includes name paths. A display rename or reparenting can therefore change keys unless a migration preserves the existing identity. Ownership remains indexed on the current page. The layout-aware desktop builder now respects the generated section hierarchy; the bounded connector runtime refuses organized-kit writes because it lacks the layout module. Moving frames manually or running an older runtime does not establish a durable migration.

Use explicit immutable presentation keys independent of section titles, with a versioned migration map for existing roots. Keep the currently proven component keys. Distinguish inherited metadata on normal instances from canonical ownership using the existing validated main-component check. Reject duplicate, missing or conflicting ownership before migration writes. Do not adopt unrelated objects by their names.

## Acceptance criteria before designer handoff

- [ ] A novice can locate foundations, a component, a composition, page patterns and pending work from Start here and the Layers panel without understanding build order.
- [ ] Contents, Layers and plugin navigation agree about available destinations. Planned routes are omitted or explicitly marked unavailable before migration.
- [ ] A user can find a complete widget without first navigating its supporting parts, compare its nearby states and identify supported edits. Current scope descriptions agree with the accepted bounded evidence.
- [ ] A user can locate and create personal work outside generated containers, insert/edit a linked instance without changing its main, and complete the six [novice task targets](UX-REVIEW.md#proposed-novice-acceptance-tasks) with the plugin initially closed and no coaching. Record outcomes and assistance; the targets are not current results.
- [ ] Table's variant grid has row-specific spacing, fits its containing section, and does not intersect unrelated sections or Review examples. Check all families, not just Table, at normal zoom.
- [ ] Existing canonical IDs, property IDs, variable/style bindings and nested instance links survive the hierarchy migration. No detach/recreate shortcut.
- [ ] Two ordinary reruns create no duplicate sections, sets, variants or review specimens and retain manual guidance, edited consumer content and designer-owned placement.
- [ ] A bounded source change updates the affected component and its dependent composition; unrelated assets and manual areas remain unchanged. New families enter their declared destination once, with a visible acceptance label.
- [ ] Rename/removal conflicts produce an actionable migration report. Verify a refusal before writes and a deliberate mapped migration with existing overrides.
- [ ] Save pre/post inspection and operation records, visually review the reorganized file, and repeat from a plugin restart. Mock success alone is insufficient.

## Remaining mature-kit deliverables

After the organisation gate, track these as separate accepted scopes: visual foundation sheets and layout presets; searchable source icons/logos; broader component and composition coverage; realistic page examples; Condensed font/Tabs and Editorial CTA repairs; wider content/resize/variant-switch acceptance; accessibility guidance and contrast review; other brands and Arabic/RTL; optional prototype interactions; and published-library consumption and release practices. Code Connect is optional later integration.

See [core status](CORE-KIT-STATUS.md) for bounded component evidence and [the inventory](COMPONENT-INVENTORY.md) for source coverage. A plan upgrade enables additional distribution/theme capabilities, but does not repair organisation, fonts or update architecture.
