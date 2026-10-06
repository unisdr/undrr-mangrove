# Plain TEXT decoration inheritance

The BookCard native experiment exposed a renderer defect: its linked title tree correctly selects an underlined text style and leaves decoration to that style, but the builder then assigned `NONE` whenever the tree omitted `textDecoration`. The imported style remained underlined while the node and styled ranges lost the underline.

The builder now uses an explicit tree decoration when present, otherwise the imported style decoration, otherwise `NONE`. Explicit `NONE` continues to override an underlined style. This changes plain TEXT application only. Source recipes, style identities, token aliases, rich-text application and normal export DTOs are unchanged.

`dev/mock-text-decoration-inheritance.cjs` uses both genuine source BookCard variants in all five modes. It deliberately restores the old assignment to reproduce the defect, compares every other recorded title field, verifies linked underline and plain NONE, checks explicit NONE, and preserves an owning consumer copy edit and underline through two zero-create builds. These are offline renderer and lifecycle checks. The actual native plain title pointing at the linked style is a separate unresolved association gap; this correction does not explain or accept it.

## Native-first verification

A repeated baseline can preserve a mistake. Before accepting modes or repeat lifecycle, compare initial managed master TEXT to the source: exact source ownership key and copy, expected style ownership ID, node decoration, and every full contiguous UTF-16 styled range's style, decoration and copy. For direct template application, distinguish its explicitly detached style contract from normal attached styles. Rich runs need their own complete style, paint, URL and range comparison. Foundation presence or matching font names do not substitute for this check.

Native TEXT font-family bindings are arrays. Validate every entry and all applicable mode/alias terminals, while style bindings remain singleton aliases. Load actual concrete fonts in each operation and recheck ownership, true main links, page and assets after awaits. Missing fonts and late drift must refuse before setters.

Record mutation attempts before setters. Preserve full created, mutated and affected IDs, before/after mode maps and explicit restoration status even if result encoding fails or exceeds the UTF-8 output bound. A bounded `snapshotComplete:false` journal is useful failure evidence, never a complete source or repeat snapshot. The external native rehearsal fixtures cover alias-array second-entry failures, second encoding fallback and cyclic receipt failure.

Initial Book native source checks currently fail both the lost underline and the separately wrong plain style association. Full rendering, source font bytes/glyph metrics, live modes, crop/raster, publication and maintenance remain open until their actual evidence passes. No source recipe or native canvas repair is inferred from this renderer correction.
