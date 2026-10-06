# Read-only source93 collection ownership proposal

The pinned source candidate is `/tmp/mangrove-source93-packet-20261006.json`, 130,949,357 bytes, SHA256 `52f484c6fc5fe78c9f7d6fc1f455fd54690ad572a3cd755a8b2ad4ccf22a0fee`. It contains 93 source families and 1,184 variants, plus CTA23/Button16/Checkbox30/Radio30/Status7 dependencies. Its embedded revision is d6183272 with historical nonempty workingInputs. This is not a clean5989 delivery and does not include the held Topic/Index, Drawer, Cookie or Footer cohorts.

## Ownership decision

A proposed fixed manifest declares 59 logical collections. Foundation retains the exact 520 normal source variables, 102 text styles and eight effect styles, identified by exact normal DTO IDs and contents, not by a prefix or an array offset. Normal asset SHA matches the packet baseContract `70657886b111fc2085627b996e269d4f70f3c0f936f31f07863f3ca2ed397bfe`.

Each added producer domain has its own logical owner. Five added Tag helpers use a single explicit source-tag owner. This names source ownership and does not turn captured values into semantic public maintenance tokens. Two producer domains require genuine sub-boundaries:

- Gallery image has 9,720 roles. Its 11 authored `sourceContract.story` values define fixed owners: basic-gallery, corner-navigation, infinite-loop, many-images, minimal, mixed-aspect-ratios, start-at-second-image, thumbnails-bottom, without-arrows, without-descriptions and without-thumbnails. Context names must correspond to the actual variant contract; no sorting or hash ranges establish ownership. The largest story owner has 1,840 requested roles.
- ContentHub has 5,413 roles. Its actual source recipe explicitly creates `geometry/` roles in number(), `paint/` roles in paint(), and `type/` roles in text style construction. Those three stable ownership categories contain 4,392, 621 and 400 roles. They retain existing cross-category references and do not imply live geometry repositioning or semantically justified paint aliases.

All 55,171 source IDs, names, descriptions, scopes, mode values, aliases, styles, component/instance identities and recorded metadata remain unchanged. Collections only describe ownership. No role is merged because of equal values. The highest requested count is CopyCite4,545, leaving455 slots on a genuinely empty target. ContentHub geometry has608 slots; ImageArticle800. Future additions to any owner must fail capacity checks until an explicit authored new owner/migration is reviewed. No automatic rebucketing or moving old native variables is allowed.

## Whole-source dependencies

All five source modes have complete values and typed acyclic alias closure. The original graph has18,439 alias-mode edges,17,926 of them cross-owner under this proposal. Keep the source aliases unchanged and build a global source-ID/native-ID map before applying alias values.

The conservative dependency census walks every complete source family and dependency object, including review fields and metadata, all styles, and every alias value. It finds54,186 distinct exact-name referenced roles. Retain the remaining985 roles as well. This reference overapproximation cannot authorize stripping evidence fields, literal specialization or deleting a role. Unknown runtime fields remain included. Style objects remain single global source records; collection ownership does not duplicate them.

Every advanced resolver later needs an explicit source role-to-owner/native mode map. Text styles and named fonts, rich alpha/offset and frozen lines, SVG sizing, gradient matrices/stops, masks, focus/effects, instance dependencies and review dimensions must participate. Current native V1 refuses this full source packet because it permits only empty styles and font-free FRAME trees. A capacity proposal is not an importable adapter.

## Actual occupancy and native gates

There is no source93 native target/inventory. The counts are requested fresh-target projections. Before any import, resolve only exact local collection ledgers and exact variable source identities. For each owner, count all current occupants including retained stale owned variables, count requested missing source IDs once, reject foreign occupants and wrong memberships, and require current occupancy plus missing variables at most5,000. Never assume stale owners disappear or adopt a matching collection name. A partially completed prior import remains a journaled actual occupancy input.

Apply each selected brand to every required owner with its independently resolved native mode ID, including the alias target owners and nested/review consumers. Construction-time x/y remains one-shot source resolution, not live positioning. Collection mode inheritance, linked consumers, all advanced ownership ledgers, ordinary installed-plugin performance and pixels need separate native acceptance.

Figma's current [create variables help](https://help.figma.com/hc/en-us/articles/15145852043927-Create-and-manage-variables-and-collections) documents5,000 variables per collection. The current [plan comparison](https://help.figma.com/hc/en-us/articles/360040328273-Compare-Figma-plans-and-features) documents Professional up to10 modes per collection. The [REST variables endpoint](https://developers.figma.com/docs/rest-api/variables-endpoints/) documents40 modes per collection for that API. Those sources do not establish a file-level59-collection performance/UI guarantee. Collection count feasibility and actual target plan/limits remain unverified. The unchanged50,000 compiled payload ceiling and publication/consumer library behavior remain independent gates.

## Proposed pure planner boundary

