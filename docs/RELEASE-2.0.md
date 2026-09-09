# Mangrove 2.0 release notes

Mangrove 2.0 combines four related workstreams: the runtime theming foundation published in `2.0.0-alpha.1`, the experience and interaction baseline in `2.0.0-alpha.2`, the design token pipeline introduced in `2.0.0-alpha.3`, and the typography and navigation refinements prepared for `2.0.0-alpha.4`. See [PR #1061](https://github.com/unisdr/undrr-mangrove/pull/1061) for the first alpha, [PR #1086](https://github.com/unisdr/undrr-mangrove/pull/1086) for alpha.2 and [PR #1087](https://github.com/unisdr/undrr-mangrove/pull/1087) for alpha.3. The tagged `v1.8.2...v2.0.0` comparison lands with the stable release.

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

2.0 ships as a **prerelease** under the `next` dist-tag, so it never lands on `latest` — a plain `npm install @undrr/undrr-mangrove` stays on 1.x until 2.0 is stable. This release candidate is `2.0.0-alpha.4`; until it is published, `@next` continues to resolve to `2.0.0-alpha.3`. The alpha.4 CDN links below become available after the versioned assets are deployed.

```bash
# npm (prerelease tag — does not become your default version)
npm install @undrr/undrr-mangrove@next
```

```html
<!-- CDN, versioned path (pick the base or a sub-brand stylesheet) -->
<link rel="stylesheet" href="https://assets.undrr.org/mangrove/2.0.0-alpha.4/css/style.css">
<link rel="stylesheet" href="https://assets.undrr.org/mangrove/2.0.0-alpha.4/css/style-preventionweb.css">
```

For a compiled-CSS consumer the entire trial is two lines: swap the stylesheet href above, and — for a sub-brand — add `class="mg-theme-{brand}"` to `<body>` or a wrapping element. Found a problem? See [where to report](#feedback).

## Alpha roadmap

| Prerelease | Status | Focus |
|---|---|---|
| `2.0.0-alpha.1` | Published under `next` | CSS custom-property theming, 16px root and sub-brand runtime selectors |
| `2.0.0-alpha.2` | Published under `next` | Experience principles, component surfaces, interaction states, responsive behaviour and multilingual resilience |
| `2.0.0-alpha.3` | Published under `next` | Design token pipeline, status and empty-state components, data-visualisation palette and a perceptual colour-contrast methodology |
| `2.0.0-alpha.4` | Release candidate; not yet published | Arabic typography settled on Noto Kufi Arabic and Noto Sans Arabic, replacing Dubai; Arabic overrides anchored to language boundaries; font families rebuilt as five script-mapped roles; centred responsive tabs and progressive mobile navigation |

### Alpha.2 experience and interaction baseline

Alpha.2 applies a shared experience direction without mechanically homogenising components or overriding theme-owned expression:

- Shared surface, border, shadow, radius, focus and reduced-motion tokens provide a consistent foundation.
- Buttons, forms, cards, hero compositions, tabs, disclosures, menus, on-page navigation, tables, Pager, ScrollContainer and Text CTA receive coordinated responsive and interaction refinements.
- The new `FormAction` composition joins a field and its key action for search, subscription and select-and-continue flows, with accessible help and error wiring, RTL support and optional mobile stacking.
- The new standalone `UserFeedback` component brings the common page-usefulness prompt into Mangrove for the usual pre-footer position. It ships as a package-root React export and direct hydratable bundle while keeping response storage, analytics and consent product-owned.
- The editorial CTA gains stable hover geometry, logical RTL placement and safe wrapping for long translations. Conventional buttons remain the default for forms, consent and utility actions.
- Chips distinguish navigational links from dismiss actions and add visible removal affordances, logical spacing, focus, reduced-motion and forced-colour support.
- Inline code uses a compact theme-aware surface with clearer monospace typography and coherent decoration across wrapped snippets.
- Vertical, horizontal, book, icon and stats cards receive theme-aware presentation refinements. Vertical-card media fills its frame consistently, without changing the intentional sizing of the book, horizontal or icon variants.
- The Storybook introduction and Component Laboratory demonstrate production compositions, responsive collections, deterministic syndicated-search states, forms and data-rich examples, and landing-page showcase cards link to the relevant guidance and stories.
- Storybook's global locale toolbar becomes the canonical translation mechanism; redundant per-language story groups are removed, and dedicated RTL and long-label stories remain where they test a distinct layout condition. `UserFeedback` ships seven toolbar locales and accessible confirmation focus.
- Logical properties, focus states, target sizing, reduced motion, forced colours, narrow layouts, RTL and long translations are covered across representative components and themes, and component guidance and changelogs, the Experience principles, contribution guidance and AI manifest examples are synchronized with the updated markup and public classes.
- `FormAction` ships as a direct `components/FormAction.js` ESM entry as well as SCSS and the package-root export, and published component bundles are built against React's production JSX runtime rather than reusing Storybook development transforms: production bundles use isolated, uncached Babel output, and manifest validation now rejects any production bundle containing development JSX runtime calls.
- Every compiled CSS bundle includes a preserved Mangrove version banner synchronized from `package.json`, making deployed asset versions visible in source and diagnostics.
- The Yarn lockfile is synchronized with the first alpha's dependency removals, so immutable installs succeed from the release commit.

Alpha.2 has been checked across desktop and mobile layouts, Chromium and Firefox, RTL, long labels, keyboard focus, reduced motion, forced colours and representative UNDRR themes. See the [Experience principles](https://unisdr.github.io/undrr-mangrove/?path=/docs/design-decisions-experience-principles--docs) for the design guardrails behind these changes.

### Alpha.3 token pipeline and colour methodology

A foundation release. No required integration change, but **three defaults change for every consumer in every theme**, and DELTA's palette is corrected further.

#### Design tokens have a source

Brand palettes move from hand-maintained SCSS to YAML sources under `tokens/`, compiled by `scripts/build-tokens.cjs` into the theme CSS and Sass the library already consumed. `tokens/mangrove.yaml` is a brand-neutral base, so UNDRR becomes a sub-brand alongside PreventionWeb, IRP, MCR and DELTA rather than the base itself.

The format borrows [W3C DTCG](https://tr.designtokens.org/)'s vocabulary — `$value`, `$type`, `$description`, `{path}` aliases — but is not conformant: six vendor keys sit outside `$extensions` and dimensions are bare numbers, so DTCG tooling cannot read these files without a conversion that does not exist yet.

The generator fails the build on an unknown or circular reference, a duplicate output name or a wrong token shape, so a malformed source cannot silently emit a stylesheet with missing colours. Base, PreventionWeb, IRP and MCR values are unchanged; three tokens change shape ([breaking change #7](#7-three-button-tokens-changed-shape)).

Build output is no longer committed. The generated token partials are produced by `yarn scss` and are now gitignored, as the compiled theme stylesheets already were. A Jest `globalSetup` writes any missing partial, so `yarn test` works on a fresh clone with no build step.

**New: `tokens/output-baseline.json`.** A committed SHA-256 manifest of the generated bytes for all five themes. Because the partials themselves are gitignored, this is what makes an unintended change to compiled output fail `yarn test` instead of shipping unnoticed. Regenerate it deliberately, as part of the change that justifies it: `node scripts/build-tokens.cjs --baseline`. There is no `yarn` wrapper for the flag.

**Token authors: overrides inherit shape, and used not to.** In the generator's layered merge, a brand override that re-valued a token without restating `$format` silently reverted it to a bare channel triple — invalid in a colour position, and discarded without a word. `$name`, `$type`, `$private` and `$sass` had the same failure: omitting `$name` wrote `--mg-<id>` instead of the property consumers actually read, making the override a no-op; omitting `$private` leaked a brand primitive into the public CSS. `scripts/build-tokens.cjs` now carries all five keys from the inherited layer when an override does not restate them. `$value`, `$alpha` and `$description` are deliberately not carried. This is the class of bug behind the `.mg-button-outline` breakage in [breaking change #7](#7-three-button-tokens-changed-shape).

#### Build and packaging

**`npm pack` at the repo root now produces a usable tarball.** A `files` allowlist and a companion `.npmignore` were added to `package.json`, plus a `prepack` script (`yarn scss`) that regenerates the token partials and compiled CSS before packing. Without the `.npmignore`, npm falls back to `.gitignore` — which excludes the generated `_tokens-*.scss` partials and the compiled `style*.css` — so a root-packed tarball contained SCSS entry points that could not compile, on a missing `@import`.

**The publish workflow was never affected.** `.github/workflows/npm-publish.yml` does not pack from the repo root: it runs `yarn build`, assembles a separate `npm-package/` directory from `dist/` plus a filesystem walk for SCSS, and writes its own `package.json`. Released packages were always correct. This change fixes local and third-party `npm pack` only.

#### New components

`StatusLabel` (`.mg-status-label`) with `--draft`, `--published`, `--waiting-validation` and `--waiting-information` variants, and `EmptyState` (`.mg-empty-state`) with `--compact`, `--panel` and `--start` variants. Both are additions no existing component uses.

#### Changed default: the neutral ramp's surface half is cool-tinted

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

#### Changed default: the focus ring is no longer the brand colour

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

#### Changed default: the focus ring is two bands

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

#### A data-visualisation palette with real Sendai semantics

`--mg-sendai-target-a` through `--mg-sendai-target-g` express the seven Sendai Framework targets.

The old `--sendai-red`, `--sendai-orange`, `--sendai-purple` and `--sendai-turquoise` tokens, and the matching `.mg-u-background-color--sendai-*` and `.mg-u-color--sendai-*` utility classes, are **deprecated**: they are brand accent hues named by colour and carry no Sendai Framework meaning. They continue to work unchanged, and SCSS consumers see a Sass `@warn` on compile. Scheduled for removal in 2.1.

#### Colour contrast methodology

- Token pairs are now graded with an [Oklab](https://www.w3.org/TR/css-color-4/#ok-lab)-based perceptual measure alongside WCAG 2's relative-luminance figure, calibrated so its thresholds align with the familiar 4.5:1 and 3:1 boundaries.
- Every foreground/background token pair is graded on both measures, covering every theme, hover and active states and the legacy `.mg-*` components, and the build fails if any pair passes perceptually while WCAG 2 fails it.
- Coverage is 90 component pairs. 11 of them grade the focus ring against surfaces it is actually painted on — the gallery letterbox, the mega-menu link tint, the form error summary, the snackbar, the hero banner — and 18 grade the data-visualisation palette. Neither the focus ring nor the dataviz palette was graded at all before alpha.3.
- Pairs that cannot yet meet the target are recorded as explicit exceptions — 65 against WCAG 2, 84 against the perceptual measure. Both counts rose during alpha.3 as coverage rose. Widening the net found failures that were always there; it did not introduce them. Most of them are the accent ramp, which is a brand decision, not a wiring one.
- APCA was evaluated and rejected on licensing grounds. Reasoning in [Colour contrast methodology](https://github.com/unisdr/undrr-mangrove/blob/main/docs/COLOUR-CONTRAST-METHODOLOGY.md).

#### DELTA's palette is corrected

**DELTA consumers should read this. The other four themes are unaffected.** 26 of DELTA's 57 tokens change value or shape. This is a deliberate correction, not a side effect of the token rewrite.

DELTA's Mangrove theme was built on a navy, `#132e48`, that appears **zero times** in DELTA's own codebase. Its card surface was `#fafafa`, which appears once in DELTA where the colour DELTA actually uses, `#f2f2f2`, appears eleven times. Alpha.3 reads the palette from DELTA's production repository and its DLDTS design file instead of inferring it.

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

#### Arabic text uses one family

Arabic headings were Noto Kufi Arabic and body was Dubai. Both became Dubai in alpha.3, so Arabic readers downloaded one font instead of two.

A caveat was stated at the time: dropping Kufi was a judgement rather than a correction, because the UAE Federal Design System and OCHA's own base theme both set Noto Kufi for body. A second question was left open — the Dubai EULA requires the font be embedded so an end user cannot extract it and forbids redistribution, while Mangrove served it as a plain WOFF2 from an open CDN, referenced by an Apache-2.0 library that pointed other organisations at that copy.

**Both have since been settled the other way** — see [Arabic typography settled](#alpha4-arabic-typography-settled) below. Dubai is no longer shipped.

#### Not yet resolved

These are known and deliberately unfinished in alpha.3:

- Sub-brand tab colours are not wired into the alpha.2 underline tab treatment. The brands designed a filled tab (white on a solid brand background); piping those colours into an underline on a white page measures 1.00:1. Resolving it is a design decision, not a wiring change.
- The accent ramp is the largest remaining accessibility debt and is the reason most of the 65 WCAG exceptions exist. Retuning it is a brand decision.
- Forced-colours behaviour has not been verified in real Windows High Contrast, only in emulation. The two-band mixins are built to degrade correctly there, but that is reasoned, not observed.
- `--mg-color-focus-ring-inverse` resolves to white in all five themes, so it is a seam with nothing behind it yet. It earns its keep only when a theme retunes it.

### Alpha.4 typography and navigation

#### Arabic typography settled

**Arabic now pairs Noto Kufi Arabic headings with Noto Sans Arabic body text. Dubai is removed.** This closes [issue #1089](https://github.com/unisdr/undrr-mangrove/issues/1089), which asked for the Arabic typeface to be chosen deliberately rather than inherited.

Dubai came to Mangrove from OCHA, but the inheritance was weaker than it looked and had gone stale on both halves. Dubai was OCHA's *alternative* subtheme pairing — body only, never headings, Regular only — not their base theme, which used Noto Kufi Arabic. And on 2026-05-28 OCHA's own brand guidance moved to Almarai for display and Noto Sans Arabic for body.

Both Noto families are [SIL Open Font License 1.1](https://openfontlicense.org/), which also settles the redistribution question Dubai's EULA left open.

This is two Arabic families where alpha.3 had one, and that is deliberate. Kufi is a display style — angular, high contrast, architectural — so it earns its place in headings and is the wrong choice at body size; Noto Sans Arabic carries the running text and shares Noto Sans' proportions. The second download is subset by `unicode-range` across `arabic`, `latin` and `latin-ext`, so a page fetches only the scripts it renders — an English string inside an Arabic page pulls the small `latin` file, not the much larger `arabic` one.

Only Regular (400) and Bold (700) are published in the UNDRR asset library for either family, unchanged from Dubai, so Arabic keeps a 400/700 ladder where Latin has four steps. Both upstream families span 100-900, so adding a weight is an asset-library packaging task rather than an upstream limitation.

Per the CSS font-matching rules a target of `600` resolves up to Bold, but a target of `400`-`500` resolves *down*, so `font-weight: 500` renders Regular in Arabic. That is less of a divergence from Latin than it first appears: Roboto publishes a Medium, but **Roboto Condensed does not**, so compact chrome set in the condensed face already renders Regular at 500 in both scripts. Only the `font-weight: 500` declarations sitting on the Roboto body face actually differ. This was equally true of Dubai.

**One typographic inconsistency went with it.** Arabic buttons now take the body family, matching the [review checklist](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-build-a-component-review-checklist--docs) and the CtaButton, Chips and ShareButtons components. A bare `<button>` and `.mg-preview-access__submit` previously took the headings family, so two buttons on one page could render in two typefaces — invisible for as long as both Arabic tokens resolved to Dubai.

**Two costs worth stating plainly.**

*Glyph coverage narrows.* Dubai was a single unsubsetted file; the replacements are subsetted, and the asset library publishes only the `arabic`, `latin` and `latin-ext` subsets — not `math` or `symbols`. Around 158 codepoints Dubai rendered now fall through to the next font in the stack. The ones most likely to appear in DRR content are the superscripts `²` and `³` (as in km², m³), `±`, the fractions `½ ¼ ¾`, `µ`, the comparison and statistical signs `≤ ≥ ≠ ≈ ∞ √ ∑ ∫ ‰`, Greek letters, and the footnote daggers `† ‡`. These still render, in the reader's fallback face, at a different weight and cap-height. Closing the gap means publishing the missing subsets in the asset library, not a change here.

*Arabic pages get heavier.* Two families means two Arabic downloads. For a page using both weights of both faces the `arabic` subsets total roughly 187 KB against Dubai's 115 KB — about **+72 KB (+63%)**. The `unicode-range` split genuinely helps the Latin subsets, which are small and fetched only when Latin appears, but it does not offset the second Arabic face. This is the price of the heading/body distinction; it is a real cost, not a free one.

**If you override the Arabic tokens**, note that `$mg-font-family-arabic-headings` and `$mg-font-family-arabic-body` were removed later in alpha.4 by the font role model — see [breaking change #8](#8-font-family-variables-replaced-by-five-roles). The faces are now `$mg-font-face-arabic-display` (`"Noto Kufi Arabic", sans-serif`) and `$mg-font-face-arabic-sans` (`"Noto Sans Arabic", sans-serif`). Mangrove no longer emits a Dubai `@font-face`, so a theme that wants Dubai must declare its own. The fonts are served WOFF2-only from `https://assets.undrr.org/fonts/`.

#### Arabic typography now respects language boundaries

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

#### Tabs and mobile navigation

[Tabs (#1097)](https://github.com/unisdr/undrr-mangrove/pull/1097) centre a compact group when it fits and scroll horizontally when it overflows. The active tab uses a soft brand tint. Existing HTML is enhanced without a markup migration. React consumers can opt into mobile stacking with `stackOnMobile`; plain HTML uses `data-mg-js-tabs-stack-on-mobile`. Panels retain their state through responsive changes, and manual rail scrolling does not change selection.

[MegaMenu (#1100)](https://github.com/unisdr/undrr-mangrove/pull/1100) reveals one mobile level at a time, with Back above the title and a separate Close control. Section headings link to their landing pages. Top-level sections remain prominent while inner links use regular body typography. The panel is at least 400px where space permits, capped at the smaller of 700px or 90% of the viewport, leaving the page visible for outside dismissal. Translucency, blur and short RTL-aware transitions have opaque, motion-free accessibility-preference fallbacks. Focus and scroll restore on return; closing and rapid reopening are covered by regression tests. Existing `sections`, logo props, Drupal markup and hydration entry points remain supported. New labels are optional. Simple Nav removes the unused hamburger gutter and scrolls on mobile overflow.

Compiled-CSS consumers do not need a markup migration for these navigation updates. Sass consumers must apply the font-role migration in [breaking change #8](#8-font-family-variables-replaced-by-five-roles), and themes depending on Dubai must supply their own font declaration.

## Find your path

| I am... | Go to... |
|---|---|
| A **base UNDRR** Drupal/CDN consumer, no custom SCSS | [What changed visually](#what-changed-visually) and [the alpha.2 baseline](#alpha2-experience-and-interaction-baseline) |
| A **sub-brand** Drupal/CDN consumer (PW, IRP, MCR, DELTA) | [Sub-brand theming migration](#sub-brand-theming-migration) — add the `mg-theme-*` body class |
| A **DELTA** consumer | [DELTA's palette is corrected](#deltas-palette-is-corrected) — your brand colours changed |
| A developer who imports Mangrove SCSS | [Breaking changes](#breaking-changes) |
| A developer who overrides a **font-family** variable | [Breaking change #8](#8-font-family-variables-replaced-by-five-roles) — all six were removed |
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
| `$mg-font-face-*` | `@font-face` and Sass interpolation need a compile-time value. These are the typefaces; the families components read are the `--mg-font-family-*` roles, which are custom properties — see [#8](#8-font-family-variables-replaced-by-five-roles) |
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

The `style-legacy.scss`, `style-preventionweb-legacy.scss`, `style-irp-legacy.scss`, and `style-mcr-legacy.scss` entry points are deleted along with their compiled `*-legacy.css` builds, and `$mg-html-font-size` is now fixed at `16` (the `!default` override is gone). Mangrove 2.0 assumes the **browser-standard 16px document root** and no longer emits a root `font-size` override.

Consumers that ran on the legacy 10px root — a `html { font-size: 62.5% }` (or `10px`) root, or a build that set `$mg-html-font-size: 10` — must migrate:

- Serve your document at a **16px root** (remove the `62.5%`/`10px` `html` font-size).
- **Convert your own rem-based CSS from a 10px to a 16px basis.** A rule that meant 14px as `1.4rem` under a 10px root now renders 22.4px; rewrite it (e.g. `0.875rem`, or use `px`). This is the substantive part of the migration — Mangrove's own output is already correct for the 16px root.

There is no compatibility build; the 16px root is the only supported basis.

### 6. Deprecated Pagination component removed

The deprecated `Pagination` component, its stories and documentation are removed in alpha.2. Use `Pager`, which is the supported 2.0 pagination pattern. Existing consumers that still import or render `Pagination` must migrate before adopting this prerelease.

### 7. Three button tokens changed shape

Added in alpha.3. Three tokens moved from a bare RGB channel triple to a complete colour value. Components consumed them as `rgb(var(--token))` and now consume them as `var(--token)` directly.

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

Added in alpha.4, closing [issue #1098](https://github.com/unisdr/undrr-mangrove/issues/1098). All six font-family SCSS variables are removed and replaced by five CSS custom properties.

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

`_fonts.scss` is the single font import. It owns the `@font-face` blocks and the Arabic script map, and every build path already reaches it: the seven entry points, the shared import list every UNDRR Drupal theme compiles (`undrr_common/scss/_mangrove-components.scss`, which names `fonts` but reaches no entry point), and the per-component recipe in the [Sass integration guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-sass-integration--docs). An earlier draft put the map in a second file that only the entry points reached, which would have shipped every production site the role definitions with no Arabic map behind them — Arabic asking for Roboto, which has no Arabic coverage.

**Import it exactly once.** Sass's legacy `@import` re-emits, so a second import duplicates all 32 `@font-face` blocks. A test counts them in every bundle and in the consumer import list.

#### If you write SCSS against Mangrove

Two authoring rules changed, and both are in the [review checklist](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-build-a-component-review-checklist--docs).

- **Do not write `:lang(ar)` font rules.** Nineteen component-level blocks were deleted. Script routing lives in `_fonts.scss` and nowhere else; a component that names a role gets Arabic for free, and a component-level override takes it back out of the map. This supersedes the pattern that [#1091](https://github.com/unisdr/undrr-mangrove/pull/1091) and [#1093](https://github.com/unisdr/undrr-mangrove/pull/1093) both worked on.
- **Do not declare a family on `h1`–`h6`, `p`, `th`, `td` or a bare `header`.** They inherit `text` from `body`; h1–h3 additionally get `heading` from `_foundational.scss`, and that rule is scoped to `:lang(ar)` on purpose. In Latin `heading` and `text` are the same face, so an unconditional declaration would buy nothing and cost a great deal: at (0,0,1) it ties with a consuming theme's own `h1` rule and wins on source order, because `mangrove.css` loads last. Latin headings therefore stay on pure inheritance, exactly as in 1.x, and a theme's brand face survives.

Full reference: [Fonts](https://unisdr.github.io/undrr-mangrove/?path=/docs/design-decisions-fonts--docs).

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
