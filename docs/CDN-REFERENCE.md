# CDN reference

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/CDN-REFERENCE.md) and in [Storybook](https://mangrove.undrr.org/?path=/docs/getting-started-integration-cdn-reference--docs).

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

**Removed in 2.0.** The legacy variants kept pre-1.4 behavior (`html { font-size: 10px }`) for sites whose CSS depended on a 10px root. 2.0 assumes the browser-standard 16px root and deletes them, so these paths 404 under `mangrove/2.0.0` and later and are served only from the 1.x version folders:

| Theme | Legacy path, 1.4 to 1.x only |
|-------|------------------------------|
| UNDRR | `/css/style-legacy.css` |
| PreventionWeb | `/css/style-preventionweb-legacy.css` |
| MCR2030 | `/css/style-mcr-legacy.css` |
| IRP | `/css/style-irp-legacy.css` |

The DELTA Resilience theme never had a legacy variant. See the [v1.4 release notes](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-1.4.md#migration-root-font-size-change) for what they did and the [v2.0 release notes](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-2.0.md) for the migration off them.

```html
<link rel="stylesheet" href="https://assets.undrr.org/mangrove/2.0.0-rc.3/css/style.css" />
```

### JavaScript modules

| Module | Path | Purpose |
|--------|------|---------|
| Tabs | `/js/tabs.js` | Tab component interactivity |
| Show More | `/js/show-more.js` | Expand/collapse sections |
| On This Page Nav | `/js/on-this-page-nav.js` | Sticky heading nav with scroll-spy |
| Table of Contents | `/js/table-of-contents.js` | Static page overview navigation |
| Copy Button | `/js/copy-button.js` | Zero-dependency copy-to-clipboard button |
| Hub header | `/js/hub-header.js` | Current section from the URL, scroll into view and edge fades for static HubHeader markup (no React) |
| Drawer | `/js/drawer.js` | Off-canvas drawer and floating panel lifecycle (no React). **Available from rc.3** — see below |
| Switch pending | `/js/switch-pending.js` | Saving state for `.mg-switch`: announcements, guards, and an optional timeout and revert. `mgSwitchAnnouncer()` exports the announcements alone |
| Preview access | `/js/preview-access.js` | Preview-access gate form |
| Shared constants | `/js/undrr.js` | Key codes, breakpoints and the `window.UNDRR` namespace |

**`/js/drawer.js` is included from `2.0.0-rc.3`.** It is absent from rc.2 and earlier packages. Use the pinned rc.3 URL after the versioned CDN assets have been published; a prepared release branch does not make that URL live. Do not substitute `latest/` for a prerelease version.

That table is the complete list. **There is no `/js/main.js` and no combined bundle** — every module is loaded on its own, so a `<script src=".../js/main.js">` returns 404. Load only the modules the page needs:

```html
<script type="module">
  import { mgTabs } from 'https://assets.undrr.org/mangrove/2.0.0-rc.3/js/tabs.js';
  mgTabs();
</script>
```

### React components (no build step)

Runtime: `/components/hydrate.js`

| Module | Path |
|--------|------|
| Hydration runtime | `/components/hydrate.js` |
| CopyButton | `/components/CopyButton.js` |
| Drawer | `/components/Drawer.js` |
| Notice | `/components/Notice.js` |
| Tree | `/components/Tree.js` |
| ServiceNotice | `/components/ServiceNotice.js` |
| TextCta | `/components/TextCta.js` |
| ShareButtons | `/components/ShareButtons.js` |
| MegaMenu | `/components/MegaMenu.js` |
| ScrollContainer | `/components/ScrollContainer.js` |
| QuoteHighlight | `/components/QuoteHighlight.js` |
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
      "react": "https://esm.sh/react@19.3.0",
      "react/jsx-runtime": "https://esm.sh/react@19.3.0/jsx-runtime",
      "react-dom": "https://esm.sh/react-dom@19.3.0",
      "react-dom/": "https://esm.sh/react-dom@19.3.0/"
    }
  }
</script>
```

```html
<script type="module">
  import React from 'react';
  import { createRoot } from 'react-dom/client';

  const MegaMenuModule = await import(
    'https://assets.undrr.org/mangrove/2.0.0-rc.3/components/MegaMenu.js'
  );

  let MegaMenu = MegaMenuModule?.default ?? MegaMenuModule;
  if (typeof MegaMenu !== 'function' && MegaMenu?.default) {
    MegaMenu = MegaMenu.default;
  }
</script>
```

Bundled components export `fromElement`; pair with `/components/hydrate.js` to avoid manual `createRoot` lifecycle code. See [Hydration guide](https://mangrove.undrr.org/?path=/docs/getting-started-integration-hydration-guide--docs).

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

See [Favicons](https://mangrove.undrr.org/?path=/docs/design-decisions-favicons--docs) for all 10 brand directories and markup guidance.

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
https://assets.undrr.org/mangrove/2.0.0-rc.3/css/style.css
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

- [Vanilla HTML/CSS integration](https://mangrove.undrr.org/?path=/docs/getting-started-integration-vanilla-html-and-css--docs)
- [Hydration guide](https://mangrove.undrr.org/?path=/docs/getting-started-integration-hydration-guide--docs)
- [Analytics enhancements](https://mangrove.undrr.org/?path=/docs/platform-services-analytics-enhancements--docs)
- [Critical messaging](https://mangrove.undrr.org/?path=/docs/platform-services-critical-messaging--docs)
