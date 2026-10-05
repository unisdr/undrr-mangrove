# Source-only component drafts

On 5 October 2026, a bounded Range, Tag and Notice batch was requested while
desktop interaction was unavailable. These recipes and mock tests prepare later
construction work. They do not add components to the published library, normal
construction catalogue or reduced maintenance merge cohort.

The subsequent source-only batch adds Breadcrumbs, Skip Link and Highlight Box.
Both batches are preparation for separate native experiments; none is installed
in a Figma file by these commands.

| Family        | Prepared variants                                                                                         | Deliberately excluded                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Range         | Four continuous midpoint presets: 240px and 390px, Default and Disabled                                   | Stepped, hover, focus, editable values and arbitrary sizing                                                  |
| Tag           | Five static tones: Default, Secondary, Outline, Accent and Subtle; editable Label                         | Linked interaction, code badges, containers, RTL and wrapping                                                |
| Notice        | Four standard tones: Info, Warning, Negative and Positive; editable Title and Body, optional default icon | Actions, rich content, dismissal, overlay, prominent and compact layouts                                     |
| Breadcrumbs   | Two short LTR four-item trails, Default and White; editable three links and current label                 | Wrapping, RTL, hover, focus and live navigation                                                              |
| Skip Link     | One visible Focused preset at 390px; editable Label                                                       | Hidden default appearance, keyboard behaviour, navigation, arbitrary viewport widths, RTL and forced colours |
| Highlight Box | Three plain-title/body presets: Default, Primary and Secondary                                            | Host CSS overrides, rich content, media, centered and floating layouts                                       |

The recipes extract or guard current source contracts, add isolated helper
variables/styles and use stable anatomy IDs. Tests verify derivations across all
five brands. They execute the existing importer and builder for Range, Tag,
Breadcrumbs and Highlight Box in all five brands, and for Notice and Skip Link in
UNDRR. They check bindings, repeated identity
reuse, supported overrides and refusal of source drift.
Passing mocks do not establish browser/native layout, raster appearance or
publication and consumer uptake.

Range widths and vertical drawing placement are candidate scaffold geometry.
Tag's CSS weight 500 to Condensed Regular 400 and Notice's CSS weight 600 to Bold
700 are provisional font matching inferences, pending browser/native comparison.
Notice icon dimensions are source-derived numeric viewport values because the
existing SVG renderer does not support those live bindings; regenerate after a
relevant token change. Exact SVG markup tests do not verify native path bounds.

Breadcrumb chevrons translate CSS border geometry to a bounded vector, with
candidate baseline placement. Current-page CSS weight 600 to Bold 700 remains
provisional. Skip Link represents the visible appearance only; it does not make
Figma keyboard navigation behave like the browser. Highlight Box uses the source
fallback colours, including legacy Sendai purple, rather than substituting
current brand action roles. Its inherited heading face, candidate paragraph
spacing and native inset-shadow rendering need browser/native comparison.

## Generate and verify a packet

From the repository root, choose a new output location outside the repository:

```sh
node scripts/build-figma-component-drafts.cjs --output /tmp/mangrove-component-drafts.json
node scripts/build-figma-component-drafts.cjs --check /tmp/mangrove-component-drafts.json
node examples/figma-plugin/dev/mock-component-drafts.cjs
node examples/figma-plugin/dev/mock-range.cjs
node examples/figma-plugin/dev/mock-tag.cjs
node examples/figma-plugin/dev/mock-notice.cjs
node examples/figma-plugin/dev/mock-breadcrumbs.cjs
node examples/figma-plugin/dev/mock-skip-link.cjs
node examples/figma-plugin/dev/mock-highlight-box.cjs
```

The exporter refuses to overwrite an existing packet. Its provenance records the
source revision, relevant working changes and foundation/catalogue fingerprints.
The packet intentionally lacks the top-level fields accepted by the plugin
importer. **Do not import it into Figma.** It is a source review artifact, not a
replacement for `mangrove-variables.json` or a finished component library.

## Later acceptance

After desktop interaction is restored, compare the bounded presets with rendered
source stories and native fonts. Prepare a separately reviewed import plan and
use a separate unpublished experiment file for construction. Verify two ordinary
zero-create repeats and supported consumer edits before considering integration
or selective publication. Preserve canonical identities and existing deliveries.

The maintenance recovery trace, deliberately changed text/effect publication,
composite publication, human novice handoff and reduced merge acceptance remain
separate open gates. This batch closes none of them.
