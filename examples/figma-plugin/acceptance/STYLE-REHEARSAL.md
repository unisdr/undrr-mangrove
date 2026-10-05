# Deliberately changed style publication

Status: prepared, not run. Test text and effects separately, restoring the first before starting the second. No source tokens or normal generated DTOs are edited by preparation.

```sh
node examples/figma-plugin/dev/prepare-style-rehearsal.cjs /tmp/mangrove-style-rehearsal
```

The generator refuses dirty token/exporter/SCSS inputs, records HEAD and hashes each output. `source-restoration.json` is the exact source DTO. Each changed fixture differs at one intended UNDRR field; all variables, other styles and other brands remain exact.

| Fixture                    | Existing style              | Change                                                             | Stable canonical style key                 |
| -------------------------- | --------------------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| `text-line-height-24.json` | `Mangrove/text/300/Regular` | `lineHeight` AUTO to PIXELS 24; font size/family bindings retained | `b7c14f7a0f5ce4040ca8e89ab456daebc8f49674` |
| `effect-spread-2.json`     | `Mangrove/shadow/raised`    | Inset spread 1px to 2px; colour binding retained                   | `94b43928553a22a6ff9a35edcfa1103f574489c7` |

Read-only cloud inspection on 5 October finds the canonical text style at AUTO, and raised shadow at spread 0 rather than source 1. The discrepancy is unresolved: neither a confirmed source drift nor an established bridge limitation. Inspect the exact native style and getter before importing. Compare every selected live text/effect style property and binding against `source-restoration.json`, since the importer updates all selected styles. If any selected baseline differs, stop and determine the representation or preserve/review a live-restoration fixture before applying a test. A source DTO alone does not prove exact restoration of the live library. A reviewed live fixture must retain all non-target differences in both its changed and restored versions.

The existing consumer's inspected Page 1 style references contain neither target key. Before mutation, enable the canonical library in the separate consumer and create a clearly named test frame with two direct remote-style specimens: multiline Roboto text using the published text style, and an opaque rectangle using the published inset effect. Use native style selection, retain their remote keys and verify effective getters. Do not use directly applied typography, detach an instance or substitute a local style. Record the new owned specimen IDs, position and content. Setup is a separate baseline operation, not update evidence.

## Each native rehearsal

1. Capture canonical and consumer native inspections, target style IDs/keys, effective style properties, specimen geometry, variable modes/bindings and edited content. Save a fresh backup when native controls work; retain all earlier backups and History.
2. Run the standalone maintenance plugin in canonical `Zgjq8pQ0FMT8d6dhw9M5bt`. Select all five brands, the existing installed text styles and effects, with pruning absent. Load the relevant changed fixture, confirm its hash and save the full import receipt. The importer updates all selected styles/effects even when only one changes; inspect them before publication. Require no created/removed assets, missing fonts or errors.
3. Verify the target's effective native value and unchanged canonical identity. Deselect **Changes** in Publish, select only the one reviewed text or effect style and save publication-selection evidence. Publish no variable collection or components. Selection is needed anew on restoration.
4. In consumer `wOTLILmiXUI3uzG2BdPUxB`, accept that exact style update natively. Capture the changed remote style key/value and both edited specimens at normal scale. Text should read PIXELS 24; effect should read spread 2. Record geometry changes rather than requiring unchanged text height. Retain content, links, position, mode and non-target style values. Verify the remote effective property, not merely the Updates notification or screenshot.
5. Import the reviewed exact restoration DTO, save the receipt, publish only the same style, accept natively and capture again. Require all scoped baseline fields and geometry restored with stable style keys; normalize only documented remote-cache ID suffixes. Keep raw captures and explain exclusions. Restore even if changed uptake fails, then report that failure.
6. Save before/changed/restored receipts, publication selections, consumer update evidence, renders and an independent verdict. Remove only the recorded test specimens after restored verification, preserving all pre-existing consumer records.

Run the second rehearsal only after the first has restored. Text/effect styles materialise nonbound properties from the first selected brand; changing the UNDRR definition is not a per-mode text/effect publication capability. Other brands' DTO values remain unchanged, but rendering under those modes needs separate acceptance. These direct-style tests do not establish composite component publication, source pixel fidelity or human handoff.
