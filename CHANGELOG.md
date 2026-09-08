# Changelog

Detailed change records live in two places:

- **Project releases**: [GitHub Releases](https://github.com/unisdr/undrr-mangrove/releases) — library-wide version history.
- **Component changelogs**: Each component's MDX file has a `## Changelog` section with per-component version history. Browse them in [Storybook](https://unisdr.github.io/undrr-mangrove/) or in the `stories/` directory.

For the changelog format specification, see the [component contribution guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs#changelog-format).

This file collects only cross-cutting library-wide notes that don't fit either location above (e.g. repo-wide build / tooling / policy changes).

## Unreleased

_Notable cross-cutting changes between releases land here. Per-component changes belong in the component's MDX changelog._

### Arabic typography now respects language boundaries

Closes [issue #1092](https://github.com/unisdr/undrr-mangrove/issues/1092). Every `:lang(ar)` override was written as a descendant selector — `:lang(ar) { h1 { ... } }`, compiling to `:lang(ar) h1`. `:lang()` there matches the *root* and the `h1` is merely a descendant, so the rule fired on every heading beneath an Arabic root regardless of that heading's own language. An English island inside an Arabic page — a quotation, a citation, an untranslated widget — rendered in Arabic typography.

- The pseudo-class is now attached to the styled element (`h1:lang(ar)`), across `_foundational.scss`, `_utility.scss` and 19 component stylesheets. `:lang()` already inherits down the tree, so this matches on *computed* language and stops at a `lang="en"` boundary. Specificity is unchanged in all 24 compiled selectors, and no rule changed position in the cascade.
- **Two new rules in `_foundational.scss`**, because anchoring alone was not enough — `font-family` still inherits, so a `lang="en"` island kept the Arabic family it inherited from `body:lang(ar)`. The family is reasserted at the language boundary only, on the element that declares the new language, and everything below it inherits normally:

  ```scss
  :where(:lang(ar)) > :where([lang]:not([lang=""], :lang(ar))) { font-family: $mg-font-family; }
  :where(:not(:lang(ar))) > :where([lang]:not([lang=""]):lang(ar)) { font-family: $mg-font-family-arabic-body; }
  ```

  A language sub-root always has a parent of the outer language, so the child combinator selects exactly these switch points. It deliberately is **not** a descendant selector: a rule matching every descendant would also match component children that inherit their container's family — a `.mg-card__title` link, a `.mg-hero__title` heading — and a matched declaration beats an inherited one at any specificity, so those would lose Roboto Condensed. Both rules carry zero specificity via `:where()`, so a component rule on the boundary element itself still wins. `[lang]:not([lang=""])` leaves `lang=""` — *unknown* language per HTML, not *Latin* — inheriting rather than guessed at.
- **Arabic resuming inside a non-Arabic island now works**, as does an Arabic island on an otherwise Latin page — the second rule handles both. Previously only `<p>` recovered, by accident of `p:lang(ar)` existing.
- This is a selector fix, not a font change. It predates the Noto change below and behaved identically with Dubai. No font token is changed.

### Arabic typefaces changed: Dubai replaced by Noto Kufi Arabic and Noto Sans Arabic

Closes [issue #1089](https://github.com/unisdr/undrr-mangrove/issues/1089).

| Token | Before | After |
|---|---|---|
| `$mg-font-family-arabic-headings` | `"Dubai", sans-serif` | `"Noto Kufi Arabic", sans-serif` |
| `$mg-font-family-arabic-body` | `"Dubai", sans-serif` | `"Noto Sans Arabic", sans-serif` |

Arabic buttons take the body family, matching `REVIEW-CHECKLIST.md` and the CtaButton, Chips and ShareButtons components. A bare `<button>` and `.mg-preview-access__submit` previously took the headings family, so two buttons on one page could render in two typefaces — invisible while both Arabic tokens resolved to Dubai. `header` and `th` still take the headings family; changing those is a typographic-role decision tracked separately.

**Breaking:** Mangrove no longer emits a Dubai `@font-face`. A theme that restates either token as Dubai still compiles, but must now declare its own face or drop the override.

Rationale, the CDN paths, and why this reverses the single-Arabic-family decision made in `2.0.0-alpha.3` are in the [v2.0 release notes](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-release-notes-v2-0--docs).

## 2.0.0 — unreleased

Development releases began with `2.0.0-alpha.1` under the npm `next` dist-tag. See [PR #1061](https://github.com/unisdr/undrr-mangrove/pull/1061) for the first alpha, [PR #1086](https://github.com/unisdr/undrr-mangrove/pull/1086) for alpha.2 and [PR #1087](https://github.com/unisdr/undrr-mangrove/pull/1087) for alpha.3. The [Storybook release notes](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-release-notes-v2-0--docs) cover the complete 2.0 line; the tagged stable GitHub Release link lands with 2.0.0.

### `2.0.0-alpha.3` — 2026-09-04

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-alpha.3) for the curated release summary once the manual release is published.

Landed in [PR #1087](https://github.com/unisdr/undrr-mangrove/pull/1087). A foundation release: no required integration change, but **three system-wide defaults change deliberately and are visible to every consumer in every theme** — the [neutral ramp's surface half is cool-tinted](#changed-default-the-neutral-ramps-surface-half-is-cool-tinted), the [keyboard focus ring is no longer the brand colour](#changed-default-the-focus-ring-is-no-longer-the-brand-colour), and the [ring is drawn as two bands](#changed-default-the-focus-ring-is-two-bands).

**One theme changes further: [DELTA's palette is corrected](#corrected-deltas-palette).** Earlier drafts of these notes said the token rewrite was byte-identical apart from the shared defaults. That was not true, and the claim has been removed. For the base, PreventionWeb, IRP and MCR themes the values are unchanged and only [three tokens change shape](#breaking-three-button-tokens-changed-shape). DELTA's are deliberately re-sourced.

#### Design token pipeline

- Brand palettes move from hand-maintained SCSS to YAML sources under `tokens/`, compiled by `scripts/build-tokens.cjs` into the theme CSS and Sass the library already consumed. The format borrows [W3C DTCG](https://tr.designtokens.org/)'s vocabulary -- `$value`, `$type`, `$description`, `{path}` aliases -- but is not conformant: six vendor keys sit outside `$extensions` and dimensions are bare numbers, so DTCG tooling cannot read these files without a conversion that does not exist yet.
- `tokens/mangrove.yaml` is a brand-neutral base; UNDRR becomes a sub-brand alongside PreventionWeb, IRP, MCR and DELTA rather than the base itself.
- The generator fails the build on an unknown or circular reference, a duplicate output name or a wrong token shape, so a malformed source cannot silently emit a stylesheet with missing colours.
- Build output is no longer committed. The generated token partials are produced by `yarn scss` and are now gitignored, as the compiled theme stylesheets already were. A Jest `globalSetup` writes any missing partial, so `yarn test` works on a fresh clone with no build step.
- **New: `tokens/output-baseline.json`.** A committed SHA-256 manifest of the generated bytes for all five themes. Because the partials themselves are gitignored, this is what makes an unintended change to compiled output fail `yarn test` instead of shipping unnoticed. Regenerate it deliberately, as part of the change that justifies it: `node scripts/build-tokens.cjs --baseline`. There is no `yarn` wrapper for the flag.

**Token authors: overrides inherit shape, and used not to.** In the generator's layered merge, a brand override that re-values a token without restating `$format` silently reverted it to a bare channel triple — invalid in a colour position, and discarded without a word. `$name`, `$type`, `$private` and `$sass` had the same failure: omitting `$name` wrote `--mg-<id>` instead of the property consumers actually read, making the override a no-op; omitting `$private` leaked a brand primitive into the public CSS. `scripts/build-tokens.cjs` now carries all five keys from the inherited layer when an override does not restate them. `$value`, `$alpha` and `$description` are deliberately not carried. This is the class of bug behind the `.mg-button-outline` breakage described below.

#### Build and packaging

- **`npm pack` at the repo root now produces a usable tarball.** A `files` allowlist and a companion `.npmignore` were added to `package.json`, plus a `prepack` script (`yarn scss`) that regenerates the token partials and compiled CSS before packing. Without the `.npmignore`, npm falls back to `.gitignore` — which excludes the generated `_tokens-*.scss` partials and the compiled `style*.css` — so a root-packed tarball contained SCSS entry points that could not compile, on a missing `@import`.
- **The publish workflow was never affected.** `.github/workflows/npm-publish.yml` does not pack from the repo root: it runs `yarn build`, assembles a separate `npm-package/` directory from `dist/` plus a filesystem walk for SCSS, and writes its own `package.json`. Released packages were always correct. This change fixes local and third-party `npm pack` only.

#### Corrected: DELTA's palette

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

#### Components and tokens

- New `StatusLabel` (`.mg-status-label`) with `--draft`, `--published`, `--waiting-validation` and `--waiting-information` variants.
- New `EmptyState` (`.mg-empty-state`) with `--compact`, `--panel` and `--start` variants.
- New data-visualisation palette, including `--mg-sendai-target-a` through `--mg-sendai-target-g` for the seven Sendai Framework targets.

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

**Resolved: the `Tab` exclusion is gone.** Earlier drafts recorded `Tab`'s `.mg-tabs__link:focus-visible` as the one rule that could not be migrated, on the strength of a contrast table showing no single colour clearing 3:1 in all five themes. Re-derived, that table was wrong in one row and measured only half the problem. In DELTA the interactive colour and the tab background are now the same value, so the inset ring was being drawn in the tab's own fill at **1.00:1** — literally invisible, on the tab that roving tabindex actually reaches. `Tab` now uses `mg-focus-ring-inset`, and the corrected measurements are recorded in `tab.scss`.

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

#### Breaking: three button tokens changed shape

`--mg-color-button-background`, `--mg-color-button-background--hover` and `--mg-border-color-button` moved from a bare RGB channel triple to a complete colour. Components consumed them as `rgb(var(--token))` and now consume them as `var(--token)`.

| Token                                 | Before (base) | After (base)                       |
| ------------------------------------- | ------------- | ---------------------------------- |
| `--mg-color-button-background`        | `0 79 145`    | `rgb(0 79 145)`                    |
| `--mg-color-button-background--hover` | `51 114 167`  | `rgb(51 114 167)`                  |
| `--mg-border-color-button`            | `255 255 255` | `rgb(var(--mg-color-text-button))` |

The first two are a **breaking change for consumers who override them**, and both are on Mangrove's legacy-override warn list precisely because consumers are known to. An override still written as channels is now an invalid declaration that the browser drops without an error; the symptom is a button that loses its fill. Wrap the channels in `rgb()`.

The third is a **fix**. `--mg-border-color-button` held channels but was consumed as `border: var(--mg-border-width-button) solid var(--mg-border-color-button)`. A triple there makes the whole `border` shorthand invalid, so `border-style` fell back to `none` and `.mg-button-outline` rendered as bare coloured text in every theme. Note that `$mg-border-color-button` is **not** in the legacy-override warn list, so a consumer who overrode this one with a triple gets no warning — worth adding.

This is not a blanket conversion. Sibling tokens are still channel triples where they are consumed as `rgb(var(…))`; only tokens used in a bare colour position, or needing to express `transparent`, were converted. A channel triple cannot say `transparent`, which is the case that forced the change: DELTA's buttons are filled and carry no border. A new test, `channel triplets are never used raw in a colour position`, now guards the whole class of mistake.

#### Deprecated: `--sendai-*` accent colours

`--sendai-red`, `--sendai-orange`, `--sendai-purple` and `--sendai-turquoise`, and the matching `.mg-u-background-color--sendai-*` and `.mg-u-color--sendai-*` utility classes, are deprecated. They are brand accent hues named by colour and carry no Sendai Framework meaning. Use `--mg-sendai-target-a` through `-g` for target semantics. They continue to work unchanged; SCSS consumers see a Sass `@warn` on compile. Scheduled for removal in 2.1.

#### Changed: Arabic text uses one family

Arabic headings were Noto Kufi Arabic and Arabic body text was Dubai. Both are now Dubai, so Arabic readers download one font instead of two.

```scss
// Before
$mg-font-family-arabic-headings: 'Noto Kufi Arabic', sans-serif;
$mg-font-family-arabic-body: 'Dubai', sans-serif;
// After
$mg-font-family-arabic-headings: 'Dubai', sans-serif;
$mg-font-family-arabic-body: 'Dubai', sans-serif;
```

Dubai reached Mangrove from OCHA, but that inheritance is weaker than it looks and is now out of date on both halves. Dubai was OCHA's _alternative subtheme_ pairing — body only, Regular only, never headings — not their base theme, which used Noto Kufi Arabic. On 2026-05-28 OCHA's brand guidance moved to Almarai for display and Noto Sans Arabic for body, with no published reason.

Two open points, stated plainly rather than glossed:

- **Do not read this as "Kufi is display-only".** Kufi is conventionally a display style and Dubai reads better at body size, but the UAE Federal Design System and OCHA's own base theme both set Noto Kufi for body. Dropping it is a judgement, not a correction.
- **The licensing question is unresolved.** The Dubai EULA requires the font be embedded so an end user cannot extract it, and forbids redistribution. Mangrove serves it as a plain woff2 from an open CDN, referenced by an Apache-2.0 library that points other organisations at that copy. This needs a legal read, not a design one. Tracked in [issue #1089](https://github.com/unisdr/undrr-mangrove/issues/1089).

Only Regular and Bold exist upstream — Light and Medium 404 on the CDN — so Arabic has a 400/700 binary where Latin has a full ladder. Nothing is faux-bolded: the `600` Mangrove uses resolves _up_ to the real Bold. The cost is a lost tier of emphasis, not a rendering defect.

#### Colour contrast methodology

- Token pairs are now graded with an [Oklab](https://www.w3.org/TR/css-color-4/#ok-lab)-based perceptual measure alongside WCAG 2's relative-luminance figure, calibrated so its thresholds align with the familiar 4.5:1 and 3:1 boundaries.
- Every foreground/background token pair is graded on both measures, covering every theme, hover and active states and the legacy `.mg-*` components, and fails if any pair passes perceptually while WCAG 2 fails it.
- Coverage is 90 component pairs. 11 of them grade the focus ring against surfaces it is actually painted on — the gallery letterbox, the mega-menu link tint, the form error summary, the snackbar, the hero banner — and 18 grade the data-visualisation palette. Neither the focus ring nor the dataviz palette was graded at all before alpha.3.
- Pairs that cannot yet meet the target are recorded as explicit exceptions — 65 against WCAG 2, 84 against the perceptual measure. Both counts rose during alpha.3 as coverage rose. Widening the net found failures that were always there; it did not introduce them. Most of them are the accent ramp, which is a brand decision, not a wiring one.
- APCA was evaluated and rejected on licensing grounds. Reasoning in `docs/COLOUR-CONTRAST-METHODOLOGY.md`.

### `2.0.0-alpha.2` — 2026-09-01

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-alpha.2) for the curated release summary.

[PR #1086](https://github.com/unisdr/undrr-mangrove/pull/1086) establishes the second 2.0 alpha baseline across Mangrove's component surfaces and interactions while preserving Drupal hydration contracts, theme ownership and existing BEM APIs except for the intentionally retired Pagination component.

#### Visual foundations and interaction

- Shared surface, border, shadow, radius, focus and reduced-motion tokens now provide a consistent foundation without forcing every component into the same shape.
- Buttons, form controls, cards, hero compositions, tabs, disclosures, menus, on-page navigation, tables, Pager, ScrollContainer and Text CTA receive coordinated responsive and interaction refinements.
- The opt-in editorial CTA adds a compact directional badge with stable hover geometry, logical RTL placement and safe wrapping for long translated labels. Conventional buttons remain the default for forms, consent and utility actions.
- Chips distinguish navigational links from dismiss actions and add logical RTL spacing, visible removal affordances, keyboard focus, reduced-motion and forced-colour support.
- Inline code now uses a compact theme-aware technical surface with clearer monospace typography and resilient wrapped-line decoration.

#### Components and compositions

- New `FormAction` composition joins a field and its key action for search, subscription and select-and-continue flows, with React and vanilla HTML examples, accessible help/error wiring, RTL support and optional mobile stacking.
- New standalone `UserFeedback` component distils the UNDRR microsites page-usefulness pattern for the common pre-footer position, with a package-root React export, direct hydratable component bundle, product-owned response handling, seven toolbar locales and accessible confirmation focus.
- Vertical, horizontal, book, icon and stats cards receive theme-aware presentation refinements. Vertical-card media now fills its frame consistently without changing the intentional sizing of book, horizontal or icon variants.
- The Storybook introduction and Component Laboratory demonstrate production component compositions, responsive collections, deterministic syndicated-search states, forms and data-rich examples. Landing-page showcase cards now link to relevant library guidance and stories.

#### Accessibility, internationalization and verification

- Logical properties, focus states, target sizing, reduced motion, forced colours, narrow layouts, RTL and long translations are covered across representative components and themes.
- Storybook's global locale toolbar is the canonical translation mechanism. Redundant per-language story groups are removed; dedicated RTL and long-label stories remain only where they exercise a distinct layout or interaction condition.
- Component guidance and changelogs, the Experience principles, contribution guidance and AI manifest examples are synchronized with the updated markup and public classes.

#### Build and packaging

- `FormAction` now ships as a direct `components/FormAction.js` ESM entry as well as SCSS and the package-root export.
- Production component bundles use isolated, uncached Babel output so Storybook's development `jsxDEV` transform cannot leak into published files. Manifest validation now rejects any production component bundle containing development JSX runtime calls.
- Compiled CSS banners now identify the exact Mangrove package version, synchronized from `package.json` before every Sass build.
- The Yarn lockfile is synchronized with the first-alpha dependency removals so immutable installs succeed from the release commit.

#### Removed: deprecated Pagination component

The deprecated `Pagination` component, its stories and documentation are removed. Use `Pager`, which is the supported 2.0 pagination pattern.

### Breaking: CSS custom properties replace SCSS variable theming API

Color and spacing tokens are now CSS custom properties on `:root`. The SCSS backward-compat aliases (`$mg-color-*`, `$mg-spacing-*`) are removed. All component stylesheets use `var(--mg-color-*)` and `var(--mg-spacing-*)` internally.

**Palette format:** colors use space-separated RGB channels (`--mg-color-blue-900: 0 79 145`) so alpha compositing is available without twin variables: `rgb(var(--mg-color-blue-900) / 0.5)`.

**Consumer migration:**

- Replace `$mg-color-*` and `$mg-spacing-*` SCSS variable references with the equivalent CSS custom property: `$mg-color-interactive` becomes `var(--mg-color-interactive)`, etc.
- Anywhere you used `rgba($mg-color-X, 0.N)`, use `rgb(var(--mg-color-X) / 0.N)` instead.
- SCSS variables that remain (BUILD-TIME ONLY — `@media` queries, font sizes, font families, `$mg-html-font-size`, `$mg-tabs-border-bottom`): no change required.

### Breaking: sub-brand theming moves from SCSS `!default` to CSS custom property selector blocks

The `_variables-irp.scss`, `_variables-preventionweb.scss`, `_variables-delta.scss`, and `_variables-mcr.scss` files are deleted. Each is replaced by a `_theme-{name}.scss` file containing a `.mg-theme-{name} { }` selector block that overrides CSS custom properties at runtime.

**Consumer migration:**

- Replace `@import "./variables-{name}"` with `@import "./theme-{name}"` in custom entry-point SCSS files.
- Apply the `.mg-theme-{name}` class to `<body>` or a wrapping element at runtime instead of relying on SCSS compile-time overrides.
- SCSS `$mg-color-* !default` overrides in downstream stylesheets no longer take effect for color/spacing tokens; move those overrides to CSS custom properties inside `.mg-theme-{name} { }`.

### Breaking: `hero.scss` variant colour map

The `$variant-colour-props` map in `hero.scss` now stores CSS custom property name strings (`"--mg-color-orange-800"`) rather than resolved SCSS color values. Consumers that previously overrode `$mg-color-hero--secondary !default` must switch to overriding the relevant `--mg-color-*` custom property on `:root`.

### Removed: `storybook-design-token` plugin

The `storybook-design-token` npm package is removed. The Design decisions/Colors, Spacing, Widths, Breakpoints, and Typography Storybook pages now render token values directly from `getComputedStyle` (for CSS custom properties) or as static tables (for build-time SCSS tokens). (#1061)

### Removed: legacy 10px root

The `style-legacy.scss`, `style-preventionweb-legacy.scss`, `style-irp-legacy.scss`, and `style-mcr-legacy.scss` entry points (and their compiled `*-legacy.css` builds) are removed, and `$mg-html-font-size` is fixed at `16` (the `!default` override is gone). Mangrove 2.0 assumes a browser-standard 16px document root. Consumers on the old 10px root must move to a 16px root and convert their own rem-based CSS from a 10px to a 16px basis. See [`docs/RELEASE-2.0.md`](docs/RELEASE-2.0.md) breaking change #5. (#1061)

## 1.8.2 — 2026-08-27

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v1.8.2) for full details.

### Features

- **Grid layout extended to 12 columns with an auto-fit fallback.** Numbered column classes now cover `col-7`–`col-12`, and a new `.mg-grid--auto-fit` modifier lays any larger item count out in a single row. Fixes StatsCard collapsing to a stacked single column past 6 stats. ([#1081](https://github.com/unisdr/undrr-mangrove/pull/1081))

### Bug fixes

- **Card z-index no longer conflicts with the mega menu.** Cards no longer overlap the open mega-menu overlay. ([#1075](https://github.com/unisdr/undrr-mangrove/pull/1075))
- **Syndication search strips hidden teaser fields.** Hidden teaser fields are now removed programmatically from the React search output. ([#1077](https://github.com/unisdr/undrr-mangrove/pull/1077))

### Build & tooling

- Major toolchain upgrades: Babel 8, `sass-loader` 17, and `jest-axe` 11. ([#1083](https://github.com/unisdr/undrr-mangrove/pull/1083))
- Storybook to 10.5.10, React to 19.2.8, PostCSS to 8.5.26, and a roundup of patch and minor dependency updates. ([#1078](https://github.com/unisdr/undrr-mangrove/pull/1078), [#1082](https://github.com/unisdr/undrr-mangrove/pull/1082), [#1071](https://github.com/unisdr/undrr-mangrove/pull/1071))

## 1.8.1 — 2026-07-06

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v1.8.1) for full details.

### Bug fixes

- **Syndication search organization routing.** Organization results now always resolve to PreventionWeb instead of whichever domain appears first in `field_domain_access`, fixing incorrect organization links in multi-domain index data. ([#1066](https://github.com/unisdr/undrr-mangrove/pull/1066))

### Security

- **DOMPurify patched to 3.4.11.** Security dependency update merged as part of patch release maintenance. ([#1051](https://github.com/unisdr/undrr-mangrove/pull/1051))

### Build & tooling

- Dependency maintenance updates: `chromaui/action` v17, `actions/checkout` v7, `serialize-javascript` v7.0.6, `babel-plugin-polyfill-corejs3` v1, Yarn v4.17.0, `autoprefixer` v10.5.2, and `postcss` v8.5.16. ([#1042](https://github.com/unisdr/undrr-mangrove/pull/1042), [#1059](https://github.com/unisdr/undrr-mangrove/pull/1059), [#1062](https://github.com/unisdr/undrr-mangrove/pull/1062), [#1063](https://github.com/unisdr/undrr-mangrove/pull/1063), [#1065](https://github.com/unisdr/undrr-mangrove/pull/1065), [#1067](https://github.com/unisdr/undrr-mangrove/pull/1067), [#1068](https://github.com/unisdr/undrr-mangrove/pull/1068), [#1069](https://github.com/unisdr/undrr-mangrove/pull/1069))

### Documentation

- Added Drupal hydration wrapper integration guidance to `README.md` and expanded release-writing guidance in `docs/RELEASES.md` (curated, themed GitHub Release notes format). ([#1016](https://github.com/unisdr/undrr-mangrove/pull/1016))

## 1.8.0 — 2026-06-19

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v1.8.0) for full details.

### Security

- **Dependency update cooldown.** Renovate now waits until a release is at least 7 days old before it proposes the update (`minimumReleaseAge: "7 days"` with `internalChecksFilter: "strict"`), so a compromised package version that gets detected and unpublished within its first days never reaches a pull request here. Security advisories (`vulnerabilityAlerts`) are exempt, so genuine fixes are not delayed. Dependabot is retired and Renovate is now the sole dependency bot, which also ends the duplicate update PRs. A separate spike tracks evaluating pnpm for its scripts-off-by-default behaviour (#1038). (#1039)

### Removed

- **D3 chart components, `MapComponent`, and `Fetcher` removed.** The npm exports `BarChart`, `MapComponent`, and `Fetcher` are no longer published. The internal-only Storybook stories `Histogram`, `IndexChart`, and `ConnectedScatterplot` are also removed. D3 and Leaflet packages are dropped from the dependency tree. Migrate charting to [Recharts](https://recharts.org/), mapping to [MAPX](https://mapx.org/), and data loading to [react-query](https://tanstack.com/query) / [SWR](https://swr.vercel.app/) or server-side load. ([#1011](https://github.com/unisdr/undrr-mangrove/issues/1011))

## 1.7.0 — 2026-05-11

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v1.7.0) for full details.

### Runtime

- **Node.js 22 is now the declared minimum** (Node 20 reached EOL on 2026-04-30). `engines.node` set to `>=22.0.0`. CI and Docker continue to run Node 24. `.nvmrc` added so `nvm use` picks the CI-pinned version. (#1003)

### Build & tooling

- TypeScript 5 → 6, ESLint 9 → 10 majors (#977).
- React 19.2.5 → 19.2.6 (#991).
- Yarn 4.14.1 (#952).
- Batch dep updates: `jest` 30.4.x monorepo (#997), `typescript-eslint` 8.59.2 (#993), `@babel/preset-env` 7.29.5 (#961), `stylelint` ~17.11.0 (#937), `globals` 17.6.0 (#964), `sass-loader` 16.0.8 (#990), plus batched minor/patch (#960, #984).

### Security

- Patched 17 Dependabot security alerts via yarn resolutions (#978).
- Patched `brace-expansion` ReDoS via resolution (#979).

### Code quality

- New `react-doctor` component-quality linter codified as a project convention. Health score moved 57 → 68 across the sweep, with 66 of the original 398 findings cleared. (#985, #987, #988, #989, #996.)
- House conventions for component authors documented in `docs/AI-CODING-AGENTS.md`: no em-dashes or three-period ellipses in JSX text; prefer `use()` over `useContext()` on React 19+; hoist default `[]` / `{}` props to module-level constants; no inline render helpers (extract as named subcomponents); lazy `useState` init; effect cleanup discipline; per-call-site triage for `dangerouslySetInnerHTML` (inline DOMPurify vs documented caller contract). (#992)
- React Doctor health badge added to `README.md` and the Storybook _Introduction_ page. The badge is a manually-refreshed periodic snapshot — see `docs/AI-CODING-AGENTS.md#refreshing-the-score-badge`. (#992, #996.)
- **Consumer-visible API note:** `Component.defaultProps` has been removed from `FooterIcons`, `FooterConditions`, `FooterConditions2`, `FooterLists`, `Link`, and `ScrollContainer`. React 19 deprecates `defaultProps` on function components; the defaults are now declared via destructured parameters, so component behaviour is unchanged. Only consumers that read `Component.defaultProps` for introspection (rare) need to adjust. (#985, #988)
- `useContext(SearchContext)` swapped to React 19's `use(SearchContext)` in `SyndicationSearchWidget` (#988). Internal change; identical behaviour at top-level call sites.

### Documentation

- `docs/AI-CODING-AGENTS.md` extended with the _Component quality checks with react-doctor_ section (above), linked from `CONTRIBUTING.md`, `docs/DEVELOPMENT.md`, and `docs/REVIEW-CHECKLIST.md`. (#992)
- Tracking issue [#986](https://github.com/unisdr/undrr-mangrove/issues/986) documents the remaining `react-doctor` work, organised into risk buckets for future sweeps.
