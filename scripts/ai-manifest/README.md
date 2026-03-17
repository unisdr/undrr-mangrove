# AI manifest pipeline

This directory contains the scripts and curated data that produce AI-friendly component metadata deployed alongside Storybook. It runs automatically as part of `yarn build`.

## Pipeline overview

```
yarn build
│
├─ 1. scss compile
├─ 2. storybook build ──────────────► docs-build-temp/manifests/components.json
│                                     (props, types, story snippets from react-docgen)
├─ 3. webpack build ─────────────────► dist/components/*.js
│                                     (compiled React component bundles)
├─ 4. render-component-html.js
│     reads dist/components/*.js
│     renders with sample props via renderToStaticMarkup
│     writes ──────────────────────► docs-build-temp/ai-components/rendered-html.json
│
└─ 5. generate-ai-manifest.js
      reads manifests/components.json  (from step 2)
      reads rendered-html.json         (from step 4)
      reads data/                      (curated metadata + HTML)
      writes ──────────────────────► docs-build-temp/llms.txt
                                      docs-build-temp/llms.json
                                      docs-build-temp/ai-components/index.json
                                      docs-build-temp/ai-components/{id}.json (one per component)
                                      docs-build-temp/ai-components/utilities.json
```

CI (`storybook.yml`) runs `yarn build` (which generates the manifest as step 5), then runs `generate-ai-manifest.js --validate` as a separate check to catch stale curated data keys. The script executes twice: once to produce output, once to validate it.

## Data sources

Each component in the output gets its data merged from up to three sources:

| Source | What it provides | Maintenance |
|--------|-----------------|-------------|
| **Storybook manifest** (`components.json`) | Props, types, defaults, JSDoc descriptions, story code snippets, import statements | Automatic — generated from PropTypes and JSDoc in your component files |
| **Auto-rendered HTML** (`rendered-html.json`) | Formatted HTML output from `renderToStaticMarkup` | Automatic — auto-discovered from `dist/components/`, sample props in `SAMPLE_PROPS` |
| **Curated data** (`scripts/ai-manifest/data/`) | Descriptions, CSS class lists, `vanillaHtml`/`requiresReact` flags, `doNotModify` warnings, vanilla HTML examples, syndication embed docs | Manual — update when component markup or CSS classes change |

Auto-rendered HTML takes priority over curated HTML when both exist for the same component. Components with auto-rendered HTML get `renderedHtmlSource: "auto"` in their output JSON.

A component can have both `requiresReact: true` and auto-rendered HTML. The `requiresReact` flag tells consumers the component needs React at runtime; the auto-rendered HTML shows what the server-rendered output looks like for reference or initial page load.

---

## render-component-html.js

Renders built React components from `dist/components/` with sample props using `renderToStaticMarkup`. Produces formatted HTML that is always in sync with the actual component output.

### Usage

```bash
# Run directly (needs a prior webpack build so dist/ exists)
node scripts/ai-manifest/render-component-html.js

# Custom build directory
node scripts/ai-manifest/render-component-html.js --build-dir=docs-build-temp
```

### How it works

The script auto-discovers all `.js` files in `dist/components/` and matches each to a component ID via the `COMPONENT_IDS` mapping. For each component:
1. Import the built module from `dist/components/`
2. Look up sample props in `SAMPLE_PROPS` (or use `{}` if none defined)
3. Render via `renderToStaticMarkup` and format with Prettier
4. Skip components that error (browser APIs) or produce trivial output

### When to use auto-rendering vs. curated HTML

Use auto-rendering when the component has a webpack entry and renders in Node.js without browser APIs. Use curated HTML when the component needs `document`/`window` at render time, or the example is a composition of multiple components (page templates).

### Adding a new auto-rendered component

1. Add a webpack entry in `webpack.config.js` (second config block)
2. Add a `COMPONENT_IDS` entry in `render-component-html.js` mapping the filename to the component-data ID
3. If the component needs non-empty props, add a `SAMPLE_PROPS` entry
4. Add metadata (description, flags) in `scripts/ai-manifest/data/component-data.js`
5. Run `node scripts/ai-manifest/render-component-html.js` to test

