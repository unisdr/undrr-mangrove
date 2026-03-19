# Architecture

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/ARCHITECTURE.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-architecture--docs).

This document explains the build system, distribution channels, and integration patterns for the Mangrove component library. It is the single reference for understanding how source code becomes consumable assets.

## Two webpack build targets

The webpack config (`webpack.config.js`) exports an array of two configs that produce different outputs:

### Config 1: Vanilla JS/CSS assets

```
stories/assets/js/ + stories/assets/scss/
  → webpack (glob entries via webpack.entries.js)
  → dist/js/*.min.js  +  dist/css/
```

- Entry points discovered dynamically via `webpack.entries.js`
- Output: UMD bundles with no React dependency
- Used for: standalone scripts (tabs, accordion, show-more, etc.) that work without React
- Also copies static assets (fonts, images, error pages) to `dist/assets/`

### Config 2: React component ES modules

```
stories/Components/*/ComponentName.hydrate.js  (or .jsx)
  → webpack (explicit entries in second config block)
  → dist/components/ComponentName.js
```

- Entry points explicitly listed in `webpack.config.js` (second config block)
- Output: ES modules with `react`, `react-dom`, and `react-dom/client` externalized
- Babel config: `configFile: false, babelrc: false` — ignores project `.babelrc.json` to avoid polyfill `require()` calls in ES module output
- Used for: React components consumed by Drupal (via import maps) or CDN

**Why two configs?** The vanilla JS needs UMD format with polyfills for older browser support. The React components need ES module format with React externalized so the host page provides a single shared React instance via import map.

### Adding a new entry

- **Vanilla JS**: Add the source file to `stories/assets/js/` — `webpack.entries.js` auto-discovers it
- **React component**: Add an explicit entry in the second config block of `webpack.config.js`

## CSS compilation pipeline

Component SCSS compiles into four theme-variant stylesheets, not per-component CSS files:

```
stories/assets/scss/
├── style.scss                  → Global UNDRR theme (default)
├── style-preventionweb.scss    → PreventionWeb theme
├── style-irp.scss              → IRP theme
├── style-mcr.scss              → MCR2030 theme
├── _components.scss            → Imports all component SCSS files
├── _variables.scss             → Design tokens (SCSS variables with !default)
├── _breakpoints.scss           → Responsive breakpoint mixins
└── _mixins.scss                → Shared SCSS mixins
```

**How it works:**

1. Each component has its own `.scss` file (e.g., `stories/Components/Pager/pager.scss`)
2. That file is `@import`-ed in `stories/assets/scss/_components.scss`
3. `_components.scss` is imported by each theme stylesheet
4. `yarn scss` compiles all four theme files to `stories/assets/css/`

**When adding a new component's SCSS:** Add the `@import` to `_components.scss`. The component's styles will then be included in all four theme outputs automatically.

**Important:** The `!default` flags on variables in `_variables.scss` allow each theme stylesheet to override tokens before the shared styles are processed.

## Component distribution channels

Components reach consumers through different channels depending on their registration:

| Component | webpack entry | src/index.js | Channel |
|-----------|:---:|:---:|---------|
| ShareButtons | `.hydrate.js` | Yes | webpack + npm |
| MegaMenu | `.hydrate.js` | Yes | webpack + npm |
| ScrollContainer | `.hydrate.js` | Yes | webpack + npm |
| QuoteHighlight | `.hydrate.js` | Yes | webpack + npm |
| SyndicationSearchWidget | `.hydrate.js` | Yes | webpack + npm |
| IconCard | `.hydrate.js` | Yes | webpack + npm |
| Gallery | `.hydrate.js` | Yes | webpack + npm |
| StatsCard | `.hydrate.js` | Yes | webpack + npm |
| Pager | `.hydrate.js` | Yes | webpack + npm |
| BarChart | `.jsx` | Yes | webpack + npm (no hydration) |
| MapComponent | `.jsx` | Yes | webpack + npm (no hydration) |
| Fetcher | `.jsx` | Yes | webpack + npm (no hydration) |
| CookieConsentBanner | — | Yes | npm only |
| Snackbar | — | Yes | npm only |

- **webpack + npm**: Produces a standalone `dist/components/ComponentName.js` bundle for Drupal/CDN, and is also importable from the npm package
- **npm only**: Importable via `import { X } from '@undrr/undrr-mangrove'` but has no `dist/components/` bundle for Drupal

