# Mangrove tokens for Figma (exploratory)

A spike, stacked on the React Aria pilot (unisdr/undrr-mangrove#1088). It turns Mangrove's tokens into local Figma variables, text styles, effect styles and native component recipes so a Figma kit can use the same spacing, colour and theme layers as the code. Nothing here is published or supported yet.

See the [architecture review](ARCHITECTURE-REVIEW.md) for the acceptance gates when composing and maintaining the kit.

## How it fits together

```
tokens/*.yaml + SCSS ──> scripts/build-figma-tokens.cjs ──> mangrove-variables.json ──> this plugin ──> Figma variables, styles and components
(same merge and resolve as build-tokens.cjs)          (generated, not committed)
```

- One collection, **Mangrove**, with one mode per brand: UNDRR, DELTA Resilience, IRP, MCR2030 and PreventionWeb. Switching a frame's mode re-themes it, which is the Figma equivalent of `.mg-theme-*`. Figma Professional allows 10 modes per collection.
- Aliases follow the YAML. `color/button-background` aliases `color/interactive`, which aliases `color/blue-900` in UNDRR and `brand/primary` in PreventionWeb. A value that CSS derives with an alpha cast is stored as resolved RGBA, because Figma aliases cannot change opacity.
- Brand primitives marked `$private` are imported but hidden from publishing.
- `control/*` comes from `_control-tokens.scss` (the roles the ComboBox uses) and `font-family/*` from `_variables.scss`.
- Source variables carry their CSS name as Dev Mode code syntax, for example `rgb(var(--mg-color-interactive))`, so developers inspecting a design see the token to use. Derived effect helpers have descriptions explaining their source; the focus extent also carries a CSS calculation.
- Two-value shorthands become `/block` and `/inline` pairs (`padding/button/block`, `padding/button/inline`) that bind to auto layout's vertical and horizontal padding.

Not represented as variables, with the reason listed in the JSON's `skipped` array: shadows, durations and easings (no Figma variable type), percentages and `em` line heights, four-value shorthands, and `none`. Raised shadows and the source Radio checked inset are represented as effect styles instead.

Current output contains 416 variables, adding source-backed component roles to the original 219-variable bridge. It includes 60 Regular text foundations (12 selected by default), 31 component text styles and eight effect styles. Read the build report for current totals. Component recipes cover 293 variants across 26 families; 16 tokens remain skipped as variables. Component-specific text styles are not default foundation selections; the builder imports the styles required by the selected family.

### Text and effect foundations

The JSON's `styles` section holds values and binding names. The plugin chooses what to import, loads fonts, and applies those definitions; it does not hold a second set of design values.

| Text role | Default size steps                         | Family           |
| --------- | ------------------------------------------ | ---------------- |
| `text`    | `300`, `button`, `form-input`              | Roboto           |
| `heading` | `400`, `500`, `600`, `900`, `1000`, `1100` | Roboto           |
| `display` | `900`, `1000`                              | Roboto Condensed |
| `ui`      | `tab`                                      | Roboto Condensed |

Expand a role in the plugin to change the selection. The 60 foundation choices use **Regular** with **automatic line height**, with `fontFamily` bound to `font-family/*` and `fontSize` bound to `font-size/*`. Component styles add source weights and explicit line heights. Chromium source comparison confirmed bundled Bold 700 for CSS600, 115% line height for TextInput and inherited 24px for smaller help text. Figma font-file equivalence and script-specific fonts remain pending. The SCSS `code` role uses a generic monospace stack, so no specific Figma font is exported for it.

The importer discovers exact font names with `listAvailableFontsAsync` and loads them with `loadFontAsync` before editing. An unavailable or unloadable font skips the affected text styles and appears in the report. Variables, effect styles and other text styles still import. Install or enable the missing font and re-import to complete the set; no fallback font is substituted.

| Effect style                             | Source and Figma representation                                                                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mangrove/shadow/raised`                 | `shadow.raised`: a zero-blur inner shadow, preserving the 1px inset border and 0.24 alpha through `effect-color/shadow/raised`.                                           |
| `Mangrove/shadow/raised-hover`           | `shadow.raised-hover`: a zero-blur 2px inner shadow, colour bound to `color/interactive`.                                                                                 |
| `Mangrove/component/radio/checked-inset` | Source 3px white inset on the checked Radio ellipse. Native spread binds to the derived 5px helper, including its 2px inside border; see the actual PNG correction below. |
| `Mangrove/focus-ring`                    | `mg-focus-ring` in `_mixins.scss`: two zero-blur outward shadows, with a neutral separator over the coloured outer band. Colours and spreads are bound to variables.      |

These shadows are inset borders in the CSS, not elevated drop shadows. The focus effect approximates a CSS outline; opaque diagnostic shapes have been rendered in Figma to compare ordering. Figma paints the later effect over the earlier one, so the coloured outer spread precedes the white separator. Actual control and inset rendering still need checking. Figma documents spread support for rectangles, ellipses and filled frames with clipping enabled. Check the effect on the actual control shapes, including whether an ancestor clips the outward ring. The exporter fails if the focus mixin's supported recipe changes.

API references: [TextStyle](https://developers.figma.com/docs/plugins/api/TextStyle/), [effect variable bindings](https://developers.figma.com/docs/plugins/api/figma-variables/) and [effect geometry](https://developers.figma.com/docs/plugins/api/Effect/).

## Usage

For source changes, new components, identity migrations and routine Figma updates, follow [Maintaining the kit](MAINTAINING-KIT.md).

### Requirements

- The Figma **desktop app**. Development plugins cannot be imported in the browser.
- Any Figma plan for a local kit. Starter and Drafts allow one mode: tick one brand and use the brand switcher below. To keep all five brands as modes and publish a shared library, use a Professional team file and a Full seat. Professional allows 10 modes per collection.
- A checkout of this branch with dependencies installed (`yarn install`).

### 1. Generate the variables file

From the repository root:

```sh
yarn build:figma-tokens
```

This writes `examples/figma-plugin/mangrove-variables.json`, bundles the runtime into `examples/figma-plugin/build/main.js`, and prints the variable, mode, style and skipped token counts. Both files are build output and are not committed, so regenerate it on whichever branch holds the tokens you want.

### 2. Install the plugin (once per designer)

1. Open the Figma desktop app and any design file.
2. Go to **Plugins > Development > Import plugin from manifest...**.
3. Choose `examples/figma-plugin/manifest.json` from your checkout.

The plugin now appears under **Plugins > Development**. On a Professional plan, plugins cannot be published privately to a team, so each designer who runs the import repeats this step. Only the person who maintains the library file needs it.

### 3. Import into the library file

1. Open the dedicated Figma Design file that will hold the Mangrove kit. A file in Drafts or a Starter team is limited to 1 mode. For all five modes, save it in a project that belongs to the Professional team.
2. Run **Plugins > Development > Mangrove tokens (exploratory)**.
3. Choose the `mangrove-variables.json` you generated.
4. On Starter or in Drafts, tick only one brand. In a Professional team file, tick all five brands. Expand the text roles to choose sizes, and leave effect styles ticked to import the effects. UNDRR is selected initially for the Starter workflow. Select **Import variables and styles**.
5. Read the report in the plugin window: the counts, any errors, and the tokens that could not be represented. Choose **Save operation report** to retain the complete result JSON, including affected IDs and errors.
6. Open **Local variables** to see the **Mangrove** collection, with one column per imported brand. In local styles, inspect the text and effect styles under **Mangrove**.

### On a file limited to 1 mode: brand switcher

A file in Drafts or a Starter team allows only 1 mode, so the five brands cannot sit side by side. Use the file as a brand switcher instead:

1. Run the plugin, untick every brand except one, and import. The single mode is named after that brand.
2. Bind your designs to the Mangrove variables as usual.
3. To see another brand, run the plugin again with only that brand ticked. Its values overwrite the mode in place and every bound layer in the file re-themes. Variables are reused, so no bindings break.

Limits: one brand is visible at a time, and Starter cannot publish libraries, so the variables, components and designs stay in this one file. Local text styles, effect styles and components can still be created and reused within the file. When the file moves to a Professional team project, import with all brands ticked: the existing mode is kept and the others are added. Both workflows pass the mock harness. Saved desktop brand inspections establish single-mode values, aliases and identity preservation; paid-team migration and complete rendered brand acceptance remain pending.

### Build and inspect the native kit

Import one brand first, then select families and choose **Build selected components**. Dependencies are built first. The generated kit contains main components outside **Mangrove / Review**, where editable instances show states, long labels and narrow examples.

| Family                       | Variants |
| ---------------------------- | -------: |
| Button                       |       16 |
| Text input                   |        6 |
| ComboBox option              |        6 |
| ComboBox                     |        6 |
| Tab trigger                  |        6 |
| Horizontal pill Tabs         |        1 |
| Textarea                     |        6 |
| Table header cell            |        4 |
| Table body cell              |        4 |
| Table row                    |       24 |
| Table                        |        8 |
| Text CTA                     |        6 |
| Radio                        |       30 |
| Checkbox                     |       30 |
| Form error summary           |        6 |
| Switch                       |       22 |
| Switch small                 |       20 |
| Editorial CTA                |       23 |
| Chips                        |       16 |
| Details                      |       20 |
| Closed Select                |        5 |
| Loader                       |        2 |
| Compact Empty State          |        4 |
| Table of contents / Link     |       12 |
| Table of contents / Numbered |        3 |
| Status Label                 |        7 |

TOC links use the imported source text style as a typography template, with font-family and font-size variables bound directly on their 12 main labels. Their native text-style association is deliberately empty: controlled desktop experiments found incorrect effective range colours when the shared Label property and style association were combined. This exception is restricted to TOC links and guarded against changed source anatomy or missing bindings. Rebuild the affected components after importing a changed template; editing the local style alone does not update directly applied labels. See [the native findings](LEARNINGS.md) and [maintenance checks](MAINTAINING-KIT.md).

The JSON `components` section owns typography, geometry, token bindings and source references. Rebuilding updates owned nodes in place, preserves property IDs and keeps review instance overrides. Unexpected node types or ambiguous identities are rejected. User additions are retained and obsolete owned children are reported. A failed update to an existing family can retain partial changes; inspect the report before continuing.

Composed Tabs exposes the nested trigger properties; open ComboBox exposes its nested options. Review label targets follow the recipe anatomy, and responsive formatting is normally seeded only on new specimens. Existing Tabs long-label specimens keep their prior labels; edit the exposed nested Label property or explicitly reseed the review. The four Roboto families have been rebuilt in the desktop file, and inspection confirms three exposed instances in open ComboBox. Updated Tabs recipes still need a real-file rebuild. See [the source measurements and acceptance record](LEARNINGS.md#browser-acceptance-measurements) for targeted visual checks and remaining gaps.

**Refresh narrow Button and composed review geometry, keeping content** is off by default. Tick it when an existing narrow Button specimen needs wrapping repaired or a composed specimen needs its current master preset and root width reapplied, then build the affected families. It preserves editable content and node IDs, while explicitly replacing the selected review geometry overrides. Normal rebuilds preserve existing formatting and geometry edits. Narrow review rows include 8px padding on each side outside the advertised 240px consumer width. The corrected Button specimen renders at 240 × 50px with its retained label on two unclipped lines. This option does not repair required field label wrapping.

**Inspect kit** records actual IDs and resolved consumer bindings without loading fonts. Tick **Check font loading during inspection** to include font probes when needed; unchecked reports contain `fonts: null`. The window displays a bounded inventory summary, while **Save inspection report** downloads the complete JSON. **Focus diagnostics** compares literal effect order with bound styles; PNG export buttons capture review frames. Select exactly one family and use **Export selected family PNG** for a bounded image of its owned review section; **Export review PNG** captures the whole growing sheet. These are local development operations and do not publish a library.

**Save operation report** downloads the latest import, component build or focus diagnostics result without shortening its IDs, errors or audit entries. Filenames identify the operation: `mangrove-import-report.json`, `mangrove-component-build-report.json` or `mangrove-focus-diagnostics-report.json`. Inspection reports remain separate. Actions run one at a time; the previous operation report stays available while another action runs or after an error. Reports are held in the plugin window until it closes, so save them before restarting it.

**Diagnose font loading** performs a bounded probe of the exact selected-brand UI/display faces and at most one already-listed naming candidate per face. It reads the supplied font inventory, tests at most four exact names and reports variable-axis tags. It creates no nodes and assigns no fonts. Save its full operation report. On 4 October, the exact `Roboto Condensed` Regular/Bold faces failed while the listed `Roboto` / `Condensed Regular` and `Condensed Bold` names loaded. This distinguishes resolution paths, not matching font files, axis coordinates or rendering. Font roles remain unchanged. See [the font investigation](LEARNINGS.md#font-names-and-loading-do-not-prove-font-identity).

**Native capability diagnostics** creates a separate temporary area for legend sizing, editable slots and instance-vector experiments. Save its report before closing the plugin. After restart, **Load saved capability report** recovers the exact ledger; **Audit saved capability ledger** reads current ownership and reconciles permitted inherited probe descendants without changing the canvas. Cleanup refuses foreign or unrecorded children and moved assets. A failed capability test is evidence for the component contract, not a reason to detach consumers or invent equivalent behaviour. See [the runbook](MAINTAINING-KIT.md#native-capability-experiments).

The **Segmented Control joining** diagnostic reads an exporter-owned `capabilities.segmentedJoining` packet. It checks typed source roles, native identities, selected-mode values and exact fonts before creating four temporary fixtures for seams/corners, focus paint order, full-width edited labels and wrapping. The first measured scope is UNDRR. These fixtures do not add canonical variables, styles or component families; direct diagnostic typography does not establish shared-style or ordinary rebuild acceptance. Save the full report, review the fixtures at normal scale, then remove the exact owned nodes before rebuilding the plugin. See [source packets](MAINTAINING-KIT.md#source-packets-for-native-capability-checks).

Stable public token and component identities use shared plugin data in namespace `orgundrrmangrove`. Desktop imports also read legacy private IDs and reject conflicting ownership. Shared identity metadata contains no account information or secrets. The optional acceptance probes store a bounded synthetic workflow ledger on their temporary root; save and remove it using the acceptance controls. See [Figma shared plugin data](https://developers.figma.com/docs/plugins/api/properties/nodes-setsharedplugindata/).

### Drive the same recipes through the connector

When `use_figma` is available, generate a bounded script from the same runtime:

```sh
# One scoped foundation batch, not the complete import.
node scripts/build-figma-connector.cjs import undrr --variables=color.neutral-0 --styles=focus-ring > /tmp/mangrove-import-batch.js
node scripts/build-figma-connector.cjs build undrr button > /tmp/mangrove-button.js
node scripts/build-figma-connector.cjs build undrr text-input > /tmp/mangrove-input.js
node scripts/build-figma-connector.cjs build undrr combobox combobox.open > /tmp/mangrove-combobox-open.js
node scripts/build-figma-connector.cjs build undrr tabs > /tmp/mangrove-tabs.js
node scripts/build-figma-connector.cjs build undrr table table.large.default > /tmp/mangrove-table-default.js
node scripts/build-figma-connector.cjs inspect undrr > /tmp/mangrove-inspect.js
```

Pass the emitted JavaScript to `use_figma` after loading its skill. The builder includes nested component dependencies, trims other brands, compresses data with a local codec and rejects payloads over 50,000 characters or bytes. It does not use `eval` or fetch code. Connector execution uses shared metadata only: first migrate legacy private identities through the desktop importer, or verify unchanged unique names before adoption. Privately identified assets that were renamed cannot be recovered by the connector's name fallback.

The optional fourth argument selects comma-separated variant IDs from one family. Full ComboBox, Table, Row, Text CTA, Radio and Checkbox dependency matrices exceed the connector limit; emit one variant or a checked small batch at a time. Dependencies retain only the matching variants for that batch, and reports identify the requested scope. Existing variants remain in place and the builder arranges all retained main variants together. Complete all intended batches and inspect the resulting family. The full desktop plugin build remains available. Packed LZW preserves metadata; payload rejection never silently drops variants. Native connector batch assembly remains unverified while the Starter allowance is exhausted.

Foundation imports also support explicit batches: `buildConnector({operation: 'import', brandId: 'undrr', variableIds, styleIds, doc})`, or CLI `--variables=id,id --styles=id,id`. IDs are the canonical exporter IDs, such as `color.neutral-0` and `focus-ring`, rather than Figma display names. Providing either list selects a batch; an omitted list selects none. Alias dependencies and style font/effect bindings are included automatically. Empty, duplicate or unknown selections fail before writes. Reports include requested and actual scope, and pruning is always disabled.

Partition all `doc.variables[].id` and `doc.styles.text[].id` / `doc.styles.effect[].id` into explicit lists, retaining every definition. Mocks cover five brands with batches of 70 variables and 20 styles, measuring 17,194–33,790 bytes at this checkpoint. Check each emitted payload because the limit depends on the source data. Complete **every** batch and inspect values/bindings before accepting a brand switch: the one physical Starter mode temporarily mixes brands during a partial import. Full desktop import remains available. Native connector import batches are unverified while the tool allowance is exhausted.

On 3 October 2026, the connected Starter account reported a Full seat and canvas writes worked. Screenshot reads subsequently hit the Starter tool-call allowance. This is an observation for this account, not a promise that every Starter account can write. Conserve read calls and record structural evidence returned from writes. Do not upgrade plans or change permissions automatically. See [rate limits and access](https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/).

### 4. Publish and use

Publishing needs a Full seat on a paid plan and edit access to the source file. On Starter, use local assets in the kit file and defer publishing. See [Figma's publishing requirements](https://help.figma.com/hc/en-us/articles/360025508373-Publish-a-library).

1. Publish the file as a library (**Assets > Libraries > Publish**). Private brand primitives stay out of the published list.
2. In a design file, enable the library, then bind fills, strokes, padding, gaps, radii and font sizes to Mangrove variables.
3. To preview a brand, select a frame, use the variable mode control in the **Layer** section of the right sidebar and choose the brand. Everything bound to Mangrove variables inside it re-themes.
4. In Dev Mode, bound values show their CSS name, for example `var(--mg-spacing-150)`.

### 5. Update after a token change

1. Pull the branch with the token change and run `yarn build:figma-tokens` again.
2. Run the plugin in the library file and import the new JSON. Existing variables and selected styles are updated in place, matched by token or style id stored in plugin data, then by name. IDs survive re-import and user renames, preserving bindings and style references.
3. To delete variables whose token was removed from the YAML, tick **Remove Mangrove variables no longer in the file**. Without it, they are kept and listed as stale.
4. Publish the library update.

Unticking a style leaves any existing style in place. The prune option removes variables only; styles are never pruned automatically. JSON from before the `styles` section was added remains importable as variables only.

### Troubleshooting

| Message                                           | Cause and fix                                                                                                                                                                                                               |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Could not add mode "...", Limited to 1 modes only | The file is not in a Professional team project: Drafts and Starter teams allow 1 mode. Move the file into a project in the Professional team and import again; existing variables are kept and the missing modes are added. |
| Could not add mode "..." with a higher limit      | The plan's mode limit was reached. Untick brands, or split them across files.                                                                                                                                               |
| Not a mangrove-variables.json file                | The wrong file was chosen. Regenerate it with step 1.                                                                                                                                                                       |
| alias target ... missing                          | The JSON was edited by hand or is from a mixed build. Regenerate it.                                                                                                                                                        |
| A variable shows the wrong type                   | Its token changed type in YAML. Preflight preserves the existing ID and rejects the import; design an explicit migration before changing bindings.                                                                          |
| Missing fonts or a font could not load            | Enable the exact reported family and style in Figma, then re-import. Other assets are still imported.                                                                                                                       |

The plugin runs locally in Figma and has no network access.

## Connect Codex to Figma

There are two separate plugins: the Mangrove development plugin above imports the generated JSON inside Figma; the Figma plugin for Codex connects the agent to Figma through its remote MCP server. Opening the Figma desktop app alone does not connect Codex.

1. In the **Codex app**, open **Plugins** in the upper-left corner.
2. Find **Figma**, click **+**, then **Install Figma**.
3. Sign in to your Figma account and choose **Allow access**.
4. Give Codex the URL of the dedicated Figma Design file. The existing file with Mangrove variables is suitable; public sharing is not required.
5. Ask the agent to confirm the authenticated account, plan and seat with `whoami`, then inspect the file before making changes.

These steps follow [Figma's Codex connection guide](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/). The remote server does not require the Figma desktop app to be running. The desktop app is needed for Mangrove's development plugin.

The official [figma-use](https://github.com/figma/mcp-server-guide/tree/main/skills/figma-use) and [figma-generate-library](https://github.com/figma/mcp-server-guide/tree/main/skills/figma-generate-library) skills provide API guidance and a workflow for building libraries from code. Installing a skill supplies instructions; it does not connect an account or grant a seat. For a Codex installation that does not already bundle them:

```sh
npx skills add figma/mcp-server-guide --skill figma-use figma-generate-library
```

### Free account now, Professional later

As checked on **3 October 2026**, Figma documents these limits:

| Capability                               | Starter workflow                                                                        | Professional workflow                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Variables and brands                     | One mode; re-import a single brand to switch the file                                   | Up to 10 modes per collection in a Professional team file                             |
| Styles and components                    | Create and reuse local assets in the same file                                          | Publish a shared library with a Full seat and edit access                             |
| Remote MCP reads                         | Starter allowance of up to 20 tool calls per month; conserve reads                      | Full or Dev seats: up to 200 calls per day and 10 per minute                          |
| Direct agent canvas writes (`use_figma`) | A free account alone does not establish write eligibility; the docs require a Full seat | Confirm a Full seat and edit permission on the target file                            |
| Code Connect                             | Unavailable                                                                             | Still unavailable; requires an Organization or Enterprise plan and a Full or Dev seat |

Sources: [plans and features](https://help.figma.com/hc/en-us/articles/360040328273-Figma-plans-and-features), [publish a library](https://help.figma.com/hc/en-us/articles/360025508373-Publish-a-library), [MCP rate limits and access](https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/), [write to canvas](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/) and [Code Connect](https://developers.figma.com/docs/code-connect/). Recheck these when the account or plan changes.

The practical Starter route is to run the Mangrove development plugin in the desktop app. It imports variables and selected text and effect styles; component generation uses the exporter recipes described above. Keep one canonical kit file, bind components to the same variables and defer shared-library publishing. When Professional access is available, ask for a Full seat on your own account and edit access to the team file, move the kit into that team, then import all five brands. Joining a Professional team with a View or Dev seat does not meet the documented requirement for direct agent writes.

Professional access is planned. Resume from [the Professional access handoff checklist](MAINTAINING-KIT.md#professional-access-handoff) and its latest kit checkpoint in UNDRR. The checklist covers migration, simultaneous brand reviews and library publication. Condensed font loading, cloud synchronisation and visual discrepancies remain separate unresolved work. Code Connect still requires Organization or Enterprise access.

## Spike learnings

Keep observations separate from API documentation and mock results. Update this record as the spike is exercised in Figma.

| Finding                                                                            | Evidence and consequence                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Variables were created in the user's free file, but additional modes were rejected | User-reported desktop import: `Limited to 1 modes only`. The file can hold the token collection even when five brand modes are unavailable.                                                                                                                                                                                                                                                                                                                                             |
| Removing absent WEB code syntax throws                                             | Observed in real Figma, fixed in the importer and reproduced by the mock. Remove syntax only when it is present. The later desktop re-import updated all 219 variables without code syntax errors.                                                                                                                                                                                                                                                                                      |
| A single mode can be reused as a brand switcher                                    | All five brands have now been imported into the same desktop mode. Saved inspections match every pre-existing value/alias and preserve variable, set, variant and property IDs. Full rendered acceptance across brands remains pending.                                                                                                                                                                                                                                                 |
| Text and effect styles are local foundations                                       | Implemented with documented variable bindings and font loading. The mock checks creation, stable IDs, missing-font recovery and selective imports. Desktop import created nine text styles and all three effects; re-import updated them without new styles. Three Roboto Condensed styles initially failed to load in the desktop app; the later connector import created them successfully. Full control rendering remains pending.                                                   |
| `shadow.raised` and hover are inset outlines                                       | Confirmed in `tokens/mangrove.yaml`. Export as inner shadows, preserving the alpha cast with a derived colour variable. Do not infer elevation from the token name.                                                                                                                                                                                                                                                                                                                     |
| A CSS outline needs a Figma approximation                                          | The focus mixin becomes two bound, zero-blur outward effects. Rendered opaque diagnostics showed that the neutral effect must follow the outer effect. The desktop import applied the corrected styles, and a scoped rebuild added transparent outline Button geometry. Tab focus and full control rendering remain pending.                                                                                                                                                            |
| A connected agent and a local development plugin have different constraints        | Remote canvas writes require a Full seat. The desktop importer has already run in the free file. Confirm the connector's API support before reusing desktop plugin code.                                                                                                                                                                                                                                                                                                                |
| An installed connector may not expose tools to the active session                  | On 3 October 2026 the user confirmed connection and the Codex plugin catalog showed Figma enabled, but this session exposed no Figma tools. Local app inspection initially failed with a native-pipe startup error, then worked on the follow-up turn and enabled the desktop import. Tools became available during the later autonomous iteration and canvas writes succeeded. The account reported a Full seat on Starter; subsequent reads and writes reached the Starter allowance. |
| Native component scaffolds require rendering and source comparison                 | Seven native component sets now exist with variants, auto layout and bindings. Button and Text input repeat updates preserve IDs. Remaining visual gates are recorded in LEARNINGS.md.                                                                                                                                                                                                                                                                                                  |

For each future change, record the source token or component, the Figma representation, the local verification, the desktop or connector observation and any remaining limitation. Preserve asset identities during updates so existing bindings and instances survive. The exporter remains the source of values: add style definitions to its JSON rather than duplicating values in the plugin.

### Desktop verification on 3 October 2026

The agent operated the Figma desktop app in the user's existing Starter Design file, renamed it **Mangrove kit (exploratory)** and imported only UNDRR with the 12 default text choices and three effects:

- First import: two new helper variables, 217 updated variables, 219 values set; nine text styles and all three effect styles created. The collection UI confirms 219 variables and the UNDRR mode.
- Repeat import: no new variables or styles; 219 variables, nine text styles and three effect styles updated. No variable or effect errors were reported.
- Three styles were initially missing: `Mangrove/display/900/Regular`, `Mangrove/display/1000/Regular` and `Mangrove/ui/tab/Regular`. `listAvailableFontsAsync` listed Roboto Condensed Regular, but `loadFontAsync` rejected it. Font Book confirms that exact face is installed and active. The cause is not established; no substitute font or system font change was applied.
- Figma's font rejection was a string. The importer now reports that string instead of `undefined`, and the mock reproduces the string rejection. The actual message is `The font "Roboto Condensed Regular" could not be loaded`.
- The originally registered plugin pointed to an older Desktop copy. Importing the checkout alongside it produced two registrations with the same manifest ID and still ran the old interface. Removing the stale registration made the checkout's current interface run. Use the checkout directly and check the path in **Manage plugins in development** when an update appears stale. The old source files were left in place.
- The focus style editor shows two drop-shadow effects with colour and spread bindings. Local variables shows the outer extent as 4px; the style editor displayed 0 for its bound spread without a node context. Inspect resolution and geometry on an actual bound control before declaring the focus effect visually verified.
- Figma showed a reconnect warning during import. A local `.fig` copy was saved and its file was confirmed on disk. Cloud synchronisation was not confirmed, and the open file was kept open.

This verifies desktop creation and repeat updates, not rendered component fidelity, all font recovery paths, published libraries, or migration to a paid team. The brand switcher remains verified by the mock only.

### Connector verification on 3 October 2026

- Import preserved the 219 existing variable IDs, added 23 source-backed roles and recovered the three missing Roboto Condensed styles. The file contains 242 variables, 12 Regular foundations and four effects; component builds added seven typography styles.
- Native construction created six sets and 41 variants: Button 16, Text input 6, ComboBox option 6, ComboBox 6, Tab trigger 6 and horizontal Tabs 1. Main components and editable review instances are separate.
- Button and Text input rebuilt with zero new nodes, unchanged variant/property IDs and no reported errors. ComboBox was subsequently rebuilt through the desktop plugin; updated Tabs recipes still need their real-file rebuild. Full visual checks remain pending.
- A rendered Button review exposed zero-width captions. Explicit text widths fixed the layout. The later explicit desktop refresh repaired its existing narrow specimen while preserving the label.
- Opaque focus diagnostics confirmed the paint-order issue. The source now reverses the effect order, provides transparent stroke geometry for outline Button and Tab focus and corrects InvalidFocused Text input according to CSS specificity. The tool allowance initially blocked applying the 244-variable correction; the later desktop import and scoped rebuild applied foundations and the four Roboto families.
- The connector truncates returned text at 20 kB. Bounded inspection summaries and selected-node reports keep results parseable; desktop reports can retain the full inventory.
- Screenshot reads reached the Starter allowance. A subsequent foundation update through `use_figma` was also rejected. Desktop control later resumed; connector access remains quota-limited. No plan or permission changes were made.

### Restored desktop access and scoped rebuild on 3 October 2026

- Desktop control resumed, and a full inspection and local backup were captured before corrections. The open file still showed a reconnect warning; cloud synchronisation was not confirmed.
- Import applied all 244 UNDRR variables: two created, 242 updated and 244 values set. Nine selected text styles and all four effect styles updated. Three Roboto Condensed foundation styles still failed to load in the desktop runtime, despite the earlier connector success. No font fallback or system font change was applied.
- Selecting Button, Text input, ComboBox option and ComboBox rebuilt those four Roboto families with four new outline decoration nodes, 297 updated nodes and zero reported errors. Tabs and its Condensed dependencies were excluded from this operation.
- The complete result was saved with **Save operation report**. This establishes the reported updates and affected IDs; it does not establish full visual acceptance, Condensed font recovery or cloud synchronisation.
- The next inspection briefly showed a completed report in screenshots while accessibility remained at Working. Opening and dismissing a native menu refreshed desktop observations; the inspection and review PNG were then downloaded. All 242 original variable IDs were preserved.
- A repeat build of the four selected families created zero nodes, updated 301 and reported no errors. The review exposed disabled ComboBox opacity at 0.0055 instead of 0.55 and the existing narrow Button's clipped label; targeted corrections follow those actual observations.
- The final foundation import applied 245 variables: one created, 244 updated and 245 values set. Nine selected text styles and all four effect styles updated; the three Roboto Condensed styles still failed. The added `component/text-input/browser-fieldtext` helper resolves to `#000000`, matching the measured browser field text.
- The final scoped build used the explicit narrow review refresh, created zero nodes, updated 302 and reported no errors. The Button label was preserved and the consumer now measures 240 × 50px. The final inspection preserved all 242 pre-correction variable IDs and all six existing component sets, variant IDs and property IDs. Disabled ComboBox main components and review instances resolve to 0.55 opacity; open ComboBox has three exposed nested instances.
- `mangrove-kit-final-corrections-2026-10-03.json` records the final inspection. `mangrove-review-targeted-corrections-2026-10-03.png` shows the narrow Button on two unclipped lines, a visible disabled ComboBox and two-band Button and Text input focus rings. These checks cover the selected corrections; Tabs, broader visual acceptance, real brand switching and cloud synchronisation remain pending.
- A later download appeared to stall while accessibility showed stale controls. Selecting the Mangrove kit main window from Figma's native **Window** menu revealed the pending **Save As** dialog. The download completed without restarting the app or closing the unsynchronised file.

See [LEARNINGS.md](LEARNINGS.md) for source findings, evidence boundaries and the next acceptance checks.

## Checking changes without Figma

`dev/mock-figma.cjs` runs the importer and identity helper against a small mock of the Figma variables and styles APIs. Ten scenarios cover importing every brand, stable variable and style IDs on re-import, the 1-mode limit followed by adding modes, the brand switcher, unavailable and unloadable font recovery, selective style imports, renamed styles and older JSON without styles:

```sh
yarn build:figma-tokens
node examples/figma-plugin/dev/mock-figma.cjs
node examples/figma-plugin/dev/mock-kit.cjs
node examples/figma-plugin/dev/mock-choice.cjs
node examples/figma-plugin/dev/mock-checkbox.cjs
node examples/figma-plugin/dev/mock-form-summary.cjs
node examples/figma-plugin/dev/mock-switch.cjs
node examples/figma-plugin/dev/mock-font-diagnostics.cjs
node examples/figma-plugin/dev/mock-capabilities.cjs
node examples/figma-plugin/dev/mock-svg.cjs
node examples/figma-plugin/dev/mock-acceptance.cjs
node examples/figma-plugin/dev/mock-editorial-cta.cjs
node examples/figma-plugin/dev/mock-editorial-contracts.cjs
node examples/figma-plugin/dev/mock-editorial-acceptance.cjs
node examples/figma-plugin/dev/mock-chips.cjs
node examples/figma-plugin/dev/mock-details.cjs
node examples/figma-plugin/dev/mock-select.cjs
node examples/figma-plugin/dev/mock-loader.cjs
node examples/figma-plugin/dev/mock-empty-state.cjs
node examples/figma-plugin/dev/mock-toc.cjs
node examples/figma-plugin/dev/mock-status-label.cjs
node examples/figma-plugin/dev/mock-audit-native-text.cjs
node examples/figma-plugin/dev/mock-connector-scopes.cjs
node examples/figma-plugin/dev/mock-review-export.cjs
node examples/figma-plugin/dev/mock-ui.cjs
```

The kit harness covers native identity and properties, instance overrides and nested exposure, dependency and font blocking, a scoped Roboto rebuild without loading or rewriting unavailable Tabs, font preflight before container mode transitions, transparent focus geometry, codec transport and the actual API restrictions encountered.

The mock copies the Figma behaviours that have caused bugs here, but it is not Figma. Confirm a change in the desktop app before relying on it.

Audit a saved **Inspect kit** report against the current generated recipes:

```sh
node examples/figma-plugin/dev/audit-native-text.cjs inspection.json --report text-audit.json
```

The audit checks owned main TEXT paths, style IDs, decoration, explicit wrapping, offsets and recorded missing fonts. It exits with failure for gaps or incomplete source coverage. Use `--families chips,switch` for a clearly labelled subset and `--doc` for the exact JSON used to build an older inspection. It does not load fonts or prove rendering. Keep reports containing native IDs local; publish bounded findings in the learnings and PR.

## What this spike does not cover yet

- Desktop font-loading recovery. The connector has completed the three missing styles; the desktop failure cause remains unestablished.
- Complete effect acceptance across control shapes, states and brands. Targeted Button and Text input focus rendering has been checked in the desktop export; updated Tabs and remaining effect checks are pending.
- Real brand switching on bound nodes. The importer and mock exercise the single-mode workflow, but visible re-theming still needs a real-file check.
- Figma font-file equivalence and Arabic font routing. Chromium source measurements have established bundled weights and line heights for the current Latin components; matching those values does not establish identical Figma rendering.
- Full rendered Figma comparison against the measured browser specimens, wider component coverage and the remaining layout gaps. See [FIGMA-KIT-BRIEF.md](FIGMA-KIT-BRIEF.md) and [LEARNINGS.md](LEARNINGS.md).
- Code Connect, which links Figma components to the React source. It needs an Organization or Enterprise plan.

### Desktop brand checks and Textarea on 3 October 2026

- DELTA and IRP updated the existing 245 variables. MCR2030 added the Textarea height helper; PreventionWeb and restored UNDRR updated all 246 variables. Saved inspections for all five brands match the preceding 245 exported values and aliases within numeric precision, preserve their actual IDs and retain all six original sets, variants and property definitions in the same physical mode. These are structural checks; complete rendered brand acceptance remains pending.
- Structural inspection now skips font APIs by default. Its compact display was exercised in desktop Figma, and full multi-megabyte reports were saved. The UI mock confirms the download remains complete. This improves the display size; it does not establish the cause of stale accessibility or delayed native dialogs.
- Textarea adds six source-backed states and a 240px multiline review specimen. Its first desktop build created 131 nodes, updated two shared containers and reported no errors. Inspection confirms an 88.1px height binding, retained line breaks, a 225.5px wrapping Value layer and clipped overflow. The review PNG shows both focus bands, the blue InvalidFocused border, disabled styling and multiline wrapping. The narrow field-label overflow remains visible and documented.
- Browser measurement gives 88.0625px for the four-row control versus the source-derived 88.1px recipe. Scrolling, native resize, identical font-file metrics and all-brand Textarea rendering remain unverified. See [the maintenance runbook](MAINTAINING-KIT.md) for adding components, preserving identities, recording evidence and applying changes.

The desktop Textarea repeat created zero nodes, updated 77 and reported no errors, with unchanged set, variant and property IDs. A fresh local `.fig` backup was saved after restoring UNDRR. Cloud synchronisation remains unconfirmed; the desktop file was left open. Edited multiline Value/visibility retention has mock coverage; an actual edited-instance repeat remains pending.

### Table and Text CTA checkpoint on 3 October 2026

The kit now has 277 variables, 12 families and 93 variants, including 40 Table variants across cells/rows/tables and six text CTA variants. The desktop file has 25 selected text styles and four effects. Source-measured Table presets keep columns on their masters because nested size/binding writes were silently ignored by real Figma. Story rows hug content above source minimum heights; narrow font/line-breaking differences remain documented. Strong CTA actions bind contextual colours on native Button instances; long presets wrap at 200 × 64px and 120 × 106px.

An ordinary desktop repeat created zero nodes, updated 322 and had no errors, with unchanged selected family/variant/property IDs. The original 246 variables and seven original sets/47 variants retain their identities. Saved inspection and PNG checks cover UNDRR, not every brand or arbitrary width. A fresh local backup follows this checkpoint; cloud synchronisation remains unconfirmed. See [the architecture outcome](ARCHITECTURE-REVIEW.md#extension-outcome), [the component brief](FIGMA-KIT-BRIEF.md) and [the maintenance workflow](MAINTAINING-KIT.md).

## Full component implementation

The continuing scope and acceptance status are tracked in [COMPONENT-INVENTORY.md](COMPONENT-INVENTORY.md). Implement families in dependency order, retaining verified identities and recording source, mock and native evidence separately. See [ARCHITECTURE-REVIEW.md](ARCHITECTURE-REVIEW.md) for the independent review and scaling priorities.

### Radio and bounded verification checkpoint

The kit now exports 290 variables, 73 text definitions, five effects and 123 variants across 13 families. Radio adds 30 source-backed variants and a checked-inset effect. Actual desktop inspection found 25 selected text styles and all five effects. Its normal repeat created zero nodes, updated 331 and reported no errors; all 277 preceding variable IDs and all main set/variant/property IDs survived. A fresh local `.fig` backup was saved.

The scoped Radio PNG exposed a real inner-shadow difference: a literal 3px spread left only 1px of white inside Figma's 2px inside stroke. The derived native spread is 5px, retaining the source inset helper at 3px. The new PNG shows the intended 3px white band and 14px centre. Measured 240px source consumers also retain their 96px/144px heights and shrinking ellipses. These are bounded UNDRR observations. Before/focused narrow presets, arbitrary CSS resizing, other brands, Arabic, edited native consumer repeats, Condensed fonts and cloud/publication checks remain open. See [Radio learnings](LEARNINGS.md#radio-and-bounded-verification-on-3-october-2026).

### Checkbox and error-summary checkpoint

That checkpoint added 30 Checkbox variants and six LTR Form error summary variants, bringing its export to 308 variables, 75 text definitions and five effects. Desktop builds created both families; Checkbox repeated with zero new nodes and no errors. Its checkmark imports the exact source SVG into native vectors, preserving the white paint, round caps and square tile repetition in the two measured narrow presets. The current SVG runtime rejects changed assets or edited native geometry before rebuilding them. See the [maintenance contract](MAINTAINING-KIT.md).

The error summary exposes Title and error messages as editable text properties. Its shared link style carries UNDERLINE and its title style carries BALANCE, as well as source font weights and line heights. Native visual checks caught and corrected lost underlines after text property assignment. The corrected 240px long examples show underlined wrapped links and balanced title text; the repeat created zero nodes, updated 114 and reported no errors. These checks cover default UNDRR LTR specimens. Wrapped inline link focus, arbitrary error counts, RTL and script-specific typography remain pending.

**Instance override acceptance** has four explicit groups: ComboBox + Radio, Details + closed Select, TOC links + numbered list, and all seven Status Label shapes. The latter prepares an open BelowMedium390 Details with edited long Title/Paragraph and an Invalid Select with short Value and edited label/help/error/booleans, both at a fixed 240px consumer width. Save the preparation report, build only the group's families with review refresh off, then compare and save the comparison report. Details + Select passed 274 native preservation assertions after an ordinary rebuild that created zero nodes and updated 303; exact cleanup removed 20 probes with none retained. Width and FIXED/HUG sizing are explicit checks for this group; other bounds remain diagnostics, not source-fidelity assertions. The comparison is read-only; cleanup retains changed or foreign content. A saved root ID recovers the ledger after plugin restart. See the [acceptance runbook](MAINTAINING-KIT.md#check-edited-native-instances).

### Editorial CTA is under native review

The 23 editorial CTA recipes extend the conventional Button with the source circular chevron action used by Hero. The first desktop build succeeded, including source-coloured review wrappers, but actual inspection found every Label inherited the final Focus style. Default and Hover typography are therefore not yet accepted. Shared-text-property propagation, consumer underline offsets and finite-width resizing are being checked in isolated native probes. See [the recorded findings](LEARNINGS.md#editorial-cta-construction-and-a-text-property-mismatch); do not treat passing mock construction as a faithful rendered component.

The **Editorial CTA consumer acceptance** panel creates three temporary instances, exercises short/French/unbroken labels at finite widths and records actual text, font, badge and constraint readbacks. Save its full operation report before closing. Rebuild Editorial CTA with review refresh off, then compare against the saved baseline. Cleanup can recover the exact shared ledger from the saved Editorial root ID after restart. Failures remain in the report and do not authorise repairs to canonical components; the current styling mismatch is expected to fail those checks.

### Loader and Compact Empty State checkpoint on 4 October 2026

Loader adds two static source presets: BelowMedium 40px with an 8px ring and MediumUp 96px with a 14px ring. Native ellipse sectors retain the source blue body and neutral top band. The blue sector uses a positive 270-degree sweep crossing a full turn; reducing its endpoint modulo a full turn changed the native geometry and was corrected. Rotation, reduced-motion behaviour, live breakpoint switching and accessibility semantics remain code responsibilities.

Compact Empty State adds Plain/Panel × Centre/Start, with editable Description, optional Show media and the exact source tray SVG bound to its colour role. Roboto Regular 14px/21px and PRETTY wrapping belong to its required shared style. The source 440px description cap binds to a FILL/HUG FRAME, since native Figma rejects maxWidth variable binding on TEXT. Four bounded default-UNDRR source comparisons passed; arbitrary edited descriptions, live media-token scaling, RTL, all-brand rendering and font-file equivalence remain unverified.

The new-family ordinary repeat created zero nodes and updated 74 with no errors. Final inspection records 394 variables, 39 local text styles, eight effects, 23 sets, 272 components including the historical diagnostic, 5,221 nodes and 752 instances, with no inspection errors. All 5,528 preceding inspected IDs survived; the current inventory contains 5,663 IDs. The full text audit matched 561/561 paths and retained the older 51 Tabs-font/editorial-CTA findings; the four newest families' 79 paths added none. All 20 temporary Details/Select probe IDs are absent, and a fresh local backup is saved. Cloud sync remains unconfirmed. Professional migration should begin with a fresh inspection and backup, then verify all five modes and an actual consuming-file update; these new local families do not complete publication acceptance.

### TOC and Status Label checkpoint on 4 October 2026

The export now contains 416 variables, 91 text definitions, eight effects and 293 recipe variants across 26 families. Native inspection records 43 local text styles, 26 sets, 294 components including one historical diagnostic, 5,666 nodes and 817 instances, with no inspection errors. The full saved-field audit matches 601/601 main TEXT paths and retains the same 51 older Tabs/Editorial CTA findings. TOC and Status Label's 40 scoped paths add none; 12 TOC labels use the explicit directly applied source typography exception described above.

TOC ordinary repeats create zero nodes and update 172. Six edited consumers at 240/390/900px pass 2,819 assertions, including nested labels, Title, alignment, typography, range paints, widths and IDs. Status Label's seven edited consumers pass 816 assertions through a zero-created/83-updated repeat. Strict cleanup removes 106 TOC and 36 Status Label temporary nodes with none retained. Native rendering was reviewed at normal scale and a fresh local backup is saved; cloud sync remains unconfirmed. Source glyph/font-file equality, arbitrary responsive widths, grouped Status layouts, bulleted TOC, broader scripts/brands and publication remain pending. See [the measured findings and precision checks](LEARNINGS.md) before adding or changing these recipes.
