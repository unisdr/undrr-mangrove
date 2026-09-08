# Mangrove 2.0 release notes

Mangrove 2.0 combines three related workstreams: the runtime theming foundation published in `2.0.0-alpha.1`, the experience and interaction baseline in `2.0.0-alpha.2`, and the design token pipeline introduced in `2.0.0-alpha.3`. See [PR #1061](https://github.com/unisdr/undrr-mangrove/pull/1061) for the first alpha, [PR #1086](https://github.com/unisdr/undrr-mangrove/pull/1086) for alpha.2 and [PR #1087](https://github.com/unisdr/undrr-mangrove/pull/1087) for alpha.3. The tagged `v1.8.2...v2.0.0` comparison lands with the stable release.

> **If you consume the base UNDRR compiled CSS (CDN or prebuilt), no sub-brand theming:** the alpha.1 theming migration requires no integration change. Alpha.2 intentionally refreshes component presentation and interaction while retaining existing Drupal hydration and BEM contracts, apart from the deprecated Pagination removal.
>
> **Alpha.3 adds no required integration change, but it does change three system-wide defaults that every consumer will see, in every theme:** the neutral ramp's surface half is now cool-tinted, the keyboard focus ring is no longer the brand colour, and the focus ring is drawn as two bands. See [Alpha.3](#alpha3-token-pipeline-and-colour-methodology).
>
> **DELTA consumers: your palette changed.** DELTA was built on a navy that appears nowhere in DELTA's own codebase. Alpha.3 replaces it with DELTA's real sourced palette. This is the one theme whose compiled output moves beyond the three shared defaults. See [DELTA's palette is corrected](#deltas-palette-is-corrected).
>
> **If you consume a sub-brand compiled stylesheet** (PreventionWeb, IRP, MCR, DELTA): one required change — add the matching `mg-theme-*` class to `<body>` or a wrapping element, or components fall back to the default UNDRR palette. See [Sub-brand theming migration](#sub-brand-theming-migration).
>
> **If you import Mangrove SCSS directly** or override `$mg-color-*` / `$mg-spacing-*` variables in your own stylesheets: see the [breaking changes](#breaking-changes) below.

> _Edits here show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-2.0.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-release-notes-v2-0--docs)._

## Try the alpha

2.0 ships as a **prerelease** under the `next` dist-tag, so it never lands on `latest` — a plain `npm install @undrr/undrr-mangrove` stays on 1.x until 2.0 is stable. This release is `2.0.0-alpha.3`; until the manual publish completes, `@next` may still resolve to an earlier alpha.

```bash
# npm (prerelease tag — does not become your default version)
npm install @undrr/undrr-mangrove@next
```

```html
<!-- CDN, versioned path (pick the base or a sub-brand stylesheet) -->
<link rel="stylesheet" href="https://assets.undrr.org/static/mangrove/2.0.0-alpha.3/css/style.css">
<link rel="stylesheet" href="https://assets.undrr.org/static/mangrove/2.0.0-alpha.3/css/style-preventionweb.css">
```

For a compiled-CSS consumer the entire trial is two lines: swap the stylesheet href above, and — for a sub-brand — add `class="mg-theme-{brand}"` to `<body>` or a wrapping element. Found a problem? See [where to report](#feedback).

## Alpha roadmap

| Prerelease | Status | Focus |
|---|---|---|
| `2.0.0-alpha.1` | Published under `next` | CSS custom-property theming, 16px root and sub-brand runtime selectors |
| `2.0.0-alpha.2` | Published under `next` | Experience principles, component surfaces, interaction states, responsive behaviour and multilingual resilience |
| `2.0.0-alpha.3` | Release-ready on `main`; not yet published | Design token pipeline, status and empty-state components, data-visualisation palette and a perceptual colour-contrast methodology |
| `2.0.0-alpha.4` | In development on `main` | Arabic typography settled on Noto Kufi Arabic and Noto Sans Arabic, replacing Dubai |

### Alpha.2 experience and interaction baseline

Alpha.2 applies a shared experience direction without mechanically homogenising components or overriding theme-owned expression:

- Shared surface, border, shadow, radius, focus and reduced-motion tokens provide a consistent foundation.
- Buttons, forms, cards, hero compositions, tabs, disclosures, menus, on-page navigation, tables, Pager, ScrollContainer and Text CTA receive coordinated responsive and interaction refinements.
- The new `FormAction` composition joins a field and its key action for search, subscription and select-and-continue flows, with accessible help and error wiring, RTL support and optional mobile stacking.
- The new standalone `UserFeedback` component brings the common page-usefulness prompt into Mangrove for the usual pre-footer position. It ships as a package-root React export and direct hydratable bundle while keeping response storage, analytics and consent product-owned.
- The editorial CTA gains stable hover geometry, logical RTL placement and safe wrapping for long translations. Conventional buttons remain the default for forms, consent and utility actions.
- Chips distinguish navigational links from dismiss actions and add visible removal affordances, logical spacing, focus, reduced-motion and forced-colour support.
- Inline code uses a compact theme-aware surface with clearer monospace typography and coherent decoration across wrapped snippets.
- Storybook's global locale toolbar becomes the canonical translation mechanism; dedicated RTL and long-label stories remain where they test a distinct layout condition.
- `FormAction` ships as a direct ESM component entry, and published component bundles are built against React's production JSX runtime rather than reusing Storybook development transforms.
- Every compiled CSS bundle includes a preserved Mangrove version banner synchronized from `package.json`, making deployed asset versions visible in source and diagnostics.

Alpha.2 has been checked across desktop and mobile layouts, Chromium and Firefox, RTL, long labels, keyboard focus, reduced motion, forced colours and representative UNDRR themes. See the [Experience principles](https://unisdr.github.io/undrr-mangrove/?path=/docs/design-decisions-experience-principles--docs) for the design guardrails behind these changes.

### Alpha.3 token pipeline and colour methodology

A foundation release. No required integration change, but **three defaults change for every consumer in every theme**, and DELTA's palette is corrected further.

**Design tokens have a source.** Brand palettes move from hand-maintained SCSS to YAML sources under `tokens/`, compiled into the same CSS and Sass the library already used. The format borrows [W3C DTCG](https://tr.designtokens.org/)'s vocabulary rather than conforming to it, so it is not consumable by DTCG tooling as it stands. The build fails on an unknown or circular reference, a duplicate output name or a wrong token shape. Generated output is no longer committed — `yarn scss` produces it and a Jest `globalSetup` writes anything missing, so a fresh clone still tests clean. Base, PreventionWeb, IRP and MCR values are unchanged; three tokens change shape ([breaking change #7](#7-three-button-tokens-changed-shape)).

**The neutral ramp's surface half is cool-tinted.** `neutral-25` through `neutral-400` gain a small cool tint — `#f2f2f2` → `#f0f3f6`, `#808080` → `#7e8082`, and four steps between. The page (`neutral-0`) and the dark half — text, rules, shadows — are untouched. No graded contrast pair loses on either measure. Nothing to do, unless your own stylesheet restates Mangrove's greys as literal hex; read `rgb(var(--mg-color-neutral-25))` instead.

**The focus ring is no longer the brand colour.** It was aliased to `--mg-color-interactive`, so focus and selection were the same signal. It is now `--mg-color-gold-800` (`#866200`) in every theme. The focused field's *border* stays brand-coloured — the border says the field is active, the ring says the keyboard is here. To put a brand ring back, set `--mg-color-focus-ring` on `:root` or your theme selector.

**The ring is now two bands, which fixed two real defects.** A separator against the control, then the ring — shipped as `mg-focus-ring` / `mg-focus-ring-inset`. Doing it properly surfaced a **checked radio with no focus indicator at all** (WCAG 2.4.7, level A) and **`.mg-button`, `.mg-chip` and the form inputs with none in forced-colours mode**. `Tab` is fixed too: in DELTA its ring was drawn in the tab's own fill at 1.00:1.

**New components.** `StatusLabel` (`--draft`, `--published`, `--waiting-validation`, `--waiting-information`) and `EmptyState` (`--compact`, `--panel`, `--start`).

**A data-visualisation palette with real Sendai semantics.** `--mg-sendai-target-a` through `-g` express the seven framework targets. The old `--sendai-red|orange|purple|turquoise` tokens and their utility classes are **deprecated** — they are accent hues named by colour, carrying no framework meaning. They keep working until 2.1.

**Colour contrast is graded twice.** Every token pair is measured with WCAG 2 and an [Oklab](https://www.w3.org/TR/css-color-4/#ok-lab) perceptual measure, across every theme and state, and the build fails if a pair passes perceptually while WCAG 2 fails it. Pairs that cannot yet meet the target are recorded as explicit exceptions rather than excluded. APCA was evaluated and rejected on licensing grounds — see [Colour contrast methodology](https://github.com/unisdr/undrr-mangrove/blob/main/docs/COLOUR-CONTRAST-METHODOLOGY.md).

#### DELTA's palette is corrected

DELTA's theme was built on a navy that appears nowhere in DELTA's own codebase. Alpha.3 reads its colours from DELTA's production repository and design file instead: its brand blue is UNDRR blue, and UNDRR Teal is a genuine second brand colour Mangrove had collapsed into the primary. **26 of DELTA's 57 tokens move, and its buttons become filled** — previously navy text on no background, now white on brand blue. If your DELTA site restates any of these colours, it will need updating. Per-token values are in the [changelog](https://github.com/unisdr/undrr-mangrove/blob/main/CHANGELOG.md).

#### Arabic text uses one family

Arabic headings were Noto Kufi Arabic and body was Dubai. Both became Dubai in alpha.3, so Arabic readers downloaded one font instead of two.

A caveat was stated at the time: dropping Kufi was a judgement rather than a correction. **That has since been settled the other way** — see [Arabic typography settled](#alpha4-arabic-typography-settled) below. Dubai is no longer shipped.

#### Not yet resolved

These are known and deliberately unfinished in alpha.3:

- Sub-brand tab colours are not wired into the alpha.2 underline tab treatment. The brands designed a filled tab (white on a solid brand background); piping those colours into an underline on a white page measures 1.00:1. Resolving it is a design decision, not a wiring change.
- The accent ramp is the largest remaining accessibility debt and is the reason most of the 65 WCAG exceptions exist. Retuning it is a brand decision.
- Forced-colours behaviour has not been verified in real Windows High Contrast, only in emulation. The two-band mixins are built to degrade correctly there, but that is reasoned, not observed.
- `--mg-color-focus-ring-inverse` resolves to white in all five themes, so it is a seam with nothing behind it yet. It earns its keep only when a theme retunes it.

### Alpha.4 Arabic typography settled

**Arabic now pairs Noto Kufi Arabic headings with Noto Sans Arabic body text. Dubai is removed.** This closes [issue #1089](https://github.com/unisdr/undrr-mangrove/issues/1089), which asked for the Arabic typeface to be chosen deliberately rather than inherited.

Dubai came to Mangrove from OCHA, but the inheritance was weaker than it looked and had gone stale on both halves. Dubai was OCHA's *alternative* subtheme pairing — body only, never headings, Regular only — not their base theme, which used Noto Kufi Arabic. And on 2026-05-28 OCHA's own brand guidance moved to Almarai for display and Noto Sans Arabic for body.

Both Noto families are [SIL Open Font License 1.1](https://openfontlicense.org/).

This is two Arabic families where alpha.3 had one, and that is deliberate. Kufi is a display style — angular, high contrast, architectural — so it earns its place in headings and is the wrong choice at body size; Noto Sans Arabic carries the running text and shares Noto Sans' proportions. The second download is subset by `unicode-range` across `arabic`, `latin` and `latin-ext`, so a page fetches only the scripts it renders — an English string inside an Arabic page pulls the small `latin` file, not the much larger `arabic` one.

Only Regular (400) and Bold (700) are published in the UNDRR asset library for either family, unchanged from Dubai, so Arabic keeps a 400/700 ladder where Latin has four steps. Both upstream families span 100-900, so adding a weight is an asset-library packaging task rather than an upstream limitation.

Per the CSS font-matching rules a target of `600` resolves up to Bold, but a target of `400`-`500` resolves *down*, so `font-weight: 500` renders Regular in Arabic. That is less of a divergence from Latin than it first appears: Roboto publishes a Medium, but **Roboto Condensed does not**, so compact chrome set in the condensed face already renders Regular at 500 in both scripts. Only the `font-weight: 500` declarations sitting on the Roboto body face actually differ. This was equally true of Dubai.

**Two costs worth stating plainly.**

*Glyph coverage narrows.* Dubai was a single unsubsetted file; the replacements are subsetted, and the asset library publishes only the `arabic`, `latin` and `latin-ext` subsets — not `math` or `symbols`. Around 158 codepoints Dubai rendered now fall through to the next font in the stack. The ones most likely to appear in DRR content are the superscripts `²` and `³` (as in km², m³), `±`, the fractions `½ ¼ ¾`, `µ`, the comparison and statistical signs `≤ ≥ ≠ ≈ ∞ √ ∑ ∫ ‰`, Greek letters, and the footnote daggers `† ‡`. These still render, in the reader's fallback face, at a different weight and cap-height. Closing the gap means publishing the missing subsets in the asset library, not a change here.

*Arabic pages get heavier.* Two families means two Arabic downloads. For a page using both weights of both faces the `arabic` subsets total roughly 187 KB against Dubai's 115 KB — about **+72 KB (+63%)**. The `unicode-range` split genuinely helps the Latin subsets, which are small and fetched only when Latin appears, but it does not offset the second Arabic face. This is the price of the heading/body distinction; it is a real cost, not a free one.

**If you override the Arabic tokens**, `$mg-font-family-arabic-headings` and `$mg-font-family-arabic-body` now default to `"Noto Kufi Arabic", sans-serif` and `"Noto Sans Arabic", sans-serif`. If you restated either as Dubai, that override still compiles but Mangrove no longer emits a Dubai `@font-face`, so you must declare your own or drop the override. The fonts are served WOFF2-only from `https://assets.undrr.org/fonts/`.

## Find your path

| I am... | Go to... |
|---|---|
| A **base UNDRR** Drupal/CDN consumer, no custom SCSS | [What changed visually](#what-changed-visually) and [the alpha.2 baseline](#alpha2-experience-and-interaction-baseline) |
| A **sub-brand** Drupal/CDN consumer (PW, IRP, MCR, DELTA) | [Sub-brand theming migration](#sub-brand-theming-migration) — add the `mg-theme-*` body class |
| A **DELTA** consumer | [DELTA's palette is corrected](#deltas-palette-is-corrected) — your brand colours changed |
| A developer who imports Mangrove SCSS | [Breaking changes](#breaking-changes) |
| A developer who overrides sub-brand tokens | [Sub-brand theming migration](#sub-brand-theming-migration) |
| A developer who uses the **`--sendai-*` accent colours** | [Alpha.3](#alpha3-token-pipeline-and-colour-methodology) — deprecated, replaced by `--mg-sendai-target-a`…`-g` |
| An AI agent or tool reading this for API context | [Token API summary](#token-api-summary) |

## What changed visually

In **alpha.1**, colors and spacing remain visually equivalent for base UNDRR consumers: the values moved from SCSS variables to CSS custom properties, but the compiled `style.css` output is equivalent.

**Alpha.2** intentionally refreshes the presentation and interaction of core components. It introduces softer theme-aware surfaces, clearer focus and hover states, more consistent responsive spacing, joined form actions and stronger multilingual behaviour. Semantic shapes remain component-specific: carousel controls stay circular, chips retain meaningful pill geometry and institutional chrome continues to express its owning theme.

**Alpha.3** changes three things in every theme — the neutral ramp's surface half is cool-tinted, the focus ring is gold rather than the brand colour, and that ring is now two bands — plus DELTA's palette, corrected against its own design sources. The tint is subtle per surface and cumulative across a page. DELTA's buttons in particular go from unfilled navy text to white on brand blue. See [Alpha.3](#alpha3-token-pipeline-and-colour-methodology).

Otherwise the token rewrite carries the values it started with, apart from [three tokens that changed shape](#7-three-button-tokens-changed-shape). `StatusLabel` and `EmptyState` are additions no existing component uses.

**Sub-brand consumers (PreventionWeb, IRP, MCR, DELTA) have one required change.** Brand colors previously baked into every component rule at compile time; they now live in a `.mg-theme-{brand}` selector block. Add `class="mg-theme-{brand}"` to `<body>` or a wrapping element, or components render with the default UNDRR palette instead of the brand palette. See [Sub-brand theming migration](#sub-brand-theming-migration).

**Browser floor changed.** 2.0 now *requires* CSS custom property support: because every color and spacing value resolves through `var(--mg-*)` at runtime, a browser without custom-property support loses **all** Mangrove color and spacing — not just an effect here and there. (In 1.x those values were baked in, so an old browser still rendered.) Alpha-composited colors — overlays, hover tints, modal scrims — additionally use the `rgb(var() / alpha)` syntax. Every browser in the [supported matrix](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-browser-support--docs) handles both correctly; this only matters for browsers below that floor.

## Breaking changes

### 1. `$mg-color-*` and `$mg-spacing-*` SCSS aliases removed

The backward-compat SCSS aliases are gone. Any stylesheet that references these variables will fail to compile.

| Old | New |
|---|---|
| `$mg-color-interactive` | `var(--mg-color-interactive)` |
| `$mg-color-blue-900` | `rgb(var(--mg-color-blue-900))` |
| `$mg-spacing-150` | `var(--mg-spacing-150)` |

**Alpha values:** `rgba($mg-color-X, 0.5)` is not valid once the variable chains to `var()`. Use `rgb(var(--mg-color-X) / 0.5)` instead.

**SCSS `color.adjust()` / `darken()` / `lighten()`:** these SCSS functions cannot accept CSS custom properties as arguments. Replace with a computed hex literal or restructure the logic.

**Silent failure — overrides that compile but do nothing.** The loud case above (a *reference* that fails to compile) is the safe one. The dangerous case is *assigning* one of these variables before importing Mangrove:

```scss
// Compiles cleanly, produces NO effect in 2.0:
$mg-color-interactive: #0a6969;
@import "@undrr/undrr-mangrove/scss/assets/scss/style";
```

Components now read `var(--mg-color-interactive)`, not the SCSS variable — so your brand color silently reverts to the default UNDRR palette and nothing errors. Symptom: *"my brand color went back to UNDRR blue and the build was green."* To catch this, Mangrove's build emits a `@warn` when it sees a commonly-overridden `$mg-color-*` / `$mg-spacing-*` variable defined at import time — watch your Sass build log. The fix is to move the override to a CSS custom property (see [Sub-brand theming migration](#sub-brand-theming-migration)).

The following remain as SCSS variables (BUILD-TIME ONLY — no CSS custom property equivalent):

| Variable | Reason |
|---|---|
| `$mg-breakpoint-*` | `@media` queries require static values at compile time |
| `$mg-font-size-*` | Resolved at compile time for interpolation |
| `$mg-font-family*` | Resolved at compile time |
| `$mg-html-font-size` | Base rem anchor, compile-time only |
| `$mg-tabs-border-bottom` | `@if` conditional, compile-time only |

### 2. Sub-brand `_variables-*.scss` files deleted

The four sub-brand variable override files are gone. Each is replaced by a `_theme-{name}.scss` file.

| Deleted | Replacement |
|---|---|
| `_variables-irp.scss` | `_theme-irp.scss` |
| `_variables-preventionweb.scss` | `_theme-preventionweb.scss` |
| `_variables-mcr.scss` | `_theme-mcr.scss` |
| `_variables-delta.scss` | `_theme-delta.scss` |

If you have a custom SCSS entry point that imports one of these files, update the import:

```scss
// Before
@import "./variables-irp";

// After
@import "./theme-irp";
```

The new files contain a `.mg-theme-irp { }` selector block rather than SCSS variable reassignments. Apply the class to `<body>` or a wrapping element at runtime.

### 3. Hero variant colour map

`hero.scss` stores variant colour names as CSS custom property name strings (`"--mg-color-orange-800"`) rather than resolved SCSS values. Consumers that previously overrode `$mg-color-hero--secondary !default` must instead override the relevant `--mg-color-*` custom property on `:root`.

```scss
// Before (1.x) — reassign the SCSS variable before import
$mg-color-hero--secondary: #b34700 !default;

// After (2.0) — override the custom property (globally on :root,
// or per-brand inside a .mg-theme-* block)
:root {
  --mg-color-hero--secondary: var(--mg-color-orange-800);
}
```

### 4. `storybook-design-token` plugin removed

If you depend on the plugin being present in the Storybook addon registry, it is gone. The Design decisions/Colors, Spacing, Widths, Breakpoints, and Typography pages use `getComputedStyle` and static tables instead.

### 5. Legacy 10px root removed

The `style-legacy.scss`, `style-preventionweb-legacy.scss`, `style-irp-legacy.scss`, and `style-mcr-legacy.scss` entry points are deleted, and `$mg-html-font-size` is now fixed at `16` (the `!default` override is gone). Mangrove 2.0 assumes the **browser-standard 16px document root** and no longer emits a root `font-size` override.

Consumers that ran on the legacy 10px root — a `html { font-size: 62.5% }` (or `10px`) root, or a build that set `$mg-html-font-size: 10` — must migrate:

- Serve your document at a **16px root** (remove the `62.5%`/`10px` `html` font-size).
- **Convert your own rem-based CSS from a 10px to a 16px basis.** A rule that meant 14px as `1.4rem` under a 10px root now renders 22.4px; rewrite it (e.g. `0.875rem`, or use `px`). This is the substantive part of the migration — Mangrove's own output is already correct for the 16px root.

There is no compatibility build; the 16px root is the only supported basis.

### 6. Deprecated Pagination component removed

The deprecated `Pagination` component, its stories and documentation are removed in alpha.2. Use `Pager`, which is the supported 2.0 pagination pattern. Existing consumers that still import or render `Pagination` must migrate before adopting this prerelease.

### 7. Three button tokens changed shape

Added in alpha.3. Three tokens moved from a bare RGB channel triple to a complete colour value. Components consumed them as `rgb(var(--token))` and now consume them as `var(--token)` directly.

| Token | Before | After |
|---|---|---|
| `--mg-color-button-background` | channels — `0 79 145` | colour — `rgb(0 79 145)` |
| `--mg-color-button-background--hover` | channels | colour |
| `--mg-border-color-button` | channels | colour, and may be `transparent` |

**Two of these break overrides.** `--mg-color-button-background` and `--mg-color-button-background--hover` are on the legacy-override warn list precisely because consumers set them. An override still written as channels is now invalid and the browser drops it silently — buttons lose their fill. Wrap the channels in `rgb()`:

```scss
.mg-theme-mytheme {
  --mg-color-button-background: rgb(10 105 105); // was: 10 105 105
}
```

**`--mg-border-color-button` is a fix.** It held channels but was consumed in a bare colour position, so the declaration was invalid in every theme and no button border was ever painted.

## Sub-brand theming migration

**Consuming a compiled sub-brand stylesheet?** You do not touch SCSS at all — just add `class="mg-theme-{brand}"` (e.g. `mg-theme-preventionweb`) to `<body>` or a wrapping element. The compiled CSS already carries the brand block; the class is what activates it. Skip to [Apply the class](#sub-brand-theming-migration) below.

**Authoring your own theme in SCSS?** The new pattern applies CSS custom property overrides at runtime via a selector class, rather than at SCSS compile time via `!default` variable reassignment.

**Before (1.x):**

```scss
// _variables-mytheme.scss — imported before components
$mg-color-interactive: #0a6969 !default;
$mg-color-button-background: #0a6969 !default;
```

**After (2.0):**

```scss
// _theme-mytheme.scss
.mg-theme-mytheme {
  // Channel-triple token: consumed as rgb(var(--mg-color-interactive)).
  --mg-color-interactive:        var(--mg-color-teal-900);
  // Full-colour token: wrap the channels in rgb() yourself.
  --mg-color-button-background:  rgb(var(--mg-color-interactive));
}
```

> **Two token shapes.** Most palette tokens hold bare RGB channels (`0 79 145`) and components wrap them in `rgb()` at the point of use. A few hold a complete colour instead, because they have to be able to say `transparent` — a channel triple cannot. Assigning the wrong shape produces an invalid declaration that the browser drops silently. See [breaking change #7](#7-three-button-tokens-changed-shape) for the three tokens that changed.

Apply the class in your HTML:

```html
<body class="mg-theme-mytheme">
```

The class can be applied to any ancestor element, not just `<body>`. Multiple theme classes can co-exist on different subtrees.

### Multi-brand pages and the combined bundle

Because component CSS is now brand-neutral (it reads `var(--mg-color-*)` rather than baked values), one stylesheet can serve every brand. A **combined bundle** — `style-all.css` — carries the base `:root` palette plus all four `.mg-theme-*` blocks, so a page can host more than one brand, or switch brand at runtime, by toggling the body/wrapper class with no rebuild. Use a per-brand stylesheet (`style-preventionweb.css`, …) when a site only ever renders one brand; use `style-all.css` when it needs several.

> **One Mangrove stylesheet per page.** Each stylesheet defines the token custom properties on `:root`; loading two Mangrove bundles on the same page (for example a base `style.css` and a per-brand `style-preventionweb.css`) makes them fight over the same `:root` globals, and the last one loaded wins. Pick a single bundle — the combined `style-all.css` if you need multiple brands.

## Token API summary

All color and spacing tokens are now CSS custom properties on `:root`. Palette colors use space-separated RGB channels to enable alpha compositing:

```css
--mg-color-blue-900: 0 79 145;           /* channel format */
--mg-color-interactive: var(--mg-color-blue-900);  /* semantic alias */
```

Consuming a color:

```css
color: rgb(var(--mg-color-interactive));
background: rgb(var(--mg-color-interactive) / 0.1);  /* with alpha */
```

Full token list: [Design decisions/Colors](https://unisdr.github.io/undrr-mangrove/?path=/docs/design-decisions-colors--docs), [Design decisions/Spacing](https://unisdr.github.io/undrr-mangrove/?path=/docs/design-decisions-spacing--docs).

## Feedback

2.0 is an alpha — feedback is wanted. Report issues at the tracker (**canonical location TBD — set before the public alpha**; likely the [GitHub issues](https://github.com/unisdr/undrr-mangrove/issues) or the project's new GitLab home). To make a report actionable, include three things:

1. **Consumption mode** — compiled CSS via CDN, compiled CSS via npm, or SCSS import.
2. **Brand** — base UNDRR, or which sub-brand (PreventionWeb / IRP / MCR / DELTA).
3. **What you saw vs. expected** — including whether your Sass build printed any `Mangrove 2.0:` warning.
