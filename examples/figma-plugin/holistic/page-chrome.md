# Authored page chrome source cohorts

`buildPageChromeRecipes({root,modes,variables,styles})` in
`scripts/figma-page-chrome-recipes.cjs` returns the isolated `page-chrome` family.
Its first cohort contains six real closed English `UndrrChrome` fixtures at
viewport widths390,899,900,901,1164 and1440. It has not been added to the normal
exporter or maintenance catalogue. These candidates supply actual source chrome
for page compositions; they do not complete the MegaMenu family or holistic goal.

## Source contract

The source wrapper renders PageHeader with no account, its English white UNDRR
wordmark, and the four authored language values Arabic, English, French and
Spanish. Its default language control is an invisible native select over the
visible language icon. The fixture represents that visible closed control only.
It does not invent a visible option list or substitute the general Select family.
The four MegaMenu labels and their URLs derive the authored English wrapper:
About UNDRR, Our work, Implementing the Sendai Framework, and News and media.
Each title is editable through its own stable TEXT property.

The decoration stripe has four equal source Sendai colors and7px height. The
source toolbar background retains neutral700, the exact427x96 PNG at its natural
size, centered without repetition, and the white16percent1px bottom border. The
raster is a positioned leaf frame with the original aspect ratio inside a clipped
toolbar, rather than an image stretched over the entire toolbar. Native rendering
of alpha, centering and clipping remains a visual acceptance gate.

The source English logo is fetched from the exact PageHeader URL. The archived
SVG viewBox is442x63.9. At widths through900 the source uses a112x30 left-anchored
cover crop. At901 through1164 it uses180x48. Above1164 its declared324x47 element
resolves through `block-size:auto` to the browser's measured324x46.828125 layout.
The recipe keeps the SVG artwork's ideal aspect ratio and uses a separate clipped
viewport. It does not nonuniformly stretch source paths to fit browser layout
quantization. The sole SVG metadata normalization removes `xml:space="preserve"`
from path-only artwork because the existing renderer's strict attribute subset
excludes it. Original bytes, source URL, hash and provenance remain archived.

Menu and language icons use the exact generated Lucide SVG masks from
`_icon-definitions.scss`. The source elements' inherited computed FontAwesome
family does not mean their visible artwork is a font glyph. Closed language
artwork is19.2px, deriving1.2 times the16px body role; the mobile menu icon is20px.
The finite contract refuses font or spacing changes requiring remeasurement.
Pseudo-element baseline placement and rendered path bounds require native/browser
visual verification; element bounding boxes alone do not prove artwork pixels.

MegaMenu switches to its desktop JavaScript/CSS interpretation at900px. The
PageHeader logo tablet crop still applies through900px, so900 is an explicit
mixed boundary fixture. Mobile scenes preserve the source's clipped horizontal
navigation hint,40px leading space and full-strip transparent hamburger button.
Desktop has no hamburger. The navigation title style is actual UI Roboto
Condensed Bold700,16px below900 and18px from900, with the source18px normalized
line height and15px padding. Active imports and the required Bold declaration are
source guarded. Every paint aliases its source role in all five brands; source
Sendai constants have dedicated scoped roles. Changing viewport is a finite
variant selection, not an assertion of arbitrary responsive behavior.

## Evidence

The current source Storybook's actual hydrated ArticleStory no-hero-image story
was measured after fonts were ready and animations settled in an independent
browser session. The30 observations cover six widths across five brands. Raw
captures, font inventories, measurement script and downloaded source assets are
external at `/tmp/mangrove-page-chrome-source`; the bounded source footprints and
asset provenance are retained in `holistic/assets/page-chrome`.

Source chrome total height is118px through900,131px at901 and1164, and129.828125px
at1440. The typography and bounded geometry are equal across the five measured
brands, while interactive colors follow each brand. These are observations of
rendered source, not native component acceptance.

`dev/mock-page-chrome.cjs` uses the actual importer and builder for each brand,
then two ordinary zero-create repeats. It checks stable owned anatomy IDs,
consumer main-component links and edited navigation content. It refuses changed
measured font geometry, foreign text-style identity, wrapper/font-source drift
and missing fonts before node/style changes. Its SVG fixture intercepts only the
exact bounded source markup and delegates unknown markup. Its vector API fixture
does not rasterize paths or prove native SVG bounds, crop fidelity, text widths,
font face matching or live mode behavior.

## Remaining source and native work

The next genuine cohorts are the authored desktop flyouts, first mobile drawer
level and selected-section mobile level. Desktop includes banner heading,
authored paragraph, actual primary CTA and four authored links; larger general
MegaMenu contracts add nested categories and multicolumn link flow. Mobile has its
own backdrop, section list, overview/back/close actions and the active progressive fixed white surface. Its
height is automatic with a400px minimum capped by90dvh and700px maximum capped
by90dvh; the older80vh blue sidebar rules are overridden. They
must derive those source structures rather than reuse a generic Drawer or blank
panel. Native open-state footprints, layering, scroll, viewport-height presets
and edited nested copy need separate evidence.

