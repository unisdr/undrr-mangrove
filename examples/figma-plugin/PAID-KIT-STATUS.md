# Professional kit validation

Updated 5 October 2026. Professional migration and repeat import are verified. The shared library is **not published**, and the MVP consuming file is an empty preparation file. This checkpoint does not broaden the bounded UNDRR core or accept other-brand component fidelity.

## What is done

| Check                    | Observed result                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Effective access         | The connected account reports a Full seat, Professional plan and admin role in the user's paid team. Actual cloud reads and writes succeed. Billing term was not inspected.                                                                                                                                                                                                |
| Canonical file location  | The existing kit moved from Drafts into the dedicated Mangrove MVP folder in that team. Its original file key is retained. A separate MVP consumer file was created in the same folder. No seats or subscription settings were changed by the agent.                                                                                                                       |
| Cloud availability       | The connector reads the latest compact canvas and imported five modes. Successful cloud writes create the separate brand-review page. This is bounded remote-state evidence, not a backup restoration test.                                                                                                                                                                |
| Five-mode import         | All 520 existing variables are reused: zero created, 520 updated, zero removed and 2,600 values set. Pruning is off. UNDRR keeps its existing mode; four brand modes are added. Nine selected foundation text styles and eight effects update without errors.                                                                                                              |
| Identity and value audit | Existing variable IDs/keys, UNDRR values, collection identity, default mode, 54 text styles, eight effects and all 9,802 original scene IDs are retained. All 2,600 source values match, including 513 aliases and 604 exact float32 representations. Twelve Tabs labels differ only in render bounds on the first import; their source fields and topology are unchanged. |
| Ordinary repeat          | The second import again creates/removes nothing. Its fresh inspection retains all 10,385 asset records exactly, including render bounds, passing 10,396 strict checks with zero failures.                                                                                                                                                                                  |
| Shared-mode review       | A separate **91 Brand validation** page contains editable instances of Button and Text input under each brand mode: 30 instances, default/focus/disabled Button states, default/invalid 320px fields and invalid-focused 240px fields. Rendered text is Roboto. The final review fixes presentation overlap from MCR2030's larger buttons.                                 |

The review demonstrates bounded mode inheritance and visible samples. It does not establish complete source pixel equality, every component/state/width, long-content wrapping, RTL or font-file equivalence. Geometry computed during construction still needs family-specific review when a brand differs. Keep the canonical UNDRR mains and existing review boards intact.

Full receipts, inspection captures, screenshots, affected IDs and independent verdicts belong in the local evidence ledger. The pre-migration local `.fig` exists; a new paid checkpoint backup and restoration test remain open.

## Release boundary

The candidate release is **UNDRR core, exploratory MVP**. Select the exact 25-family core allowlist in [core status](CORE-KIT-STATUS.md), totalling 297 variants. Seven families are supporting parts used by whole widgets; this is not a catalogue of 25 independent consumer choices.

Exclude Card/Vertical, Card/Horizontal, Hero/Background and Hero/Split while their draft contracts remain open. Exclude Tab trigger, Tabs and Editorial CTA until their separate acceptance passes. Preserve these local assets. Do not publish Welcome, review previews, catalogue stubs or historical diagnostics as reusable components.

Publish the required nested support families and core styles with the selected whole widgets. Review the nine selected foundation styles and exact required component templates; do not select all 54 native text styles blindly. Preserve the documented DIRECT typography exception. Private primitive variables remain hidden from publishing. The five brand modes are validated data; other-brand component use remains experimental.

### Exact style selection

The 5 October source-to-inspection comparison finds every required style in the existing file. The candidate selection is **36 text styles**: nine foundations plus 27 templates referenced by the 25 core families. Core nested-instance dependencies are entirely inside that allowlist. This is a proposed selection, not a published inventory.

- Foundations: `Mangrove/text/{300,button,form-input}/Regular` and `Mangrove/heading/{400,500,600,900,1000,1100}/Regular`.
- Templates under `Mangrove/component/`: `body`, `button`, `error`, `help`, `input`, `option-selected`; `chips/{dismiss-glyph,label}`; `details/{marker-glyph,paragraph-below-medium,paragraph-medium-up,summary-below-medium,summary-medium-up}`; `form-error-summary/{link,title}`; `segmented-control/segment`; `status-label/label`; `table/{body,header}/{large,small}`; `text-cta/heading/{desktop,mobile}`.
- Templates with distinct native capitalisation: `Mangrove/Component/Empty state/Compact description` and `Mangrove/Component/Table of contents/{Link,Decimal marker,Title}`.
- All eight existing effects: `Mangrove/shadow/{raised,raised-hover}`, `Mangrove/{focus-ring,focus-ring-inset}`, `Mangrove/component/radio/checked-inset`, `Mangrove/component/switch/thumb-shadow`, `Mangrove/component/switch/thumb-shadow/aria-disabled` and `Mangrove/component/details/hover-shadow`. Seven are directly referenced by core recipes; `shadow/raised-hover` is included as an effect foundation.

