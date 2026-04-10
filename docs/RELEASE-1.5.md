# Mangrove 1.5 release notes

The main change in 1.5: icons now render via CSS `mask-image` instead of a font. The `fa-*` fallback classes remain in this release and HTML markup does not change. **If you use `fa-*` classes directly in Drupal templates, start auditing them now** — the font will be removed once Drupal-side references are confirmed clean. See the [icon migration roadmap](#icon-migration-roadmap-fa--mg-icon-) for the plan.

> **If you manage a site that uses Mangrove:** UI control icons (search, navigation arrows, menus) will shift from filled/solid to outlined. Domain icons on cards and hazard imagery use OCHA filled icons and look similar to before. This is intentional — see [Visual style shift](#visual-style-shift). No HTML changes needed. If you use `fa-*` classes directly, they still work.

1.4.1 was a documentation-only patch with no functional changes. These notes cover everything since 1.4.0. Full diff: [v1.4.0...v1.5.0 on GitHub](https://github.com/unisdr/undrr-mangrove/compare/v1.4.0...v1.5.0).

> _Edits here show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-1.5.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-release-notes-v1-5--docs)._

## Find your path

| I am… | Go to… |
|---|---|
| A Drupal developer doing the upgrade | [Upgrading from 1.4.x](#upgrading-from-14x) |
| A site manager asking "will anything look different?" | [Visual style shift](#visual-style-shift) |
| An accessibility auditor | [Accessibility improvements](#accessibility-improvements) and [Known issues](#known-issues) |
| Evaluating whether to use OnThisPageNav on a page | [New components](#new-components) |
| Planning the `fa-*` → `mg-icon-*` migration | [Icon migration roadmap](#icon-migration-roadmap-fa--mg-icon-) |
| A React / npm consumer | [Upgrading from 1.4.x](#upgrading-from-14x) — note the [breaking changes](#breaking-changes) |

## What's new since 1.4.0

### New components

- **OnThisPageNav — sticky horizontal page navigation** ([#879](https://github.com/unisdr/undrr-mangrove/pull/879)): A vanilla JS component that builds a sticky "On this page" bar from page headings (h2/h3/h4) or an explicit link list. Uses IntersectionObserver for scroll-spy with `aria-current` tracking, un-sticks on short viewports per [GOV.UK accessibility research](https://technology.blog.gov.uk/2018/05/21/sticky-elements-functionality-and-accessibility-testing/), and supports RTL, configurable heading depth, and an optional pinned CTA. Best on long landing pages and reports — [TableOfContents](https://unisdr.github.io/undrr-mangrove/?path=/docs/atoms-navigation-tableofcontents--docs) is lighter for short pages.

  > **Known limitation:** The overflow fade gradient doesn't flip in RTL. Tracked, fix coming.

### New features

- **Icon system overhaul — CSS mask-image rendering (phases 1–2):** Replaces Fontello/FontAwesome 4 glyph rendering with `mask-image` rules backed by SVG data URIs. Sources: [Lucide](https://lucide.dev) for UI icons, [OCHA Humanitarian Icons](https://github.com/UN-OCHA/humanitarian-icons) for domain icons, custom SVGs for social logos. The old `@font-face` and `fa-*` selectors are kept for backward compatibility. No markup changes. See [Migration: icon system change](#migration-icon-system-change-150) and the [roadmap](#icon-migration-roadmap-fa--mg-icon-) below. ([#907](https://github.com/unisdr/undrr-mangrove/pull/907))
- **TableOfContents and OnThisPageNav: published as standalone vanilla JS assets:** `table-of-contents.js` and `on-this-page-nav.js` are now published to `dist/js/` and the CDN, following the same convention as `tabs.js` and `show-more.js`. See the updated [CDN reference](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-cdn-reference--docs) for the new module paths. ([#901](https://github.com/unisdr/undrr-mangrove/pull/901))
- **Named z-index tokens for global stacking contexts** ([#889](https://github.com/unisdr/undrr-mangrove/pull/889)): Nine new `$mg-z-index-*` SCSS variables replace scattered magic numbers. Nav-zone values (`nav: 10`, `sticky: 11`, `nav-toggle: 14`, `header: 22`) are frozen; above that: `drawer: 2000`, `dropdown: 2500`, `modal: 5000`, `toast: 5500`; `$mg-z-index-behind: -1` for pseudo-element backgrounds. Range 23–1999 is unclaimed — available for custom Drupal elements above the header but below drawers. See the new "Z-index layers" page in Storybook.
- **OnThisPageNav: horizontal overflow scroll arrows:** `<` / `>` buttons appear when the nav bar has more items than fit in view. Buttons are RTL-aware, manage keyboard focus when hidden (WCAG 2.4.3 Focus Order; 2.1.1 Keyboard), and respect `prefers-reduced-motion` (WCAG 2.3.3). ([#888](https://github.com/unisdr/undrr-mangrove/pull/888))
- **Vanilla JS lifecycle contract standardized** ([#886](https://github.com/unisdr/undrr-mangrove/pull/886)): `show-more.js`, `tabs.js`, and `on-this-page-nav.js` share a consistent initialization contract: auto-init on `DOMContentLoaded`, `data-mg-*-skip-auto-init` opt-out, idempotency guard, single-element scope. All three are safe to load as `type="module"` directly from the CDN.

### Accessibility improvements

Several WCAG gaps from previous releases are closed in 1.5:

- **Secondary button contrast** was 3.99:1, below the AA minimum of 4.5:1 (WCAG 1.4.3). It's now 6.49:1 (white on `$mg-color-blue-800`). If your site has an active accessibility audit, this closes that finding.
- **Disabled button text** was nearly invisible at 1.39:1 (`neutral-400` bg / `neutral-300` text). It's now `neutral-500` background / white text at 5.74:1 (WCAG 1.4.3).
- **Hero and CTA button focus rings in dark contexts** (WCAG 2.4.7): a solid `2px outline` now appears on `:focus-visible` for buttons on dark or hero backgrounds, replacing a near-invisible browser default.
- **Icons in Windows High Contrast Mode** (WCAG 1.4.11): the mask-image icon system adds `forced-color-adjust: none` on `.mg-icon` and an explicit `background-color: CanvasText` fallback under `@media (forced-colors: active)`. Icons render in Edge forced-colors emulation and Windows HCM without any action on your part. See `icons.scss` for the rationale behind both rules.
- **Screen readers and PUA characters** (WCAG 4.1.2): font glyphs used Unicode Private Use Area codepoints (`\e808`, etc.) that some screen reader / browser combinations announced aloud. The new `content: ""` approach is silent.
- **MegaMenu links always clickable** (WCAG 2.1.1): the `pointer-events: none` restriction on nav items is now gated behind `.mg-mega-wrapper--js-active`. If your site's MegaMenu links were occasionally unresponsive on mobile, this was the cause. Plain-HTML nav, no-JS environments, and slow hydration all keep links clickable. ([#916](https://github.com/unisdr/undrr-mangrove/pull/916))
- **OnThisPageNav: headings inside collapsed tab panels** (WCAG 2.1.1): the nav now opens any enclosing Mangrove tab panel before calculating scroll position. Headings inside hidden panels previously reported zero dimensions and caused the page to scroll to the top. ([#917](https://github.com/unisdr/undrr-mangrove/pull/917))

### Fixes

- **Card alignment and theme tokens** — icon card images and icons are now start-aligned (were center-aligned); icon badge shape changed from circle to rounded square (`$mg-card-icon-badge-radius`); new tokens for secondary and hero button colors allow per-theme overrides. ([#872](https://github.com/unisdr/undrr-mangrove/pull/872))
- **SyndicationSearchWidget: `fromElement` now correctly parses `customFilters`, `customFacets`, `visibleTeaserFields`** — these three JSON props were previously silently ignored when mounting from HTML `data-*` attributes (`data-custom-filters`, `data-custom-facets`, `data-visible-teaser-fields`). If you use the SyndicationSearchWidget with custom filters or facets configured via data attributes, **verify your configuration is working correctly after upgrading** — these attributes were silently dropped in all previous versions. ([#920](https://github.com/unisdr/undrr-mangrove/pull/920))
- **Breadcrumb separator: CSS-only chevron** — the `li + li::before` separator now renders as a CSS border triangle instead of a font glyph (`\f105`). No markup changes required. Theme CSS that overrides the breadcrumb separator with a font icon rule should be reviewed to avoid a visual conflict with the new border properties.

### Documentation

- Writing guidelines updated with a "write for two audiences" principle. Applied to MegaMenu and ScrollContainer docs. ([#910](https://github.com/unisdr/undrr-mangrove/pull/910))

### Tooling

- Storybook 10.3.5, postcss 8.5.9 ([#918](https://github.com/unisdr/undrr-mangrove/pull/918))
- Batch dependency updates ([#904](https://github.com/unisdr/undrr-mangrove/pull/904), [#882](https://github.com/unisdr/undrr-mangrove/pull/882))

## Breaking changes

### `mg-button-arrow` CSS class removed

The `.mg-button-arrow` CSS variant has been removed. Any Drupal Twig template, custom module, or JavaScript that constructs a button with `class="mg-button mg-button-arrow"` will silently degrade — the element will render as a plain button with no additional styling. Search your templates and custom CSS before upgrading:

```bash
grep -rn "mg-button-arrow" themes/custom/ --include="*.twig" --include="*.html.twig" --include="*.css"
```

### `For_Primary` React prop removed from CtaButton

The `For_Primary` prop on the `CtaButton` component was a no-op and has been removed. Passing it no longer has any effect. If you spread props onto `CtaButton`, verify the prop is not in your spread.

## Coming up

### Content schemas

We're writing JSON Schema files that define the data contract for each Mangrove component — the fields any consumer (Drupal, Astro, plain HTML) needs to render it correctly. They'll ship alongside component JS in the npm package and CDN, so you can validate content before rendering and give AI tools a precise description of each component's data model.

The initial set covers cards, statistics, quotes, navigation items, and share actions. A follow-on phase will use the schemas to align component prop names — some React props (`imgback`, `imgAlt`) diverge from the semantic names the schemas will define. That alignment will happen with a migration path, not a surprise breaking change. This work is tracked in [#881](https://github.com/unisdr/undrr-mangrove/issues/881), [#883](https://github.com/unisdr/undrr-mangrove/issues/883), and [#884](https://github.com/unisdr/undrr-mangrove/issues/884).

### Icon migration roadmap: `fa-*` → `mg-icon-*`

The icon font is still loaded in 1.5 and `fa-*` classes still work. The full migration is four phases; phases 1 and 2 shipped in this release:

| Phase | What happens | Status |
|---|---|---|
| 1 — Build pipeline | SVG sources, icon map, `yarn build:icons` generates `_icon-definitions.scss` | ✅ Done (1.5.0) |
| 2 — Switch to mask-image | `mg-icon-*` classes render via mask-image; font kept as fallback | ✅ Done (1.5.0) |
| 3 — Drupal migration | All `fa-*` references in Drupal Twig, PHP, and stories migrated to `mg-icon-*` | Planned |
| 4 — Font removal | `@font-face`, `fa-*` selectors, and font files removed from Mangrove | Planned (after phase 3 in production) |

Phase 4 will not happen until phase 3 is deployed and verified in production. `fa-*` classes also appear in CKEditor content, contributed module overrides, and custom block templates — not just theme Twig files. Start your audit now:

```bash
# Twig templates and PHP
grep -rn "fa-" themes/custom/ --include="*.twig" --include="*.html.twig" --include="*.php"
# Custom CSS
grep -rn "fa-" themes/custom/ --include="*.css" --include="*.scss"
```

The full issue with known `fa-*` usage locations in Drupal and icons that need Mangrove equivalents is tracked in [#906](https://github.com/unisdr/undrr-mangrove/issues/906).

## Known issues

The following pre-existing issues ship unresolved in 1.5.0. They are tracked in [#908](https://github.com/unisdr/undrr-mangrove/issues/908).

- **Button focus indicator on PreventionWeb (WCAG 2.4.11):** The standard `.mg-button:focus-visible` rule uses a diffuse `box-shadow` glow. On the PreventionWeb/Delta theme, the hover color token resolves to near-transparent, making the focus indicator effectively invisible on white backgrounds. The hero/CTA dark-context focus ring added in this release does not affect this. A solid `outline`-based fix is planned.
- **OnThisPageNav RTL gradient (WCAG 1.4.1):** The overflow fade uses a physical `to right` gradient direction and does not flip in RTL layouts. Arabic users whose nav bar overflows see the fade on the wrong edge.

## Migration: icon system change (1.5.0)

### What changed

Icons previously rendered as font glyphs from a Fontello-generated font (`mangrove-icon-set`, which declared itself as `FontAwesome`). They now render via `mask-image` on `::before`, backed by SVG data URIs — one fewer HTTP request and no FOUT on slow connections. `background-color: currentColor` fills the visible area; `color` still controls icon color.

### What to check

**Markup**: no changes required. `<i class="mg-icon mg-icon-search"></i>` works unchanged.

> **For Drupal HTML authors:** when adding icons to markup manually, decorative icons should include `aria-hidden="true"` (WCAG 4.1.2). When an icon is the sole content of a `<button>` or `<a>`, the interactive element needs a visible or screen-reader label. The React `Icon` component handles this automatically; raw `<i>` elements in Twig templates do not.

**`fa-*` classes**: still functional. The font still loads. If your Twig templates, PHP modules, or custom content use `fa-*` classes directly, they continue to render. See the [roadmap](#icon-migration-roadmap-fa--mg-icon-) for when the font will be removed.

**Custom CSS targeting `::before`**: if you have CSS that overrides `width` or `height` on `.mg-icon::before` — for example, `{ width: 14px; height: 14px; }` — that now actively sizes the icon box. Previously such rules were harmless under the font system. Check that any fixed-size overrides still produce the intended result. To control icon size, set `font-size` on `.mg-icon` (the `::before` box is `1em × 1em`, so it scales with the parent).

**Multicolor icons (`.mg-icon--multicolor`)**: the modifier renders the SVG with its original colors via `background-image`. Because the icon communicates meaning through color (e.g., the SDG color wheel), **always pair a multicolor icon with a visible text label** — WCAG 1.4.1 prohibits color as the sole means of conveying information.

**High Contrast Mode (Windows)**: icons now include `forced-color-adjust: none` and an explicit `background-color: CanvasText` fallback. Icons are visible in Windows HCM without any action on your part.

**Printing**: a `@media print` override ensures icons remain visible when pages are printed — standard print stylesheet resets (`background: transparent !important`) no longer affect mask-image icons.

### Visual style shift

FA4 glyphs were solid/filled; Lucide icons are stroked/outlined; OCHA domain icons are filled. The switch is intentional — Lucide has ~1,700 actively maintained icons, and FA4's `@font-face` (which declared itself as `FontAwesome`) conflicted with any real FontAwesome installation in Drupal.

UI control icons (search, menu, arrows) are most visibly changed. Domain icons on cards and infographics use OCHA filled icons, visually similar to the previous FA4 glyphs.

## Upgrading from 1.4.x

1. Update your dependency: `yarn add @undrr/undrr-mangrove@^1.5.0` (or update `package.json` and run `yarn install`)
2. If you load Mangrove CSS from the CDN, update the version number in your `<link>` tags
3. Copy the updated compiled CSS to your Drupal child themes. **If you are on a legacy theme (`style-legacy.css`, `style-preventionweb-legacy.css`, etc.), copy the updated legacy file — not `style.css`.** See the [CDN reference](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-cdn-reference--docs) for the full source-to-destination mapping.
4. Check for `mg-button-arrow` and `For_Primary` usages — see [Breaking changes](#breaking-changes)

```
# CDN
https://assets.undrr.org/static/mangrove/1.5.0/css/style.css

# npm
yarn add @undrr/undrr-mangrove@^1.5.0
```

Most React component APIs are unchanged. The exception is `CtaButton`, which no longer accepts the `For_Primary` prop (it was a no-op). All other props, exports, and `data-mg-*` attributes are the same.

**Verifying the icon upgrade:** after copying updated CSS, open DevTools and inspect any `.mg-icon` element. Under Computed styles, look for `mask-image` on `::before`. A data URI confirms the new CSS is loaded. An empty value or `none` means you are still serving the old stylesheet.