To add a Drupal-integrated component: add its entry to both `webpack.config.js` (second config block) and `src/index.js`. For npm-only: add to `src/index.js` only. See [COMPONENT-GUIDE.md](COMPONENT-GUIDE.md) for the full walkthrough.

## Drupal integration flow

```
Mangrove source
  │
  │  yarn build
  ▼
dist/components/*.js ── copy ──▶ undrr_common/js/mangrove-components/*.js
                                  (committed to Drupal repo)
  │
  │  ES module imports via browser import map
  ▼
*-wrapper.js ── import ──▶ Component.js ── import ──▶ React (via esm.sh)
```

### Import map

Drupal does not bundle React. Instead, `undrr_common/js/mangrove-components.js` injects a browser import map that resolves:

- `react` → `https://esm.sh/react@19`
- `react-dom` → `https://esm.sh/react-dom@19`
- `@mangrove/*` → local paths to `mangrove-components/*.js`

The webpack build externalizes `react` and `react-dom` so component bundles stay small (they rely on the import map to provide React at runtime).

### Wrapper patterns

Two patterns exist for the Drupal-side wrapper scripts:

**Layered hydration (preferred):** Components with `.fromElement.js` + `.hydrate.js` use the shared `createHydrator` runtime. The wrapper is three lines:

```js
import createHydrator from "@mangrove/hydrate";
import Component, { fromElement } from "@mangrove/ComponentName";
createHydrator({ selector: "[data-mg-component-name]", component: Component, fromElement });
```

See [HYDRATION.md](HYDRATION.md) for the full API and patterns.

**Legacy wrapper:** Older components without hydration files use hand-written wrappers that call `document.querySelectorAll()`, parse `data-*` attributes, and call `createRoot()` directly. These are being migrated to the layered pattern.

### CSS deployment

CSS is **not** auto-synced. After SCSS changes:

1. Run `yarn scss` to compile
2. Manually copy the compiled CSS to each Drupal child theme's `css/mangrove/mangrove.css`
3. Commit the updated CSS in the Drupal repository

See [DEVELOPMENT.md](DEVELOPMENT.md) for the list of child themes and the copy workflow.

### Key Drupal-side files

| File | Purpose |
|------|---------|
| `undrr_common/undrr_common.libraries.yml` | Declares `mangrove-components` library |
| `undrr_common/undrr_common.info.yml` | Attaches library globally |
| `undrr_common/js/mangrove-components.js` | Injects React import map |
| `undrr_common/js/mangrove-components/*.js` | Built components + wrapper scripts |
| `{child-theme}/css/mangrove/mangrove.css` | Compiled theme CSS |

## AI manifest pipeline

The build produces AI-friendly component metadata alongside Storybook so coding agents can discover and use components accurately. The pipeline auto-generates from Storybook and component rendering, with some curated data maintained manually.

The pipeline lives in `scripts/ai-manifest/` (3 files: `generate-ai-manifest.js`, `component-data.js`, `css-utilities.js`). See the header comment in `generate-ai-manifest.js` for details.

## Known technical constraints

### Babel loose mode

`preset-env` with `loose: true` breaks Set/iterable spread (`[...set]` becomes `[].concat(set)`). The `loose` option was removed from `.babelrc.json` — do not re-add it.

### d3 submodule imports

The d3 monolith import was replaced with submodule imports (`d3-selection`, `d3-scale`, `d3-array`, `d3-axis`) to reduce bundle size. Import from submodules, not from `d3`.

### Module-level mutable state

Never use module-level `Set`, `Map`, `Array`, or counters to track state across function calls. These persist between component instances and cause cross-instance bugs. Always declare mutable tracking variables inside the function scope. See [ComponentContribution.mdx](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-component-standards--docs) for the full anti-pattern explanation.

### React 19 defaultProps deprecation

`Component.defaultProps` is deprecated in React 19. Use destructured default parameters instead. See the [component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-component-standards--docs) for the full pattern.

### SCSS variables with !default

The design token variables in `_variables.scss` use `!default` flags so theme stylesheets can override them. When adding new variables, always include `!default`.

## Related documentation

- [Component guide](COMPONENT-GUIDE.md) — step-by-step tutorial for building a component
- [Development guide](DEVELOPMENT.md) — environment setup, scripts, and workflow
- [Hydration guide](HYDRATION.md) — layered hydration for server-rendered integration
- [Testing guide](TESTING.md) — unit, visual, and accessibility testing
