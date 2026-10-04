# PR 1319 checkpoint history

Archived from the PR description on 4 October 2026, before the UX implementation checkpoint. These entries are dated historical snapshots, not current acceptance claims. Read [core status](CORE-KIT-STATUS.md), [architecture](KIT-ARCHITECTURE.md), [learnings](LEARNINGS.md) and [maintenance](MAINTAINING-KIT.md) for current scope and pickup instructions.

## User experience review and handoff criteria, 4 October 2026

Commit `50bad22e` records an independent UX designer review in [UX-REVIEW.md](https://github.com/unisdr/undrr-mangrove/blob/spike/figma-token-bridge/examples/figma-plugin/UX-REVIEW.md), and links it from README/core status. This is an expert heuristic review of native inventory, screenshots, runtime and documentation, not novice usability testing. No native kit assets changed during the review.

### Findings and proposed direction

- The file still exposes build/dependency order: complete controls sit among their supporting parts, and Main (approximately 17,521px tall) and Review (38,635px) are separate catalogues. The planned migration retains distant Main/Usage columns, so section names alone will not establish usable family browsing.
- Plugin navigation still advertises unavailable planned destinations. Some component descriptions predate later bounded acceptance; pending Tabs/Editorial CTA are intermixed with core candidates. Correct navigation and truthful scope labels before claiming handoff.
- Proposed consumer sequence: **Start here > Foundations > Components > Examples and templates > Maintenance**, with components grouped by task. Complete widgets such as Table and ComboBox belong in Components; supporting parts are associated with their family. Keep organism terminology optional in technical documentation.
- Give each family a compact purpose/default-instance/edit-controls/state-comparison overview, nearby existing source assets and precise **Bounded draft use** or **Not in core scope** guidance. Explain personal working frames and keep maintainer procedures outside the first-use journey.

### Acceptance added, still open

The architecture checklist now requires agreement among contents/Layers/plugin navigation, complete-widget discovery without dependency knowledge, current bounded readiness metadata, and novice tasks with the plugin initially closed. Proposed task targets cover orientation, inserting/editing Button, finding Table and its limits, comparing Text input states, finding a colour/text style, and distinguishing personal work/core limits/maintenance. Outcomes, time, wrong turns and assistance must be recorded; targets are not current results.

The five-destination taxonomy and family browsing redesign are **recommendations, not implemented**. Changing the existing six presentation destinations requires an explicit versioned mapping that preserves canonical/property/instance identities, overrides and manual work. Exact Roboto Condensed Bold remains the native migration blocker. Local updates to navigation/onboarding/scope guidance should precede larger presentation migration; paid publishing and the wider catalogue follow separately.

Verification for this documentation checkpoint: token Jest 3 suites/1,328 tests; lint zero errors/22 existing warnings; importer mock 10 scenarios; touched Markdown Prettier and diff checks pass. GitHub Actions remain unavailable and listing endpoints unreliable; this known PR is updated and verified directly.

---

## Maintenance diagnostics ordering, 4 October 2026

Commit `5b4eafab` addresses the follow-up orientation review: accurate contents still reflected a legacy order that placed diagnostics second. The historical focus-ring regression board is now last in Layers and collapsed in the accepted native view. It remains available for native focus effect/clipping checks while that acceptance is open; normal design work can ignore it. Full organization will place it under **90 Diagnostics and pending work**.

- Welcome updates and legacy component builds maintain the diagnostic root's backmost page position while preserving every other root's relative order. Current diagnostic fonts load before insertion; Welcome preflights those fonts before guidance writes. Component builds retain their affected-ID report if diagnostic presentation fails.
- Native application: zero created, 24 existing nodes reported updated. Repeat: zero created, 23 guidance nodes reported updated. Independent fresh-inspection comparison retains all 6,476 asset IDs; only page-root traversal order and Welcome index characters change. Complete diagnostic anatomy, canonical/consumer records, variables and styles are unchanged. The full resulting node array, order and asset records match exactly on repeat.
- Final visual review: Welcome at 100% zoom, contents match Layers, diagnostic root collapsed and last. Plugin closed and a new local Figma checkpoint saved. Full section migration, native manual-note/migration checks and novice handoff remain open; cloud sync remains unconfirmed.
- README, architecture acceptance, maintenance instructions and learnings explain the purpose and ownership of this board. Welcome mock: 5 groups, layout: 13 groups, component runtime: 17 groups, importer: 10 scenarios. Token Jest: 3 suites/1,328 tests. Lint: zero errors/22 existing warnings. Targeted ESLint, Prettier for touched files and diff checks pass. GitHub Actions remain unavailable; listing endpoints remain unreliable, so this known PR is updated and verified directly.

---

## Welcome contents correction, 4 October 2026

Commit `337684a9` addresses user review: the Welcome contents described planned sections while the native file still had legacy boards. The index now lists only existing owned destinations using their actual names and Layers order. Foundations point to Variables/local styles. After organization, it switches to actual section names; the mock verifies that transition.

### Native acceptance and maintenance

- Applied in Figma and reviewed at 100% zoom: readable, unclipped Welcome, now 1,440 × 1,223px; its four destination names and order match Layers.
- Correction and final repeat each create zero nodes and report 23 existing guidance nodes updated. All 6,476 inspected asset IDs remain; every non-Welcome record is unchanged, and complete resulting records match exactly on repeat.
- A fresh local Figma checkpoint is saved; plugin closed. README, architecture acceptance criteria, maintenance guidance and learnings document the installed-versus-planned distinction.
- The full six-section migration remains blocked by unavailable exact Roboto Condensed Bold. Native manual-note/migration checks, novice handoff, cloud sync and persistent opening-view behaviour remain open.

### Local verification

Welcome mock: 5 groups; layout mock: 13 groups; importer mock: 10 scenarios. Token Jest: 3 suites, 1,328 tests. Lint: zero errors, 22 existing warnings. Targeted ESLint, Prettier on all touched files and `git diff --check` pass. GitHub Actions remain unavailable for the organisation. Listing/search endpoints remain unreliable; this known PR is updated and verified by its dedicated REST endpoint.

---

## Native onboarding accepted for bounded scope, 4 October 2026

Commit `54c23c77` fixes the native paint repetition defect and records the now-applied Welcome checkpoint. Desktop access recovered after the earlier timeouts. The file is left showing Welcome at 100% zoom with the plugin closed. **The full hierarchy and designer handoff remain open.**

### Native result

- A readable, unclipped UNDRR **Welcome to Mangrove** board, 1,440 × 1,169px. It explains the reading sequence, linked-instance use, current structure, draft-design limits and updates in language suitable for newcomers.
- First creation: 23 new guidance nodes and one historical diagnostic root move. All 6,453 original inspected asset IDs remain. Main, Review, canonical source/consumer records, variables and styles are unchanged; diagnostic-local geometry and fonts remain exact, with only the root x/y and resulting world bounds changing.
- Historical diagnostics now clear the measured Main/Review/Welcome render bounds by 160px.
- Two final ordinary zero-create updates, including a plugin restart, retain all 6,476 resulting inspected asset records exactly. Independent verification passes 19,482 checks with zero failures, including complete node/text-range paints, live alias agreement and welcome text containment.
- **Open Start here** works after restart without JSON. Current viewport navigation is verified; persistent reopening behaviour and a file thumbnail are not configured or claimed.
- Fresh pre-change backup/inspection, all affected-ID operations, final inspections and a local Figma checkpoint are saved. Cloud synchronisation remains unconfirmed. No live temporary tests were created.

### Learning and correction

The first native repeat rendered Welcome black despite valid unchanged colour aliases. Inspection showed the replacement paint retained the helper's black literal placeholder. Seed RGB/opacity from the live variable's resolved value and preserve its alias. The component builder already followed this pattern; Welcome and the layout paint helper now do too. The mock regression checks the resolved literal as well as the alias and explicitly rejects a controlled black placeholder. Full section-layout rendering remains native-unverified until font resolution; it is not covered by the Welcome acceptance.

### Acceptance and local verification

- [x] Native Welcome creation and visual review at 100% zoom, historical diagnostic separation, original asset retention and exact source/consumer preservation.
- [x] Two native zero-create repeats including restart; exact resulting asset records; document-free Start here navigation.
- [x] Source-faithful paint fix and targeted placeholder-colour regression.
- [x] README, maintenance, architecture, core status and learnings updated with observed evidence and remaining gates.
- [x] `yarn build:figma-tokens` and import mock: 10 scenarios. Welcome mock: 5 groups; layout mock: 13 groups; actual onboarding/navigation DOM: 4 groups.
- [x] Token Jest: 3 suites, 1,328 tests passed. Repository lint: zero errors, 22 existing warnings. Targeted ESLint, all touched-file Prettier and diff checks passed. GitHub Actions are unavailable for the organization.
- [ ] Native direct-root manual-note preservation through updates and later migration. This is mock-tested, not claimed natively.
- [ ] Resolve missing exact Roboto Condensed Bold and perform the full native six-section migration; accept rendered foundations/layout and all-family bounds through repeats.
- [ ] Novice navigation/handoff, mapped anatomy changes and remaining brand/RTL/publication scopes.

The existing PR remains draft and based on `spike/react-aria-surface`. Queue listing/search is suppressed; this PR was read and updated via its exact REST endpoint.

## Onboarding implementation checkpoint, 4 October 2026

Commit `f229006c` adds a plan-independent welcome board and persistent **Open Start here** action. **Implemented and mock-tested; native application and visual acceptance remain open.** Two Figma desktop connection attempts and the surface inventory timed out, so no native assets were changed by this checkpoint. The earlier accepted Table checkpoint remains the last verified file state.

### Implemented

- Branded welcome using the exact source body font and imported semantic colour variables. Reading order: Foundations, Components, Compositions, Page patterns, Diagnostics/pending work. Includes Assets/linked-instance instructions, supported versus pending scope, Free single-brand guidance and the automatic/manual maintenance boundary.
- Durable `welcome` identity independent of `layout/start`. It can be created before the Condensed-blocked migration, retains generated child IDs and direct-root manual notes on rerun/restart, and is reused inside the later Start here SECTION. It does not mark the full hierarchy installed. Older introduction anatomy requires an explicit migration.
- Persistent header action creates/updates from loaded source and the current imported brand. With no JSON, it navigates the existing board without writing. Destination Go also supports standalone Start here. Navigation changes the current viewport; a persistent first-open view and file thumbnail are not configured or verified.
- Historical focus diagnostics move by page x/y only beyond measured Main/Review/Welcome bounds with a stable 160px margin. Ordinary legacy component rebuilds repeat that spacing check. Canonical components, source anatomy, diagnostic descendants, unowned roots and live probe trees are preserved.
- Exact font, typed colour-role, brand, schema/parent/duplicate and manual-content preflight; downloadable refusal/partial affected-ID results. Welcome preflight and existing fonts precede full migration writes.
- README, maintenance, architecture, core status and learnings document the implementation, native limitations and resume procedure.

### Acceptance

- [x] Five actual-runtime Welcome mock groups: source/canonical preservation with unavailable pending fonts, restart/rerun stability, direct manual notes, later full-migration identity reuse, safe font/variable/brand/ownership refusals, diagnostics spacing and foreign-page refusal.
- [x] Thirteen layout mock groups remain green. Four actual DOM onboarding/navigation groups cover document-free navigation, serialized upsert, source choices, complete receipts and displayed refusal reasons.
- [x] Import mock: 10 scenarios. Component mock: 17 groups. Existing UI: 10 groups. DOM core/navigation: 3 groups.
- [x] Local token Jest: 3 suites, 1,328 tests passed. Repository lint: zero errors, 22 existing warnings. Targeted plugin ESLint, touched-file Prettier and diff checks passed; production bundle regenerated. GitHub Actions are unavailable for this organization.
- [ ] Resume desktop inspection, save a fresh backup/baseline, create Welcome, save operation and inspection receipts, and verify only declared presentation assets changed.
- [ ] Visually review readable/unclipped welcome content, current brand, novice instructions and historical diagnostic separation at normal zoom.
- [ ] Native zero-create rerun and plugin restart; preserve direct-root manual notes; navigate existing Start here without JSON.
- [ ] Novice can find foundations, a component, a composition and pending scope. Full native six-section migration, wider architecture acceptance and designer handoff remain open.

The missing exact Roboto Condensed Bold font still blocks the full native hierarchy migration. Professional access does not replace the native font and acceptance work. Queue listing/search is suppressed for this organization; this existing PR was read and updated through its exact REST endpoint.

## Organisation implementation and native checkpoint, 4 October 2026

Commit `7d215adc` implements the desktop layout reconciler and closes the bounded Table presentation defect. **Designer handoff remains open.** The six-section native migration is blocked by an existing unavailable font; catalogue expansion stays deferred until the remaining architecture acceptance passes.

### Implemented

- Six current-page native SECTION destinations: Start here, Foundations, Components, Compositions (organisms), Page patterns, Diagnostics/pending work. Source-bound colour/spacing and available type-style specimens, family/source headings and explicit missing page-pattern coverage.
- In-place migration of existing whole sets/review-family frames, stable presentation identities and ordinary desktop reconciliation. Manual section-local additions stay separate and preserved; generated section positions may change as content grows. Components are never detached or recreated to establish the hierarchy.
- Independent row/column measurements and compact Table short-state rows separate from Story/NarrowStory. The generated Review root clears measured main render/direct-child extents even before section migration. Scoped builds focus the requested family.
- Exact managed-font preflight, single existing-brand guard, duplicate/type/ownership and source-registry refusals, live-probe refusal for explicit migration, and retained partial receipts with explicit retry. Ordinary updates can preserve live acceptance consumers but refuse an incomplete migration.
- Plugin Organize file and destination navigation, independently saved complete receipts, and layout-aware family exports. Controls review export is labelled with its actual scope. The smaller connector runtime refuses organised-kit writes; use the desktop plugin.

### Native result and blocker

The original Table selection was 2,328 × 3,518.34375px. It is now **1,108.703125 × 1,632.703125px**, fits the legacy main frame and has consistent 48px horizontal row gaps. Review clears the full main rendered extent by **112px**. Each scoped update builds four Table dependency families, creates zero nodes, updates 199 and reports zero errors. Variant and descendant dimensions/anatomy, property IDs, fonts, shared styles, paints, aliases, nested instance links and review-local fields remain unchanged. Two ordinary repeats, including plugin restart, preserve all resulting saved asset records exactly. Independent verification passes **6,019 checks with zero failures**, retaining all **6,453 original asset IDs**. Native review at 77% and a fresh local backup are saved; cloud synchronisation remains unconfirmed.

The native hierarchy attempt failed because all 26 existing Roboto Condensed Bold TEXT nodes report missing fonts and their exact face cannot load. Reparenting the old main auto-layout tree needs that font. A presentation-only sizing-freeze experiment also failed and restored its original fields exactly. The initial 74 staging nodes were removed by exact saved IDs, retaining none; saved records then matched every original node, variable, style and collection. Production font preflight now refuses before writes and returns a downloadable zero-write receipt. No fonts were substituted, installed or reassigned. The six-section sequence is therefore **implemented and mock-tested, not accepted in the native file**. Professional access alone does not establish font availability.

### Acceptance status

- [x] Bounded native Table/dependency grid and Review separation, with unchanged source internals and zero-create repeats including restart.
- [x] Mock migration/reconciliation, inherited consumer ownership, manual preservation, bounded source propagation, conflicting ownership/source refusal and interrupted/restarted recovery.
- [x] Maintenance, update boundaries, learnings, core status and inventory documented in [KIT-ARCHITECTURE.md](https://github.com/unisdr/undrr-mangrove/blob/spike/figma-token-bridge/examples/figma-plugin/KIT-ARCHITECTURE.md) and [MAINTAINING-KIT.md](https://github.com/unisdr/undrr-mangrove/blob/spike/figma-token-bridge/examples/figma-plugin/MAINTAINING-KIT.md).
- [ ] Resolve exact existing font loading or supply a reviewed source-faithful migration approach; repeat native hierarchy migration from a fresh backup/inspection.
- [ ] Verify all-family selection/render bounds, edited/manual consumers and two native ordinary reruns after hierarchy migration, including restart.
- [ ] Native bounded changed-source propagation, deliberate mapped rename/removal with preserved overrides, and novice navigation/reading-sequence acceptance.
- [ ] Complete remaining foundations, realistic page patterns, font/editorial repairs, other brands/RTL and Professional published-library consumption as separate accepted scopes.

### Local verification

`npx jest tokens`: 3 suites, **1,328 tests pass**. `yarn lint:check`: **0 errors, 22 existing warnings**, coverage 490 source files. Touched-file Prettier, targeted plugin ESLint, bundle syntax and whitespace checks pass. Importer mock 10, full-kit 17, inherited-root 2, UI 10, DOM navigation 3, DOM layout 3, layout 13 and review-export 2 groups pass. The layout mock does not simulate native auto-layout, rendered overflow or novice discoverability. GitHub Actions are unavailable for this organisation. Queue listing/search responses can be suppressed; this known draft PR is managed through exact-number REST requests.

---

## Earlier architecture acceptance proposal, 4 October 2026

Designer review of the native canvas reopens the **designer handoff** gate. The bounded core component construction and consumer evidence below remains valid; the Figma file is not yet accepted as an approachable library. Complete this architecture gate before expanding the component catalogue.

[**KIT-ARCHITECTURE.md**](https://github.com/unisdr/undrr-mangrove/blob/spike/figma-token-bridge/examples/figma-plugin/KIT-ARCHITECTURE.md) now defines the reading sequence, measured defect, generated/manual ownership boundary, migration strategy, mature-kit gaps and acceptance criteria. Core status, inventory, README, architecture review and maintenance guide link to it and correct the earlier handoff status.

### Confirmed Table presentation defect

The selected object is an eight-variant component set. Neighbouring Review examples are not its children. The builder uses the largest variant height for every grid row, leaving huge empty gaps, then places a 2,328px-wide Table set inside a fixed 1,200px main root with clipping off. Review retains its original adjacent position and the areas overlap. The saved clean native inspection confirms a 2,328 x 3,518.34375px Table set. This is an actual canvas layout defect; passing individual component gates did not establish file usability.

### Required architecture acceptance

- [ ] Native named destinations and visual index provide **00 Start here / 01 Foundations / 02 Components / 03 Compositions (organisms) / 04 Page patterns / 90 Diagnostics and pending work**. A novice can locate tokens, usable components, dependencies, examples and known failures without understanding build order. Start with sections on the existing page.
- [ ] Row-specific variant spacing and measured containing extents remove Table/main/review overlap; inspect selection and rendered bounds for every family at normal zoom. Clipping overflow is not the repair.
- [ ] A versioned in-place hierarchy migration preserves canonical, variant and property IDs, variables/styles, nested instance links and overrides. No detach/recreate shortcut or name-based adoption. Current-page ownership/root reattachment must support the hierarchy before manually moving assets.
- [ ] Two ordinary reruns create no duplicates and preserve manual guidance, edited consumer content and designer-owned placement. Keep generated documentation/metadata separately keyed from manual annotations and page examples.
- [ ] A bounded source change updates the affected component and dependent composition while retaining unrelated assets. New families appear once in their declared destination with an acceptance label.
- [ ] Rename/removal conflicts report a deliberate migration/retirement requirement. Prove refusal before writes and an explicit mapped migration with retained overrides.
- [ ] Save pre/post records, review the final native file and repeat after plugin restart. Mock success alone cannot close the gate.

Routine values/styles/visual updates are source-owned and reconciled automatically under stable keys. Manual documentation, designer page composition and reviews remain explicit human work. Current anatomy keys include name paths; arbitrary renames/reparenting and retirement are not already solved. The contract distinguishes proven current behaviour from intended migration work.

Broader standard-kit gaps remain documented: visual foundations/layout specimens, searchable icons/logos, missing component/composition families, realistic pages, font/style repairs, broader resize/content/variant-switch acceptance, accessibility and RTL/brand review, optional prototypes, and published consumption/release practice. Professional distribution is later; it does not fix the architecture or fonts.

**This commit documents and prioritises the gate; it does not reorganize native assets or implement the layout migration.** Fresh local checks: 1,328 token tests pass; project lint has zero errors and 22 existing warnings; six touched Markdown files pass Prettier; all 10 importer mock groups and whitespace checks pass. Existing generated output was reused because this is documentation-only. Actions remain unavailable; exact PR REST GET/PATCH is used because organisation listing/search endpoints are suppressed.

Earlier delivery checkpoints below are historical and are superseded by this open handoff gate.

---

## Local core kit and plugin workflow delivered, 4 October 2026

This checkpoint delivers an explicit local UNDRR core: **25 native component families and 297 recipe variants**, with bounded authoring contracts. The full catalogue remains unfinished. See [CORE-KIT-STATUS.md](https://github.com/unisdr/undrr-mangrove/blob/spike/figma-token-bridge/examples/figma-plugin/CORE-KIT-STATUS.md) for the completed gates and remaining work, and [MAINTAINING-KIT.md](https://github.com/unisdr/undrr-mangrove/blob/spike/figma-token-bridge/examples/figma-plugin/MAINTAINING-KIT.md) for imports, component changes, review and recovery.

### Plugin interface

- Native-reviewed 600x740 interface with Mangrove-inspired blue, clearer type and surfaces, 40px targets, keyboard focus, reduced-motion support and Figma theme colours. Dark theme and narrower window rendering remain unverified.
- Persistent **Import / Core kit / Diagnostics** navigation, brand context and results footer replace the long disclosure-driven workflow. Sections reset their scroll position. Core selection count, refresh choice and Build stay visible without overlapping the family list.
- Explicit 25-family core preset and nine exact Regular foundation text styles. Unsupported future families are excluded from the preset; optional Condensed choices remain unticked. Search preserves selection. Source fonts are never substituted.
- Independent **Save results / Save test record / Save inspection** controls retain complete JSON despite the shorter visible summary. Source or brand changes invalidate stale build receipts while preserving recovery records. Busy operations serialize mutation controls. Restart recovery displays the saved scope and keeps advanced root details out of the primary status.

### Native acceptance and clean handoff

- Four Default three-option Segmented compositions use real exposed leaf instances and a shared source Legend style. Bounded 240/390px edits, hide/edit/show and two ordinary zero-create updates pass four consumer cohorts. Independent verification passes **1,746 predicate groups, zero failures**. Exact restart cleanup removes 145 temporary nodes and retains all 6,453 original assets. The short rail's 0.40625px native/source line-box delta is recorded.
- A Button inserted through normal Figma Assets retains its edited Label and **156x36 HUG** geometry through two ordinary **zero-create/96-update** builds. The ownership fix validates the actual canonical main component without adopting or clearing inherited consumer metadata. Exact cleanup removes only its two temporary nodes.
- Edited Chips Label at the source 240px preset, Text CTA Mobile Headline at 390px and Compact Empty State Description/Show media at 240/390px pass two ordinary **zero-create/303-update** builds, four cohorts and 12 consumers. Independent verification passes **10,757 checks, zero failures**, including source fonts, standard variable-font coordinates, full descriptors, shared styles, aliases, ranges and identity. A native PNG was reviewed; this does not establish font-file or raster parity.
- Saved records pass restart audit. Exact core-content cleanup removes all 77 temporary nodes. Final inspection confirms all **6,453 original assets unchanged**, with zero live temporary probes after the final UI Button update. A fresh local backup is verified; cloud synchronisation remains unconfirmed.
- Current export: **418 variables, 92 text definitions, eight effects, 28 families and 327 recipe variants**. Clean local kit: **5,982 nodes, 875 instances, 28 sets, 328 components** (including one historical diagnostic), **44 text styles and eight effects**. Export totals do not imply that every definition or family is accepted natively.

### Local verification

- `npx jest tokens`: **3 suites, 1,328 tests pass**.
- `yarn lint:check`: **zero errors, 22 existing warnings**. Targeted ESLint and Prettier on all 21 touched files pass; bundle syntax and whitespace checks pass.
- Variables mock: 10 groups; kit mock: 17 groups; UI protocol: 10 groups; actual UI DOM/navigation: three groups. Focused ownership, wrapper recipes, wrapper capability, Segmented leaves and core-content harnesses pass. Mock coverage is documented separately from native evidence.
- GitHub Actions are unavailable for this organisation. Listing/search endpoints are suppressed; this update uses the exact PR REST endpoint, without making queue-completeness claims.

### Deferred work and plan limits

Starter remains usable for this local single-mode core. Professional handoff still needs five simultaneous brand modes, library publishing and a real update in a consuming file. The maintenance guide records where to resume. Code Connect requires the applicable Organization or Enterprise plan.

Tabs require exact Condensed font loading; Editorial CTA needs a separately verified style-coupling repair. Neither is fixed by a plan upgrade. The wider catalogue, natural variant switching, other-brand rendered acceptance, RTL, arbitrary widths/content, browser interactions and exact raster parity remain follow-up scopes. Existing assets are retained. Earlier checkpoints below are historical evidence, not current acceptance totals.

---

## Segmented Default-size states accepted, 4 October 2026

- Expanded the canonical Segmented leaf family from three to 30 variants: two Selected values, five States and three Positions. The original three component, Label and shared-style identities and their canvas positions remain intact. Twelve focused leaves use source-specific coincident SCALE outlines with variable-bound per-corner radii, 4px gold behind 2px white. No inherited consumer outline geometry is repaired.
- All five native State batches pass two ordinary complete-family zero-create builds each. Independent saved-evidence verification passes 183,284 checks across 120 edited/fresh consumers in 20 cohorts, including full text ranges, fonts, shared styles, aliases, geometry, overrides and identity. Saved JSON cannot authenticate its origin and this does not establish full-rail or exact raster parity.
- Restart recovery removes exactly 341 temporary nodes (49/49/97/97/49). All 6,368 expanded assets remain unchanged after cleanup; all original 6,158 assets are retained, with 210 managed additions and no unrelated changes. All five batches were reviewed at 100%; native Focus/HoverFocus PNGs and a cleaned 349,314-byte local backup were saved. Cloud sync remains unconfirmed.
- Current export: 417 variables, 92 text definitions, eight effects, 27 families and 323 recipe variants. Native kit: 5,898 nodes, 847 instances, 27 sets, 324 components including one historical diagnostic, 44 text styles and eight effects. A read-only TEXT audit matches all 631 paths; the 30 new Segmented labels have no findings. The 51 older Tabs/Editorial findings remain exactly unchanged, including 18 incorrect style IDs across 24 TEXT nodes and 12 intentional TOC DIRECT entries.
- Connector compilation retains typed roles and all-brand alias dependencies. Individual focus payloads are 47,925 to 48,326 bytes. Six-focus and full-family payloads correctly refuse the existing 50,000-byte ceiling. Checkbox remains 47,814 bytes and passes its 48,000-byte safety gate. Remote execution remains unverified because of the connector quota; the desktop plugin provides native evidence.
- Local verification: token Jest three suites/1,328 tests; repository lint zero errors/22 existing warnings across 489 source files; importer ten groups, full-kit 17, source three, Segmented three, canonical six, coincident seven, leaves seven, UI ten, connector coincident five and scopes six groups pass. Touched Prettier, targeted correctness ESLint, bundle syntax and whitespace pass.
- Full implementation remains active. Next is the actual three-option Default composition with exposed leaf Labels and an editable Legend. Small, composed focus and middle-focus paint priority, fresh canonical fractional stress, exact font-file/raster parity, other native brands and RTL remain pending. GitHub Actions remain unavailable. Organization listing/search endpoints are suppressed; the exact PR endpoint is used.

## Portable saved-evidence verifier, 4 October 2026

- Added a repository CLI to independently check the saved Form Action optional-wrapper native report against current source guards and before/after/cleanup inventories. No native writes or hardcoded local evidence paths.
- Actual full evidence passes 17,778 raw-field checks, including 96 additional font-template/layout checks. Exact 172-node cleanup and all 6,158 retained assets are verified.
- A controlled Help wrapper width change fails. Partial/duplicate topology or phase records, wrong source roles/hashes and incomplete inventory arguments are refused. Ten focused checks, ESLint, Prettier and syntax pass.
- Maintenance docs include the command and proof limits: report-only input cannot independently establish retention; JSON cannot authenticate desktop provenance; passing does not establish shared styles, variant switching, ordinary builds or pixel equality.
- At this earlier checkpoint the expanded Segmented gate was still pending. Its subsequent bounded native acceptance is recorded above; the full inventory remains incomplete.

## Form Action optional-wrapper checkpoint, 4 October 2026

- Added the next source-guarded native diagnostic: one private set with fixed Joined/Stacked masters, five shared TEXT keys and three independent BOOLEAN wrapper keys. Optional text initializes at actual 390px before hiding; consumers make no descendant geometry writes.
- First native run completes 44 phases with 172 owned nodes and no errors. All 17,682 independent predicates pass, including source fonts/typed aliases/full ranges, positive optional reflow, source allocation/gaps/corners, exact edits/property keys and fuller consumer typography/geometry snapshots through two private-master reapplications plus fresh cohorts.
- This bounded architecture addresses the earlier zero-width optional-paragraph failure. Fixed layouts do not establish actual native Layout variant switching. Canonical shared styles, nested reusable masters, two ordinary builds, source Select anatomy and focus rendering remain separate gates.
- Reviewed joined/stacked long 240px and fresh 390px layouts at 100%; native PNG 84,138 bytes. No exact source raster or glyph-file equivalence claim. Restart recovery removes exactly 172 nodes, retains all 6,158 saved assets unchanged and leaves no survivors. Cleaned local backup verified 340,490 bytes; cloud sync remains unconfirmed.
- README, inventory, learnings and maintenance now describe the wrapper architecture, exact cleanup and separate acceptance boundaries. Portable mock uses real scope dispatch and has no private evidence-path dependency.
- Local verification: token Jest 3 suites/1,328 tests; lint zero errors/22 existing warnings across 488 files; importer ten, legacy capability 21, previous Form Action seven, optional-wrapper five, UI nine grouped checks. Touched Prettier, targeted ESLint, bundle syntax and whitespace pass.
- Full kit implementation remains active and incomplete. The prior canonical inventory and accepted Segmented subset are unchanged. GitHub Actions remain unavailable; suppressed queue listing/search is not evidence of an empty queue. Exact PR endpoint used.

## Segmented focus sizing checkpoint, 4 October 2026

- Added a source-preflighted 103-node native diagnostic comparing coincident STRETCH/SCALE outside outlines, with exact shared typography, source paints/corners, editable labels, 240/390px reflow, two private-master reapplications and fresh cohorts.
- First native run caught shared-style detachment after a literal fontSize write. Style-last attachment with inherited validated aliases fixes every recorded main/consumer association in the second native run. The focused mock reproduces this observed failure.
- SCALE preserves exact fractional outline/body widths in all 66 rectangle readings. STRETCH rounds them and fails all 66. Source aliases, complete native fonts, range paints, properties, identity and exact repeat baselines pass. Colour/allocation representation comparisons are narrowly scoped; exact retention is unchanged.
- Independent second verdict: 22,218 checks, 22,122 pass, 66 STRETCH failures and 30 original tiny numeric comparison failures retained. A separate native float32 allocation check passes all 132 readings. No pixel equality or middle focus occlusion claim.
- Both runs recover their saved ledgers after plugin restart, remove exactly 103 owned nodes and retain all 6,158 saved assets unchanged. Normal-scale canvas and native PNG reviewed; cleaned local backup verified at 340,490 bytes. Cloud sync remains unconfirmed.
- Canonical export remains 417 variables, 92 text definitions, eight effects, 27 families and 296 recipe variants. The Segmented family remains its accepted three-state subset. Focus/Small/rail expansion requires new ordinary-rebuild and visual gates; the full inventory remains incomplete.
- Updated README, learnings, inventory and maintenance guidance. Local gates: token Jest three suites/1,328 tests; lint zero errors/22 existing warnings across 488 files; importer ten, kit 17, UI nine, legacy capability 21 and focus-sizing five grouped checks. Touched Prettier, targeted ESLint, bundle syntax and whitespace pass.
- GitHub Actions remain unavailable for the organisation. Queue listing/search endpoints may return suppressed empty results; this update uses the exact PR endpoint.

## 4 October checkpoint: native Form Action joining diagnostics

Added a source-owned desktop diagnostic for four temporary UNDRR specimens: joined Search, Subscribe with long edits, independent error/disabled appearance and explicit source viewport 480/481 presets. No canonical FormAction family is accepted or added.

Real Figma exposed two mock/API mismatches: minimum width must be unset with null rather than zero, and inherited outline rectangle positions cannot be overwritten in an instance. Focused regressions reproduce the exact 17-node and 113-node failure/cleanup cases. Outline geometry is now authored on private masters and measured through native constraint inheritance.

The third desktop run completes all four procedures without errors and saves 31 phase observations. Independent verification passes 10,945 of 10,956 predicates. Fonts, typed source roles, effective range colours, properties, edited values, identities, clipping, source corners and inherited focus bounds pass. The 11 failures describe two real layout defects:

- The nested row ignores a joined layout-mode override and remains vertical.
- Newly shown stacked Help/Error paragraphs retain zero width through both private-master reapplications, producing a 2,384.5px field.

Normal-scale canvas review and a saved native PNG confirm the paragraph failure. Ordinary joined Subscribe and long 240/390px specimens match measured source heights; intrinsic native action widths differ slightly from the browser. Font-file/glyph equality, intermediate focus occlusion, shared style association, reusable nested masters and ordinary canonical rebuild acceptance remain unverified. Hidden optional TEXT sizing is excluded from visible paragraph criteria; visible paragraphs require positive consumer-matched width. Report criteria now require the actual row mode, axes and source seam.

After plugin restart, saved-report recovery removes exactly 113 temporary nodes without errors. All 6,158 preceding assets retain identical saved fields, with no additions or surviving temporary IDs. A new local Figma backup is verified at 340,489 bytes; cloud synchronisation is unconfirmed. Output remains 417 variables, 92 text definitions, 8 effects and 296 variants across 27 families. The previous 51 Tabs/Editorial CTA findings remain open; full inventory completion is not claimed.

README, learnings, inventory and maintenance guidance now document the diagnostic, native failures, exact cleanup and next experiments: explicit joined/stacked masters and an optional-paragraph wrapper sizing contract. A separate Segmented focus-sizing experiment is prepared privately for the next desktop checkpoint.

Local verification: token Jest 3 suites/1,328 tests; repository lint 0 errors/22 existing warnings and 488-file coverage; importer 10, full kit 17, UI 9, existing capabilities 21, Segmented joining 4/shared-style 6, FormAction source 4/native diagnostic 7 grouped mock checks; touched Prettier, targeted ESLint, bundle syntax and whitespace checks all pass. GitHub Actions remain unavailable for the organisation. Queue listings/search can be suppressed; this PR is read and updated through its exact REST endpoint. Draft status and stacked base spike/react-aria-surface are retained.

---

## Segmented shared-style subset and next source packets (4 October 2026)

The canonical Segmented Control segment family now has three final Position=First identities: unselected Default, selected Default and unselected Hover. They use the actual shared source 120% text style, typed font/paint aliases, source per-corner geometry and a source minimum-height role. This is a bounded subset; the remaining 27 states, Small, legend breakpoints and compositions are still unaccepted.

### Native evidence and an actual mock divergence

- First construction creates 22 nodes. Ordinary scoped rebuilds create zero and update 21 without errors. Initial canonical/fresh review inspections pass 167 source predicates per phase.
- The first edited-consumer run caught an inherited identity collision: temporary root instances inherited canonical mgKitId values, so the ordinary builder refused duplicate ownership before writes. Exact cleanup removed all 13 nodes. The mock had explicitly cleared inherited IDs despite invoking the real builder, hiding that native condition.
- Corrected probes get unique owned instance identities while retaining their actual canonical main and inherited source TEXT identities. The regression now reproduces the original rejection, preserves native inheritance and exercises real zero-create builds with 13 and 19 probes present.
- A fresh desktop run passes both ordinary rebuild advances, creating new untouched consumers after each: exact ledgers 13, 19 and 25. Independent verification passes 170 structural and 810 source/style/range/repeat checks, 980 total with zero failures. Canonical set/component/TEXT/style/Label IDs, full native fonts, typed aliases and blue/white/white effective range paints survive. Edited labels, 240px sizing and RIGHT text alignment survive.
- Normal-scale canvas review and a transparent PNG capture cover the three short states and edited consumers. Saved-report recovery after restart removes exactly 25 nodes without errors. All 6,158 existing assets retain identical saved fields, with no additions or surviving probe IDs. A new local Figma backup is saved and verified; cloud synchronisation is still unconfirmed.

Export: 417 variables, 92 text definitions (60 foundations, 32 component styles), eight effects, 27 families and 296 recipe variants; 16 tokens remain skipped. Native: 44 local text styles, 27 sets, 297 components including the historical diagnostic, 5,688 nodes and 820 instances, with no inspection errors. The scoped Segmented audit passes 3/3 main TEXT paths without a direct typography exception. The full audit matches 604/604 paths but retains the same 51 older Tabs/Editorial CTA findings, including 18 wrong style IDs. This checkpoint does not repair those findings or accept the earlier joined focus/wrap discrepancies, other brands/scripts or font-file/glyph parity.

### Source packets and maintenance

The exporter now includes a guarded capabilities.formActionJoining packet without adding canonical FormAction assets. It derives typed brand roles, exact source input/action templates, literal -1px seams and the viewport <=480 stacking boundary. MCR2030's derived action content is 52px, separately from source minimum/control 46px. Entered-text black remains a measured Chromium/macOS baseline; errorText alone adds no red control border, and HTML-disabled actions without the authored class retain source paint. Native joining, focus, clipping, Select and consumer-repeat gates are next.

UserFeedback browser learnings are documented: contextual 40px actions, 900px viewport breakpoint, balanced 14px/140% question, actual Arabic font cascade and the mixed-inline acknowledgement/focus limitations. No native UserFeedback acceptance is claimed. README, component inventory, learnings and maintenance docs explain scope, repeat order, fresh cohorts, saved report recovery, unique inherited probe identities and conservative cleanup. The full-inventory goal remains active; family counts are not completed public-component coverage.

### Local verification

- npx jest tokens: three suites, 1,328 tests pass.
- yarn lint:check: zero errors and the same 22 existing warnings; targeted ESLint on touched JavaScript/CommonJS passes.
- Touched Prettier, bundle syntax and git whitespace checks pass.
- Importer ten, full kit 17, UI nine, existing capability 21, Segmented source three, joining four, canonical recipe three, canonical native-control-flow six and FormAction source four grouped mock checks pass. Mocks do not establish native cache, font metrics or rendering.
- Full native text audit intentionally remains nonpassing with the 51 existing findings above; scoped new-family checks pass.

GitHub Actions are unavailable for this organisation. Listing/search endpoints can be suppressed, so the known PR is updated and verified through exact REST requests. Starter/Professional handoff and font/publication limitations remain in the existing sections and docs.

---

## Segmented Control source and native diagnostics

The source-owned packet and four temporary fixtures are implemented. Browser research covers actual Segmented Control/Form Action JSX and fresh full SCSS in 150 snapshots across 30 instances. No canonical component family is added by these diagnostics.

Real desktop checks establish intrinsic seams/corners and equal-width body/text reflow through seven edited-label/width/restoration phases. Native narrow height is 56px versus source 55.59375px; exact font-file parity remains unverified. Independent readbacks pass 2,370/2,415 predicates. Remaining mismatches are the wrapped third segment at x=0 instead of −1 (three phases), 42 fractional focus widths overshooting by 0.3333px, and middle focus paint order requiring a separate solution. Body reflow success does not accept resized focus geometry or a shared-style contract.

Saved-ledger recovery removed all 101 temporary nodes without errors. A fresh inspection preserves all 6,134 existing assets with identical saved fields. Normal-scale canvas and native PNG evidence cover final short body/wrap specimens. Next is a canonical three-state subset with exact 120% shared typography, effective range-paint checks and two ordinary consumer rebuilds before expanding the family.

Local checks: token Jest 3 suites/1,328 tests; lint 0 errors/22 existing warnings (486 source files); importer 10, full kit 17, UI 8, existing capability 21, new source 3 and new capability 4 grouped checks; targeted ESLint, touched Prettier, bundle syntax and whitespace pass. GitHub Actions remain unavailable; these are local results. Exact PR lookups are used because organisation listing endpoints are suppressed.

## Purpose and stack

Bring Mangrove's tokens, brand layers and source component recipes into a reusable native Figma kit. **Exploratory draft, stacked on #1088; base is `spike/react-aria-surface`, not `main`. Not intended to merge as is.** No production JSX/SCSS or account settings are changed.

Latest verified checkpoint: **`22eb465c`, TOC and Status Label, 4 October 2026**. The full kit goal remains active; construction, native observations and outstanding acceptance stay separate. No library is published.

## What this implements

```text
YAML tokens + component SCSS
  -> yarn build:figma-tokens
  -> generated JSON definitions + bundled development plugin
  -> local Figma variables, styles and native components
```

- The exporter reuses `build-tokens.cjs` loading/layering/merge/resolution. References become aliases; alpha casts become RGBA. Private primitives are hidden, scopes/WEB CSS syntax are set, two-value shorthands split block/inline, and skipped variables retain reasons.
- One **Mangrove** collection contains the five brands: UNDRR, DELTA Resilience, IRP, MCR2030 and PreventionWeb. Starter's single-mode workaround overwrites and renames that physical mode when one brand is selected, preserving variable identities and bindings.
- `styles` supplies selectable foundations and source component typography/effects, including inset shadows, focus bands and Radio inset. Exact fonts load before edits; missing fonts report without substitution. Required component styles are builder dependencies, not default foundation selections.
- `components` owns guarded source references, geometry, bindings, semantic anatomy, variant axes and TEXT/BOOLEAN properties. The runtime supplies native auto layout, instances, source SVGs and validated ellipse arcs.
- Rebuilds retain owned asset/property IDs and edited review content; dependencies build before composites. Main components are separate from state/long/narrow review instances. Explicit refresh reapplies geometry without reseeding content. Unexpected types/ownership reject; user additions and obsolete owned children are retained/reported. An existing-family failure can leave partial updates: save the full report.
- Shared public identities use `orgundrrmangrove`; desktop also reads legacy private metadata. Migrate renamed privately identified assets in desktop before connector use. SVG source/identity/native geometry checks reject changed content pending a reviewed migration.
- Serialised UI actions download full reports and family PNGs; font checks are explicit. Temporary roots use exact owned ledgers and saved-root/report recovery. Cleanup refuses moved, detached, foreign or unrecorded content.

JSON and `build/main.js` are ignored build output. Design values remain exporter-owned.

## Verified kit checkpoint

**Export:** 416 variables; five brand definitions; 91 text definitions comprising 60 Regular foundations (12 defaults) and 31 component styles; eight effects; 16 skipped variable tokens; **26 families / 293 recipe variants**.

**Native:** 416 variables, 43 local text styles, eight effects, 26 sets, 294 components including one historical diagnostic; zero inspection errors. Local style count does not prove every face loads. Final inspection records 5,666 nodes and 817 instances. A refreshed local backup is saved; cloud sync unconfirmed. All 5,663 preceding inventory entity IDs remain in the current 6,134, with no kind/type changes. All 441 recorded temporary experiment/acceptance IDs are absent.

Built inventory below includes native dependency sets. Tabs/Tab trigger and Editorial CTA are **blocked for acceptance**. Other families have bounded observations, not complete state/brand/script coverage.

| Family              | Variants |
| ------------------- | -------: |
| Button              |       16 |
| Text input          |        6 |
| ComboBox option     |        6 |
| ComboBox            |        6 |
| Tab trigger         |        6 |
| Horizontal Tabs     |        1 |
| Textarea            |        6 |
| Table header cell   |        4 |
| Table body cell     |        4 |
| Table row           |       24 |
| Table               |        8 |
| Text CTA            |        6 |
| Radio               |       30 |
| Checkbox            |       30 |
| Form error summary  |        6 |
| Switch              |       22 |
| Switch small        |       20 |
| Editorial CTA       |       23 |
| Chips               |       16 |
| Details             |       20 |
| Closed Select       |        5 |
| Loader              |        2 |
| Compact Empty State |        4 |
| TOC Link            |       12 |
| TOC Numbered        |        3 |
| Status Label        |        7 |

Source coverage/limitations: [component inventory](https://github.com/unisdr/undrr-mangrove/blob/spike/figma-token-bridge/examples/figma-plugin/COMPONENT-INVENTORY.md).

### Latest native observations

- **Loader:** PNGs caught a reversed arc despite successful readbacks. A positive 270-degree sweep crossing zero now renders source 40/96px rings with transparent holes and bound paints. Motion, reduced-motion/status semantics and automatic breakpoints are not implemented.
- **Compact Empty State:** source tray vectors retain bound strokes. Native TEXT rejects maxWidth binding, so a FILL/HUG FRAME owns the 440px cap. Four bounded comparisons pass: 200×90px mains, long 200/240px specimens at 132px and omitted media at 51px, with source paints/spacing/PRETTY. Intrinsic text allocation/SVG quantisation differ; wider/edited consumers and pixel/font-file equality remain unverified.
- **Ordinary repeat:** Loader + Compact Empty State created zero nodes, updated 74 and reported no errors.
- **Edited Details + Select:** open BelowMedium390 long Title/Paragraph and Invalid short Value/feedback/BOOLEAN edits retain 240px FIXED/HUG sizing, axes, bindings and IDs. Ordinary rebuild: 0 created, 303 updated, no errors; 274 assertions pass with unclipped rendered content. Strict cleanup: 20 removed, 0 retained; all 20 absent in final inspection.
- **Earlier edited ComboBox/Radio:** 441 assertions and rendered review pass, including three nested option Labels and alignment override. Restart cleanup: 32 removed, 0 retained. Other families' consumer edits remain unverified.
- **Saved-field audit:** 601/601 main TEXT paths match their recipe paths. The audit retains the same **51 older findings**: six Tabs missing-font labels and 45 Editorial CTA style/decoration/offset mismatches. The TOC families match 33/33 and Status Label 7/7 scoped TEXT paths with zero gaps; 12 TOC labels have explicit source typography templates. Matching paths and zero inspection errors do not mean zero fidelity findings.

See [current native learnings](https://github.com/unisdr/undrr-mangrove/blob/spike/figma-token-bridge/examples/figma-plugin/LEARNINGS.md#loader-and-compact-empty-state-on-4-october-2026), [earlier composition findings](https://github.com/unisdr/undrr-mangrove/blob/spike/figma-token-bridge/examples/figma-plugin/LEARNINGS.md#table-text-cta-and-native-composition-checks-on-3-october-2026) and [the architecture review](https://github.com/unisdr/undrr-mangrove/blob/spike/figma-token-bridge/examples/figma-plugin/ARCHITECTURE-REVIEW.md).

## Transport and maintenance

The connector uses the same runtime, exact dependency closure and a local lossless JSON codec. Explicit `variableIds`/`styleIds` and variant batches retain aliases/styles/component dependencies. Malformed/duplicate/unknown scopes reject before writes. No pruning, truncation or silent omissions. Finish every batch before accepting a Starter brand switch; a partial single mode mixes brands.

Ceiling: **50,000 characters or UTF-8 bytes**. Scoped compilation removes only absent features, preserving malformed-declaration checks. Checked Default Checkbox is **47,814 bytes**, leaving **2,186** and passing the 48,000 regression gate. Other checked scopes: unchecked Checkbox 39,615; Chips 38,583; editorial Hero Hover 43,589; Table Story 47,396; Loader 38,375. Five-brand import batches retain 416 variables/99 style definitions at 21,190–34,620 bytes. DIRECT TOC is 41,738 bytes and retains its source template, typed roles and alias closure. Full matrices need explicit batches or desktop. **Remote batches remain unverified: Starter allowance is exhausted.**

Workflow: measure source/cascade, update guards/bindings, run local gates, save inspection/backup, build a scoped change, inspect/render fresh and edited consumers, repeat and document evidence. Freeze watched plugin writes/builds while probes are live: hot reload can lose reports. Cleanup/migrations use exact ownership. No canonical Editorial CTA migration bypasses its failure.

Installation, batching and report controls: [README](https://github.com/unisdr/undrr-mangrove/blob/spike/figma-token-bridge/examples/figma-plugin/README.md). Maintenance, component changes and acceptance experiments: [runbook](https://github.com/unisdr/undrr-mangrove/blob/spike/figma-token-bridge/examples/figma-plugin/MAINTAINING-KIT.md).

## Access and unresolved acceptance

- **Starter now:** one mode and local assets in one canonical file. Single-brand re-import preserves aliases/identities; recorded five-brand round-trips are structural evidence, not full rendered brand acceptance. The desktop development plugin remains usable after connector quota exhaustion.
- **Professional pickup:** verify Full seat/edit access, move the canonical file into a Professional team project, save inspection/backup and import all five brands. Its documented 10-mode allowance is sufficient. Check retained IDs/modes, publish only an accepted subset and verify an update in a separate consumer file. Paid migration/publication are unverified. The development manifest stays local: Professional lacks private team plugin publication. [Handoff checklist](https://github.com/unisdr/undrr-mangrove/blob/spike/figma-token-bridge/examples/figma-plugin/MAINTAINING-KIT.md#professional-access-handoff)
- **Code Connect:** later work; Organization or Enterprise access is required. Professional does not establish that capability.
- **Fonts/glyphs:** desktop static Condensed faces fail; loadable variable candidates do not establish file/axis equivalence. Browser/Figma files, metrics, line breaks and ComboBox glyph fallback remain unverified. Construction success does not authorise substitution.
- **Remaining fidelity:** inline required markers, long supporting text, native Select popup/truncation, Textarea resize/scroll, automatic Table sizing, broader edited consumers, brand contrasts and Arabic/RTL. Hero/media/rich-text remain unbuilt. Visual states do not implement browser interaction/accessibility/network behaviour.
- **Publication:** exclude unresolved Tabs/Editorial CTA. Cloud sync remains unconfirmed despite the local backup. This is a checkpoint, not full-kit completion.

## TOC and Status Label checkpoint

- **TOC:** 12 finite-cap Links cover three measured widths × Default/Hover/Focus/HoverFocus. Three Numbered presets retain required heading and six independently editable nested links. Source measurements establish 240/390/900px row structure and last-line markers. Exact glyph pixels, unbroken source overflow, live parent-relative caps, bulleted lists, other brands/scripts and arbitrary widths remain unverified.
- **Native TOC repair:** shared Label properties plus associated text styles produced incorrect effective range colours on repeat despite correct nominal fills. Controlled distinct-style IDs still failed. Clearing association in place and restoring direct font-family/size aliases passed native controls without replacing IDs or wiping edited consumers. Only 12 TOC labels use this guarded exception; the imported shared style remains their source template. Reimport the template and rebuild components after typography changes. Other families keep their existing association contract; no Editorial cause or repair is inferred.
- **Repeat:** canonical first and second repair builds each created zero nodes, updated 172 and reported no errors. All 12 main range paints, typography, aliases and identities match exactly; saved-field audit passes 33/33. Six edited native consumers passed all 2,819 assertions at 240/390/900px; the repeat created zero nodes/updated 172, and exact cleanup removed all 106 probe nodes with none retained. Rendered numbered consumers keep long titles, all six edited links and an alignment override without clipping. The first comparison rejected Figma's exact float32 representation of 110%; the corrected source check accepts that exact representation while repeat baselines stay exact.
- **Status Label:** all seven intrinsic noninteractive source geometries, including diamond/capsule/chamfered polygons, required Label and source role bindings. Source group layout is not represented as a generic wrapping row. Draft/Capsule slots use centre-aligned native auto layout; polygon rings use guarded source geometry and need a reviewed regeneration for size/ring changes. Native repeat created zero nodes/updated 83; all seven edited consumers passed 816 assertions; strict cleanup removed 36 nodes with none retained. Grouping, arbitrary wrapping, Arabic fonts and pixel/font-file parity remain pending.

See [TOC and Status native findings](https://github.com/unisdr/undrr-mangrove/blob/spike/figma-token-bridge/examples/figma-plugin/LEARNINGS.md).

## Local verification for this checkpoint

GitHub Actions are unavailable; checks are local. Organisation list/search endpoints are suppressed, so this PR is read/updated directly by number. Empty listings do not establish an empty queue.

| Gate                                      | Result                                                 |
| ----------------------------------------- | ------------------------------------------------------ |
| `npx jest tokens`                         | 3 suites / 1,328 tests pass                            |
| `yarn lint:check`                         | 0 errors; 22 existing warnings across 485 source files |
| Importer / kit                            | 10 / 17 grouped scenarios pass                         |
| Loader / Empty State                      | 5 / 5 pass                                             |
| Details / Select / SVG                    | 6 / 5 / 6 pass                                         |
| Acceptance / UI / connector scopes        | 17 / 8 / 7 pass                                        |
| TOC / Status Label / native-field auditor | 7 / 3 / 6 pass                                         |
| Native capability controls                | 21 grouped scenarios pass                              |

Targeted ESLint, touched-file Prettier, bundle syntax and whitespace checks pass.

Mocks check bounded API/identity/preflight/scope/repeat contracts, not rendering, fonts, cloud state or publication. Native reports/PNGs establish only the observations above. Historical test counts and correction details remain in the linked docs.
