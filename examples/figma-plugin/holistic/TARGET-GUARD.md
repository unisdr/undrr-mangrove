# Isolated cloud target guard

`buildConnector({ experimentFileKey, ...options })` supports an exact separate
experiment target for bounded import/build operations. It adds a check before
runtime evaluation and at the actual async importer/builder entries. The check
reads the current Plugin API file key each time. Missing, mismatched and protected
canonical/consumer/recovery keys refuse before the operation proceeds.

The guarded program exposes an immutable zero-argument operation-local
`mgAssertExperimentOperationTarget` closure containing the validated expected
key and protected-key list. Entry checks call that same closure. Reviewed
preparation helpers can recheck it after awaited API calls and immediately before
a probe write. They cannot supply a different expected key or infer permission
from document metadata or the currently open file. Guard preparation refuses
binding collisions, including function/method parameters, destructured variables
and catch bindings. An absent guard option leaves ordinary compilation unchanged.

The guard uses parsed function declarations and requires exactly one expected
entry. It fails compilation when an entry disappears or becomes ambiguous. It
does not register desktop handlers, change the normal runtime, bypass importer
preflights or make the source-only draft packet importable. The option must be
provided programmatically; the ordinary connector CLI is unchanged.

The target key must come from actual file creation and read-only inspection. The
current unpublished experiment is `GbVTvFbuWjoJr6Bf5t4fhg`. Cloud inspection
confirmed that exact `figma.fileKey` and an initially empty page. The unpublished
Tag cohort now has separate [cloud evidence](CLOUD-DRAFT-EXPERIMENT.md).
Desktop plugin file-key availability remains unverified.

Run `node examples/figma-plugin/dev/mock-experiment-target.cjs`. The harness
checks refusal before evaluation, live key changes before entry and after an
awaited load, reserved binding collisions, accepted bounded construction and
zero-create repetition. Independent review also exercised
compiled scoped import/build refusal with no font, scene, variable, collection or
style API mutation and unchanged mock state. The ordinary option absent and
explicitly undefined produced identical code. Evidence is recorded at
`/tmp/mangrove-experiment-target-independent-20261005.json`.

These are compiler/mock checks. Native rendering, ordinary desktop rebuilds,
publication and consumer update/restoration require separate evidence. Full
unscoped imports may exceed the connector transport ceiling; explicit variable
and style scopes retain dependencies and disable pruning. No metadata truncation
or relaxed target checks are permitted to fit that ceiling.
