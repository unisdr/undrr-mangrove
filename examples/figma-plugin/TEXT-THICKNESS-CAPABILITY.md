# Plain text underline thickness

Source node DTO accepts `textDecorationThickness: { unit: 'PIXELS', value: 2.5 }`
only on plain editable `TEXT` with explicit `textDecoration: 'UNDERLINE'`. The
value must be finite and positive. Other units, extra keys, rich `textRuns` and
thickness variable bindings refuse. The measured HubHeader source requires
2.5px thickness alongside its existing 6.4px underline offset. Shared text styles
and rich run ownership are outside this bounded capability.

The [Figma thickness type](https://developers.figma.com/docs/plugins/api/TextDecorationThickness/)
supports native AUTO, PIXELS and PERCENT. The
[TextNode API](https://developers.figma.com/docs/plugins/api/TextNode/) returns
null when not underlined and requires fonts loaded before accessing this field.
The helper validates those native shapes, rejects mixed/malformed profiles and
verifies the explicit pixel setter readback. All relevant existing owned text
fonts and profiles validate before style import or scene construction. Source
profiles validate across the selected dependency closure before those writes.
Style import failure refuses the thickness scene build. An unsupported API on a
fresh node can still fail after earlier asset/scene writes; this does not provide
transaction rollback.

The isolated mock adapter models the documented field and font requirement,
including cloned consumer inheritance. It does not model real font metrics or
underline rendering. Actual-builder tests cover five brands, two zero-create
repeats, consumer text edits and links, malformed source/native profiles, missing
native field and font refusal. The compiler validates immutable source profiles,
includes the helper only when present and retains native checks. Ten ordinary
scoped first-variant payloads match the committed compiler byte for byte with
both this capability and the preserved review width correction. The 50,000-byte ceiling remains.
Native HubHeader thickness/readback, rendering, continuation geometry, actual
consumer overrides and publication remain open. Plain owned main text follows
its existing source reset contract; this capability does not add manual formatting
or main-copy preservation.

## Preserved review cell width

Review rows for `preserveVariantSizing` variants now accommodate the actual
finite positive native FIXED master width plus the existing 8px padding on each
side. A token width resolving to 600px therefore gets at least a 616px cell.
HUG masters keep the previous cell width. Explicit larger review widths and
source surface padding remain respected. This addresses SectionHeader browsing
cell overflow and does not diagnose the tiny recovery-file rounding drift.
The separate mock covers fixed token width and HUG width across all five brands
with two zero-create exact recorded geometry repeats. Native review rendering
and the recovery drift remain separate gates.
