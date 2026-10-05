# Exploratory MVP handoff

Prepared 5 October 2026 for Anders, the UX lead. Start with [paid status](PAID-KIT-STATUS.md), [core contracts](CORE-KIT-STATUS.md) and [the consumer example](MVP-CONSUMER-BRIEF.md). This is a bounded UNDRR pilot, with later acceptance work recorded explicitly.

## Open and use the pilot

1. In the paid Mangrove MVP folder, open **Mangrove kit (exploratory)** for foundations, supported component contracts and source references. Open **Mangrove MVP consumer (validation)** for the desktop/mobile resource-page example and its edited-instance appendix.
2. Enable the kit in **Assets > Libraries** in a consuming design file. Insert a fresh Button from Assets into your own working frame and change its Label. Keep instances linked. Library consumers do not need the development plugin.
3. Read a family's supported presets and edits before changing its width, text or variant. Supporting Table cells/rows, ComboBox options and other parts supply whole widgets; they are not all independent product choices.
4. Use UNDRR for the bounded MVP. Five modes are present, but broader component rendering and geometry under other brands remain experimental.
5. Review library updates in **Libraries > Updates**. The pilot demonstrates a published token update and restoration preserving tested edits; component recipe-rebuild publication still needs a separate check.

## What is delivered

| Item                   | Current evidence                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical source kit   | Original cloud file identity retained through paid-folder migration and five-mode import/repeat.                                                                           |
| Published core         | 25 construction families, 297 variants, 36 text styles and eight effects. Seven families are supporting parts.                                                             |
| Variable catalogue     | 508 published variables, with 12 private variables hidden. The catalogue includes experimental draft helpers beyond the core component release.                            |
| Consumer example       | Editable desktop/mobile resource pages and an appendix; 56 remote linked instances, 169 captured scene records.                                                            |
| Update route           | One scoped UNDRR spacing-token change, native publication/acceptance and restoration. Both independent comparisons pass 5,237 field checks.                                |
| Source and maintenance | Draft PR #1319 on spike/figma-token-bridge, stacked on spike/react-aria-surface. Follow [the runbook](MAINTAINING-KIT.md); regenerate rather than committing build output. |
| Backup                 | Fresh paid canonical and consumer `.fig` checkpoints are saved and their sizes verified. Restoration is not yet tested. Local inspections are evidence, not backups.       |

Card, Hero, Tabs, Editorial CTA and historical diagnostics remain local and unpublished. Planned catalogue stubs are documentation rather than Assets. The example is not an accepted responsive page template or working interaction prototype.

## Maintainer setup

Use the feature branch and its recorded source revision. Run `yarn install` and `yarn build:figma-tokens`, then import the development manifest in the desktop app. The maintainer needs the exact Roboto and Roboto Condensed faces used by the kit. Consuming designers use the published library rather than installing the importer.

Import source JSON without pruning. For affected components, use the layout-aware desktop plugin, inspect changes, check rendering and preserve stable main/property identities. Deselect pending **Changes** in the publication dialog and choose only the reviewed release assets on every update; Figma reselects unpublished drafts. Publish, then review and accept the update in the consumer and verify its edits.

The explicit connector token/style scopes are useful for bounded imports. Its component-build path refuses organised files; it cannot replace the layout-aware desktop builder. Remote variable cache IDs can change after publication. Compare their stable keys and values while preserving exact local canonical identities.

## Acceptance still to run

- A published component recipe-rebuild update, including edited consumer preservation.
- The six uncoached novice tasks in [kit architecture](KIT-ARCHITECTURE.md), recording time, wrong turns and help needed.
- Backup restoration, broader brand rendering, RTL/scripts and source font/raster equivalence.
- Longer fixed-row Table content, arbitrary resizing and deferred family contracts. The Short-cell probe uses Ready because Preparedness collided with the fixed row divider.
- Accepted page templates, interactions and the remaining source catalogue; see [component inventory](COMPONENT-INVENTORY.md).

## Transfer into the receiving team

Obtain the receiving paid-team destination and admin acceptance. Transfer the folder containing both the library and its consumers together. Confirm file access, fonts, mode/alias values, identities and a published consumer update after transfer. Private plugins and shared fonts need separate maintainer setup. Keep the sending subscription until destination receipt and update flow work; its billing term has not been inspected.

Do not substitute a `.fig` import for an identity-preserving folder transfer without an explicit recovery decision. Imported local copies create new file/main identities and need new library connections. Destination transfer, Anders's receipt and novice acceptance are later human handoff gates, not completed by this package.
