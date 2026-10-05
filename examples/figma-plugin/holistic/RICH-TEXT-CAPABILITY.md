# Isolated editable rich text capability

`kit-rich-text.js` exposes `mgRichText.prepare(spec, context, existingNode)` and
`mgRichText.finalize(plan, importedContext)` and
`mgRichText.apply(plan, targetNode)`. The full builder source now activates this
capability only when its selected closure declares `textRuns`. Existing plain
recipes retain their previous path. Generated runtime installation and native
acceptance remain separate. The dedicated offline harness is
`node examples/figma-plugin/dev/mock-rich-text.cjs`.

## DTO and supported edits

A single `TEXT` recipe owns nonempty `characters` and `textRuns`. Runs cover the
entire string in order, with unique stable `id`, UTF-16 `start`/`end`, named
`textStyle` and `fill`, optional `textDecoration` (`NONE` or `UNDERLINE`) and
optional `{ type: 'URL', value: 'https://...' }` hyperlink. Offsets are inclusive
start and exclusive end. Boundaries may not split a surrogate pair. Maximum
length is 32768 UTF-16 units and maximum run count is 128. Run paint roles must
resolve to opaque COLOR values in every required mode. Partial alpha, arbitrary
font overrides, non-HTTPS links and unsupported run fields are refused.

Rich DTO keys are limited to id/key/name/type/characters/textRuns and compatible
layout, textWrap, textAlign, position and absolute geometry. There is no top-level
textStyle, fill, decoration or textProperty on a rich DTO.
All character styling belongs to the runs. Normal layout, text alignment and
wrapping remain builder responsibilities, applied without flattening ranges.

The fixture derives UserFeedback confirmation copy and default feedback URL from
its actual JSX. It also exercises ArticleStory's strong `45`/`11` spans and an
actual article link target. These test source content correspondence and mixed
formatting mechanics, not inferred browser typography or fully authored article
layout. Integration recipes must supply measured source-specific style/paint
roles; the harness's body/strong maps are isolated dependencies.

Supported edits change text inside existing native formatted spans, including
link label and bold span edits and edits before a link. Current native styled
segments supply the new boundaries. Source offsets are never reapplied to edited
copy. An ordered ownership ledger maps current segment signatures to authored
run IDs. Signatures include native style identity, family/style and every normalized native variable-font axis, bound paint variable,
decoration and URL. Repeated signatures separated by a different run are
supported by exact ordered matching. Adjacent identical signatures must be
consolidated into one authored run, since Figma cannot expose their boundary.
Deleting/merging a run, changing native formatting/identity or losing the ordered
ownership sequence requires explicit migration and is refused before mutation.

Source default copy updates apply when the current string equals the last source
default. Supported edited copy remains intact while declared style/paint/link
updates apply to its current ranges. Arbitrary pasted text and complete plain
string resets are not silently guessed into semantic spans.

Whole-string component TEXT properties are explicitly unsupported: the DTO
rejects `textProperty`, and preflight/apply reject a native
`componentPropertyReferences.characters` reference. A property reset can erase
range ownership. Direct formatted text editing is covered; component-property
editing and consumer-instance inheritance require a separately verified contract.

## Context and integration order

The context contains `figma`, required native `modeIds`, a verified host
`creationFont`, and these callbacks:

- `resolveStyle(key)` returns `{ key, style }`, where style is the imported native
  TEXT style with id and concrete native FontName, including all variable axes when present. For a deferred projection, return pending:true and style.id:null
  when no native style exists. Source-key correspondence must come from the builder's validated imported identity map.
- `resolveColor(key)` returns `{ key, variable, values }`, where variable is the
  native COLOR variable and values are resolved RGBA values keyed by every
  required native mode ID. Resolve aliases before passing this map. Wrong type,
  missing mode, invalid value or key mismatch fails preflight.
