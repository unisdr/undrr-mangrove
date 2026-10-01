# Mangrove tokens for Figma (exploratory)

A spike, stacked on the React Aria pilot (unisdr/undrr-mangrove#1088). It turns `tokens/*.yaml` into Figma Variables so a Figma kit can use the same spacing, colour and theme layers as the code. Nothing here is published or supported yet.

## How it fits together

```
tokens/*.yaml ──> scripts/build-figma-tokens.cjs ──> mangrove-variables.json ──> this plugin ──> Figma Variables
(same merge and resolve as build-tokens.cjs)          (generated, not committed)
```

- One collection, **Mangrove**, with one mode per brand: UNDRR, DELTA Resilience, IRP, MCR2030 and PreventionWeb. Switching a frame's mode re-themes it, which is the Figma equivalent of `.mg-theme-*`. Figma Professional allows 10 modes per collection.
- Aliases follow the YAML. `color/button-background` aliases `color/interactive`, which aliases `color/blue-900` in UNDRR and `brand/primary` in PreventionWeb. A value that CSS derives with an alpha cast is stored as resolved RGBA, because Figma aliases cannot change opacity.
- Brand primitives marked `$private` are imported but hidden from publishing.
- `control/*` comes from `_control-tokens.scss` (the roles the ComboBox uses) and `font-family/*` from `_variables.scss`.
- Every variable carries its CSS name as Dev Mode code syntax, for example `rgb(var(--mg-color-interactive))`, so developers inspecting a design see the token to use.
- Two-value shorthands become `/block` and `/inline` pairs (`padding/button/block`, `padding/button/inline`) that bind to auto layout's vertical and horizontal padding.

Not imported, with the reason listed in the JSON's `skipped` array: shadows, durations and easings (no Figma variable type), percentages and `em` line heights, four-value shorthands, and `none`.

## Usage

### Requirements

- The Figma **desktop app**. Development plugins cannot be imported in the browser.
- A Figma plan with at least five modes per variable collection. Professional allows 10. On a plan with fewer, untick brands at import time.
- A checkout of this branch with dependencies installed (`yarn install`).

### 1. Generate the variables file

From the repository root:

```sh
yarn build:figma-tokens
```

This writes `examples/figma-plugin/mangrove-variables.json` and prints how many variables, modes and skipped tokens it found. The file is build output and is not committed, so regenerate it on whichever branch holds the tokens you want.

### 2. Install the plugin (once per designer)

1. Open the Figma desktop app and any design file.
2. Go to **Plugins > Development > Import plugin from manifest...**.
3. Choose `examples/figma-plugin/manifest.json` from your checkout.

The plugin now appears under **Plugins > Development**. On a Professional plan, plugins cannot be published privately to a team, so each designer who runs the import repeats this step. Only the person who maintains the library file needs it.

### 3. Import into the library file

1. Open the Figma file that will be the Mangrove library. Use a dedicated file, not a project file.
2. Run **Plugins > Development > Mangrove tokens (exploratory)**.
3. Choose the `mangrove-variables.json` you generated.
4. Leave all five brands ticked, then select **Import variables**.
5. Read the report in the plugin window: the counts, any errors, and the tokens that could not be represented.
6. Open **Local variables** to see the **Mangrove** collection, with one column per brand.

### 4. Publish and use

1. Publish the file as a library (**Assets > Libraries > Publish**). Private brand primitives stay out of the published list.
2. In a design file, enable the library, then bind fills, strokes, padding, gaps, radii and font sizes to Mangrove variables.
3. To preview a brand, select a frame, use the variable mode control in the **Layer** section of the right sidebar and choose the brand. Everything bound to Mangrove variables inside it re-themes.
4. In Dev Mode, bound values show their CSS name, for example `var(--mg-spacing-150)`.

### 5. Update after a token change

1. Pull the branch with the token change and run `yarn build:figma-tokens` again.
2. Run the plugin in the library file and import the new JSON. Existing variables are updated in place: they are matched by token id, so bindings in other files keep working and a renamed token renames its variable.
3. To delete variables whose token was removed from the YAML, tick **Remove Mangrove variables no longer in the file**. Without it, they are kept and listed as stale.
4. Publish the library update.

### Troubleshooting

| Message                            | Cause and fix                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Could not add mode "..."           | The plan's mode limit was reached. Untick brands, or split them across files.                           |
| Not a mangrove-variables.json file | The wrong file was chosen. Regenerate it with step 1.                                                   |
| alias target ... missing           | The JSON was edited by hand or is from a mixed build. Regenerate it.                                    |
| A variable shows the wrong type    | Its token changed type in YAML. The plugin deletes and recreates it, so rebind any layers that used it. |

The plugin runs locally in Figma and has no network access.

## What this spike does not cover yet

- Text styles. The variables exist (`font-family/*`, `font-size/*`), but styles need fonts loaded in Figma and a decision on which type roles to publish.
- Effect styles for `shadow/*` and the focus ring.
- Components. See [FIGMA-KIT-BRIEF.md](FIGMA-KIT-BRIEF.md) for a brief to give to Figma's AI, or to a designer.
- Code Connect, which links Figma components to the React source. It needs an Organization or Enterprise plan.
