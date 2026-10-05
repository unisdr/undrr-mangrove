# Source gradients and native alpha evidence

The existing builder supports leaf FRAME gradients with one or two source
layers, finite transforms and ordered stops bound to COLOR variables. Each
stop uses its resolved RGBA value and retains the variable alias. This is a
finite paint contract, not browser scrolling or a complete HubHeader.

A guarded disposable native experiment on 6 October 2026 compared three stops:
an opaque COLOR alias with a literal terminal alpha of zero, a separate
same-RGB transparent COLOR alias, and a separate black transparent COLOR alias.
The opaque alias overwrote the literal zero alpha with one. Separate transparent
roles preserved zero alpha. Red, blue and restored red native paint readbacks
retained the expected aliases and values after live mode changes.

The saved restored-red render also demonstrates different interpolation:
midpoint red channels were 255, 126 and 62 respectively over black. A black
transparent endpoint darkens the native fade more than the same-RGB endpoint.
Thus a source-derived transparent role needs a deliberate RGB contract. The
CSS source literal `rgba(0,0,0,0)` must not be copied into Figma with an assumed
identical appearance. Actual source/native HubHeader pixel comparison remains
open. Only the restored-red render was returned and saved; blue has paint
readback evidence, not a saved rendered image.

The experiment created four nodes, three variables and one hidden collection,
then removed them. Its first receipt records stale same-call variable/collection
lookups as residual errors, while local enumeration already omitted those IDs.
A fresh independent call found each exact ID absent from lookup and enumeration.
Cleanup acceptance uses that fresh verification, not a falsely clean initial
report. All 81 before/after scene geometry/mode rows and collection/variable/text
style ID arrays matched exactly under independent recomputation. Asset values
and every scene property were outside that comparison.

Evidence: `/tmp/mangrove-native-gradient-alpha-probe-20261006.js`, its
`-receipt.json`, `-cleanup-fresh-read.json` and `-red-restored.png`, plus
`/tmp/pixel-evidence.json`. The experiment was separate and unpublished; no
canonical, recovery, consumer or publication operation ran. This establishes
bounded native paint/alpha semantics only. Integrated gradients, source pixel
parity, all-brand native typography and publication remain separate gates.
