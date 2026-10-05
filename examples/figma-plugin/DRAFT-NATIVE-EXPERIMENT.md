# Draft native experiment readiness

Audit basis: repository HEAD 535238896c69cc058e165998acf71802d2b03e8b, 9 draft families and 28 variants. This plan is preparation only. No Figma mutation, importer-ready draft file, publication or native acceptance has occurred.

## Isolation and entry point

Use a new empty unpublished Figma Design file, with a recorded file key and a fresh experiment page. Before any importer-ready DTO or external runtime is prepared, verify that the native plugin context actually exposes figma.fileKey through a documented read-only check. Cloud connector file-key availability does not establish native plugin availability. Do not use the canonical kit Zgjq8pQ0FMT8d6dhw9M5bt, consumer wOTLILmiXUI3uzG2BdPUxB, or recovery checkpoint JF29fJWi9LzUHeOObGL3nB for draft construction. No publication or consumer reconnection belongs to this experiment. Preserve existing .fig backups, History, verified handoff ZIP and RC2-DECISIONS.md.

Machine target enforcement is required in addition to manual target checks. An external guarded runtime must refuse the canonical, consumer and recovery keys listed above and allow exactly the recorded new experiment file key. It must fail closed if figma.fileKey is missing, unknown or mismatched. Run this gate before evaluating any normal full-runtime controller or importer code, registering mutation handlers or touching assets. Check the allowlisted key again at each mutation entry. If native fileKey availability cannot be established, do not prepare or run an importable adaptation.

Unique collection naming alone does not prevent damage: importing shared style IDs into a populated canonical/recovery file could rebind existing text/effect styles to a new collection. DTO provenance is inert and does not enforce a target. The guard is a separate external experiment runtime/manifest artifact prepared only after the exact allowed key is known. Preserve and hash the pristine normal generated build, which remains unchanged. No guarded artifact or importable DTO has been prepared by this audit.

The source-only packet deliberately has no top-level collection/modes/variables/styles/components. The actual importer rejects it before mutation. Do not import that packet as-is. Any temporary adapter is a separate reviewed external artifact, not a change to the normal exporter, catalogue, core allowlist, maintenance plugin or reduced merge cohort.

The existing full plugin is the appropriate builder. The maintenance plugin imports variables/styles but cannot construct these families. Runtime entry messages are import and build-components. The latter calls preflightMangroveMaintenance and buildMangroveComponents(doc, brand, families, { refreshNarrowReview: false }). Keep review refresh off for ordinary repeat tests. Do not bypass those preflights.

## Reviewed temporary adapter shape

When native execution is available and a reviewed plan has been accepted, generate a fresh source-only packet outside the repo with build-figma-component-drafts.cjs. Check it with --check before adapting. Reconcile packet revision and base fingerprints against a current buildFigmaVariables() result. Re-run source guards if any relevant source or recipe changed.

Use an external DTO containing collection: a unique local name such as Mangrove draft experiment 2026-10-05; modes/variables/styles: clones of packet.foundationCatalogue fields; components: { version: 1, families: clones of packet.draftFamilies, limitations: packet limitations }. Include experiment provenance as inert metadata. This minimal shape is sufficient for the actual importer and builder; canonical plannedInventory/kitGuidance/capabilities should not be copied as statements about these drafts. Preserve variable/style/variant/anatomy IDs exactly. File and collection isolation, rather than renaming source IDs, protects canonical identities.

Assert the exact family/variant inventory, valid references/aliases, unique IDs and style names using validateDrafts. Assert no INSTANCE recipe dependency exists. Current nine families have no declared dependencies and use only native source drawings plus shared foundation styles/variables. Confirm collection name is unique and no local assets or remote consumers pre-exist in the test file.

The importer finds the local collection by name. Shared IDs use orgundrrmangrove and are read through mgReadIdentity; private plugin data is unsupported in the cloud bridge. A connector execution context must use MG_SHARED_ONLY=true, but native desktop must run the externally guarded copy of the existing full runtime without changing normal generated runtime bytes. No custom cloud builder adaptation is implied by this plan.

## Import and build sequence

1. Verify actual native figma.fileKey availability and the exact new file key. Review and record the external target guard and its SHA256, with the gate placed before the existing runtime/controller evaluation. Save empty-file .fig backup, file/page key, local collection/style/node inventory and experiment DTO SHA256. Confirm the empty experiment target before writes.
2. Run the existing import UI with the external DTO, prune=false, all five brand modes. Explicitly select required text styles rather than the default nine core roles; include effects. Save the import report and verify no errors, all required brand modes and style bindings. Additional unneeded base assets remain local only.
3. Choose one draft family explicitly in the full plugin. Do not press the 25-core preset or Organize file. Start with plain Tag to establish import/identity behaviour, then Notice/HighlightBox/UserFeedback after browser baselines. Follow with other families according to readiness. UI family choices are derived from doc.components.families.
4. Build in UNDRR first. Save the complete operation report, native screenshots and local variable/style/key/geometry snapshots. Record actual loaded fonts and source comparison. Expand to the other four modes only after first-family errors and unsupported differences are understood.
5. Create native consumers in this same unpublished test file, edit only documented plain properties, and record IDs, main links, modes, property definitions, overrides, vector data, bindings and geometry. Include optional Notice icon visibility and supported finite variants. Do not use arbitrary resize or rich text as accepted behaviour.
6. Run two ordinary builds with the same family selection and review refresh off. Require zero created nodes on each, no errors, exact recorded repeat geometry, retained main/instance links, property definitions, edit values, modes and bindings. Save before/after full operation receipts. Offline zero-create tests do not substitute for these native repeats.
7. Preserve the complete experiment evidence and conclude per-family accepted/limited/failed. Source/browser comparison, font match, native construction, native repeats, consumer edits and selective publication are separate outcomes. Do not publish during this experiment.

