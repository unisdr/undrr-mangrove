# Search control source candidates

`buildSearchControlRecipes({root,modes,variables,styles})` in
`scripts/figma-search-control-recipes.cjs` returns four internal source families
with 15 finite candidates. It uses the guarded search fixture API and current
JSX, SCSS, foundation, Normalize and active Roboto font declarations. It adds only
private draft roles/styles to the supplied document; normal exporter, runtime and
source components are unchanged by this recipe module.

| Family                | Finite states                                                                                                            | Scope                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| search-form           | Empty, Query, QueryLoading                                                                                               | 640px source form, actual primary submit, fixed source clear action, exact search/close mask SVG assets. Loading preserves icon and label.                              |
| search-select         | SinglePlaceholderClosed, SingleSelectedClosed, MultipleSelectedClosed, SingleOpen, MultipleOpen, SearchOpen, SearchEmpty | Actual custom mg-select, 280px trigger and positioned option panel, radio/check indicators, source sort/type options, counts and nine-plus-option search.               |
| search-active-filters | Single, ORPair, ANDPair                                                                                                  | Own source chips inside their list groups, multiplication remove glyph, uppercase tracked AND connector, source prefix and conditional Clear all. 640px finite wrapper. |
| search-facet-operator | Any, All                                                                                                                 | Actual two-selected-value English operator labels/hints, finite 280px source wrapping.                                                                                  |

No native Select, normal Chips or generic Button instance replaces a mismatched
source control. The SearchForm submit is drawn from its actual local source
contract, including FormAction's overlapping border and asymmetric corners.
SearchEmpty uses the facet-provided source label `No matches found`. Hazard
AND probes use unresolved numeric source IDs1/2 with source taxonomy fallback
labels; they do not invent named hazard data or assert live endpoint content.

## Evidence and limitations

The dedicated `dev/mock-search-controls.cjs` harness builds all 15 source
candidates in all five modes, runs two ordinary zero-create repeats, compares
importer-owned identities and retains edits to every supported consumer TEXT
property. The full builder now wires the square SVG sizing helper, checks every
source mode and checks source-derived ratios before native API mutations. It checks deterministic role/style
upserts, unique explicit anatomy IDs, nonempty source text, derived icon sizing,
wrong typed/cyclic roles, foreign style identity, changed operator font geometry,
source drift and missing fonts before node/style mutations. The precise SVG
fixture intercepts only the emitted bounded assets and delegates unmatched SVGs.
It supplies no general fake SVG support or path rasterization evidence.

SearchForm's three source candidates use the square SVG sizing
capability. Their actual search icon is 1em:14px in four brands,18px in MCR.
`svg.sizing.size` aliases the button font-size role; the stroke role derives
exactly `2 * size / 24`. The source mask viewBox is24 and uses uniform stroke2.
A fixed14px SVG inside an18px wrapper is not admitted. These three candidates now pass the full builder API harness. The complete SearchForm native scene, pixels and ordinary plugin recovery remain separate acceptance gates. The strict ownership ledger refuses existing managed SVG geometry,
binding or constraint edits instead of silently erasing them.

`kit-svg-sizing.js` provides pure source/native preflight and apply functions for
uniform unfilled square SVGs. It binds frame width/height, assigns native SCALE
constraints to descendants and binds source-derived stroke width. Mask, transform,
non-square, mixed-width, nonblack or filled artwork are refused. Native
preflight also refuses nonfinite geometry, masks/effects and visible frame backgrounds. Its only imported FRAME fill exception is the exact hidden native-default white SOLID paint, with opacity1, NORMAL blend and no binding. VECTOR fills remain refused. Source stroke formulas remain exact doubles; native FLOAT values and vector stroke weights accept only that exact result or its exact IEEE754 float32 representation, never a wider epsilon. Its dedicated mock tests
source-derived all-five values and an explicitly modeled linked-mode transition;
the isolated native helper experiment now also passed two zero-create helper repeats and a live14 to18 to14 mode rehearsal. Raw projected geometry, width/height and stroke/color bindings, SCALE constraints and explicit modes repeated exactly, and the recorded projection restored exactly. In MCR the SVG was already18px with1.5px vector strokes before another helper apply, so the response came from native mode bindings. The19073-byte receipt is external `/tmp/mangrove-svg-native-repeat-20261006-v8-compact-receipt.json`. Repeated snapshots omit paint arrays and vectorPaths; they do not establish full path/pixel equality, full SearchForm, ordinary native plugin rebuilds or publication acceptance. Existing59-node geometry/mode equality is reported through empty difference rows rather than duplicated after snapshots.

