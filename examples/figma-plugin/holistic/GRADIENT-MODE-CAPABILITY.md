# Construction-time gradient transforms

The opt-in `gradient.layers[].transformVariables` field provides a sparse2×3
matrix of FLOAT role names or null entries. Its existing numeric `transform`
remains a finite invertible fallback. Null entries preserve that fallback;
roles resolve from the selected imported brand mode when the builder runs.
This is construction-time resolution, without a native paint-transform binding.
Changing mode requires rebuilding to repaint this matrix. Live mode switching
is a separate acceptance gate.

The source helper validates every declared source mode, unique nonempty string
identities, FLOAT types, strict alias shapes, complete finite values, cycles and
matrix invertibility. The compiler retains the union of all source-mode alias
closures before reducing its immutable selected-brand DTO. Runtime preparation
checks every actual imported native mode and requires exact shared source
identity inside the imported collection. Foreign and ambiguous variables,
missing aliases, nonfinite entries and singular matrices refuse construction.

An affected requested family makes the construction scope atomic for permanent
scene/style/image writes. Invalid gradient preparation prevents construction of
other ready families in that same request. Existing named-font preparation is a
separate preflight activity and may load fonts before a later family refuses.
No mutation-free claim is made about those temporary font loads.

The dedicated actual-builder test covers all five source brands, both viewport
allocations, source and native failures, two exact nonempty zero-create repeats,
compiled parity and mixed valid/invalid requests. Existing normal and literal
unmasked gradient connector samples remain byte-for-byte identical at38608 and
41407 bytes. The existing50,000-byte transport ceiling is unchanged. Full plugin
bundle enumeration and the shared mock include the helper; it is emitted into a
bounded connector only when its selected recipes use the field.

The full search widget needs this capability for its actual135-degree external
search header. The observed header height is120px in four source brands and126px
in MCR, with widths358 and1132px. Its source-specific formulas and raw capacity
observations are separately pinned in the widget assets. Pure matrix/DTO tests
alone do not prove Figma inverse-transform direction, quantization or pixels.

The isolated unpublished native probe is in
`fEC9dKtEVbJ5tZFEyLm3vO`. Its exact target guard denies canonical, consumer and
recovery files. Plans, source projection, returned IDs and native observations
are journaled externally under
`/tmp/mangrove-native-gradient-mode-20261006`. Native inverse/pixel acceptance is
pending; construction and repeat evidence is recorded below. The experiment does not publish or reconnect a consumer.

The first separate single-brand imports demonstrated the importer's documented
single-mode reuse: the lone mode was renamed from UNDRR to MCR. Those receipts
are preserved. The two-mode diagnostic therefore uses an explicit guarded
UNDRR/MCR import in one invocation. Its18 roles include14 custom gradient and
size roles plus four existing source UI roles, with no explicit styles and
pruning disabled. No two-mode evidence is inferred from the single-mode imports.

## Bounded native construction evidence

The corrective two-mode import retained the existing18 variable identities,
added a distinct UNDRR mode and preserved MCR. Actual collection
`VariableCollectionId:2:2`, key`1bd21b23172f26400cf8c4b2f48cdfa508f867f8`,
has MCR`2:0` and UNDRR`3:0`. Both native FLOAT profiles and their aliases were
read afresh before construction. Figma records the expected float32
representations of the source coefficients.

The first UNDRR build created18 scene IDs: two masters, their owned source
gradient leaves and review scaffolding/instances. Rebuilding in MCR created
zero nodes and applied126px instead of120px height and the corresponding
mode-resolved matrix. Two subsequent builds in each mode created zero nodes
and retained exact complete18-node geometry, gradient paint, source identity,
component-property, collection/variable and empty explicit-style snapshots.
A final UNDRR rebuild created zero nodes and restored the complete initial
UNDRR snapshot exactly.

Both native component sets were exported at scale1. Original PNG sizes are
2384×192 and2384×198. Tight leaf images are lossless crops of those exports at
recorded component-set coordinates, not additional screenshot calls. They
provide direction/raster observations for the two finite native fixture widths;
an independent comparison with actual source browser gradient interiors remains
pending. These are isolated compiled-builder checks. They do not establish
full widget rendering, live mode repaint, all-five native construction, ordinary
desktop plugin rebuilds, published components or consumer uptake.
