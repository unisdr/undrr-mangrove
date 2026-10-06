# Opt-in source text case

The importer accepts `textCase: 'UPPER'` or `textCase: 'ORIGINAL'` in declared
TextStyle mode values. Every source mode must declare the same supported value.
This is the bounded projection of StatsCard's actual uppercase label CSS; it
does not introduce a mode-bound case field or support arbitrary locale casing.

[Figma's TextStyle API](https://developers.figma.com/docs/plugins/api/TextStyle/)
documents a writable `textCase` field. The imported style keeps raw source
characters and ordinary character properties. It applies case through the
shared text style after source fonts have loaded. A node's `characters` remain
`Target A` when the style's case is `UPPER`; this is a formatting operation.

Full source validation and direct style import reject missing, extra, invalid
or differing case values before style writes. Existing opted-in native styles
must expose a valid documented TextCase enum. Missing, malformed or mixed
native fields refuse before any selected style write. The combined variable
import checks this before collection or variable writes as well. Fresh styles
use the documented API; an unexpected setter failure after other setters is
reported through existing importer touched-style tracking. Existing partially
touched styles are retained, so this is not a rollback guarantee.

Absent declarations preserve the previous importer path and existing native
case. An explicit `ORIGINAL` restores a previously imported `UPPER` style.
The capability does not silently reset user formatting on ordinary styles.
Normal source DTO values remain unchanged. The compile-prunable opt-in profile
is integrated and independently reviewed: absent normal and literal connector
outputs retain exact byte parity. Selected declarations are validated against
all source modes before connector narrowing. This source/compiler verification
does not establish native rendered case or locale behavior.

`dev/mock-text-case.cjs` models the documented font-required native style setter
and native style attachment in an isolated environment. It checks all five
brands, raw character preservation, stable style IDs, two imports and two
zero-create component rebuilds, explicit reset, absent preservation, source
mode failures and malformed native fields before writes, including a changed
variable alongside a later selected style. It retains a supported consumer
property override and reports an injected unexpected native setter failure.
The mock does not render uppercase glyphs or establish native font, locale,
consumer pixel or case-edit reflow acceptance. The fixture installer is exported
for source cohort tests without changing the shared base mock.

StatsCard's separate `font-variant-numeric: tabular-nums lining-nums` request is
unresolved. Figma's documented `openTypeFeatures` and range getters are
read-only, and the pinned source font has genuine feature substitutions.
Text-case support does not prove numeric glyph equivalence or provide an
OpenType setter.
