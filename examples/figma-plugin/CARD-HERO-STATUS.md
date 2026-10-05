# Card, Hero and planned catalogue

This checkpoint adds source scaffolds for two content patterns. The existing **25-family core preset stays unchanged**. New families are labelled **Draft component** in the importer and native browsing, with their own acceptance boundary.

## Component scope

| Pattern | Source families         | Initial variants                                                                                                                                                       | Explicit limits                                                                                                                                                               |
| ------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Card    | Vertical and Horizontal | Four source colour treatments at two declared widths for each orientation                                                                                              | Unlinked, plain titles with a button-only editorial CTA. Linked title chevrons, inline focus, hover, Book, Icon, Stats and group equal-height behaviour remain separate work. |
| Hero    | Background and Split    | Four colour treatments; background desktop and phone presets; Section: three desktop split ratios and stacked phone; Page: default 2/3 desktop split and stacked phone | Unlinked Page (h1) and Section (h2) presets; no immersive, child, video, custom HTML, logo, RTL or automatic breakpoint switching.                                            |

The recipes come from current JSX, SCSS and tokens. Figma is a static representation: resizing an instance does not invoke CSS media queries. Supported presets and text edits must be checked natively before being accepted. Source typography, browser balanced wrapping and exact font-file equivalence remain separate checks.

The image is the existing repository photograph `stories/assets/images/sample_image-lg.jpg`, embedded in the generated JSON. It is sample media, not the remote photograph used by every Storybook story. Replace the native image fill on a consumer media layer. The exporter does not fetch remote images during import. Desktop Hero carries the source tint and contrast scrim as separate bound gradient layers; alpha helper roles resolve RGBA because a Figma alias cannot transform opacity.

Editorial actions remain nested instances. A narrow Label typography profile copies the source state template and keeps font-family/size aliases, paint, underline and offset on the native text. The badge retains its shared style. This repairs a recorded shared-style coupling issue without detaching actions. It does not broaden Editorial CTA's existing core acceptance.

## Planned catalogue stubs

**03 Examples and templates** contains a documentation-only planned catalogue. Each row identifies the actual source story file, related scaffolds and source examples still to map or verify. Rows are ordinary frames and text, never dummy main components or variants in Assets.

The source inventory scans ordinary named Storybook examples. It excludes documentation, foundations and authoring demonstrations with reasons. Counts are source files and examples, not coverage percentages or a promise that each example is a distinct visual variant. Browser behaviour examples require their own interpretation. MDX-only anatomy and all public prop combinations are outside this automated scan; [COMPONENT-INVENTORY](COMPONENT-INVENTORY.md) remains the broader review inventory.

`scripts/figma-planned-inventory.cjs` generates `plannedInventory` in the token JSON. Stable source path/export IDs survive ordinary updates. An optional explicit mapping must name existing recipe variant IDs and actual source exports. A mapping means source scaffold coverage only; it never marks native acceptance. The compact canvas shows six example names per row and a remaining count; the complete list stays in JSON and source.

## Updating and extending

1. Extend exporter recipes, source guards, shared styles and explicit guidance for the family. Preserve existing family, variant, layer and property IDs.
2. Regenerate the token JSON and close/reopen the development plugin after changing its runtime.
3. Import the current brand without pruning. Select affected new families explicitly; they are not part of the 25-family core preset. Dependencies build automatically.
4. Review normal-scale instances, source bindings, optional visibility, edited text, nested actions and image overrides. Save an inspection and operation receipt.
5. Repeat the same scoped build twice, including a plugin restart. Check retained IDs, content and links. A declared source change needs its own propagation check.
6. Update this status, guidance and the PR with native evidence. Promote scope only after its consumer contract passes; keep remaining variants visible in the planned catalogue.

Keep personal notes beside generated boards or in Your workspace. Generated catalogue rows are reconciled; foreign/manual content inside those rows causes refusal. Source path removals and renames need an explicit reviewed migration, not silent deletion or adoption.

## Acceptance to record

- [x] Source matrix and required media/style dependencies exported and locally verified.
- [x] Four fresh Assets instances are readable at their declared presets; all 40 canonical recipes pass saved-field checks. Broader rendered matrix acceptance remains pending.
- [x] All 23 canonical CTA Label nodes retain independent Default/Hover/Focus formatting after the narrow repair.
- [x] Four fresh consumers retain edited Titles, nested Label edits and optional visibility through scoped repeats, including restart.
- [x] One fresh Split consumer retains a real image-fill replacement through an additional scoped repeat.
- [ ] Optional-content restoration and wider resize/state-switch contracts pass their declared native scopes.
- [x] All 68 planned catalogue rows match source, use FRAME/TEXT only and retain identities on rerun.
- [x] Remaining source variants and unverified resize, script and font contracts remain explicit in docs and the PR.

## Native checkpoint, 4 October 2026