## Rollback and stopping conditions

Stop before mutation for target mismatch, duplicate/foreign identity, failed font/style preflight, unknown source fingerprints or populated/connected experiment file. If a partial native operation fails, retain its report and inspect exact created/updated IDs before cleanup. Prefer restoring the unpublished experiment backup or making a fresh experiment file; do not prune or delete canonical assets, consumers or backups. Keep failed evidence and checkpoint History. A rollback of experiment geometry is not evidence of a successful ordinary repeat.

## Pre-audit browser baseline basis

Notice: source-only four Standard tones and Title/Body/default-icon contract is ready for an actual JSX plus freshly compiled SCSS fixture at 480px. Measure title CSS600 UI face, own135% line height, body250/150%, source border1/start4, alpha paints and exact icons. Existing mock only preserves import markup and paint, not vector bounds or pixels. No matching dedicated prior browser evidence was found during this audit.

HighlightBox: source-only Default/Primary/Secondary plain h3 and one paragraph fixture at480px needs source/browser measurement. Default is transparent; coloured fallbacks are blue900 and legacy Sendai purple. Latin h3 inherits text font; CSS600-to-Bold700 and UA paragraph margin are provisional. Measure physical bottom20 padding, h3 margins, body margin and inset0 -8px shadow. Host overrides, float/centering and rich content remain excluded. No matching dedicated prior browser evidence was found.

UserFeedback: historical actual-source browser evidence exists at /tmp/mangrove-user-feedback-browser-current, recorded source revision22eb465cc6a3f762deca9f16500aa50a38cad71a. Its nine raw source SHA256 records exactly match current source. This supports historical UNDRR390/mobile104px height, source40px action minimum, authored question140% and actual RobotoBold700 actions for CSS600, not native parity. Its desktop900x900 and viewport1280/consumer900 records do not measure the new1164px preset. Measure Desktop1164 actual source now; all-five-brand rendering/native still remains open. Arabic observations prove the source heading-font exception, which this Latin-only draft excludes. Confirmation styled inline link remains unsupported by the existing whole-node text builder.

## Current browser measurements completed

An owned agent-browser source session captured 45 records on freshly served Storybook 6121: 20 Notice tones/brands at 480px, 15 HighlightBox source story tones/brands at 480px and 10 UserFeedback Mobile 390/Desktop 1164 records across five brands. It was closed after capture. Three representative UNDRR screenshots were viewed. No Figma operation or source edit occurred.

UserFeedback Desktop 1164 is 72px high in all five measured brands. Mobile 390 is 104px high except MCR2030 at 116px: MCR actions have 18px labels plus 15px block padding and 1px borders, so source minimum 40 yields actual 52px, rather than forcing 40. The recipe retains source padding/typography and a minimum, so this is expected source geometry.

Notice short source args produce 87px surfaces in all five modes; title computed requests 16px Condensed 600/135%, body 14px Regular/150%, icon 24px. The URL validated body omits the draft terminal period, so full glyph geometry is not claimed. HighlightBox actual stories confirm transparent Default, primary blue900 fallback, Sendai purple Secondary, 18px text-face h3/CSS600/115%, h3 margin 10 and p bottom margin 16; source two-paragraph stories are not the draft one-paragraph whole box.

Computed font requests and loaded FontFaceSet were recorded. No CDP rendered font lookup was used, so exact actual face selection remains an inference; native font-file equivalence remains open. All numeric details, actual copy and CSS values are preserved in browser-measurements.json and browser-summary.json.

## Completed source comparison

The subsequent browser audit records 45 cases across all five brands. Notice
uses short actual JSX arguments whose body omits the draft terminal period; its
treatments and typography are compared, not exact glyph geometry. Highlight Box
stories contain two paragraphs, while the draft contains one; individual source
styles and treatments are measured, not whole-box equivalence. User Feedback
Desktop at 1164px is 72px high in all five brands. Mobile at 390px is 104px high
except MCR2030 at 116px, where source actions grow to 52px while retaining the
40px minimum. These findings support source parameters, not native rendering.

See [source browser status](SOURCE-BROWSER-STATUS.md) for the Range correction,
other family observations and the desktop control blocker. No importable DTO,
guarded runtime, new Figma file, native construction or publication was prepared
by this audit.

## Holistic goal follow-up

After this historical audit, the user authorised full catalogue implementation.
The cloud connector has now created a separate empty unpublished experiment,
key `GbVTvFbuWjoJr6Bf5t4fhg`, and read-only inspection confirms that exact actual
Plugin API file key. No component construction, importable adaptation or
publication has occurred. This establishes cloud target identification only;
ordinary desktop plugin file-key access and all native acceptance gates remain
open. The next cloud import/build requires a reviewed fail-closed target guard
before controller evaluation and at mutation entry. See the
[holistic acceptance tracker](holistic/ACCEPTANCE.md).
