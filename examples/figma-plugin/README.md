# Mangrove tokens for Figma (exploratory)

A spike, stacked on the React Aria pilot (unisdr/undrr-mangrove#1088). It turns Mangrove's tokens into local Figma variables, text styles and effect styles so a Figma kit can use the same spacing, colour and theme layers as the code. Nothing here is published or supported yet.

## How it fits together

```
tokens/*.yaml + SCSS ──> scripts/build-figma-tokens.cjs ──> mangrove-variables.json ──> this plugin ──> Figma variables and styles
(same merge and resolve as build-tokens.cjs)          (generated, not committed)
```

- One collection, **Mangrove**, with one mode per brand: UNDRR, DELTA Resilience, IRP, MCR2030 and PreventionWeb. Switching a frame's mode re-themes it, which is the Figma equivalent of `.mg-theme-*`. Figma Professional allows 10 modes per collection.
- Aliases follow the YAML. `color/button-background` aliases `color/interactive`, which aliases `color/blue-900` in UNDRR and `brand/primary` in PreventionWeb. A value that CSS derives with an alpha cast is stored as resolved RGBA, because Figma aliases cannot change opacity.
- Brand primitives marked `$private` are imported but hidden from publishing.
- `control/*` comes from `_control-tokens.scss` (the roles the ComboBox uses) and `font-family/*` from `_variables.scss`.
- Source variables carry their CSS name as Dev Mode code syntax, for example `rgb(var(--mg-color-interactive))`, so developers inspecting a design see the token to use. Derived effect helpers have descriptions explaining their source; the focus extent also carries a CSS calculation.
- Two-value shorthands become `/block` and `/inline` pairs (`padding/button/block`, `padding/button/inline`) that bind to auto layout's vertical and horizontal padding.

Not represented as variables, with the reason listed in the JSON's `skipped` array: shadows, durations and easings (no Figma variable type), percentages and `em` line heights, four-value shorthands, and `none`. Raised shadows are represented as effect styles instead.

Current output: **219 variables**, five brands, **60 text style choices** (12 selected by default), **three effect styles**, and 16 tokens skipped as variables. The two additional variables preserve the raised shadow's alpha and the focus ring's outer extent when switching brands.

### Text and effect foundations

The JSON's `styles` section holds values and binding names. The plugin chooses what to import, loads fonts, and applies those definitions; it does not hold a second set of design values.

| Text role | Default size steps                         | Family           |
| --------- | ------------------------------------------ | ---------------- |
| `text`    | `300`, `button`, `form-input`              | Roboto           |
| `heading` | `400`, `500`, `600`, `900`, `1000`, `1100` | Roboto           |
| `display` | `900`, `1000`                              | Roboto Condensed |
| `ui`      | `tab`                                      | Roboto Condensed |

Expand a role in the plugin to change the selection. All choices use **Regular** with **automatic line height**, with `fontFamily` bound to `font-family/*` and `fontSize` bound to `font-size/*`. These are foundations, not complete component typography: component weights, line heights and script-specific fonts need separate work. The SCSS `code` role uses a generic monospace stack, so no specific Figma font is exported for it.

The importer discovers exact font names with `listAvailableFontsAsync` and loads them with `loadFontAsync` before editing. An unavailable or unloadable font skips the affected text styles and appears in the report. Variables, effect styles and other text styles still import. Install or enable the missing font and re-import to complete the set; no fallback font is substituted.

| Effect style                   | Source and Figma representation                                                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mangrove/shadow/raised`       | `shadow.raised`: a zero-blur inner shadow, preserving the 1px inset border and 0.24 alpha through `effect-color/shadow/raised`.                                      |
| `Mangrove/shadow/raised-hover` | `shadow.raised-hover`: a zero-blur 2px inner shadow, colour bound to `color/interactive`.                                                                            |
| `Mangrove/focus-ring`          | `mg-focus-ring` in `_mixins.scss`: two zero-blur outward shadows, with a neutral separator over the coloured outer band. Colours and spreads are bound to variables. |

These shadows are inset borders in the CSS, not elevated drop shadows. The focus effect approximates a CSS outline; its geometry and effect ordering still need a desktop visual check. Figma documents spread support for rectangles, ellipses and filled frames with clipping enabled. Check the effect on the actual control shapes, including whether an ancestor clips the outward ring. The exporter fails if the focus mixin's supported recipe changes.

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

This writes `examples/figma-plugin/mangrove-variables.json` and prints the variable, mode, style and skipped token counts. The file is build output and is not committed, so regenerate it on whichever branch holds the tokens you want.

### 2. Install the plugin (once per designer)

1. Open the Figma desktop app and any design file.
2. Go to **Plugins > Development > Import plugin from manifest...**.
3. Choose `examples/figma-plugin/manifest.json` from your checkout.

The plugin now appears under **Plugins > Development**. On a Professional plan, plugins cannot be published privately to a team, so each designer who runs the import repeats this step. Only the person who maintains the library file needs it.

### 3. Import into the library file

1. Open the dedicated Figma Design file that will hold the Mangrove kit. A file in Drafts or a Starter team is limited to 1 mode. For all five modes, save it in a project that belongs to the Professional team.
2. Run **Plugins > Development > Mangrove tokens (exploratory)**.
3. Choose the `mangrove-variables.json` you generated.
4. On Starter or in Drafts, tick only one brand. In a Professional team file, leave all five brands ticked. Expand the text roles to choose sizes, and leave effect styles ticked to import the three effects. Select **Import variables and styles**.
5. Read the report in the plugin window: the counts, any errors, and the tokens that could not be represented.
6. Open **Local variables** to see the **Mangrove** collection, with one column per imported brand. In local styles, inspect the text and effect styles under **Mangrove**.

### On a file limited to 1 mode: brand switcher

A file in Drafts or a Starter team allows only 1 mode, so the five brands cannot sit side by side. Use the file as a brand switcher instead:

1. Run the plugin, untick every brand except one, and import. The single mode is named after that brand.
2. Bind your designs to the Mangrove variables as usual.
3. To see another brand, run the plugin again with only that brand ticked. Its values overwrite the mode in place and every bound layer in the file re-themes. Variables are reused, so no bindings break.

Limits: one brand is visible at a time, and Starter cannot publish libraries, so the variables, components and designs stay in this one file. Local text styles, effect styles and components can still be created and reused within the file. When the file moves to a Professional team project, import with all brands ticked: the existing mode is kept and the others are added. This migration and the brand switcher pass the mock harness; they still need a check in real Figma.

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
| A variable shows the wrong type                   | Its token changed type in YAML. The plugin deletes and recreates it, so rebind any layers that used it.                                                                                                                     |
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

The practical Starter route is to run the Mangrove development plugin in the desktop app. It imports variables and selected text and effect styles; component generation remains planned work. Keep one canonical kit file, bind components to the same variables and defer shared-library publishing. When Professional access is available, ask for a Full seat on your own account and edit access to the team file, move the kit into that team, then import all five brands. Joining a Professional team with a View or Dev seat does not meet the documented requirement for direct agent writes.

## Spike learnings

Keep observations separate from API documentation and mock results. Update this record as the spike is exercised in Figma.

| Finding                                                                            | Evidence and consequence                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Variables were created in the user's free file, but additional modes were rejected | User-reported desktop import: `Limited to 1 modes only`. The file can hold the token collection even when five brand modes are unavailable.                                                                                                                             |
| Removing absent WEB code syntax throws                                             | Observed in real Figma, fixed in the importer and reproduced by the mock. Remove syntax only when it is present. A complete desktop re-import after the fix remains unverified.                                                                                         |
| A single mode can be reused as a brand switcher                                    | All five brands pass the mock scenario without new variables. Visual re-theming and preserved bindings still need desktop verification.                                                                                                                                 |
| Text and effect styles are local foundations                                       | Implemented with documented variable bindings and font loading. The mock checks creation, stable IDs, missing-font recovery and selective imports. Desktop import and rendering remain unverified.                                                                      |
| `shadow.raised` and hover are inset outlines                                       | Confirmed in `tokens/mangrove.yaml`. Export as inner shadows, preserving the alpha cast with a derived colour variable. Do not infer elevation from the token name.                                                                                                     |
| A CSS outline needs a Figma approximation                                          | The focus mixin becomes two bound, zero-blur outward effects. The mock checks the 2px separator and 4px outer spread, but does not prove rendered geometry or ordering.                                                                                                 |
| A connected agent and a local development plugin have different constraints        | Remote canvas writes require a Full seat. The desktop importer has already run in the free file. Confirm the connector's API support before reusing desktop plugin code.                                                                                                |
| An installed connector may not expose tools to the active session                  | On 3 October 2026 the user confirmed connection and the Codex plugin catalog showed Figma enabled, but this session exposed no Figma tools. Local app inspection also failed with a native-pipe startup error. Neither result establishes an account or seat rejection. |
| An editable captured screen is not yet a reusable component kit                    | Kit acceptance needs native components, variants, auto layout, shared styles and variable bindings verified against Mangrove's source and rendered stories.                                                                                                             |

For each future change, record the source token or component, the Figma representation, the local verification, the desktop or connector observation and any remaining limitation. Preserve asset identities during updates so existing bindings and instances survive. The exporter remains the source of values: add style definitions to its JSON rather than duplicating values in the plugin.

## Checking changes without Figma

`dev/mock-figma.cjs` runs `code.js` against a small mock of the Figma variables and styles APIs. Six scenarios cover importing every brand, stable variable and style IDs on re-import, the 1-mode limit followed by adding modes, the brand switcher, unavailable and unloadable font recovery, selective style imports, renamed styles and older JSON without styles:

```sh
yarn build:figma-tokens
node examples/figma-plugin/dev/mock-figma.cjs
```

The mock copies the Figma behaviours that have caused bugs here, but it is not Figma. Confirm a change in the desktop app before relying on it.

## What this spike does not cover yet

- Desktop verification of text and effect style imports and rendered brand switching.
- Component typography, including weights, explicit line heights and Arabic fonts. The selectable Regular styles are foundations.
- Components. See [FIGMA-KIT-BRIEF.md](FIGMA-KIT-BRIEF.md) for a brief to give to Figma's AI, or to a designer.
- Code Connect, which links Figma components to the React source. It needs an Organization or Enterprise plan.
