# Mangrove tokens for Figma (exploratory)

A spike, stacked on the React Aria pilot (unisdr/undrr-mangrove#1088). It turns Mangrove's tokens into local Figma variables, text styles, effect styles and native component recipes so a Figma kit can use the same spacing, colour and theme layers as the code. Nothing here is published or supported yet.

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

Not represented as variables, with the reason listed in the JSON's `skipped` array: shadows, durations and easings (no Figma variable type), percentages and `em` line heights, four-value shorthands, and `none`. Raised shadows are represented as effect styles instead.

Current output adds source-backed component roles to the original 219-variable bridge. It includes 60 Regular text foundations (12 selected by default), seven component text styles and four effect styles. Read the build report for current totals. Component recipes cover 41 variants across six families; 16 tokens remain skipped as variables.

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

| Effect style                   | Source and Figma representation                                                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mangrove/shadow/raised`       | `shadow.raised`: a zero-blur inner shadow, preserving the 1px inset border and 0.24 alpha through `effect-color/shadow/raised`.                                      |
| `Mangrove/shadow/raised-hover` | `shadow.raised-hover`: a zero-blur 2px inner shadow, colour bound to `color/interactive`.                                                                            |
| `Mangrove/focus-ring`          | `mg-focus-ring` in `_mixins.scss`: two zero-blur outward shadows, with a neutral separator over the coloured outer band. Colours and spreads are bound to variables. |

These shadows are inset borders in the CSS, not elevated drop shadows. The focus effect approximates a CSS outline; opaque diagnostic shapes have been rendered in Figma to compare ordering. Figma paints the later effect over the earlier one, so the coloured outer spread precedes the white separator. Actual control and inset rendering still need checking. Figma documents spread support for rectangles, ellipses and filled frames with clipping enabled. Check the effect on the actual control shapes, including whether an ancestor clips the outward ring. The exporter fails if the focus mixin's supported recipe changes.

API references: [TextStyle](https://developers.figma.com/docs/plugins/api/TextStyle/), [effect variable bindings](https://developers.figma.com/docs/plugins/api/figma-variables/) and [effect geometry](https://developers.figma.com/docs/plugins/api/Effect/).

## Usage

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
5. Read the report in the plugin window: the counts, any errors, and the tokens that could not be represented.
6. Open **Local variables** to see the **Mangrove** collection, with one column per imported brand. In local styles, inspect the text and effect styles under **Mangrove**.

### On a file limited to 1 mode: brand switcher

A file in Drafts or a Starter team allows only 1 mode, so the five brands cannot sit side by side. Use the file as a brand switcher instead:

1. Run the plugin, untick every brand except one, and import. The single mode is named after that brand.
2. Bind your designs to the Mangrove variables as usual.
3. To see another brand, run the plugin again with only that brand ticked. Its values overwrite the mode in place and every bound layer in the file re-themes. Variables are reused, so no bindings break.

Limits: one brand is visible at a time, and Starter cannot publish libraries, so the variables, components and designs stay in this one file. Local text styles, effect styles and components can still be created and reused within the file. When the file moves to a Professional team project, import with all brands ticked: the existing mode is kept and the others are added. This migration and the brand switcher pass the mock harness; they still need a check in real Figma.

### Build and inspect the native kit

Import one brand first, then select families and choose **Build selected components**. Dependencies are built first. The generated kit contains main components outside **Mangrove / Review**, where editable instances show states, long labels and narrow examples.

| Family               | Variants |
| -------------------- | -------: |
| Button               |       16 |
| Text input           |        6 |
| ComboBox option      |        6 |
| ComboBox             |        6 |
| Tab trigger          |        6 |
| Horizontal pill Tabs |        1 |

The JSON `components` section owns typography, geometry, token bindings and source references. Rebuilding updates owned nodes in place, preserves property IDs and keeps review instance overrides. Unexpected node types or ambiguous identities are rejected. User additions are retained and obsolete owned children are reported. A failed update to an existing family can retain partial changes; inspect the report before continuing.

Composed Tabs exposes the nested trigger properties; open ComboBox exposes its nested options. Review label targets follow the recipe anatomy, and responsive formatting is seeded only on new specimens. These updates need their real-file rebuild and editor check. See [the source measurements and acceptance record](LEARNINGS.md#browser-acceptance-measurements).

**Inspect kit and fonts** records actual IDs, resolved consumer bindings and font-load results. **Save inspection report** downloads that JSON. **Focus diagnostics** compares literal effect order with bound styles; PNG export buttons capture review frames. These are local development operations and do not publish a library.

Stable public token and component identities use shared plugin data in namespace `orgundrrmangrove`. Desktop imports also read legacy private IDs and reject conflicting ownership. Shared metadata contains no workflow ledger, account information or secrets. See [Figma shared plugin data](https://developers.figma.com/docs/plugins/api/properties/nodes-setsharedplugindata/).

### Drive the same recipes through the connector

When `use_figma` is available, generate a bounded script from the same runtime:

```sh
node scripts/build-figma-connector.cjs import undrr > /tmp/mangrove-import.js
node scripts/build-figma-connector.cjs build undrr button > /tmp/mangrove-button.js
node scripts/build-figma-connector.cjs build undrr text-input > /tmp/mangrove-input.js
node scripts/build-figma-connector.cjs build undrr combobox > /tmp/mangrove-combobox.js
node scripts/build-figma-connector.cjs build undrr tabs > /tmp/mangrove-tabs.js
node scripts/build-figma-connector.cjs inspect undrr > /tmp/mangrove-inspect.js
```

Pass the emitted JavaScript to `use_figma` after loading its skill. The builder includes nested component dependencies, trims other brands, compresses data with a local codec and rejects payloads over 50,000 characters or bytes. It does not use `eval` or fetch code. Connector execution uses shared metadata only: first migrate legacy private identities through the desktop importer, or verify unchanged unique names before adoption. Privately identified assets that were renamed cannot be recovered by the connector's name fallback.

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
| Remote MCP reads                         | Starter allowance of up to 20 tool calls per month; conserve reads                      | Full or Dev seats have higher limits                                                  |
| Direct agent canvas writes (`use_figma`) | A free account alone does not establish write eligibility; the docs require a Full seat | Confirm a Full seat and edit permission on the target file                            |
| Code Connect                             | Unavailable                                                                             | Still unavailable; requires an Organization or Enterprise plan and a Full or Dev seat |

Sources: [plans and features](https://help.figma.com/hc/en-us/articles/360040328273-Figma-plans-and-features), [publish a library](https://help.figma.com/hc/en-us/articles/360025508373-Publish-a-library), [MCP rate limits and access](https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/), [write to canvas](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/) and [Code Connect](https://developers.figma.com/docs/code-connect/). Recheck these when the account or plan changes.

The practical Starter route is to run the Mangrove development plugin in the desktop app. It imports variables and selected text and effect styles; component generation uses the exporter recipes described above. Keep one canonical kit file, bind components to the same variables and defer shared-library publishing. When Professional access is available, ask for a Full seat on your own account and edit access to the team file, move the kit into that team, then import all five brands. Joining a Professional team with a View or Dev seat does not meet the documented requirement for direct agent writes.

## Spike learnings

Keep observations separate from API documentation and mock results. Update this record as the spike is exercised in Figma.

| Finding                                                                            | Evidence and consequence                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Variables were created in the user's free file, but additional modes were rejected | User-reported desktop import: `Limited to 1 modes only`. The file can hold the token collection even when five brand modes are unavailable.                                                                                                                                                                                                                                                                                                                                             |
| Removing absent WEB code syntax throws                                             | Observed in real Figma, fixed in the importer and reproduced by the mock. Remove syntax only when it is present. The later desktop re-import updated all 219 variables without code syntax errors.                                                                                                                                                                                                                                                                                      |
| A single mode can be reused as a brand switcher                                    | All five brands pass the mock scenario without new variables. Visual re-theming and preserved bindings still need desktop verification.                                                                                                                                                                                                                                                                                                                                                 |
| Text and effect styles are local foundations                                       | Implemented with documented variable bindings and font loading. The mock checks creation, stable IDs, missing-font recovery and selective imports. Desktop import created nine text styles and all three effects; re-import updated them without new styles. Three Roboto Condensed styles initially failed to load in the desktop app; the later connector import created them successfully. Full control rendering remains pending.                                                   |
| `shadow.raised` and hover are inset outlines                                       | Confirmed in `tokens/mangrove.yaml`. Export as inner shadows, preserving the alpha cast with a derived colour variable. Do not infer elevation from the token name.                                                                                                                                                                                                                                                                                                                     |
| A CSS outline needs a Figma approximation                                          | The focus mixin becomes two bound, zero-blur outward effects. Rendered opaque diagnostics showed that the neutral effect must follow the outer effect. This correction is tested locally; the current file still needs the corrected import.                                                                                                                                                                                                                                            |
| A connected agent and a local development plugin have different constraints        | Remote canvas writes require a Full seat. The desktop importer has already run in the free file. Confirm the connector's API support before reusing desktop plugin code.                                                                                                                                                                                                                                                                                                                |
| An installed connector may not expose tools to the active session                  | On 3 October 2026 the user confirmed connection and the Codex plugin catalog showed Figma enabled, but this session exposed no Figma tools. Local app inspection initially failed with a native-pipe startup error, then worked on the follow-up turn and enabled the desktop import. Tools became available during the later autonomous iteration and canvas writes succeeded. The account reported a Full seat on Starter; subsequent reads and writes reached the Starter allowance. |
| Native component scaffolds require rendering and source comparison                 | Six native component sets now exist with variants, auto layout and bindings. Button and Text input repeat updates preserve IDs. Remaining visual gates are recorded in LEARNINGS.md.                                                                                                                                                                                                                                                                                                    |

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
- Button and Text input rebuilt with zero new nodes, unchanged variant/property IDs and no reported errors. ComboBox and Tabs still need their real-file repeat and visual checks.
- A rendered Button review exposed zero-width captions. Explicit text widths fixed the layout. Its narrow specimen also needs the newer responsive label update.
- Opaque focus diagnostics confirmed the paint-order issue. The source now reverses the effect order, provides transparent stroke geometry for outline Button and Tab focus and corrects InvalidFocused Text input according to CSS specificity. The newest generated output contains 244 variables, but the tool allowance blocked applying this correction to the file.
- The connector truncates returned text at 20 kB. Bounded inspection summaries and selected-node reports keep results parseable; desktop reports can retain the full inventory.
- Screenshot reads reached the Starter allowance. A subsequent foundation update through `use_figma` was also rejected. Further real-file checks need restored connector allowance or working desktop control. No plan or permission changes were made.

See [LEARNINGS.md](LEARNINGS.md) for source findings, evidence boundaries and the next acceptance checks.

## Checking changes without Figma

`dev/mock-figma.cjs` runs the importer and identity helper against a small mock of the Figma variables and styles APIs. Ten scenarios cover importing every brand, stable variable and style IDs on re-import, the 1-mode limit followed by adding modes, the brand switcher, unavailable and unloadable font recovery, selective style imports, renamed styles and older JSON without styles:

```sh
yarn build:figma-tokens
node examples/figma-plugin/dev/mock-figma.cjs
node examples/figma-plugin/dev/mock-kit.cjs
```

The kit harness additionally checks native identity and properties, instance overrides, dependency and font blocking, transparent focus geometry, codec transport and the actual API restrictions encountered.

The mock copies the Figma behaviours that have caused bugs here, but it is not Figma. Confirm a change in the desktop app before relying on it.

## What this spike does not cover yet

- Desktop font-loading recovery. The connector has completed the three missing styles; the desktop failure cause remains unestablished.
- Rendered effects and brand switching on actual bound nodes. Import and repeat updates have been checked in the desktop app.
- Browser comparison of component font matching and line heights, plus Arabic font routing. Source-backed component text styles are separate from the selectable Regular foundations.
- Rendered source comparison and broader component coverage. See [FIGMA-KIT-BRIEF.md](FIGMA-KIT-BRIEF.md) and [LEARNINGS.md](LEARNINGS.md).
- Code Connect, which links Figma components to the React source. It needs an Organization or Enterprise plan.
