# Mangrove 2.0 release notes

Mangrove 2.0 is a major refresh of the library. Theming moved to runtime CSS custom properties, design tokens now come from versioned sources with automated drift checks, every core component went through a coordinated interaction and accessibility pass, and the library gained a set of new primitives and page-level patterns.

This page describes 2.0 as a whole, organised by theme rather than by prerelease. The per-prerelease record lives in [GitHub Releases](https://github.com/unisdr/undrr-mangrove/releases), one entry per alpha, beta and release candidate, in the format `docs/RELEASES.md` defines; cross-cutting library notes are in [`CHANGELOG.md`](https://github.com/unisdr/undrr-mangrove/blob/main/CHANGELOG.md) and per-component history is in each component's `## Changelog` in Storybook.

`2.0.0-rc.3` is the final planned polishing release before stable 2.0. We expect stable 2.0 shortly, subject to final integration testing. One earlier tag never reached npm: `2.0.0-beta.2` was tagged but not published, so its changes first became installable in `2.0.0-beta.3`.

This guide covers `2.0.0-rc.3`, published on npm under the `next` tag. **Available from `2.0.0-rc.3`** marks package changes absent from rc.2. Documentation, Storybook, the AI manifest and versioned CDN assets deploy separately from npm; confirm those assets are available before following a CDN example. GitHub Actions is currently blocked by the organisation flag, so each deployment requires separate verification.

## What's new in 2.0

If you only need the highlights, start here. Each group links to the fuller technical detail further down.

**Theming, tokens and colour**

- Theming moved from compiled SCSS variables to runtime CSS custom properties with `.mg-theme-*` selectors, so one stylesheet can serve every brand and a page can switch brand without a rebuild.
- Design tokens come from versioned YAML sources (`tokens/*.yaml`), compiled by a generator that fails the build on a malformed or circular token, with a committed baseline manifest that catches unintended compiled-output drift in tests.
- Three system-wide visual defaults changed, in every theme: cool-tinted neutral surfaces, a non-brand gold focus ring, and a two-band focus treatment. DELTA's palette was corrected against its real production sources.
- The type scale and line heights are public custom properties (`--mg-font-size-*`, `--mg-font-line-height-*`), so a theme can re-value them at runtime.
- A perceptual (Oklab) colour-contrast methodology runs alongside WCAG 2 on every token pair, including the focus ring and the data-visualisation palette for the first time. See [Theming, tokens and colour](#theming-tokens-and-colour).

**Component experience and interaction**

- Buttons, forms, cards, hero compositions, tabs, disclosures, menus, on-page navigation, tables, Pager, ScrollContainer and Text CTA received a coordinated responsive and interaction refresh.
- Tabs centre when they fit and scroll when they overflow; MegaMenu reveals one mobile level at a time and animates its desktop flyout; PageHeader's account link and language switcher are icon-only at every width.
- Filled buttons paint their fill under the border, icons in buttons are centred, and a standalone `.mg-icon-button` owns its own styling instead of inheriting MegaMenu's.
- Switches gained a pending state for changes that save asynchronously, an error state matching every other form control, and size hooks that derive every length from one number. See [Component experience and interaction](#component-experience-and-interaction).

**Typography, language and accessibility**

- Arabic typography is settled: Noto Kufi Arabic headings with Noto Sans Arabic body text, replacing Dubai, and Arabic overrides now respect language boundaries instead of leaking across them.
- Font families are five script-mapped roles instead of six ad hoc SCSS variables.
- Components mirror properly in Arabic: Hero, Card, StatsCard, Author image, the form error summary and syndicated search use logical properties rather than physical left and right.
- Every focused control has a forced-colours-safe indicator, and a pre-release sweep named, announced and visually distinguished controls across six components.
- One library-wide rule for markerless lists keeps the `list` role Safari otherwise drops, so item counts stay announced without `role="list"` in consumer markup. See [Typography, language and accessibility](#typography-language-and-accessibility).

**New components and patterns**

- Content Hub, Landing Page and Article Story reference patterns give consumers composable, production-ready page-level layouts.
- New components: `Notice` and `ServiceNotice`, `Drawer`, `Tree`, `Legend`, `Range`, `CopyButton`, `SkipLink`, `FormAction`, `UserFeedback`, `StatusLabel`, `EmptyState` and `SegmentedControl`.
- Snackbar now renders through Notice, and StatusLabel indicators carry a shape as well as a colour. See [New components and patterns](#new-components-and-patterns).

**Hydration and vanilla scripts**

- Hydration contracts are documented per component and published in the AI manifest, so a non-React page can wire up behaviour from the same source an agent reads.
- `js/copy-button.js`, `js/drawer.js` and `js/switch-pending.js` are dependency-free ES modules for pages with no React at all, and `js/switch-pending.js` comes apart into its announcer, its revert and its deadline so an app can keep the parts it wants.
- Hydration id prefixes are unique page-wide, and vanilla tab sets removed from the page are suspended rather than left running. See [Hydration and vanilla scripts](#hydration-and-vanilla-scripts).

**Documentation, tooling and discoverability**

- Storybook, `llms.txt`, `llms.json`, `releases.json`, `tokens.json` and `ai-components/` are published at `https://mangrove.undrr.org/`.
- Machine-readable `releases.json` and `tokens.json`, CSS and JS banners, and SCSS docblocks point agents and developers at the canonical docs. `tokens.json` now states that it is a theme token dictionary and says where component-scoped properties are documented instead.
- A links test fails the build on a documentation link that resolves to no story. See [Documentation, tooling and discoverability](#documentation-tooling-and-discoverability).

> **If you consume the base UNDRR compiled CSS (CDN or prebuilt), no sub-brand theming:** the theming migration requires no integration change, and the component refresh keeps existing Drupal hydration and BEM contracts, apart from the deprecated Pagination removal. Three visual defaults change everywhere regardless — see below.
>
> **Three system-wide defaults change, in every theme, with no integration change required:** the neutral ramp's surface half is now cool-tinted, the keyboard focus ring is no longer the brand colour, and the focus ring is drawn as two bands. See [Theming, tokens and colour](#theming-tokens-and-colour).
>
> **DELTA consumers: your palette changed.** DELTA was built on a navy that appears nowhere in DELTA's own codebase. 2.0 replaces it with DELTA's real sourced palette — the one theme whose compiled output moves beyond the three shared defaults above. See [DELTA's palette is corrected](#deltas-palette-is-corrected).
>
> **If you consume a sub-brand compiled stylesheet** (PreventionWeb, IRP, MCR, DELTA): one required change — add the matching `mg-theme-*` class to `<body>` or a wrapping element, or components fall back to the default UNDRR palette. See [Sub-brand theming migration](#sub-brand-theming-migration).
>
> **If you import Mangrove SCSS directly** or override `$mg-color-*` / `$mg-spacing-*` variables in your own stylesheets: see the [breaking changes](#breaking-changes) and the [upgrade notes](#upgrade-notes) below.

> _Edits here show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-2.0.md) and in [Storybook](https://mangrove.undrr.org/?path=/docs/getting-started-release-notes-v2-0--docs)._

## Try the prerelease

2.0 ships under the `next` dist-tag, so it never lands on `latest` — a plain `npm install @undrr/undrr-mangrove` stays on 1.x until 2.0 is stable. `next` now resolves to `2.0.0-rc.3`.

```bash
# npm (prerelease tag — does not become your default version)
npm install @undrr/undrr-mangrove@next
```

```html
<!-- CDN, versioned path (pick the base or a sub-brand stylesheet) -->
<link rel="stylesheet" href="https://assets.undrr.org/mangrove/2.0.0-rc.3/css/style.css">
<link rel="stylesheet" href="https://assets.undrr.org/mangrove/2.0.0-rc.3/css/style-preventionweb.css">
```

For a compiled-CSS consumer the entire trial is two lines: swap the stylesheet href above, and for a sub-brand add `class="mg-theme-{brand}"` to `<body>` or a wrapping element. Found a problem? See [where to report](#feedback).

## Find your path

Arriving part-way through an upgrade? Start at the row that describes you.

| I am... | Go to... |
|---|---|
| A **base UNDRR** Drupal/CDN consumer, no custom SCSS | [What changed visually](#what-changed-visually) and [Component experience and interaction](#component-experience-and-interaction) |
| A **sub-brand** Drupal/CDN consumer (PW, IRP, MCR, DELTA) | [Sub-brand theming migration](#sub-brand-theming-migration) — add the `mg-theme-*` body class |
| A **DELTA** consumer | [DELTA's palette is corrected](#deltas-palette-is-corrected) — your brand colours changed |
| A developer who imports Mangrove SCSS | [Breaking changes](#breaking-changes) |
| A developer who overrides a **font-family** variable | [Breaking change #8](#8-font-family-variables-replaced-by-five-roles) — all six were removed |
| A developer who imports a **CamelCase stylesheet path** | [Breaking change #9](#9-the-four-camelcase-scss-aliases-removed) — all four aliases were removed |
| A developer who overrides sub-brand tokens | [Sub-brand theming migration](#sub-brand-theming-migration) |
| A developer who uses the **`--sendai-*` accent colours** | [Theming, tokens and colour](#theming-tokens-and-colour) — deprecated, replaced by `--mg-sendai-target-a`…`-g` |
| A developer **upgrading from an earlier 2.0 prerelease** | [Upgrade notes](#upgrade-notes) — what changed inside 2.0 itself, grouped by integration topic |
| A developer who hand-writes **Mangrove list markup** | [Hand-written lists](#hand-written-lists) — you no longer need `role="list"` |
| A developer using the vanilla **switch pending helper** | [Switch pending timeout](#switch-pending-timeout) — `timeout: 0` changes meaning |
| A developer who styles **`.mg-icon-button`** or a filled button | [Icon button](#icon-button) and [Filled buttons and button height](#filled-buttons-and-button-height) |
| A developer wiring components into **Drupal or plain HTML** | [Hydration and vanilla scripts](#hydration-and-vanilla-scripts) |
| A developer importing **React components or Sass from npm** | [Published package imports](#published-package-imports) |
| A developer styling **editorial links or background heroes** | [Editorial content and inline links](#editorial-content-and-inline-links) and [Hero composition and image-less markup](#hero-composition-and-image-less-markup) |
| An AI agent or tool reading this for API context | [Token API summary](#token-api-summary) |

## What changed visually

For base UNDRR consumers, colours and spacing are visually equivalent to 1.x wherever nothing else deliberately changed: the values moved from SCSS variables to CSS custom properties, but the compiled `style.css` output is equivalent.

The component refresh intentionally changes the presentation and interaction of core components. It introduces softer theme-aware surfaces, clearer focus and hover states, more consistent responsive spacing, joined form actions and stronger multilingual behaviour. Semantic shapes remain component-specific: carousel controls stay circular, chips retain meaningful pill geometry and institutional chrome continues to express its owning theme.

The token work changes three things in every theme — the neutral ramp's surface half is cool-tinted, the focus ring is gold rather than the brand colour, and that ring is now two bands — plus DELTA's palette, corrected against its own design sources. The tint is subtle per surface and cumulative across a page. DELTA's buttons in particular go from unfilled navy text to white on brand blue. See [Theming, tokens and colour](#theming-tokens-and-colour).

Three later changes are visible everywhere they appear: Snackbar renders as a light Notice surface rather than a filled coloured bar, filled buttons paint their fill under the border so they match outline buttons in size, and StatusLabel indicators carry a shape as well as a colour.

**One border now paints where it painted nothing.** _Available from `2.0.0-rc.3`._ `.mg-card__icon--bordered` drew its border from `--mg-card-border` with no fallback, so a hand-written card that used the documented class without setting the property got the extra padding and no border at all — an unset custom property drops the whole declaration. It falls back to `rgb(var(--mg-color-interactive))`, so on the vanilla path the modifier now reads as an accent border in the brand's own colour. React callers see no change: IconCard has emitted the modifier class only when `borderColor` is set since 1.2, and when it is set it writes `--mg-card-border` inline, which still wins. ([#1216](https://github.com/unisdr/undrr-mangrove/pull/1216), [#1200](https://github.com/unisdr/undrr-mangrove/issues/1200))

Otherwise the token rewrite carries the values it started with, apart from [three tokens that changed shape](#7-three-button-tokens-changed-shape).

**Sub-brand consumers (PreventionWeb, IRP, MCR, DELTA) have one required change.** Brand colours previously baked into every component rule at compile time; they now live in a `.mg-theme-{brand}` selector block. Add `class="mg-theme-{brand}"` to `<body>` or a wrapping element, or components render with the default UNDRR palette instead of the brand palette. See [Sub-brand theming migration](#sub-brand-theming-migration).

**Browser floor changed.** 2.0 now *requires* CSS custom property support: because every colour and spacing value resolves through `var(--mg-*)` at runtime, a browser without custom-property support loses **all** Mangrove colour and spacing — not just an effect here and there. (In 1.x those values were baked in, so an old browser still rendered.) Alpha-composited colours — overlays, hover tints, modal scrims — additionally use the `rgb(var() / alpha)` syntax. Every browser in the [supported matrix](https://mangrove.undrr.org/?path=/docs/getting-started-browser-support--docs) handles both correctly; this only matters for browsers below that floor.

## Theming, tokens and colour

The foundation the rest of 2.0 stands on. No required integration change, but **three defaults change for every consumer in every theme**, and DELTA's palette is corrected against its own sources. ([#1061](https://github.com/unisdr/undrr-mangrove/pull/1061) moved theming to custom properties; [#1087](https://github.com/unisdr/undrr-mangrove/pull/1087) built the token pipeline.)

### Design tokens have a source

Brand palettes move from hand-maintained SCSS to YAML sources under `tokens/`, compiled by `scripts/build-tokens.cjs` into the theme CSS and Sass the library already consumed. `tokens/mangrove.yaml` is a brand-neutral base, so UNDRR becomes a sub-brand alongside PreventionWeb, IRP, MCR and DELTA rather than the base itself.

The format borrows [W3C DTCG](https://tr.designtokens.org/)'s vocabulary — `$value`, `$type`, `$description`, `{path}` aliases — but is not conformant: six vendor keys sit outside `$extensions` and dimensions are bare numbers, so DTCG tooling cannot read these files without a conversion that does not exist yet.

The generator fails the build on an unknown or circular reference, a duplicate output name or a wrong token shape, so a malformed source cannot silently emit a stylesheet with missing colours. Base, PreventionWeb, IRP and MCR values are unchanged; three tokens change shape ([breaking change #7](#7-three-button-tokens-changed-shape)).

Build output is no longer committed. The generated token partials are produced by `yarn scss` and are now gitignored, as the compiled theme stylesheets already were. A Jest `globalSetup` writes any missing partial, so `yarn test` works on a fresh clone with no build step.

**New: `tokens/output-baseline.json`.** A committed SHA-256 manifest of the generated bytes for all five themes. Because the partials themselves are gitignored, this is what makes an unintended change to compiled output fail `yarn test` instead of shipping unnoticed. Regenerate it deliberately, as part of the change that justifies it: `node scripts/build-tokens.cjs --baseline`. There is no `yarn` wrapper for the flag.

**Token authors: overrides inherit shape, and used not to.** In the generator's layered merge, a brand override that re-valued a token without restating `$format` silently reverted it to a bare channel triple — invalid in a colour position, and discarded without a word. `$name`, `$type`, `$private` and `$sass` had the same failure: omitting `$name` wrote `--mg-<id>` instead of the property consumers actually read, making the override a no-op; omitting `$private` leaked a brand primitive into the public CSS. `scripts/build-tokens.cjs` now carries all five keys from the inherited layer when an override does not restate them. `$value`, `$alpha` and `$description` are deliberately not carried. This is the class of bug behind the `.mg-button-outline` breakage in [breaking change #7](#7-three-button-tokens-changed-shape).

### Changed default: the neutral ramp's surface half is cool-tinted

**Every component in every theme is affected.** Steps `neutral-25` through `neutral-400` gain a small cool tint. `neutral-0` and `neutral-500` through `neutral-900` are unchanged.

Mangrove's neutrals were pure achromatic greys. An institutional survey of GOV.UK, USWDS, NHS, EU ECL, OCHA Common Design, Primer, Carbon and Atlassian found that every peer tints its neutrals toward cool or toward brand, and identified Mangrove's pure greys as the single largest reason the system read as a generic admin kit rather than an institution. One flat grey was doing most of the visual work: the site header, the hover fill, the menu focus fill, the tag fill, the empty-state panel and every form field all resolve to `neutral-25`.

| Token                    | Before    | After       | Oklch before   | Oklch after                 |
| ------------------------ | --------- | ----------- | -------------- | --------------------------- |
| `--mg-color-neutral-0`   | `#ffffff` | _unchanged_ | `L 1.0000 C 0` | —                           |
| `--mg-color-neutral-25`  | `#f2f2f2` | `#f0f3f6`   | `L 0.9612 C 0` | `L 0.9627 C 0.0051 H 247.9` |
| `--mg-color-neutral-50`  | `#e6e6e6` | `#e4e7ea`   | `L 0.9249 C 0` | `L 0.9265 C 0.0052 H 247.9` |
| `--mg-color-neutral-100` | `#cccccc` | `#cacdd0`   | `L 0.8452 C 0` | `L 0.8469 C 0.0053 H 247.9` |
| `--mg-color-neutral-200` | `#b3b3b3` | `#b1b4b7`   | `L 0.7668 C 0` | `L 0.7684 C 0.0054 H 247.9` |
| `--mg-color-neutral-300` | `#999999` | `#96999c`   | `L 0.6830 C 0` | `L 0.6814 C 0.0056 H 247.9` |
| `--mg-color-neutral-400` | `#808080` | `#7e8082`   | `L 0.5999 C 0` | `L 0.5988 C 0.0039 H 247.9` |
| `--mg-color-neutral-500` | `#666666` | _unchanged_ | `L 0.5103 C 0` | —                           |
| `--mg-color-neutral-600` | `#4d4d4d` | _unchanged_ | `L 0.4202 C 0` | —                           |
| `--mg-color-neutral-700` | `#333333` | _unchanged_ | `L 0.3211 C 0` | —                           |
| `--mg-color-neutral-800` | `#1a1a1a` | _unchanged_ | `L 0.2178 C 0` | —                           |
| `--mg-color-neutral-900` | `#000000` | _unchanged_ | `L 0 C 0`      | —                           |

Four decisions, each deliberate:

- **Only the surface half moves.** The "generic" reading lives on surfaces. The dark half is body text (`neutral-800`), muted text (`neutral-500`), rules and shadows, where a hue shift buys nothing and every text contrast ratio in the system would have to be re-argued. GOV.UK draws the same line: tinted background, near-black text. Primer tints both; we did not follow it there.
- **`neutral-0` stays pure white.** The page is the floor every translucent token composites onto, and tinting it is a far larger claim than tinting the raised and sunken surfaces above it. Primer's `canvas-default` and GOV.UK's page background are both plain white.
- **One shared cool hue, not five brand-derived ones.** No brand overrides this ramp today, and `tokens/mangrove.yaml` exists on the premise that the ramp carries no brand identity — a Mangrove adopted without UNDRR branding still gets it. PreventionWeb's teal (195°) and MCR2030's purple (323°) would also pull their greys somewhere muddy. A brand that wants its own tint can still override these six steps in its own token file; the mechanism is unchanged, only the default moved.
- **Restrained.** Oklch hue 247.9° at chroma 0.0039–0.0056 — 247.9° is the hue of Primer's `bgColor-muted`, and the chroma sits inside the peer band (Atlassian `#f4f5f7` 0.0029, Primer `#f6f8fa` 0.0034, NHS `#f0f4f5` 0.0045, OCHA `#e6ecf1` 0.0093). Below the level at which a tint reads as a colour rather than as a refinement.

**Contrast: no pair loses, in any theme, on either measure.** The Oklab measure is lightness-only, so hue alone would not move it, but WCAG 2's luminance does move with hue — and it moved _downward_ on a muted-text pair with only 0.25 of perceptual headroom. So each step is nudged in whichever lightness direction its role needs: the four surface steps (25–200), always the lighter half of a pair, go up by at most 0.0017 in Oklch L; the two mark steps (300, 400), always the darker half, go down by at most 0.0016. Every graded pair that moves, moves upward. Figures are identical in all five themes because no brand overrides any of these tokens (WCAG 2 ratio / Oklab perceptual score):

| Pair                                                                | Minimum  | Before      | After           |
| ------------------------------------------------------------------- | -------- | ----------- | --------------- |
| muted text (`neutral-500`) on the form-field surface (`neutral-25`) | 4.5 / 63 | 5.13 / 63.2 | **5.16 / 63.5** |
| form-field border (`neutral-400`) on the page (`neutral-0`)         | 3 / 50   | 3.95 / 59.1 | **3.96 / 59.2** |
| form-field border (`neutral-400`) on the form-field surface         | 3 / 50   | 3.53 / 52.2 | **3.56 / 52.6** |
| `--mg-color-focus-ring` on the form-field surface                   | 3 / 50   | 4.99 / 62.2 | **5.01 / 62.5** |

Every pair painted directly on the page is **unmoved**, because the page resolves to `neutral-0` and `neutral-0` did not change. That covers the tightest pairs in the system — body text, muted text and the focus ring against white — which is exactly why `neutral-0` was left alone.

**Migration.** Nothing to do. Consumers who match Mangrove's greys in their own CSS (a Drupal child theme painting `#f2f2f2` behind a region, for example) will see a seam where their grey meets a Mangrove surface; the fix is to read `rgb(var(--mg-color-neutral-25))` instead of restating the hex. A consumer or brand that wants the achromatic ramp back can restore all six steps on `:root` or on its theme selector, and then owns the graded pairs above.

**Deliberately not retinted.** The data-visualisation Sendai target A series (`--mg-dataviz-sendai-a-*`) is a categorical _data_ ramp read off the design file and stays achromatic — moving a categorical data colour changes what a reader decodes from a chart. Chart chrome (`--mg-dataviz-gridline`, `--mg-dataviz-axis`) does follow the neutral ramp and is tinted, so chrome and target A read fractionally differently side by side. That is intended.

### Changed default: the focus ring is no longer the brand colour

`--mg-color-focus-ring` was aliased to `--mg-color-interactive` in every theme, so the keyboard focus ring and the selection cue were the same signal: a selected row is painted with the interactive colour at low alpha and the ring was that same hue at full strength. A focused row in a selected state said one thing twice.

It now resolves to a new base primitive, `--mg-color-gold-800` (`#866200`, emitted as `134 98 0`), shared by all five themes:

| Token                           | Before                        | After                       |
| ------------------------------- | ----------------------------- | --------------------------- |
| `--mg-color-focus-ring`         | `var(--mg-color-interactive)` | `var(--mg-color-gold-800)`  |
| `--mg-color-gold-800`           | —                             | `134 98 0`                  |
| `--mg-color-focus-ring-inverse` | —                             | `var(--mg-color-neutral-0)` |

Measured against both graded backgrounds, in all five themes (both backgrounds are theme-invariant today), as WCAG 2 ratio / Oklab perceptual score against a non-text floor of 3:1 and 50:

| Pair                                                      | Before (UNDRR / PW / IRP / MCR / DELTA)                              | After (all five)                                               |
| --------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| ring on the page (`#ffffff`)                              | 8.31 / 78.3 · 6.49 / 73.7 · 4.71 / 64.6 · 12.03 / 84.7 · 8.31 / 78.3 | 5.58 / 68.7                                                    |
| ring on the form-field surface (`#f2f2f2`, now `#f0f3f6`) | 7.42 / 72.1 · 5.79 / 67.4 · 4.21 / 57.9 · 10.75 / 78.8 · 7.42 / 72.1 | 4.99 / 62.2, and 5.01 / 62.5 once the neutral tint above lands |

A deliberately non-brand focus colour is near-universal in public-sector design systems (GOV.UK `#ffdd00`, NHS `#ffeb3b`, USWDS a `blue-40v` distinct from its link blue). Those systems' yellows cannot be used unaided here: `#ffdd00` is 1.35:1 on the raised surface and 1.20:1 on the field surface, scoring 5.3 and −6.6 perceptually. They work because their indicator is two bands — a yellow fill over a near-black bar — and the dark band carries the contrast. `gold-800` keeps the yellow register and takes it down the lightness ramp until a single band measures on its own.

**Migration.** Nothing to do unless you depend on the ring being brand-coloured. If you do, set `--mg-color-focus-ring` on `:root` or on your theme selector; a theme that overrides it owns both graded pairs above. `--mg-color-form-focus`, which drives the focused field's _border_, is unchanged and stays brand-coloured on purpose: the border says "this field is active", the ring says "the keyboard is here".

**Components now follow the default.** Every component focus indicator that drew its own colour has been routed through a token, so the new ring is what consumers actually see rather than a base-layer default the components override.

- **22 rules** moved off a non-token focus colour — `--mg-color-interactive`, `--mg-color-blue-800`, `--mg-color-form-focus`, a hardcoded white, the UA's own `-webkit-focus-ring-color`, or the local Sass variables `$search-primary` / `$search-primary-dark` — across **9 stylesheets**: `SyndicationSearchWidget` (7), `Gallery` (4), `MegaMenu` (3), `Forms/_form-base` (2), `PreviewAccess` (2), `Boilerplate`, `Pager`, `ShareButtons` and `Tab`.
- **1 rule deleted**: `button:focus-visible` in `cta-button.scss`, a 4px glow keyed to the button's own background colour.
- **7 white literals** replaced by the new `--mg-color-focus-ring-inverse`, across 5 stylesheets.
- **49 `@include mg-focus-ring` / `mg-focus-ring-inset` call sites** now inherit the ring centrally, up from 22.
- **37 focus rules touched across 17 component stylesheets** in total.

`$search-primary-dark` itself is unchanged — it still drives a gradient and a hover fill — only its focus rule moved.

Two are worth calling out. `MegaMenu`'s section-list link drew a hardcoded _white_ inset ring on a white panel, measuring 1.28:1; it was invisible, and now measures 4.36:1. `PreviewAccess` drew both its field border and its ring from `--mg-color-form-focus`; the border keeps that token and the ring moves to `--mg-color-focus-ring`, matching how `_form-base.scss` already splits the two signals.

**No rule paints a focus indicator outside the token system any more.** The one non-token paint that remains is the CSS system keyword `Highlight`, used by `.mg-chip` inside `@media (forced-colors: active)` and commented as deliberate — that is the correct behaviour there, not a gap. Two further commented exclusions in `card.scss` are decorative hairlines drawn at rest on every card; they are not focus indicators at all.

**New: `--mg-color-focus-ring-inverse`.** Seven rules deliberately painted white because they draw the ring on an already-dark surface — the `Hero` and `TextCta` buttons over a filled brand banner, the `Snackbar` action, and the dark `Card` and `StatsCard` variants — where `--mg-color-focus-ring` measures 1.49:1 and would be a regression, not a fix. They now share one token instead of five literals. It resolves to `var(--mg-color-neutral-0)` in all five themes, so **nothing renders differently today**; a theme with a light banner or a tinted scrim can now retune both rings together. Note that the test is where the ring is _painted_, not what it surrounds: a dark control with a positive `outline-offset` — the `Gallery` arrows, for instance — draws its ring clear of itself on the light surface behind, and stays on `--mg-color-focus-ring`.

**`Tab` is fixed too.** In DELTA the interactive colour and the tab background are now the same value, so the inset ring was being drawn in the tab's own fill at **1.00:1** — literally invisible, on the tab that roving tabindex actually reaches. `Tab` now uses `mg-focus-ring-inset`, and the corrected measurements are recorded in `tab.scss`.

### Changed default: the focus ring is two bands

**Every focused control in every theme looks slightly different.** The default focus indicator is now two bands — a `neutral-0` separator against the control, then the ring — where it was a single outline on most components and a hand-rolled two-band on a handful.

This is the treatment GOV.UK and NHS use, and the reason their loud yellows carry a boundary they could not carry alone: the inner band separates the ring from whatever the control is painted in, so the ring's contrast is measured against a known colour rather than against an arbitrary component fill. Mangrove now ships it as `mg-focus-ring` and `mg-focus-ring-inset` in `stories/assets/scss/_mixins.scss`, so a component gets it from one `@include` rather than restating the geometry. `--mg-focus-ring-width` and `--mg-focus-ring-offset` are unchanged at `2px`.

The split across two CSS properties is deliberate and load-bearing:

```scss
box-shadow: 0 0 0 var(--mg-focus-ring-offset) rgb(var(--mg-color-neutral-0));
outline: var(--mg-focus-ring-width) solid rgb(var(--mg-color-focus-ring));
outline-offset: var(--mg-focus-ring-offset);
```

Forced-colours mode drops `box-shadow` entirely but keeps `outline` and repaints it in system colours. Putting the ring in the `outline` means forced colours loses the band and keeps the indicator, degrading to single-band rather than to nothing. `mg-focus-ring-inset`, which cannot use an outline, carries its own `Highlight` fallback for the same reason.

**Two accessibility defects fixed.**

- **A checked radio had no focus indicator at all** (WCAG 2.4.7 Focus Visible, level A). The focus style was a `box-shadow` glow; the radio's centre dot is an _inset_ `box-shadow` declared later at equal specificity, so on a checked radio the dot rule replaced the entire indicator. Nothing errored and nothing was visible. A higher-specificity rule now declares both shadows together.
- **`.mg-button`, `.mg-chip` and the form inputs had no focus indicator in forced-colours mode.** Each drew a two-band indicator entirely out of `box-shadow` with `outline: 0`. Forced colours drops `box-shadow`, and there was no outline left to repaint — so users in Windows High Contrast had nothing. The `outline`/`box-shadow` split above is the fix.

### A data-visualisation palette with real Sendai semantics

`--mg-sendai-target-a` through `--mg-sendai-target-g` express the seven Sendai Framework targets.

The old `--sendai-red`, `--sendai-orange`, `--sendai-purple` and `--sendai-turquoise` tokens, and the matching `.mg-u-background-color--sendai-*` and `.mg-u-color--sendai-*` utility classes, are **deprecated**: they are brand accent hues named by colour and carry no Sendai Framework meaning. They continue to work unchanged, and SCSS consumers see a Sass `@warn` on compile. Scheduled for removal in 2.1.

### Colour contrast methodology

- Token pairs are now graded with an [Oklab](https://www.w3.org/TR/css-color-4/#ok-lab)-based perceptual measure alongside WCAG 2's relative-luminance figure, calibrated so its thresholds align with the familiar 4.5:1 and 3:1 boundaries.
- Every foreground/background token pair is graded on both measures, covering every theme, hover and active states and the legacy `.mg-*` components, and the build fails if any pair passes perceptually while WCAG 2 fails it.
- Coverage includes component foregrounds and surfaces, focus indicators and data-visualisation palettes across themes. The test suite is the current inventory; its scope does not establish conformance for every rendered state.
- Remaining exceptions are documented with their rationale in the contrast methodology. The guard binds registered exceptions to the token pairs they cover, so renaming or moving a pair cannot silently inherit an unrelated exemption. ([#1263](https://github.com/unisdr/undrr-mangrove/pull/1263))
- APCA was evaluated and rejected on licensing grounds. Reasoning in [Colour contrast methodology](https://github.com/unisdr/undrr-mangrove/blob/main/docs/COLOUR-CONTRAST-METHODOLOGY.md).

### The status indicator palette is measured, and stays

The seven indicator fills — `--mg-status-label-indicator` and its six `--*` variants — were re-measured rather than retuned, and the result is written down so the question is settled with numbers. **No colour changed.** ([#1212](https://github.com/unisdr/undrr-mangrove/pull/1212))

The method is two measurements. **WCAG non-text contrast** for each of the seven fills against white — 1.28:1 (draft), 1.60:1 (the unmodified base), 1.63:1 (waiting for validation), 2.24:1 (waiting for more information), 5.58:1 (degraded), 6.31:1 (offline) and 6.49:1 (published) — with the ratio falling by roughly a sixth on `red-50`, the tinted surface the offline mark appears on inside a negative notice. Four of the seven are close to invisible unbounded, which is why every indicator carries a `--mg-color-neutral-500` ring at 5.74:1. And **pairwise CIE76 and CIEDE2000** under protanopia, deuteranopia and tritanopia, in two independent simulation models — Machado 2009 and Viénot 1999 — applied in **linear** RGB. That last detail is the whole result: run against gamma-encoded sRGB, the degraded/offline pair measures 36 CIE76 and the collision disappears from the numbers. The full pairwise table, both models side by side, is in [Status label](https://mangrove.undrr.org/?path=/docs/components-status-label--docs), "Shape as well as colour".

Both models agree that degraded and offline are the same mark to a deuteranope: 1.1 dE2000 under Machado and 0.6 under Viénot, against a just-noticeable difference of about 2.3. That is what the [StatusLabel shapes](#statuslabel-and-emptystate) are for.

Rebalancing was measured and rejected. Holding the hue associations and requiring every fill to clear 3:1 on white, the best worst-pair obtainable from the tokens this system owns is 2.34 dE2000 — still at the threshold, merely moved onto a different pair — and it costs all four DELTA status colours, drops the worst normal-vision pair from 13.4 to 6.8 dE2000, and leaves the `neutral-500` ring at 1.0–1.8:1 against its own fills. A one-token fix fares no better: moving degraded off `gold-800` lifts that pair to 11.9 but reintroduces a 1.5 dE2000 collision with waiting for more information, halves its contrast, and desynchronises it from the notice icon beside it. Seven unordered categories is past what colour carries, which is the limit this repo already records as `--mg-dataviz-categorical-safe-count: 4`.

No theme overrides any of the seven fills, so the status palette is identical across all five brands. Setting `--mg-status-label-indicator-border-width: 0` still removes the contrast boundary from the four pale fills in normal rendering. **The base indicator now survives that setting in forced colours.** _Available from `2.0.0-rc.3`._ An inset `CanvasText` outline preserves its hollow shape without changing its size or forcing a ring onto the other six marks. ([#1224](https://github.com/unisdr/undrr-mangrove/pull/1224))

### DELTA's palette is corrected

**DELTA consumers should read this. The other four themes are unaffected.** 26 of DELTA's 57 tokens change value or shape. This is a deliberate correction, not a side effect of the token rewrite.

DELTA's Mangrove theme was built on a navy, `#132e48`, that appears **zero times** in DELTA's own codebase. Its card surface was `#fafafa`, which appears once in DELTA where the colour DELTA actually uses, `#f2f2f2`, appears eleven times. 2.0 reads the palette from DELTA's production repository and its DLDTS design file instead of inferring it.

Two findings drove the change:

- **DELTA's brand blue is UNDRR blue.** `#004f91` — 54 uses in DELTA's code, 1,551 fills and 1,645 strokes in its Figma file — is the swatch DELTA's own design system labels "UNDRR Blue – Corporate blue" and marks as Brand. It is `rgb(0 79 145)`, already Mangrove's `--mg-color-blue-900`.
- **DELTA has a second brand colour that Mangrove had lost.** UNDRR Teal `#007b7a` is DELTA's secondary. Mangrove mapped the secondary button to the same blue as the primary, collapsing a genuine two-colour brand into one.

| Token                                           | Before                 | After                       |
| ----------------------------------------------- | ---------------------- | --------------------------- |
| `--mg-color-interactive`                        | `19 46 72`             | `0 79 145`                  |
| `--mg-color-interactive-active`                 | `19 46 72`             | `16 108 184`                |
| `--mg-color-hero`                               | `19 46 72`             | `0 79 145`                  |
| `--mg-color-hero-button-secondary-background`   | `rgb(19 46 72)`        | `rgb(0 79 145)`             |
| `--mg-color-tab-background`                     | `rgb(19 46 72)`        | `rgb(0 79 145)`             |
| `--mg-color-tab-background--hover`              | `rgb(19 46 72 / 0.7)`  | `rgb(0 79 145 / 0.7)`       |
| `--mg-color-tab-border--hover`                  | `rgb(12 30 48)`        | `rgb(16 108 184)`           |
| `--mg-color-button`                             | `19 46 72`             | `var(--mg-color-neutral-0)` |
| `--mg-color-button--hover`                      | `12 30 48`             | `var(--mg-color-neutral-0)` |
| `--mg-color-text-button`                        | `19 46 72`             | `var(--mg-color-neutral-0)` |
| `--mg-color-button-background`                  | `transparent`          | `rgb(0 79 145)`             |
| `--mg-color-button-background--hover`           | `rgb(19 46 72 / 0.06)` | `rgb(16 108 184)`           |
| `--mg-border-color-button`                      | `19 46 72` _(invalid)_ | `transparent`               |
| `--mg-color-button-outline-primary`             | `19 46 72`             | `0 79 145`                  |
| `--mg-color-button-outline-primary--hover`      | `12 30 48`             | `16 108 184`                |
| `--mg-color-button-outline-secondary`           | `19 46 72`             | `0 123 122`                 |
| `--mg-color-button-outline-secondary--hover`    | `12 30 48`             | `0 105 104`                 |
| `--mg-color-button-secondary-background`        | `transparent`          | `0 123 122`                 |
| `--mg-color-button-secondary-background--hover` | `rgb(19 46 72 / 0.06)` | `0 105 104`                 |
| `--mg-card-background`                          | `rgb(250 250 250)`     | `rgb(242 242 242)`          |

Six further tokens changed shape only, from a bare channel triple to a full colour: `--mg-color-tab-background--inactive`, `--mg-color-tab-border`, `--mg-color-tab-border--active`, `--mg-color-text-tab`, `--mg-color-text-tab--hover` and `--mg-color-text-tab-active`. These were **invalid CSS** in DELTA before — a triple in a `color:` or `border:` position is dropped silently — so DELTA's tabs inherited whatever colour was around them rather than the values the theme intended. They now paint what the theme says.

Three things follow that a DELTA site will see:

- **Buttons become filled.** DELTA's primary button was transparent-backed navy text with no border (its border token was invalid). It is now white text on brand blue. DELTA's own design system specifies filled buttons with no border.
- **Secondary buttons turn teal**, rather than repeating the primary's colour.
- **Hover goes lighter, not darker.** `--mg-color-interactive-active` (`#106cb8`) is lighter than the base blue. That inverts Mangrove's usual convention, and it is DELTA's actual documented behaviour, not an error.

One value is a deliberate divergence from DELTA's stylesheet, and is recorded as such in `tokens/delta.yaml`: the secondary hover is `#006968`, one step **down** DELTA's own teal ramp, where DELTA's stylesheet uses `#359999`, one step up. White text on `#359999` measures 3.40:1 and fails WCAG 1.4.3; `#006968` measures 6.52:1 and still comes from DELTA's ramp.

**Migration.** Nothing to do in markup or SCSS. If your DELTA site restates any of these colours as literal hex in its own CSS, it will now show a seam; read the token instead. A site that needs the old navy back can set the affected tokens on its own `.mg-theme-delta` block, and then owns their contrast.

### The type scale is public

`--mg-font-size-100` … `--mg-font-size-1100` custom properties are emitted in every theme and read by all components with `var()`; compiled sizes are unchanged. `$mg-font-size-*`, `$mg-font-body` and `$mg-font-tag` are deprecated Sass aliases until 3.0, and overriding `$mg-font-tag` no longer changes Mangrove's own components. A test fails the build on any `var(--mg-*)` that nothing defines. ([#1168](https://github.com/unisdr/undrr-mangrove/pull/1168), [#1167](https://github.com/unisdr/undrr-mangrove/issues/1167))

Line heights followed: `--mg-font-line-height-500` (`1.25em`) and `--mg-font-line-height-700` (`1.5em`) are emitted in every theme and read by body text, the font-size utilities and Card. Compiled line heights are unchanged. ([#1170](https://github.com/unisdr/undrr-mangrove/pull/1170), [#1085](https://github.com/unisdr/undrr-mangrove/issues/1085))

### Sub-brand button tokens

PreventionWeb, MCR and IRP now define their own secondary button background and hover tokens in `tokens/*.yaml`, instead of inheriting the base values. ([#1150](https://github.com/unisdr/undrr-mangrove/pull/1150))

`--mg-border-color-button-primary` and `--mg-border-color-button-secondary` are new and default to `transparent`, so a filled button carries no visible stroke unless a surface asks for one. Hero and strong TextCta surfaces set a light tinted stroke so filled buttons keep an edge on dark backgrounds. Notice adds `--mg-notice-action-secondary`, which is what lets DELTA's status link reach 4.5:1. ([#1173](https://github.com/unisdr/undrr-mangrove/pull/1173), [#1175](https://github.com/unisdr/undrr-mangrove/pull/1175))

### The orange accent carries no text

Sendai orange remains a non-text accent: borders, rules, icon fills and blocks with no copy over them. White fails WCAG AA for body text on it; black passes WCAG but misses Mangrove's additional perceptual body-text threshold. These are distinct measures, not a claim that black fails WCAG.

**The component surfaces now enforce that rule.** _Available from `2.0.0-rc.3`._ Tag, TextCta, Hero, HubHeader, Card and AuthorImage no longer put their secondary/accent copy on orange. Orange remains decorative; text-bearing surfaces use readable theme colours. Existing modifier names remain supported, but their appearance changes. Review overrides that restore the former orange fill. The palette itself is unchanged. ([#1198](https://github.com/unisdr/undrr-mangrove/pull/1198), [#1249](https://github.com/unisdr/undrr-mangrove/pull/1249))

### Not yet resolved

These are known and deliberately unfinished in 2.0:

- Sub-brand tab colours are not wired into the new underline tab treatment. The brands designed a filled tab (white on a solid brand background); piping those colours into an underline on a white page measures 1.00:1. Resolving it is a design decision, not a wiring change.
- The accent palette is retained for non-text use; it is not a licence to put text over any accent swatch. The current exception register and its rationale live in the colour contrast methodology.
- Forced-colours behaviour has not been verified in real Windows High Contrast, only in emulation. The two-band mixins are built to degrade correctly there, but that is reasoned, not observed.
- `--mg-color-focus-ring-inverse` resolves to white in all five themes, so it is a seam with nothing behind it yet. It earns its keep only when a theme retunes it.

## Component experience and interaction

2.0 applies a shared experience direction across the library ([#1086](https://github.com/unisdr/undrr-mangrove/pull/1086)) without mechanically homogenising components or overriding theme-owned expression:

- Shared surface, border, shadow, radius, focus and reduced-motion tokens provide a consistent foundation.
- Buttons, forms, cards, hero compositions, tabs, disclosures, menus, on-page navigation, tables, Pager, ScrollContainer and Text CTA receive coordinated responsive and interaction refinements.
- The editorial CTA gains stable hover geometry, logical RTL placement and safe wrapping for long translations. Conventional buttons remain the default for forms, consent and utility actions.
- Chips distinguish navigational links from dismiss actions and add visible removal affordances, logical spacing, focus, reduced-motion and forced-colour support.
- Inline code uses a compact theme-aware surface with clearer monospace typography and coherent decoration across wrapped snippets.
- Vertical, horizontal, book, icon and stats cards receive theme-aware presentation refinements. Vertical-card media fills its frame consistently, without changing the intentional sizing of the book, horizontal or icon variants.
- The Storybook introduction and Component Laboratory demonstrate production compositions, responsive collections, deterministic syndicated-search states, forms and data-rich examples, and landing-page showcase cards link to the relevant guidance and stories.
- Storybook's global locale toolbar becomes the canonical translation mechanism; redundant per-language story groups are removed, and dedicated RTL and long-label stories remain where they test a distinct layout condition. `UserFeedback` ships seven toolbar locales and accessible confirmation focus.
- Logical properties, focus states, target sizing, reduced motion, forced colours, narrow layouts, RTL and long translations are covered across representative components and themes, and component guidance and changelogs, the Experience principles, contribution guidance and AI manifest examples are synchronized with the updated markup and public classes.
- Published component bundles are built against React's production JSX runtime rather than reusing Storybook development transforms: production bundles use isolated, uncached Babel output, and manifest validation rejects any production bundle containing development JSX runtime calls.
- Every compiled CSS bundle includes a preserved Mangrove version banner synchronized from `package.json`, making deployed asset versions visible in source and diagnostics.

This baseline was checked across desktop and mobile layouts, Chromium and Firefox, RTL, long labels, keyboard focus, reduced motion, forced colours and representative UNDRR themes. See the [Experience principles](https://mangrove.undrr.org/?path=/docs/design-decisions-experience-principles--docs) for the design guardrails behind these changes.

### Tabs and navigation

[Tabs (#1097)](https://github.com/unisdr/undrr-mangrove/pull/1097) centre a compact group when it fits and scroll horizontally when it overflows. The active tab uses a soft brand tint. Existing HTML is enhanced without a markup migration. React consumers can opt into mobile stacking with `stackOnMobile`; plain HTML uses `data-mg-js-tabs-stack-on-mobile`. Panels retain their state through responsive changes, and manual rail scrolling does not change selection.

[MegaMenu (#1100)](https://github.com/unisdr/undrr-mangrove/pull/1100) reveals one mobile level at a time, with Back above the title and a separate Close control. Section headings link to their landing pages. Top-level sections remain prominent while inner links use regular body typography. The panel is at least 400px where space permits, capped at the smaller of 700px or 90% of the viewport, leaving the page visible for outside dismissal. Translucency, blur and short RTL-aware transitions have opaque, motion-free accessibility-preference fallbacks. Focus and scroll restore on return; closing and rapid reopening are covered by regression tests. Existing `sections`, logo props, Drupal markup and hydration entry points remain supported. New labels are optional. Simple Nav removes the unused hamburger gutter and scrolls on mobile overflow.

[PageHeader (#1134)](https://github.com/unisdr/undrr-mangrove/pull/1134) makes the account link and language switcher icon-only at every width, not just below tablet, with a new `languageDisplay="links"` mode that shows languages inline for sites with a short list, each collapsing to its two-letter code below the tablet breakpoint. The native `<select>` stays in the DOM, invisibly overlaid on its icon, so it remains a real keyboard- and screen-reader-operable control rather than a custom-built menu. The account link's accessible name moved from a CSS-hidden `<span>` (`display: none`, which also hides it from screen readers) to a proper visually hidden one, so it no longer depends solely on the `title` attribute. The desktop MegaMenu flyout gained a quick opacity and `clip-path` reveal on the shared motion tokens, with an instant, un-animated fallback for `prefers-reduced-motion`, increased contrast, reduced transparency and forced colours. Desktop accessibility fixes and duplicate-id resolution landed in both components ([#1114](https://github.com/unisdr/undrr-mangrove/pull/1114), [#1120](https://github.com/unisdr/undrr-mangrove/pull/1120)).

The MegaMenu desktop active-tab indicator transitions smoothly with an animated `::after` underline (an opacity and `scaleX` reveal) instead of an instant `box-shadow` switch. ([#1153](https://github.com/unisdr/undrr-mangrove/pull/1153))

PageHeader also resolves logos per locale, renders at a fixed height, and keeps `crop="autocrop"` for the default English logo only. ([#1148](https://github.com/unisdr/undrr-mangrove/pull/1148))

**A breadcrumb written as an `<ol>` is now laid out.** _Available from `2.0.0-rc.3`._ The list inside `nav.mg-breadcrumb` was styled only when it was a `<ul>`, while every curated breadcrumb example in the AI manifest uses an `<ol>`, so a consumer copying the documented snippet got default decimal markers and no flex row. Both arms now share one `> :is(ul, ol)` rule. If you worked around the missing rule with your own `list-style` or flex declarations, check them. This landed with the list-semantics sweep in [Markerless lists keep their list role](#markerless-lists-keep-their-list-role). ([#1216](https://github.com/unisdr/undrr-mangrove/pull/1216), [#1200](https://github.com/unisdr/undrr-mangrove/issues/1200))

Compiled-CSS consumers do not need a markup migration for any of these navigation updates. Sass consumers must apply the font-role migration in [breaking change #8](#8-font-family-variables-replaced-by-five-roles), and themes depending on Dubai must supply their own font declaration.

### Buttons

Filled primary, secondary and disabled buttons paint their fill under the border (`background-clip: border-box`), so the stroke matches the fill and they render the same size as outline buttons. Icons in buttons are vertically centred, icon-only buttons use an 18px icon, and a button with an icon and a label is 36px tall, the same as a text-only button. A standalone `.mg-icon-button` now owns its ghost styling instead of picking up a global MegaMenu rule, and switches to the light button foreground on hover, where MCR2030 previously measured 1.75:1. ([#1173](https://github.com/unisdr/undrr-mangrove/pull/1173), [#1171](https://github.com/unisdr/undrr-mangrove/issues/1171))

CTA and icon surfaces had a separate contrast and inventory cleanup, and the Text CTA gained a soft-tone variant and composed form content. ([#1145](https://github.com/unisdr/undrr-mangrove/pull/1145), [#1144](https://github.com/unisdr/undrr-mangrove/pull/1144), [#1142](https://github.com/unisdr/undrr-mangrove/pull/1142), [#1111](https://github.com/unisdr/undrr-mangrove/pull/1111))

### Cards, hero and scrolling

Cards distinguish unlinked content from linked content: an unlinked card renders as plain text instead of a faux link that goes nowhere ([#1116](https://github.com/unisdr/undrr-mangrove/pull/1116)), with card spacing, collection alignment and docs-locale fixes alongside ([#1110](https://github.com/unisdr/undrr-mangrove/pull/1110)).

Vertical cards fill container height by default (`block-size: 100%`), so they stay equal height when each sits in its own column wrapper rather than a shared flex or grid row — the common CMS-templated three-up layout. ([#1153](https://github.com/unisdr/undrr-mangrove/pull/1153))

The `max-width: 12ch` constraint is removed from `.mg-hero--immersive:not(.mg-hero--split) .mg-hero__title`, so those headings flow naturally across the overlay container. Split heroes never carried the constraint and are unaffected; if you overrode it, that is the exact declaration to delete. ([#1151](https://github.com/unisdr/undrr-mangrove/pull/1151))

ScrollContainer's desktop horizontal scrollbar carries a themed interactive brand thumb and a subtle translucent track across WebKit and Firefox engines, instead of reading as an unstyled browser default. ([#1153](https://github.com/unisdr/undrr-mangrove/pull/1153))

Author image supports stacked layouts, links, inverse tone and a text-only variant, alongside higher-value utility and OCHA icon additions to the icon set. ([#1147](https://github.com/unisdr/undrr-mangrove/pull/1147), [#1145](https://github.com/unisdr/undrr-mangrove/pull/1145))

**Background heroes have a readable copy surface.** _Available from `2.0.0-rc.3`._ A neutral scrim deepens the desktop copy band while preserving the photograph outside it. At widths up to 900px, the image becomes a banner above the text instead of sitting behind it; immersive heroes use a deeper banner rather than a minimum viewport height. Image-less markup needs `mg-hero--no-image` to suppress that empty banner. See [Hero composition and image-less markup](#hero-composition-and-image-less-markup). ([#1263](https://github.com/unisdr/undrr-mangrove/pull/1263), [#1268](https://github.com/unisdr/undrr-mangrove/pull/1268))

**Scrolling and full-width layouts work in more contexts.** _Available from `2.0.0-rc.3`._ ScrollContainer's overflow viewport is keyboard-focusable even without focusable children, and its hydration reads its own content. FullWidth anchors its bleed correctly in RTL; consumers contain page overflow with `html, body { overflow-x: clip; }` rather than clipping each section, which would break sticky descendants. Make wide tables locally scrollable before applying page-root clipping. ([#1276](https://github.com/unisdr/undrr-mangrove/pull/1276), [#1222](https://github.com/unisdr/undrr-mangrove/pull/1222), [#1251](https://github.com/unisdr/undrr-mangrove/pull/1251))

### Forms and data display

Data table, badge, accordion, switch and icon-button styles were added as part of the token dictionary and primitives work. ([#1157](https://github.com/unisdr/undrr-mangrove/pull/1157))

**Switches have a pending state.** Set `aria-busy="true"` on `.mg-switch__input`, or `.mg-switch--pending` on the label when the input cannot take attributes, while a change is saving. The thumb moves to the requested position straight away and shows a spinning ring in the interactive colour, a static dotted ring under reduced motion, over a greyed track; the cursor is `progress`. Pending does not disable the input, so focus and announcements stay. `aria-disabled="true"` is styled like `:disabled` with a page-coloured layer instead of opacity, so the focus ring keeps full strength. In forced colours the switch used to be invisible — track and thumb were both painted as Canvas — and now sets `forced-color-adjust: none` and draws a bordered Canvas track, a CanvasText thumb and a Highlight fill when on, with GrayText for disabled and `aria-disabled` switches. New `--mg-switch-*` custom properties (track, thumb, pending and disabled overlays, ring and gap colours) are read with their defaults where used, so they can be set on any ancestor. The vanilla helper that drives it is in [Hydration and vanilla scripts](#hydration-and-vanilla-scripts). ([#1184](https://github.com/unisdr/undrr-mangrove/pull/1184))

**Switches have an error state, and their geometry is a hook.** _Available from `2.0.0-rc.3`._ Two reports from a team running rc.2 in a vanilla-HTML app, answered as one change because they share the switch's geometry: the error state needs something to colour, and what it colours is the inset the size hooks compute. ([#1214](https://github.com/unisdr/undrr-mangrove/pull/1214), [#1187](https://github.com/unisdr/undrr-mangrove/issues/1187), [#1199](https://github.com/unisdr/undrr-mangrove/issues/1199))

Every other control in the library had an error treatment and `.mg-switch` had none, so a consumer wrote their own rule and hit two traps: a `box-shadow` on the track replaced the focus ring's white separator band at equal specificity, and the track sets `forced-color-adjust: none`, so a hard-coded red survived forced colours unchanged while every state around it adapted. The switch now shows an error the way a text input does — `aria-invalid` on the input, `.mg-switch__input--error` on the input, or `.mg-switch--error` on the label gives the track a red boundary, and the message is the same sibling `p.mg-form-error` joined with `aria-describedby`, so `FormErrorSummary` links to a switch exactly as it links to any other field. It is a `border-color` change and nothing else, matching `.mg-form-input--error` declaration for declaration, so it cannot displace the focus ring's outline or band. In forced colours it returns to `CanvasText` and says "error" with a dashed edge, which survives a palette with no red in it. Unlike the pending state it does not move the thumb: the error is about the thing the switch controls, not about the switch's position. Where the save itself failed, `js/switch-pending.js` already reverts and announces.

The switch exposed seven custom properties and all seven were colours, so resizing it meant re-declaring the track, the thumb and the thumb's transform — and that last one is the trap, because Mangrove's own `translateX` is paired with a `[dir=rtl]` counterpart of equal specificity, so a consumer rule loaded later won in both directions and the thumb slid the wrong way by the wrong distance in Arabic. Following the StatusLabel indicators, every length now derives from one number: `--mg-switch-size` sets the track's block size, and `--mg-switch-track-inline-size`, `--mg-switch-track-block-size`, `--mg-switch-track-inset` and `--mg-switch-thumb-size` each set one part. The travel is the track's inline size less the thumb and its two insets, written once and read by the LTR rule, the RTL rule and the tests, and the pending ring is a fraction of the thumb, so setting a hook is enough in both directions at any size. `.mg-switch--small` is a shared 1.125rem switch for a toolbar, a table row or a panel header; it sets the size hook and tightens the row gap, and the row keeps its 36px minimum height, so the touch target does not shrink with the graphic. The track's inset around the thumb is now a transparent border rather than padding — same border box, same content box, same travel — which is what gives the error state a `border-color` to change and stops forced colours taking a pixel off the padding to make room for its own border. Every default is unchanged: a 42×24 track, a 20px thumb and 18px of travel, pinned in a test.

## Typography, language and accessibility

### Why Dubai was dropped

Before 2.0, Arabic headings were Noto Kufi Arabic and Arabic body text was Dubai. An intermediate step during 2.0's development moved both onto Dubai, so Arabic readers downloaded one font instead of two.

Two objections were recorded at the time. Dropping Kufi was a judgement rather than a correction, because the UAE Federal Design System and OCHA's own base theme both set Noto Kufi for body. And the Dubai EULA requires the font be embedded so an end user cannot extract it, and forbids redistribution, while Mangrove served it as a plain WOFF2 from an open CDN, referenced by an Apache-2.0 library that pointed other organisations at that copy.

**Both were settled the other way**, as the next section describes. Dubai is no longer shipped.

### Arabic typography settled

**Arabic now pairs Noto Kufi Arabic headings with Noto Sans Arabic body text. Dubai is removed.** This closes [issue #1089](https://github.com/unisdr/undrr-mangrove/issues/1089), which asked for the Arabic typeface to be chosen deliberately rather than inherited.

Dubai came to Mangrove from OCHA, but the inheritance was weaker than it looked and had gone stale on both halves. Dubai was OCHA's *alternative* subtheme pairing — body only, never headings, Regular only — not their base theme, which used Noto Kufi Arabic. And on 2026-05-28 OCHA's own brand guidance moved to Almarai for display and Noto Sans Arabic for body.

Both Noto families are [SIL Open Font License 1.1](https://openfontlicense.org/), which also settles the redistribution question Dubai's EULA left open.

This is two Arabic families where the interim single-family step had one, and that is deliberate. Kufi is a display style — angular, high contrast, architectural — so it earns its place in headings and is the wrong choice at body size; Noto Sans Arabic carries the running text and shares Noto Sans' proportions. The second download is subset by `unicode-range` across `arabic`, `latin` and `latin-ext`, so a page fetches only the scripts it renders — an English string inside an Arabic page pulls the small `latin` file, not the much larger `arabic` one.

Only Regular (400) and Bold (700) are published in the UNDRR asset library for either family, unchanged from Dubai, so Arabic keeps a 400/700 ladder where Latin has four steps. Both upstream families span 100-900, so adding a weight is an asset-library packaging task rather than an upstream limitation.

Per the CSS font-matching rules a target of `600` resolves up to Bold, but a target of `400`-`500` resolves *down*, so `font-weight: 500` renders Regular in Arabic. That is less of a divergence from Latin than it first appears: Roboto publishes a Medium, but **Roboto Condensed does not**, so compact chrome set in the condensed face already renders Regular at 500 in both scripts. Only the `font-weight: 500` declarations sitting on the Roboto body face actually differ. This was equally true of Dubai.

**One typographic inconsistency went with it.** Arabic buttons now take the body family, matching the [review checklist](https://mangrove.undrr.org/?path=/docs/contributing-build-a-component-review-checklist--docs) and the CtaButton, Chips and ShareButtons components. A bare `<button>` and `.mg-preview-access__submit` previously took the headings family, so two buttons on one page could render in two typefaces — invisible for as long as both Arabic tokens resolved to Dubai.

**Two costs worth stating plainly.**

*Glyph coverage narrows.* Dubai was a single unsubsetted file; the replacements are subsetted, and the asset library publishes only the `arabic`, `latin` and `latin-ext` subsets — not `math` or `symbols`. Around 158 codepoints Dubai rendered now fall through to the next font in the stack. The ones most likely to appear in DRR content are the superscripts `²` and `³` (as in km², m³), `±`, the fractions `½ ¼ ¾`, `µ`, the comparison and statistical signs `≤ ≥ ≠ ≈ ∞ √ ∑ ∫ ‰`, Greek letters, and the footnote daggers `† ‡`. These still render, in the reader's fallback face, at a different weight and cap-height. Closing the gap means publishing the missing subsets in the asset library, not a change here.

*Arabic pages get heavier.* Two families means two Arabic downloads. For a page using both weights of both faces the `arabic` subsets total roughly 187 KB against Dubai's 115 KB — about **+72 KB (+63%)**. The `unicode-range` split genuinely helps the Latin subsets, which are small and fetched only when Latin appears, but it does not offset the second Arabic face. This is the price of the heading/body distinction; it is a real cost, not a free one.

**If you override the Arabic tokens**, note that `$mg-font-family-arabic-headings` and `$mg-font-family-arabic-body` were removed by the font role model — see [breaking change #8](#8-font-family-variables-replaced-by-five-roles). The faces are now `$mg-font-face-arabic-display` (`"Noto Kufi Arabic", sans-serif`) and `$mg-font-face-arabic-sans` (`"Noto Sans Arabic", sans-serif`). Mangrove no longer emits a Dubai `@font-face`, so a theme that wants Dubai must declare its own. The fonts are served WOFF2-only from `https://assets.undrr.org/fonts/`.

### Arabic typography now respects language boundaries

Closing [issue #1092](https://github.com/unisdr/undrr-mangrove/issues/1092), an English island inside an Arabic page — a quotation, a citation, an untranslated widget — no longer renders in Arabic typography.

Every `:lang(ar)` override had been written as a descendant selector: `:lang(ar) { h1 { ... } }`, compiling to `:lang(ar) h1`. `:lang()` there matches the *root* and the `h1` is merely a descendant, so the rule fired on every heading beneath an Arabic root regardless of that heading's own language.

- **The pseudo-class is now attached to the styled element** (`h1:lang(ar)`). `:lang()` already inherits down the tree, so this matches on *computed* language and stops at a `lang="en"` boundary. The fix was applied across `_foundational.scss`, `_utility.scss` and 19 component stylesheets; specificity was unchanged in all 24 compiled selectors and no rule changed position in the cascade. The role model then removed the component-level blocks altogether, so the remaining anchored selectors are the `h1`–`h3` heading role in `_foundational.scss` and three font-size utilities in `_utility.scss`.
- **Two boundary rules reassert the family at the switch point.** Anchoring alone was not enough: `font-family` is an inherited property, so a `lang="en"` island with no declaration of its own kept the Arabic family it inherited from its Arabic ancestor. The rules live in `_fonts.scss` alongside the script map; each re-points the five roles for the new language and restates the text role as the used family, and everything below the boundary inherits normally.

  ```scss
  /* An Arabic sub-root inside an otherwise Latin page. */
  :where(:not(:lang(ar))) > :where([lang]:not([lang=""]):lang(ar)) {
    @include mg-font-roles-arabic;

    font-family: var(--mg-font-family-text);
  }

  /* A non-Arabic sub-root inside an Arabic page. */
  :where(:lang(ar)) > :where([lang]:not([lang=""], :lang(ar))) {
    @include mg-font-roles-latin;

    font-family: var(--mg-font-family-text);
  }
  ```

  A language sub-root always has a parent of the outer language, so the child combinator selects exactly these switch points. It deliberately is **not** a descendant selector: a rule matching every descendant would also match component children that inherit their container's family — a `.mg-card__title` link, a `.mg-hero__title` heading — and a matched declaration beats an inherited one at any specificity, so those would lose Roboto Condensed. Both rules carry zero specificity via `:where()`, so a component rule on the boundary element itself still wins. `[lang]:not([lang=""])` leaves `lang=""` — *unknown* language per HTML, not *Latin* — inheriting rather than guessed at. `--mg-font-family-code` is not remapped, because the monospace stack is the same in both scripts.
- **Arabic resuming inside a non-Arabic island now works**, as does an Arabic island on an otherwise Latin page — the second rule handles both. Previously only `<p>` recovered, by accident of `p:lang(ar)` existing.

This is a selector fix, not a font change. It predates the Noto move above and behaved identically with Dubai; no font token changed with it.

### Components mirror properly in Arabic

_Available from `2.0.0-rc.3`._ Hero, FormErrorSummary, Syndicated search, Card, StatsCard, Author image and the legacy `.fa-before` icon gap use logical properties — `margin-inline-start`, `padding-inline-end`, `border-inline-start`, `inset-inline-end`, `text-align: start` — instead of physical left and right ones.

The visible fix is the split hero, which broke out of the viewport in Arabic at mobile widths and gave the whole page a horizontal scrollbar. The syndicated search clear button also grew to a 36x36 target with an 18px glyph, and the field's reserved inline-end padding grew from 24px to 44px to match. The rest of that widget's direction-specific spacing — custom select trigger and chevron, active-filter label, chip connector, result separator, facet label and subtype indents — is logical too. Apart from the search field's clear button and padding, LTR rendering is unchanged. ([#1192](https://github.com/unisdr/undrr-mangrove/pull/1192))

### Controls are named, announced and distinguishable

_Available from `2.0.0-rc.3`._ A pre-release sweep looked for controls that exist but are not named, announced or distinguishable by more than colour. ([#1190](https://github.com/unisdr/undrr-mangrove/pull/1190))

**ShowMore's documented markup changes visibly.** The toggle is now `<button type="button">` rather than `<a href="#">`, with `aria-controls` maintained by `mgShowMore()`. An anchor still in consumer markup keeps working and is given `role="button"` plus the Space handler that role promises. The toggle carries no `aria-expanded`: the collapse is `overflow: hidden` clipping, which leaves the content in the accessibility tree and the tab order, so there is nothing hidden to describe — and focus entering a clipped container expands it.

The rest of the sweep:

- Error page logo links get an accessible name, in the component and, separately, in the eleven static Cloudflare templates, whose markup is maintained by hand rather than generated from the component.
- Card summary links and error-page body links are underlined at rest rather than distinguished by colour alone.
- Gallery HTML thumbnail previews are `inert`, so injected links and buttons are no longer focusable inside the tab button.
- Dismissing a Notice returns focus to the control that raised it, or to the nearest neighbour, instead of `<body>`.
- The vanilla CopyButton example has a real `aria-label`; every integration path reads that plain `aria-label`, and both the script and `fromElement` still honour the older `data-aria-label` on an otherwise unnamed button.
- ServiceNotice's status link carries visually hidden "(opens in a new tab)" text (`labels.opensInNewTab`), kept in server-rendered output. ([#1175](https://github.com/unisdr/undrr-mangrove/pull/1175))

Per-component detail is in each component's MDX changelog.

### Editorial content and inline links

_Available from `2.0.0-rc.3`._ `.mg-content p a` underlines links in editorial paragraphs at rest. Add `mg-content` to a rich-text container to opt in. Navigation and buttons retain their component treatment; this is not a global underline on every anchor. The page patterns demonstrate the wrapper. It currently supplies this narrow prose-link rule, not a complete rich-text reset or automatic blockquote styling; expanding it is [2.1 work (#1277)](https://github.com/unisdr/undrr-mangrove/issues/1277). ([#1276](https://github.com/unisdr/undrr-mangrove/pull/1276))

### Arabic tracking and readable form help

_Available from `2.0.0-rc.3`._ Arabic text and its pseudo-elements use normal letter spacing, including tracked headings and labels; nested elements explicitly marked with a different language keep that language's tracking. Native-reader validation of the heading face remains a follow-up in [#1103](https://github.com/unisdr/undrr-mangrove/issues/1103). Newsletter form surfaces are lighter so the existing help-text colour remains readable. ([#1279](https://github.com/unisdr/undrr-mangrove/pull/1279), [#1276](https://github.com/unisdr/undrr-mangrove/pull/1276))

### Markerless lists keep their list role

_Available from `2.0.0-rc.3`._ Safari drops the implicit `list` role from any list whose marker is `none`, so the item count stops being announced — the bug `role="list"` is usually added to work around. Mangrove's guidance asked consumers for that attribute while the components' own rendered HTML omitted it, so a consumer had to pick a side. 2.0 settles it in favour of the components. ([#1216](https://github.com/unisdr/undrr-mangrove/pull/1216), [#1200](https://github.com/unisdr/undrr-mangrove/issues/1200), [#1209](https://github.com/unisdr/undrr-mangrove/issues/1209))

StatusLabel introduced the fix in 1.2.0: `list-style: none` followed by `list-style-type: ""`. An empty string is still a marker, so the role survives, and it renders nothing and reserves no space; the `none` stays in front as the fallback for browsers too old to parse a string marker. That pair is now the `mg-list-unmarked` mixin and the house rule, applied across Breadcrumbs, Pager, OnThisPageNav, Legend, MegaMenu, HubHeader, Syndicated search and StatusLabel — fourteen rules in all, because it covers list *items* as well as lists. `list-style-type` is inherited, but an item setting `none` wins over the list's empty string, and it is the item's marker WebKit inspects: measured in WebKit 26.0, MegaMenu's list computed `""` while every item computed `none`, so a fix on the list alone never reached the markers it was meant to preserve.

It is a CSS fix rather than an attribute because consumers hand-write these lists in Drupal templates and static HTML, so only the class reaches all of them, and because the CSS preserves the implicit role without a redundant attribute. This is a markup convention, not an ESLint rule enforced by this repository. A list that carries a different ARIA role on purpose — `tree`, `group`, `menu`, `listbox`, `tablist` — is exempt, because that role already replaces list semantics; MegaMenu's content panels are left alone for exactly that reason. Where an implementation already set the attribute it keeps it: OnThisPageNav's vanilla script still writes `role="list"`, so its hydration contract is unchanged, but the React and vanilla paths now behave the same without it.

A Breadcrumbs layout fix travelled with this sweep and is described where a Breadcrumbs consumer will look for it: [Tabs and navigation](#tabs-and-navigation).

Two further accessibility threads run through 2.0 and are documented where they belong: the focus indicator work, including the two defects it fixed, is in [Theming, tokens and colour](#theming-tokens-and-colour); the bypass-block SkipLink is in [New components and patterns](#new-components-and-patterns).

## New components and patterns

### Page-level patterns

[Content Hub and Landing Page pattern suite (#1113)](https://github.com/unisdr/undrr-mangrove/pull/1113) and [Article Story reference pattern (#1125)](https://github.com/unisdr/undrr-mangrove/pull/1125) give consumers composable, production-ready page-level layouts instead of assembling one from individual components each time. Hero, card collections and section headings are wired together with the same responsive and accessibility behaviour the components already have on their own.

[SkipLink (#1119)](https://github.com/unisdr/undrr-mangrove/pull/1119) is a bypass-block component, wired into those reference patterns so a keyboard user can jump straight to the main content.

### Notice, ServiceNotice and Snackbar

`Notice` is a messaging foundation: `info`, `warning`, `negative` and `positive` severities, compact, prominent and overlay modifiers, and hydration. `ServiceNotice` builds on it for degraded or offline embeds, with capped automatic retry and UN-language labels. **Snackbar now renders through Notice**, which is a visible change — see the [upgrade notes](#upgrade-notes). ([#1164](https://github.com/unisdr/undrr-mangrove/pull/1164))

ServiceNotice's DELTA status link meets 4.5:1 through the Notice `--mg-notice-action-secondary` token, and the Drupal behavior example attaches its retry listener with `once()`. ([#1175](https://github.com/unisdr/undrr-mangrove/pull/1175), [#1178](https://github.com/unisdr/undrr-mangrove/pull/1178))

### Prototype primitives

Drawer and Tree navigation ([#1158](https://github.com/unisdr/undrr-mangrove/pull/1158)), map and chart Legend ([#1159](https://github.com/unisdr/undrr-mangrove/pull/1159)) and Range slider ([#1160](https://github.com/unisdr/undrr-mangrove/pull/1160)) joined the library, with hydration for Drawer and full keyboard navigation for Tree ([#1163](https://github.com/unisdr/undrr-mangrove/pull/1163)). An audit before the first release candidate hardened all four: Drawer renders strings as text, is inert when closed, manages focus and hydrates with trigger buttons; Tree mirrors in RTL; Legend and Range gained accessibility fixes and tests ([#1166](https://github.com/unisdr/undrr-mangrove/pull/1166)).

Tree later gained hydration from a nested `<ul>`, a `toggleIcon` prop and a `current` flag on `TreeItem`, along with fixes to the RTL chevron, Enter and Space on unlinked parents, Tab focus on the selected item and the selected-label contrast in IRP ([#1176](https://github.com/unisdr/undrr-mangrove/pull/1176), [#1172](https://github.com/unisdr/undrr-mangrove/issues/1172)).

**These four are prototypes.** Their APIs may change before 2.0 is stable.

### Segmented control

_Available from `2.0.0-rc.3`._ `SegmentedControl` presents a native radio group as joined segments, retaining native keyboard interaction and form submission. The React wrapper uses `legend`, `name` and `options`, with `value` for controlled selection or `defaultValue` for uncontrolled selection. Import `{ SegmentedControl }` from `@undrr/undrr-mangrove/components/SegmentedControl.js`. Plain HTML uses the same CSS and native radio inputs without JavaScript. ([#1250](https://github.com/unisdr/undrr-mangrove/pull/1250))

### CopyButton

A copy-to-clipboard button ([#1160](https://github.com/unisdr/undrr-mangrove/pull/1160)) with React hydration, a zero-dependency vanilla script and UN-language labels ([#1163](https://github.com/unisdr/undrr-mangrove/pull/1163)). It reports a failed copy with a manual-copy hint ([#1166](https://github.com/unisdr/undrr-mangrove/pull/1166)).

### StatusLabel and EmptyState

`StatusLabel` (`.mg-status-label`) ships `--draft`, `--published`, `--waiting-validation` and `--waiting-information` variants, plus `--warning` and `--negative`, which are documented as service-health states. `EmptyState` (`.mg-empty-state`) ships `--compact`, `--panel` and `--start` variants and carries heading-level guidance. Both are additions no existing component uses. ([#1174](https://github.com/unisdr/undrr-mangrove/pull/1174))

**StatusLabel indicators carry a shape as well as a colour.** _Available from `2.0.0-rc.3`._ Draft is a rounded square, waiting for more information a capsule, waiting for validation a rounded diamond, degraded a chamfered triangle, offline an octagon; published and the unmodified base keep the circle. This is visible wherever `.mg-status-label` is used, and needs no markup change: the shapes come from CSS on the same empty `<span>`. The status name is still always present as text, so this is a redundant cue rather than a WCAG fix. It is there because several of the colours are close under colour vision deficiency — degraded and offline measure 3.3 CIE76 and 1.1 dE2000 apart simulated for deuteranopia under Machado 2009, against a just-noticeable difference of about 2.3 dE2000 — because a CSS-only component gets reused without its label, and because a second cue is faster to scan. The full measurement, and why the palette itself was left alone, is in [the status indicator palette is measured, and stays](#the-status-indicator-palette-is-measured-and-stays). The seven marks are drawn as one family: all convex, all softened at one corner radius, all carrying the same ring, and that ring is now exactly `--mg-status-label-indicator-border-width` on every edge of every shape ([#1208](https://github.com/unisdr/undrr-mangrove/issues/1208)). `.mg-status-label-group` keeps its list semantics in Safari, so VoiceOver announces the item count ([#1209](https://github.com/unisdr/undrr-mangrove/issues/1209)), and in RTL the group no longer picks up the global list padding ([#1174](https://github.com/unisdr/undrr-mangrove/pull/1174)). The indicators survive Windows High Contrast and printing without background graphics, and each shape occupies one `--mg-status-label-indicator-size` of inline space, so a column or table of statuses keeps a single text alignment edge. See [Status label](https://mangrove.undrr.org/?path=/docs/components-status-label--docs), "Shape as well as colour". ([#1206](https://github.com/unisdr/undrr-mangrove/pull/1206))

### FormAction and UserFeedback

`FormAction` joins a field and its key action for search, subscription and select-and-continue flows, with accessible help and error wiring, RTL support and optional mobile stacking. It ships as a direct `components/FormAction.js` ESM entry as well as SCSS. Import `{ FormAction }` from that subpath; the package has no root entry point.

`UserFeedback` brings the common page-usefulness prompt into Mangrove for the usual pre-footer position, as the default export of `components/UserFeedback.js` and a directly hydratable bundle, while response storage, analytics and consent stay product-owned. It ships seven toolbar locales and accessible confirmation focus.

## Hydration and vanilla scripts

Most Mangrove consumers are Drupal sites and plain HTML pages, not React applications. 2.0 makes that path explicit and testable.

### Hydration contracts are documented and published

Every component that ships a `*.hydrate.js` now carries a structured `hydration` contract in the AI manifest — a note, the selector, the CDN modules, the data attributes, the events and a runnable example — alongside the same contract in its MDX. Previously only ServiceNotice and Tree had one, so an agent copying `renderedHtml` for CopyButton, ShareButtons, IconCard, StatsCard, Gallery, MegaMenu, Pager, QuoteHighlight, ScrollContainer, TextCta, UserFeedback, Syndicated search, Drawer or Notice got markup with no behaviour and nothing saying so. ShareButtons, Gallery, MegaMenu, Pager, ScrollContainer and Syndicated search had no manifest entry at all and gain one. ([#1194](https://github.com/unisdr/undrr-mangrove/pull/1194), [#1175](https://github.com/unisdr/undrr-mangrove/pull/1175))

`Tree` hydrates a nested `<ul>` inside a `data-mg-tree` container with `createHydrator` and `Tree.fromElement`, and is flagged `requiresReact` in the manifest. `Tree` and `TreeItem` take a `toggleIcon` prop, read from `data-toggle-icon` on the hydrated container, and `TreeItem` takes `current`. ([#1176](https://github.com/unisdr/undrr-mangrove/pull/1176))

### Repeated hydration stays within its instance

_Available from `2.0.0-rc.3`._ `createHydrator.update()` skips matches inside a hydrated ancestor matching the same selector, preventing components from mounting again inside their own output. Different component selectors can still hydrate nested content. To replace content in an existing hydrated host, call `unmountAll()` before `update()`. ScrollContainer extraction and syndicated-search paging also target their own instance. Use `data-mg-search-widget`, not the previously documented `data-undrr-search-widget`. ([#1234](https://github.com/unisdr/undrr-mangrove/pull/1234), [#1222](https://github.com/unisdr/undrr-mangrove/pull/1222), [#1260](https://github.com/unisdr/undrr-mangrove/pull/1260))

**Cookie consent tolerates unmount during loading.** _Available from `2.0.0-rc.3`._ A discarded mount cannot initialise the banner after its async asset loads complete, cleanup stays within banner-owned elements, and asset URLs no longer defeat the duplicate-load guard with a cache buster. CookieConsentBanner is a repository integration wrapper, not an npm component bundle. ([#1271](https://github.com/unisdr/undrr-mangrove/pull/1271))

### Hydration ids are unique page-wide

`createHydrator` numbers roots from a page-wide counter shared by every hydrator and every copy of the runtime, so `update(context)` no longer reuses a prefix and a page that loads two copies of React no longer gets duplicate DOM ids. ([#1178](https://github.com/unisdr/undrr-mangrove/pull/1178))

### Tab sets released from the page

A vanilla tab set removed from the page without `mgTabsDestroy()` is suspended rather than left running. A `ResizeObserver` notification, one of its outside listeners or a page-wide sweep — on every `mgTabs()` and `mgTabsRuntime()` call and on window `resize` and `hashchange` — finds it detached and releases its window, `document.fonts` and `ResizeObserver` registrations; its markup, in-container listeners and selection stay. If the same node is re-attached it resumes on interaction, a sweep or `mgTabs()`, and follows a hash change made while it was suspended.

`mgTabs()` and `mgTabsRuntime()` accept an optional `{ signal }` third argument: aborting it destroys the tab sets that call initialised, and an already-aborted signal initialises nothing. The React `Tab` wrapper passes a signal and still calls `mgTabsDestroy(container, true)` in its effect cleanup. `mgTabsDestroy(scope)` destroys every set in scope even if one throws, then rethrows the first error. See [Tabs](https://mangrove.undrr.org/?path=/docs/components-tabs--docs), "Removing tabs". ([#1183](https://github.com/unisdr/undrr-mangrove/pull/1183), [#1180](https://github.com/unisdr/undrr-mangrove/issues/1180))

### Dependency-free ES modules

**Drawer gains a vanilla lifecycle.** _Available from `2.0.0-rc.3`._ `js/drawer.js` enhances `data-mg-js-drawer` markup with `mgDrawer(scope)` and releases it with `mgDrawerDestroy(scope)`. That marker is distinct from React hydration's `data-mg-drawer`; choose one integration per drawer. The manifest records the vanilla lifecycle separately from React hydration. The new script is not available at an rc.2 versioned URL. ([#1248](https://github.com/unisdr/undrr-mangrove/pull/1248))

`js/copy-button.js` (`window.UNDRR.copyButton`) drives CopyButton with no React at all. ([#1163](https://github.com/unisdr/undrr-mangrove/pull/1163))

`js/switch-pending.js` drives the switch pending state, on the CDN (`https://assets.undrr.org/mangrove/2.0.0-rc.3/js/switch-pending.js`) and in npm (`@undrr/undrr-mangrove/js/switch-pending.js`). `mgSwitchPending(input, { save, status, timeout, labels, signal })` returns `{ destroy() }`. It announces "Saving…", "Still saving…" for ignored presses and the outcome in a `role="status"` region, ignores clicks and changes while pending, lets only the latest request settle, and reverts on failure or after the timeout (10s by default). Switches marked `data-mg-switch-pending` are enhanced on page load. Without a `save` function, a cancelable `mg-switch:save` event lets one site-wide listener answer every switch with `event.detail.respondWith(promise)`; an `async` listener passes an async IIFE, or calls `event.preventDefault()` first and `respondWith()` later. `mgSwitchPendingInit(scope, options)` and `mgSwitchPendingDestroy(scope)` suit Drupal behaviors, the module dispatches `mg-switch:pending`, `mg-switch:settled` and `mg-switch:failed`, an explicit call takes over a switch that auto-init enhanced, and duplicate copies of the script share one registry. See [Checkbox](https://mangrove.undrr.org/?path=/docs/components-forms-checkbox--docs), "Pending state". ([#1184](https://github.com/unisdr/undrr-mangrove/pull/1184))

**The helper comes apart.** _Available from `2.0.0-rc.3`._ rc.2 shipped those three behaviours — the announcements, the ignore-while-saving guard, and revert-on-failure with a deadline — as one indivisible unit, so an app whose switches are latest-intent-wins, and whose saves can legitimately run past ten seconds, had to drop the helper and re-implement the announcements, which are the hard part. Three additions, all opt-in, every default unchanged. ([#1213](https://github.com/unisdr/undrr-mangrove/pull/1213), [#1189](https://github.com/unisdr/undrr-mangrove/issues/1189))

- `revert: false`, or `data-mg-switch-revert="false"`, keeps the position the user asked for when a save fails. A switch that does not match the server is its own problem, so the helper sets `aria-invalid="true"` on the input instead, restores whatever the page had authored there when the next save starts or on `destroy()`, and leaves an `aria-invalid` it did not write alone. `mg-switch:failed` now carries `reverted`, and its `checked` is the position the switch is left in either way.
- `timeout: 0` or `Infinity` removes the deadline for a save that runs long, and the new `data-mg-switch-timeout` sets the deadline from markup — or removes it, with `0` or `Infinity`. `aria-busy` then stays true until the save settles, so the helper announces "Still saving…" once at ten seconds, where the deadline would have been, rather than leaving a screen reader user on "Saving…" against a busy control with nothing further. **`timeout: 0` changes meaning for anyone already passing it** — rc.2 rejected it as not a positive finite number and silently used the 10-second default. See the [upgrade notes](#upgrade-notes).
- `mgSwitchAnnouncer(element, { status, labels })` is the announcements on their own: region resolution and placement, label resolution, `{label}` and function labels, the re-announce trick and the rate limit, with `pending()`, `stillSaving()`, `settled()`, `failed()`, `announce()`, `label()` and `destroy()`, and no listeners, no attributes on the switch and no save state of its own. `mgSwitchPending()` runs it, so the announcements have one implementation rather than two. The region is per call, so several announcers and helpers share one only when they are all pointed at it with `status` or `data-mg-switch-status`.

Because these need no React, the manifest keeps them in a `vanillaModule` field separate from `hydration`, with a matching `vanillaModule: true` flag in the component index — Checkbox is the component that carries it, for its switch-pending contract. The `vanillaScripts` URLs and the `llms.txt` script glob use `js/*.js` — the old `js/*.min.js` URLs returned 404 on the CDN. ([#1184](https://github.com/unisdr/undrr-mangrove/pull/1184), [#1194](https://github.com/unisdr/undrr-mangrove/pull/1194))

## Documentation, tooling and discoverability

### One docs domain

Storybook, `llms.txt`, `llms.json`, `releases.json`, `tokens.json` and `ai-components/` are published at `https://mangrove.undrr.org/`. Documentation links, generated AI manifest URLs and the CSS and JS banners all use it. Old `preventionweb.github.io/undrr-mangrove/` URLs 301-redirect with path and query kept; CDN URLs (`assets.undrr.org/mangrove/`) and the npm package are unchanged. ([#1185](https://github.com/unisdr/undrr-mangrove/pull/1185))

CDN URLs were canonicalised to a single `assets.undrr.org` root across documentation, examples, font URLs and component defaults. ([#1107](https://github.com/unisdr/undrr-mangrove/pull/1107))

### Machine-readable output for agents

`releases.json` and `tokens.json` are published alongside Storybook, CSS and JS banners and SCSS docblocks link to Storybook and `llms.txt`, and AI manifest coverage expanded to match. ([#1156](https://github.com/unisdr/undrr-mangrove/pull/1156), [#1157](https://github.com/unisdr/undrr-mangrove/pull/1157), [#1162](https://github.com/unisdr/undrr-mangrove/pull/1162), [#1130](https://github.com/unisdr/undrr-mangrove/pull/1130), [#1143](https://github.com/unisdr/undrr-mangrove/pull/1143), [#1141](https://github.com/unisdr/undrr-mangrove/pull/1141))

**The manifest says what it does not cover.** Three reports from a vanilla-HTML consumer upgrading rc.1 to rc.2 were all the same shape: the manifest describing itself as more complete than it is. ([#1216](https://github.com/unisdr/undrr-mangrove/pull/1216), [#1200](https://github.com/unisdr/undrr-mangrove/issues/1200))

- **`tokens.json` is a theme token dictionary, and now says so.** It never contained component-scoped custom properties, but nothing said so, and several of them were announced as public API in these very notes — the `--mg-switch-*` set, `--mg-empty-state-*`, `--mg-notice-*`, `--mg-tree-*`, `--mg-drawer-size` and `-offset`, `--mg-card-border`, `--mg-icon-fg`, `--mg-legend-tick-pos`, `--mg-show-more-height` — so the only way to find them was to grep the compiled CSS. The dictionary gains a `scope` field naming the three kinds it excludes: properties a component defines itself with its own default, input hooks nothing defines (which resolve to nothing and drop their declaration when unset), and the `--mg-dataviz-*` family, which is as global as a theme token but comes from `_tokens-data-viz.scss` rather than a `tokens/*.yaml` source. `llms.txt` repeats it in its "Design tokens" section. Component-scoped properties now appear in each component's `customProperties` array, with descriptions, default-versus-hook classification and channel-format hints. Conditional declarations do not masquerade as unconditional defaults. Global SCSS-only properties remain outside the token dictionary and are identified separately. ([#1223](https://github.com/unisdr/undrr-mangrove/pull/1223), [#1236](https://github.com/unisdr/undrr-mangrove/pull/1236))
- **Utility classes live only in `utilities.json`.** An agent checking the component index alone concluded there was no accordion — there is no component entry at all — and no data-table utilities. "How to use" now says to fetch `utilities.json` before drawing that conclusion.
- **`llms.txt` carries the list-semantics house rule**: do not add `role="list"`, the stylesheets keep the list role themselves, and lists with a deliberate `tree`, `group`, `menu`, `listbox` or `tablist` role are exempt. See [Markerless lists keep their list role](#markerless-lists-keep-their-list-role).

**The CDN JavaScript list is complete, and there is no bundle.** `docs/CDN-REFERENCE.md` was missing `js/preview-access.js` and `js/undrr.js`, and said nothing about there being no combined bundle, so a consumer copying the `<script src=".../js/main.js">` snippet from the asset library's own README had no way to tell whether the file was missing or the path was wrong. The table now states that it is the complete list and that no `js/main.js` or combined bundle exists. The 404ing snippet itself lives in `gitlab.com/undrr/common/shared-web-assets` and is reported there. ([#1216](https://github.com/unisdr/undrr-mangrove/pull/1216))

**Descriptions and imports describe the consumer surface.** The index has a short `summary`, while detail records retain the curated `description`. Imports are generated from the actual component bundles, using the correct subpath and named or default binding. `importRequiresDom` flags browser-only module loading, including ShowMore and Tab, rather than promising server-side imports. ([#1237](https://github.com/unisdr/undrr-mangrove/pull/1237), [#1262](https://github.com/unisdr/undrr-mangrove/pull/1262))

### Storybook organisation

Messaging components are grouped under Components/Notice and page navigation under Components/Navigation, which changed those Storybook URLs and their AI manifest ids. See the [upgrade notes](#upgrade-notes) for the old-to-new mapping. ([#1164](https://github.com/unisdr/undrr-mangrove/pull/1164), [#1166](https://github.com/unisdr/undrr-mangrove/pull/1166))

### Documentation that stays correct

A `scripts/__tests__/docs-links.test.js` suite fails the build on a Markdown link or a `<LinkTo kind>` that resolves to no story, on a relative repository path or a host-absolute `/docs/…--docs` path that 404s in a built Storybook, and on a guide whose link rewrite is missing or stale. It was added after the review-checklist banner on all 75 component docs pages was found linking a relative repository path, six links pointed at story ids the regrouping had renamed, and 24 more used a path that is not a Storybook route. The guides under `docs/` are read on GitHub as well as in Storybook, so they keep their relative `FILE.md` links and the wrappers in `stories/Documentation/` rewrite them at import time (`stories/Documentation/docsPageLinks.js`). ([#1191](https://github.com/unisdr/undrr-mangrove/pull/1191))

The same pass fixed stale content: the CopyButton vanilla snippet pointed at a `dist/js/copy-button.min.js` the CDN does not serve and loaded an ES module without `type="module"`; the contribution and accessibility guides taught `$mg-color-*` and `$mg-spacing-*` SCSS variables that 2.0 removed, and `$mg-text-color` and `$mg-link-color`, which never existed. The Brand guidelines page no longer nests a `<p>` inside a `<p>` — the only console error on any docs page — and the Component gallery and Content syndication pages no longer advertise `BarChart`, `MapComponent` and `Fetcher`, removed in 1.8.0. ([#1191](https://github.com/unisdr/undrr-mangrove/pull/1191))

The Drawer and Tree docs pages embed their stories rather than showing prose and a props table with no example, placeholder copy is replaced with realistic content, and Legend's duplicated canvas is gone. ([#1194](https://github.com/unisdr/undrr-mangrove/pull/1194))

**The AI and brand docs now describe the font roles once, and correctly.** `llms.txt` listed font families alongside breakpoints and `$mg-tabs-border-bottom` as SCSS-only build-time variables with no CSS custom property — 38 lines above a Typography section that correctly described the five `--mg-font-family-*` roles. An agent reading top to bottom met the wrong statement first and hard-coded a typeface, which takes the page out of the Arabic re-pointing in `_fonts.scss`. All five roles are defined on `:root` in the shipped bundle, and `style-all.css` itself reads `var(--mg-font-family-text)` in 30 places. The rest of the sentence holds: neither `--mg-breakpoint-*` nor `--mg-tabs-border-bottom` appears anywhere in the compiled CSS, and they are joined there by the `$mg-font-face-*` variables — not because `@font-face` needs a compile-time value (no `@font-face` rule in Mangrove reads them; the generated partials name the families literally), but because a face is the compile-time source the roles are built from and the only hook for introducing a typeface Mangrove does not ship. The project standards page carried the same "SCSS-only typography" claim twice, and the brand pages named the two typefaces without saying that CSS must name a role instead. ([#1210](https://github.com/unisdr/undrr-mangrove/pull/1210))

The same pass corrected the typeface-to-element mapping on both brand pages, which said Roboto Condensed sets `h1`–`h6`. In Latin it sets neither: `_foundational.scss` declares no family on `h1`–`h6`, so they inherit `--mg-font-family-text` (Roboto) from `body`, and the only heading-family rule is `h1:lang(ar), h2:lang(ar), h3:lang(ar)`. Roboto Condensed is the `display` role (the hero title) and the `ui` role (chrome) — as [breaking change #8](#8-font-family-variables-replaced-by-five-roles) has always shown. An agent reading the corrected "name a role, not a typeface" paragraph and then the bullet above it would still have picked the wrong role.

A story fixture hygiene sweep cleared demo-only defects found in the 2.0 audit: a Legend "Dark theme" story that depended on a class the library never defined, a dead placeholder image, three demo pages that scrolled a 375px viewport sideways, colour inventories with no contrast caveat, and an empty CookieConsentBanner canvas with nothing explaining it. ([#1193](https://github.com/unisdr/undrr-mangrove/pull/1193))

`docs/RELEASES.md` now defines a standard format and template for GitHub Release notes — intro, full-detail link, and a fixed section order — so the per-prerelease record stays consistent. ([#1186](https://github.com/unisdr/undrr-mangrove/pull/1186))

**Package examples are checked against the published layout.** Documentation-path tests cover npm subpaths, Sass imports and CDN examples against the package model. Sass lives under `scss/`, never `stories/`; vanilla JS imports need `.js`. There is no standalone grid CSS or combined/minified vanilla JS bundle. Resolving a path in the source model is not proof it has reached npm or the CDN. ([#1270](https://github.com/unisdr/undrr-mangrove/pull/1270), [#1262](https://github.com/unisdr/undrr-mangrove/pull/1262))

**Browser assertions are now an executable gate.** The build workflow runs Storybook's play functions and render smoke tests in Chromium; a failed assertion fails that step. Run `yarn test-storybook` against a served build locally while organisation-level CI is blocked. The accessibility addon uses WCAG A/AA tags but remains advisory: its warnings are not a passing accessibility certification, and cold-page and post-interaction audits cover different states. Lint coverage now includes component JSX, `src/` and `.storybook/`. ([#1272](https://github.com/unisdr/undrr-mangrove/pull/1272), [#1247](https://github.com/unisdr/undrr-mangrove/pull/1247), [#1276](https://github.com/unisdr/undrr-mangrove/pull/1276))

### Repo and build tooling

Use `yarn build` followed by `yarn pack:assemble` or `yarn pack:preview` to inspect the same curated package the publish workflow assembles. Packing the repository root is not a substitute: its layout differs from the published `components/`, `css/`, `js/`, `scss/`, `fonts/` and `error-pages/` directories. Generated Sass partials and compiled CSS must be included, and package-path checks verify the documented consumer surface. ([#1169](https://github.com/unisdr/undrr-mangrove/pull/1169), [#1265](https://github.com/unisdr/undrr-mangrove/pull/1265))

**Jest specs no longer ship.** _Available from `2.0.0-rc.3`; rc.2 still includes them._ `js/__tests__/copy-button.test.js`, `show-more.test.js` and `table-of-contents.test.js` were in every npm tarball up to `2.0.0-rc.2`, and are committed under every versioned folder in the CDN asset repository. They travelled because two steps copy whole directories: webpack copies `stories/assets` into `dist/assets`, and `scripts/assemble-npm-package.mjs` then copies `dist/assets/js` into the package, so anything sitting beside a source went with it. Both steps now skip `__tests__`, `__snapshots__`, `__mocks__`, `__fixtures__`, `*.test.*` and `*.spec.*` from one shared rule, the generated `package.json` `files` array carries the same exclusions as a second line of defence, and a test fails if a development-only file reaches the assembled package again. Nothing a consumer imports changes. ([#1219](https://github.com/unisdr/undrr-mangrove/pull/1219), [#1218](https://github.com/unisdr/undrr-mangrove/issues/1218))

The rest changes nothing in the published package:

- `yarn pack:assemble` and `yarn pack:preview` build and inspect the package locally. ([#1169](https://github.com/unisdr/undrr-mangrove/pull/1169))
- Storybook's "Show code" is restored on every docs page, with opt-in HTML snippets for CSS-only stories. ([#1179](https://github.com/unisdr/undrr-mangrove/pull/1179))
- `preview-stats.json` is dropped from the Pages artifact. ([#1181](https://github.com/unisdr/undrr-mangrove/pull/1181))
- React and ReactDOM are on `19.3.0` ([#1128](https://github.com/unisdr/undrr-mangrove/pull/1128)), the publishing workflows install from the lockfile ([#1127](https://github.com/unisdr/undrr-mangrove/pull/1127)), and a webpack entry-point regression was fixed ([#1124](https://github.com/unisdr/undrr-mangrove/pull/1124)).
- Everything in `stories/` is formatted with Prettier. ([#1152](https://github.com/unisdr/undrr-mangrove/pull/1152))
- The Yarn lockfile is synchronised with the first alpha's dependency removals, so `--immutable` installs succeed from the release commit.

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
| `$mg-font-face-*` | `@font-face` and Sass interpolation need a compile-time value. These are the typefaces; the families components read are the `--mg-font-family-*` roles, which are custom properties — see [#8](#8-font-family-variables-replaced-by-five-roles) |
| `$mg-html-font-size` | Base rem anchor, compile-time only |
| `$mg-tabs-border-bottom` | `@if` conditional, compile-time only |

The type scale is **not** on this list. It is emitted as `--mg-font-size-100` … `--mg-font-size-1100` custom properties, which components read with `var()` and a theme can re-value at runtime. The `$mg-font-size-*`, `$mg-font-body` and `$mg-font-tag` Sass variables still compile but are deprecated and will be removed in 3.0; Sass consumers should switch to `var(--mg-font-size-*)`. Overriding `$mg-font-tag` no longer changes Mangrove's own components. See [#1167](https://github.com/unisdr/undrr-mangrove/issues/1167).

Line heights are not on the list either. `--mg-font-line-height-500` (`1.25em`) and `--mg-font-line-height-700` (`1.5em`) are custom properties; `$mg-font-line-height-500` and `$mg-font-line-height-700` still compile but are deprecated and will be removed in 3.0. A theme can re-value the custom properties, including as a unitless number such as `1.5`; unitless values inherit differently from `em`, because descendants recompute the line height against their own font size instead of inheriting a fixed length. See [#1085](https://github.com/unisdr/undrr-mangrove/issues/1085).

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

The `style-legacy.scss`, `style-preventionweb-legacy.scss`, `style-irp-legacy.scss`, and `style-mcr-legacy.scss` entry points are deleted along with their compiled `*-legacy.css` builds, and `$mg-html-font-size` is now fixed at `16` (the `!default` override is gone). Mangrove 2.0 assumes the **browser-standard 16px document root** and no longer emits a root `font-size` override.

Consumers that ran on the legacy 10px root — a `html { font-size: 62.5% }` (or `10px`) root, or a build that set `$mg-html-font-size: 10` — must migrate:

- Serve your document at a **16px root** (remove the `62.5%`/`10px` `html` font-size).
- **Convert your own rem-based CSS from a 10px to a 16px basis.** A rule that meant 14px as `1.4rem` under a 10px root now renders 22.4px; rewrite it (e.g. `0.875rem`, or use `px`). This is the substantive part of the migration — Mangrove's own output is already correct for the 16px root.

There is no compatibility build; the 16px root is the only supported basis.

### 6. Deprecated Pagination component removed

The deprecated `Pagination` component, its stories and documentation are removed in alpha.2. Use `Pager`, which is the supported 2.0 pagination pattern. Existing consumers that still import or render `Pagination` must migrate before adopting this prerelease.

### 7. Three button tokens changed shape

Added with the token pipeline rewrite. Three tokens moved from a bare RGB channel triple to a complete colour value. Components consumed them as `rgb(var(--token))` and now consume them as `var(--token)` directly.

| Token | Before (base) | After (base) |
|---|---|---|
| `--mg-color-button-background` | channels — `0 79 145` | colour — `rgb(0 79 145)` |
| `--mg-color-button-background--hover` | channels — `51 114 167` | colour — `rgb(51 114 167)` |
| `--mg-border-color-button` | channels — `255 255 255` | colour — `rgb(var(--mg-color-text-button))`, and may be `transparent` |

**Two of these break overrides.** `--mg-color-button-background` and `--mg-color-button-background--hover` are on the legacy-override warn list precisely because consumers set them. An override still written as channels is now invalid and the browser drops it silently — buttons lose their fill. Wrap the channels in `rgb()`:

```scss
.mg-theme-mytheme {
  --mg-color-button-background: rgb(10 105 105); // was: 10 105 105
}
```

**`--mg-border-color-button` is a fix.** It held channels but was consumed as `border: var(--mg-border-width-button) solid var(--mg-border-color-button)`. A triple there makes the whole `border` shorthand invalid, so `border-style` fell back to `none` and `.mg-button-outline` rendered as bare coloured text in every theme. Note that `$mg-border-color-button` is **not** on the legacy-override warn list, so a consumer who overrode this one with a triple gets no warning.

This is not a blanket conversion. Sibling tokens are still channel triples where they are consumed as `rgb(var(…))`; only tokens used in a bare colour position, or needing to express `transparent`, were converted. A channel triple cannot say `transparent`, which is the case that forced the change: DELTA's buttons are filled and carry no border. A test, `channel triplets are never used raw in a colour position`, now guards the whole class of mistake.

### 8. Font-family variables replaced by five roles

Closes [issue #1098](https://github.com/unisdr/undrr-mangrove/issues/1098). All six font-family SCSS variables are removed and replaced by five CSS custom properties.

| Removed | Replacement role |
|---|---|
| `$mg-font-family` | `--mg-font-family-text` |
| `$mg-font-family-headings` | `--mg-font-family-ui` |
| `$mg-font-family-condensed` | `--mg-font-family-ui` |
| `$mg-font-family-arabic-headings` | `--mg-font-family-heading` |
| `$mg-font-family-arabic-body` | `--mg-font-family-text` |
| `$mg-font-family-icons` | none — it had no stylesheet consumer, and `icons.scss` names the FontAwesome family directly |

The five roles are the whole public surface, and `_fonts.scss` re-points them for Arabic so the same declaration is correct in both scripts. A component stylesheet writes `font-family: var(--mg-font-family-ui)` and never names a face:

| Role | Latin | Arabic |
|---|---|---|
| `--mg-font-family-text` | Roboto | Noto Sans Arabic |
| `--mg-font-family-heading` | Roboto | Noto Kufi Arabic |
| `--mg-font-family-display` | Roboto Condensed | Noto Kufi Arabic |
| `--mg-font-family-ui` | Roboto Condensed | Noto Sans Arabic |
| `--mg-font-family-code` | mono stack | mono stack |

**Latin rendering is unchanged**, verified bundle by bundle in the compiled output and in a browser. Every Latin element resolves to the face it resolved to before: `text` and `heading` are both Roboto, `display` and `ui` are both Roboto Condensed. No new `font-family` declaration matches a Latin element — the one new heading rule is scoped to `:lang(ar)` precisely so that a theme setting its own face on `h1`–`h3` keeps it. If you consume compiled CSS and your pages are Latin-only, there is nothing to do and nothing to see.

The one Latin change anywhere in the library is `.mg-preview-access__submit`, which moves from Roboto Condensed to Roboto so that every button in the library is on the same role.

**Arabic rendering does change, deliberately.** The old model routed by *element* — every heading and all compact chrome took Noto Kufi Arabic. The new model routes by *role*, and Arabic has no condensed axis, so `ui` collapses onto Noto Sans Arabic. Kufi is kept for narrative h1–h3 and the hero title, where a display face belongs. Everything else that had it moves to Noto Sans Arabic:

- chrome, because `ui` collapses: card titles and labels, gallery and empty-state titles, tags, tabs, breadcrumbs, mega-menu and on-this-page navigation links, stat values, the hero label;
- prose-sized elements that the old model swept up with the headings, because they now inherit `text`: `h4`, `h5`, `h6`, `th`, and the bare `header` element — which previously handed a display face to every page-header subtree.

Arabic chrome measures about 10.8% *narrower* than the Latin equivalent, so nothing needed width compensation.

**Two Arabic elements that named no Arabic face at all are fixed by the same move.** The preview-access text input and the mega-menu top-bar link both rendered in a Latin face on Arabic pages — Roboto and Roboto Condensed respectively, neither of which has Arabic coverage — because the per-component `:lang(ar)` blocks that covered their siblings missed them. On a role they follow the map like everything else. The mega-menu half of that is [issue #1095](https://github.com/unisdr/undrr-mangrove/issues/1095), fixed as a side effect: its Arabic override named a non-existent sibling of `.mg-mega-topbar__item-link`.

#### What you need to do

**If you consume compiled CSS:** nothing.

**If you set a font-family variable before importing Mangrove**, what happens depends on how you import.

- `@use "..." with (...)` — the build **fails loudly**: Sass rejects a configured variable that no longer exists. Four of the eleven known consuming Drupal themes are on this path.
- `@import` with `!default` — the assignment **silently does nothing**, which is the dangerous case and is why `_variables.scss` emits a `@warn` for all six names. Seven consuming themes are on this path. Watch your Sass build log for a line beginning `Mangrove 2.0:`; each one names the role that replaced the variable you set.

**Move the override to the role**, in a `.mg-theme-*` block for one brand or `:root` for all of them:

```scss
// Before (1.x / early 2.0 alphas)
$mg-font-family-headings: "Roboto", sans-serif;
@import "@undrr/undrr-mangrove/scss/assets/scss/style";

// After
.mg-theme-myorg {
  --mg-font-family-ui: var(--mg-font-family-text);
}
```

**A role override can only re-point among the faces Mangrove ships** a `@font-face` for. To introduce a typeface Mangrove does not load, override the face variable instead. The five faces the roles point at — `$mg-font-face-sans`, `$mg-font-face-sans-condensed`, `$mg-font-face-mono`, `$mg-font-face-arabic-display` and `$mg-font-face-arabic-sans` — all keep `!default` for exactly this, and you load the font yourself:

```scss
$mg-font-face-sans-condensed: "Barlow Condensed", sans-serif;
@import "@undrr/undrr-mangrove/scss/assets/scss/style";
```

Faces are declared outside the brand mixins, so that assignment applies to **every** brand in the combined `style-all.css`. Per-brand typefaces from `tokens/*.yaml` are not part of this change.

#### One font import, imported once

`_fonts.scss` is the single font import. It owns the `@font-face` blocks and the Arabic script map, and every build path already reaches it: the seven entry points, the shared import list every UNDRR Drupal theme compiles (`undrr_common/scss/_mangrove-components.scss`, which names `fonts` but reaches no entry point), and the per-component recipe in the [Sass integration guide](https://mangrove.undrr.org/?path=/docs/getting-started-integration-sass-integration--docs). An earlier draft put the map in a second file that only the entry points reached, which would have shipped every production site the role definitions with no Arabic map behind them — Arabic asking for Roboto, which has no Arabic coverage.

**Import it exactly once.** Sass's legacy `@import` re-emits, so a second import duplicates all 32 `@font-face` blocks. A test counts them in every bundle and in the consumer import list.

#### If you write SCSS against Mangrove

Two authoring rules changed, and both are in the [review checklist](https://mangrove.undrr.org/?path=/docs/contributing-build-a-component-review-checklist--docs).

- **Do not write `:lang(ar)` font rules.** Nineteen component-level blocks were deleted. Script routing lives in `_fonts.scss` and nowhere else; a component that names a role gets Arabic for free, and a component-level override takes it back out of the map. This supersedes the pattern that [#1091](https://github.com/unisdr/undrr-mangrove/pull/1091) and [#1093](https://github.com/unisdr/undrr-mangrove/pull/1093) both worked on.
- **Do not declare a family on `h1`–`h6`, `p`, `th`, `td` or a bare `header`.** They inherit `text` from `body`; h1–h3 additionally get `heading` from `_foundational.scss`, and that rule is scoped to `:lang(ar)` on purpose. In Latin `heading` and `text` are the same face, so an unconditional declaration would buy nothing and cost a great deal: at (0,0,1) it ties with a consuming theme's own `h1` rule and wins on source order, because `mangrove.css` loads last. Latin headings therefore stay on pure inheritance, exactly as in 1.x, and a theme's brand face survives.

Full reference: [Fonts](https://mangrove.undrr.org/?path=/docs/design-decisions-fonts--docs).

### 9. The four CamelCase SCSS aliases removed

_Available from `2.0.0-rc.3`; the rc.2 tarball still ships all four aliases._ The npm package no longer ships any of the four CamelCase stylesheet aliases. Each existed only to forward to its kebab-case file and `@warn` that it was deprecated; none of them was imported anywhere in the library, because `stories/assets/scss/_components.scss` already imports the kebab-case file directly. They shipped only because `scripts/assemble-npm-package.mjs` copies every `stories/**/*.scss` into the package.

Switch the import path. Nothing else changes: the kebab-case file is the same stylesheet the alias was forwarding to, so the compiled CSS is identical.

| Removed | Import instead |
|---|---|
| `scss/Utilities/ShowMore/ShowMore` | `scss/Utilities/ShowMore/show-more` |
| `scss/Utilities/FullWidth/FullWidth` | `scss/Utilities/FullWidth/full-width` |
| `scss/Components/TableOfContents/TableOfContents` | `scss/Components/TableOfContents/table-of-contents` |
| `scss/Components/SyndicationSearchWidget/SyndicationSearchWidget` | `scss/Components/SyndicationSearchWidget/syndication-search-widget` |

```scss
// Before
@import "@undrr/undrr-mangrove/scss/Utilities/ShowMore/ShowMore";

// After
@import "@undrr/undrr-mangrove/scss/Utilities/ShowMore/show-more";
```

These are per-component partials, so they carry the same prerequisites they always did — importing the alias never avoided them. Import the shared foundation first, as in [Sass integration](https://mangrove.undrr.org/?path=/docs/getting-started-integration-sass-integration--docs):

```scss
@import "@undrr/undrr-mangrove/scss/assets/scss/variables";
@import "@undrr/undrr-mangrove/scss/assets/scss/fonts";
@import "@undrr/undrr-mangrove/scss/assets/scss/breakpoints";
@import "@undrr/undrr-mangrove/scss/assets/scss/mixins";
@import "@undrr/undrr-mangrove/scss/assets/scss/foundational";
```

`syndication-search-widget` needs one more: it `@extend`s `%mg-form-input-base`, so `scss/Components/Forms/form-base` has to be imported before it or Sass fails with "The target selector was not found." That is unchanged from 1.x and applied equally to the alias.

No deprecated CamelCase stylesheet aliases remain in the package.

## Upgrade notes

The [breaking changes](#breaking-changes) above are the 1.x-to-2.0 migration. These are the smaller adjustments 2.0 asks for, whether you are arriving from 1.x or from an earlier 2.0 prerelease. They are grouped by what you touch, not by the prerelease they landed in.

#### Published package imports

Use explicit published subpaths, for example `import { IconCard } from '@undrr/undrr-mangrove/components/IconCard.js'`. Default-versus-named exports vary by bundle; use the React integration guide or manifest. There is no package-root barrel. _Available from `2.0.0-rc.3`:_ the generated package metadata drops the dangling `main: "dist/index.js"`, which never named a shipped file; working subpath imports remain supported. CookieConsentBanner, Snackbar and CodeBlock have no published component bundle. ([#1265](https://github.com/unisdr/undrr-mangrove/pull/1265))

For Sass, use `@undrr/undrr-mangrove/scss/assets/scss/style`, not a repository `stories/` path. For vanilla JavaScript, include `.js`. These documentation corrections also apply to earlier packages; they do not require a new runtime API. ([#1270](https://github.com/unisdr/undrr-mangrove/pull/1270))

#### Hero composition and image-less markup

_Available from `2.0.0-rc.3`._ Check background heroes at phone and tablet widths: up to 900px, image and copy now stack and the hero can become taller. `--mg-hero-banner-block-size` controls the image band. Add `mg-hero--no-image` to hand-authored heroes without a background image; React Hero and ChildHero add it automatically. Check custom scrim overrides against the contrast methodology. Split-media layouts are not this background-image composition. ([#1263](https://github.com/unisdr/undrr-mangrove/pull/1263), [#1268](https://github.com/unisdr/undrr-mangrove/pull/1268))

#### Quote HTML and caller-owned content

_Available from `2.0.0-rc.3`._ QuoteHighlight sanitises `quote`, `attribution` and `attributionTitle` with DOMPurify. Normal emphasis and attribution links survive; scripts, event handlers, unsafe URLs and embeds do not. The default policy also strips `target` and `referrerpolicy`, so an attribution link with `target="_blank"` now opens in the same tab. Check authored quotes before upgrading. Tab panel HTML and MegaMenu's `bannerDescription` still require caller-sanitised content, and custom syndicated-search endpoints remain a trust boundary. ([#1261](https://github.com/unisdr/undrr-mangrove/pull/1261), [#1258](https://github.com/unisdr/undrr-mangrove/pull/1258), [#1254](https://github.com/unisdr/undrr-mangrove/pull/1254))

#### Data tables

_Available from `2.0.0-rc.3`._ Data cells use the intended compact size, numeric cells align to the inline end, and code inside a cell retains its monospace font and compact size. Review custom cell overrides that compensated for the earlier cascade. ([#1279](https://github.com/unisdr/undrr-mangrove/pull/1279))

#### Snackbar

It keeps its props, but the toast renders as a Notice with a light surface instead of a filled coloured bar. If you hand-wrote Snackbar markup, the `.mg-snackbar__content` and `.mg-snackbar__icon` elements and the filled `.mg-snackbar__error`, `__warning`, `__info` and `__success` colour styles are gone — the modifier classes remain only as hooks — and `SnackbarIcons.jsx` is removed. Snackbar was not used in production before this change. `severity` now defaults to `info`, where it was previously unset. `info` and `success` toasts announce politely (`role="status"`), a toast with `openedMiliseconds` no longer takes focus, and focus returns to its previous element on close.

#### Type scale

Use `var(--mg-font-size-*)` in new styles. `$mg-font-size-*`, `$mg-font-body` and `$mg-font-tag` still compile but are deprecated; overriding `$mg-font-tag` no longer changes Mangrove's own components.

#### Line heights

Use `var(--mg-font-line-height-*)`. `$mg-font-line-height-500` and `$mg-font-line-height-700` still compile but are deprecated until 3.0.

#### Filled buttons and button height

Filled primary, secondary and disabled buttons no longer show the light `--mg-border-color-button` stroke around a smaller fill; the fill runs under a transparent border. To give a filled button a visible stroke, set `--mg-border-color-button-primary` or `--mg-border-color-button-secondary`. Buttons with an icon and a label are now 36px tall, so check tight toolbars.

#### Icon button

A bare `.mg-icon-button` no longer picks up `display: flex` and `10px` padding from a global MegaMenu rule; it is now the 36px `inline-flex` square the primitive defines. If you relied on the extra padding, add it in your own styles. ([#1173](https://github.com/unisdr/undrr-mangrove/pull/1173))

#### Switch

A switch with `aria-disabled="true"` now looks dimmed, like a disabled one, while staying focusable; remove the attribute from switches that should look available. In forced colours (Windows high contrast) the switch opts out of colour forcing and paints itself in system colours; it was invisible before, so check any forced-colours overrides you added for `.mg-switch`. If you built your own pending glue, `js/switch-pending.js` can replace it.

#### Switch error state and sizing

_Available from `2.0.0-rc.3`._ Both are new API, so nothing breaks by doing nothing. If you wrote your own error rule for `.mg-switch`, replace it: `aria-invalid` on the input, `.mg-switch__input--error`, or `.mg-switch--error` on the label now gives the track a red boundary that survives forced colours and cannot displace the focus ring, and pairs with the same sibling `p.mg-form-error` every other field uses. If you wrote your own sizing rule, replace it too — the thumb's `transform` is no longer something to override, and overriding it was what broke the thumb in RTL. Set `--mg-switch-size`, or one of `--mg-switch-track-inline-size`, `--mg-switch-track-block-size`, `--mg-switch-track-inset` and `--mg-switch-thumb-size`, and use `.mg-switch--small` for the shared compact size. The track's inset is now a transparent border rather than padding; every default measurement is unchanged.

#### Switch pending timeout

_Available from `2.0.0-rc.3`._ `timeout: 0` now means *no deadline*. Passing `0` to rc.2 was rejected as not a positive finite number and silently got the 10-second default, so a caller that passed `0` meaning "use the default" now has a save that never times out. Pass nothing, or `10000`, to keep the old behaviour. `Infinity` means the same as `0`. With no deadline the helper announces "Still saving…" once at ten seconds instead, and `aria-busy` stays true until the save settles. `revert: false` and `mgSwitchAnnouncer()` are additions; every other default is unchanged.

#### Icon card border

_Available from `2.0.0-rc.3`._ `.mg-card__icon--bordered` used to render no border at all when `--mg-card-border` was unset, which is what hand-written vanilla markup usually did. It now falls back to `rgb(var(--mg-color-interactive))`, so that markup gains a visible accent border in the brand colour. Set `--mg-card-border` on the element or an ancestor to choose a different one. React callers are unaffected either way: IconCard emits the modifier class only when `borderColor` is set, and sets the property inline with it.

#### Hand-written lists

_Available from `2.0.0-rc.3`._ Mangrove's own lists keep their `list` role from CSS now, so you do not need `role="list"` on a `.mg-breadcrumb`, `.mg-pager__list`, `.mg-on-this-page-nav__list`, `.mg-legend__list`, MegaMenu nav list or `.mg-status-label-group` you wrote by hand. An attribute already there is harmless. If you hide markers on your own list, use `list-style: none` followed by `list-style-type: ""` on both the list and its items rather than `none` alone. A breadcrumb written as an `<ol>` is now styled like the `<ul>` form, so if you worked around the missing rule with your own `list-style` or flex declarations, check them.

#### Tabs

A vanilla tab set removed without `mgTabsDestroy()` is now suspended and resumes with its selection if the same node is re-attached; call `mgTabsDestroy()` or abort a `{ signal }` passed to `mgTabs()` to release a set for good. While any tab set is initialised, the runtime holds one extra window `resize` and one extra `hashchange` listener, so tests that count window listeners need updating. When a retained selection is restored (`mgTabsDestroy(container, true)` then `mgTabs()`, as the React wrapper does on updates) and the URL hash changed in the meantime, the hash now wins.

#### Tree

`import Tree from '.../components/Tree.js'` now gives `HydratedTree`, which takes the same props and children; import `{ Tree }` if you need the component itself. Item DOM ids are scoped per tree and are no longer `mg-treeitem-{id}`, so in-page links or scripts that target those ids should use `data-mg-treeitem-id` instead. Tree remains a prototype.

#### ServiceNotice hydration

`mg-notice--compact` and `mg-notice--overlay` on a `data-mg-service-notice` container are read and then removed from the container, so they no longer style it as a second notice. Prefer `data-is-compact` and `data-is-overlay`.

#### Hydration `identifierPrefix`

The number in generated prefixes (`<slug>-<n>-`) is now page-wide rather than the root's index in the scanned context. Do not rely on a specific number. A page that mixes this runtime with an older copy can still collide.

#### ShowMore

_Available from `2.0.0-rc.3`._ The documented toggle is a `<button type="button">` rather than an `<a href="#">`. An anchor already in your markup keeps working — it is given `role="button"` and the Space handler — but new markup should use a button.

_Available from `2.0.0-rc.3`._ React ShowMore owns only its toggle listeners, cleans them up on unmount and initialises items added after the first render. Use `labelCollapsed` (default “Show more”) and `labelOpen` (default “Show less”) for translated labels; `button_text` is legacy. The vanilla helper resolves a target from the nearest ancestor outward before falling back to the document, so repeated default-target instances no longer toggle the first block on the page. ([#1279](https://github.com/unisdr/undrr-mangrove/pull/1279), [#1238](https://github.com/unisdr/undrr-mangrove/pull/1238))

#### Prototypes

Drawer, Tree, Legend and Range are prototypes and their APIs may change before 2.0 is stable. Drawer's `children` and `footer` strings render as text; pass markup through `bodyHtml` / `footerHtml`, which are sanitised.

#### Storybook links

Regrouping messaging and navigation components renamed their story ids. Bookmarks or external docs pointing at `components-snackbar`, `components-cookieconsentbanner`, `components-megamenu`, `components-pager`, `components-on-this-page-nav`, `components-table-of-contents` or `components-skip-link` need the new `components-notice-*` or `components-navigation-*` ids.

#### Docs domain

Update bookmarks, `llms.txt` / `llms.json` fetchers and other tooling to `https://mangrove.undrr.org/`. Old `preventionweb.github.io/undrr-mangrove/` URLs 301-redirect with path and query kept. CDN URLs (`assets.undrr.org/mangrove/`) and the npm package are unchanged.

## Sub-brand theming migration

**Consuming a compiled sub-brand stylesheet?** You do not touch SCSS at all — just add `class="mg-theme-{brand}"` (e.g. `mg-theme-preventionweb`) to `<body>` or a wrapping element. The compiled CSS already carries the brand block; the class is what activates it. The markup snippet is under **Apply the class in your HTML** below.

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

Full token list: [Design decisions/Colors](https://mangrove.undrr.org/?path=/docs/design-decisions-colors--docs), [Design decisions/Spacing](https://mangrove.undrr.org/?path=/docs/design-decisions-spacing--docs).

## Feedback

2.0 is in release candidate; feedback is wanted before it goes stable. Report problems in [GitHub issues](https://github.com/unisdr/undrr-mangrove/issues). The organisation flag can hide issue listings even when issues exist, so retain the direct URL of a report. Include:

1. **Consumption mode** — compiled CSS via CDN, compiled CSS via npm, or SCSS import.
2. **Brand** — base UNDRR, or which sub-brand (PreventionWeb / IRP / MCR / DELTA).
3. **What you saw vs. expected** — including whether your Sass build printed any `Mangrove 2.0:` warning.