---

## generate-ai-manifest.js

Merges Storybook metadata, auto-rendered HTML, and curated data into the final output files. Depends on `render-component-html.js` having run first (both are chained in `yarn build`).

### Usage

```bash
# Run directly (needs storybook build + webpack + render-component-html first)
node scripts/ai-manifest/generate-ai-manifest.js

# Or via npm script
yarn generate-ai-manifest

# Validate curated data keys match the Storybook manifest (used in CI)
node scripts/ai-manifest/generate-ai-manifest.js --validate

# Custom build directory
node scripts/ai-manifest/generate-ai-manifest.js --build-dir=docs-build-temp
```

### Output

| File | Size | What's in it |
|------|------|--------------|
| `llms.txt` | ~2 KB | Plain-text project summary following the [llmstxt.org](https://llmstxt.org/) convention. |
| `llms.json` | ~2 KB | Structured JSON version with all URLs, required assets, and conventions. |
| `ai-components/index.json` | ~36 KB | Every component with name, description, `vanillaHtml`/`requiresReact` flags, quickstart with CDN URLs, breakpoints, and required page assets. |
| `ai-components/{id}.json` | 1-10 KB each | Props, rendered HTML, CSS classes, syndication docs, `doNotModify` warnings. |
| `ai-components/utilities.json` | ~25 KB | All ~161 CSS utility classes grouped by 12 categories. |

### The `--validate` flag

Runs four checks. The first two exit non-zero on failure; the last two are informational. Used in CI to catch problems before they reach production.

1. **Stale key detection** — every key in the curated data must match a component ID in the Storybook manifest. Catches drift after renames or removals.
2. **Accessibility lint** — scans curated HTML examples for common anti-patterns: `role="button"` on links, icon elements missing `aria-hidden`, redundant `role="navigation"` on `<nav>`, and unnamed `<section>` landmarks. Violations fail the build.
3. **CSS class validation** — checks that at least one class from `cssClasses` in curated data appears in the component's HTML examples. Warns when zero classes match, catching class lists that have completely drifted from the markup. This is informational, not a hard failure.
4. **PropTypes coverage** — reports how many components have documented props (extracted by react-docgen from PropTypes and JSDoc). This is informational, not a hard failure.

You can run validation locally via the npm script:

```bash
yarn validate-manifest
```

---

## Curated data files (`scripts/ai-manifest/data/`)

### `constants.js`

Single source of truth for asset URLs, required scripts, and logo paths. All version-dependent URLs use `{{version}}` tokens replaced at build time. Change a URL here and it propagates to all output files.

### `component-data.js`

All component metadata in a single file, keyed by Storybook component ID. Auto-rendered components need only `description` and flags. Curated `examples` are kept for components that can't render in Node.

| Field | Type | Purpose |
|-------|------|---------|
| `vanillaHtml` | boolean | Works as static HTML/CSS without React |
| `requiresReact` | boolean | Needs React runtime to function |
| `reactNote` | string | Why React is required |
| `description` | string | Fallback when Storybook has no description |
| `doNotModify` | string | Branding requirement warning |
| `examples` | array | `[{ name, html }]` curated HTML (only for non-auto-rendered) |
| `cssClasses` | string[] | BEM classes (only for curated components) |
| `vanillaHtmlEmbed` | object | Embed instructions (Footer syndication) |

**Adding a new component:** Add an entry keyed by the Storybook ID (e.g., `components-cards-vertical-card`). The ID comes from the story title path.

### `css-utilities.js`

Structured inventory of CSS utility classes. Update when you add, rename, or remove utility classes in SCSS.

---

## See also

- [AI and MCP integration guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-ai-and-mcp-integration--docs) — consumer-facing docs for directing agents to Mangrove
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md#ai-manifest-for-component-discovery) — contributor-facing summary of what to update
- [`docs/RELEASES.md`](../../docs/RELEASES.md) — release checklist includes manifest validation step