Full PageHeader also needs account visibility, decoration-only, inline-language
links and locale logo fixtures. Arabic/RTL and translated wordmarks must use
actual authored assets and supported font inventories. Focus rings, invisible
native select behavior, pointer/keyboard disclosure, portal/backdrop semantics,
SSR-to-hydrated transition, reduced motion and script-free fallbacks remain
interaction boundaries. The closed cohort does not mark these gates passed.

### Authored open navigation cohort

`buildPageChromeOpenRecipes` is a separate synchronous source factory. It returns `page-chrome-desktop-panel` with twelve complete flyouts for all four authored sections at901/1164/1440, `page-chrome-mobile` with ten progressive AllSections plus four selected-section views at390/899, and `page-chrome-capped-action` with two Sendai CTA presets at901/1164. The closed six-variant factory retains its original return shape. Unwrapped desktop actions reference the exact normal `button` dependency cloned as `page-chrome-button`, using Primary/Filled/Default with each authored label. Capped Sendai actions use the dedicated source family. This is the source `mg-button`, not an editorial CTA substitute.

The archived `open-source-footprints.json` contains110 actual hydrated source scenes across five themes. Captures waited for fonts, transitions and two animation frames. Every scene used the English no-hero-image ArticleStory context and viewportheight1000. Source desktop flyouts have350px minimum height and sit after the existing closed chrome flow at131px or129.828125px. Their one/two/three-column CSS balancing is recorded explicitly with all four authored links. Source banner paragraph wrapping at901 is two lines. MCR uses its actual52px source action and expanded174/198px banner, while four other brands use36px actions. Delta retains20px inline action padding.

The active mobile class is `mg-mega-mobile-sidebar--progressive`. It overrides the historical blue80vh sidebar with a fixed white surface, min-height400, max-height700 at this viewport. The first level is400px; About and Sendai are450.75px at390, while News requires474.75px because its intro wraps. Each selected scene retains its own measured surface extent. Recipes retain the real backdrop, sticky header allocation, close, back arrow, heading, four links or drill-in controls, exact18px chevrons and authored intro. The surface is a separate overlay composition. Its height must not expand the header or replace the underlying page with a blank box.

Source paints bind to matching semantic token roles; measured CSS8bit colors are checked against the existing exporter token representation. Actual geometry may vary by mode where source Button metrics do, using dedicated FLOAT roles. Stable anatomy IDs are independent of display labels. Editable consumer text remains supported. Source requested600 for drill-in captions and the source Button resolves to the bundled Bold700 face as a browser matching inference. Loaded-face inventory and computed weights are archived, but these do not prove native font pixels.

The dedicated mock runs the actual importer and builder for all five brands, checks every fixed frame/SVG allocation and source CTA/banner dimensions, verifies the real Button main link, and performs two zero-create repeats with edited mobile heading retention and exact recorded geometry. Missing fonts, foreign style identity, source drift and missing dependency refuse before scene changes. Offline SVG fixtures intercept only the exact source assets and do not rasterize them.

All four authored menu sections and their sixteen source links are included. General nested MegaMenu stories, custom caller banner HTML, CTA-only sections, overflow states, locale/RTL, safe-area environments and arbitrary responsive widths remain separate work. Keyboard focus containment, hover/click transitions, sticky scrolling, URLs, motion, native underline placement, imported artwork pixels, live mode behavior and publication acceptance are not established by these source recipes or mocks.

The Sendai banner has a real constrained action that the ordinary HUG Label Button cannot reproduce. At901 all five brands wrap the label into two lines inside248.328125px: four source actions are50px tall and MCR is70px. At1164 only MCR wraps, inside335.109375px with70px height; at1440 all source actions are unwrapped. The two `page-chrome-capped-action` presets retain actual mode-specific captured width/height and use an editable FILL Label with the existing source Button font, padding, border, radius and paints. These finite scene allocations are source-derived candidates. They do not claim arbitrary edit reflow or identical native typesetting. Source face, line-height, padding, border and paint guards refuse inconsistent inputs. Native line breaks remain a separate comparison gate.

### Source default contexts

Desktop and mobile Heading, Summary and Item 1 through Item 4 properties now use their existing authored variant ID as a stable context prefix. These are the six fields with differing presentation defaults. Closed navigation, capped CTA Label and other equal-default fields retain their shared property names. Anatomy, variants, dependency identities and source allocations are unchanged. New differing defaults on unscoped fields fail closed.

The dedicated offline harness models the observed native set-wide TEXT default setter, verifies master copy and set defaults across all five brands and two zero-create repeats, and edits the actual mobile master's linked Heading property. A deliberate restoration of generic property names reproduces copy corruption. This is source and modeled lifecycle evidence. Native open Chrome acceptance and migration of existing consumer overrides are unverified. Old generic definitions are not pruned.