Brace notation expands to individual names; it is not a Figma search expression. Exclude the remaining 18 native text styles from this initial release. Keep the DIRECT Table of contents Link template even though its mains deliberately copy and bind typography without a native style association. The variable inventory has 12 private and 508 visible variables; visibility does not establish component acceptance for draft helper roles.

Independent review passes 622 checks with zero failures for this proposed family/style selection. Publishing the whole collection would also expose draft/pending helpers: 140 public variables are referenced exclusively by excluded recipe closures rather than core plus selected styles, including 115 dedicated Card/Hero, Editorial CTA and Tabs helpers. Some of the other roles are broad semantic tokens. Keep the five-mode token catalogue explicitly **experimental and wider than the component release**. Do not describe all 508 visible variables as an accepted core API, hide them automatically or split the collection without a reviewed migration.

Use **Assets > Libraries > This file > Publish**, deselect **Changes**, then select the reviewed assets. Record the final selection and success notification. Figma documents selective publication and a Full seat with source edit access on paid plans. [Publication instructions](https://help.figma.com/hc/en-us/articles/360025508373-Publish-a-library).

## Consumer route after publication

This route is prepared, not yet exercised. The [MVP consumer brief](MVP-CONSUMER-BRIEF.md) specifies the first page and update checks:

1. Open a design file in the paid team and enable the published Mangrove library in **Assets > Libraries**.
2. First insert one Primary/Filled/Default Button and edit its Label successfully. For each later widget, read its supported-edit limits before changing exposed text, state or preset properties. Keep it linked.
3. Use UNDRR for the bounded MVP. Brand modes in Variables do not imply that every component has accepted brand geometry or responsive behaviour.
4. When a library update arrives, review and accept it. Check your edited text, optional visibility, selected variants, modes, bindings and links afterward.

Consumers do not need the development importer. The maintainer updates the source kit from the generated JSON and recipes, verifies it, then publishes a reviewed update. A plugin rebuild and a library update are separate operations. See [the maintenance runbook](MAINTAINING-KIT.md) for the automatic/manual boundary.

## What is left

- [ ] Inspect the initial publication selection, publish only the bounded release and record the actual published inventory.
- [ ] Assemble and visually review a representative MVP page in the separate file using published instances and styles.
- [ ] Publish and accept a bounded source update; prove it propagates while preserving exposed consumer edits, identities, modes and links.
- [ ] Verify the inspection-download UI correction in the native plugin after restart. Its actual UI-script regression passes locally.
- [ ] Save a fresh paid `.fig` checkpoint; keep restoration testing distinct from file existence.
- [ ] Complete an expert consumer walkthrough and the separate novice handoff tasks. An expert screenshot review is not a novice test.
- [ ] Prepare Anders's delivery package and receiving-team access. Transfer and destination update verification remain later handoff gates.

Desktop automation stopped at library management with `cgWindowNotFound` before the publication selection opened. Cloud tools still work. Reopen the canonical desktop file, inspect the exact release selection, and continue at the first unchecked item. The publication is not inferred from reaching **Publish this file**.

A later retry still times out on desktop discovery. Cloud access again reports Full/Professional/admin, and the separate consumer remains empty. Importing the existing default Button by key fails with `Component with key ... not found`, creating no nodes. This does not isolate whether publication, availability or a request failure caused the rejection; the Plugin API documents more than one rejection cause. [Import API](https://developers.figma.com/docs/plugins/api/figma/#importcomponentbykeyasync).

The connector's Code Connect component-inventory tool separately rejects this Professional account with an Organization/Enterprise requirement. Do not use that tool as the Professional release gate or treat its text response as an empty inventory. Verify publication through the native selection/confirmation and actual consuming-file imports. This tool restriction does not contradict Professional's documented shared-library support.

## Inspection freshness

Native Save inspection previously stayed enabled while an inspection was pending, allowing the preceding capture to be downloaded as if new. One such report was rejected because its timestamp and contents exactly matched the baseline. The verified replacement has a later capture and all five modes.

The UI now disables inspection downloads during any pending operation, guards the download handler and shows the capture time. Failed reads retain the preceding capture with its original timestamp. Always compare `capturedAt`, requested scope and mode inventory before accepting evidence; file creation alone does not establish freshness. Close the plugin before editing watched UI/runtime files or rebuilding.

## Local verification

`npx jest tokens` passes three suites and 1,328 tests. `yarn lint:check` reports zero errors and 22 existing warnings. Touched-file Prettier, `git diff --check`, generation and all 10 importer scenarios pass. The actual UI-script harness passes, including the new stale-download/failed-read regression; actual DOM layout and navigation harnesses also pass. GitHub Actions are unavailable for this organisation. These local checks do not substitute for native publication or consuming-file acceptance.
