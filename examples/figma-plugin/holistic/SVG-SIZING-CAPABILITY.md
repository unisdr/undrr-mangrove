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
ceiling in every brand, at about50.3-50.4k. The compiler refuses these requests;
no native guards were stripped and no dynamic execution or size-limit change was
introduced. Full-plugin execution is available, but isolated native sizing,
path bounds, float precision, stroke and SCALE behavior, live mode transitions,
and two native repeated builds remain open gates. A real mode change can alter
recorded SVG geometry; ownership migration is not silently inferred from token
publication or the separate Tag review-layout rehearsal.
