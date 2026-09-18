# How Mangrove measures colour contrast

Mangrove grades every colour pair twice: **WCAG 2**, for continuity with every
other tool in the ecosystem, and a **perceptual lightness measure on Oklab**,
because WCAG 2 is not a reliable model of what people can read.

## Why not WCAG 2 alone

WCAG 2 compares *relative luminance*, which is not perceptually uniform, so one
ratio can describe two pairs that are visibly different to read. It is weakest
where design systems spend their time: mid-tones, warm hues, light-on-dark.

A label on Mangrove's orange accent, `#eb752a`:

| Label | WCAG 2 | Oklab | APCA |
| --- | --- | --- | --- |
| white | 2.95 | 46.7 | Lc 60.8 |
| **black** | **7.11** | **57.4** | **Lc 48.6** |

WCAG 2 rates black-on-orange a comfortable pass; this measure puts it under the
63 body-text threshold. So "flip the label to dark text" satisfies WCAG 2 and
still leaves text hard to read at body size. Note the limit on display too: this
measure is polarity-insensitive, so it ranks black above white, while APCA,
which models polarity, prefers white. The disagreement is the useful output; the
ranking is not.

## Why not APCA

APCA is the best-known perceptual algorithm. We do not use it, for four reasons:

- It is **patent-pending**, and its licence restricts the main repository to
  "Registered Beta Testers OR Personal use only ... unless authorized in
  writing".
- The npm package `apca-w3` is licensed to the W3C "for use with WCAG
  accessibility guidelines ... and not for any other use"; outside that, AGPL
  v3. Its only dependency is AGPL v3.
- **"APCA" is a trademark**, usable only for implementations deemed correct and
  current.
- It is **not the WCAG 3 direction**, contrary to common belief. It was removed
  from WCAG 3 in early 2023, and the April 2026 Editor's Draft still says "the
  contrast algorithm used in WCAG 3 is yet to be determined".

Canonical hit the same wall building Ubuntu's palette and shipped a
WCAG-anchored approach instead, declining to claim APCA compliance for licence
reasons.
<https://canonical.design/blog/generating-color-palettes-for-design-systems-inspired-by-apca>

## Why Oklab

Oklab is defined in **CSS Color Level 4**, a W3C specification in the **public
domain**, and `oklab()`/`oklch()` have been Baseline Widely available since May
2023 — so the maths that grades our colours is the maths the browser uses to
render them. No licence, patent, trademark or attribution requirement.

## The measure

Contrast is the difference in Oklab lightness, put through a power curve —
`|L₂^φ − L₁^φ|^(1/φ)` — and shifted onto a roughly 0-100 scale
(`scripts/lib/perceptual-contrast.cjs`). It is **a local invention, not a
published measure**: the curve has no standard form behind it, its scale and
offset are only what the two anchors below solve to (1.408 and 39.61, shipped
rounded to √2 and 40), and a `NORM` term moves the result by 0.035%. Only the
calibration is load-bearing.

Thresholds are **calibrated, not asserted** — anchored to the two boundaries the
field already agrees on:

| Anchor | WCAG 2 | Oklab | Threshold |
| --- | --- | --- | --- |
| `#767676` on white | exactly 4.5:1, body text | 63.3 | `BODY_TEXT` 63 |
| `#949494` on white | exactly 3.0:1, non-text | 50.0 | `NON_TEXT` 50 |

A pair WCAG 2 puts precisely on a boundary lands on the same boundary here, so
the two diverge only where WCAG 2 is unreliable. Adopting this does not silently
re-baseline decisions already taken. Both anchors are grey on white, so nothing
calibrates the measure on dark backgrounds; treat those scores as indicative.

## Limitations

- **Polarity-insensitive**, so dark-on-light and light-on-dark score the same,
  and nothing calibrates it on dark surfaces. APCA models polarity; we do not.
- **Not size or weight aware** beyond the coarse large-text threshold.
- **Assumes sRGB** and an ordinary viewing environment.
- It is a model. Where a decision is marginal, the answer is a person reading
  the screen, not a number.

## How it is applied

- Both measures run over the resolved token chain per theme, so a value is
  graded as it renders, not as it is written.
- Known failures are individually listed with their measured value and reason,
  so they read as a to-do rather than a waiver.
- Disabled and inactive components are exempt, as WCAG 2 exempts them.
- Where the two measures disagree, that pair is worth a human look. That is the
  signal this approach exists to produce.


