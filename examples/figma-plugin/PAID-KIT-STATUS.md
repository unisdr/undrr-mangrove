# Professional kit validation

Updated 5 October 2026. Professional migration and repeat import are verified. The bounded library is **published**, and a separate MVP consumer uses its linked assets. A published token update and restoration preserve the tested consumer edits. This checkpoint does not broaden the bounded UNDRR core or accept other-brand component fidelity.

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

Full receipts, inspection captures, screenshots, affected IDs and independent verdicts belong in the local evidence ledger. The pre-migration local `.fig` exists; a new paid checkpoint `.fig` is saved and verified at 1,272,543 bytes. Backup restoration testing remains open.

## Release boundary

The published release is **UNDRR core, exploratory MVP**. Select the exact 25-family core allowlist in [core status](CORE-KIT-STATUS.md), totalling 297 variants. Seven families are supporting parts used by whole widgets; this is not a catalogue of 25 independent consumer choices.

Exclude Card/Vertical, Card/Horizontal, Hero/Background and Hero/Split while their draft contracts remain open. Exclude Tab trigger, Tabs and Editorial CTA until their separate acceptance passes. Preserve these local assets. Do not publish Welcome, review previews, catalogue stubs or historical diagnostics as reusable components.

Publish the required nested support families and core styles with the selected whole widgets. Review the nine selected foundation styles and exact required component templates; do not select all 54 native text styles blindly. Preserve the documented DIRECT typography exception. Private primitive variables remain hidden from publishing. The five brand modes are validated data; other-brand component use remains experimental.

### Exact style selection

The 5 October source-to-inspection comparison finds every required style in the existing file. The published selection is **36 text styles**: nine foundations plus 27 templates referenced by the 25 core families. Core nested-instance dependencies are entirely inside that allowlist. Native selection and the enabled consumer-library inventory confirm this published selection.

- Foundations: `Mangrove/text/{300,button,form-input}/Regular` and `Mangrove/heading/{400,500,600,900,1000,1100}/Regular`.
- Templates under `Mangrove/component/`: `body`, `button`, `error`, `help`, `input`, `option-selected`; `chips/{dismiss-glyph,label}`; `details/{marker-glyph,paragraph-below-medium,paragraph-medium-up,summary-below-medium,summary-medium-up}`; `form-error-summary/{link,title}`; `segmented-control/segment`; `status-label/label`; `table/{body,header}/{large,small}`; `text-cta/heading/{desktop,mobile}`.
- Templates with distinct native capitalisation: `Mangrove/Component/Empty state/Compact description` and `Mangrove/Component/Table of contents/{Link,Decimal marker,Title}`.
- All eight existing effects: `Mangrove/shadow/{raised,raised-hover}`, `Mangrove/{focus-ring,focus-ring-inset}`, `Mangrove/component/radio/checked-inset`, `Mangrove/component/switch/thumb-shadow`, `Mangrove/component/switch/thumb-shadow/aria-disabled` and `Mangrove/component/details/hover-shadow`. Seven are directly referenced by core recipes; `shadow/raised-hover` is included as an effect foundation.

Brace notation expands to individual names; it is not a Figma search expression. Exclude the remaining 18 native text styles from this initial release. Keep the DIRECT Table of contents Link template even though its mains deliberately copy and bind typography without a native style association. The variable inventory has 12 private and 508 visible variables; visibility does not establish component acceptance for draft helper roles.

Independent review passes 622 checks with zero failures for this family/style selection. The published whole collection also exposes draft/pending helpers: 140 public variables are referenced exclusively by excluded recipe closures rather than core plus selected styles, including 115 dedicated Card/Hero, Editorial CTA and Tabs helpers. Some of the other roles are broad semantic tokens. Keep the five-mode token catalogue explicitly **experimental and wider than the component release**. Do not describe all 508 visible variables as an accepted core API, hide them automatically or split the collection without a reviewed migration.

