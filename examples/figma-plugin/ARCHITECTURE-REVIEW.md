# Mangrove Figma kit architecture review

Reviewed on **3 October 2026**, against source revision `ea33e7b8`, before the higher-order Table and Text CTA extension. The baseline exporter contains 246 variables, seven component families and 47 variants. This is a review of code, generated recipes and recorded evidence. It includes no new Figma mutation or rendering check.

The numbered findings describe that historical baseline. The outcome sections record later implementation and evidence. The [current checkpoint](#svg-summary-and-edited-instance-checkpoint) contains 308 variables, 75 text-style definitions, five effects, 15 families and 159 variants; generated definitions are distinct from successfully imported native styles.

## Assessment

The current approach is suitable for continuing a bounded exploratory kit. Values belong to the exporter, construction is generic, aliases survive import, main components are separate from instance-based review specimens, and composites build their dependencies first. Shared text/effect styles, editable TEXT/BOOLEAN properties and exposed nested instances give it a useful native Figma structure. Repeat-build and actual desktop identity evidence are stronger than a one-time generated canvas.

The next step should exercise composition and real consumer instances. Publishing should wait for the accepted subset to pass the Professional handoff in [MAINTAINING-KIT.md](MAINTAINING-KIT.md#professional-access-handoff). A comprehensive collection split, separate page for every family or additional abstract base components would add migration work without resolving the immediate fidelity gaps.

Severity below describes the follow-up priority, not a claim that existing assets must be replaced. **High** is an acceptance or maintenance gate for the affected component. **Medium** is a concrete improvement before broad library use. **Later** is optional architecture work requiring its own evidence.

## Findings and concrete follow-ups

### 1. High: prove responsiveness on fresh consumer instances

**Evidence:** `scripts/figma-component-recipes.cjs` gives Button labels HUG sizing. `kit-builder.js` repairs finite-width wrapping only on the narrow Button review instance, with a separate explicit refresh path for existing review instances. The recorded 240px, two-line review proves that specimen's appearance; it does not prove a freshly inserted Button or a Button nested in a CTA will wrap the same way. Field-label, help and error overflow are also recorded gaps.

**Follow-up:** Test a new Button instance inside the intended CTA action container with a long editable label. Record its label sizing, actual dimensions and rendering after narrowing and after a repeat build. If wrapping is required by the rendered source, change the reusable component or its bounded composition contract deliberately, preserving existing IDs and overrides. Keep a fresh-instance specimen as acceptance evidence. Do not publish a general responsive claim based on a repaired review instance alone.

Figma distinguishes HUG, FILL and fixed sizing; changing a parent's width does not automatically replace a child's sizing choice. [Auto layout sizing](https://help.figma.com/hc/en-us/articles/360040451373-Explore-auto-layout-properties)

### 2. High: Table needs a shared column contract

**Evidence:** The generic recipe contract supports horizontal/vertical frames and per-node sizing, but no shared table column computation. Independent HUG rows would allow header and body boundaries to diverge. The source `.mg-table` uses the browser's table algorithm, content wrapping and collapsed borders, which a collection of ordinary frames does not reproduce automatically.

**Follow-up:** Begin with an explicit, bounded column layout shared by header and body. Expose cell text or primary nested cell instances, keep row height responsive to content, and compare long content, unequal content lengths and narrow widths. Verify striped row parity and bordered seams, including whether adjacent strokes double the source's one-pixel collapsed border. State the initial row/column count and the supported resizing behaviour. Do not label the scaffold an arbitrary-data or browser-auto-table equivalent.

The default review builder assumes each family has a root Label property or a declared nested Label target. A Table specimen should intentionally target an editable cell or adopt a deliberate family-specific content contract, rather than adding a meaningless Label solely to satisfy the review builder.

### 3. High: CTA actions have source-defined context overrides

**Evidence:** `stories/Components/TextCta/text-cta.scss` changes standard buttons on strong surfaces: primary fill becomes white, text uses the hero role and borders use a white alpha cast. Secondary actions have their own hero roles. In `kit-builder.js`, INSTANCE recipes currently apply property overrides and layout, while fill/stroke/binding configuration belongs to non-instance recipe nodes. Nesting an ordinary Button therefore does not implement these contextual styles by itself.

**Follow-up:** A soft-surface text CTA is the smallest composition that can reuse current Button appearance without additional contextual construction. A strong-surface CTA needs an explicit inverse/contextual action contract with truthful source roles and its own state checks. Reuse an actual Button instance where possible; do not detach it or copy its layers to bypass a missing contract. Heading fonts and action wrapping remain acceptance gates. Editorial CTA links, images, rich text and breakpoint-specific inline layouts are separate scope.

Exposing only the nested instances designers need to edit is an appropriate property API. Figma documents TEXT, BOOLEAN, variant and instance-swap properties separately; exposed nested instances reveal the nested API instead of requiring deep layer selection. [Component properties](https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties), [Plugin API property guide](https://developers.figma.com/docs/plugins/working-with-component-properties/)

### 4. Medium: narrow variable picker scopes before publication

**Evidence:** In the reviewed 246-variable output, 175 variables use ALL_SCOPES. `scopesFor()` returns it for every colour, control roles use it, and helpers such as trigger width, maximum width and transparent/browser-fieldtext colours also use it. Font-size, radius, opacity and some spacing roles already have useful scopes. Private YAML tokens correctly carry hiddenFromPublishing.

**Follow-up:** Give semantic colours scopes for their actual uses, such as TEXT_FILL, STROKE_COLOR or FRAME_FILL/SHAPE_FILL. Shared palette colours can legitimately serve several roles. Set dimension helpers to WIDTH_HEIGHT, spacing to GAP where appropriate, and focus helpers to stroke/effect roles according to their consumers. Consider hiding technical construction helpers from the published picker while preserving dependencies; verify that behaviour in a real consuming file before release. Do not hide useful primitives merely because a generic architecture example recommends it.

This is picker usability, not a binding failure: Figma says scopes restrict picker visibility and do not prohibit Plugin API binding in other fields. Scope tightening can therefore preserve actual variable IDs and existing bindings. [Variable scopes](https://developers.figma.com/docs/plugins/api/VariableScope/), [Variable metadata semantics](https://developers.figma.com/docs/rest-api/variables-endpoints/)

### 5. Medium: separate anatomical identity from display names before routine refactors

**Evidence:** The exporter `identity()` overwrites node IDs with their full name path. Renaming or moving an anatomy layer changes its ownership key. The builder retains obsolete owned children rather than deleting them. Removed families/variants have no general retirement engine. `ensureProperty()` preserves actual property IDs and defaults, so changed recipe defaults do not automatically update existing definitions. These limits are already described in the runbook.

**Follow-up:** Preserve today's keys for ordinary updates. Before an anatomy rename, property contract change or retirement, create a concrete old-to-new migration map and inspect affected instances/overrides. A future schema can introduce explicit immutable anatomy IDs while retaining the old IDs as a migration source. Report obsolete families and variants alongside obsolete children. Give default-value changes a reviewed in-place update policy that distinguishes new-instance defaults from existing consumer overrides. Do not silently recreate published components.

Shared plugin metadata is a reasonable public source-identity mechanism for the desktop/connector bridge. Private workflow/account evidence belongs in the local ledger. The acceptance helper additionally persists bounded synthetic probe evidence in shared metadata, with no private file/account details, so its baseline can survive a plugin restart. Treat that data as public to other plugins. [Shared plugin data](https://developers.figma.com/docs/plugins/api/properties/nodes-setsharedplugindata/)

### 6. Medium: verify real mode inheritance and publication updates

**Evidence:** The builder pins only its main/review containers to the selected brand mode, leaving recipe descendants to inherit. This is a sensible model for simultaneous brand review frames. Starter round trips established value/alias and identity retention, but do not establish five simultaneous modes, published variable dependencies or accepted changes in a second file. Some focus geometry is calculated at build time, and exact fonts remain an independent gate.

**Follow-up:** After Professional migration, put fresh shared-component instances into two differently themed frames in a consumer file. Confirm nested instances follow the containing frame, no child is accidentally pinned to the source brand, typography and effects resolve correctly, and an accepted published update preserves overrides. Inspect bounds after mode changes wherever recipes compute geometry rather than binding it. Keep the documented UNDRR baseline and complete the existing handoff before broad release.

Figma's Auto mode inherits from the containing hierarchy and otherwise uses the collection default. Explicit assignments remain linked to their mode even if the default changes. [Mode inheritance](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables)

## Extension outcome

The Table/Text CTA extension now exports 277 variables, 12 families and 93 variants. The desktop file contains all those variants, 25 selected text styles and four effects. The original 246 variable IDs and seven sets/47 variants remain unchanged. A normal repeat created zero nodes, updated 322 and reported no errors, preserving the selected families' set, variant and property IDs.

- **Table column contract implemented:** Equal short templates use shared columns; Story and NarrowStory presets put their measured widths on Row masters. Actual nested size and width/height binding writes below a consumer instance were silently ignored, so review preflight now rejects them. Review nodes seed editable text only. The narrow preset preserves 292.703125px table width in a 240px consumer. Figma wraps the text differently from the browser; Story rows and cells now hug content above source-measured minimum heights. The narrow body rows grew to 262.5/263px instead of the browser's 222.015625/222.515625px, preventing overlap. This is a recorded representation difference, not a claim of exact font-file parity or browser table automation.
- **CTA context and finite-width presets implemented:** Native Button instances retain source linkage and bound contextual paints. Six bounded masters include the four short surface/viewport combinations and two long-action presets. The actual long actions measured 200 × 64px and 120 × 106px with FILL labels and unclipped wrapping. Desktop 720px composition measured 259px high; Mobile 320px measured 325px versus the browser's 324.5px. Arbitrary consumer resizing, multiple actions and general Button responsiveness remain separate scope.
- **Connector batching implemented:** Packed data preserves metadata. Full Table/Row/CTA matrices require explicit variant batches; the builder arranges every retained variant to avoid overlapping main grids. Eight Table and six CTA batches pass native-runtime mocks, with stable IDs and zero-node repeats. Actual connector batch assembly remains unverified because the Starter allowance is exhausted.

Findings about picker scopes, anatomy migration, exact fonts, simultaneous modes, consumer publication and cloud synchronisation remain open. Edited native text/visibility survival has targeted mock coverage; the actual repeat above checks unchanged content and identity rather than a new designer-edit experiment. The maintenance runbook describes preset updates and explicit review refresh.

## Later options

- **Slots for extensible compositions:** Current Figma documentation includes SlotNode/createSlot for editable content inside component instances. This could support variable row content or CTA custom content without detaching. The current runtime and mocks do not support slots. Prototype one bounded case and check actual access, update behaviour, identity, allowed content and overrides before adopting it. It is unnecessary for the first fixed-content scaffold. [SlotNode](https://developers.figma.com/docs/plugins/api/SlotNode/)
- **Instance-swap properties:** Add them when a real source-defined swappable role exists, such as an icon or a compatible cell content family. They are preferable to multiplying unrelated variant axes. The present text/boolean contract does not need arbitrary swapping to be useful.
- **Collection and page restructuring:** Decide collection splitting before a broad release if consumer editing requires it, using an explicit alias/binding migration. Keep existing objects in place until there is a demonstrated benefit. Page separation is organisation, not a fidelity fix; current ownership discovery is page-scoped.
- **Provenance:** A generated source SHA or content hash in local reports would make code/Figma comparisons easier. Current source references and schema version plus the external evidence ledger are sufficient for the bounded spike; never embed private file/account details in public provenance.

## Unverified acceptance

The original baseline review did not establish Table/CTA rendering. The extension outcome records bounded desktop checks; arbitrary row/column editing, slot support in the canonical file, designer usability of exposed nested properties, exact font-file equivalence, Arabic/script routing, cloud synchronisation and paid-library migration remain unverified. Existing Condensed load failures remain failures even when the face appears in the font list. Mock success does not replace normal-scale visual checks or an actual consumer-file update.

Use these findings for future component acceptance. Complete the Professional handoff and remaining consumer checks before publishing a wider kit.

## Radio and review scaling outcome

Radio extends the checkpoint to 290 variables, 13 families and 123 variants, with 25 selected native text styles and five effects. Native ELLIPSE is a validated leaf type. The real checked-inset PNG required a derived spread of 5px to paint the source 3px band inside its 2px inside stroke. Source and native helpers remain separate and documented. The ordinary desktop repeat created zero nodes and retained all preceding variable/component/property identities. Bounded 240px consumers retain source shrink widths and row heights; arbitrary CSS flex layout remains outside those presets.

Family PNG export targets the exact owned review section and needs one selection, reducing the cost of inspecting the growing sheet. Explicit connector import batches preserve every definition plus alias/style dependencies and never prune. All five brands pass batch mocks; actual connector execution is pending its exhausted allowance. Complete every import batch before accepting a one-mode brand switch.

Independent review recommended a separate native acceptance-probe area: create recorded instances, edit TEXT/BOOLEAN and exposed nested properties plus one formatting override, run an ordinary refresh-off repeat, then compare actual IDs and overrides. The helper and UI are implemented; the later native checkpoint passed 441 assertions and visually reviewed the edited consumers. Unchanged-content repeats and mock override checks do not establish edited-consumer preservation. See [the runbook](MAINTAINING-KIT.md#check-edited-native-instances).

Source SVG support now maps a leaf recipe to a native FRAME viewport with retained imported descendants. Native Checkbox SVG construction succeeded for its exact source checkmark. Immutable content and native fingerprint validation deliberately reject changed artwork rather than silently reimport it. This is a bounded foundation for later icons, logos and media consumers; arbitrary assets and source-changing vector migrations still require their own checks.

## SVG, Summary and edited-instance checkpoint

The current exporter contains **308 variables, 75 text-style definitions, five effects, 15 families and 159 variants**. Checkbox adds source vectors and bounded narrow tiling; Form error summary adds six variants with editable title/error text and source underline. Native Checkbox SVG construction succeeded. The Summary desktop build constructed all six variants successfully. Native normal and edited long examples now retain underlined links and balanced titles; its repeat created zero nodes, updated 114 and reported no errors. Definition counts do not establish font recovery, complete style import, all-brand acceptance, cloud synchronisation or publication readiness.

### Bounded vectors preserve identity

The SVG recipe contract has fixed positive viewport dimensions, a source viewBox of the same aspect ratio, a stable asset ID and exact markup. Preflight accepts a deliberately bounded source shape/attribute subset. The importer receives explicit intrinsic dimensions and must preserve that native FRAME viewport; a trimmed path-bounds result is rejected. Artwork uses native `rescale`, which scales paths and strokes, rather than a wrapper-only resize. Equal-size repeats perform no rescale and retain wrapper/vector IDs. Same-aspect sizing is supported; aspect-ratio or source changes require an explicit migration.

`mgSvgAsset` records original markup and its hash, paint policy, source opacity, exact imported topology and native geometry fingerprints. The preflight compares identities and vector paths, positions, dimensions and stroke geometry before updating existing assets. It rejects modified native geometry/topology and changed source content. This protects consumers by blocking unsupported changes; it is not a general in-place source-vector editing engine.

Original-colour assets keep their paints unless a recipe explicitly declares a monochrome fills/strokes channel. That channel requires visible SOLID paints of one colour in source and native import. Avoid blanket recolouring or silent replacement of multicolour artwork; gradients and other unsupported SVG features are outside the bounded parser. SVG mocks cover bounded fixtures, viewport scaling, identity and rejected changes; they do not implement arbitrary XML/path rendering. Broader asset and changed-source acceptance remain open. [Native rescale](https://developers.figma.com/docs/plugins/api/properties/nodes-rescale/)

### Text support follows actual native enums

TEXT recipe `textWrap` maps to native `textWrapStyle` using AUTO, BALANCE or PRETTY. DEFAULT is invalid. Wrapping style remains separate from finite width and HUG/FILL sizing. Whole-node source underline is explicit through `textDecoration: 'UNDERLINE'`; NONE is the supported reset. Fonts must be loaded before text, alignment, wrapping, decoration or style writes. The Summary link records CSS weight 600 separately from the browser-measured bundled Roboto Bold face. Rich-text ranges, navigation and exact font-file equivalence remain separate work. [Native text properties](https://developers.figma.com/docs/plugins/api/TextNode/)

Decoration/wrapping also belong in shared TextStyle values when editable TEXT properties need to inherit them. The importer validates and writes these fields, defaulting omitted values to NONE/AUTO. Summary links now export UNDERLINE/AUTO and the title NONE/BALANCE at style level. The native review initially read NONE on all links; node decoration applied after references/layout corrected mains and normal review, but the edited long specimen still lost underline. Style-level correction passed native visual inspection in ordinary and edited long examples; final inspection reads UNDERLINE/AUTO on all 34 link nodes and BALANCE on all 14 title nodes. This is an observed sequence, not a confirmed explanation of Figma's resets. [Native text styles](https://developers.figma.com/docs/plugins/api/TextStyle/)

### Acceptance probes distinguish structure from rendering

`kit-acceptance.js` exposes preparation, read-only comparison and exact-owned cleanup. It creates only three temporary instances from exact existing masters: ComboBox Open, checked Default Radio and checked Invalid Radio. It resolves actual suffixed property keys, loads their Roboto fonts, edits root TEXT/BOOLEAN and all three exposed option Labels, and records one direct text-alignment override. Its edited baseline is read back and stored in a bounded public shared ledger on a separate owned root. Root-ID recovery survives plugin restart; the UI-held build report does not.

Comparison requires an ordinary successful ComboBox/ComboBox option/Radio build with review refresh off, then verifies set/main IDs, descendant IDs, property keys/values, nested exposure, characters, visibility and formatting without writes or font loads. Cleanup accepts only recorded exact IDs and retains moved, detached, retyped, foreign or user-extended trees. Current limitations include the hidden Default Radio error ancestor, Checked as a VARIANT axis, and no Open Combo error consumer. Actual native preservation is pending, and painted visibility still needs rendered evidence. The focused mock establishes only those bounded API/ownership contracts. [Run the experiment](MAINTAINING-KIT.md#check-edited-native-instances)

### Payload scope remains explicit

Connector compilation removes the SVG importer when the exact selected variant/dependency subset has no SVG recipes. The desktop runtime retains it. The full non-SVG ComboBox scope now exceeds the former 48k payload budget, so use explicit one-family variant batches rather than assuming conditional elimination makes a whole matrix fit. The compiler rejects more than 50,000 characters or UTF-8 bytes and does not truncate metadata. Preserve dependency closure, record every requested/actual scope and verify retained grids/identities after all batches. Local payload and mock checks are not evidence of remote execution while connector allowance is exhausted.

On 4 October, the real ComboBox/Radio experiment passed all 441 comparison assertions with no errors after an ordinary scoped build. The edited root properties, nested option labels, direct alignment and identities survived. Desktop visual review confirmed the intended visible content. Cleanup recovered the saved root after plugin restart and removed its 32 recorded nodes, retaining none. Fresh preparation now positions probes beyond existing page-level bounds; that placement correction passes mock checks and awaits its next native preparation run. The first native probe had overlapped the review and was moved before visual review.

Final inspection retained all 290 preceding variable IDs and 136 preceding family set/variant IDs. The 159 recipe variants coexist with one earlier diagnostic component, explaining the inspection's 160-component total. The current file has 27 selected text styles and five effects, with no inspection errors. A fresh local backup was saved; the cloud reconnect warning remains unresolved. Browser summary heights 79.09375/137.09375/340.28125px correspond to native 79.5/137.5/341.5px. Native text uses the exported 17.6px title line height but reports an 18px line box; that rounding difference is recorded, not hidden by changing source typography.
