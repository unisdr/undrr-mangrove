# Legend source cohort

`buildLegendRecipes({root, modes, variables, styles})` returns one source-only
`legend` family with ten finite variants. This cohort uses the actual current
Legend JSX, stylesheet and five authored stories. It does not change the normal
export, published library or historical 98-unit classification.

| Preset             | Source viewports | Source appearance                                                       |
| ------------------ | ---------------- | ----------------------------------------------------------------------- |
| Continuous         | 390, 1164        | PGA title, five-colour horizontal ramp, three ticks                     |
| Categorical        | 390, 1164        | Three circular swatches, labels and values in the authored wrapping row |
| Stepped            | 390, 1164        | Ten actual temperature colours, source end radii and three ticks        |
| VerticalContinuous | 390, 1164        | Reversed vertical ramp and source tick/title allocations                |
| CategoricalGrid    | 390, 1164        | Source auto-fill grid columns and aligned values                        |

Fifty actual Chromium captures cover these presets, both widths and all five
brands. The source title uses Roboto Condensed 16px Bold with inherited 24px
line height. Labels and values use 12.5px with inherited 24px line height.
The value's authored CSS weight 600 resolves through the bundled Bold 700 face
as an explicit native font candidate. Exact existing font bytes and source font
declarations are guarded; provenance remains in the existing ContentHub font
archive and its Apache licence record. Actual browser font requests are retained.

Frames retain observed source allocations and signed offsets. Editable TEXT
keeps each complete logical source label at its owning element's capacity;
there are no separate per-line text properties. Native ELLIPSE swatches and
ten stepped FRAME paints retain actual colours. The source custom ramps use
ordered variable-bound colour stops in native gradient FRAME primitives.
Gradient direction, interpolation and radius raster parity for this cohort
remain unverified in native Figma.

The captured source has visible layout edge cases. At 390, the continuous last
tick `> 1000` wraps to 48px inside a 24px ticks wrapper, while the root remains
90px high. The vertical title element stretches to the 200px column height;
its text begins at the top. Its first tick also wraps. The DTO preserves these
initial allocations and allows overflow. It does not substitute an intended
layout or claim portable CSS anchoring after a label edit.

The dedicated harness uses the actual importer and builder with the documented
offline environment. It checks all five modes, every fixed primitive allocation
and signed position, source master copy and property defaults, solid paints,
gradient stop aliases/matrices, two nonempty exact geometry/property/paint
snapshots with zero creates, and a consumer title edit through its owning TEXT
property reference. Displayed consumer inheritance is explicitly modeled in
the mock. It tests staged caller-array preservation on type, style-kind and
foundation refusal, source/font/artifact byte changes, and missing-font refusal
before permanent scene/style writes. This evidence supports the source DTO and
mock lifecycle; it does not prove native text or rendered pixels.

Source group/list semantics and sr-only step labels remain source metadata.
RTL, arbitrary custom ramps/items/ticks, vertical stepped and other unauthored
prop combinations remain separate source coverage. Keyboard/chart behavior,
native font matching, live mode visual parity, arbitrary responsive wrapping,
edited tick positioning, ordinary plugin recovery and library publication remain
open. The component excludes the Storybook page's outer 16px margin.

Evidence lives in `assets/legend/`: executed capture script, deduplicated source
footprints, exact generated CSS archives, selected foundation contract and
hash-pinned provenance. Raw captures and initial alias diagnostic records are
preserved at `/tmp/mangrove-legend-source-20261006`. The corrected alias probe
uses the actual `--mg-control-border` name and all fifty fresh captures.