Use **Assets > Libraries > This file > Publish**, deselect **Changes**, then select the reviewed assets. Record the final selection and success notification. Figma documents selective publication and a Full seat with source edit access on paid plans. [Publication instructions](https://help.figma.com/hc/en-us/articles/360025508373-Publish-a-library).

## Consumer route after publication

This route now works in the paid pilot. Actual cross-file imports and native update acceptance are verified for the bounded example. The [MVP consumer brief](MVP-CONSUMER-BRIEF.md) specifies the first page and update checks:

1. Open a design file in the paid team and enable the published Mangrove library in **Assets > Libraries**.
2. First insert one Primary/Filled/Default Button and edit its Label successfully. For each later widget, read its supported-edit limits before changing exposed text, state or preset properties. Keep it linked.
3. Use UNDRR for the bounded MVP. Brand modes in Variables do not imply that every component has accepted brand geometry or responsive behaviour.
4. When a library update arrives, review and accept it. Check your edited text, optional visibility, selected variants, modes, bindings and links afterward.

Consumers do not need the development importer. The maintainer updates the source kit from the generated JSON and recipes, verifies it, then publishes a reviewed update. A plugin rebuild and a library update are separate operations. See [the maintenance runbook](MAINTAINING-KIT.md) for the automatic/manual boundary.

## What is left

- [x] Publish the bounded selection and confirm its actual enabled-library inventory: 25 component families, 36 text styles, eight effects and 508 published variables in five modes.
- [x] Build and visually review desktop/mobile MVP examples and the edited-instance appendix from published assets, with 56 remote linked instances and 169 scene records.
- [x] Publish and accept a bounded source token update and restoration, preserving captured edits, identities, modes and links. Each comparison passes 5,237 independent field checks.
- [ ] Verify a published component recipe-rebuild update separately; the token probe does not exercise component anatomy/default changes.
- [x] Restart the native plugin and verify Save inspection disables during a fresh pending read, retains the prior capture time and reenables only with the newer inspection. The saved report matches the displayed time, has all five modes and reports no errors.
- [x] Save a fresh paid `.fig` checkpoint and verify its existence and size.
- [ ] Test backup restoration separately; a saved file is not a successful restore.
- [x] Complete bounded expert visual review and independent captured-field comparison of the published consumer.
- [ ] Complete the uncoached novice handoff tasks and broader interactive usability checks. Expert review is not a novice test.
- [x] Prepare [Anders's handoff instructions](MVP-HANDOFF.md), source/limits and current delivery artefacts.
- [ ] Obtain receiving-team access, transfer both files and verify destination updates and receipt.

## Published consumer checkpoint

Desktop access recovered. The initial native publication selected 70 of 96 offered assets: one collection, 36 text styles, eight effects and 25 construction families. Card/Hero, Tabs/Tab trigger, Editorial CTA, their excluded text styles and the historical focus diagnostic remain unpublished. Native publication reports success. The separate file enables the library and shows 25 components and 508 published variables; actual Button and subsequent widget imports succeed.

The desktop/mobile Disaster risk resources example uses Button, Text input, Text CTA, Table, Details and Status Label, plus published variables/styles. All 56 instance mains are remote, covering 19 distinct keys; there are no local component copies. The appendix makes deliberate edits visible. Expert visual review passes after replacing a too-long fixed-row Table label with a bounded fixture. This does not accept longer row content or responsive Table conversion.

A scoped source-token probe changes UNDRR spacing/300 from 30 to 32. The importer reuses the original variable, updates one mode value and creates/removes nothing. Figma's pending collection lists the changed token and four dependent aliases. Publication selects the collection only, excluding all draft additions again. The consumer initially retains 30, then shows 32 after native Libraries > Updates acceptance. The update changes 17 bound spacing fields and 57 geometry fields while preserving content, properties and component keys. Six binding maps use a new cached remote variable ID; their stable variable key is unchanged.

Restoration uses the same source importer, collection-only publication and native acceptance. The consumer returns to 2250 × 1397.515625 with spacing 30. All 169 captured records return exactly after canonicalizing only remote variable version suffixes. Independent comparison passes 5,237 field checks for both update and restoration. The canonical 520-variable identity/value/metadata fingerprint also matches its pre-probe checkpoint. Token publication is verified; component recipe-rebuild publication remains a separate gate. A fresh native Page 1 inspection retains all 9,802 scene identities, collections, variables, styles and local scene fields. It records 104 TEXT differences solely in absolute render bounds; these are retained as render evidence rather than claiming raw whole-scene equality. Source font/raster equivalence remains open.

The connector's Code Connect component-inventory tool separately rejects this Professional account with an Organization/Enterprise requirement. Do not use that tool as the Professional release gate or treat its text response as an empty inventory. Verify publication through the native selection/confirmation and actual consuming-file imports. This tool restriction does not contradict Professional's documented shared-library support.

## Inspection freshness

Native Save inspection previously stayed enabled while an inspection was pending, allowing the preceding capture to be downloaded as if new. One such report was rejected because its timestamp and contents exactly matched the baseline. The verified replacement has a later capture and all five modes.

The UI now disables inspection downloads during any pending operation, guards the download handler and shows the capture time. Failed reads retain the preceding capture with its original timestamp. Always compare `capturedAt`, requested scope and mode inventory before accepting evidence; file creation alone does not establish freshness. Close the plugin before editing watched UI/runtime files or rebuilding.

## Local verification

`npx jest tokens` passes three suites and 1,328 tests. `yarn lint:check` reports zero errors and 22 existing warnings. Touched-file Prettier, `git diff --check`, generation and all 10 importer scenarios pass. The actual UI-script harness passes, including the new stale-download/failed-read regression; actual DOM layout and navigation harnesses also pass. The native restart now verifies the pending/completed download state and timestamp. GitHub Actions are unavailable for this organisation. These local checks do not substitute for native publication or consuming-file acceptance.
