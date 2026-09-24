# Vanilla JS scripts

Standalone JavaScript modules that work without React. Each file in this directory ships as source: the build copies it, it is not bundled or minified.

## How they ship

```
stories/assets/js/my-script.js          ← source (this directory)
  ↓ CopyPlugin (webpack Config 1)
dist/assets/js/my-script.js             ← verbatim copy (CDN)
  ↓ assemble-npm-package.mjs (CI)
@undrr/undrr-mangrove/js/my-script.js   ← npm package
```

They are ES modules, so a page loads one with `<script type="module">`. There is no minified or UMD variant and nothing is emitted under `dist/js/`.

The publish workflow (`npm-publish.yml`) runs `scripts/assemble-npm-package.mjs`, which copies `dist/assets/js/*` into the npm package at the top-level `js/` directory. This happens automatically — the build needs no manual registration. The AI manifest does: see step 6 below.

## Current scripts

| File                   | Component                                            | Purpose                                                                                                                       |
| ---------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `on-this-page-nav.js`  | [OnThisPageNav](../../Components/OnThisPageNav/)     | Sticky horizontal "On this page" navigation with scroll-spy                                                                   |
| `tabs.js`              | [Tab](../../Components/Tab/)                         | Tabbed content with keyboard navigation and deep linking                                                                      |
| `show-more.js`         | [ShowMore](../../../Utilities/ShowMore/)             | Expand/collapse toggle for content sections                                                                                   |
| `copy-button.js`       | [CopyButton](../../Components/Buttons/CopyButton/)   | Zero-dependency clipboard copy button with transient feedback                                                                 |
| `switch-pending.js`    | [Checkbox](../../Components/Forms/Checkbox/)         | Pending state for `.mg-switch`: announces, guards, and optionally times out and reverts; also exports the announcements alone |
| `hub-header.js`        | [HubHeader](../../Patterns/ContentHub/)              | Current section from the URL, scroll into view and edge fades for static hub header markup                                    |
| `drawer.js`            | [Drawer](../../Components/Navigation/Drawer/)        | Open and close, Escape, focus management and a modal focus trap for a drawer or floating panel you rendered yourself          |
| `preview-access.js`    | [PreviewAccess](../../Components/PreviewAccess/)     | Password gate and preview notice for staging and pre-publication review                                                       |
| `table-of-contents.js` | [TableOfContents](../../Components/TableOfContents/) | In-page table of contents generated from the article's headings, with scrollspy                                               |
| `undrr.js`             | —                                                    | Shared constants (key codes, breakpoints) and `window.UNDRR` namespace                                                        |

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
   This is required, not optional — see [HYDRATION-AUTHORING.md](../../../docs/HYDRATION-AUTHORING.md) for why a per-element flag and not a module-scope `WeakMap`.
6. Register the module in `VANILLA_SCRIPTS` in `scripts/ai-manifest/generate-ai-manifest.js`, and add a `vanillaModule` contract to its component in `scripts/ai-manifest/component-data.js` if it drives one. `yarn validate-manifest` fails on a module that ships undocumented, and on a contract that names a file which does not exist.
7. Create a companion SCSS file in `stories/Components/YourComponent/` and import it in `_components.scss`
8. Run `yarn build` — the script appears at `dist/assets/js/my-feature.js`

No webpack config or `src/index.js` changes are needed. CopyPlugin copies this whole directory, so a new file is picked up by being here.

## Differences from React components

|                    | Vanilla JS (this directory)        | React components                         |
| ------------------ | ---------------------------------- | ---------------------------------------- |
| Entry discovery    | Auto (whole directory is copied)   | Manual (webpack.config.js)               |
| Output             | `dist/assets/js/*.js` (ESM source) | `dist/components/*.js` (ESM bundle)      |
| npm location       | `@undrr/undrr-mangrove/js/`        | `@undrr/undrr-mangrove/components/`      |
| React dependency   | None                               | Externalized (provided by import map)    |
| Drupal integration | Load script directly as a library  | Wrapper + hydration via `createHydrator` |

See [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md) for the full build system documentation.
