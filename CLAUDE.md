# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Mangrove is UNDRR's Storybook-powered React component library (`@undrr/undrr-mangrove` on npm). It provides brand-consistent UI components for UNDRR's disaster risk reduction websites (undrr.org, preventionweb.net, mcr2030.undrr.org, etc.).

- **Docs**: https://unisdr.github.io/undrr-mangrove/
- **Repo**: https://github.com/unisdr/undrr-mangrove
- **Stack**: React 19, Storybook 10, Webpack 5, Sass, Jest, Yarn 4 (Corepack), Node 22

## Common commands

```bash
# Development
yarn install                    # Install dependencies (Corepack must be enabled)
yarn dev                        # Start Storybook at localhost:6006 (with SCSS watch)
yarn storybook                  # Start Storybook only (no SCSS watch)

# Build
yarn build                      # Production build → dist/
yarn scss                       # Compile SCSS only

# Lint and format
yarn lint                       # Run all linters (CSS + JS) with auto-fix
yarn lint:css                   # Stylelint SCSS with auto-fix
yarn lint:js                    # ESLint JS/JSX with auto-fix
yarn lint:check                 # Lint without auto-fix (CI mode)
yarn format                     # Prettier format all files

# Test
yarn test                       # Run Jest tests
yarn test:watch                 # Watch mode
yarn test:coverage              # Coverage report
yarn test path/to/file          # Single test file

# Drupal integration
yarn watch                      # Webpack watch mode (rebuilds on change)
yarn watch --copy               # Watch + copy built JS to Drupal theme
yarn watch --copy --target=path # Watch + copy to custom path
```

### Docker alternative

```bash
yarn docker-run                 # Start containers + install + run Storybook
yarn docker-build               # Build inside container
yarn docker-lint                # Lint inside container
yarn docker-test                # Test inside container
```

## Architecture

### Two webpack build targets

The webpack config (`webpack.config.js`) produces two separate bundles:

1. **Vanilla JS/CSS assets** → `dist/js/` and `dist/css/`: Compiled from `stories/assets/js/` and SCSS files. These are standalone scripts (tabs, accordion, etc.) that don't require React.

2. **React components** → `dist/components/`: Each component is an ES module with React/ReactDOM externalized. These are consumed by the Drupal theme via `mangrove-watch.js`, which copies built `.js` files to `docroot/themes/custom/undrr_common/js/mangrove-components/`.

Entry points for React components are explicitly listed in `webpack.config.js` (second config block). Entry points for JS/CSS are dynamically discovered via glob patterns in `webpack.entries.js`.

### Component organization (Atomic Design)

```
stories/
├── Atom/           # Foundation: typography, images, layout, navigation, colors, icons
├── Molecules/      # Simple combinations: SectionHeader, FooterNavigation, BodyColumn
├── Components/     # Complex components: MegaMenu, Cards, Charts, Map, Gallery, etc.
├── Utilities/      # CSS utilities, loaders, show/more, full-width
├── Documentation/  # MDX docs (getting started, accessibility, best practices)
└── assets/         # Shared SCSS, vanilla JS, fonts, icons, images
    ├── scss/       # Theme stylesheets and variables
    ├── js/         # Vanilla JS utilities
    └── fonts/      # Mangrove icon set
```

Each component typically follows this structure:
```
ComponentName/
├── ComponentName.jsx           # React component
├── ComponentName.stories.jsx   # Storybook stories
├── ComponentName.mdx           # Documentation (optional)
├── componentname.scss          # Styles
└── __tests__/
    └── ComponentName.test.jsx  # Tests
```

### Theme system

Four theme variants, lazy-loaded in Storybook for dynamic switching:
- `style.scss` — Global UNDRR (default)
- `style-preventionweb.scss` — PreventionWeb
- `style-irp.scss` — IRP
- `style-mcr.scss` — MCR2030

Design tokens are in `stories/assets/scss/_variables.scss`.

### Exported React components

**Webpack-bundled + npm** (entries in `webpack.config.js` second config block and `src/index.js`). These produce standalone ES module bundles in `dist/components/` for Drupal/CDN consumption:

ShareButtons, MegaMenu, ScrollContainer, BarChart, MapComponent, QuoteHighlight, Fetcher, SyndicationSearchWidget, IconCard, Gallery, StatsCard, Pager

**npm-only** (exported in `src/index.js` but no webpack entry, so no `dist/components/` bundle). Available to npm consumers via `import { ... } from '@undrr/undrr-mangrove'` but not usable via Drupal wrappers or CDN:

CookieConsentBanner, Snackbar

To add a new Drupal-integrated component, add its entry to both `webpack.config.js` (second config block) and `src/index.js`. For npm-only components, adding to `src/index.js` is sufficient.

### Storybook configuration

`.storybook/main.js` configures:
- SCSS with lazy loading for theme files (enables runtime theme switching)
- Regular SCSS processing for component styles
- Node.js polyfills for Webpack 5
- React-docgen for prop documentation

`.storybook/preview.js` provides:
- Theme switcher toolbar (4 themes)
- Locale switcher toolbar (English, Arabic, Burmese, Japanese) with RTL support
- Global `window.UNDRR` object for language/direction state

### RTL and internationalization

RTL is detected from the locale toolbar. Arabic triggers `dir="rtl"` on the document. Components should respect the `dir` attribute for layout. The `window.UNDRR.langCode` and `window.UNDRR.dir` globals are available at runtime.

## Local setup and Drupal integration

This repo lives at `docroot/libraries/undrr-mangrove/` within the Drupal project at `/Users/khawkins/Documents/git/drupal-base/`. It is installed as a Composer dependency (`undrr/mangrove: dev-main`) and is **git-ignored** by the parent project (`/docroot/libraries/` is in `.gitignore`). It is not a git submodule.

### How Mangrove reaches Drupal

```
Mangrove source (this repo)
  │
  │  yarn build / yarn watch --copy
  ▼
dist/components/*.js  ──copy──▶  undrr_common/js/mangrove-components/*.js
                                  (tracked in the Drupal repo's git)
  │
  │  Loaded as ES modules by Drupal
  ▼
*-wrapper.js files  ──import──▶  Component.js  ──import──▶  React (via import map)
```

**JS flow**: Built React components go to `dist/components/`. The watch script (`mangrove-watch.js`) copies `.js` files to `docroot/themes/custom/undrr_common/js/mangrove-components/`. Those built files are committed to the Drupal repo. Each component has a hand-written `*-wrapper.js` that finds DOM elements by `data-mg-*` attributes, parses props, and renders via `createRoot()`.

**CSS flow**: Compiled CSS from `stories/assets/css/` is manually copied to each child theme's `css/mangrove/mangrove.css` (undrr, pw, mcr, irp, arise, gp, sfvc). CSS is **not** auto-synced by the watch command.

**React runtime**: Drupal doesn't bundle React. Instead, `undrr_common/js/mangrove-components.js` injects an import map that loads React 19 from `esm.sh` at runtime. The webpack build externalizes `react` and `react-dom` so the component bundles stay small.

### Key Drupal-side files

| File | Purpose |
|------|---------|
| `themes/custom/undrr_common/undrr_common.libraries.yml` | Declares `mangrove-components` library (loads all wrapper JS as ES modules) |
| `themes/custom/undrr_common/undrr_common.info.yml` | Attaches `mangrove-components` globally to every page |
| `themes/custom/undrr_common/js/mangrove-components.js` | Injects the React import map + mg-show-more utility |
| `themes/custom/undrr_common/js/mangrove-components/*.js` | Built components + wrapper scripts |
| `themes/custom/{theme}/css/mangrove/mangrove.css` | Theme-specific compiled Mangrove CSS (one per child theme) |
| `modules/custom/undrr_gutenberg_blocks/` | Gutenberg blocks that consume Mangrove components |

### Development workflow with DDEV

From the Drupal project root:

```bash
ddev mangrove-watch              # Watch + auto-copy JS to undrr_common theme
ddev mangrove-watch /custom/path # Watch + copy to a different target
```

This runs `yarn watch --copy --target=...` inside the Mangrove directory. After changes rebuild, refresh the Drupal page to see updates (no Drupal cache clear needed for JS module changes).

