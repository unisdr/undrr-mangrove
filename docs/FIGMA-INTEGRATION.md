# Figma and Mangrove

Mangrove's Figma kit is a seed design library for designing with the same foundations and component vocabulary as Storybook. It supports occasional token/style maintenance and selected component updates. It is not an automatic two-way synchronisation between a designer's Figma edits and production code.

## Why the tooling lives separately

Design exploration and native Figma construction have different workflows and validation needs from shipping components. Keeping the adapters and plugins in a dedicated repository keeps Mangrove focused on the code used by websites, avoids maintaining a second editable set of tokens/styles, and makes occasional Figma maintenance easier to find and review. Initial kit construction is separate from ongoing maintenance; a small design change does not require rebuilding the complete library.

| Repository                                                                    | Responsibility                                                                                                                                   |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [UNDRR Mangrove](https://github.com/PreventionWeb/undrr-mangrove)             | Component implementations, tokens, styles, stories, source media and the token engine. Storybook demonstrates the implemented browser behaviour. |
| [UNDRR Mangrove Figma](https://github.com/PreventionWeb/undrr-mangrove-figma) | Figma adapters, export/import tooling, plugins, finite component recipes, focused tests and operating runbooks.                                  |

The toolkit reads an installed Mangrove checkout through `MANGROVE_SOURCE_ROOT`. Its `source-lock.json` records the supported source checkpoint. Default commands check required source paths, engine exports and supported representations; they do not enforce complete Git-revision or byte-pin equality. A different source revision requires reviewed compatibility and output differences even if a build passes. Expanded export has separate revision/hash admission. Follow the toolkit's setup rather than copying its historical scripts back into Mangrove.

## Choose the workflow

| Intended change                                                         | Where to work                             | Procedure                                                                                                                                                     |
| ----------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A designer changes an existing component or proposes a new one in Figma | Mangrove code, styles, tokens and stories | Manually implement the approved selection and review it in Storybook. Use the design-to-code handoff and request template below.                              |
| Source tokens or text/effect styles need updating in Figma              | Figma toolkit, reading Mangrove source    | Use the standalone maintenance plugin. It does not rebuild components or publish the library. Bound appearance can still change through variables/styles.     |
| One source-backed component needs a native Figma update                 | Figma toolkit                             | Use the normal construction entry with explicit family selection, dependency inspection and ownership checks.                                                 |
| A new source component needs a Figma family                             | Both repositories, with separate changes  | Author the component in Mangrove, then add and review a finite toolkit adapter/recipe. A new Storybook story does not automatically generate a native family. |
| A landing/news/search composition or expanded recipe is being explored  | Figma toolkit                             | Use the optional expanded workflow and its own acceptance criteria; it is not a routine-maintenance prerequisite.                                             |

Detailed instructions live with the tooling:

- [Setup and task routing](https://github.com/PreventionWeb/undrr-mangrove-figma/blob/e7f5dfa5461e31c57bf5d867575905ef0b9908cc/README.md).
- [Designer-to-code handoff](https://github.com/PreventionWeb/undrr-mangrove-figma/blob/e7f5dfa5461e31c57bf5d867575905ef0b9908cc/docs/DESIGN-TO-CODE.md), [change-request template](https://github.com/PreventionWeb/undrr-mangrove-figma/blob/e7f5dfa5461e31c57bf5d867575905ef0b9908cc/docs/templates/DESIGN-CHANGE-REQUEST.md) and [small handoff example](https://github.com/PreventionWeb/undrr-mangrove-figma/blob/e7f5dfa5461e31c57bf5d867575905ef0b9908cc/docs/DESIGN-HANDOFF-EXAMPLE.md).
- [Variable/style maintenance](https://github.com/PreventionWeb/undrr-mangrove-figma/blob/e7f5dfa5461e31c57bf5d867575905ef0b9908cc/docs/MAINTENANCE.md).
- [Selected component maintenance](https://github.com/PreventionWeb/undrr-mangrove-figma/blob/e7f5dfa5461e31c57bf5d867575905ef0b9908cc/docs/COMPONENT-MAINTENANCE.md), including historical extraction versus behavioural test routes.
- [Expanded workflow](https://github.com/PreventionWeb/undrr-mangrove-figma/blob/e7f5dfa5461e31c57bf5d867575905ef0b9908cc/docs/EXPANDED-WORKFLOW.md).

For a designer handoff, record the exact Figma nodes/checkpoint, selected stories, intended differences, matching copy/assets/fonts, brand and viewport/state. Implement manually in Mangrove, follow the [review checklist](REVIEW-CHECKLIST.md), and verify the actual browser result. Record recipe impact separately. Designer acceptance of Storybook, native Figma rebuilding and library publication are different outcomes.

## Preserve designer work

A main Figma component edited by a designer should have an explicit manual-maintenance policy before any source rebuild. Existing unmarked mains default to source maintenance. Returning a family to source maintenance permits later rebuilding; it does not merge designer edits. Preserve or reflect those edits before handback. Consumer overrides do not prove arbitrary main-component edits will survive.

Component ownership/build lookup is page-local. Open the recorded page containing the existing mains and require matching non-null set/variant IDs for existing families and dependencies. Stop if they are missing or unexpected rather than creating replacements. Inspect dependencies explicitly, then clear/reselect the intended build scope. Shared variable/style updates can affect users beyond that selected family.

Save a native backup and rehearse in an unpublished copy before a reviewed canonical update. Recovery copies have their own library keys and must not be published or used to reconnect canonical consumers. Saving a file online or downloading an operation report does not publish a library. Publication requires an explicit bounded asset selection and genuine linked-consumer verification.

## What is established and what remains to verify

The source/tooling split and reproducible local exports have been checked. The maintenance and normal construction workflows pass local exporter/importer, identity/refusal, layout and UI mock checks; retained extraction output compatibility has also been verified. Fresh-agent read-only scenario reviews can navigate the manual handoff and selected-family maintenance instructions.

Historical native Button and variable-token publication/restoration rehearsals provide scoped evidence for those operations. They do not accept the extracted plugin's native behaviour, every component or every future update. Exported recipe/variant counts describe source coverage, not a fully accepted Figma library.

Remaining acceptance includes native rendering and fonts/glyphs, supported edited content and reflow, relevant brand modes, canonical identity/shared-style integration, deliberately changed text/effect-style publication, composite updates and genuine consumer uptake/restoration. Human novice operation, real designer/developer handoff and reviewer acceptance of the repository split also remain open. Apply the gates relevant to the selected change; whole-catalogue and page-pattern goals are separate.

Use [release status](https://github.com/PreventionWeb/undrr-mangrove-figma/blob/e7f5dfa5461e31c57bf5d867575905ef0b9908cc/docs/RELEASE-STATUS.md), [validation evidence](https://github.com/PreventionWeb/undrr-mangrove-figma/blob/e7f5dfa5461e31c57bf5d867575905ef0b9908cc/docs/VALIDATION.md) and [split status](https://github.com/PreventionWeb/undrr-mangrove-figma/blob/e7f5dfa5461e31c57bf5d867575905ef0b9908cc/docs/SPLIT-STATUS.md) for the dated record and unresolved boundaries. Passing tests, a packet export or an online save is not native or designer acceptance.

## Figma files and current review

- [Canonical kit](https://www.figma.com/design/Zgjq8pQ0FMT8d6dhw9M5bt?node-id=30-2701): foundations, existing components, examples and maintenance guidance.
- [Consumer validation](https://www.figma.com/design/wOTLILmiXUI3uzG2BdPUxB?node-id=7-16): genuine linked-library usage and edited instances.
- [Latest Card/CTA rehearsal](https://www.figma.com/design/VCwJs8fTYXU8007BYYqqwp?node-id=2-87): unpublished component work, with canonical integration and acceptance still pending.

The [file inventory](https://github.com/PreventionWeb/undrr-mangrove-figma/blob/e7f5dfa5461e31c57bf5d867575905ef0b9908cc/docs/FIGMA-FILES.md) distinguishes these review targets from preserved recovery and diagnostic artifacts. Confirm the actual current checkpoint before operating; the inventory is dated, not a continuing sync guarantee.

The split is reviewed in [toolkit PR #1](https://github.com/PreventionWeb/undrr-mangrove-figma/pull/1) and [Mangrove PR #1319](https://github.com/unisdr/undrr-mangrove/pull/1319). The Mangrove PR targets `main`; the React Aria implementation is outside its diff. This does not change the toolkit's supported source checkpoint: its known compatible source remains `1639293738232ade132b442ab0fe983dec3d65d5`, which includes foundations absent from current main. Use a separate checkout at that recorded revision for the existing toolkit. Compatibility with a current main checkout requires separate source/output review; the thin bridge alone does not establish it. Toolkit links here use an immutable reviewed checkpoint while the companion PR is pending; switch them to its durable merged documentation when available. Detailed operating history stays in the toolkit rather than being duplicated here.

## Token-engine bridge contract

The toolkit loads `scripts/build-tokens.cjs` from the selected Mangrove checkout. The bridge uses `loadSources`, `layersFor`, `mergeLayers`, `resolve` and `TOKENS_DIR`. The module also exports `propertyName` to preserve the historical extraction interface. These exports expose the existing engine without changing its command-line behaviour or token resolution. This is a pinned build interface; selecting a different source revision requires the toolkit's compatibility checks rather than a promise of an independently versioned API.

## Migration and validation record

The [dedicated migration PR](https://github.com/PreventionWeb/undrr-mangrove-figma/pull/1) records tooling extraction and reference-retrieval checks. The preserved [upstream spike checkpoint](https://github.com/unisdr/undrr-mangrove/tree/d5e790d3b0318730fdbd270279f340f35a2833ab) remains the historical source and evidence record. The dedicated repository owns current workflow documentation and indexes immutable historical deliveries separately from executable reference inputs.

Successful repository migration and local output checks do not establish native Figma rendering, font equivalence, edited-instance preservation, library publication or consumer acceptance. Consult the toolkit's release-validation status before treating an asset as accepted. Native backups, consumer files and unpublished recovery checkpoints remain separate from source packages.
