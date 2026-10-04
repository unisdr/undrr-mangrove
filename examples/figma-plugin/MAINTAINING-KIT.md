# Maintaining the Mangrove Figma kit

This runbook covers source changes, local verification and updates to the canonical Figma kit. Start with [README.md](README.md) for installation and access, [LEARNINGS.md](LEARNINGS.md) for observed behaviour, and [FIGMA-KIT-BRIEF.md](FIGMA-KIT-BRIEF.md) for the component scope. This remains an exploratory kit.

The [architecture review](ARCHITECTURE-REVIEW.md) records the current composition, responsiveness, identity and publication gates. Check affected findings when adding a composed component.

## Where changes belong

| File or source                                                                                                                                                                            | Responsibility                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `tokens/*.yaml` and component JSX/SCSS                                                                                                                                                    | Mangrove's intended values, anatomy, states and cascade                                    |
| `scripts/build-tokens.cjs`                                                                                                                                                                | Shared token loading, layers, merging and resolution                                       |
| `scripts/build-figma-tokens.cjs`                                                                                                                                                          | Figma variable conversion, foundation styles, aliases and skipped-token reasons            |
| `scripts/figma-component-recipes.cjs`                                                                                                                                                     | Source guards, derived helpers, component typography, bounded variants and anatomy recipes |
| `scripts/figma-cta-recipes.cjs`, `scripts/figma-choice-recipes.cjs`, `scripts/figma-checkbox-recipes.cjs` `scripts/figma-form-summary-recipes.cjs` and `scripts/figma-switch-recipes.cjs` | Source-backed composition, choice geometry, source SVGs and error-summary typography       |
| `examples/figma-plugin/kit-builder.js`                                                                                                                                                    | Generic native construction, bindings, dependencies, identity and review specimens         |
| `examples/figma-plugin/code.js`                                                                                                                                                           | Import preflight, variable/style updates and message handling                              |
| `examples/figma-plugin/kit-identity.js`                                                                                                                                                   | Shared metadata and desktop legacy identity reads                                          |
| `examples/figma-plugin/kit-inspection.js`                                                                                                                                                 | Read-only inspection, font diagnostics, focus diagnostics and PNG export                   |
| `examples/figma-plugin/kit-acceptance.js`                                                                                                                                                 | Temporary edited-instance probes, persisted baseline comparison and exact-owned cleanup    |
| `examples/figma-plugin/ui.html`                                                                                                                                                           | Selection, explicit actions and report downloads                                           |
| `scripts/build-figma-connector.cjs`                                                                                                                                                       | Bounded connector scripts using the same runtime and recipes                               |

`mangrove-variables.json` and `build/main.js` are generated, ignored output. Regenerate them after a source or runtime change. Add source-derived design values to the exporter or recipes; keep construction logic generic.

## Add a component or change an existing recipe

1. Read the current JSX, component SCSS, inherited rules, token roles and rendered story together. Measure default, hover, focus, disabled and invalid states where they exist. Record selector specificity, font weight and line height, alpha, border contribution and narrow behaviour. A matching colour from another role is insufficient evidence for a binding.
2. Add the relevant paths to the recipes' `sources` map. Use `source()` or `reference()` guards for the selectors or expressions the recipe depends on. A changed expression should produce an actionable build failure. Extend the supported expression grammar deliberately when the source requires it.
3. Reuse exported semantic roles first. Add a helper only for a source literal, calculation or measured browser baseline that existing roles cannot represent. Give it a description, source reference, appropriate scope and WEB syntax where a truthful CSS expression exists. Resolve aliases for every brand. Document browser-dependent values, such as the measured black field-text helper.
4. Add component text or effect styles to the generated `styles` section. Specify exact font family/style and explicit line-height units where the component needs them. The importer loads fonts before writing; missing fonts remain reported failures.
5. Define the smallest useful variant inventory. Use a stable family `id`, stable variant IDs and clear variant axes. Current recipe nodes support `FRAME`, `TEXT`, `INSTANCE`, leaf `ELLIPSE` and a bounded `SVG` viewport; variant roots are `FRAME` recipes that become native components. A new primitive type needs runtime support and preflight coverage before a recipe can use it.
6. Use nested `INSTANCE` recipes for existing component families. Set `family` and a matching `variant` selector; dependencies are built first. Declare `expose: true` only for primary nested instances whose properties should be available to consumers. Use `textProperty` and family `optionalProperties` for editable text and boolean visibility.
7. Add the family to the exported `families` list. For a composed long-label specimen, set `review.longLabelTarget` to an exact child-name path ending at a nested instance with a Label property. Each path segment must match uniquely. Horizontal Tabs retain their source nowrap behaviour.
8. Add meaningful mock checks for the new risk: bindings and resolved values, dependency failure, repeat identity, override preservation, finite-width layout or a rejected migration. Render the new family in Figma and compare it with the measured browser fixture before expanding the scope.

The default review includes variant states, a long label and a narrow consumer. Main components remain separate from `Mangrove / Review`. Diagnostics have a separate owned frame and are construction aids.

### Add a targeted review specimen

Use `family.review.specimens` to exercise content or visibility beyond the default Label examples. It accepts at most eight extra entries per family:

```js
review: {
  specimens: [
    {
      id: 'multiline',
      name: 'Multiline value, 240px, overflow specimen',
      variant: { State: 'Filled' },
      width: 240,
      properties: {
        Value: 'First line\nSecond line with enough words to wrap\nThird line',
        Required: true,
      },
    },
  ],
}
```

The builder validates this contract before the affected family's style or canvas writes:

