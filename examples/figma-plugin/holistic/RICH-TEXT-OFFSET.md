# Ranged underline offsets

This candidate preserves a source underline offset within a whole logical rich
TEXT node. ErrorPage's actual textual links use `text-underline-offset: .15em`
with a computed16px font, captured as2.4px. Splitting a linked paragraph into
unrelated text nodes would lose its logical copy and supported edit contract.

## Source contract

A rich `textRuns` entry may declare `textDecorationOffset` as
`{unit: 'PIXELS', value: 2.4}`, a finite `PERCENT` value or `{unit: 'AUTO'}`.
Numeric values must remain finite when represented as FLOAT32. These are
documented native field units; the source producer must justify any CSS mapping.
The existence of `PERCENT` support does not prove a CSS percentage translation.

If any run declares an offset, every UNDERLINE run in that TEXT must declare an
explicit valid offset. Nonunderlined runs omit the field. Whole-node overrides
remain unsupported for rich TEXT. Source declarations are checked before mode
selection and connector size checks.

The existing run ownership ledger gains an offset tag only for scoped UNDERLINE
runs. Unfeatured opaque and alpha signatures retain their previous values.
Existing owned offsets cannot silently disappear: rebuilding without an
explicit source declaration refuses; an explicit AUTO declaration can reset the
field. Offset differences prevent otherwise equal adjacent ranges from merging.

## Native fields and ownership

Scoped existing TEXT requires the documented range getter and setter. Preparation
reads `getStyledTextSegments` with the offset field, validates its precision and
records it in the preflight snapshot. The normal range font, style, paint,
hyperlink and decoration ownership checks still apply. Targets and dependencies
are checked again after awaited font loading and before applying prepared data.

Numeric native readback must equal the exact FLOAT32 representation of the
source value. No epsilon or nearby unquantized double is accepted. Application
uses `setRangeTextDecorationOffset` after applying decoration, then verifies
the corresponding getter. Unexpected native setter failure is reported; no
rollback guarantee is claimed. Copied rich consumers retain the existing
supported inserted-copy and range-ownership contract, not arbitrary formatting
or whole-string component-property overrides.

## Verification and limits

The actual builder mock covers all five brand modes, explicit source bindings,
two zero-create repeats, copied consumer edits, owned field drift, precision
refusal, awaited field changes, explicit AUTO reset and omitted-declaration
refusal. Additional cases cover invalid source fields, missing APIs and adjacent
equal styles with differing offsets. Mocks simulate range fields, not glyphs.

An isolated unpublished native primitive probe created and removed one exact
TEXT node. PIXELS2.4 and-0.1 read back as2.4000000953674316 and
-0.10000000149011612; PIXELS0, PERCENT15 and AUTO read back exactly. Getter
and segment fields agreed. Its verbose trailing snapshot was truncated and is
excluded. A fresh complete snapshot independently verifies the original47-node,
28-field baseline and assets restored. Expert review accepts only the primitive
fields and cleanup, not this helper's separate native rehearsal or visual fidelity.

The connector includes the capability only for selected offset-bearing TEXT.
When absent, guarded source specialization removes its optional capture plumbing.
Actual minified unfeatured rich output matches the clean2a7c0c69 compiler output
byte for byte at61303 characters; normal Button output also matches at47339
and38632 characters. The unchanged50000-character ceiling still refuses the
complete rich offset fixture. No compiled offset execution is inferred.

Full builder integration, source/native font bytes, underline raster and
responsive reflow, ErrorPage controller/search behavior, selective publication,
consumer update/restoration and ordinary desktop recovery remain open.

Local evidence stays in `/tmp/mangrove-native-frozen-lines-20261006`, with
`native-rich-offset-field-independent-verdict.json` and the complete cleanup
snapshot. Run `node examples/figma-plugin/dev/mock-rich-text-offset.cjs` for
the bounded builder checks. These results do not change the canonical library,
consumer, recovery checkpoint or original deliveries.

A bounded shared-helper native rehearsal now passes in that same unpublished
experiment. Five actual helper applications and six complete snapshots retain
the main TEXT and an actual inserted edit in a true linked consumer through two
exact repeats each. All underline fields retain the exact FLOAT32 source2.4px
value; source bound alpha0/0.8/1 and HTTPS link fields remain intact. Four exact
scene IDs, three variables and one collection were removed without errors. Fresh
complete before/after47-node,28-field snapshots and assets equal the original
baseline. Independent review accepts the helper fields, edit/repeat and cleanup
proof in `native-rich-offset-helper-independent-verdict.json`. This does not
execute the full component builder, validate ErrorPage or source pixels, exercise
live brand modes, operate ordinary desktop rebuilds or publish a library.
