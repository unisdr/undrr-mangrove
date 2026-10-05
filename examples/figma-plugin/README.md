# Mangrove tokens for Figma (exploratory)

A spike, stacked on the React Aria pilot (unisdr/undrr-mangrove#1088). It turns Mangrove's tokens into local Figma variables, text styles, effect styles and native component recipes so a Figma kit can use the same spacing, colour and theme layers as the code. A bounded exploratory UNDRR core is now published in the paid pilot; it is not a supported production library.

**Current paid checkpoint, 5 October 2026:** a Full Professional seat, canonical paid-folder migration and all five modes are verified. Repeat import preserves every saved asset record. The bounded library is published, a separate desktop/mobile MVP example uses its linked assets, and a published token update/restoration preserves the tested edits. Component rebuild propagation and novice acceptance remain separate checks. See [Professional kit validation](PAID-KIT-STATUS.md) for evidence, the bounded release selection and the consumer route. [MVP handoff](MVP-HANDOFF.md) gives Anders the entry points, maintainer setup and remaining gates.

See the [architecture review](ARCHITECTURE-REVIEW.md) for the acceptance gates when composing and maintaining the kit. The [core kit](CORE-KIT-STATUS.md) records bounded component evidence and deferred catalogue work. Native task-based browsing, usage/source pairing, readable grids and bounded ordinary updates pass [the organisation gate](KIT-ARCHITECTURE.md). Remaining handoff gates include uncoached novice tasks and published component recipe-rebuild propagation.

## How it fits together

```
tokens/*.yaml + SCSS ──> scripts/build-figma-tokens.cjs ──> mangrove-variables.json ──> this plugin ──> Figma variables, styles and components
(same merge and resolve as build-tokens.cjs)          (generated, not committed)
```

- One collection, **Mangrove**, with one mode per brand: UNDRR, DELTA Resilience, IRP, MCR2030 and PreventionWeb. Switching a frame's mode re-themes it, which is the Figma equivalent of `.mg-theme-*`. Figma Professional allows 10 modes per collection.
- Aliases follow the YAML. `color/button-background` aliases `color/interactive`, which aliases `color/blue-900` in UNDRR and `brand/primary` in PreventionWeb. A value that CSS derives with an alpha cast is stored as resolved RGBA, because Figma aliases cannot change opacity.
- Brand primitives marked `$private` are imported but hidden from publishing.
- `control/*` comes from `_control-tokens.scss` (the roles the ComboBox uses) and `font-family/*` from `_variables.scss`.
- Source variables carry their CSS name as Dev Mode code syntax, for example `rgb(var(--mg-color-interactive))`, so developers inspecting a design see the token to use. Derived effect helpers have descriptions explaining their source; the focus extent also carries a CSS calculation.
- Two-value shorthands become `/block` and `/inline` pairs (`padding/button/block`, `padding/button/inline`) that bind to auto layout's vertical and horizontal padding.
- `scripts/figma-kit-guidance.cjs` supplies the consumer metadata in `doc.kitGuidance`: task groups, whole-widget order, supporting parts, purpose, usage and bounded scope. The same metadata is embedded in the plugin for startup navigation without loading JSON. Recipes remain the source of anatomy and design values; guidance does not broaden acceptance.

Not represented as variables, with the reason listed in the JSON's `skipped` array: shadows, durations and easings (no Figma variable type), percentages and `em` line heights, four-value shorthands, and `none`. Raised shadows and the source Radio checked inset are represented as effect styles instead.

Current output contains 520 variables, 102 text definitions (60 Regular foundations and 42 component styles), eight effects and 383 recipe variants across 32 families; 16 tokens remain skipped as variables. The plugin initially selects nine core Regular foundation styles. Condensed font loading is now recovered locally, while source-fixture equivalence and Tabs acceptance remain separate checks. Card and Hero add 56 variants across four new source scaffolds, outside the unchanged 25-family core preset. The [Card/Hero status and planned catalogue](CARD-HERO-STATUS.md) records their current boundaries. Component styles are imported when their selected family requires them. Exported definitions do not imply that every style has passed rendered acceptance.

### Find your way around the plugin

- **1. Import:** load the generated JSON and choose one brand on Starter. Nine core text styles and all effects are initially selected; advanced import choices remain available.
- **2. Core kit:** use the explicit 25-family candidate preset, search by name, or choose individual families. Search hides rows without changing selection. Tabs and Editorial CTA have visible pending-check labels and start unticked. Card/Vertical, Card/Horizontal, Hero/Background and Hero/Split start unticked and are labelled New source scaffold. The explicit core allowlist stays unchanged until deliberately reviewed; the guidance registry rejects unknown family IDs during export.
- **3. Diagnostics:** inspect the file, export previews, or run temporary native checks. Native behaviour, edited-instance checks and Editorial CTA have separate navigation.
- Brand, loaded-variable count, navigation and recent results stay visible. Save the complete results and inspection rather than relying on the bounded on-screen summary. Temporary checks have a separate saved record for restart recovery.

**Kit destination > Go** lists and opens only installed destinations, using their actual names in the legacy file or the v2 sections. **Browse component** lists installed whole widgets by task; choose **Component introduction**, **Full usage and states** or **Source components**, then **Open component**. Navigation and **Refresh navigation** are read-only and do not load fonts or change component selection. **Organize file** is the separate explicit migration to six v2 sections. See [the organisation workflow](#organize-and-navigate-the-file) before migrating.

The panel uses Mangrove-inspired UNDRR blue, clear typography and a two-band keyboard focus indicator, while respecting Figma's theme colours. Panel styling does not import fonts or change component recipes. [Core status](CORE-KIT-STATUS.md) states what is accepted and what remains.

### Planned catalogue

**03 Examples and templates** includes 68 documentation-only source entries, covering 414 named source examples. Each entry identifies its source file, related scaffolds and examples still to map or verify. These frames and text are not components in Assets. The complete generated `plannedInventory` retains source/export IDs and exclusion reasons. Read [the stub contract](CARD-HERO-STATUS.md#planned-catalogue-stubs) before adding mappings or changing source paths.

### Text and effect foundations

The JSON's `styles` section holds values and binding names. The plugin chooses what to import, loads fonts, and applies those definitions; it does not hold a second set of design values.

| Text role | Available role sizes                       | Family           |
| --------- | ------------------------------------------ | ---------------- |
| `text`    | `300`, `button`, `form-input`              | Roboto           |
| `heading` | `400`, `500`, `600`, `900`, `1000`, `1100` | Roboto           |
| `display` | `900`, `1000`                              | Roboto Condensed |
| `ui`      | `tab`                                      | Roboto Condensed |

Open **Import > Styles and import options** to change the selection. **Use core text styles** restores the nine Roboto choices. Display and UI roles use Roboto Condensed and are outside the initial selection. The 60 foundation choices use **Regular** with **automatic line height**, with `fontFamily` bound to `font-family/*` and `fontSize` bound to `font-size/*`. Component styles add source weights and explicit line heights. Chromium source comparison confirmed bundled Bold 700 for CSS600, 115% line height for TextInput and inherited 24px for smaller help text. Figma font-file equivalence and script-specific fonts remain pending. The SCSS `code` role uses a generic monospace stack, so no specific Figma font is exported for it.

The importer discovers exact font names with `listAvailableFontsAsync` and loads them with `loadFontAsync` before editing. An unavailable or unloadable font skips the affected text styles and appears in the report. Variables, effect styles and other text styles still import. Install or enable the missing font and re-import to complete the set; no fallback font is substituted.

| Effect style                             | Source and Figma representation                                                                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mangrove/shadow/raised`                 | `shadow.raised`: a zero-blur inner shadow, preserving the 1px inset border and 0.24 alpha through `effect-color/shadow/raised`.                                           |
| `Mangrove/shadow/raised-hover`           | `shadow.raised-hover`: a zero-blur 2px inner shadow, colour bound to `color/interactive`.                                                                                 |
| `Mangrove/component/radio/checked-inset` | Source 3px white inset on the checked Radio ellipse. Native spread binds to the derived 5px helper, including its 2px inside border; see the actual PNG correction below. |
| `Mangrove/focus-ring`                    | `mg-focus-ring` in `_mixins.scss`: two zero-blur outward shadows, with a neutral separator over the coloured outer band. Colours and spreads are bound to variables.      |

These shadows are inset borders in the CSS, not elevated drop shadows. The focus effect approximates a CSS outline; opaque diagnostic shapes have been rendered in Figma to compare ordering. Figma paints the later effect over the earlier one, so the coloured outer spread precedes the white separator. Actual control and inset rendering still need checking. Figma documents spread support for rectangles, ellipses and filled frames with clipping enabled. Check the effect on the actual control shapes, including whether an ancestor clips the outward ring. The exporter fails if the focus mixin's supported recipe changes.

API references: [TextStyle](https://developers.figma.com/docs/plugins/api/TextStyle/), [effect variable bindings](https://developers.figma.com/docs/plugins/api/figma-variables/) and [effect geometry](https://developers.figma.com/docs/plugins/api/Effect/).

## Usage

For source changes, new components, identity migrations and routine Figma updates, follow [Maintaining the kit](MAINTAINING-KIT.md).

### Requirements

- The Figma **desktop app**. Development plugins cannot be imported in the browser.
- Any Figma plan for a local kit. Starter and Drafts allow one mode: tick one brand and use the brand switcher below. To keep all five brands as modes and publish a shared library, use a Professional team file and a Full seat. Professional allows 10 modes per collection.
- A checkout of this branch with dependencies installed (`yarn install`).

### 1. Generate the variables file

From the repository root:

```sh
yarn build:figma-tokens
```

This writes `examples/figma-plugin/mangrove-variables.json`, bundles the runtime into `examples/figma-plugin/build/main.js`, and prints the variable, mode, style and skipped token counts. Both files are build output and are not committed, so regenerate it on whichever branch holds the tokens you want.

### 2. Install the plugin (once per designer)

1. Open the Figma desktop app and any design file.
2. Go to **Plugins > Development > Import plugin from manifest...**.
3. Choose `examples/figma-plugin/manifest.json` from your checkout.

The plugin now appears under **Plugins > Development**. On a Professional plan, plugins cannot be published privately to a team, so each designer who runs the import repeats this step. Only the person who maintains the library file needs it.

### 3. Import into the library file

1. Open the dedicated Figma Design file that will hold the Mangrove kit. A file in Drafts or a Starter team is limited to 1 mode. For all five modes, save it in a project that belongs to the Professional team.
2. Run **Plugins > Development > Mangrove tokens (exploratory)**.
3. In **1. Import**, choose the `mangrove-variables.json` you generated.
4. On Starter or in Drafts, tick only one brand. In a Professional team file, tick all five brands. Open **Styles and import options** for additional text roles, and leave effect styles ticked to import the effects. UNDRR is selected initially for the Starter workflow. Select **Import variables and styles**.
5. Read the report in the plugin window: the counts, any errors, and the tokens that could not be represented. Choose **Save results** to retain the complete result JSON, including affected IDs and errors.
6. Open **Local variables** to see the **Mangrove** collection, with one column per imported brand. In local styles, inspect the text and effect styles under **Mangrove**.

### On a file limited to 1 mode: brand switcher

A file in Drafts or a Starter team allows only 1 mode, so the five brands cannot sit side by side. Use the file as a brand switcher instead:

1. Run the plugin, untick every brand except one, and import. The single mode is named after that brand.
2. Bind your designs to the Mangrove variables as usual.
3. To see another brand, run the plugin again with only that brand ticked. Its values overwrite the mode in place and every bound layer in the file re-themes. Variables are reused, so no bindings break.

Limits: one brand is visible at a time, and Starter cannot publish libraries, so the variables, components and designs stay in this one file. Local text styles, effect styles and components can still be created and reused within the file. When the file moves to a Professional team project, import with all brands ticked: the existing mode is kept and the others are added. Both workflows pass the mock harness. Saved desktop brand inspections establish single-mode values, aliases and identity preservation. The [paid checkpoint](PAID-KIT-STATUS.md) now verifies native five-mode migration and repeat; complete rendered brand acceptance remains pending.

### Start here and onboarding

The [user experience review](UX-REVIEW.md) records the original discovery problems and novice handoff targets. Native browsing, description refresh, revised Welcome and the v2 task-group hierarchy are now applied. Designer handoff remains open: novice usability still needs its recorded gate; ordinary reruns and bounded source propagation now pass. A readable canvas alone does not establish a usable library handoff.

A design kit needs an entry point that explains its structure. **Open Start here** is always visible in the plugin header. With the current token document loaded and one existing kit brand selected, it creates or updates a branded welcome board, then selects and zooms to it. Without a loaded document, it opens the existing board without writing. **Kit destination > 00 Start here > Go** also navigates without updating content.

The board lists the existing owned boards using their current names and Layers order, explains how to insert linked instances from Assets, and describes supported scope and the automatic/manual update boundary. Its first task is concrete: create a frame named **My design** outside generated boards, or in **Your workspace** when available; search Assets for **Mangrove/Button**, insert a linked instance and edit its **Label** in the right sidebar. Foundations are located separately in Variables and local styles. After section migration, the contents use the actual six section names; planned destinations are not presented as installed. It uses the exact exported body font and imported colour variables. It works on the current single-page, single-brand Free setup and does not require the full section migration or load unavailable Condensed assets.

The standalone board uses the durable `welcome` identity, not `layout/start`. Creating it does not mark the six-section hierarchy installed. **Organize file** reuses that same board and its children in the Start here section, as in the current native v2 kit. Add manual notes as direct children of the welcome root or in your own working frames; generated `welcome/content` is reconciled from the plugin. Ordinary component builds keep their requested-family view. Navigation sets the current viewport; a persistent first-open view or file thumbnail is not configured or verified.

The historical focus diagnostic frame is a maintenance board for comparing source, reversed and imported focus-ring effects, including clipping. Keep it while native regression acceptance is still open; designers can ignore it when assembling pages. In the legacy file, Welcome updates and component builds keep this root last in Layers and beyond the measured Main, Review and Welcome bounds by at least 160px. Only its page stacking position and, when needed, x/y change; its descendants remain intact and all other roots retain their relative order. The v2 organisation places it under **90 Maintenance**. Temporary capability and acceptance assets are outside this rule.

**Earlier Welcome checkpoint, 4 October 2026:** desktop access recovered and the welcome board is applied. It measures 1,440 × 1,169px and is readable/unclipped at 100% zoom. The first run creates 23 guidance nodes and moves one historical diagnostic root; all 6,453 original inspected asset IDs remain. Main, Review, canonical geometry, variable/style records and diagnostic-local fields are unchanged. Diagnostics clear the measured content bounds by 160px. Two final zero-create repeats, including a plugin restart, retain all 6,476 resulting inspected asset records exactly. Independent verification passes 19,482 checks with zero failures. Document-free Start here navigation works, the plugin is closed, and a fresh local Figma checkpoint is saved. Cloud synchronisation and persistent first-open behaviour remain unverified. At that checkpoint the hierarchy migration was blocked by Roboto Condensed Bold and direct manual-note preservation was mock-tested. The later native v2 checkpoint below supersedes those statuses; novice handoff remains open.

**Earlier incremental UX checkpoint, 4 October 2026:** installed-root and complete-widget navigation works natively without JSON. All 355 canonical descriptions are reconciled; a repeat updates zero. Welcome creates zero nodes and retains its 1,440 × 1,223px readable layout. All 6,476 inspected IDs remain and the resulting asset records match exactly on repeat. At that earlier checkpoint full v2 migration refused before writes on Roboto Condensed Bold. Numerical Table-cell rounding drift and complete scope are recorded in [the architecture checkpoint](KIT-ARCHITECTURE.md#incremental-ux-checkpoint-4-october-2026). Novice handoff and cloud sync remain unverified.

Native repetition found a paint issue absent from the original mock: rebinding an unchanged alias could retain the new paint's black placeholder. Welcome and layout paints now seed RGB/opacity from the resolved live variable while retaining its alias. The Welcome regression checks both the alias and the resolved literal paint, and explicitly rejects placeholder black. The final native repeats include full paint and text-range records.

**Earlier contents correction, 4 October 2026:** user review identified that the index described planned sections instead of the visible Layers. The corrected native board measures 1,440 × 1,223px and is readable/unclipped at 100% zoom. Its index matches the four existing kit roots in Layers order. Applying the correction and repeating it each creates zero nodes; all 6,476 inspected asset IDs remain, every record outside Welcome is unchanged, and the repeat preserves complete resulting records. A fresh local checkpoint is saved. This corrects orientation; the full hierarchy migration and novice handoff remain open.

**Latest native canvas checkpoint, 4 October 2026:** v2 is applied with six matching section names, task-group whole widgets, nearby usage/source boards and supporting parts. Initial migration creates 271 presentation nodes; refinement creates zero nodes and updates 677. Forms uses two columns, seven Switch grid overhangs are repaired, and bounded native verification preserves canonical properties, reusable dimensions, styles, aliases, instance links and designer-owned frames. See [current core status](CORE-KIT-STATUS.md#native-canvas-checkpoint-4-october-2026) for verification counts, repeat/propagation evidence and remaining handoff gates. No novice task study has been run. Cloud synchronisation remains unconfirmed; a returned unsaved/sync warning makes local backups necessary.

For personal designs, insert a fresh instance from **Assets** into **Your workspace** or an unowned working frame. Copying a generated Review specimen can retain importer review ownership and cause a conflict. Do not clear metadata automatically to hide that conflict; preserve the object and resolve its ownership explicitly.

**Browse component** works without loading JSON. For a tall Usage and states board, navigation opens its existing heading, limitations and first normal examples rather than shrinking the whole catalogue; the Table entry is observed at 100%. Short boards and section/source navigation retain overview fitting. Navigation changes only selection and viewport.

## Organize and navigate the file

Use the desktop plugin with the complete `mangrove-variables.json`, the existing main/review frames and their current imported brand. Save a backup and inspection, remove temporary checks using their exact records, then choose **Core kit > Organize file**. The v2 migration retains the six durable section keys and updates their presentation:

| Durable key           | Destination                   |
| --------------------- | ----------------------------- |
| `layout/start`        | **00 Start here**             |
| `layout/foundations`  | **01 Foundations**            |
| `layout/components`   | **02 Components**             |
| `layout/compositions` | **03 Examples and templates** |
| `layout/patterns`     | **04 Your workspace**         |
| `layout/pending`      | **90 Maintenance**            |

Components groups complete widgets into **Actions**, **Forms and selection**, **Content and data**, and **Navigation and disclosure**. Each family board pairs its existing source set and linked usage/state examples with purpose, edits and limitations. Supporting parts sit under their whole widget; Switch small is a size alternative. Maintenance contains outside-core families and upkeep material. Examples and templates explicitly records that accepted page templates are not yet available. Organisation adds guidance and foundation specimens and arranges existing assets; it does not change source component anatomy or re-theme the kit.

Use **Kit destination > Go** to select an installed destination. Legacy files retain navigation to their actual owned roots. A file carrying layout version 1 requires an explicit **Organize file** migration; ordinary builds refuse that version. After a complete v2 migration, ordinary desktop component builds automatically reconcile the generated layout. Use the complete exporter document even for a selected-family build in an organised file. Put **My design**, notes and page compositions outside generated boards, or beside the generated guide in **Your workspace**. Do not put them inside generated main/review or family boards. Their section-local positions are preserved; section positions can move as generated content grows. Generated guidance and grids are maintained by the plugin. Renames, retirements, ownership conflicts and moving canonical assets require an explicit migration.

Exact fonts for existing text must load before reparenting an auto-layout subtree. Missing fonts are reported without substitution. Save **results** after every attempt: a failure during migration retains its affected IDs and `phase: migrating` for an explicit **Organize file** retry. Ordinary component builds refuse a partial migration. Do not delete partial sections or manually move assets to bypass that guard. See [maintenance and recovery](MAINTAINING-KIT.md#organize-the-file-before-expanding-the-catalogue).

Official static Roboto Condensed Regular/Bold version 2.001047 from [googlefonts/roboto-2 at the pinned revision](https://github.com/googlefonts/roboto-2/tree/38062f4b4a0be4346d07a928408da21602545e9e) were installed with the earlier faces backed up. A Figma desktop restart was required; all four requested exact font loads now succeed. This resolves the migration loading blocker. Equivalence to the source browser fixture’s version 2.137 is not established, and Tabs acceptance remains pending. The earlier failed append and sizing experiment, exact cleanup of 74 staging nodes and zero-write font refusal remain historical evidence in [kit architecture](KIT-ARCHITECTURE.md). Native migration is now applied; ordinary reruns and bounded source propagation pass; font-file/raster fidelity and novice handoff remain open.

### Build and inspect the native kit

Import one brand first, then select families and choose **Build selected components**. Dependencies are built first; the viewport then shows the first successfully requested family. The current native v2 kit pairs source sets and linked usage/state examples within task-group family boards; supporting parts stay under their complete widget. Existing main/review roots remain operational staging in Maintenance. The table below is a construction inventory, not the primary browsing order.

| Family                            | Variants |
| --------------------------------- | -------: |
| Button                            |       16 |
| Text input                        |        6 |
| ComboBox option                   |        6 |
| ComboBox                          |        6 |
| Tab trigger                       |        6 |
| Horizontal pill Tabs              |        1 |
| Textarea                          |        6 |
| Table header cell                 |        4 |
| Table body cell                   |        4 |
| Table row                         |       24 |
| Table                             |        8 |
| Text CTA                          |        6 |
| Radio                             |       30 |
| Checkbox                          |       30 |
| Form error summary                |        6 |
| Switch                            |       22 |
| Switch small                      |       20 |
| Editorial CTA                     |       23 |
| Chips                             |       16 |
| Details                           |       20 |
| Closed Select                     |        5 |
| Loader                            |        2 |
| Compact Empty State               |        4 |
| Table of contents / Link          |       12 |
| Table of contents / Numbered      |        3 |
| Status Label                      |        7 |
| Segmented control / Segment       |       30 |
| Segmented / FullWidth BelowMedium |        4 |

TOC links use the imported source text style as a typography template, with font-family and font-size variables bound directly on their 12 main labels. Their native text-style association is deliberately empty: controlled desktop experiments found incorrect effective range colours when the shared Label property and style association were combined. This exception is restricted to TOC links and guarded against changed source anatomy or missing bindings. Rebuild the affected components after importing a changed template; editing the local style alone does not update directly applied labels. See [the native findings](LEARNINGS.md) and [maintenance checks](MAINTAINING-KIT.md).

Segmented Control now contains 30 Default-size leaves: Selected=False/True, State=Default/Hover/Focus/HoverFocus/Disabled and Position=First/Middle/Last. They keep the shared source Bold 120% style, one editable Label and the original three component/TEXT identities. The [expanded evidence record](LEARNINGS.md#expanded-default-size-segmented-leaves) distinguishes initial source checks, each state's two ordinary rebuilds and rendered observations. Intrinsic HUG labels do not establish arbitrary wrapping, full-width rails, middle focus stacking, Small or broader brand/script acceptance. Follow the [five-state maintenance procedure](MAINTAINING-KIT.md#maintain-segmented-default-size-leaves).

The four FullWidth BelowMedium Segmented presets compose real First/Middle/Last leaf instances at State=Default. Edit the shared Legend and exposed leaf Labels; changing nested Selected/State/Position can contradict the preset and is outside its initial contract. The native Legend fills the consumer width for editable wrapping; source short legend bounds are intrinsic. `Show legend=false` removes its visible layout contribution and does not implement the source accessible clipped legend. All four pass bounded 240/390px long edits, Legend hide/edit/show and two ordinary zero-create updates with fresh consumers. Independent verification passes 1,746 predicate groups; exact restart cleanup removes all 145 temporary nodes and preserves all 6,453 existing assets. The short 240px rail is 56px against the source 55.59375px, a recorded native line-box difference. One derived per-brand negative-gap variable represents the source overlapping borders. Small, composed focus and Selection switching remain follow-up scopes.

**Update kit guidance** uses the complete loaded JSON to refresh only existing component-set and direct variant descriptions from `doc.kitGuidance`. It does not load fonts, build geometry or change styles, properties or acceptance status. Save its operation receipt and inspect the descriptions. This is separate from component rebuilding and from updating the Welcome board.

The JSON `components` section owns typography, geometry, token bindings and source references. Rebuilding updates owned nodes in place, preserves property IDs and keeps review instance overrides. Unexpected node types or ambiguous identities are rejected. User additions are retained and obsolete owned children are reported. A failed update to an existing family can retain partial changes; inspect the report before continuing.

Composed Tabs exposes the nested trigger properties; open ComboBox exposes its nested options. Review label targets follow the recipe anatomy, and responsive formatting is normally seeded only on new specimens. Existing Tabs long-label specimens keep their prior labels; edit the exposed nested Label property or explicitly reseed the review. The four Roboto families have been rebuilt in the desktop file, and inspection confirms three exposed instances in open ComboBox. Updated Tabs recipes still need a real-file rebuild. See [the source measurements and acceptance record](LEARNINGS.md#browser-acceptance-measurements) for targeted visual checks and remaining gaps.

**Refresh review sizes, keeping edited content** is off by default. Tick it when an existing narrow Button specimen needs wrapping repaired or a composed specimen needs its current master preset and root width reapplied, then build the affected families. It preserves editable content and node IDs, while explicitly replacing the selected review geometry overrides. Normal rebuilds preserve existing formatting and geometry edits. Narrow review rows include 8px padding on each side outside the advertised 240px consumer width. The corrected Button specimen renders at 240 × 50px with its retained label on two unclipped lines. This option does not repair required field label wrapping.

**Inspect kit** records actual IDs and resolved consumer bindings without loading fonts. Tick **Check font loading during inspection** to include font probes when needed; unchecked reports contain `fonts: null`. The persistent results area displays a bounded inventory summary, while **Save inspection** downloads the complete JSON. **Focus diagnostics** compares literal effect order with bound styles; PNG export buttons capture review frames. Select exactly one family and use **Export selected family PNG** for a bounded image of its owned review section; **Export review PNG** captures its owned review root. After v2 migration, examples are paired with family boards, so export each selected family rather than treating that legacy root as the complete catalogue. These are local development operations and do not publish a library.

**Save operation report** downloads the latest import, component build or focus diagnostics result without shortening its IDs, errors or audit entries. Filenames identify the operation: `mangrove-import-report.json`, `mangrove-component-build-report.json` or `mangrove-focus-diagnostics-report.json`. Inspection reports remain separate. Actions run one at a time; the previous operation report stays available while another action runs or after an error. Reports are held in the plugin window until it closes, so save them before restarting it.

**Diagnose font loading** performs a bounded probe of the exact selected-brand UI/display faces and at most one already-listed naming candidate per face. It reads the supplied font inventory, tests at most four exact names and reports variable-axis tags. It creates no nodes and assigns no fonts. Save its full operation report. In the earlier 4 October probe, the exact `Roboto Condensed` Regular/Bold faces failed while the listed `Roboto` / `Condensed Regular` and `Condensed Bold` names loaded. This distinguishes resolution paths, not matching font files, axis coordinates or rendering. The later official static-font recovery supersedes that loading failure, but not the font-file/fixture equivalence gap. Font roles remain unchanged. See [the font investigation](LEARNINGS.md#font-names-and-loading-do-not-prove-font-identity).

**Native capability diagnostics** creates a separate temporary area for legend sizing, editable slots and instance-vector experiments. Save its report before closing the plugin. After restart, **Load saved capability report** recovers the exact ledger; **Audit saved capability ledger** reads current ownership and reconciles permitted inherited probe descendants without changing the canvas. Cleanup refuses foreign or unrecorded children and moved assets. A failed capability test is evidence for the component contract, not a reason to detach consumers or invent equivalent behaviour. See [the runbook](MAINTAINING-KIT.md#native-capability-experiments).

The **Segmented Control joining** diagnostic reads an exporter-owned `capabilities.segmentedJoining` packet. It checks typed source roles, native identities, selected-mode values and exact fonts before creating four temporary fixtures for seams/corners, focus paint order, full-width edited labels and wrapping. The first measured scope is UNDRR. These fixtures do not add canonical variables, styles or component families; direct diagnostic typography does not establish shared-style or ordinary rebuild acceptance. Save the full report, review the fixtures at normal scale, then remove the exact owned nodes before rebuilding the plugin. See [source packets](MAINTAINING-KIT.md#source-packets-for-native-capability-checks).

The **Form Action joining** diagnostic uses `capabilities.formActionJoining` for four UNDRR specimens: joined Search, Subscribe with long edits, independent error/disabled appearance and the explicit 480/481px source viewport presets. It tests raw control/action geometry, individual focus outlines and a clipped single-line value inside one private field master per specimen. Separate reusable control/action masters remain pending. Two private-master reapplications test diagnostic retention; they are not ordinary canonical rebuilds. Save the complete report and inspection, review the actual canvas, then remove the exact owned ledger. Source and mock checks alone do not accept native geometry or shared style association.

The **Segmented Control shared style** diagnostic prepares edited and untouched instances of the canonical three-state subset. After each of two ordinary scoped builds, **Advance Segmented check after build** checks retained consumers and creates three new untouched instances. Save every full report, inspect the rendered states, then clean up the exact temporary ledger. Each advance requires a newly completed build; loading a saved report also requires a fresh build. See [the repeated shared-style runbook](MAINTAINING-KIT.md#repeated-shared-style-checks-for-segmented-control) for recovery, ownership checks and the limited acceptance scope.

Stable public token and component identities use shared plugin data in namespace `orgundrrmangrove`. Desktop imports also read legacy private IDs and reject conflicting ownership. Shared identity metadata contains no account information or secrets. The optional acceptance probes store a bounded synthetic workflow ledger on their temporary root; save and remove it using the acceptance controls. See [Figma shared plugin data](https://developers.figma.com/docs/plugins/api/properties/nodes-setsharedplugindata/).

### Drive the same recipes through the connector

When `use_figma` is available, generate a bounded script from the same runtime:

```sh
# One scoped foundation batch, not the complete import.
node scripts/build-figma-connector.cjs import undrr --variables=color.neutral-0 --styles=focus-ring > /tmp/mangrove-import-batch.js
node scripts/build-figma-connector.cjs build undrr button > /tmp/mangrove-button.js
node scripts/build-figma-connector.cjs build undrr text-input > /tmp/mangrove-input.js
node scripts/build-figma-connector.cjs build undrr combobox combobox.open > /tmp/mangrove-combobox-open.js
node scripts/build-figma-connector.cjs build undrr tabs > /tmp/mangrove-tabs.js
node scripts/build-figma-connector.cjs build undrr table table.large.default > /tmp/mangrove-table-default.js
node scripts/build-figma-connector.cjs inspect undrr > /tmp/mangrove-inspect.js
```

Pass the emitted JavaScript to `use_figma` after loading its skill. The builder includes nested component dependencies, trims other brands, compresses data with a local codec and rejects payloads over 50,000 characters or bytes. It does not use `eval` or fetch code. Connector execution uses shared metadata only: first migrate legacy private identities through the desktop importer, or verify unchanged unique names before adoption. Privately identified assets that were renamed cannot be recovered by the connector's name fallback.

The connector runtime deliberately omits the layout module and refuses component builds in an organised file. Use the layout-aware desktop plugin for those updates and for **Organize file**. Foundation import batches remain separate operations; they do not organise or reconcile the canvas.

The optional fourth argument selects comma-separated variant IDs from one family. Full ComboBox, Table, Row, Text CTA, Radio and Checkbox dependency matrices exceed the connector limit; emit one variant or a checked small batch at a time. Dependencies retain only the matching variants for that batch, and reports identify the requested scope. Existing variants remain in place and the builder arranges all retained main variants together. Complete all intended batches and inspect the resulting family. The full desktop plugin build remains available. Packed LZW preserves metadata; payload rejection never silently drops variants. Native connector batch assembly remains unverified while the Starter allowance is exhausted.

Individual focused Segmented leaves currently compile at approximately 47.9–48.3k characters/bytes. Check each exact payload. A focused six-variant batch and the full 30-leaf family exceed the 50,000-character/UTF-8-byte limit and reject without truncation. The desktop's six-consumer state diagnostics use ordinary full-family builds; they are not a connector batch-size promise. Native connector execution remains unverified.

Foundation imports also support explicit batches: `buildConnector({operation: 'import', brandId: 'undrr', variableIds, styleIds, doc})`, or CLI `--variables=id,id --styles=id,id`. IDs are the canonical exporter IDs, such as `color.neutral-0` and `focus-ring`, rather than Figma display names. Providing either list selects a batch; an omitted list selects none. Alias dependencies and style font/effect bindings are included automatically. Empty, duplicate or unknown selections fail before writes. Reports include requested and actual scope, and pruning is always disabled.

Partition all `doc.variables[].id` and `doc.styles.text[].id` / `doc.styles.effect[].id` into explicit lists, retaining every definition. Mocks cover five brands with batches of 70 variables and 20 styles, measuring 17,194–33,790 bytes at this checkpoint. Check each emitted payload because the limit depends on the source data. Complete **every** batch and inspect values/bindings before accepting a brand switch: the one physical Starter mode temporarily mixes brands during a partial import. Full desktop import remains available. Native connector import batches are unverified while the tool allowance is exhausted.

On 3 October 2026, the connected Starter account reported a Full seat and canvas writes worked. Screenshot reads subsequently hit the Starter tool-call allowance. This is an observation for this account, not a promise that every Starter account can write. Conserve read calls and record structural evidence returned from writes. Do not upgrade plans or change permissions automatically. See [rate limits and access](https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/).

### 4. Publish and use

Publishing needs a Full seat on a paid plan and edit access to the source file. On Starter, use local assets in the kit file and defer publishing. See [Figma's publishing requirements](https://help.figma.com/hc/en-us/articles/360025508373-Publish-a-library).

1. Publish the file as a library (**Assets > Libraries > Publish**). Private brand primitives stay out of the published list.
2. In a design file, enable the library, then bind fills, strokes, padding, gaps, radii and font sizes to Mangrove variables.
3. To preview a brand, select a frame, use the variable mode control in the **Layer** section of the right sidebar and choose the brand. Everything bound to Mangrove variables inside it re-themes.
4. In Dev Mode, bound values show their CSS name, for example `var(--mg-spacing-150)`.

### 5. Update after a token change

1. Pull the branch with the token change and run `yarn build:figma-tokens` again.
2. Run the plugin in the library file and import the new JSON. Existing variables and selected styles are updated in place, matched by token or style id stored in plugin data, then by name. IDs survive re-import and user renames, preserving bindings and style references.
3. To delete variables whose token was removed from the YAML, tick **Remove Mangrove variables no longer in the file**. Without it, they are kept and listed as stale.
4. Publish the library update.

Unticking a style leaves any existing style in place. The prune option removes variables only; styles are never pruned automatically. JSON from before the `styles` section was added remains importable as variables only.

### Troubleshooting

| Message                                           | Cause and fix                                                                                                                                                                                                               |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Could not add mode "...", Limited to 1 modes only | The file is not in a Professional team project: Drafts and Starter teams allow 1 mode. Move the file into a project in the Professional team and import again; existing variables are kept and the missing modes are added. |
| Could not add mode "..." with a higher limit      | The plan's mode limit was reached. Untick brands, or split them across files.                                                                                                                                               |
| Not a mangrove-variables.json file                | The wrong file was chosen. Regenerate it with step 1.                                                                                                                                                                       |
| alias target ... missing                          | The JSON was edited by hand or is from a mixed build. Regenerate it.                                                                                                                                                        |
| A variable shows the wrong type                   | Its token changed type in YAML. Preflight preserves the existing ID and rejects the import; design an explicit migration before changing bindings.                                                                          |
| Missing fonts or a font could not load            | Enable the exact reported family and style in Figma, then re-import. Other assets are still imported.                                                                                                                       |

The plugin runs locally in Figma and has no network access.

## Connect Codex to Figma

There are two separate plugins: the Mangrove development plugin above imports the generated JSON inside Figma; the Figma plugin for Codex connects the agent to Figma through its remote MCP server. Opening the Figma desktop app alone does not connect Codex.

1. In the **Codex app**, open **Plugins** in the upper-left corner.
2. Find **Figma**, click **+**, then **Install Figma**.
3. Sign in to your Figma account and choose **Allow access**.
4. Give Codex the URL of the dedicated Figma Design file. The existing file with Mangrove variables is suitable; public sharing is not required.
5. Ask the agent to confirm the authenticated account, plan and seat with `whoami`, then inspect the file before making changes.

These steps follow [Figma's Codex connection guide](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/). The remote server does not require the Figma desktop app to be running. The desktop app is needed for Mangrove's development plugin.

The official [figma-use](https://github.com/figma/mcp-server-guide/tree/main/skills/figma-use) and [figma-generate-library](https://github.com/figma/mcp-server-guide/tree/main/skills/figma-generate-library) skills provide API guidance and a workflow for building libraries from code. Installing a skill supplies instructions; it does not connect an account or grant a seat. For a Codex installation that does not already bundle them:

```sh
npx skills add figma/mcp-server-guide --skill figma-use figma-generate-library
```

### Free account now, Professional later

As checked on **3 October 2026**, Figma documents these limits:

| Capability                               | Starter workflow                                                                        | Professional workflow                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Variables and brands                     | One mode; re-import a single brand to switch the file                                   | Up to 10 modes per collection in a Professional team file                             |
| Styles and components                    | Create and reuse local assets in the same file                                          | Publish a shared library with a Full seat and edit access                             |
| Remote MCP reads                         | Starter allowance of up to 20 tool calls per month; conserve reads                      | Full or Dev seats: up to 200 calls per day and 10 per minute                          |
| Direct agent canvas writes (`use_figma`) | A free account alone does not establish write eligibility; the docs require a Full seat | Confirm a Full seat and edit permission on the target file                            |
| Code Connect                             | Unavailable                                                                             | Still unavailable; requires an Organization or Enterprise plan and a Full or Dev seat |

Sources: [plans and features](https://help.figma.com/hc/en-us/articles/360040328273-Figma-plans-and-features), [publish a library](https://help.figma.com/hc/en-us/articles/360025508373-Publish-a-library), [MCP rate limits and access](https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/), [write to canvas](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/) and [Code Connect](https://developers.figma.com/docs/code-connect/). Recheck these when the account or plan changes.

The practical Starter route is to run the Mangrove development plugin in the desktop app. It imports variables and selected text and effect styles; component generation uses the exporter recipes described above. Keep one canonical kit file, bind components to the same variables and defer shared-library publishing. When Professional access is available, ask for a Full seat on your own account and edit access to the team file, move the kit into that team, then import all five brands. Joining a Professional team with a View or Dev seat does not meet the documented requirement for direct agent writes.

The Full Pro seat and paid-folder migration are now verified, along with the five-mode import and exact repeat. Resume from [the paid checkpoint](PAID-KIT-STATUS.md) and [Professional access handoff checklist](MAINTAINING-KIT.md#professional-access-handoff). Condensed loading is recovered locally; source-fixture equivalence, Tabs rendering, complete other-brand acceptance, published component recipe-rebuild propagation and novice handoff remain separate work. Initial publication and published-token preservation/restoration pass. Code Connect still requires Organization or Enterprise access.

### Temporary Professional subscription and MVP handoff

**Decision, 5 October 2026:** procurement is delayed, so the user chose a temporary personal monthly Professional subscription, followed by handoff to Anders, the UX lead. The connector confirms a Full seat on the user's Professional team. The published canonical kit and built MVP consuming file share the dedicated Mangrove MVP folder; the original kit key is retained. A published token update/restoration preserves tested edits. Billing term, backup restoration and final transfer remain unverified.

Account, team plan, seat and file permission are separate checks. The earlier Anders-team Member observation did not establish a Full seat. Current entitlement is verified in the user's own paid team, with actual cloud reads and writes. A Dev seat provides inspection and Dev Mode but cannot edit Figma Design team files. Paying for a different team does not establish editing access in Anders's team. See [Figma's seat comparison](https://help.figma.com/hc/en-us/articles/360039960434-Compare-and-manage-seats-in-Figma) and [monthly billing guidance](https://help.figma.com/hc/en-us/articles/360041061034-Manage-billing-on-the-Professional-plan).

Use a folder transfer for the final delivery where available, keeping the library and consuming files together. Transfers retain original file links, comments and history; the receiving paid-team admin must accept. A `.fig` import creates a new file and new main components, so retain it as a backup/fallback and verify identities and library connections if used. Confirm the transfer and an actual consumer update before the temporary subscription expires. Follow [the temporary subscription runbook](MAINTAINING-KIT.md#temporary-subscription-and-transfer-checklist); component release expansion and destination transfer remain native acceptance gates.

## Spike learnings

Keep observations separate from API documentation and mock results. Update this record as the spike is exercised in Figma.

| Finding                                                                            | Evidence and consequence                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Variables were created in the user's free file, but additional modes were rejected | User-reported desktop import: `Limited to 1 modes only`. The file can hold the token collection even when five brand modes are unavailable.                                                                                                                                                                                                                                                                                                                                             |
| Removing absent WEB code syntax throws                                             | Observed in real Figma, fixed in the importer and reproduced by the mock. Remove syntax only when it is present. The later desktop re-import updated all 219 variables without code syntax errors.                                                                                                                                                                                                                                                                                      |
| A single mode can be reused as a brand switcher                                    | All five brands have now been imported into the same desktop mode. Saved inspections match every pre-existing value/alias and preserve variable, set, variant and property IDs. Full rendered acceptance across brands remains pending.                                                                                                                                                                                                                                                 |
| Text and effect styles are local foundations                                       | Implemented with documented variable bindings and font loading. The mock checks creation, stable IDs, missing-font recovery and selective imports. Desktop import created nine text styles and all three effects; re-import updated them without new styles. Three Roboto Condensed styles initially failed to load in the desktop app; the later connector import created them successfully. Full control rendering remains pending.                                                   |
| `shadow.raised` and hover are inset outlines                                       | Confirmed in `tokens/mangrove.yaml`. Export as inner shadows, preserving the alpha cast with a derived colour variable. Do not infer elevation from the token name.                                                                                                                                                                                                                                                                                                                     |
| A CSS outline needs a Figma approximation                                          | The focus mixin becomes two bound, zero-blur outward effects. Rendered opaque diagnostics showed that the neutral effect must follow the outer effect. The desktop import applied the corrected styles, and a scoped rebuild added transparent outline Button geometry. Tab focus and full control rendering remain pending.                                                                                                                                                            |
| A connected agent and a local development plugin have different constraints        | Remote canvas writes require a Full seat. The desktop importer has already run in the free file. Confirm the connector's API support before reusing desktop plugin code.                                                                                                                                                                                                                                                                                                                |
| An installed connector may not expose tools to the active session                  | On 3 October 2026 the user confirmed connection and the Codex plugin catalog showed Figma enabled, but this session exposed no Figma tools. Local app inspection initially failed with a native-pipe startup error, then worked on the follow-up turn and enabled the desktop import. Tools became available during the later autonomous iteration and canvas writes succeeded. The account reported a Full seat on Starter; subsequent reads and writes reached the Starter allowance. |
| Native component scaffolds require rendering and source comparison                 | Seven native component sets now exist with variants, auto layout and bindings. Button and Text input repeat updates preserve IDs. Remaining visual gates are recorded in LEARNINGS.md.                                                                                                                                                                                                                                                                                                  |

For each future change, record the source token or component, the Figma representation, the local verification, the desktop or connector observation and any remaining limitation. Preserve asset identities during updates so existing bindings and instances survive. The exporter remains the source of values: add style definitions to its JSON rather than duplicating values in the plugin.

### Desktop verification on 3 October 2026

The agent operated the Figma desktop app in the user's existing Starter Design file, renamed it **Mangrove kit (exploratory)** and imported only UNDRR with the 12 default text choices and three effects:

- First import: two new helper variables, 217 updated variables, 219 values set; nine text styles and all three effect styles created. The collection UI confirms 219 variables and the UNDRR mode.
- Repeat import: no new variables or styles; 219 variables, nine text styles and three effect styles updated. No variable or effect errors were reported.
- Three styles were initially missing: `Mangrove/display/900/Regular`, `Mangrove/display/1000/Regular` and `Mangrove/ui/tab/Regular`. `listAvailableFontsAsync` listed Roboto Condensed Regular, but `loadFontAsync` rejected it. Font Book confirms that exact face is installed and active. The cause is not established; no substitute font or system font change was applied.
- Figma's font rejection was a string. The importer now reports that string instead of `undefined`, and the mock reproduces the string rejection. The actual message is `The font "Roboto Condensed Regular" could not be loaded`.
- The originally registered plugin pointed to an older Desktop copy. Importing the checkout alongside it produced two registrations with the same manifest ID and still ran the old interface. Removing the stale registration made the checkout's current interface run. Use the checkout directly and check the path in **Manage plugins in development** when an update appears stale. The old source files were left in place.
- The focus style editor shows two drop-shadow effects with colour and spread bindings. Local variables shows the outer extent as 4px; the style editor displayed 0 for its bound spread without a node context. Inspect resolution and geometry on an actual bound control before declaring the focus effect visually verified.
- Figma showed a reconnect warning during import. A local `.fig` copy was saved and its file was confirmed on disk. Cloud synchronisation was not confirmed, and the open file was kept open.

This verifies desktop creation and repeat updates, not rendered component fidelity, all font recovery paths, published libraries, or migration to a paid team. The brand switcher remains verified by the mock only.

### Connector verification on 3 October 2026

- Import preserved the 219 existing variable IDs, added 23 source-backed roles and recovered the three missing Roboto Condensed styles. The file contains 242 variables, 12 Regular foundations and four effects; component builds added seven typography styles.
- Native construction created six sets and 41 variants: Button 16, Text input 6, ComboBox option 6, ComboBox 6, Tab trigger 6 and horizontal Tabs 1. Main components and editable review instances are separate.
- Button and Text input rebuilt with zero new nodes, unchanged variant/property IDs and no reported errors. ComboBox was subsequently rebuilt through the desktop plugin; updated Tabs recipes still need their real-file rebuild. Full visual checks remain pending.
- A rendered Button review exposed zero-width captions. Explicit text widths fixed the layout. The later explicit desktop refresh repaired its existing narrow specimen while preserving the label.
- Opaque focus diagnostics confirmed the paint-order issue. The source now reverses the effect order, provides transparent stroke geometry for outline Button and Tab focus and corrects InvalidFocused Text input according to CSS specificity. The tool allowance initially blocked applying the 244-variable correction; the later desktop import and scoped rebuild applied foundations and the four Roboto families.
- The connector truncates returned text at 20 kB. Bounded inspection summaries and selected-node reports keep results parseable; desktop reports can retain the full inventory.
- Screenshot reads reached the Starter allowance. A subsequent foundation update through `use_figma` was also rejected. Desktop control later resumed; connector access remains quota-limited. No plan or permission changes were made.

### Restored desktop access and scoped rebuild on 3 October 2026

- Desktop control resumed, and a full inspection and local backup were captured before corrections. The open file still showed a reconnect warning; cloud synchronisation was not confirmed.
- Import applied all 244 UNDRR variables: two created, 242 updated and 244 values set. Nine selected text styles and all four effect styles updated. Three Roboto Condensed foundation styles still failed to load in the desktop runtime, despite the earlier connector success. No font fallback or system font change was applied.
- Selecting Button, Text input, ComboBox option and ComboBox rebuilt those four Roboto families with four new outline decoration nodes, 297 updated nodes and zero reported errors. Tabs and its Condensed dependencies were excluded from this operation.
- The complete result was saved with **Save operation report**. This establishes the reported updates and affected IDs; it does not establish full visual acceptance, Condensed font recovery or cloud synchronisation.
- The next inspection briefly showed a completed report in screenshots while accessibility remained at Working. Opening and dismissing a native menu refreshed desktop observations; the inspection and review PNG were then downloaded. All 242 original variable IDs were preserved.
- A repeat build of the four selected families created zero nodes, updated 301 and reported no errors. The review exposed disabled ComboBox opacity at 0.0055 instead of 0.55 and the existing narrow Button's clipped label; targeted corrections follow those actual observations.
- The final foundation import applied 245 variables: one created, 244 updated and 245 values set. Nine selected text styles and all four effect styles updated; the three Roboto Condensed styles still failed. The added `component/text-input/browser-fieldtext` helper resolves to `#000000`, matching the measured browser field text.
- The final scoped build used the explicit narrow review refresh, created zero nodes, updated 302 and reported no errors. The Button label was preserved and the consumer now measures 240 × 50px. The final inspection preserved all 242 pre-correction variable IDs and all six existing component sets, variant IDs and property IDs. Disabled ComboBox main components and review instances resolve to 0.55 opacity; open ComboBox has three exposed nested instances.
- `mangrove-kit-final-corrections-2026-10-03.json` records the final inspection. `mangrove-review-targeted-corrections-2026-10-03.png` shows the narrow Button on two unclipped lines, a visible disabled ComboBox and two-band Button and Text input focus rings. These checks cover the selected corrections; Tabs, broader visual acceptance, real brand switching and cloud synchronisation remain pending.
- A later download appeared to stall while accessibility showed stale controls. Selecting the Mangrove kit main window from Figma's native **Window** menu revealed the pending **Save As** dialog. The download completed without restarting the app or closing the unsynchronised file.

See [LEARNINGS.md](LEARNINGS.md) for source findings, evidence boundaries and the next acceptance checks.

## Checking changes without Figma

`dev/mock-figma.cjs` runs the importer and identity helper against a small mock of the Figma variables and styles APIs. Ten scenarios cover importing every brand, stable variable and style IDs on re-import, the 1-mode limit followed by adding modes, the brand switcher, unavailable and unloadable font recovery, selective style imports, renamed styles and older JSON without styles:

```sh
yarn build:figma-tokens
node examples/figma-plugin/dev/mock-figma.cjs
node examples/figma-plugin/dev/mock-kit.cjs
node examples/figma-plugin/dev/mock-choice.cjs
node examples/figma-plugin/dev/mock-checkbox.cjs
node examples/figma-plugin/dev/mock-form-summary.cjs
node examples/figma-plugin/dev/mock-switch.cjs
node examples/figma-plugin/dev/mock-font-diagnostics.cjs
node examples/figma-plugin/dev/mock-capabilities.cjs
node examples/figma-plugin/dev/mock-segmented-source.cjs
node examples/figma-plugin/dev/mock-segmented-capabilities.cjs
node examples/figma-plugin/dev/mock-segmented.cjs
node examples/figma-plugin/dev/mock-segmented-canonical-capabilities.cjs
node examples/figma-plugin/dev/mock-form-action-source.cjs
node examples/figma-plugin/dev/mock-form-action-capabilities.cjs
node examples/figma-plugin/dev/mock-svg.cjs
node examples/figma-plugin/dev/mock-acceptance.cjs
node examples/figma-plugin/dev/mock-editorial-cta.cjs
node examples/figma-plugin/dev/mock-editorial-contracts.cjs
node examples/figma-plugin/dev/mock-editorial-acceptance.cjs
node examples/figma-plugin/dev/mock-chips.cjs
node examples/figma-plugin/dev/mock-details.cjs
node examples/figma-plugin/dev/mock-select.cjs
node examples/figma-plugin/dev/mock-loader.cjs
node examples/figma-plugin/dev/mock-empty-state.cjs
node examples/figma-plugin/dev/mock-toc.cjs
node examples/figma-plugin/dev/mock-status-label.cjs
node examples/figma-plugin/dev/mock-audit-native-text.cjs
node examples/figma-plugin/dev/mock-connector-scopes.cjs
node examples/figma-plugin/dev/mock-review-export.cjs
node examples/figma-plugin/dev/mock-ui.cjs
node examples/figma-plugin/dev/mock-kit-welcome.cjs
node examples/figma-plugin/dev/mock-kit-navigation.cjs
node examples/figma-plugin/dev/mock-kit-layout.cjs
node examples/figma-plugin/dev/mock-kit-canvas-flow.cjs
node examples/figma-plugin/dev/mock-ui-layout.cjs
```

The kit harness covers native identity and properties, instance overrides and nested exposure, dependency and font blocking, a scoped Roboto rebuild without loading or rewriting unavailable Tabs, font preflight before container mode transitions, transparent focus geometry, codec transport and the actual API restrictions encountered.

The mock copies the Figma behaviours that have caused bugs here, but it is not Figma. Confirm a change in the desktop app before relying on it.

The layout harness checks in-place versioned migration, task-group/family boards, compact grids, ordinary updates, manual/consumer preservation, refusals and partial retry. The navigation harness checks actual installed destinations, whole-widget order and description-only updates. The actual DOM layout/navigation harnesses check serialized controls, independent receipts, unchanged family selection and build-evidence freshness. They do not establish native font loading or rendered organisation.

Audit a saved **Inspect kit** report against the current generated recipes:

```sh
node examples/figma-plugin/dev/audit-native-text.cjs inspection.json --report text-audit.json
```

The audit checks owned main TEXT paths, style IDs, decoration, explicit wrapping, offsets and recorded missing fonts. It exits with failure for gaps or incomplete source coverage. Use `--families chips,switch` for a clearly labelled subset and `--doc` for the exact JSON used to build an older inspection. It does not load fonts or prove rendering. Keep reports containing native IDs local; publish bounded findings in the learnings and PR.

## What this spike does not cover yet

- Desktop font-loading recovery. The connector has completed the three missing styles; the desktop failure cause remains unestablished.
- Complete effect acceptance across control shapes, states and brands. Targeted Button and Text input focus rendering has been checked in the desktop export; updated Tabs and remaining effect checks are pending.
- Real brand switching on bound nodes. The importer and mock exercise the single-mode workflow, but visible re-theming still needs a real-file check.
- Figma font-file equivalence and Arabic font routing. Chromium source measurements have established bundled weights and line heights for the current Latin components; matching those values does not establish identical Figma rendering.
- Full rendered Figma comparison against the measured browser specimens, wider component coverage and the remaining layout gaps. See [FIGMA-KIT-BRIEF.md](FIGMA-KIT-BRIEF.md) and [LEARNINGS.md](LEARNINGS.md).
- Code Connect, which links Figma components to the React source. It needs an Organization or Enterprise plan.

### Desktop brand checks and Textarea on 3 October 2026

- DELTA and IRP updated the existing 245 variables. MCR2030 added the Textarea height helper; PreventionWeb and restored UNDRR updated all 246 variables. Saved inspections for all five brands match the preceding 245 exported values and aliases within numeric precision, preserve their actual IDs and retain all six original sets, variants and property definitions in the same physical mode. These are structural checks; complete rendered brand acceptance remains pending.
- Structural inspection now skips font APIs by default. Its compact display was exercised in desktop Figma, and full multi-megabyte reports were saved. The UI mock confirms the download remains complete. This improves the display size; it does not establish the cause of stale accessibility or delayed native dialogs.
- Textarea adds six source-backed states and a 240px multiline review specimen. Its first desktop build created 131 nodes, updated two shared containers and reported no errors. Inspection confirms an 88.1px height binding, retained line breaks, a 225.5px wrapping Value layer and clipped overflow. The review PNG shows both focus bands, the blue InvalidFocused border, disabled styling and multiline wrapping. The narrow field-label overflow remains visible and documented.
- Browser measurement gives 88.0625px for the four-row control versus the source-derived 88.1px recipe. Scrolling, native resize, identical font-file metrics and all-brand Textarea rendering remain unverified. See [the maintenance runbook](MAINTAINING-KIT.md) for adding components, preserving identities, recording evidence and applying changes.

The desktop Textarea repeat created zero nodes, updated 77 and reported no errors, with unchanged set, variant and property IDs. A fresh local `.fig` backup was saved after restoring UNDRR. Cloud synchronisation remains unconfirmed; the desktop file was left open. Edited multiline Value/visibility retention has mock coverage; an actual edited-instance repeat remains pending.

### Table and Text CTA checkpoint on 3 October 2026

The kit now has 277 variables, 12 families and 93 variants, including 40 Table variants across cells/rows/tables and six text CTA variants. The desktop file has 25 selected text styles and four effects. Source-measured Table presets keep columns on their masters because nested size/binding writes were silently ignored by real Figma. Story rows hug content above source minimum heights; narrow font/line-breaking differences remain documented. Strong CTA actions bind contextual colours on native Button instances; long presets wrap at 200 × 64px and 120 × 106px.

An ordinary desktop repeat created zero nodes, updated 322 and had no errors, with unchanged selected family/variant/property IDs. The original 246 variables and seven original sets/47 variants retain their identities. Saved inspection and PNG checks cover UNDRR, not every brand or arbitrary width. A fresh local backup follows this checkpoint; cloud synchronisation remains unconfirmed. See [the architecture outcome](ARCHITECTURE-REVIEW.md#extension-outcome), [the component brief](FIGMA-KIT-BRIEF.md) and [the maintenance workflow](MAINTAINING-KIT.md).

## Full component implementation

The continuing scope and acceptance status are tracked in [COMPONENT-INVENTORY.md](COMPONENT-INVENTORY.md). Implement families in dependency order, retaining verified identities and recording source, mock and native evidence separately. See [ARCHITECTURE-REVIEW.md](ARCHITECTURE-REVIEW.md) for the independent review and scaling priorities.

### Radio and bounded verification checkpoint

The kit now exports 290 variables, 73 text definitions, five effects and 123 variants across 13 families. Radio adds 30 source-backed variants and a checked-inset effect. Actual desktop inspection found 25 selected text styles and all five effects. Its normal repeat created zero nodes, updated 331 and reported no errors; all 277 preceding variable IDs and all main set/variant/property IDs survived. A fresh local `.fig` backup was saved.

The scoped Radio PNG exposed a real inner-shadow difference: a literal 3px spread left only 1px of white inside Figma's 2px inside stroke. The derived native spread is 5px, retaining the source inset helper at 3px. The new PNG shows the intended 3px white band and 14px centre. Measured 240px source consumers also retain their 96px/144px heights and shrinking ellipses. These are bounded UNDRR observations. Before/focused narrow presets, arbitrary CSS resizing, other brands, Arabic, edited native consumer repeats, Condensed fonts and cloud/publication checks remain open. See [Radio learnings](LEARNINGS.md#radio-and-bounded-verification-on-3-october-2026).

### Checkbox and error-summary checkpoint

That checkpoint added 30 Checkbox variants and six LTR Form error summary variants, bringing its export to 308 variables, 75 text definitions and five effects. Desktop builds created both families; Checkbox repeated with zero new nodes and no errors. Its checkmark imports the exact source SVG into native vectors, preserving the white paint, round caps and square tile repetition in the two measured narrow presets. The current SVG runtime rejects changed assets or edited native geometry before rebuilding them. See the [maintenance contract](MAINTAINING-KIT.md).

The error summary exposes Title and error messages as editable text properties. Its shared link style carries UNDERLINE and its title style carries BALANCE, as well as source font weights and line heights. Native visual checks caught and corrected lost underlines after text property assignment. The corrected 240px long examples show underlined wrapped links and balanced title text; the repeat created zero nodes, updated 114 and reported no errors. These checks cover default UNDRR LTR specimens. Wrapped inline link focus, arbitrary error counts, RTL and script-specific typography remain pending.

**Instance override acceptance** has four explicit groups: ComboBox + Radio, Details + closed Select, TOC links + numbered list, and all seven Status Label shapes. The latter prepares an open BelowMedium390 Details with edited long Title/Paragraph and an Invalid Select with short Value and edited label/help/error/booleans, both at a fixed 240px consumer width. Save the preparation report, build only the group's families with review refresh off, then compare and save the comparison report. Details + Select passed 274 native preservation assertions after an ordinary rebuild that created zero nodes and updated 303; exact cleanup removed 20 probes with none retained. Width and FIXED/HUG sizing are explicit checks for this group; other bounds remain diagnostics, not source-fidelity assertions. The comparison is read-only; cleanup retains changed or foreign content. A saved root ID recovers the ledger after plugin restart. See the [acceptance runbook](MAINTAINING-KIT.md#check-edited-native-instances).

### Editorial CTA is under native review

The 23 editorial CTA recipes extend the conventional Button with the source circular chevron action used by Hero. The first desktop build succeeded, including source-coloured review wrappers, but actual inspection found every Label inherited the final Focus style. Default and Hover typography are therefore not yet accepted. Shared-text-property propagation, consumer underline offsets and finite-width resizing are being checked in isolated native probes. See [the recorded findings](LEARNINGS.md#editorial-cta-construction-and-a-text-property-mismatch); do not treat passing mock construction as a faithful rendered component.

The **Editorial CTA consumer acceptance** panel creates three temporary instances, exercises short/French/unbroken labels at finite widths and records actual text, font, badge and constraint readbacks. Save its full operation report before closing. Rebuild Editorial CTA with review refresh off, then compare against the saved baseline. Cleanup can recover the exact shared ledger from the saved Editorial root ID after restart. Failures remain in the report and do not authorise repairs to canonical components; the current styling mismatch is expected to fail those checks.

### Loader and Compact Empty State checkpoint on 4 October 2026

Loader adds two static source presets: BelowMedium 40px with an 8px ring and MediumUp 96px with a 14px ring. Native ellipse sectors retain the source blue body and neutral top band. The blue sector uses a positive 270-degree sweep crossing a full turn; reducing its endpoint modulo a full turn changed the native geometry and was corrected. Rotation, reduced-motion behaviour, live breakpoint switching and accessibility semantics remain code responsibilities.

Compact Empty State adds Plain/Panel × Centre/Start, with editable Description, optional Show media and the exact source tray SVG bound to its colour role. Roboto Regular 14px/21px and PRETTY wrapping belong to its required shared style. The source 440px description cap binds to a FILL/HUG FRAME, since native Figma rejects maxWidth variable binding on TEXT. Four bounded default-UNDRR source comparisons passed; arbitrary edited descriptions, live media-token scaling, RTL, all-brand rendering and font-file equivalence remain unverified.

The new-family ordinary repeat created zero nodes and updated 74 with no errors. Final inspection records 394 variables, 39 local text styles, eight effects, 23 sets, 272 components including the historical diagnostic, 5,221 nodes and 752 instances, with no inspection errors. All 5,528 preceding inspected IDs survived; the current inventory contains 5,663 IDs. The full text audit matched 561/561 paths and retained the older 51 Tabs-font/editorial-CTA findings; the four newest families' 79 paths added none. All 20 temporary Details/Select probe IDs are absent, and a fresh local backup is saved. Cloud sync remains unconfirmed. Professional migration should begin with a fresh inspection and backup, then verify all five modes and an actual consuming-file update; these new local families do not complete publication acceptance.

### TOC and Status Label checkpoint on 4 October 2026

The export now contains 416 variables, 91 text definitions, eight effects and 293 recipe variants across 26 families. Native inspection records 43 local text styles, 26 sets, 294 components including one historical diagnostic, 5,666 nodes and 817 instances, with no inspection errors. The full saved-field audit matches 601/601 main TEXT paths and retains the same 51 older Tabs/Editorial CTA findings. TOC and Status Label's 40 scoped paths add none; 12 TOC labels use the explicit directly applied source typography exception described above.

TOC ordinary repeats create zero nodes and update 172. Six edited consumers at 240/390/900px pass 2,819 assertions, including nested labels, Title, alignment, typography, range paints, widths and IDs. Status Label's seven edited consumers pass 816 assertions through a zero-created/83-updated repeat. Strict cleanup removes 106 TOC and 36 Status Label temporary nodes with none retained. Native rendering was reviewed at normal scale and a fresh local backup is saved; cloud sync remains unconfirmed. Source glyph/font-file equality, arbitrary responsive widths, grouped Status layouts, bulleted TOC, broader scripts/brands and publication remain pending. See [the measured findings and precision checks](LEARNINGS.md) before adding or changing these recipes.

### Segmented focus sizing diagnostic

Choose **Segmented focus sizing** under Native capability diagnostics after loading the generated document. It creates 103 temporary nodes and compares coincident, variable-bound outside outlines with STRETCH and SCALE constraints. The source shared 120% style, complete native font, Label properties, range paints, end corners and 240/390px equal-width reflow are recorded through two private-master reapplications and fresh cohorts. Save the full operation and inspection reports, review the canvas at 100%, then remove the exact owned ledger. Saved reports support cleanup after plugin restart without reloading the source document.

The corrected diagnostic preserves shared style association and exact fractional outline bounds with SCALE; STRETCH rounds widths and remains a failing comparison. Canonical focused leaves now use this guarded source-specific construction. Getter and ordinary-repeat evidence remain separate from matched pixels, new canonical fractional stress, middle focus stacking, Small and composed rails. See the [current leaf evidence](LEARNINGS.md#expanded-default-size-segmented-leaves).

### Form Action optional-wrapper diagnostic

Choose **Form Action optional wrappers** to test the next bounded layout architecture. A private set owns two fixed Joined/Stacked masters and eight shared text/visibility keys. Optional Label/Help/Error visibility belongs to transparent wrappers; their nonempty TEXT initializes at the actual 390px width before hiding. Consumers change root width and properties without assigning descendant geometry. The 172-node run records 44 phases through hidden edits, show/edit ordering, empty diagnostic values, 240/390px widths, two private-master reapplications and new fresh cohorts. Save reports and remove the exact owned ledger after review.

The first native run passes independent source, geometry, typography, property and repeat checks. Actual variant switching, canonical shared-style association, reusable nested masters, ordinary builds and focus rendering remain separate acceptance gates.

### Core content and plugin workflow checkpoint, 4 October 2026

The local core candidate contains 25 families and 297 recipe variants. Bounded Chips Label at 240px, Text CTA Mobile Headline at 390px and Compact Empty State Description/Show media at 240/390px pass two ordinary zero-create/303-update builds with four cohorts and 12 consumers. Independent raw source/readback verification passes 10,757 checks. Exact cleanup after plugin restart removes all 77 temporary nodes and retains all 6,453 original assets unchanged. A native 1x PNG was reviewed for all 12 consumers. These observations do not establish Desktop CTA editing, arbitrary widths, font-file/pixel parity, RTL or broader brands.

The redesigned plugin separates Import, Core kit and Diagnostics; navigation, context and results remain visible. Core selection uses an explicit 25-family list, nine exact Regular foundation style IDs and search that preserves selection. Core count, refresh option and Build remain visible while the list scrolls. Native review at 600×740 caught and corrected action overlap and inherited section scroll position. Builds show compact counts; full receipts, inspections and live test records download independently. Token/brand changes invalidate cached build evidence while preserving recovery records. The [core status](CORE-KIT-STATUS.md) and [maintenance runbook](MAINTAINING-KIT.md) state the accepted contracts and follow-up work.

## Source references and build freshness

**Source examples** beside Browse component opens references for the selected family. Diagnostics > **Source previews in Storybook** also lists source components and examples from the loaded inventory, including planned entries. Links open the public Storybook as reference previews; deployment revision and native-variant correspondence are unverified. Unsupported identities show a reason instead of a guessed link. See [Storybook integrations](STORYBOOK-INTEGRATIONS.md) for Designs, Storybook Connect and the account requirements.

Run `node scripts/build-figma-tokens.cjs --check` to check ignored JSON and runtime freshness without writing. Normal generation writes only changed bytes. Close the plugin before generating and reopen it before loading the new JSON. This reduces unnecessary reloads; it does not automate source propagation or consumer acceptance.

The [native UX dogfood](UX-DOGFOOD.md) records observed designer tasks, applied presentation changes and the remaining novice handoff. Core kit keeps presets, search, selection and Build together. Less frequent guidance/organisation actions are in Diagnostics > **Kit maintenance**. Expanded result details use a scroll fallback instead of clipping Core controls.

## A welcome board built from the kit

When the exact local Card Vertical 300px and Primary Hero Background Page 1280px mains are installed, **Open Start here** composes the introduction from linked instances. Hero uses the sample photograph and source typography; its actions/detail are hidden. Four image-free Cards explain first design, component use, availability and ownership. The real contents remains plain text matching Layers, without simulated navigation controls.

The generated composition reuses existing Welcome/frame/text IDs and keeps personal notes outside its content boundary. Earlier text is retained hidden while linked instances supply the presentation. Updates reconcile these five owned instances in place; they do not detach or implicitly build source components. Token-only files retain the simpler Welcome. An already linked Welcome refuses if its required mains, properties, styles or fonts disappear. See [architecture and evidence](KIT-ARCHITECTURE.md) for the native checkpoint.

### Compact canvas flow

The current **Organize file** action explicitly migrates the v2 presentation to compact canvas flow1. Welcome, Foundations and Your workspace share the opening band. Components contains task groups with a short entry and one representative linked instance per installed primary family. Its enclosing section has no white fill, and each task-group row uses its own measured width. Examples and templates follows this compact browsing area.

The auxiliary **Component reference catalogue** sits to the right of Components. It retains each existing full family board, usage states, source set and nested advanced parts. It is a reference area, not a seventh step in the public six-destination sequence. **Browse component** opens the introduction, full usage states or canonical source set directly. In older files without compact flow, Introduction opens the existing usage view. No extra main components are built and no existing variants are resized or detached for presentation.

Ordinary builds retain legacy flow until explicit organisation, then reconcile installed flow1. Save results after migration, including any partial failure, and retry **Organize file** with the complete document. See [maintenance](MAINTAINING-KIT.md) for ownership and recovery.