- `id` uses lowercase letters, digits and hyphens, begins with a letter or digit, and is unique. It cannot collide with a variant ID, `long-label` or `narrow`.
- `name` is a nonempty string.
- `variant` selects exactly one variant in that family. Include enough axis values to make the match unique.
- `width` is a positive finite number representing the consumer width; the review row adds its own padding.
- `properties` is an object of logical property names declared by the family. TEXT values must be strings and BOOLEAN values must be booleans. Numeric properties, variant-axis overrides and undeclared names are rejected.

Compositions without a meaningful root Label can set `review.genericLabels: false`. Their variant specimens can use a positive `review.width` instead of the default narrow review card. Provide deliberate long and narrow examples rather than inventing a Label property.

Intrinsic controls can opt into `review.preserveVariantSizing: true`. Fresh generic specimens, or an explicit **Refresh bounded review geometry, keeping content**, inherit the actual main component's HUG or fixed width and restore vertical HUG after resizing. Chips uses this to retain short capsules, 240px long presets and measured min-content overflow. Details uses it for explicit390/900/240px source presets. Ordinary repeats preserve consumer sizing and content. Explicitly seeded review examples still use their declared widths. Confirm main, instance and property identities in the native inspection after a refresh.

Native instance recipes can declare `appearance: { fill, stroke, labelFill }` using COLOR variable names for source-defined contextual colours. `labelFill` requires exactly one Label text node in the dependency. Explicit instance `bindings` override only their declared inherited fields. These changes retain native instances and source identity. A changed or removed context override needs a deliberate update check; do not detach actions to bypass the contract. Auto layout accepts `wrap` and `counterGap`. Confirm normal-scale rendering against the source.