A new pure module may consume the immutable source packet and matching normal foundation DTO, return the explicit ownership assignment, alias/family/style closure, capacities and limitations, and perform no mutation or I/O. It must use a fixed producer/story/category whitelist, reject unknown owners, duplicate IDs/names, missing or wrong foundation records, malformed/nonselected mode values, missing/cyclic/type-changing aliases and over-capacity owners. A separate optional snapshot evaluator must account for actual retained occupancy and decline to call missing inventory native-ready. Do not return `nativeCollections` or normal importer top-level fields. Read-only CLI evidence can write an external report. Tests should use true source-shaped fixtures plus an optional exact pinned93 audit, demonstrate stable owner identity under reordering/value changes and count growth, reject automatic reassignment, and prove caller data unchanged.

## Implemented read-only tooling

`scripts/figma-native-capacity-plan.cjs` exports `buildNativeCapacityProposal({packet, foundation})` and `evaluateCapacityInventory(proposal, snapshot)`. The proposal is deliberately a different kind from both the source packet and an importer DTO. It has `collectionProposal` and assignment records, not `nativeCollections`, `collection`, `modes`, `variables`, `styles` or `components` at the top level. It does not attach fields to the caller's packet or invoke any Figma API. It preserves historical source revision and workingInputs verbatim.

The fixed owners are explicit in the module. Unknown producer, Gallery story/context or ContentHub constructor refuses. Added roles in a known owner stay with that owner even if values or input order change; an oversized owner refuses rather than choosing a different collection. The normal foundation must match its packet digest and every original variable/style record. Added helpers never become foundation merely because their names look like public tokens.

The family diagnostic conservatively includes exact variable names, style IDs and family IDs from complete family objects, recursively follows actual dependency families and referenced style bindings, and follows all-mode alias targets. It also retains all styles and otherwise unreferenced variables. This is an ownership/reference census, not the complete advanced renderer/source DTO validator. Strings that do not exactly equal declared identities cannot prove a runtime relationship; unclassified schema fields remain a separate adapter review gate. No field-name pruning is performed.

The optional capacity evaluator accepts a complete caller-supplied inventory projection:

```json
{
  "scope": "all-local-collections-and-variables",
  "complete": true,
  "provenance": { "receipt": "caller-owned inventory receipt" },
  "collections": [
    {
      "id": "native-collection-id",
      "remote": false,
      "ledger": {
        "version": 1,
        "planId": "mangrove-source93-capacity-v1",
        "collectionId": "foundation"
      },
      "variableIds": ["native-variable-id"]
    }
  ],
  "variables": [
    {
      "id": "native-variable-id",
      "variableCollectionId": "native-collection-id",
      "sourceId": "original-source-variable-id",
      "remote": false
    }
  ]
}
```

Here `sourceId` is the caller's parsed existing source identity and `ledger` is the parsed exact collection ledger. The evaluator checks complete internal membership, duplicate global identities, wrong or remote owners, missing identities/foreign occupants, fixed proposal partition integrity and retained occupancy plus requested missing IDs. It does not claim that the caller actually enumerated a live file, verify live native values/mode maps, check an asset transaction or grant native acceptance. Its result says capacity passes for that supplied projection only. No inventory leaves `nativeOccupancy` unverified. A real native snapshot, source-capability fence, awaited ownership barriers and compiler review remain necessary before any write.

The mock exercises source-shaped fixtures, review dimensions, style and nested family/alias closure, exact normal records, deterministic identities under reordering/value changes, retained unused roles, unknown contexts/producers, missing/nonselected/malformed/type-changing/cyclic aliases and oversized owner refusal. It tests capacity exactly5,000 versus5,001 including retained stale identities, reused requested identities, foreign/moved/remote/missing/duplicate membership, malformed proposals and caller immutability. External temporary CLI files are removed after output/input-overwrite and argument guards are checked. Those offline inventory fixtures are not native evidence.

The complete pinned93 run produces59 owners,55,171 assignments and18,439 exact source alias-mode edges, with985 roles retained despite no exact-name reference in the conservative census. Fresh requested counts range from1 to4,545. The external report is `/tmp/mangrove-source93-capacity-planner-output-20261006.json`; it is an audit artifact, not a new delivery or a Figma import.

```sh
node examples/figma-plugin/dev/mock-native-capacity-plan.cjs
node scripts/figma-native-capacity-plan.cjs \
  --packet /tmp/mangrove-source93-packet-20261006.json \
  --foundation /tmp/mangrove-source93-verification-20261006/examples/figma-plugin/mangrove-variables.json \
  --output /tmp/mangrove-source93-capacity-proposal-new.json
```

The CLI refuses an existing output and cannot overwrite an input. It records the original packet byte SHA separately from the catalogue content SHA. It does not regenerate source recipes or alter existing packages. Source106 and later accepted cohorts require their own explicit manifest extension and census; this source93 proposal makes no source106 capacity claim.
