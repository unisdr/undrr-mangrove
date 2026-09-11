# Architecture

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/ARCHITECTURE.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-architecture--docs).

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

Component SCSS compiles into five theme-variant stylesheets, not per-component CSS files:

```
stories/assets/scss/
├── style.scss                  → Global UNDRR theme (default)
├── style-preventionweb.scss    → PreventionWeb theme
├── style-irp.scss              → IRP theme
├── style-mcr.scss              → MCR2030 theme
├── style-delta.scss            → DELTA Resilience theme
├── _components.scss            → Imports all component SCSS files
├── _variables.scss             → Build-time SCSS tokens (breakpoints, font sizes, families); color/spacing tokens are CSS custom properties
├── _breakpoints.scss           → Responsive breakpoint mixins
└── _mixins.scss                → Shared SCSS mixins
```

**How it works:** component SCSS files are imported into `_components.scss`, `_components.scss` is imported by each theme entry file, and `yarn scss` compiles all theme outputs to `stories/assets/css/`.

**When adding a new component SCSS file:** add its `@import` to `_components.scss` so it ships in all theme builds.

**Important:** Color and spacing tokens are CSS custom properties overridden at runtime by a `.mg-theme-{name}` selector block in each theme's `_theme-{name}.scss` file. Build-time-only tokens (breakpoints, font sizes, font families, `$mg-html-font-size`, `$mg-tabs-border-bottom`) remain as SCSS `!default` variables and are resolved at compile time.

## Component distribution channels

Components reach consumers through different channels depending on their type and registration:

### Vanilla JS scripts

Scripts in `stories/assets/js/` are auto-discovered by webpack and published to npm at `@undrr/undrr-mangrove/js/`. No manual registration is needed. The CI workflow (`npm-publish.yml`) copies `dist/assets/js/*` into the npm package's `js/` directory.

| Script | npm path | Purpose |
|--------|----------|---------|
| `on-this-page-nav.js` | `js/on-this-page-nav.js` | Sticky horizontal nav with scroll-spy |
| `tabs.js` | `js/tabs.js` | Tabbed content with keyboard nav |
| `show-more.js` | `js/show-more.js` | Expand/collapse toggle |
| `undrr.js` | `js/undrr.js` | Shared constants and namespace |

See [`stories/assets/js/README.md`](../stories/assets/js/README.md) for the full pipeline and authoring guide.

### React components

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

See [HYDRATION.md](HYDRATION.md) for the consumer API and [HYDRATION-AUTHORING.md](HYDRATION-AUTHORING.md) for adding hydration support to new components.

**Legacy wrapper:** Older components without hydration files use hand-written wrappers that call `document.querySelectorAll()`, parse `data-*` attributes, and call `createRoot()` directly. These are being migrated to the layered pattern.

### CSS deployment

CSS is **not** auto-synced. After SCSS changes:

1. Run `yarn scss` to compile
2. Manually copy the compiled CSS to each Drupal child theme's `css/mangrove/mangrove.css`
3. Commit the updated CSS in the Drupal repository

The specific child themes that use Mangrove CSS include: undrr, pw, mcr, irp, arise, gp, sfvc. Each maps to one of the five compiled theme stylesheets. See [DEVELOPMENT.md](DEVELOPMENT.md) for the copy workflow.

### Key Drupal-side files

| File | Purpose |
|------|---------|
| `undrr_common/undrr_common.libraries.yml` | Declares `mangrove-components` library |
| `undrr_common/undrr_common.info.yml` | Attaches library globally |
| `undrr_common/js/mangrove-components.js` | Injects React import map |
| `undrr_common/js/mangrove-components/*.js` | Built components + wrapper scripts |
| `{child-theme}/css/mangrove/mangrove.css` | Compiled theme CSS |

## Storybook theme registration

After creating the theme entry file, register it in `.storybook/preview.js`:

```js
// Add import at the top with the other theme imports
import themeMyTheme from '../stories/assets/scss/style-mytheme.scss';
```

Add it to the `themeStyles` map:

```js
const themeStyles = {
  'Global UNDRR Theme': themeUNDRR,
  'PreventionWeb Theme': themePreventionWeb,
  'IRP Theme': themeIRP,
  'MCR2030 Theme': themeMCR,
  'DELTA Resilience Theme': themeDelta,
  'My Theme': themeMyTheme,
};
```

Add a toolbar entry in `globalTypes.theme.toolbar.items`:

```js
items: [
  { value: 'Global UNDRR Theme', title: 'Global UNDRR Theme' },
  { value: 'PreventionWeb Theme', title: 'PreventionWeb Theme' },
  { value: 'IRP Theme', title: 'IRP Theme' },
  { value: 'MCR2030 Theme', title: 'MCR2030 Theme' },
  { value: 'DELTA Resilience Theme', title: 'DELTA Resilience Theme' },
  { value: 'My Theme', title: 'My Theme' },
],
```

Theme entry filenames must match `style(-\w+)?\.scss$` so Storybook applies lazy style loading and the theme decorator can swap active styles.

### Build and test

```bash
yarn scss   # Compile all style*.scss to stories/assets/css/
yarn dev    # Start Storybook — use the paintbrush toolbar to switch themes
```

### Storybook theme switcher internals

`.storybook/main.js` applies `lazyStyleTag` to theme SCSS entry files. `.storybook/preview.js` imports those files and switches themes by calling `.unuse()` on the previous stylesheet and `.use()` on the selected one. Only one theme is active at a time.

