# Mangrove 1.5 release notes

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-1.5.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-release-notes-v1-5--docs).

The main change in 1.5: icons now render via CSS `mask-image` instead of a font. This is a visual improvement and a long-term maintenance improvement, not a breaking change — the `fa-*` fallback classes remain, and HTML markup does not change.

> **If you manage a site that uses Mangrove:** your icons will look slightly different. Lucide icons are stroked/outlined; the old FontAwesome 4 icons were solid/filled. Both respond to the CSS `color` property. No HTML changes are required. If you use `fa-*` classes directly (outside Mangrove components), they continue to work — the font still loads.

## What else is in 1.5

Our last release was 1.4.1. For the complete diff, see the [v1.4.1...v1.5.0 comparison on GitHub](https://github.com/unisdr/undrr-mangrove/compare/v1.4.1...v1.5.0).

### New features

- **Icon system overhaul — CSS mask-image rendering (phases 1–2):** Replaces Fontello/FontAwesome 4 glyph rendering with `mask-image` rules backed by inline SVG data URIs. Icon sources: [Lucide](https://lucide.dev) for UI icons (MIT licensed, 24×24 stroked paths), [OCHA Humanitarian Icons](https://github.com/UN-OCHA/humanitarian-icons) for domain-specific icons (CC0-1.0), and custom SVGs for social media brand logos (Facebook, X/Twitter, LinkedIn, YouTube, Flickr) and the SDG color wheel. The old `@font-face` and all `fa-*` alias selectors are kept — sites using `fa-*` directly are unaffected until the font removal in a future phase. No markup changes. ([#907](https://github.com/unisdr/undrr-mangrove/pull/907))

### Fixes

- **MegaMenu: mobile pointer-events via progressive enhancement** — `.mg-mega-topbar__item` no longer has `pointer-events: none` as a default style. The restriction is now gated behind `.mg-mega-wrapper--js-active`, a class the React component adds on mount via `useEffect`. Plain-HTML nav, no-JS environments, and failed/slow hydration now keep all links clickable on mobile. ([#916](https://github.com/unisdr/undrr-mangrove/pull/916))
- **OnThisPageNav: scroll to headings inside collapsed tab panels** — clicking a heading link in the sticky "On this page" nav now opens any enclosing Mangrove tab panel before calculating scroll position. Previously, headings inside hidden panels had zero dimensions from `getBoundingClientRect()`, so the page scrolled to the top instead. Nested tab support included. ([#917](https://github.com/unisdr/undrr-mangrove/pull/917))
- **SyndicationSearchWidget: `fromElement` parses `customFilters`, `customFacets`, `visibleTeaserFields`** — these three JSON props were previously silently ignored when mounting from HTML data attributes. They now parse correctly alongside the existing `defaultFilters` and `allowedTypes` props. ([#920](https://github.com/unisdr/undrr-mangrove/pull/920))

### Documentation

- Writing guidelines updated with a "write for two audiences" principle — consumer docs lead with what it does and how to use it; maintainer context goes in a separate section or callout. Applied to MegaMenu and ScrollContainer docs. ([#910](https://github.com/unisdr/undrr-mangrove/pull/910))

### Tooling

- Storybook 10.3.5, postcss 8.5.9 ([#918](https://github.com/unisdr/undrr-mangrove/pull/918))
- Batch dependency updates 2026-04-03 ([#904](https://github.com/unisdr/undrr-mangrove/pull/904))

## Migration: icon system change

### What changed

Mangrove icons previously rendered as font glyphs from a Fontello-generated icon font (`mangrove-icon-set`), which declared itself as `FontAwesome`. They now render using `mask-image` on `::before`, backed by SVG data URIs. The SVG acts as a stencil; `background-color: currentColor` fills the visible area.

The `color` CSS property still controls icon color, exactly as before.

### What to check

**Markup**: no changes required. `<i class="mg-icon mg-icon-search"></i>` works unchanged.

**`fa-*` classes**: still functional. The font still loads. If your Twig templates, PHP modules, or custom content use `fa-*` classes directly, they continue to render. A future phase (Mangrove 1.5.x or 1.6) will migrate `fa-*` references in Drupal to `mg-icon-*` and a subsequent phase will remove the font entirely. You will get advance notice before each step.

**Custom CSS targeting `::before`**: if you have custom CSS that overrides `font-size` on `.mg-icon::before` for sizing, check that the icons still render at the intended size. The new base rule sets `width: 1em; height: 1em` on `::before` — `font-size` on the `.mg-icon` element controls the rendered size, same as before.

**High Contrast Mode (Windows)**: icons include `forced-color-adjust: none` and an explicit `background-color: CanvasText` fallback in `@media (forced-colors: active)`. If you test with Edge forced-colors emulation or Windows High Contrast Mode, icons should remain visible.

### Visual style shift

The old FontAwesome 4 glyphs were solid/filled. Lucide icons are stroked/outlined. OCHA icons are filled. This is an intentional change — Lucide is actively maintained and has far more icons; FA4 is unmaintained and was a source of `@font-face` conflicts with any real FontAwesome installation in Drupal.

In practice the visual change is most visible on UI control icons (search, menu, arrows). Domain icons on cards and infographics use OCHA filled icons, which are visually similar to the previous FA4 glyphs.

### Performance

At 79 icons the inline SVG data URIs add roughly 18 KB to the CSS (~7 KB gzipped). This replaces a separate woff2 font file (~12 KB) that required its own HTTP request and could cause FOUT (flash of unstyled text) before loading. Net result: slightly more CSS, one fewer HTTP request, no FOUT.

## Upgrading from 1.4.x

1. Update your dependency: `yarn add @undrr/undrr-mangrove@^1.5.0` (or update `package.json` and run `yarn install`)
2. If you load Mangrove CSS from the CDN, update the version number in your `<link>` tags
3. Copy the updated compiled CSS to your Drupal child themes
4. No `data-mg-*` attribute changes, no React prop changes, no JavaScript changes

```bash
# CDN
https://assets.undrr.org/static/mangrove/1.5.0/css/style.css

# npm
yarn add @undrr/undrr-mangrove@^1.5.0
```

React component APIs are unchanged — same props, same exports, same `data-mg-*` attributes.