- Export: 519 variables, 100 text-style choices, eight effects, 32 construction families and 367 variants. Card/Hero add four families and 40 variants, outside the unchanged 25-family/297-variant core preset. This Free file has one UNDRR mode.
- First scoped construction, including Editorial CTA dependency and catalogue/layout reconciliation: 2,054 nodes created, 807 updated, zero errors. The visual check found incorrect nested action copy caused by a recipe field error. The corrected rebuild created zero nodes and updated 1,770 with zero errors; misplaced nested `properties` now refuses instead of silently dropping the intended `overrides`.
- Independent saved-field checks pass 5,582 checks for all 40 mains, 160 own text nodes, 64 nested action labels, native photo handles and desktop gradient stop bindings. All 7,020 prior asset IDs, including 6,549 scene nodes, remain. ID retention alone is not a full-field comparison of unrelated assets.
- Full typography audit passes all 32 families and 795 canonical text nodes, including 35 narrow DIRECT nodes. This reads saved fields, not raster equivalence or font-load evidence.
- Four fresh Assets consumers: Vertical 300px, Horizontal phone 390px, Background desktop 1,280px and Split desktop 1/3. Edited Titles, two nested action Labels and hidden Card labels/Hero second action survive an ordinary repeat: zero created, 1,770 updated, zero errors. All 8,680 scene records and foundations match the settled baseline exactly.
- A second scoped repeat after plugin restart creates zero nodes with zero errors. All 77 consumer subtree records and foundations remain exact. Ten generated records change only for the intended Card guidance wording correction: nine descriptions and one guidance text.
- A native Split consumer image upload changes the image handle from the source photograph to a distinct repository PNG. An additional scoped repeat creates zero nodes and updates 1,770 with zero errors; all 8,680 media-edited scene records and foundations remain exact. Image replacement after another restart, crop edits and hidden-content restoration remain unverified.
- The planned catalogue scans 90 story files, includes 68 entries with 414 named examples and excludes 22 files with reasons. Its 68 rows and 136 text children pass 2,482 saved geometry/type checks with zero overlap or bounds failures. Those source counts are not an implementation coverage percentage.

Cleanup removes exactly the four temporary consumer roots and their 77 records. The final file retains 8,603 generated scene records and unchanged foundations. The final guidance update changes 24 CTA descriptions; layout reconciliation creates zero nodes and updates 965, changing only the CTA guidance text and its measured text bounds. All other retained scene records match exactly. Native review covers the three-column catalogue overview and a readable source/status row.

Connector calls remain quota-blocked on Starter. Desktop import and native inspection work; mocks and saved fields do not establish all rendered behaviour. Source web font 2.137 and installed Condensed 2.001047 differ. Exact browser wrapping, all colours/viewport raster comparisons, arbitrary content/widths, all brands/scripts, interactive prototypes, paid-team publishing and novice handoff remain separate acceptance work.

API references: [native image handles](https://developers.figma.com/docs/plugins/api/figma/#createimage) and [image fills, gradient stops and variable bindings](https://developers.figma.com/docs/plugins/api/Paint/).

Final native view: Start here at 100%, plugin closed, six collapsed Layers destinations. Local backup: 1,126,552 bytes. Cloud sync and persistent first-open view remain unconfirmed.

## Page heading expansion

The next bounded scope adds 16 Page heading presets: eight Background variants and eight Split variants across four treatments and desktop/phone widths. Existing 40 variant definitions and IDs remain intact. The total becomes 56 Card/Hero variants, with 520 variables, 102 text-style choices and 383 construction variants across the same 32 families. The 25-family core selection remains unchanged.

Page headings retain Hero's source 36/32px sizing and 120% line height, plus the foundational h1 letter spacing of 0.02em (2% in Figma). Section headings retain zero letter spacing. Page 1/2 and 1/3 desktop split ratios are still planned; the current Page desktop Split preset is 2/3. Bounded native acceptance of this expansion is recorded below.

### Native Page construction check

The scoped build creates 804 nodes and updates 1,786, with zero errors. The saved inspection contains 9,407 scene records, 520 variables, 54 local text styles and eight effect styles. All 9,183 earlier asset IDs remain, including the 8,603 earlier scene nodes. Existing 40 canonical widths, heights and property definitions remain exact; ID retention does not imply full-field equality of unrelated assets.

An independent audit passes 10,865 getter/source checks for all 56 mains, 224 own text nodes, native photo handles, eight desktop gradient leaves with 64 bound stops and correct nested action copy. Exactly 16 new h1 titles carry 2% spacing. All 68 planned rows remain inside their catalogue and do not overlap after adding explicit remaining scope notes. The full saved typography audit passes 32 families and 859 canonical TEXT with zero gaps.

Desktop Background Page height matches the measured source 371.375px. Phone and Split retain small native/source line box differences already observed in the Section scope. Saved fields do not establish pixel equivalence or exact source-font-file matching. A fresh Card consumer retains edited title/action text and restored labels. A Hero consumer switches from Section/Desktop to Page/390px while retaining edited title/action text and restoring its second action. After the presentation update, two scoped repeats, including restart, create zero nodes and report zero errors. All 40 consumer records and all 583 foundation records remain exact. The restart receipt updates 2,136 nodes. Every saved canonical local component field stays exact, excluding presentation positions and absolute bounds; the strict scene report separately records 14 generated placement/bounds changes no larger than 0.00390625px.

[UX dogfooding](UX-DOGFOOD.md) records the expert review and fixes: bounded guidance width, review boards that contain desktop specimens, clearer instance insertion/media instructions, source shortcuts and Core controls that fit the plugin. The targeted native recheck passes; human novice handoff remains open. [Storybook integrations](STORYBOOK-INTEGRATIONS.md) distinguishes public references from source/native coverage and service-backed maintenance options.

Final cleanup removes only the two temporary consumers and their 40 records, leaving 9,407 scene records with every retained field and foundation exact. The final typography audit passes all 859 canonical TEXT. The local backup is 1,164,261 bytes; Start here is visible at 90%, with the plugin closed and six collapsed Layers destinations. Cloud sync and persistent first-open view remain unconfirmed.