## The orange accent carries no text

Sendai orange is a non-text accent. Use `orange-900` (`#eb752a`), `orange-800`
(`#ed833f`) and the tokens that resolve to them — `secondary`, `tag-accent`,
`tag-accent--hover`, `hero--secondary` — for borders, rules, icon fills and
blocks with no copy over them. Do not set text on those surfaces, and do not use
the orange as ink on white.

The rule names the surface rather than the text colour, because no text colour
rescues it.

| Pair | WCAG 2 | Oklab | Verdict |
| --- | --- | --- | --- |
| `#ffffff` on `#eb752a` (`orange-900`) | 2.95 | 46.7 | fails both measures at any size |
| `#ffffff` on `#ed833f` (`orange-800`) | 2.65 | 42.5 | fails both measures at any size |
| `#fdf3ec` on `#ed833f` (90% white body copy) | 2.43 | 36.5 | fails both measures |
| `#000000` on `#eb752a` | 7.11 | 57.4 | passes WCAG 2; under the 63 body floor |
| `#000000` on `#ed833f` | 7.92 | 61.1 | passes WCAG 2; under the 63 body floor |

The perceptual floors are 63 for body text and 50 for large text; run any pair
yourself with `scripts/lib/perceptual-contrast.cjs`. White fails at every size.
Pure black is the strongest ink the hue admits and still does not carry body
copy — only large text. There is no pairing worth recommending, so the guidance
is to keep copy off the surface entirely.

Moving the surface would work: white clears both measures at roughly `#b2571d`,
Oklab lightness 56 against Sendai orange's 69. That is a rust rather than Sendai
orange, and it repaints every accent tag and every secondary surface on every
site at once — a brand decision with a brand owner behind it, not a library one.

## Recorded exceptions: components that still put text on the orange

Removing these combinations is tracked in
[#1196](https://github.com/unisdr/undrr-mangrove/issues/1196), deferred past 2.0
because it is a brand decision. Until it is taken, the rule above and the
components below disagree, and both are written down rather than one of them
quietly winning.

| Component | Where | Pair | WCAG 2 | Oklab |
| --- | --- | --- | --- | --- |
| `Tag` `--accent` | label | `#fff` on `tag-accent` → `orange-900` | 2.95 | 46.7 |
| `Tag` `--accent` | label, hover | `#fff` on `tag-accent--hover` → `orange-800` | 2.65 | 42.5 |
| `TextCta` `--secondary` | eyebrow and headline | `#fff` on `hero--secondary` → `orange-800` | 2.65 | 42.5 |
| `TextCta` `--secondary` | body | `#fff` at 90% on `hero--secondary` | 2.42 | 36.4 |
| `Hero` `--secondary` | body, used by the split-balanced story | `#fff` on `orange-800` | 2.65 | 42.5 |
| `Hero` `--secondary` | CTA label on the white pill | `orange-800` on white | 2.65 | 42.5 |
| `HubHeader` `--surface-secondary` | banner and bar text | `#fff` on `hero--secondary` | 2.65 | 42.5 |
| `Card` `--secondary` | title | `secondary` → `orange-800` on the card | 2.65 | 42.5 |
| `AuthorImage` `--secondary` | title | `secondary` as ink on white | 2.65 | 42.5 |

The values are identical in all five themes: no sub-brand overrides
`color.secondary`, `color.tag-accent` or `color.hero--secondary`. Everything
else in those components passes.

The machine-readable register lives in
`stories/assets/scss/__tests__/tokens-contract.test.js` (`WCAG_EXCEPTIONS` and
`PERCEPTUAL_EXCEPTIONS`), where every entry carries its measured value and the
assertion still bites: a listed pair must STILL fail, and must not get worse.

### What consumers should do meanwhile

- Do not put essential information in an accent tag or a secondary CTA and
  nowhere else; the surrounding markup must carry it too.
- Prefer `Tag`'s default, secondary or outline variants for anything a reader
  has to act on. `--accent` is decorative emphasis.
- Do not add new text to an orange surface, and do not copy the pairing from
  these components into a new one.
- If your site must clear AA today, override `--mg-color-tag-accent`,
  `--mg-color-tag-accent--hover`, `--mg-color-secondary` and
  `--mg-color-hero--secondary` in your theme layer. `#b2571d` and `#914516`
  clear both measures.