- `readState(node)` and `writeState(node, serializedLedger)` read/write the dedicated
  owned identity field `mgRichTextRunsV1`, using the existing shared
  identity helpers. An existing nonempty target without its ledger requires
  explicit migration. Never identify a rich target by approximate name.

The full builder integration follows this order:

1. The selected closure detects `textRuns` under the capability flag.
   It records every run style/paint dependency; retain source recipe guards and target
   file guard. Prepare all selected rich nodes as part of transaction preflight
   before asset/node mutation. Do not postpone rich validation until tree creation.
2. Resolve existing owned TEXT nodes, validate their type and ledger, and call
   `await mgRichText.prepare(spec, context, existingNodeOrNull)` with
   `deferredStyles: true`. Style definitions are projected from the selected
   source brand after exact importer validation and source font/size alias checks.
   An existing style carries its true native ID; a new style carries `id: null`
   and `pending: true`. A pending source identity is never applied as a native ID. Preparation checks
   offsets, identities, links, all required paint modes and native run ownership,
   and awaits every authored and existing run font. A fresh target requires a
   previously verified creation font, which is also awaited.
3. Import selected styles, retaining its existing partial-error report. Any
   style import error stops rich scene creation. Call
   `mgRichText.finalize(plan, importedContext)` with actual native style objects.
   Finalization requires the expected source-key/native-ID mapping and desired
   font. It allows only the captured existing signature or its expected shared
   font update. Content, ledger, range boundaries, links, paint identities and
   other formatting changes fail closed. Every plan finalizes before scene
   construction.
4. In `treeNode`, preserve the existing ownership key and create exactly one TEXT
   only when fresh. For rich DTOs bypass the ordinary whole-node text style,
   `characters`, fill, decoration, direct-text binding and character-property reset
   paths. Keep compatible layout/wrap/alignment handling. Never flatten text runs
   as a post-processing repair after the current reset path.
5. Call `await mgRichText.apply(plan, node)` once. It checks target and dependency
   snapshots again before mutation, consumes the plan, applies native range style,
   bound paint, decoration and hyperlink, then writes its ownership ledger.
6. Record returned nodeId/runCount/preservedEdits in the operation report. Audit
   current range styles, aliases, hyperlinks and text after rebuild. Instance
   properties must not subsequently overwrite this rich node's characters.

`prepare` is mutation-free except awaited font loading. `apply` uses existing
native range APIs and does not create, replace, detach or rename nodes. Plans are
opaque, one-use handles. Existing target/dependency changes between preflight and
apply fail closed. Unexpected native range setter failures after apply starts are
not a transaction rollback implementation; root must preserve recovery evidence
and report partial-operation errors through the existing controlled build path.
The standalone mock cannot prove that the host never fails mid-apply.

Figma's [TextNode API](https://developers.figma.com/docs/plugins/api/TextNode/)
documents styled segments, asynchronous range text styles, range fills,
decorations and hyperlinks. Bound variable identity is read from each segment's
paint, rather than requesting a nonexistent segment-level boundVariables field.
Native segment serialization, font availability, hyperlink/underline rendering,
shared style behaviour and edit preservation still require the isolated Figma
experiment. This capability alone establishes no native, publication, consumer
update or ordinary-plugin repeat gate.

## Compiler boundary and evidence

The bounded connector detects rich DTOs, retains their style/paint alias closure
and includes this module only for those DTOs. Before compilation it executes the
exact importer validator and `mgRichSourceStylePreflight` extracted from the
builder between its uniquely checked declaration and `buildMangroveComponents`.
It also executes actual `mgRichText.prepare` against immutable source dependency
projections without creating or applying any native plan. Compiler font loading
is a pure no-op; native font availability and loading remain mandatory at runtime.

Only pure source checks are specialized: `MG_CONNECTOR_RICH_SOURCE_VALIDATION`
omits the already executed source-style validator, and
`MG_CONNECTOR_RICH_DTO_VALIDATION` omits the already executed source grammar,
offset, URL and coverage checks. Native asset identity, alias/type/value checks,
all font loads, ownership/stale-plan/finalization and unsafe property guards
remain. The general full plugin retains every source check.