TEXT recipes accept `textWrap: 'AUTO'`, `'BALANCE'` or `'PRETTY'`; the builder writes the native `textWrapStyle` property. `DEFAULT` is not a valid value. Wrapping style does not set a finite width or replace HUG/FILL sizing. Source underline uses `textDecoration: 'UNDERLINE'`; `'NONE'` is also supported, and omitted decoration is reset to NONE on owned main text. Load exact fonts before applying text styles, changing characters, alignment, wrapping or decoration. Mixed text requires every current range face; a missing font remains an error. Whole-node underline does not imply rich-text ranges, native links or source navigation. Error-summary link recipes specify the measured Roboto Bold face and source underline; the requested CSS weight 600 is recorded separately from the bundled face. [Native text properties](https://developers.figma.com/docs/plugins/api/TextNode/)

For attributes that editable TEXT properties must inherit, put `textDecoration` and `textWrapStyle` in the exported shared text-style values as well. The importer validates the enums and writes native TextStyle fields after font loading, defaulting omitted values to NONE/AUTO. Form error summary exports UNDERLINE/AUTO on the link style and NONE/BALANCE on its title style. Native review first showed links with NONE despite the node recipe requesting underline. Applying node decoration after property references/layout corrected mains and normal review, while the edited long review still lost underline. Style-level inheritance corrected both ordinary and edited long native examples. Final inspection reads UNDERLINE/AUTO on all link nodes and BALANCE on every title. Keep this bounded evidence separate from font-file, brand/script and wrapped inline-focus acceptance; the cause of the observed resets is unconfirmed. [Native text styles](https://developers.figma.com/docs/plugins/api/TextStyle/)

For coordinated composition examples, `nodes` accepts up to 64 entries with a unique child-name `path` and nested-instance `properties`. Paths cross nested component instances and must resolve uniquely; property names and TEXT/BOOLEAN types are checked against the nested source recipe. Descendant width/height seeds are rejected: actual Figma silently retained nested instance dimensions and bindings despite successful API returns. Put shared column and row geometry on component masters, then select the matching preset. `instanceWidth` can give the root instance an explicit positive size or FLOAT binding independently of the consumer width, preserving measured source overflow. Content seeds apply to fresh specimens; repeat builds preserve edited text. A fixed measured preset does not provide the browser's automatic table algorithm or responsive breakpoint logic.

The explicit review refresh selects the specimen's current master preset and reapplies its root width while keeping content overrides. Save an inspection before refreshing designer-adjusted geometry; Figma's component-swap heuristics still need actual override checks. Real Figma's `resize()` fixes both axes, so a one-axis size change must restore the other axis's FILL/HUG policy. The mock models that side effect and the observed silent rejection on nested INSTANCE dimensions. Desktop checks remain necessary for inherited bindings, swaps and reflow. [Resize behaviour](https://developers.figma.com/docs/plugins/api/properties/nodes-resize/), [Native instance updates](https://developers.figma.com/docs/plugins/api/InstanceNode/), [Wrapping auto layout](https://developers.figma.com/docs/plugins/api/properties/nodes-layoutwrap/)

Properties seed only newly created review instances. Repeat builds preserve designer edits and the existing instance reference; changing a specimen's seed values or variant selector does not reset it. Edit an existing specimen explicitly or plan a reviewed reseed when a new baseline is required. Keep its ID stable for routine updates. Other valid families may still build when one family's specimen preflight fails.

Textarea uses this contract for a multiline Value specimen, rather than changing only its Label. The desktop build on 3 October 2026 created six states and 131 nodes with no reported errors. Inspection measured the narrow control at 240 × 88.099998px and the multiline text at 126px inside its clipped 88.1px frame. The saved screenshot confirmed newline retention, wrapping and clipping, and also showed the known narrow-label overflow. This is bounded evidence for the tested specimen; native scrolling, browser resize behaviour and all-brand or every-width acceptance remain separate work.

### Units and effects

| Value         | Export and runtime rule                                                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Length        | Export supported CSS lengths as numeric pixel values. Check the source conversion; the current expression helper resolves `rem` using 16px.              |
| Font size     | Bind to a FLOAT font-size role. A generic font stack needs an explicit supported Figma face or a documented gap.                                         |
| Line height   | Use Figma `PIXELS`, `PERCENT` or `AUTO` deliberately. CSS unitless 1.15 becomes 115%, while inherited body line height may remain 24px for smaller text. |
| Layer opacity | Figma opacity variables hold percentages, for example 55. The builder prepares the native node value as 0.55 before binding.                             |
| Paint alpha   | Remains a fraction, for example 0.24. A lone colour alias cannot modify its target's alpha.                                                              |
| Shadows/focus | Export effect definitions and their bindings in `styles.effect`. Test ordering and spread on an actual consumer shape.                                   |

The outward focus diagnostic established that the coloured outer effect must precede the neutral separator. Transparent outlined controls use the recipe's `focusRing` contract and native OUTSIDE strokes. Do not add an opaque or nearly transparent fill to make shadow spread appear. The builder binds colour, width and corner-radius roles, but expanded rectangle positions are computed at build time; rebuild and test resizing after an offset change. Inward focus and every consumer shape require their own acceptance.

### Source SVG viewport contract

Use a leaf `SVG` recipe with a stable anatomy ID, `svg: { assetId, markup }` and numeric positive `layout.width`/`height`. The source must have a finite positive `viewBox`, and target sizing must preserve its aspect ratio. Optional `position: { x, y }` supplies absolute placement in an auto-layout parent. Only `opacity` and `visible` bindings are supported; `visibilityProperty` can expose a BOOLEAN. Children, HUG/FILL sizing, live viewport bindings and ordinary frame paint/effect fields are rejected.

The runtime accepts a bounded set of source shapes and attributes, not arbitrary SVG XML or a general asset renderer. It supplies explicit intrinsic dimensions from the viewBox before `createNodeFromSvg`, requires a native FRAME viewport of those dimensions, then uses `rescale` for proportional paths, positions and strokes. A frame `resize` alone would change the viewport without scaling the artwork. Equal-size repeats do not rescale. Wrapper and imported descendant IDs are retained. [Native rescale](https://developers.figma.com/docs/plugins/api/properties/nodes-rescale/)

Original colours remain unchanged unless the recipe explicitly declares `svg.monochrome: { fills: '<COLOR role>', strokes: '<COLOR role>' }` for the intended paint channel. Each declared channel must contain visible SOLID paints of one source colour in both source preflight and the native import. Do not recolour multicolour assets through this contract. Gradients and other unsupported SVG features remain outside the bounded parser. Preserve caps, joins, dash patterns, stroke weights, source opacity and transparent geometry.

Shared `mgSvgAsset` metadata records the exact asset ID, full original markup, content hash, paint policy, native topology and geometry fingerprint. The fingerprint includes imported vector paths, positions, dimensions and stroke geometry. Repeat preflight rejects changed source content, asset identity, paint policy, topology, geometry or viewport aspect ratio. A same-aspect target-size change can rescale the retained tree. A source correction needs an explicit reviewed migration with a backup, actual wrapper/vector ID mapping and consumer-override checks; do not change only the hash or delete/reimport existing descendants to bypass rejection.

Native Checkbox SVG construction succeeded for the source checkmark, including bounded narrow tiles. This does not establish arbitrary icon/logo import, every SVG feature, all-brand paint or changed-source migration. The SVG mock parses bounded fixtures and does not prove general XML/path rendering.

## Preserve identity and plan migrations

Shared metadata uses namespace `orgundrrmangrove`. It stores public source identities; keep account details, credentials and private file identifiers out of it.

| Identity             | Used for                                                                        |
| -------------------- | ------------------------------------------------------------------------------- |
| `mgId`               | Variables                                                                       |
| `mgStyleId`          | Text and effect styles                                                          |
| `mgKitId`            | Owned component sets, variants, anatomy nodes, review specimens and diagnostics |
| `mgKitProperties`    | Mapping logical property names to actual Figma property IDs                     |
| `mgSvgAsset`         | Exact source asset, paint policy and retained native vector topology/geometry   |
| `mgAcceptanceLedger` | Public synthetic probe baseline, exact created IDs and cleanup ownership        |

Variables and styles match identity first, with a compatible unique name fallback. Duplicate collections, ambiguous matches, foreign ownership and incompatible types are rejected. The desktop helper reads legacy private identities and detects conflicts; connector execution uses shared metadata only. A renamed asset carrying only legacy private identity needs desktop migration before connector adoption.

Family and variant IDs must survive ordinary updates. Anatomy IDs currently come from the full path of node names in `identity()`, which overwrites recipe node IDs. Renaming or moving an anatomy node therefore changes its key. Plan that change explicitly rather than treating it as a harmless label edit. The current builder retains obsolete owned children and reports them; it has no general identity-rename or retirement migration engine.

For a variable/style type change, property rename/type change, variant-axis change, or removal:

1. Save a baseline inspection and local backup. Identify affected actual IDs, component property IDs, instances, bindings and overrides.
2. Define the desired mapping from old identities to new ones, including what happens to consumer values. Review that concrete migration before applying it to the canonical file.
3. Keep compatible existing objects and property IDs where possible. Existing property defaults are currently preserved by `ensureProperty()`; editing a recipe default does not update an existing definition automatically.
4. Use a separate, bounded migration when the ordinary importer rejects the change. Do not delete and recreate components to bypass an error.
5. Compare the resulting inspection with the baseline and exercise existing instances. Deleted recipe families or variants are not automatically retired, so inspect the full inventory as well as the selected build report.

Normal rebuilds preserve existing review labels and text formatting. The default-off **Refresh bounded review geometry, keeping content** option refreshes the source preset geometry of selected review specimens, including finite-width Button labels and opt-in intrinsic Chips widths. It preserves the Label value and node IDs. Generated narrow rows provide a 240px consumer plus 8px review padding on each side. Existing Tabs long-label specimens require an explicit nested Label edit or review reseed; the builder does not guess whether an old label is a designer override.

## Verify locally before touching Figma

Run from the repository root:

```sh
yarn build:figma-tokens
npx jest tokens
yarn lint:check
node examples/figma-plugin/dev/mock-figma.cjs
node examples/figma-plugin/dev/mock-kit.cjs
node examples/figma-plugin/dev/mock-ui.cjs
node examples/figma-plugin/dev/mock-choice.cjs
node examples/figma-plugin/dev/mock-review-export.cjs
node examples/figma-plugin/dev/mock-svg.cjs
node examples/figma-plugin/dev/mock-checkbox.cjs
node examples/figma-plugin/dev/mock-form-summary.cjs
node examples/figma-plugin/dev/mock-acceptance.cjs
node examples/figma-plugin/dev/mock-editorial-cta.cjs
node examples/figma-plugin/dev/mock-editorial-contracts.cjs
node examples/figma-plugin/dev/mock-editorial-acceptance.cjs
node examples/figma-plugin/dev/mock-chips.cjs
node examples/figma-plugin/dev/mock-details.cjs
node examples/figma-plugin/dev/mock-select.cjs
node examples/figma-plugin/dev/mock-audit-native-text.cjs
node examples/figma-plugin/dev/mock-connector-scopes.cjs
```

Run `npx prettier --check` with the exact touched files. Run explicit ESLint checks for touched runtime `.js` and mock `.cjs` files when needed to cover paths outside the normal lint script. If the token source test reports stale generated partials, run `node scripts/build-tokens.cjs` and repeat the failing check. Those partials are local build output.

The importer harness covers aliases, modes, preflight failures, identity, style selection, fonts and affected-ID reporting. The kit harness covers native structure, dependencies, bindings, review overrides, scoped font preparation, units, custom specimen validation and connector transport. `dev/mock-ui.cjs` runs the actual UI script against a multi-megabyte inspection fixture and oversized mode/font/error data: it checks bounded displayed summaries, default/opt-in font requests, control recovery and exact full JSON downloads. It does not render a browser or establish native accessibility/dialog recovery. Add assertions for a concrete failure mechanism. Mocks do not establish Figma rendering, cloud synchronisation or paid-plan migration.

If the change also modifies production JSX, SCSS, stories or component metadata, follow [the component review checklist](../../docs/REVIEW-CHECKLIST.md) and [AI coding guidelines](../../docs/AI-CODING-AGENTS.md), including relevant changelog and manifest updates.

## Apply one bounded change in the desktop kit

### Before writing

1. Record the checkout revision (`git rev-parse HEAD`), generated counts and `components.version`. The current recipe schema is version 1; it is not a kit release number.
2. Open the canonical kit and the correct page. Builder ownership is indexed on the current page, while variables and styles are local to the file. Building on another page is not a migration of the existing kit.
3. Check the registered manifest path in **Manage plugins in development**. Remove a stale registration when it points to an old copy. Regenerate output and relaunch the checkout plugin to load changed runtime/UI code.
4. Choose **Inspect kit** with **Check font loading during inspection** left off for the read-only inventory, then save an inspection report and a local `.fig` backup before structural changes. Confirm the download exists. If the file shows a reconnect warning, record cloud synchronisation as unconfirmed and preserve the open file.
5. Record the current brand, selected styles and families, existing property/variant IDs, and any designer overrides used for acceptance.

### Import, build and inspect

1. Choose the current `mangrove-variables.json`. On the one-mode Starter file, select exactly one brand. Keep variable pruning off for routine updates.
2. Choose text foundations and effects, then **Import variables and styles**. Component builds import their required component styles separately. Read the counts, missing fonts and errors; save the complete **operation report** before another operation replaces it.
3. Select the affected family and its required dependencies. Choose **Build selected components**. For repair of an existing narrow Button only, intentionally tick the refresh option. Leave it off for normal updates that must retain formatting overrides.
4. Save the build operation report. Check successful family IDs, created/updated IDs, failures and audit entries. Existing-object failures can retain partial changes; a returned object ID is insufficient evidence that the update succeeded.
5. Run **Inspect kit** with font checks off for the structural comparison. The window shows a bounded inventory, modes, font status and error summary; **Save inspection report** retains the complete JSON. Compare set, variant and property IDs, resolved consumer values, effect bindings, dimensions, exposed nested instances and overrides with the baseline. Use the downloaded report for complete IDs and messages.
6. Select exactly one family and export its scoped family PNG. Use the full review PNG for sheet organisation and, when relevant, export focus diagnostics. Compare default and changed states, long labels, narrow consumers, clipping, alpha composition and focus geometry against the browser fixture.
7. Repeat the same bounded build. An unchanged recipe should create no replacement nodes. Confirm IDs and edited Label values remain stable, then record the evidence and next discrepancy.

Operation reports use fixed filenames for import, component build and focus diagnostics. Rename saved copies with a date and revision so they are not overwritten. Inspection is a separate download. Only one action runs at a time, and a previous operation report remains available during work or after an error. Reports live only for the plugin window's lifetime.

### Check edited native instances

The **Instance override acceptance** section prepares three temporary probes outside main/review: ComboBox Open, checked Default Radio and checked Invalid Radio, using exact existing owned masters. It preflights their actual TEXT/BOOLEAN keys, variant axes and Roboto fonts before creating nodes. Preparation edits root text/visibility, all three exposed option Labels and one direct text-alignment override. It reads the edits back before recording the baseline. The first native run passed 441 assertions, followed by a visual review and cleanup after plugin restart. These three default-UNDRR probes establish bounded edit preservation; they do not establish every family or a published consumer-file update.

1. Save a fresh inspection and backup. Keep the current brand applied and select it in the plugin; preparation does not switch brands.
2. Choose **Prepare override probes**, then **Save operation report**. Retain the complete ledger, root ID, created tree IDs and any errors. The Probe root ID field is filled automatically. A preparation error can leave partial owned evidence; inspect it rather than assuming no nodes were created.
3. Select ComboBox and Radio for an ordinary build. ComboBox option is included as a dependency. Leave review refresh off, choose **Build selected components**, and save its complete report. Do not swap variants, change brands, edit the source or detach probes during this experiment.
4. Choose **Compare after normal build** and save the comparison report. It requires a successful build report covering ComboBox, ComboBox option and Radio, and checks exact main/set IDs, actual suffixed property keys/values, descendant identities, exposure, text, visibility and formatting. Comparison does not load fonts or write nodes. A failed/skipped family blocks acceptance. Visibility flags alone do not prove painted visibility under clipping or occlusion; inspect the probe area at normal scale and retain rendered evidence separately.
5. After saving evidence, choose **Remove owned probes** for that exact root ID. Cleanup removes only recorded owned INSTANCE trees with their original parent and no unrecorded descendants. Moved, detached, retyped, foreign-identity or user-extended probes are retained, as is a root with additional children. Inspect the cleanup report; never delete by display name or prefix.

The root stores a versioned, bounded synthetic ledger in public shared metadata. After a plugin restart, paste the saved root ID into **Probe root ID** to recover the persisted baseline. Run a new ordinary scoped build to supply the comparison's current build report; the UI-held last build report does not survive restart. Preparation is a new run, not an upsert of the old probes. Keep private workflow/account details outside shared metadata.

Current coverage is deliberately narrow: Radio Checked is a VARIANT string axis, not a BOOLEAN. Default Radio's hidden error ancestor cannot be shown by its Show error property; positive error visibility is exercised on Invalid Radio. Open ComboBox has no Error message consumer. The acceptance helper reports these limits and makes no publishing, all-brand, font-equivalence or arbitrary-width claim. The focused mock verifies read-only comparison, actual property/formatting readbacks, partial evidence and safe cleanup; actual master-update propagation still needs the native run.

### Font failures and scoped retries

An exact face appearing in `listAvailableFontsAsync` does not establish that `loadFontAsync` will succeed. Preserve the underlying message, including string rejections. As observed on 3 October 2026, the connector loaded Roboto Condensed while the desktop runtime still rejected it; that is not a general recovery procedure.

For an unchanged brand/mode, retry only the available families. The current Roboto scope includes Button, Text input, ComboBox option, ComboBox and Textarea. Exclude Tabs and Tab trigger when Condensed fails. The builder prepares selected families and their instances; it checks the whole shared container before a real mode transition because that transition can affect unselected text too. A blocked mode transition must be resolved before treating a scoped retry as successful.

Tick **Check font loading during inspection** when investigating loading, then choose **Inspect kit**. This opts into the bounded Roboto and Roboto Condensed load diagnostics. With the checkbox off, inspection returns `fonts: null` and does not enumerate or load fonts. The displayed font counts and messages are shortened; save the complete inspection to retain every diagnostic. A bounded summary improves UI responsiveness but does not establish a fix for stale native accessibility or pending Save As dialogs. Preserve failed existing styles, review the underlying font report, and retry their exact styles/families after loading works. Font substitution, system font changes and unrelated component rewrites need separate decisions.

### Native window and download recovery

A screenshot and accessibility tree may disagree after an operation. Check both before sending another action. On the observed desktop run, opening and dismissing a native menu refreshed stale accessibility; selecting the kit's main window from **Window** revealed a pending **Save As** dialog. Complete the existing dialog and verify the downloaded file. This recovered the report without restarting Figma. A working dialog recovery does not establish cloud synchronisation.

## Native capability experiments

Use these experiments before promising a new composition capability. They create private temporary probe components, instances and fonts from the selected source brand, inside one recorded root. They do not change the canonical kit, variables or shared styles.

1. Load the current token JSON and choose one imported brand. Expand **Native capability diagnostics** and run once.
2. Save the full operation report before a bundle change or plugin restart. Read each test's errors, criteria and native geometry; the bounded window summary is not the full evidence.
3. Visually inspect the temporary area. Verify wrapping, child content and source contour behaviour separately from a passing API call.
4. After restart, load the saved capability report, then audit its exact ledger. Audit is read-only and only reconciles proven inherited descendants of recorded owned instances. Unrecorded direct slot children and foreign additions are refused.
5. Remove owned capability probes using that ledger. Save cleanup evidence. If cleanup refuses ownership or a surviving moved asset, inspect the actual topology before taking another action. Do not use a name scan or broad deletion to bypass the ledger.

Generating tokens also rebuilds the desktop bundle. Freeze plugin-folder edits, generation and mock harnesses that rebuild output while a native diagnostic is running or its report is unsaved. Save every operation report and remove temporary assets before resuming builds. An interrupted in-window report cannot be reconstructed by adopting every descendant of a similarly named frame; use the exact saved ledger, or visually verified recoverable cleanup and record manual recovery.

Native instance vector-path editing is unavailable in the observed desktop session. HUG legends use fixed caps; tested instance cap writes did not resize the text. Native SLOT creation is available, but insertion can regenerate descendant IDs. Re-query current nodes after structural slot edits and record actual returned identities before reading text or comparing preservation. Mock control-flow success does not establish these native behaviours.

The separate **Diagnose font loading** action tests exact source names plus unambiguous names already present in Figma's inventory. It never assigns candidates. Save its report and preserve source font roles until file/axis/rendering evidence supports a mapping. Loading success alone is insufficient.

## Brands, collections and publishing

The current model is one **Mangrove** collection, with shared component structure and brand-dependent values. Avoid separate per-brand component copies. On a one-mode file, a single-brand import renames and overwrites that mode in place. Record the starting brand before testing another one, then re-import that starting brand, rebuild the supported scope and inspect/render it again before finishing. Record both the switch and restoration, including font failures and any blocked container transition.

Starter local reuse and paid shared-library publication are separate workflows. Follow the dated access guidance in [README.md](README.md#free-account-now-professional-later). When suitable team access is available, verify seat, edit permission, file location and mode allowance before a migration or publication. The move to multiple real modes and a published library still needs an actual-file acceptance check. Keep the canonical kit identity and compare existing instances after migration.

Splitting the collection into Primitives and Brand collections remains an open design question. It needs an explicit alias, mode and consumer-binding migration. Script/direction layers and Code Connect are also separate work; Latin brand modes do not establish Arabic font routing or mirrored layout support.

## Professional access handoff

**Current Details and Select checkpoint:** Output contains 384 variables, 86 text definitions, eight effects, 21 families and 265 variants. Both new families have bounded default-UNDRR construction, repeat, rendering and saved-field observations: Details20 presets/50 main TEXT paths; Selectfive closed short-value states/25 main TEXT paths. Generic Details widths now preserve source390/900/240 presets. Select includes a documented Chromium-only disabled opacity baseline, verified at approximately0.7 on the native control without dimming its label/help. Native inspection finds38 selected text styles andeight effects. A final local backup is saved; cloud sync remains unconfirmed. Exact edited/fresh consumer checks, arbitrary responsive behavior and broader brands/scripts remain open. The full audit matches557 main TEXT paths and retains51 older Tabs-font/editorial-CTA findings. Begin paid migration from a fresh current inspection and local backup; earlier checkpoint counts below are historical.

**Current Chips and balanced Text CTA checkpoint:** Output contains 359 variables, 81 text definitions, seven effects, 19 families and 240 variants. Native inspection found 33 selected text styles and all seven effects, without inspection errors. Chips intrinsic review refresh and ordinary repeat created zero nodes; Text CTA shared headings now read BALANCE and all 12 main TEXT paths pass saved-field checks. All 4,980 preceding inspected asset IDs survived its rebuild. The full offline audit still reports 51 findings: six Tabs missing-font labels and 45 Editorial CTA style/decoration/offset mismatches. Resolve those and check actual edited/fresh consumers before publishing. A fresh local backup was saved after temporary cleanup; cloud sync remains unconfirmed. At that historical checkpoint Details was source-mapped but not integrated. The current Details checkpoint above supersedes that status; Hero still depends on fonts, media and accepted editorial actions.

**Current Switch checkpoint:** Output contains 335 variables, 75 text definitions, seven effects, 17 families and 201 variants. Native inspection found 27 selected text styles, seven effects and no errors. Both Switch sizes have bounded UNDRR rendered observations. A normal rebuild after the visibility guard created no nodes, and actual edited ComboBox/Radio instances again passed 441 assertions; exact cleanup removed 32 recorded nodes with none retained. A local backup was saved after cleanup. Cloud synchronisation remains unconfirmed. Use a fresh inspection and backup before any migration; subsequent checkpoints supersede these counts.

**Checkbox and summary checkpoint:** Its generated output contained 308 variables, 75 text-style definitions, five effects, 15 families and 159 variants. These definition counts do not mean every text style is imported. Native Checkbox SVG construction succeeded, and Form error summary constructed its six variants successfully; Summary normal/edited-long native examples retain underline and balanced titles, and its repeat created zero nodes, updated 114 and reported no errors. The ComboBox/Radio edited-instance probe passed 441 assertions; restart recovery and cleanup removed 32 recorded nodes with none retained. Final inspection found 27 selected text styles, five effects and no errors, with all 290 preceding variable and 136 family asset IDs retained. A fresh local backup was saved; cloud synchronisation remains unconfirmed. The preceding Radio repeat retained actual family, variant and property IDs. Begin migration only from a fresh inspection and backup of the current file; earlier checkpoints below remain historical evidence. See [the architecture review outcome](ARCHITECTURE-REVIEW.md#svg-summary-and-edited-instance-checkpoint) for current evidence boundaries.

Professional access is planned but has not been verified for the canonical kit. This is the place to resume when it becomes available.

### Starting checkpoint

At source revision `e41d774b`, the desktop kit has 246 variables, seven component families and 47 variants. UNDRR is restored in its single physical mode. Saved inspections for all five brands match the preceding 245 exported values and aliases and preserve the original variable, set, variant and property identities. Textarea construction and repeat updates succeeded; its multiline review PNG establishes bounded wrapping and clipping. A fresh local `.fig` backup was saved. Actual report IDs and backup paths belong in the local evidence ledger, not this document.

### Access and remaining limits

As checked on 3 October 2026:

| Capability                   | Professional access and remaining work                                                                                                                                                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Simultaneous brands          | Up to 10 modes per collection in a Professional team file, enough for the five Mangrove brands. Move the kit into that team before testing the multiple-mode workflow.                                                                        |
| Team library                 | Publishing components, variables and styles requires a Full seat and edit access to the source file. Move the source out of Drafts into a team folder. Colleagues can review and accept published updates in their consuming files.           |
| Agent inspection and editing | Full or Dev seats have documented MCP read limits of up to 200 calls per day and 10 per minute. Team-file canvas editing requires a Full seat and file edit permission. Verify the connected account and actual tool access after the change. |
| Development plugin           | Professional does not provide private team plugin publication. The maintainer continues importing the development manifest locally; consuming library users do not need the importer.                                                         |
| Code Connect                 | Still requires an Organization or Enterprise plan and a Full or Dev seat. Keep React component mappings as later work.                                                                                                                        |
| Font loading and cloud state | Desktop Condensed font loading remains unresolved despite earlier connector success. Cloud synchronisation remains unconfirmed. Resolve these separately and preserve local backups.                                                          |
| Component fidelity           | Required-label inline flow, long help/error wrapping, native Textarea scrolling/resizing, exact font metrics and full visual acceptance across brands remain open.                                                                            |

Sources: [plan comparison](https://help.figma.com/hc/en-us/articles/360040328273-Compare-Figma-plans-and-features), [library publishing](https://help.figma.com/hc/en-us/articles/360025508373-Publish-a-library), [MCP limits](https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/), [canvas editing](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/), [private plugin publication](https://help.figma.com/hc/en-us/articles/4404228629655-Create-internal-plugins-for-an-organization) and [Code Connect](https://developers.figma.com/docs/code-connect/). Recheck the current terms when access changes.

### Resume in this order

1. Confirm a Full seat on the user's own account, membership of the Professional team and edit access to the kit. Record the effective plan, connected account and file location in local evidence.
2. Save a fresh full structural inspection and local `.fig` backup. Check cloud synchronisation before moving or restarting the file. Preserve the canonical kit and compare actual identities with the saved baseline.
3. Move the canonical file into a folder in the Professional team. Verify access and the collection's mode allowance. Refresh connector authentication if needed, then perform a bounded read to establish actual access and available quota.
4. Regenerate the current JSON and bundle with `yarn build:figma-tokens`. Import all five brands with pruning off. Save the full operation report and inspection; confirm five modes, unchanged existing variable IDs, correct aliases in every mode and unchanged component/property identities. Paid-team migration currently has mock coverage only.
5. Create review frames for each brand using instances of the shared components. Apply each frame's mode and compare default, focus, invalid and disabled states at normal and narrow widths. Check consumer-resolved colours, alpha, typography and geometry. Rebuild supported families where geometry is computed at construction time; report blocked fonts without substitution. Keep the baseline UNDRR review intact.
6. Recover exact Condensed loading and apply the pending Tab trigger/Tabs corrections. Check nested properties, long labels and focus geometry in the actual file. Continue tracking field-label flow and Textarea limitations separately.
7. Review the accepted assets and publish a bounded library release with a change description. Enable it in a separate consumer file, place instances and verify variable modes and an accepted update. Record publication and consumer evidence before treating the library as ready for wider use.
8. Update this checkpoint, README, LEARNINGS and draft PR #1319 with the new source revision, actual migration results, local gates and remaining gaps. Continue component additions through the workflow above. Resolve collection splitting before a broad library release; defer Code Connect until suitable access exists.

## Record a checkpoint and update the pull request

For each meaningful change, add a short entry to [LEARNINGS.md](LEARNINGS.md) with:

- Date, source revision, recipe schema version and generated counts.
- Source paths/selectors and the intended representation or documented approximation.
- Brand, exact fonts, relevant width/height and any explicit repair option.
- Local gate results and operation counts, including failures and partial writes.
- Before/after identity comparison, edited override check and repeat-build result.
- Browser fixture, saved inspection/operation reports and PNG filenames.
- What the real file established, what only the mock established, remaining discrepancy and next action.

Keep actual asset IDs in local reports used for comparison. Keep credentials, private file identifiers and user-specific backup paths out of repository prose. The JSON currently records source references and recipe schema version, but not the checkout SHA automatically; record the SHA alongside the evidence.

Use conventional commits such as `feat(figma): add source-backed control recipes`. Follow [the editorial manual](../../docs/EDITORIAL-MANUAL.md), omit AI attribution, and use the normal hooks. Leave unrelated local files such as `RC2-DECISIONS.md` alone.

This spike's branch is `spike/figma-token-bridge`, and [draft PR #1319](https://github.com/unisdr/undrr-mangrove/pull/1319) is based on `spike/react-aria-surface` ([PR #1088](https://github.com/unisdr/undrr-mangrove/pull/1088)). Preserve that stack unless an explicit change is agreed. Ask before a rebase, force-push or new PR.

Read the known PR directly:

```sh
gh api repos/unisdr/undrr-mangrove/pulls/1319 --jq '{number,base:.base.ref,head:.head.ref,body}'
```

Prepare the complete revised body in a UTF-8 file. Include the scope, generated counts, local gate results, actual Figma observations and remaining checks. Update the exact PR through a structured REST payload:

```sh
node -e "const fs=require('fs');process.stdout.write(JSON.stringify({body:fs.readFileSync(process.argv[1],'utf8')}))" /tmp/mangrove-pr-body.md > /tmp/mangrove-pr-body.json
gh api --method PATCH repos/unisdr/undrr-mangrove/pulls/1319 --input /tmp/mangrove-pr-body.json
```

If the REST connection fails, use the known-number GitHub CLI path. On the observed run, an exact REST GET succeeded before later GET/PATCH attempts failed with a TCP connection refusal; `gh pr edit` and `gh pr view` then updated and verified the same PR through GraphQL:

```sh
gh pr edit 1319 --repo unisdr/undrr-mangrove --body-file /tmp/mangrove-pr-body.md
gh pr view 1319 --repo unisdr/undrr-mangrove --json baseRefName,headRefName,isDraft,headRefOid,body
```

Verify the resulting body, draft state, branch names and head revision. This is an observed transport fallback, not a fix for suppressed listing endpoints. The organisation's listing/search endpoints can return empty results despite existing items; state that limitation rather than infer an empty queue. GitHub Actions are unavailable for this organisation at this checkpoint, so report local gate results in the PR.

## Full component implementation

The continuing scope and acceptance status are tracked in [COMPONENT-INVENTORY.md](COMPONENT-INVENTORY.md). Implement families in dependency order, retaining verified identities and recording source, mock and native evidence separately. See [ARCHITECTURE-REVIEW.md](ARCHITECTURE-REVIEW.md) for the independent review and scaling priorities.

Ellipse recipes use native geometry, fills, strokes and effects. They reject children, frame layout fields, corner radii and HUG sizing before style/canvas writes. FILL remains valid inside an auto-layout parent. Bind source dimensions and document any derived Figma geometry, such as the Radio inset spread that includes its inside border. Check the actual PNG because a correct effect value does not prove its painted extent.

## Keep transport and review bounded

The growing review sheet should be checked by family. Tick exactly one family and choose **Export selected family PNG**. This reads the exact owned `review/<family>` FRAME directly below the owned review root; it rejects ambiguous or foreign targets and does not create temporary nodes. Display renames retain identity. Save the full inspection and operation report alongside the family PNG; a bounded image does not replace structural or cross-family acceptance. The Radio family export has been exercised in the desktop app. The export and UI mocks cover ownership, selection and exact downloaded bytes.

For connector foundation imports, use explicit `variableIds` / `styleIds` batches through `buildConnector`, or CLI `--variables` / `--styles`. Follow [the connector instructions](README.md#drive-the-same-recipes-through-the-connector), including alias/style dependency closure. Partition every exported definition and verify requested versus actual scope. A missing batch is a partial import. Complete all batches before accepting a Starter brand switch because one physical mode temporarily contains mixed-brand values. Batches never prune. The earlier five-brand 290-variable/78-style batch mock is historical evidence; rerun batch checks for the current 335-variable/82-style definitions before using that scope. Actual connector execution remains unverified while quota is exhausted.

Connector compilation includes SVG support only when the exact selected variant/dependency subset contains an SVG recipe; minification removes it from other scopes. The desktop bundle retains SVG support. Conditional elimination does not guarantee a small payload: the full non-SVG ComboBox scope now exceeds the earlier 48k payload budget, so use explicit one-family `variantIds` batches. The compiler rejects payloads over 50,000 characters or UTF-8 bytes and never truncates metadata. Supply exact recipe variant IDs through `buildConnector` or the CLI fourth positional argument, and record each batch's scope and counts. Runtime/mock transport checks do not establish remote execution.

Checkbox now uses the exact source SVG checkmark, including bounded narrow tiles, and native import has succeeded. Both Switch sizes now have bounded native construction and rendered observations; pending and custom-size behaviour remain open. Do not replace source assets with similar icons or promote a source browser capture to Figma acceptance. Changed-source SVG migration, arbitrary tiling widths and broader consumer updates remain explicit acceptance work.

### Probe placement and rendered comparison

Fresh probes are placed beyond the rightmost finite page-level bounds, including review, diagnostics and user content, with a 160px gap. Their root is excluded from that calculation. Existing page nodes are never moved. A page with no usable finite bounds fails before probe creation. This correction passes bounded mocks; exercise a new native preparation to verify future placement. The first native run used the old position and overlaid the review sheet, so the root was moved clear before visual review. Transparent probe roots require a clear canvas location.

The accepted LTR summary uses source title line-height 17.6px. Native line boxes round to 18px, giving short heights 79.5/137.5px and long 240px height 341.5px, versus browser 79.09375/137.09375/340.28125px. Record these differences when comparing screenshots; do not silently tune the source role to compensate for one renderer.

## Absolute source badges and review surfaces

A fixed-size native FRAME, ELLIPSE or TEXT child of an auto-layout FRAME may declare `absolute: { horizontal: 'END', vertical: 'CENTER', offsetX, offsetY }`, with FLOAT variable names for both offsets. Root nodes, SVGs, FILL/HUG badge dimensions, a simultaneous `position` and unsupported alignment shapes are rejected before writes. The builder removes the child from flow before layout, positions it after the parent's content settles and verifies finite geometry and native readback. Native MAX/CENTER constraints must then be checked during actual consumer resize and text edits; initial master placement alone does not establish automatic reflow.

TEXT recipes may specify `textDecorationOffset` in PIXELS, PERCENT or AUTO units. Offsets are written only for UNDERLINE after font loading, shared style and property references. Native NONE readback is null. The exporter may retain offset metadata alongside a text-style definition, but native TextStyle has no offset property. Do not simulate inherited native offsets in the mock or assume editable Label updates preserve them.

`family.review.variantSurfaces` maps exact variant IDs to COLOR variables; explicit review specimens may declare `surface`. The builder creates padded owned surface wrappers around instances, leaves captions on neutral rows and keeps masters transparent. Scoped connector variant batches filter this map with their selected variants. Source surface changes and wrapper migrations must preserve instance IDs and edited content.

Editorial CTA's first native run found all shared Label nodes using the final Focus style. Until an isolated property experiment and consumer checks establish a correction, this family is built with known styling gaps. Review all state styles through actual node readbacks and PNGs; the ordinary mock does not reproduce this propagation.
