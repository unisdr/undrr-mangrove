# Scripts

This directory contains utility scripts for the Mangrove project.

## update-cdn-version.js

Automatically updates all CDN links in documentation files to use the current version from `package.json` instead of "latest" or "testing" endpoints.

### Usage

```bash
# Run the script directly
node scripts/update-cdn-version.js

# Or use the npm script
yarn update-cdn-version
```

### What it does

1. Reads the current version from `package.json`
2. Updates all documentation files to replace:
   - `https://assets.undrr.org/testing/static/mangrove/latest/` → `https://assets.undrr.org/static/mangrove/{version}/`
   - `https://assets.undrr.org/static/mangrove/latest/` → `https://assets.undrr.org/static/mangrove/{version}/`

### Files updated

- `README.md`
- `stories/Documentation/GettingStarted.mdx`
- `stories/Documentation/VanillaHtmlCss.mdx`
- `stories/Documentation/Intro.mdx`
- `stories/Components/StatsCardSlider/StatsCardSlider.mdx`
- `stories/Utilities/ShowMore/ShowMore.mdx`
- `stories/Atom/Layout/Grid/Grid.mdx`
- `docs/RELEASES.md`

### When to use

Run this script after each release to ensure all documentation points to the stable, versioned CDN assets instead of bleeding-edge ones.

## generate-ai-manifest.js

Turns Storybook's internal components manifest into static JSON files that AI agents can fetch from the deployed site. Runs automatically during `yarn build`, after `storybook build` and before `webpack`.

The problem it solves: Storybook is a single-page app, so agents that fetch the deployed URL get an empty HTML shell. This script produces static files at predictable URLs instead.

### Usage

```bash
# Run directly (needs a prior storybook build)
node scripts/generate-ai-manifest.js

# Or via npm script
yarn generate-ai-manifest

# Custom build directory
node scripts/generate-ai-manifest.js --build-dir=docs-build-temp
```

### Output

The script reads `docs-build-temp/manifests/components.json` (produced by Storybook's `experimentalComponentsManifest` feature, about 700 KB) and merges in curated data from `scripts/data/`, then writes:

| File | Size | What's in it |
|------|------|--------------|
| `llms.txt` | ~2 KB | Plain-text project summary following the [llmstxt.org](https://llmstxt.org/) convention. Points agents to the index and utilities. Includes vanilla HTML and React quick-start guides. |
| `ai-components/index.json` | ~30 KB | Every component with name, description, import statement, `vanillaHtml`/`requiresReact` flags, and a `detailsUrl` to the full file. |
| `ai-components/{id}.json` | 1-10 KB each | Props with types, defaults, and descriptions. React code examples from Storybook stories. Rendered HTML examples for vanilla HTML consumers. CSS class inventories. Syndication embed instructions where applicable. |
| `ai-components/utilities.json` | ~25 KB | All ~161 CSS utility classes grouped by category (layout, grid, colors, font sizes, animations, etc.) with descriptions and usage examples. |

These files go into `docs-build-temp/` and deploy to GitHub Pages alongside the Storybook site.

### Data sources

The script combines two sources:

1. **Storybook manifest** (`docs-build-temp/manifests/components.json`): Props from `PropTypes` and JSDoc `@param` tags, descriptions from JSDoc comments, code examples from story render functions, import statements from `src/index.js` exports.

2. **Curated data files** (`scripts/data/`):
   - `html-examples.js` — Rendered HTML snippets for each component, `vanillaHtml`/`requiresReact` flags, CSS class lists, and syndication embed instructions. Keyed by Storybook component ID.
   - `css-utilities.js` — Structured inventory of CSS utility classes grouped by category.

The script validates that every key in `html-examples.js` matches a component ID in the Storybook manifest and logs warnings for mismatches.

### Maintaining the curated data

When you change a component's HTML structure, update the corresponding entry in `scripts/data/html-examples.js`. When you add, rename, or remove utility classes, update `scripts/data/css-utilities.js`. These files are the only manual maintenance the manifest requires.

Many components currently have empty descriptions. Adding JSDoc comments to those components is the easiest way to improve what the manifest gives to agents.