# Bounded SVG token sizing

The full builder supports optional `svg.sizing: {size, strokeWidth}` on SVG
leaves. Both fields name FLOAT roles. The source must be an unfilled square
viewport with uniform black center strokes and a monochrome COLOR role. It
retains the authored vector asset and binds its frame width/height and descendant
stroke widths; it does not place a fixed14px asset inside an18px wrapper.

The shared helper validates source aliases and derived ratios in every authored
mode, then validates the live aliases in every imported native collection mode.
Missing, wrong typed, cyclic, nonfinite and inconsistent values refuse the entire
selected sized-SVG closure before style import or scene construction. Existing
SVG identity/topology/geometry and managed size/stroke/color bindings and SCALE
constraints must remain owned; unsupported manual edits are preserved by refusal.
A native import can only be checked after createNodeFromSvg. Its existing cleanup
path removes a rejected fresh SVG; this is not a general transaction rollback.
Style import failures retain the existing partial asset report and prevent sized
scene construction.

`dev/mock-search-controls.cjs` exercises all15 finite SearchControl candidates in
all five brands, including Form3 at14px or18px, two zero-create repeats and edited
consumer TEXT properties. It checks source drift, all-mode source/native ratio
refusal, existing stroke/constraint ownership refusal, and the actual full builder
with a precise bounded SVG API fixture. The fixture explicitly models native
stroke scaling and does not render or prove Figma mode propagation.

The connector executes the full builder's pure SVG parser and the shared pure
source-document sizing validation on the complete immutable source before
compilation. It retains the exact sizing role and selected-brand alias closure.
Only that already-executed source-document validation is disabled in the embedded
script; live native mode aliases, types, ratios, geometry, strokes, ownership and
binding guards remain enabled. The normal full plugin retains source validation.
The sizing module is included only when selected recipes declare the capability.
Ten normal Button-build/bounded-import comparisons across five brands retain
exact compiled code byte parity with checkpoint5209cdc2. The external receipt is
`/tmp/mangrove-svg-sizing-unsized-parity.json`.

Even the Empty Form variant currently exceeds the unchanged50000-byte connector
ceiling in every brand, at about50.8-50.9k. The compiler refuses these requests;
no native guards were stripped and no dynamic execution or size-limit change was
introduced. Full-plugin source includes the capability, but its ordinary native
execution and full SearchForm acceptance remain open. A real mode change can alter
recorded SVG geometry; ownership migration is not silently inferred from token
publication or the separate Tag review-layout rehearsal.

## Isolated native helper checkpoint

The separate unpublished experiment demonstrated two native representations
that the original strict fixture did not model. FLOAT stroke14/12 is stored as
`1.1666666269302368`, exactly `Math.fround(2 * 14 / 24)`. Native comparisons now
accept the exact source double or its exact float32 representation. Source DTO
formula checks remain unchanged; adjacent float32 values and arbitrary rounded
values refuse. The same exact rule applies to the observed bound VECTOR stroke.
No layout or recovery geometry rounding was introduced.

The SVG importer also creates an invisible default white fill on its FRAME.
Only that exact single SOLID paint, hidden, opacity1, NORMAL, white and unbound,
is allowed. Visible, coloured, bound, multiple and VECTOR fills remain refused.
Managed source ownership retains the paint; this is not permission to erase edits.

The actual source search mask was applied at14px. Two managed helper repetitions
created zero nodes and preserved all recorded probe bounds, bindings, constraints
and explicit modes exactly. Changing the existing probe root to MCR changed its
bound viewport to18px and stroke to1.5 before helper application, without a
rescale. Returning to UNDRR restored the recorded14px probe exactly. The complete
compact receipt is `/tmp/mangrove-svg-native-repeat-20261006-v8-compact-receipt.json`;
its independent review accepts this bounded helper claim. A restored render is
`/tmp/mangrove-svg-native-restored-20261006.png`.

Repeated snapshots omit paints and vectorPaths. The receipt reports59 unchanged
existing geometry/mode records with an empty difference list, but does not include
the full second array for independent recomputation. This evidence does not prove
full native-property equality, source raster/path parity, all brands, whole
SearchForm construction, ordinary plugin repeats or publication. The unrelated
recovery-file subpixel drift remains open.
