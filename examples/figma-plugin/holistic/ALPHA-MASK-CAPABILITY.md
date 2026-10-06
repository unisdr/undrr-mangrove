# Subtree ALPHA mask source candidate

This is a documented source candidate, with native rendered parity explicitly unproved. Three isolated cloud prototypes retained `isMask`, `maskType`, gradient properties and repeat geometry, but exported the body fully opaque through the intended fade. FRAME, RECTANGLE and documented RECTANGLE/body GROUP containment all failed that visual check. The cause is unconfirmed. The independent cleanup receipt restored the full prior 47-node baseline. Further unchanged cloud probes have stopped; ordinary desktop rendering remains a separate gate.

Receipts are preserved in `/tmp/mangrove-native-frozen-lines-20261006`: `native-subtree-mask-probe-tool.json`, `native-subtree-mask-rectangle-probe-tool.json`, `native-subtree-mask-group-probe-tool.json`, their PNG/pixel scans, final cleanup snapshot and `mask-independent-verdict.json`. Property readback is not rendered-mask acceptance.

## Bounded source schema

The first child of a fixed VERTICAL/HORIZONTAL auto-layout clipping FRAME can declare `alphaMask: {type: 'ALPHA'}`. It must be a leaf FRAME with a single existing source gradient layer and absolute START/START offsets that resolve to zero. The owning FRAME has exactly two children: the mask and genuine content FRAME. The mask viewport spans the owner width and covers its height. Positive dimensions, typed FLOAT aliases, ordered gradient stops, invertible transforms and finite RGB/alpha roles are validated across every source mode and every imported native mode before permanent writes.

The first source gradient role is opaque and the last is transparent. ShowMore's actual source uses opaque stops at 0 and 0.6, then transparent at 1, across a fixed 200px gradient viewport. A 168px target still clips that 200px mask rather than moving the fade endpoint. The content subtree contains its actual background and editable text. The toggle remains outside the isolated mask owner. No background wash or flattened screenshot replaces the subtree.

`alphaMask: {type: 'NONE'}` is an explicit reset. That leaf must have no gradient, fill, image, stroke or effect, so disabling a mask cannot expose a visible black fade behind transparent content. The full plugin refuses removal of the declaration from a previously owned mask; an explicit NONE reset is required. An ordinary compiled tree with no declaration prunes the entire capability to preserve absent-feature byte parity, so that connector has no native mask-ledger removal fence. Ordinary trees without the declaration remain outside this feature. Selected mask candidates are refused in an organized kit before layout/font work; this bounded capability is confined to an unorganized experiment, with no canonical library or recovery acceptance.

## Helper API and ownership

- `mgAlphaMaskPlan(tree, owner, childIndex)` validates source anatomy and records a source signature. It returns null for an absent declaration.
- `mgAlphaMaskDocumentValues(plan, document)` resolves every source mode, including unused native-build modes, with typed aliases and cycle refusal.
- `mgAlphaMaskNativeValues(plan, modeIds, resolve)` validates all imported mode IDs with a typed resolver `(name, modeId, type)`.
- `mgNativeAlphaMaskPlan(node, owner, content, sourcePlan, identity)` checks existing main-node ownership before styles or scene writes. All three nodes absent is a fresh plan; partially existing closure is refused. Exact parent IDs, two-child order and full managed identities are required.
- `mgApplyAlphaMask(plan)` runs after both children are materialized. It rechecks the source/native fence, sets mask fields and verifies their readback, then saves the ownership ledger.

The caller supplies `identity.get(node)`, `identity.expected` full keys for mask/owner/content, and `identity.readState(node)` / `identity.writeState(node, value)`. The builder routes the legitimate `mgAlphaMaskV1` identity key through its existing private/shared host mode. The helper does not bypass that mode or directly read private cloud data.

An existing unledgered mask is not adopted. A ledgered mask whose `isMask` / `maskType`, main identities, parent or sibling order drifted is refused before applying changes. Fresh proxy objects are compared through documented node IDs rather than JavaScript object identity. A legitimate NONE reset preserves those same owned node IDs. Partial native setter failure is reported without a rollback guarantee.

This ledger currently covers main-mask `isMask` / `maskType`, identities, parent and sibling order. It does not ledger native gradient paints or geometry; their source plans use the existing builder contracts. Copied consumer ledgers contain main node IDs, so the helper does not claim mask-field override validation for consumer instances, other pages or published libraries. The actual builder integration tests retain supported TEXT edits in linked consumer clones. They do not establish rendered alpha, consumer mask-field overrides or arbitrary source reflow.

## Verification and remaining gates

The dedicated helper harness checks all five modes, 200px/168px owners, source immutability, two exact native-field/ledger repeats, explicit reset/re-enable and malformed shape/type/mode/alias/alpha/transform refusals. It checks parent/order/identity/API drift, foreign masks, fresh/partial closure, proxy identity and changes after preflight. The fixture models documented native fields, not pixel compositing.

The actual-builder harness independently passes across all five modes with genuine nested clip/content frames, linked consumer TEXT edits and two exact zero-create repeats. It verifies native mask fields and ledger identity, explicit NONE reset, exact alias identity, drift after font-loading awaits, absent-declaration refusal in the full plugin and variant-root owner refusal. These tests model documented native fields without simulating pixel compositing.

The compiler validates declared ALPHA/NONE source scopes across all source modes before narrowing. The current full candidate connector is 56,135 bytes and refuses the unchanged 50,000-byte ceiling; no compiled mask connector was executed. Absent-feature compiled byte parity is checked separately by the root coordinator. Native source pixels, ordinary plugin rendering, live mode behavior, consumer mask overrides, publication, recovery and human handoff remain open.

Official references: [Shared node properties](https://developers.figma.com/docs/plugins/api/node-properties/), [MaskType](https://developers.figma.com/docs/plugins/api/MaskType/) and [Paint](https://developers.figma.com/docs/plugins/api/Paint/).
