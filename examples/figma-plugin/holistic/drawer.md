# Public Drawer source cohort

The public `Drawer.jsx` source has its own start/end/bottom/floating anatomy. The previously added page chrome and search filter drawers are callers with different contents and do not establish this contract.

`buildDrawerRecipes({ root, modes, variables, styles })` in `scripts/figma-drawer-recipes.cjs` returns one source family, `drawer`, with 20 finite variants. Root registration owns the dependency closure. `buildDrawerCheckboxDependency({ root })` exports the separate two-preset dependency synchronously from the guarded donor inventory; it does not mutate caller arrays. The recipes reference the already registered exact `page-chrome-button` 16-preset normal Button clone and an explicit `drawer-checkbox` two-preset context dependency. This selects only the actually used normal Checkbox Default/After/Short Checked and Unchecked anatomy, retaining its styles and properties while replacing the Label paint with the source Drawer-inherited `color/neutral-900`. The normal Checkbox uses `color/text` (neutral-800), so exact unmodified reuse would visibly differ. Other normal Checkbox states are not claimed as Drawer coverage. The source mock explicitly verifies both donor families against the pinned exact normal recipes before building. Existing normal leaf source files and foundational variable/style values are guarded.

## Authored source and finite appearances

Five source stories provide genuine contents:

| Source caller     | Body and footer                                                                                                                                                                    | Initial visible presets                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Default/start     | Publication introduction, Hazard legend, five genuine Checkbox labels with Flood initially checked, local Sendai link; Primary Show 128 results and Secondary Clear filters footer | Open, close hover, keyboard close focus, actual Drought additionally checked |
| End               | Sample report introduction, actual three-pair definition list and local country-profile link, no footer                                                                            | Open                                                                         |
| Bottom            | Actual publication body and action footer; body has its own `overflow-y:auto`                                                                                                      | Open at source scrollTop 0 and actual scrolled end                           |
| Floating panel    | Non-modal Map layers introduction, Layers legend, three genuine Checkbox labels with Flood extent initially checked; no footer or backdrop                                         | Open and actual Population density additionally checked                      |
| Vanilla lifecycle | Actual independently enhanced non-modal SSR panel: Map layers, introduction and local About these layers link                                                                      | Open                                                                         |

Every preset has explicit 390px and 1164px viewport widths and a 1000px source viewport height. All five brands were captured. The source archive contains 200 cases: 100 drawable cases and 100 initial/restored closed references. Closed edge drawers have hidden visibility and floating panels have `display:none`; these references are retained as evidence, without fabricating visible closed panels.

The Floating selected record checks the initially unchecked Population density control; Flood extent remains checked. The initial idempotent pilot is preserved externally and is excluded from the final archive.

## Source allocations and dependencies

The visible source is projected as a transparent finite viewport with the actual optional black 50% modal backdrop and actual positioned panel. Source panel/header/body/footer boxes, overflowing body content and scrolled offsets are recorded independently for every brand. The owning body clips its actual editable content subtree. Start and End panels are source 320px wide and viewport-height tall; Bottom is source 320px high and viewport-width wide. Floating size and placement use the actual source boxes, including the vanilla explicit 3rem start inset.

The close control uses the actual standalone ghost button, 28px square, with the repository's actual 18px CSS SVG close mask. It has its own source neutral rest/hover paints and focus ring. The source computed span family is FontAwesome, but it renders a CSS mask with no text glyph; the recipe emits the exact vector paths and no guessed font character. This control is not substituted with the normal filled Button.

Checkbox source checks guard the actual 24px controls, 2px border, 40px row minimum, normal radius, 7px label insets and checked/rest paints before building the source contextual Checkbox instances with the distinct inherited Label paint. The footer's normal Button reuse guards actual font, line-height, source padding, border/radius and paints across all brands. Labels are real owning instance overrides. A consumer edit targets the actual nested owning component, never a same-valued property on a different master.

Whole logical text stays editable at the actual allocated content capacity. Fixed absolute FRAME slots contain supported nonabsolute HUG TEXT; unsupported absolute HUG TEXT is not emitted. Plain source local anchors keep actual href metadata and source underline/offset, without invented absolute destinations. Source dictionaries are style-interned losslessly, and every original raw file SHA256 is retained. The captured source font requests and exact previously pinned Roboto Regular/Bold and Roboto Condensed Bold bytes are guarded. Requested CSS Button weight600 uses the existing normal Button Bold700 source candidate; native font-file/glyph equivalence is a separate gate.

## Captured helper and native capacity boundary

The helper values are immutable captured-allocation/paint profile candidates. Equal geometry profiles are interned for this finite source model; they are not accepted mutable semantic maintenance tokens. Authored surface, structural-border, inherited text, interactive link and close-mask token aliases are explicit and verified across all five brands; no public colour alias is selected merely because its current RGB equals another role. The Button dependency retains its exact public aliases. The contextual Checkbox preserves all donor anatomy and text style, with its explicit source-proven Label-paint difference; source fields are checked before build.

The complete catalogue requires a reviewed native capacity/collection architecture. Passing this isolated source cohort does not accept whole-library capacity, helper publication ownership, arbitrary mode propagation or mutable helper edits. The canonical token/style maintenance DTO is unchanged.

## Verification and limits

The dedicated `dev/mock-drawer.cjs` uses the actual importer/builder and the observed native text-default fixture. It checks source widths/heights and signed child positions, actual nested main-component links/labels, opacity percentage conversion, effects, owning heading and nested Checkbox/Button consumer edits, nonempty repeated geometry/default/paint/style snapshots and two zero-create repeats. The mock explicitly models displayed consumer text from the actual owning instance property reference; its minimal native-node mock stores overrides without automatically exposing them through the TEXT getter. This is a bounded property-display model, not native glyph/render evidence. The exact bounded SVG mock models the source mask viewport and strokes; it does not simulate path pixels. Helper publication is staged, with caller arrays unchanged on source/font/type/kind collisions or later refusal.

Native Figma rendering, matched font bytes/baselines, arbitrary edited wrapping, responsive sizes and runtime modal behaviour remain open. The recorded bottom scroll-end is static source positioning, not native scrolling. Focus trap, Escape precedence, focus return, DOM inertness, sanitization, hydration lifecycle, translation, source RTL edge swapping and trigger/controller behaviour belong to the actual source runtime and are not accepted by offline appearance tests. The source trigger outside the overlay is not recreated as a fake controller.

The browser UA FIELDSET uses groove borders and a legend notch. The current vector projection retains the captured owning box, edge paint and width as an explicit solid border candidate. UA groove shading, the actual legend notch and its paint origin remain unresolved native raster fidelity work. This does not imply complete UA fieldset pixel equivalence. Inline link linebox placement, Checkbox source SVG tiling/clipped corners, close mask scaling and focus ring rounded corners likewise need native rendering comparison.

No installation, canonical library change, recovery rebuild, publication or human handoff acceptance is inferred. This is a source-only cohort.

The pre-context candidate and donor mismatch are preserved externally under `/tmp/mangrove-drawer-pre-context-checkbox-20261006`. The scoped dependency is a distinct source master, without changes to the normal Checkbox family or published library.