The scoped SearchForm connector compilation currently exceeds the unchanged
50000-byte transport limit in all five brands, at50830 to50892 bytes after the
necessary source and ownership guards. No cloud write or native acceptance is
claimed. Ten normal unsized compiler comparisons remain byte-identical in the
shared integration evidence; this is a regression check, not a transport waiver.

Source browser observations use actual source React SSR markup and current
Storybook6121 theme CSS in an independent browser session. Dropdown open state
is explicitly injected into the source renderer's local hooks; its invisible
portal backdrop is omitted from the static capture. This does not test keyboard,
portal/backdrop behavior or opening through React events. Captures wait for fonts
and the source animation to settle. The final 75 captures, consisting of all
15 finite states across five brands, are saved in
`/tmp/mangrove-search-controls-source-20261005` with their source fixture and
measurement scripts. These external observations are source evidence, not native
Figma equivalence checks.

Observed geometry includes46px UNDRR forms,52px MCR form/submit with its input
remaining46px,36px clear action,44px custom triggers,40px option rows,
40.390625px active filter wrappers and67px wrapped operator blocks. The operator
source wraps both its prefix and options over two lines at280px, so single-line
substitutes are invalid. Its fractional preset widths come from the measured
source fixture and are guarded by unchanged source and font-size200=12.5px.
They do not establish editable multiline/native font geometry.

Active source Roboto imports declare Medium500 and Black900, used for the prefix
and remove glyph. Requested600 uses Bold700 as an explicit matching inference.
Font declaration and requested computed weight do not prove a particular native
font file. Exact native/browser font matching, paints, borders/shadows, SVG
bounds, edited multiline geometry and responsive wrapping remain open.

Open dropdowns preserve the source44px flow height with an overflowing positioned
panel. They must not be silently changed to a normal tall flow block. Native
catalogue visual footprint/overlap handling, scrolling, portals/backdrop, focus,
keyboard, network/filter/sort dispatch, localization/RTL and arbitrary responsive
geometry are separate acceptance work. These source candidates do not complete
the full widget, page compositions, library integration or publication.

## Source default contexts

The catalogue scan found differing defaults under shared property names in these source families. This is a structural risk informed by the observed native Search result master setter behavior, not a claim that all15 controls were executed natively. The source contracts now give stable authored-state context to the nine differing presentation fields: Form Query; Select Selection label, Option0/1/2 and Search query; ActiveFilters Filter0/1; and FacetOperator Hint. Other same-default properties keep their existing shared names. An unscoped field with differing defaults refuses recipe generation so a new context decision is explicit. Names use authored state IDs, never text-content hashes; anatomy, SVG, variant and token identities are unchanged.

The dedicated test uses the exported local observed-native default setter fixture. It checks each master's source characters and actual referenced set default across all five brands, exact property snapshots on two zero-create repeats, and edited instance fields selected from that actual instance's references. Linked displayed TEXT is modeled through those references. A deliberate legacy Empty/Query fixture reproduces the default corruption after a repeat. This establishes the corrected source contract and regression coverage. Native control execution, existing unused property cleanup, published consumer migration, state-switch copy retention and actual source font/pixel/reflow behavior remain separate gates. Full widget composition must consume the context names from the actual dependency tree rather than assume generic property names.
