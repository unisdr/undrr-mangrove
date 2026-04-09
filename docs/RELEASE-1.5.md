# Mangrove 1.5 release notes

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-1.5.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-release-notes-v1-5--docs).

The main change in 1.5: icons now render via CSS `mask-image` instead of a font. This is a visual improvement and a long-term maintenance win — the `fa-*` fallback classes remain in this release, and HTML markup does not change. **If you use `fa-*` classes directly in Drupal templates, this is your heads-up to begin planning a migration** — the font will be removed in a future release once Drupal-side references are cleaned up. See [the icon migration roadmap](#icon-migration-roadmap-fa--mg-icon-) for the full plan.

> **If you manage a site that uses Mangrove:** your icons will look slightly different. Lucide icons are stroked/outlined; the old FontAwesome 4 icons were solid/filled. Both respond to the CSS `color` property. No HTML changes are required now. If you use `fa-*` classes directly (outside Mangrove components), they continue to work for this release — the font still loads.

1.4.1 was a patch release that shipped shortly after 1.4.0. These release notes cover everything since 1.4.0. For the complete diff, see the [v1.4.0...v1.5.0 comparison on GitHub](https://github.com/unisdr/undrr-mangrove/compare/v1.4.0...v1.5.0).

## What's new since 1.4.0

### New components

- **OnThisPageNav — sticky horizontal page navigation:** A new vanilla JS component that generates a sticky "On this page" bar from page headings (h2/h3/h4) or an explicit link list. Uses IntersectionObserver for scroll-spy, auto-scrolls the nav bar to keep the active link visible, and un-sticks on short viewports per [GOV.UK accessibility research](https://technology.blog.gov.uk/2018/05/21/sticky-elements-functionality-and-accessibility-testing/). Includes an optional pinned CTA, RTL support, configurable heading depth and content scope, and a `data-mg-on-this-page-nav-skip-auto-init` opt-out for manual initialization. ([#879](https://github.com/unisdr/undrr-mangrove/pull/879))

### New features

- **Icon system overhaul — CSS mask-image rendering (phases 1–2):** Replaces Fontello/FontAwesome 4 glyph rendering with `mask-image` rules backed by inline SVG data URIs. Icon sources: [Lucide](https://lucide.dev) for UI icons (MIT licensed, 24×24 stroked paths), [OCHA Humanitarian Icons](https://github.com/UN-OCHA/humanitarian-icons) for domain icons (CC0-1.0), and custom SVGs for social media brand logos (Facebook, X/Twitter, LinkedIn, YouTube, Flickr) and the SDG color wheel. The old `@font-face` and all `fa-*` alias selectors are kept for backward compatibility. No markup changes. See [the full migration roadmap](#icon-migration-roadmap-fa--mg-icon-) below. ([#907](https://github.com/unisdr/undrr-mangrove/pull/907))
- **TableOfContents: published as standalone vanilla JS asset:** `table-of-contents.js` is now auto-discovered by webpack and published to `dist/js/` and npm, following the same convention as `tabs.js` and `on-this-page-nav.js`. Supports auto-initialization from `data-mg-table-of-contents` and `data-mg-table-of-contents-skip-auto-init`. Enables Drupal to load it directly from the CDN import map. ([#901](https://github.com/unisdr/undrr-mangrove/pull/901))
- **Named z-index tokens for global stacking contexts:** Nine new `$mg-z-index-*` SCSS variables replace the previous magic numbers scattered across component files. Nav-zone values (`nav: 10`, `sticky: 11`, `nav-toggle: 14`, `header: 22`) are frozen to avoid breaking Drupal theme CSS that was written against those values. Above that: `drawer: 2000`, `dropdown: 2500`, `modal: 5000`, `toast: 5500`. A new "Z-index layers" page in Storybook documents the full table and reasoning. ([#889](https://github.com/unisdr/undrr-mangrove/pull/889))
- **OnThisPageNav: horizontal overflow scroll arrows:** Scroll `<` / `>` buttons appear when the nav bar has more items than fit in view, giving users a discoverable way to reach hidden links. Buttons are RTL-aware, manage keyboard focus when hidden, and respect `prefers-reduced-motion`. ([#888](https://github.com/unisdr/undrr-mangrove/pull/888))
- **Vanilla JS lifecycle contract standardized:** `show-more.js`, `tabs.js`, and `on-this-page-nav.js` now share a consistent initialization contract: auto-init on `DOMContentLoaded`, `data-mg-*-skip-auto-init` opt-out for manual control, idempotency guard (safe to call init multiple times), and single-element scope. This makes all three safe to load as `type="module"` directly from the CDN without hand-copying the JS into Drupal. ([#886](https://github.com/unisdr/undrr-mangrove/pull/886))

### Fixes

- **Card alignment, button contrast, and theme tokens** — icon card images and icons are now start-aligned (were center-aligned); icon badge shape changed from circle to rounded square (`$mg-card-icon-badge-radius`). Secondary button color updated to meet WCAG AA contrast (was 3.99:1, now compliant). Disabled button updated from near-invisible neutral-400/neutral-300 to readable neutral-500/white. Hero and CTA buttons now show a `:focus-visible` ring in dark contexts. New tokens for secondary and hero button colors allow per-theme overrides. Dead `mg-button-arrow` variant removed. ([#872](https://github.com/unisdr/undrr-mangrove/pull/872))
- **MegaMenu: mobile pointer-events via progressive enhancement** — the `pointer-events: none` restriction on `.mg-mega-topbar__item` is now gated behind `.mg-mega-wrapper--js-active`, a class added on mount. Plain-HTML nav, no-JS environments, and failed/slow hydration keep all links clickable on mobile. ([#916](https://github.com/unisdr/undrr-mangrove/pull/916))
- **OnThisPageNav: scroll to headings inside collapsed tab panels** — the nav now opens any enclosing Mangrove tab panel before calculating scroll position. Headings inside hidden panels previously reported zero dimensions, causing the page to scroll to the top. Nested tab support included. ([#917](https://github.com/unisdr/undrr-mangrove/pull/917))
- **SyndicationSearchWidget: `fromElement` parses `customFilters`, `customFacets`, `visibleTeaserFields`** — these three JSON props were previously silently ignored when mounting from HTML data attributes. ([#920](https://github.com/unisdr/undrr-mangrove/pull/920))

### Documentation

- Writing guidelines updated with a "write for two audiences" principle — consumer docs lead with what it does and how to use it; maintainer context (design decisions, edge cases, history) goes in a separate section or callout. Applied to MegaMenu and ScrollContainer docs. ([#910](https://github.com/unisdr/undrr-mangrove/pull/910))

### Tooling

- Storybook 10.3.5, postcss 8.5.9 ([#918](https://github.com/unisdr/undrr-mangrove/pull/918))
- Batch dependency updates ([#904](https://github.com/unisdr/undrr-mangrove/pull/904), [#882](https://github.com/unisdr/undrr-mangrove/pull/882))

## Coming up

### Content schemas

We are authoring JSON Schema files that define the canonical data contract for each Mangrove component — the fields any consumer (Drupal, Astro, static HTML) needs to render the component correctly. These schemas will ship alongside component JS in the npm package and CDN, making it possible to validate content against them before rendering and giving AI coding tools a precise, structured description of each component's data model.

The initial set covers cards, statistics, quotes, navigation items, and share actions. A follow-on phase will use the schemas to align component prop names — currently some React props (`imgback`, `imgAlt`) diverge from the semantic names the schemas will define. That alignment will happen with a migration path, not a surprise breaking change.

This work is tracked in [#881](https://github.com/unisdr/undrr-mangrove/issues/881), [#883](https://github.com/unisdr/undrr-mangrove/issues/883), and [#884](https://github.com/unisdr/undrr-mangrove/issues/884).

### Icon migration roadmap: `fa-*` → `mg-icon-*`

The icon font is still loaded in 1.5 and `fa-*` classes still work. The full migration is four phases; phases 1 and 2 shipped in this release:

| Phase | What happens | Status |
|---|---|---|
| 1 — Build pipeline | SVG sources, icon map, `yarn build:icons` generates `_icon-definitions.scss` | ✅ Done (1.5.0) |
| 2 — Switch to mask-image | `mg-icon-*` classes render via mask-image; font kept as fallback | ✅ Done (1.5.0) |
| 3 — Drupal migration | All `fa-*` references in Drupal Twig, PHP, and stories migrated to `mg-icon-*` | Planned |
| 4 — Font removal | `@font-face`, `fa-*` selectors, and font files removed from Mangrove | Planned (after phase 3 in production) |

Phase 4 will not happen until phase 3 is deployed and verified in production. If your Drupal templates or custom modules reference `fa-*` classes directly, **now is the right time to start auditing them**. The full issue with known `fa-*` usage locations and icons that need Mangrove equivalents is tracked in [#906](https://github.com/unisdr/undrr-mangrove/issues/906).

## Migration: icon system change (1.5.0)

### What changed

Mangrove icons previously rendered as font glyphs from a Fontello-generated icon font (`mangrove-icon-set`), which declared itself as `FontAwesome`. They now render using `mask-image` on `::before`, backed by SVG data URIs. The SVG acts as a stencil; `background-color: currentColor` fills the visible area. The `color` CSS property still controls icon color, exactly as before.

### What to check

**Markup**: no changes required. `<i class="mg-icon mg-icon-search"></i>` works unchanged.

**`fa-*` classes**: still functional. The font still loads. If your Twig templates, PHP modules, or custom content use `fa-*` classes directly, they continue to render. See the [roadmap above](#icon-migration-roadmap-fa--mg-icon-) for when the font will be removed.

**Custom CSS targeting `::before`**: if you override `font-size` on `.mg-icon::before`, check icons still render at the intended size. The new base rule sets `width: 1em; height: 1em` on `::before` — `font-size` on the `.mg-icon` element controls the rendered size, same as before.

**High Contrast Mode (Windows)**: icons include `forced-color-adjust: none` and an explicit `background-color: CanvasText` fallback in `@media (forced-colors: active)`. Icons remain visible in Edge forced-colors emulation and Windows High Contrast Mode.

### Visual style shift

The old FontAwesome 4 glyphs were solid/filled. Lucide icons are stroked/outlined. OCHA icons are filled. This is intentional — Lucide is actively maintained with ~1,700 icons; FA4 is unmaintained and its `@font-face` declaration (which used the name `FontAwesome`) conflicted with any real FontAwesome installation in Drupal.

UI control icons (search, menu, arrows) are most visibly changed. Domain icons on cards and infographics use OCHA filled icons, which are visually similar to the previous FA4 glyphs.

### Performance

At 79 icons the inline SVG data URIs add roughly 18 KB to the CSS (~7 KB gzipped). This replaces a separate woff2 font file (~12 KB) that required its own HTTP request and could cause FOUT (flash of unstyled text) before loading. Net result: slightly more CSS, one fewer HTTP request, no FOUT.

## Upgrading from 1.4.x

1. Update your dependency: `yarn add @undrr/undrr-mangrove@^1.5.0` (or update `package.json` and run `yarn install`)
2. If you load Mangrove CSS from the CDN, update the version number in your `<link>` tags
3. Copy the updated compiled CSS to your Drupal child themes
4. No `data-mg-*` attribute changes, no React prop changes, no JavaScript changes

```
# CDN
https://assets.undrr.org/static/mangrove/1.5.0/css/style.css

# npm
yarn add @undrr/undrr-mangrove@^1.5.0
```

React component APIs are unchanged — same props, same exports, same `data-mg-*` attributes.
