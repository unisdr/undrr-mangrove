# CDN reference

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/CDN-REFERENCE.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-cdn-reference--docs).

Authoritative path reference for UNDRR CDN assets. Browse the full index at [assets.undrr.org](https://assets.undrr.org/sitemap.html).

Base host: `https://assets.undrr.org/`

## Mangrove component library

Base URL: `https://assets.undrr.org/mangrove/{version}/`

### CSS themes

| Theme | Path | Use case |
|-------|------|----------|
| UNDRR (default) | `/css/style.css` | undrr.org, sendaiframework.org |
| PreventionWeb | `/css/style-preventionweb.css` | preventionweb.net |
| MCR2030 | `/css/style-mcr.css` | mcr2030.undrr.org |
| IRP | `/css/style-irp.css` | recovery.preventionweb.net |
| DELTA Resilience | `/css/style-delta.css` | deltaresilience.org |
| Gutenberg editor | `/css/style-gutenberg.css` | Drupal Gutenberg block previews |

Legacy variants keep pre-1.4 behavior (`html { font-size: 10px }`). Use when migrating sites with CSS that depends on a 10px root. See [v1.4 release notes](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-1.4.md#migration-root-font-size-change).

| Theme | Legacy path |
|-------|-------------|
| UNDRR | `/css/style-legacy.css` |
| PreventionWeb | `/css/style-preventionweb-legacy.css` |
| MCR2030 | `/css/style-mcr-legacy.css` |
| IRP | `/css/style-irp-legacy.css` |

The DELTA Resilience theme has no legacy variant.

```html
<link rel="stylesheet" href="https://assets.undrr.org/mangrove/2.0.0-beta.1/css/style.css" />
```

### JavaScript modules

| Module | Path | Purpose |
|--------|------|---------|
| Tabs | `/js/tabs.js` | Tab component interactivity |
| Show More | `/js/show-more.js` | Expand/collapse sections |
| On This Page Nav | `/js/on-this-page-nav.js` | Sticky heading nav with scroll-spy |
| Table of Contents | `/js/table-of-contents.js` | Static page overview navigation |

```html
<script type="module">
  import { mgTabs } from 'https://assets.undrr.org/mangrove/2.0.0-beta.1/js/tabs.js';
  mgTabs();
</script>
```

### React components (no build step)

Runtime: `/components/hydrate.js`

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
| UserFeedback | `/components/UserFeedback.js` |
| StatsCard | `/components/StatsCard.js` |
| Pager | `/components/Pager.js` |

React 19 removed UMD builds. Use import maps with esm.sh:

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

```html
<script type="module">
  import React from 'react';
  import { createRoot } from 'react-dom/client';

  const MegaMenuModule = await import(
    'https://assets.undrr.org/mangrove/2.0.0-beta.1/components/MegaMenu.js'
  );

  let MegaMenu = MegaMenuModule?.default ?? MegaMenuModule;
  if (typeof MegaMenu !== 'function' && MegaMenu?.default) {
    MegaMenu = MegaMenu.default;
  }
</script>
```

Bundled components export `fromElement`; pair with `/components/hydrate.js` to avoid manual `createRoot` lifecycle code. See [Hydration guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-hydration-guide--docs).

## Analytics

Base URL: `https://assets.undrr.org/analytics/{version}/`

| Asset | Path | Purpose |
|-------|------|---------|
| GA4 Enhancements | `/google_analytics_enhancements.js` | Analytics bootstrap and tracking |
| Documentation | `/index.html` | Full implementation guide |

```html
<script
  src="https://assets.undrr.org/analytics/v1.0.0/google_analytics_enhancements.js"
  defer
></script>
```

## Favicons

Base URL: `https://assets.undrr.org/favicons/{brand}/v1/`

Canonical set per brand: `favicon.ico`, `apple-touch-icon.png`, `favicon-192.png`, `favicon-512.png`.

See [Favicons](https://unisdr.github.io/undrr-mangrove/?path=/docs/design-decisions-favicons--docs) for all 10 brand directories and markup guidance.

## Logos

Base URL: `https://assets.undrr.org/logos/`

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

Pin exact versions:

```
https://assets.undrr.org/mangrove/2.0.0-beta.1/css/style.css
```

### Latest (testing only)

```
https://assets.undrr.org/testing/static/mangrove/latest/css/style.css
```

Use `/latest/` only for development/testing. Production should always pin specific versions.

### Test environment

Pre-release assets:

```
https://assets.undrr.org/testing/static/mangrove/{version}/
```

## See also

- [Vanilla HTML/CSS integration](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-vanilla-html-and-css--docs)
- [Hydration guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-hydration-guide--docs)
- [Analytics enhancements](https://unisdr.github.io/undrr-mangrove/?path=/docs/platform-services-analytics-enhancements--docs)
- [Critical messaging](https://unisdr.github.io/undrr-mangrove/?path=/docs/platform-services-critical-messaging--docs)