The representative one-family rich connector still exceeds the existing 50000
byte ceiling at approximately 52k before a target guard. Compilation explicitly
refuses it. No ceiling increase, metadata truncation or dynamic code execution was
introduced. Rich full-builder cloud transport remains open, even though source
plugin integration is testable locally. Invalid offset/property and source
font-size drift fixtures fail before compilation independently of the size gate.

The isolated integration harness runs the actual builder with a dedicated
range-aware mock adapter, leaving shared mocks unchanged. It exercises fresh
unimported styles, two zero-create repeats, edited linked/bold copy, untouched
consumer identity/text/link/paint after main updates, expected shared font
updates, invalid transaction preflight and failed style import with no scene
creation. Its font/range model is declared test scaffolding and does not establish
native rendering or consumer inheritance acceptance. Normal mock-kit checks,
including all-brand lossless import payload bounds, also pass.

A separate full-goal gate remains
`rich-font-only-migration-after-independent-maintenance-style-import`. If a
shared font changes through an independent maintenance style import before rich
builder preflight, the old ownership ledger causes refusal. Supporting that
migration requires proof of the projected source font, stable shared style ID,
current semantic range identity and retained edited content. It must be verified
before claiming occasional style maintenance for every rich contract. The current
reduced maintenance split scope is unchanged.

## Native named-font projection

Source family/style values are FontNameInput named instances. Native FontName
reads can also contain variationSettings with every family axis. The rich builder
uses its existing listAvailableFontsAsync inventory and resolveFontInput to
resolve each source named instance and the Inter Regular creation font to one
unambiguous concrete font before asset import. It also calls the documented
getFontFamilyVariationAxes discovery API and requires the available-font entry
to contain every declared native axis. Missing API support refuses. When named
font inventory omits axes, the optional guarded preparation described below
must succeed before any asset/style import or authored scene construction. Explicit source axes currently
must agree with the native named-instance defaults. Arbitrary authored variable
axis overrides are outside this bounded capability.

Axes are validated as finite values under four printable ASCII character tags
and sorted for deterministic signatures. They remain in run ownership,
dependency stamps, finalized style comparisons and fresh creation-font checks.
A manual axis edit is refused, even when family and style names stay the same.
Finalization only permits the concrete font projected before import. It does not
accept arbitrary axes first observed after import as proof of source defaults.

The standalone harness covers native-shaped Regular/Bold fonts, default axes,
ambiguous/missing inventory, changed axes and two zero-create repeats. The actual
builder adapter models available-font entries, TextStyle.fontName and creation
fonts carrying default axes, then verifies fresh styles, repeated builds and
edited rich copy. These API fixtures remain offline evidence. Actual isolated
native rich-text execution and rendering acceptance are still open.

The isolated native inventory omits axes while TextStyle and text/segment reads
include them. The builder now has an optional guarded operation-local disposable
TEXT preparation phase to resolve these defaults through documented named font
assignment and concrete readback. This phase is real mutation, journaled
separately from mutation-free rich ownership preflight. It requires the trusted
compiled experiment assertion, verifies owned probe removal and recorded scene
and asset equality, and refuses missing guards, changed targets, failed reads,
cleanup uncertainty or source-axis disagreement. Its concrete map lasts only
for that operation. The ordinary unguarded plugin still refuses unresolved
defaults. See [Font defaults preparation](FONT-DEFAULTS-PREPARATION.md) for the
API, scoped verification fields and partial failure contract.

The root's isolated native five-face probe proves the supported primitive and
cleanup. The installed shared path has offline actual-builder coverage across
all five brands, fresh styles, two component zero-create repeats, edited rich
copy and failed target/cleanup refusal. Installed end-to-end native rich build
and rendering acceptance remain open, as does the unchanged connector payload
ceiling. No default map from another file or brand is generalized.