### Adding a new component to Drupal

1. Build the component in Mangrove (story + JSX + SCSS)
2. Add `ComponentName.fromElement.js` and `ComponentName.hydrate.js` barrel (see `docs/HYDRATION.md`)
3. Add webpack entry in `webpack.config.js` pointing to the `.hydrate.js` barrel
4. Add export in `src/index.js`
5. Run `yarn build` or use `ddev mangrove-watch` to generate `dist/components/ComponentName.js`
6. Create `ComponentName-wrapper.js` in `undrr_common/js/mangrove-components/`:
   ```js
   import createHydrator from "@mangrove/hydrate";
   import Component, { fromElement } from "@mangrove/ComponentName";
   createHydrator({ selector: "[data-mg-component-name]", component: Component, fromElement });
   ```
7. Register the wrapper in `undrr_common/undrr_common.libraries.yml` under `mangrove-components`
8. Copy compiled CSS to each child theme's `css/mangrove/mangrove.css` if styles changed

### Wrapper pattern (legacy)

The legacy wrapper approach (still used by most components) follows this structure:

```javascript
import React from "react";
import { createRoot } from "react-dom/client";
import ComponentModule from "./ComponentName.js";

const Component = ComponentModule?.default ?? ComponentModule;

document.querySelectorAll("[data-mg-component-name]").forEach((container) => {
  const props = { /* parse from container.dataset */ };
  createRoot(container).render(React.createElement(Component, props));
});
```

The `?.default ?? Module` pattern handles both ESM and CJS interop across rebuilds.

### Wrapper pattern (layered hydration)

Components with hydration support (ShareButtons, ScrollContainer) export a `fromElement` function alongside the component. The consumer wrapper reduces to three lines:

```javascript
import createHydrator from "@mangrove/hydrate";
import Component, { fromElement } from "@mangrove/ComponentName";
createHydrator({ selector: "[data-mg-component-name]", component: Component, fromElement });
```

The `@mangrove/*` aliases are resolved by the import map injected by `mangrove-components.js`. `createHydrator` handles DOM querying, module unwrapping, error recovery, and `createRoot` lifecycle. `fromElement` is a pure function that extracts props from the container element's data attributes. See `docs/HYDRATION.md` for the full API and how to add hydration support to new components.

## AI assistant rules

- Do not add `Co-authored-by` trailers to git commits or pull requests.

## Conventions

### Commit messages

Conventional commits for automated semantic versioning:
- `fix:` — patch release
- `feat:` — minor release
- `BREAKING CHANGE:` in body — major release
- `docs:`, `chore:`, `test:`, `refactor:`, `style:` — no release

### Code style

- Functional React components with hooks (no class components)
- BEM naming for CSS classes
- SCSS variables from `_variables.scss` for colors, spacing, breakpoints
- Import order: React → external libs → internal components → styles
- Sentence case for all headings and titles (capitalize only proper nouns and acronyms)

### UX writing

Follow `docs/WRITING-SHORT.md`:
- Plain, direct language; front-load key info
- Error messages: what happened → why → what to do next
- Gender-neutral terms (UN guidelines): "chair" not "chairman", "spokesperson" not "spokesman"
- Descriptive link text; never "click here"
- State limits explicitly ("Max 10 MB" not "File too large")

### TypeScript

TypeScript is supported but optional. JSX is the default. Path aliases available: `@/*` → `src/*`, `@components/*` → `stories/Components/*`.

## Branching

- `main` is the primary branch — auto-deploys to GitHub Pages
- Feature branches from `main` (no `dev` branch)
- PRs target `main`, reference GitHub or GitLab issues
- Include `[skip chromatic]` in commit message to skip visual regression tests

## Releasing

Releases are manually versioned (not automated via semantic-release). See `docs/RELEASES.md` for the full process:
1. Update `version` in `package.json`
2. Run `yarn update-cdn-version` to update CDN links in documentation
3. Commit, tag, and push (e.g., `git tag v1.3.0 && git push origin main --tags`)
4. The npm-publish workflow builds and publishes to npm automatically
