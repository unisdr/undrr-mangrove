# Reviewed cloud draft adapter

`scripts/figma-cloud-draft-experiment.cjs` prepares a minimal experiment document
from the current guarded source-only packet. It accepts only the recorded
unpublished target `GbVTvFbuWjoJr6Bf5t4fhg` and explicit unique draft family IDs.
It preserves foundation values and stable IDs, uses a separate local collection,
and omits canonical guidance and planned inventory. It never reads an arbitrary
external packet or changes the normal exporter.

`buildCloudDraftDocument({ fileKey, familyIds })` returns data only.
`compileCloudDraftOperation({ fileKey, familyIds, operation, brandId,
variantIds, variableIds, styleIds })` supports import/build and always applies the
[exact target guard](TARGET-GUARD.md). Provenance in the document is inert; the
execution guard provides target enforcement. There is no CLI and no implicit
default target or family selection. Source packet provenance records the current
commit and working inputs, rather than claiming uncommitted inputs match HEAD.

Run `node examples/figma-plugin/dev/mock-cloud-draft-experiment.cjs`. Checks cover
foundation/identity preservation, wrong/protected target refusal, scoped importer
refusal with unchanged scenes/variables/styles/collections/font loads, accepted
one-variable import with pruning disabled, guarded Tag construction and two
zero-create mock repeats. Independent review also checked actual importer schema,
returned-document isolation and bounded compiler payloads: scoped spacing import
13,853 bytes and Tag build 42,089 bytes at the reviewed checkpoint. The compiler
enforces the unchanged 50,000 character/byte limit after adding the guard.

The empty cloud file and actual Plugin API file key were inspected before adapter
preparation. The first UNDRR Tag experiment has now run. Scoped leaf imports
initially omitted the shared review label font, so five masters were created
before review construction refused. The partial operation was inspected and
recorded before repair. `cloudDraftImportScope(doc)` now includes the three
shared review roles as well as selected tree/style dependencies. It is opt-in;
explicit one-variable maintenance-style experiments retain their exact scope.

After the reviewed dependency repair, the five Tag masters and review instances
built with no errors. A separate local instance retains its edited label and
explicit UNDRR mode. The first unchanged cloud repeat revealed fixed-height
review scaffolds settling from 100/40px seeds to natural 566/502px bounds.
The native API resets axis modes on resize. Moving resize before AUTO/FIXED
assignment in the two shared staging helpers keeps vertical content hugging.
The corrected frozen checkpoint payload then passed two zero-create cloud
repeats with exact equality across 59 recorded geometry rows, instance links,
text and top-level explicit modes. The final screenshot shows the complete
white review surface. This explains the staging scaffold issue only; it does
not diagnose the recovery file's separate subpixel section drift.

Evidence is retained under `/tmp/mangrove-cloud-tag-c888220d`, including exact
payload/hash, dependency import reports, partial inventory, consumer IDs,
corrected application, two repeats, full compact snapshots and final screenshot.
The collection is `VariableCollectionId:3:2`, Tag set `4:5`, review root `4:3`,
and edited consumer instance `7:13`. These are unpublished cloud source-path
experiments, not ordinary desktop plugin rebuilds or publication proof.
Other brands, native visual parity and full-page integration remain open.

Native font reads also exposed a rich-text dependency boundary: available-font
entries omit variable axes while actual style/text reads include them. The rich
builder refuses unresolved named-instance defaults before style or scene writes.
See [the rich-text capability contract](RICH-TEXT-CAPABILITY.md). Shared identity
mode remains required. Preserve generated deliveries and existing backups.

This adapter establishes no desktop file-key availability, ordinary plugin
rebuild acceptance, native rendering fidelity, publication or consumer update.
It must not be installed as an unguarded desktop import path. Canonical,
consumer and recovery files remain protected. Further families require their own
source/browser and isolated native acceptance rather than inheriting Tag results.
