# Scripts

This directory contains utility scripts for the Mangrove project.

## AI manifest pipeline

The AI manifest system produces static JSON files alongside the Storybook site so AI coding agents can discover and use Mangrove components without parsing the SPA. It runs automatically as part of `yarn build`.

### Pipeline overview

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
      reads scripts/data/              (curated metadata + HTML)
      writes ──────────────────────► docs-build-temp/llms.txt
                                      docs-build-temp/llms.json
                                      docs-build-temp/ai-components/index.json
                                      docs-build-temp/ai-components/{id}.json (one per component)
                                      docs-build-temp/ai-components/utilities.json
```

CI (`storybook.yml`) then runs `generate-ai-manifest.js --validate` as a check and deploys `docs-build-temp/` to GitHub Pages.

### Data sources

Each component in the output gets its data merged from up to three sources:

| Source | What it provides | Maintenance |
|--------|-----------------|-------------|
| **Storybook manifest** (`components.json`) | Props, types, defaults, JSDoc descriptions, story code snippets, import statements | Automatic — generated from PropTypes and JSDoc in your component files |
| **Auto-rendered HTML** (`rendered-html.json`) | Formatted HTML output from `renderToStaticMarkup` | Automatic — generated from `RENDER_SPECS` in `render-component-html.js` |
| **Curated data** (`scripts/data/`) | Descriptions, CSS class lists, `vanillaHtml`/`requiresReact` flags, `doNotModify` warnings, vanilla HTML examples, syndication embed docs | Manual — update when component markup or CSS classes change |

Auto-rendered HTML takes priority over curated HTML when both exist for the same component. Components with auto-rendered HTML get `renderedHtmlSource: "auto"` in their output JSON.

---

## render-component-html.js

Renders built React components from `dist/components/` with sample props using `renderToStaticMarkup`. Produces formatted HTML that is always in sync with the actual component output.

### Usage

```bash
# Run directly (needs a prior webpack build so dist/ exists)
node scripts/render-component-html.js

# Custom build directory
node scripts/render-component-html.js --build-dir=docs-build-temp
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
- It renders cleanly in Node.js (no browser APIs like `document`, `window`, DOMPurify)
- The rendered HTML is representative of what a vanilla HTML consumer would write

Use curated HTML when:
- The component is CSS-only (Container, Grid, HighlightBox) — no JS to render
- The component needs browser APIs (IconCard uses DOMPurify, ShareButtons uses `document`)
- The example is a composition of multiple components (page templates)

### Adding a new auto-rendered component

1. Add an entry to `RENDER_SPECS` in `render-component-html.js`
2. Optionally add metadata (description, cssClasses, flags) in `scripts/data/html-examples/{category}.js`
3. Run `node scripts/render-component-html.js` to test
4. The manifest script will prefer the auto-rendered HTML over any curated `examples`

### Currently auto-rendered

QuoteHighlight, StatsCard, Pager, MegaMenu, SyndicationSearchWidget

---

## generate-ai-manifest.js

Merges Storybook metadata, auto-rendered HTML, and curated data into the final output files. Depends on `render-component-html.js` having run first (both are chained in `yarn build`).

### Usage

```bash
# Run directly (needs storybook build + webpack + render-component-html first)
node scripts/generate-ai-manifest.js

# Or via npm script
yarn generate-ai-manifest

# Validate curated data keys match the Storybook manifest (used in CI)
node scripts/generate-ai-manifest.js --validate

# Custom build directory
node scripts/generate-ai-manifest.js --build-dir=docs-build-temp
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

Exits non-zero if any key in the curated data does not match a component ID in the Storybook manifest. Used in CI to catch stale entries after component renames or removals.

---

## Curated data files (`scripts/data/`)

### `constants.js`

Single source of truth for asset URLs, required scripts, logo paths, and reusable HTML snippets (PageHeader, Footer, closing scripts). All version-dependent URLs use `{{version}}` tokens replaced at build time.

Change a URL here and it propagates to all output files. Do not hardcode asset URLs anywhere else.

### `html-examples/{category}.js`

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

### `html-examples/index.js`

Barrel file that imports all category files and merges them. If you create a new category file, import it here. Keys must be unique across all files — duplicates are silently overwritten by the last import.

---

## update-cdn-version.js

Updates all CDN links in documentation files to use the current version from `package.json`.

### Usage

```bash
node scripts/update-cdn-version.js
yarn update-cdn-version
yarn update-cdn-version --dry-run  # preview changes
```

### Files updated

- `README.md`
- `stories/Documentation/GettingStarted.mdx`
- `stories/Documentation/VanillaHtmlCss.mdx`
- `stories/Documentation/Intro.mdx`
- `stories/Components/StatsCardSlider/StatsCardSlider.mdx`
- `stories/Utilities/ShowMore/ShowMore.mdx`
- `stories/Atom/Layout/Grid/Grid.mdx`
- `docs/RELEASES.md`

Run this after each release to ensure documentation points to stable, versioned CDN assets.
