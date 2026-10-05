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
preparation. No cloud import/build has run yet. Before the first write, reconcile
the current target inventory and required fonts against the reviewed source,
then save the full operation reports and exact changed asset/node IDs. Shared
identity mode remains required. Preserve the normal generated runtime and every
existing delivery.

This adapter establishes no desktop file-key availability, ordinary plugin
rebuild acceptance, native rendering fidelity, publication or consumer update.
It must not be installed as an unguarded desktop import path. Canonical,
consumer and recovery files remain protected. Further families require their own
source/browser and isolated native acceptance rather than inheriting Tag results.
