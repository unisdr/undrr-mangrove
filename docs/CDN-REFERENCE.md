# CDN reference

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/CDN-REFERENCE.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-cdn-reference--docs).

This page provides an overview of UNDRR's CDN structure and common asset paths. For a complete listing of all available files and versions, explore the CDN directly at [assets.undrr.org/static](https://assets.undrr.org/static/sitemap.html).

UNDRR assets are served from `https://assets.undrr.org/static/` with versioned endpoints for stability.

## Mangrove component library

Base URL: `https://assets.undrr.org/static/mangrove/{version}/`

### CSS themes

| Theme | Path | Use case |
|-------|------|----------|
| UNDRR (default) | `/css/style.css` | undrr.org, sendaiframework.org |
| PreventionWeb | `/css/style-preventionweb.css` | preventionweb.net |
| MCR2030 | `/css/style-mcr.css` | mcr2030.undrr.org |
| IRP | `/css/style-irp.css` | recovery.preventionweb.net |
| DELTA Resilience | `/css/style-delta.css` | deltaresilience.org |

**Example:**
```html
<link rel="stylesheet" href="https://assets.undrr.org/static/mangrove/1.4.0/css/style.css" />
```

### JavaScript modules

| Module | Path | Purpose |
|--------|------|---------|
| Tabs | `/js/tabs.js` | Tab component interactivity |
| Show More | `/js/show-more.js` | Expand/collapse content sections |

**Example:**
```html
<script type="module">
  import { mgTabs } from 'https://assets.undrr.org/static/mangrove/1.4.0/js/tabs.js';
  mgTabs();
</script>
```

### React components

Precompiled React components for use without a build process. The `hydrate.js` runtime handles mounting and error recovery.

| Module | Path |
|--------|------|
| Hydration runtime | `/components/hydrate.js` |
| ShareButtons | `/components/ShareButtons.js` |
| MegaMenu | `/components/MegaMenu.js` |
| ScrollContainer | `/components/ScrollContainer.js` |
| BarChart | `/components/BarChart.js` |
| MapComponent | `/components/MapComponent.js` |
| QuoteHighlight | `/components/QuoteHighlight.js` |
| Fetcher | `/components/Fetcher.js` |
| SyndicationSearchWidget | `/components/SyndicationSearchWidget.js` |
| IconCard | `/components/IconCard.js` |
| Gallery | `/components/Gallery.js` |
| StatsCard | `/components/StatsCard.js` |
| Pager | `/components/Pager.js` |

**Example:**

React 19 dropped UMD builds. Use [import maps](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap) with [esm.sh](https://esm.sh/):

```html
<!-- Note: react/jsx-runtime only needed if components use automatic JSX runtime. Unused entries don't trigger requests. -->
<script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@19.2.4",
      "react/jsx-runtime": "https://esm.sh/react@19.2.4/jsx-runtime",
      "react-dom": "https://esm.sh/react-dom@19.2.4",
      "react-dom/": "https://esm.sh/react-dom@19.2.4/"
    }
  }
</script>
```

Then import the Mangrove component as an ES module:

```html
<script type="module">
  import React from 'react';
  import { createRoot } from 'react-dom/client';

  // Load component from CDN
  const MegaMenuModule = await import(
    'https://assets.undrr.org/static/mangrove/1.4.0/components/MegaMenu.js'
  );

  // Unwrap ESM/CJS interop - bundle may be double-wrapped
  let MegaMenu = MegaMenuModule?.default ?? MegaMenuModule;
  if (typeof MegaMenu !== 'function' && MegaMenu?.default) {
    MegaMenu = MegaMenu.default;
  }
</script>
```

See the [Vanilla HTML/CSS guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-vanilla-html-and-css--docs) for complete usage examples.

All bundled components export a `fromElement` function for automatic prop extraction. The `hydrate.js` runtime (`/components/hydrate.js`) eliminates the manual `createRoot` boilerplate. See the [Hydration guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-hydration-guide--docs) for details.

## Analytics

Base URL: `https://assets.undrr.org/static/analytics/{version}/`

| Asset | Path | Purpose |
|-------|------|---------|
| GA4 Enhancements | `/google_analytics_enhancements.js` | Analytics bootstrap and tracking |
| Documentation | `/index.html` | Full implementation guide |

**Example:**
```html
<script
  src="https://assets.undrr.org/static/analytics/v1.0.0/google_analytics_enhancements.js"
  defer
></script>
```

See [Analytics enhancements](https://unisdr.github.io/undrr-mangrove/?path=/docs/platform-services-analytics-enhancements--docs) for configuration options.

## Logos

Base URL: `https://assets.undrr.org/static/logos/`

| Logo | Path |
|------|------|
| UNDRR horizontal | `/undrr/undrr-logo-horizontal.svg` |
| UNDRR vertical | `/undrr/undrr-logo-vertical.svg` |

## Other services

| Service | URL | Purpose |
|---------|-----|---------|
| Critical Messaging | `https://messaging.undrr.org/src/undrr-messaging.js` | Emergency broadcasts |
| Footer Widget | `https://publish.preventionweb.net/widget.js` | Syndicated footer |

## Versioning

### Production (recommended)

Pin to a specific version for stability:

```
https://assets.undrr.org/static/mangrove/1.4.0/css/style.css
```

### Latest (testing only)

The `/latest/` endpoint always points to the most recent release:

```
https://assets.undrr.org/testing/static/mangrove/latest/css/style.css
```

**Note:** Only use `/latest/` for development and testing. Production sites should pin to specific versions.

### Test environment

Pre-release assets are available at:

```
https://assets.undrr.org/testing/static/mangrove/{version}/
```

## URL structure

```
https://assets.undrr.org/static/
├── mangrove/
│   └── {version}/
│       ├── css/
│       │   ├── style.css
│       │   ├── style-preventionweb.css
│       │   ├── style-mcr.css
│       │   ├── style-irp.css
│       │   └── style-delta.css
│       ├── js/
│       │   ├── tabs.js
│       │   └── show-more.js
│       └── components/
│           ├── hydrate.js
│           ├── ShareButtons.js
│           ├── MegaMenu.js
│           ├── ScrollContainer.js
│           ├── BarChart.js
│           ├── MapComponent.js
│           ├── QuoteHighlight.js
│           ├── Fetcher.js
│           ├── SyndicationSearchWidget.js
│           ├── IconCard.js
│           ├── Gallery.js
│           ├── StatsCard.js
│           └── Pager.js
├── analytics/
│   └── {version}/
│       ├── google_analytics_enhancements.js
│       └── index.html
├── logos/
│   └── undrr/
│       ├── undrr-logo-horizontal.svg
│       └── undrr-logo-vertical.svg
└── sitemap.html
```

## See also

- [Vanilla HTML/CSS integration](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-vanilla-html-and-css--docs)
- [Analytics enhancements](https://unisdr.github.io/undrr-mangrove/?path=/docs/platform-services-analytics-enhancements--docs)
- [Critical messaging](https://unisdr.github.io/undrr-mangrove/?path=/docs/platform-services-critical-messaging--docs)
