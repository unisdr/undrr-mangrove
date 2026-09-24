Mangrove 2.0 is the stable release of the shared component library behind undrr.org, PreventionWeb, MCR2030, the International Recovery Platform (IRP) and DELTA Resilience. It improves keyboard, screen-reader and right-to-left (Arabic) support across core components, lets one stylesheet serve every UNDRR brand, adds new components and page layouts and is now the npm `latest` release.

Full detail and migration steps: [v2.0 release notes](https://mangrove.undrr.org/?path=/docs/getting-started-release-notes-v2-0--docs) (source: [`docs/RELEASE-2.0.md`](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-2.0.md)). Upgrading from 1.x? Start with the upgrade checklist in the [v2.0 release notes](https://mangrove.undrr.org/?path=/docs/getting-started-release-notes-v2-0--docs).

## Breaking and visible changes

- **A plain `npm install @undrr/undrr-mangrove` now installs 2.0.** To stay on 1.x for now, pin it: `npm install @undrr/undrr-mangrove@^1`. 1.x is now in best-effort support, with no schedule for further releases. The CDN `assets.undrr.org/mangrove/latest/` path also moves to 2.0, so pin any production page that loads `latest/` to `mangrove/1.8.2/` before upgrading it; pinned version paths are unaffected.
- **Sub-brand stylesheets need a theme class.** PreventionWeb, IRP, MCR2030 and DELTA consumers add `class="mg-theme-{brand}"` (`mg-theme-preventionweb`, `mg-theme-irp`, `mg-theme-mcr` or `mg-theme-delta`, matching the stylesheet you load) to `<body>` or a wrapping element, or components fall back to the default UNDRR palette. See Sub-brand theming migration in the [release notes](https://mangrove.undrr.org/?path=/docs/getting-started-release-notes-v2-0--docs).
- **Three defaults change in every theme.** Neutral surfaces are cool-tinted, the keyboard focus ring is gold rather than the brand colour (so focus no longer looks like selection), and that ring is drawn as two bands. No integration change is needed. DELTA's palette is also corrected against its own sources, so DELTA pages change more than the others. See Theming, tokens and colour in the [release notes](https://mangrove.undrr.org/?path=/docs/getting-started-release-notes-v2-0--docs).
- **Nine numbered breaking changes, most of them for SCSS consumers.** They include the removed `$mg-color-*` and `$mg-spacing-*` aliases, the deleted sub-brand `_variables-*.scss` files, the six font-family variables (now five `--mg-font-family-*` roles) and the four CamelCase stylesheet aliases. The legacy 10px-root stylesheets are removed too, compiled `*-legacy.css` files included, so a page still on a 10px root must move to 16px. See Breaking changes in the [release notes](https://mangrove.undrr.org/?path=/docs/getting-started-release-notes-v2-0--docs).
- **The deprecated `Pagination` component is removed.** It shipped only as SCSS in 1.8.x, so this affects builds that import `scss/Components/Pagination/pagination`. Use `Pager`.
- **Components look and behave differently in places.** Snackbar renders as a Notice, filled buttons paint their fill under the border, StatusLabel indicators carry a shape as well as a colour, and background heroes stack image and copy at viewport widths up to 900px; hand-authored heroes with no background image need `mg-hero--no-image`, or phones show an empty band of brand colour. Secondary and accent variants no longer put text on orange, and QuoteHighlight strips `target` from attribution links. The upgrade notes in the [release notes](https://mangrove.undrr.org/?path=/docs/getting-started-release-notes-v2-0--docs) list each one by integration topic.
- **Browsers need CSS custom property support.** Every colour and spacing value now resolves through `var(--mg-*)` at runtime. Every browser in the supported matrix handles this.

## New features

- **Runtime theming:** One stylesheet can serve every brand, and the combined `style-all.css` lets a page host several brands or switch brand without a rebuild.
- **Public tokens:** The type scale, line heights and a data-visualization palette mapped to Targets A to G of the Sendai Framework for Disaster Risk Reduction 2015–2030 are CSS custom properties a theme can re-value.
- **New components:** Notice and ServiceNotice, Drawer, Tree, Legend, Range, CopyButton, SkipLink, FormAction, UserFeedback, StatusLabel, EmptyState and SegmentedControl. Drawer, Tree, Legend and Range are prototypes whose APIs may still change in a 2.x minor release.
- **Page-level patterns:** Content Hub, Landing Page and Article Story reference layouts.
- **PageHeader language links:** `languageDisplay="links"` shows languages inline in the toolbar, and falls back to the icon dropdown below the tablet breakpoint and when there are more languages than `maxLanguageLinks` (default 6). Default and example language lists follow United Nations order (alphabetical by English name: Arabic, Chinese, English, French, Russian, Spanish). ([#1134](https://github.com/unisdr/undrr-mangrove/pull/1134), [#1284](https://github.com/unisdr/undrr-mangrove/pull/1284))
- **Vanilla modules:** `js/copy-button.js`, `js/drawer.js`, `js/hub-header.js` and `js/switch-pending.js` are dependency-free ES modules for pages with no React, and hydration contracts are documented for every hydratable component.

## Bug fixes and hardening

- **Accessibility:** focus indicators on Mangrove's interactive components that stay visible in forced-colours (high-contrast) modes, a sweep that named, announced and distinguished controls across six components, and markerless lists that keep their `list` role in Safari without `role="list"`.
- **Arabic and right-to-left:** Noto Kufi Arabic headings with Noto Sans Arabic body text, Arabic rules that respect language boundaries, and logical properties so components mirror correctly.
- **Contrast:** A perceptual (Oklab) methodology runs alongside WCAG 2 on the theme token pairs in the contrast register, including the focus ring and the data-visualization palette.

## Documentation and discoverability

- **Docs domain:** Storybook, `llms.txt`, `llms.json`, `releases.json`, `tokens.json` and `ai-components/` are published at `https://mangrove.undrr.org/`, and old `preventionweb.github.io/undrr-mangrove/` URLs redirect.
- **Editorial manual:** a sourced style guide for UI copy and documentation, with its own `llms-editorial-manual.txt` for agents writing copy. ([#1286](https://github.com/unisdr/undrr-mangrove/pull/1286), [#1287](https://github.com/unisdr/undrr-mangrove/pull/1287), [#1288](https://github.com/unisdr/undrr-mangrove/pull/1288), [#1289](https://github.com/unisdr/undrr-mangrove/pull/1289), [#1290](https://github.com/unisdr/undrr-mangrove/pull/1290))
- **Checked documentation:** Documentation links and the package paths the docs name are verified by tests against the published package layout, so a copied import or CDN path matches what ships.

## Dependencies

- **React:** the React components need React and ReactDOM 18 or later, installed by your project; 2.0 is developed and tested on 19.3.0 ([#1128](https://github.com/unisdr/undrr-mangrove/pull/1128)). Compiled CSS, SCSS and the vanilla `js/` modules need no React.

## CDN
```html
<link rel="stylesheet" href="https://assets.undrr.org/mangrove/2.0.0/css/style.css">
```
