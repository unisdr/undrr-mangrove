# Ordinary native recovery trace

Status: prepared and code-reviewed; no actual native trace has run. Use only the unpublished recovery file `JF29fJWi9LzUHeOObGL3nB`, titled **Mangrove kit (Professional checkpoint 2026-10-05)**. Its collection key is `a5e74aec4da308285010a5113c4648463a5cdf5f`. Do not publish it or reconnect consumers.

## Prepare without installing

```sh
node examples/figma-plugin/dev/prepare-recovery-trace.cjs /tmp/mangrove-recovery-trace
node --check /tmp/mangrove-recovery-trace/traced-main.js
```

This emits the pristine runtime and a traced copy. Anchor checks reject source-path changes. The guard precedes build mutations and requires the sole recovery collection, UNDRR, exactly Button and review refresh off. It guards the `build-components` operation only; do not invoke other mutating operations in a traced session. Navigation and inspection are separate read-only operations.

After reboot, inspect Figma through the documented desktop tool and verify a real click works. Do not repeat unchanged focus failures or bypass them with AppleScript/CDP. Close any running plugin, verify the recovery file and capture a full native baseline inspection before installation. Check the registered manifest points to this checkout, not an old copied plugin.

## Install and run

With the plugin closed, copy `traced-main.js` over the ignored `examples/figma-plugin/build/main.js`. Reopen the normal full development plugin, explicitly load its matching full `mangrove-variables.json`, select UNDRR and Button only, and keep **Refresh review sizes, keeping edited content** off. Do not re-import foundations or organise explicitly. Run **Build selected components** once through the ordinary UI.

Save the full operation report immediately, then the full inspection. `result.layout.recoveryTrace` in the operation receipt contains:

1. Before component build.
2. Immediately before catalogue BrowseFlow, after its row/text reconciliation.
3. Immediately after catalogue BrowseFlow.
4. Before section resizing.
5. After section resizing, before section placement.
6. After final section placement and layer ordering.

Captures contain all section geometry and catalogue frame/text records, including local geometry, bounding boxes, render bounds and measured footprints. Trace code reads scene getters only. Those getters can force lazy layout evaluation; an instrumented success alone cannot establish an ordinary repeat fix. Return counts/errors and stage data with the complete report, not a cropped UI summary. The trace does not deliberately round or repair geometry.

| Recorded baseline node | Geometry                                                  |
| ---------------------- | --------------------------------------------------------- |
| Examples `30:2704`     | x5956, y7630.42822265625, width2848, height6052.001953125 |
| Catalogue `30:5336`    | x32, y344, width2784, height5676                          |
| First row `30:5339`    | x24, y138, width880, height225                            |
| Next row `30:5348`     | x24, y387, width880, height183                            |
| Maintenance `30:2706`  | x5956, y13842.4296875                                     |

Identify the first changed node/stage. Compare local versus absolute coordinates and paint overflow. In particular, inspect inputs to section sizing before attributing an Examples height or Maintenance y difference to the catalogue flow. Controlled cloud calls did not reproduce the surplus; no production rounding fix is justified yet.

## Restore runtime and establish repeat evidence

Close the plugin and regenerate `node scripts/build-figma-plugin.cjs`. Compare `build/main.js` with the emitted `pristine-main.js`; reopen so the ordinary runtime is loaded. Remove no Figma nodes. Save receipts and inspections for two ordinary Button-only, refresh-off builds. After any demonstrated fix, both must create zero nodes, report no errors and preserve exact recorded repeat geometry.

```sh
node examples/figma-plugin/dev/compare-native-recovery.cjs build1.json build2.json inspection1.json inspection2.json > repeat-verdict.json
```

The comparator accepts the raw successful build receipts saved by the UI, which omit an operation field. It requires two successful Button-only receipts and schema-version-1 inspections from the same recovery document/Page 1: 9,480 unique owned scene IDs, 520 variables, 54 text styles, eight effects, the sole recovery collection and the five diagnostic node IDs. An inventory change requires review rather than relaxing those checks. It compares exact recorded owned fields and foundations, excluding keys and absolute render bounds consistently with the historical digest scope. It uses exact serialized comparisons for the verdict; its noncryptographic hashes are only summaries. A pass does not establish pixel equality, publication, replacement-library reconnection or equality of unrecorded/unowned nodes. Keep raw reports, generator revision/hashes, expert review and any observer-effect qualification. If interrupted, restore the pristine runtime before handing back the workspace.
