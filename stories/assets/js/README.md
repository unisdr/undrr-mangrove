# Vanilla JS scripts

Standalone JavaScript modules that work without React. Each file in this directory is auto-discovered by `webpack.entries.js` and produces a UMD bundle at `dist/js/{name}.min.js`.

## How they ship

```
stories/assets/js/my-script.js          ← source (this directory)
  ↓ webpack build (Config 1, UMD)
dist/js/my-script.min.js                ← minified bundle (Drupal/CDN)
  ↓ CopyPlugin
dist/assets/js/my-script.js             ← unminified copy
  ↓ npm-publish.yml (CI)
@undrr/undrr-mangrove/js/my-script.js   ← npm package
```

The GitHub Actions publish workflow (`npm-publish.yml`) copies `dist/assets/js/*` into the npm package at the top-level `js/` directory. This happens automatically — no manual registration is needed.

## Current scripts

| File | Component | Purpose |
|------|-----------|---------|
| `on-this-page-nav.js` | [OnThisPageNav](../../Components/OnThisPageNav/) | Sticky horizontal "On this page" navigation with scroll-spy |
| `tabs.js` | [Tab](../../Components/Tab/) | Tabbed content with keyboard navigation and deep linking |
| `show-more.js` | [ShowMore](../../../Utilities/ShowMore/) | Expand/collapse toggle for content sections |
| `undrr.js` | — | Shared constants (key codes, breakpoints) and `window.UNDRR` namespace |

## Adding a new script

1. Create your file here (e.g., `my-feature.js`)
2. Export a named init function: `export function mgMyFeature() { ... }`
3. Auto-init at the bottom:
   ```js
   if (document.readyState === 'loading') {
     document.addEventListener('DOMContentLoaded', mgMyFeature, false);
   } else {
     mgMyFeature();
   }
   ```
4. Use `data-mg-*` attributes for activation and configuration
5. Guard against double-init: `if (el.dataset.mgMyFeatureInitialized) return;`
6. Create a companion SCSS file in `stories/Components/YourComponent/` and import it in `_components.scss`
7. Run `yarn build` — the script appears at `dist/js/my-feature.min.js`

No webpack config or `src/index.js` changes are needed. The file is picked up automatically by the glob pattern in `webpack.entries.js`.

## Differences from React components

| | Vanilla JS (this directory) | React components |
|---|---|---|
| Entry discovery | Auto (glob) | Manual (webpack.config.js) |
| Output | `dist/js/*.min.js` (UMD) | `dist/components/*.js` (ESM) |
| npm location | `@undrr/undrr-mangrove/js/` | `@undrr/undrr-mangrove/components/` |
| React dependency | None | Externalized (provided by import map) |
| Drupal integration | Load script directly as a library | Wrapper + hydration via `createHydrator` |

See [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md) for the full build system documentation.