## AI manifest pipeline

The build produces AI-friendly component metadata alongside Storybook so coding agents can discover and use components accurately. The pipeline auto-generates from Storybook and component rendering, with some curated data maintained manually.

The pipeline lives in `scripts/ai-manifest/` (3 files: `generate-ai-manifest.js`, `component-data.js`, `css-utilities.js`). See the header comment in `generate-ai-manifest.js` for details.

## Known technical constraints

### Babel loose mode

`preset-env` with `loose: true` breaks Set/iterable spread (`[...set]` becomes `[].concat(set)`). The `loose` option was removed from `.babelrc.json` — do not re-add it.

### d3 submodule imports

The d3 monolith import was replaced with submodule imports (`d3-selection`, `d3-scale`, `d3-array`, `d3-axis`) to reduce bundle size. Import from submodules, not from `d3`.

### Module-level mutable state

Never use module-level `Set`, `Map`, `Array`, or counters to track state across function calls. These persist between component instances and cause cross-instance bugs. Always declare mutable tracking variables inside the function scope. See [ComponentContribution.mdx](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs) for the full anti-pattern explanation.

### React 19 defaultProps deprecation

`Component.defaultProps` is deprecated in React 19. Use destructured default parameters instead. See the [component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs) for the full pattern.

### CSS custom properties and SCSS variables

Mangrove uses two distinct token mechanisms:

**CSS custom properties** (`--mg-color-*`, `--mg-spacing-*`): color and spacing tokens defined in the compiled output. Themes override these at runtime via a `.mg-theme-{name} { }` selector block in `_theme-{name}.scss`. Applying the class to `<body>` or a wrapping element activates the theme without any CSS rebuild.

**Build-time SCSS `!default` variables**: used for tokens that must be resolved at compile time and cannot be overridden at runtime. This includes breakpoints (`$mg-breakpoint-*`), font sizes (`$mg-font-size-*`), font faces (`$mg-font-face-*`, which `@font-face` and Sass interpolation need at compile time), and `$mg-tabs-border-bottom`. Font *families* are not on this list: components read the `--mg-font-family-*` role custom properties, which are re-pointed per script at runtime. These carry `!default` so a consuming project can override them before importing Mangrove; include it on any new build-time variable for the same reason. (`$mg-html-font-size` is the exception — it is fixed at `16`, see below.)

### Why a custom token generator

`scripts/build-tokens.cjs` is bespoke, and Style Dictionary is the obvious
off-the-shelf alternative. It was evaluated against these sources rather than
in the abstract, and rejected on three findings:

- **It would reintroduce a bug this codebase just fixed.** Style Dictionary's
  `deepExtend` replaces the whole token object on a three-layer merge, dropping
  `$type`, `$description` and `$extensions`. All four sub-brands are three-layer
  (`irp`, `mcr`, `preventionweb` and `delta` all extend `undrr`, which sits over
  `mangrove`), so metadata would be lost on four of five brands -- which is
  exactly the `$format` clobber the `CARRIED` list exists to prevent. The
  merge logic would have to be kept anyway.
- **It costs more code, not less.** Reproducing today's output needs roughly
  450-550 lines of config and hooks against 602 non-comment lines now, ~130 of
  which port over unchanged. Net saving of 50-150 lines for a 106-package
  dependency.
- **The validation it exists for has no equivalent.** `assertChannels` -- the
  shape check that catches a colour emitted in the wrong form -- has no Style
  Dictionary counterpart, and its reference and duplicate-name diagnostics are
  warn-by-default, with escalation colliding with warnings worth keeping.

Revisit if the sources need to round-trip with Figma or Tokens Studio, or if a
third output target appears. Both would change the arithmetic.

### Root font-size and the mg-rem() function

The root is fixed at 16px (browser standard). The legacy 10px root — the `!default` override and the `-legacy` theme variants — was removed in 2.0; consumers use a standard 16px document root. See [RELEASE-2.0.md](RELEASE-2.0.md) breaking change #5.

All spacing, font-size, and width tokens go through `mg-rem($px)`, which converts a pixel value to rem for the fixed 16px root:

```scss
// In _variables.scss
$mg-html-font-size: 16;

@function mg-rem($px) {
  @return math.div($px, $mg-html-font-size) * 1rem;
}

// Usage — pass the intended pixel value:
$mg-spacing-100: mg-rem(10);   // → 0.625rem
$mg-font-size-300: mg-rem(16); // → 1rem
```

When writing component SCSS, use `mg-rem()` or an existing token. Never hard-code a rem value:

```scss
// Correct
padding: mg-rem(15);                  // 15px at any root
padding: var(--mg-spacing-150);       // same thing, via the token

// Wrong — breaks when root changes
padding: 1.5rem;
```

## Related documentation

- [Component guide](COMPONENT-GUIDE.md) — step-by-step tutorial for building a component
- [Development guide](DEVELOPMENT.md) — environment setup, scripts, and workflow
- [Hydration guide](HYDRATION.md) — consumer-facing integration guide
- [Adding hydration support](HYDRATION-AUTHORING.md) — contributor guide for `fromElement`, barrel files, and tests
- [Testing guide](TESTING.md) — unit, visual, and accessibility testing
- [Colour contrast methodology](COLOUR-CONTRAST-METHODOLOGY.md) — why token contrast is graded perceptually rather than by WCAG 2 alone
