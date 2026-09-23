Mangrove 2.0 is the stable release of the 2.0 line. Theming moves to runtime CSS custom properties, design tokens come from versioned sources, every core component has been through a coordinated interaction and accessibility pass, and the library gains new primitives and page-level patterns. It is now the npm `latest` release.

Full detail and migration steps: [v2.0 release notes](https://mangrove.undrr.org/?path=/docs/getting-started-release-notes-v2-0--docs) (source: [`docs/RELEASE-2.0.md`](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-2.0.md)).

## Breaking and visible changes

- **A plain `npm install @undrr/undrr-mangrove` now installs 2.0.** To stay on 1.x for now, pin it: `npm install @undrr/undrr-mangrove@^1`. Versioned CDN paths are unaffected.
- **Sub-brand stylesheets need a theme class.** PreventionWeb, IRP, MCR and DELTA consumers add `class="mg-theme-{brand}"` to `<body>` or a wrapping element, or components fall back to the default UNDRR palette. See [Sub-brand theming migration](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-2.0.md#sub-brand-theming-migration).
- **Three defaults change in every theme.** Neutral surfaces are cool-tinted, the keyboard focus ring is gold rather than the brand colour, and that ring is drawn as two bands. No integration change is needed. DELTA's palette is also corrected against its own sources, so DELTA pages change more than the others. See [Theming, tokens and colour](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-2.0.md#theming-tokens-and-colour).
- **SCSS consumers have nine numbered breaking changes to work through.** They include the removed `$mg-color-*` and `$mg-spacing-*` aliases, the deleted sub-brand `_variables-*.scss` files, the legacy 10px-root stylesheets, the six font-family variables (now five `--mg-font-family-*` roles) and the four CamelCase stylesheet aliases. See [Breaking changes](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-2.0.md#breaking-changes).
- **The deprecated `Pagination` component is removed.** Use `Pager`.
- **Components look and behave differently in places.** Snackbar renders as a Notice, filled buttons paint their fill under the border, StatusLabel indicators carry a shape as well as a colour, and background heroes stack image and copy up to 900px wide. The [upgrade notes](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-2.0.md#upgrade-notes) list each one by integration topic.
- **Browsers need CSS custom property support.** Every colour and spacing value now resolves through `var(--mg-*)` at runtime. Every browser in the supported matrix handles this.

## New features

- **Runtime theming:** one stylesheet can serve every brand, and the combined `style-all.css` lets a page host several brands or switch brand without a rebuild.
- **Public tokens:** the type scale, line heights and a data-visualisation palette with Sendai Framework semantics are CSS custom properties a theme can re-value.
- **New components:** Notice and ServiceNotice, Drawer, Tree, Legend, Range, CopyButton, SkipLink, FormAction, UserFeedback, StatusLabel, EmptyState and SegmentedControl. Drawer, Tree, Legend and Range are prototypes whose APIs may still change in a 2.x minor release.
- **Page-level patterns:** Content Hub, Landing Page and Article Story reference layouts.
- **Vanilla modules:** `js/copy-button.js`, `js/drawer.js` and `js/switch-pending.js` are dependency-free ES modules for pages with no React, and hydration contracts are documented for every hydratable component.

## Bug fixes and hardening

- **Accessibility:** a forced-colours-safe focus indicator on every control, a sweep that named, announced and distinguished controls across six components, and markerless lists that keep their `list` role in Safari without `role="list"`.
- **Arabic and right-to-left:** Noto Kufi Arabic headings with Noto Sans Arabic body text, Arabic rules that respect language boundaries, and logical properties so components mirror correctly.
- **Contrast:** a perceptual (Oklab) methodology runs alongside WCAG 2 on every token pair, including the focus ring and the data-visualisation palette.
- **PageHeader:** since rc.3, `languageDisplay="links"` falls back to the icon dropdown below the tablet breakpoint and past the new `maxLanguageLinks` (default 6), and language lists follow UN order. ([#1284](https://github.com/unisdr/undrr-mangrove/pull/1284))

## Documentation and discoverability

- **Docs domain:** Storybook, `llms.txt`, `llms.json`, `releases.json`, `tokens.json` and `ai-components/` are published at `https://mangrove.undrr.org/`, and old `preventionweb.github.io/undrr-mangrove/` URLs redirect.
- **Editorial manual:** a sourced style guide for UI copy and documentation, with its own `llms-editorial-manual.txt` for agents writing copy. ([#1286](https://github.com/unisdr/undrr-mangrove/pull/1286), [#1289](https://github.com/unisdr/undrr-mangrove/pull/1289))
- **Checked documentation:** tests fail the build on a docs link that resolves to no story and on a package path the documentation names but the package does not ship.

## CDN
```html
<link rel="stylesheet" href="https://assets.undrr.org/mangrove/2.0.0/css/style.css">
```
