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
| **Auto-rendered HTML** (`rendered-html.json`) | Formatted HTML output from `renderToStaticMarkup` | Automatic — generated from `RENDER_SPECS` in `render-component-html.js` |
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

The script has a `RENDER_SPECS` array where each entry defines:
- `file` — the component filename in `dist/components/` (without `.js`)
- `componentId` — the Storybook component ID (must match the manifest)
- `variants` — array of `{ name, props }` objects, each rendered separately

```js
{
  file: 'QuoteHighlight',
  componentId: 'components-quotehighlight',
  variants: [
    {
      name: 'Quote with attribution',
      props: { quote: '...', attribution: '...', backgroundColor: 'light', variant: 'line', alignment: 'full' },
    },
  ],
}
```

### When to use auto-rendering vs. curated HTML

Use auto-rendering when:
- The component has a webpack entry in `dist/components/`
- It renders cleanly in Node.js (no browser APIs like `document`, `window`), or its browser dependencies can be mocked (see below)
- The rendered HTML is representative of what a vanilla HTML consumer would write

The render script mocks DOMPurify for Node.js so components that use it for HTML sanitization (e.g., IconCard) can be auto-rendered. The mock passes strings through unchanged, which is safe because the sample props are controlled by `RENDER_SPECS`.

Use curated HTML when:
- The component is CSS-only (Container, Grid, HighlightBox) — no JS to render
- The component needs browser APIs that can't be trivially mocked (ShareButtons uses `document`)
- The example is a composition of multiple components (page templates)

### Adding a new auto-rendered component

1. Add an entry to `RENDER_SPECS` in `render-component-html.js`
2. Optionally add metadata (description, cssClasses, flags) in `scripts/ai-manifest/data/component-data/{category}.js`
3. Run `node scripts/ai-manifest/render-component-html.js` to test
4. The manifest script will prefer the auto-rendered HTML over any curated `examples`

### Currently auto-rendered

QuoteHighlight, StatsCard, Pager, MegaMenu, SyndicationSearchWidget, IconCard

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

Runs four checks and exits non-zero if any fail. Used in CI to catch problems before they reach production.

1. **Stale key detection** — every key in the curated data must match a component ID in the Storybook manifest. Catches drift after renames or removals.
2. **Accessibility lint** — scans curated HTML examples for common anti-patterns: `role="button"` on links, icon elements missing `aria-hidden`, redundant `role="navigation"` on `<nav>`, and unnamed `<section>` landmarks. Violations fail the build.
3. **CSS class validation** — checks that `cssClasses` listed in curated data actually appear in the component's HTML examples. Catches class lists that have drifted from the markup.
4. **PropTypes coverage** — reports how many components have documented props (extracted by react-docgen from PropTypes and JSDoc). This is informational, not a hard failure.

You can run validation locally via the npm script:

```bash
yarn validate-manifest
```

---

## Curated data files (`scripts/ai-manifest/data/`)

### `constants.js`

Single source of truth for asset URLs, required scripts, logo paths, and reusable HTML snippets (PageHeader, Footer, closing scripts). All version-dependent URLs use `{{version}}` tokens replaced at build time.

Change a URL here and it propagates to all output files. Do not hardcode asset URLs anywhere else.

### `component-data/{category}.js`

Per-component metadata and curated HTML, split by category (cards, forms, layout, etc.). Each file exports a default object keyed by Storybook component ID.

**Entry schema:**

```js
// Minimal entry (auto-rendered component, metadata only)
'components-quotehighlight': {
  vanillaHtml: true,
  description: 'Testimonial quote with attribution and portrait.',
  cssClasses: ['mg-quote-highlight', 'mg-quote-highlight--light', ...],
  // renderedHtml auto-generated from dist/components/QuoteHighlight.js
},

// Full curated entry (CSS-only or browser-dependent component)
'components-cards-vertical-card': {
  vanillaHtml: true,
  description: 'Card with stacked image, labels, title, summary, and CTA button.',
  cssClasses: ['mg-card', 'mg-card__vc', ...],
  examples: [
    { name: 'Default vertical card', html: '<article class="mg-card mg-card__vc">...</article>' },
  ],
},

// React-only component (no HTML examples)
'components-charts-barchart': {
  requiresReact: true,
  reactNote: 'BarChart uses D3. Import via npm.',
},
```

**Available fields:**

| Field | Type | Purpose |
|-------|------|---------|
| `vanillaHtml` | boolean | Works as static HTML/CSS without React |
| `requiresReact` | boolean | Needs React runtime to function |
| `reactNote` | string | Why React is required (for React-only components) |
| `description` | string | Fallback when the Storybook manifest has no description |
| `doNotModify` | string | Warning that markup is a branding requirement |
| `examples` | array | `[{ name, html }]` curated HTML snippets |
| `cssClasses` | string[] | BEM classes the component uses |
| `vanillaHtmlEmbed` | object | Embed instructions (Footer syndication) |

`vanillaHtml` and `requiresReact` are mutually exclusive.

**Adding a new component:** Find the right category file (or create one and import it in `index.js`), add the entry keyed by the component's Storybook ID (e.g., `components-cards-vertical-card`). The ID comes from the story title path — check `docs-build-temp/ai-components/` for existing IDs.

### `css-utilities.js`

Structured inventory of CSS utility classes. Update when you add, rename, or remove utility classes in SCSS.

### `component-data/index.js`

Barrel file that imports all category files and merges them. If you create a new category file, import it here. Keys must be unique across all files — duplicates are silently overwritten by the last import.

---

## See also

- [AI and MCP integration guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-ai-and-mcp-integration--docs) — consumer-facing docs for directing agents to Mangrove
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md#ai-manifest-for-component-discovery) — contributor-facing summary of what to update
- [`docs/RELEASES.md`](../../docs/RELEASES.md) — release checklist includes manifest validation step
