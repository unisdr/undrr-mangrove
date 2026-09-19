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

## The hero scrim

Everything above measures token pairs. A hero does not have one. It composites a
gradient over an editorial photograph the component never sees, so what the copy
is actually read against is decided by whoever uploaded the image. No entry in
the register can express that, which is why the hero was green in the register
and failing on screen.

### What was measured, and how

`Hero` was rendered in all five themes with a real photograph, screenshotted a
second time with the copy set to `transparent`, and every painted pixel behind
each line box of the label, title and summary sampled. The worst pixel behind
each block is the one the criterion applies to. Do this, not a token
calculation, whenever a change touches a hero gradient.

The result, for body copy over a bright sky (unisdr/undrr-mangrove#1256):

| Theme | Before | After |
|---|---|---|
| IRP | 3.91 fail | 5.14 pass |
| PreventionWeb | 5.07 | 6.47 |
| UNDRR | 6.33 | 7.83 |
| DELTA | 6.32 | 7.82 |
| MCR2030 | 8.87 | 10.35 |

**Read the "before" column as a property of that photograph, not of those
themes.** One image is not a test set, and a fixed-opacity veil fails on the
image, not on the brand. Re-measured against a synthetic near-white background
(`248 249 250` — a high-key sky, a sand or snow scene, a white studio wall), the
worst line box behind body copy before the scrim was IRP 2.51, PreventionWeb
2.91, UNDRR 3.34, MCR2030 4.06, DELTA 4.33: **all five themes fail**, IRP merely
fails first and on ordinary photographs. The "four themes that already passed"
is true of the photograph that was sampled and of nothing else, and anyone
scoping a future fix to IRP on the strength of that row will be scoping it
wrong.

The point of the scrim is that the "after" column is not photograph-dependent in
the same way. At the copy's trailing edge the tint is at exactly its middle
opacity and the scrim at exactly 0.16 whatever the viewport, so the floor can be
solved rather than sampled: over a **pure white** background the worst
attainable ratio is IRP 4.71, PreventionWeb 5.82, UNDRR and DELTA 6.96,
MCR2030 9.05. That is the guarantee — no photograph can do worse.

It also sets the scrim's value. Solving the same equation the other way, the
minimum scrim that holds 4.5:1 over pure white is **0.137 for IRP**, 0.015 for
PreventionWeb and 0 for the other three. `0.16` is that floor plus 0.023 of
headroom; it is the lightest scrim that works, not a round number, and there is
no room to reduce it for the photograph's sake without giving up the guarantee
on IRP.

### What the band depends on

The band holds at full strength from the veil's leading edge to
`--mg-hero-copy-inline-end` and clears beyond it. Two things have to stay true
for that to keep meaning "across the copy", and both are now enforced rather
than assumed:

- **The copy must stay inside the copy column.** `.mg-hero__title` and
  `.mg-hero__label` are `display: inline-block`, and `overflow-wrap: break-word`
  does not reduce a box's min-content size — so a single unbreakable word sized
  the title past the overlay. A 48-character German compound put 259px of glyphs
  outside the band at both 1440px and 1920px, 99px of it past the scrim's fade
  and over the bare photograph. `max-width: 100%` plus `min-width: 0` on the
  grid chain cap the box so the inherited `break-word` applies.
- **The band must not be wider than the element.**
  `--mg-hero-copy-inline-start` is viewport-derived (`50vw - container/2`), which
  is only the same thing as an element offset in the full-bleed case.
  `--mg-hero--contained` sets `padding-inline: 0` and takes its parent's width,
  so it zeroes the property too, and `--mg-hero-copy-inline-end` is wrapped in
  `min(100%, …)`. Without both, a contained hero at a wide viewport kept a
  240px offset the copy no longer had, and any contained hero narrower than the
  band lost its photograph entirely — the tint's middle stop sat past 100%, so
  the tint never reached `--mg-hero-gradient-end`.

### Why the tint could not fix it

The obvious repair is to turn the brand tint up until the photograph stops
showing through. It does not work, and the reason is worth stating because it
will be proposed again.

IRP's hero surface measures **4.71 against white at full opacity**. That is the
flat-fill figure the register already records, and it passes — by 0.21. So the
colour has no headroom to spend: any translucency at all, over any photograph
brighter than the tint, spends more than 0.21 and the copy fails. Turning the
tint to fully opaque would buy exactly 4.71, still with no margin, at the cost
of the photograph the hero exists to show. Repointing `--mg-color-hero` at
IRP's deeper blue (`13 103 163`, 6.02 flat) was also measured and still lands
at 4.46 under the same gradient.

The guarantee therefore cannot come from a brand colour. It has to come from a
neutral darkening layer over the whole composite, whose effect does not depend
on which blue, teal or purple the theme happens to use.

### What the veil does now

`hero.scss` paints two layers in one pseudo-element, via the `mg-hero-veil`
mixin:

1. the brand tint, as before; and
2. a **scrim** above it — `--mg-hero-scrim-color` (neutral-900) at
   `--mg-hero-scrim-opacity` (0.16).

Both layers hold at full strength across the copy and then clear over
`--mg-hero-scrim-fade`. "Across the copy" is not a guessed percentage: both read
`--mg-hero-copy-inline-end`, which is derived from the same
`--mg-hero-copy-inline-start` the hero's padding uses and from
`--mg-hero-overlay-max-width`. Change where the copy sits, or how wide it is,
and the protected band follows. The tint's old fixed 48% midpoint happened to
land near the copy's trailing edge at 1440px and nowhere else; at 910px the copy
ran two thirds of the way across the frame, into tint that had already fallen to
about 0.56.

Brand cost, and it is a real one: the copy band in every theme is about 16%
deeper than before. On IRP that lands the tinted band almost exactly on the
brand's own `13 103 163`. The photograph beyond the copy is untouched, and in
practice is slightly clearer than before because the fade now starts at the
copy's edge rather than at a fixed 48%.

### Still open: the vertical veil below 900px

Below the tablet breakpoint the veil runs bottom-to-top and the copy fills the
frame, so the label sits at the top where the tint is down to its end opacity of
0.08. **All five themes fail there**, between 2.4 and 3.1 against a bright sky,
and they failed before this work too (1.7 to 2.8). The scrim improves every
theme but does not rescue any of them: no scrim light enough to leave the
photograph visible can make up a tint that has effectively cleared.

Note what that costs. Below 900px the scrim is held flat across the whole
height — there is nowhere it could clear without clearing over copy — so on
mobile the photograph *is* 16% deeper everywhere, and it buys an improvement
that still does not reach AA. That is a deliberate trade and not a free one:
keep it because a 1.7:1 failure moved to 2.4:1 is worth something to a real
reader, but do not read "the photograph beyond the copy is untouched" as
applying below the tablet breakpoint. It does not.

This is not a tuning problem. The layout puts copy over the whole frame, so
either the photograph is veiled across the whole frame or some of the copy is
unreadable; there is no third option, and picking between them is a design
decision across five brands. The options, costed:

- **Hold the tint across the full height** (vertical midpoint to 100%). Cheapest
  to implement, strongest guarantee, and the mobile hero becomes a tinted panel
  with the photograph barely legible.
- **Raise the scrim on mobile only**, to roughly 0.44. Keeps the brand tint's
  shape and keeps the photograph readable as an image, at the cost of a visibly
  darker mobile hero in every theme.
- **Move the copy off the top of the frame** so the veil's strong end is under
  it. A layout change rather than a colour one, and the only option that costs
  the photograph nothing.

## How colour-vision separation is measured

Contrast and colour-vision separation are different questions. The measure above
asks whether a pair is legible; this one asks whether two colours in the same set
are still *different colours* to a reader with a colour vision deficiency. It is
what produces the ΔE tables in `stories/assets/scss/_tokens-data-viz.scss` and in
the status label's "Shape as well as colour". There is no script in the repo, so
the procedure is written down here. Follow it exactly — the steps are not
interchangeable, and two of them change the answer by an order of magnitude.

1. **Decode sRGB to linear RGB** with the piecewise transfer function
   (`c/12.92` below 0.04045, else `((c+0.055)/1.055)^2.4`).
2. **Apply the dichromat projection in linear RGB.** This is the step that
   matters most. Run against gamma-encoded sRGB it puts the status label's
   Degraded/Offline pair 36 CIE76 apart and hides the collision completely; in
   linear RGB the same pair is 1.7. The Viénot, Brettel and Mollon (1999)
   projections used here are the libDaltonLens linear-RGB matrices:

   Each row is one row of the 3x3 matrix: the coefficients that produce one
   output channel from the linear R, G and B inputs. Read it row-major —
   transposing it gives 3.67 at a different pair.

   | Simulation | Output | R | G | B |
   | --- | --- | --- | --- | --- |
   | Protanopia | R' | `0.11238` | `0.88762` | `0.00000` |
   | Protanopia | G' | `0.11238` | `0.88762` | `0.00000` |
   | Protanopia | B' | `0.00401` | `-0.00401` | `1.00000` |
   | Deuteranopia | R' | `0.29275` | `0.70725` | `0.00000` |
   | Deuteranopia | G' | `0.29275` | `0.70725` | `0.00000` |
   | Deuteranopia | B' | `-0.02234` | `0.02234` | `1.00000` |

   R' and G' are identical by construction: a dichromat's two remaining cone
   classes collapse the red-green axis onto one value.
3. **Re-encode to 8-bit sRGB and decode again.** The simulated colour is a colour
   someone actually sees on a screen, so it is quantised like one. Clamp each
   linear channel into `[0, 1]`, apply the inverse transfer function (`12.92c`
   below 0.0031308, else `1.055 * c^(1/2.4) - 0.055`), round to the nearest of
   the 256 levels, and decode again. The rounding rule is part of the step:
   truncating instead of rounding to nearest gives 3.08 at N=7. Skipping the
   round trip altogether gives 3.11 — enough to turn a published 3.2 into a 3.1
   and start an argument. The shift is not a constant: it runs from 0.03 to 0.14
   across the six published figures, and N=5 is the one that survives it
   unchanged at one decimal place.
4. **Convert to CIE Lab** through sRGB → XYZ (D65, white point
   `0.95047, 1.00000, 1.08883`), clamping each linear channel into `[0, 1]`
   first. A projection can land slightly outside the gamut, and an unclamped
   negative channel is not a colour anyone sees. The matrix is the sRGB D65 one,
   again row-major:

   | Output | R | G | B |
   | --- | --- | --- | --- |
   | X | `0.4124564` | `0.3575761` | `0.1804375` |
   | Y | `0.2126729` | `0.7151522` | `0.0721750` |
   | Z | `0.0193339` | `0.1191920` | `0.9503041` |

   Then the standard Lab transfer on each channel divided by its white point
   component, with `f(t) = t^(1/3)` above `(6/29)^3` and `t / (3 * (6/29)^2) +
   4/29` below it.
5. **Compute CIEDE2000** with `kL = kC = kH = 1`. Quote CIE76 beside it if the
   palette sits in the yellow-green region, where CIE76 overstates separation.
6. **Take the worst pair**, as the minimum over every pair *and* over both
   dichromat types. Record which pair it was, not only the number — a later slot
   change needs to know which two colours to re-check.

**Read the result against ~2.3 dE2000**, the just-noticeable difference. That
threshold is a dE2000 figure and only ever means anything next to a dE2000
figure; never compare it to a CIE76 number.

Two caveats. Quote a second model where the finding is load-bearing: Viénot 1999
and Machado et al. (2009) agree closely on protanopia and deuteranopia, but
disagree on tritanopia, where Viénot's linear S-cone approximation is the weaker
of the two and its tritan column should not be read alone. And a full-severity
simulation is the worst case, not the typical one; most people with a colour
vision deficiency are anomalous trichromats rather than dichromats.

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
copy — only large text. There is no pairing worth recommending, so the rule is
to keep copy off the surface entirely.

This is now true of the library as well as of the guidance. Every surface that
used to contradict it was changed in
[#1196](https://github.com/unisdr/undrr-mangrove/issues/1196) and
[#1243](https://github.com/unisdr/undrr-mangrove/issues/1243); see
[where the orange lives now](#where-the-orange-lives-now).

### An orange rule is decoration, not identification

The same numbers that keep copy off the orange also keep the orange from
carrying a boundary on its own:

| Pair | WCAG 2 | Oklab | Against the 3:1 of SC 1.4.11 |
| --- | --- | --- | --- |
| `#eb752a` on white | 2.95 | 46.7 | fails |
| `#eb752a` on `#fdf1ea` (`orange-50`) | 2.66 | 40.0 | fails |
| `#ed833f` on white | 2.65 | 42.5 | fails |

So an orange border, underline or marker is emphasis and never the only thing
that identifies a component or tells one of its states from another. Something
that does clear the threshold — the fill, the label, the weight, the position —
has to carry that. Where the library now uses an orange rule it is always
alongside a fill and a label that do.

The pale end of the same ramp is the text-bearing end, and that is where the
copy went: `--mg-color-text` on `orange-50` is 15.7 and 88.8, on `orange-100`
14.1 and 83.8.

### Why the surface did not move instead

Darkening the accent until white passes does work, arithmetically. White clears
both measures at roughly `#b2571d` — 4.91 and 64.1 — with a hover step near
`#914516` at 6.85 and 72.9. It was prototyped and measured beside the route that
shipped, and rejected on two counts.

The first is drift. `#b2571d` is 14.4 dE2000 from Sendai orange and 16.7 from
`orange-800`, against a just-noticeable difference of about 2.3. It moves the
hue from CIE L\* 62.1 to 47.5 (Oklab lightness 69 to 56) and drops chroma with
it. At six times the JND it is not a tuned Sendai orange, it is a rust, and it
would have repainted every accent tag and every secondary surface on every site
on upgrade.

The second is that it does not finish the job. `.mg-cta__text` is 90% white, so
it composites on whatever it sits on: on `#b2571d` that lands at 4.29, still
under 4.5. Darkening the brand colour would still have left the CTA body failing
unless the opacity changed too — which is the tell that the problem was the
pairing rather than the particular orange.

Moving the surface stayed available as a brand decision with a brand owner
behind it. The decision taken was the other one: keep Sendai orange exactly as
it is, and stop putting text on it.

## Where the orange lives now

Seven surfaces used to contradict the rule above. Six were components that chose
an orange background or an orange ink; the seventh was a theme re-pointing a
role, which is why the fix is in the token layer and not in six stylesheets.
None of them moved the colour. Each moved the copy.

| Surface | Was | Is |
| --- | --- | --- |
| `Tag` `--accent` | white label on `tag-accent`, 2.95 (2.65 hover) | `--mg-color-text` on `orange-50`, 15.70 / 88.8 (`orange-100` on hover, 14.12 / 83.8); the orange is the chip's border |
| `TextCta` `--secondary` | white eyebrow and headline, 90% white body, on `hero--secondary`, 2.65 and 2.42 | the `--soft` surface — white under an 8% wash of the accent — with `neutral-900` and `neutral-800` copy, about 20:1 and 17:1; the orange is the leading rule |
| `Hero` `--secondary` | white copy on `orange-800`, 2.65; CTA label `orange-800` on the white pill, 2.65 | the theme's own hero surface and the default CTA ink, both already AA in all five themes; the orange is the leading rule |
| `HubHeader` `--surface-secondary` | white bar and banner text on `hero--secondary`, 2.65 | the theme's own hero surface; the orange is the rule under the bar |
| `Card` `--secondary` | title `secondary` as ink, 2.65 (2.37 on DELTA) | the interactive colour, like every other card title link; the orange is the leading rule |
| `AuthorImage` `--secondary` | title `secondary` as ink on white, 2.65 | `--mg-color-text` on white, 17.40 / 93.9; the ring and the hover tint keep the orange, which no copy sits on |
| `.mg-button-primary:hover`, PreventionWeb and IRP | white label on `orange-900`, 2.95 | PreventionWeb's `teal-800` (5.50 / 69.7) and IRP's `blue-800` (6.02 / 71.1), the primitives their secondary buttons already use |

The same applies to `.mg-button-primary.mg-button-outline:hover`, which shares
the token and moved with it.

The values are identical in all five themes, because no sub-brand overrides
`color.secondary`, `color.tag-accent` or `color.hero--secondary` — that is why
this was one decision and not five. Only PreventionWeb and IRP had re-pointed
the button hover, and only their two token files changed value.

`--mg-color-hero--secondary` did not change value. What changed is its role: its
three consumers now read it as the accent rule on a surface that carries the
copy, rather than as the surface itself. Its tertiary and quaternary siblings
are still surfaces, so treat this one as the exception in that group.

### The register

The machine-readable register lives in
`stories/assets/scss/__tests__/tokens-contract.test.js` (`COMPONENT_PAIRS`, with
`WCAG_EXCEPTIONS` and `PERCEPTUAL_EXCEPTIONS`). Every pair above is asserted
there against both measures in all five themes, so none of them can regress
quietly, and the exception entries that used to record them as known failures
are gone — the assertion is now that they pass.

The decorative rules are recorded there too, and they do not pass 3:1. They are
listed with their measured values and the reason, because a rule that is
emphasis rather than identification is a judgement, and a judgement belongs in
writing where someone can disagree with it.

### What consumers should do

- **If you overrode `--mg-color-tag-accent`, `--mg-color-tag-accent--hover`,
  `--mg-color-secondary` or `--mg-color-hero--secondary` in your theme layer to
  clear AA**, you can drop the override. The library no longer puts text on
  those tokens, so a darkened value now only darkens borders and rules — and on
  `Tag` `--accent` it would darken the border against a pale fill rather than
  the fill itself, which is probably not what the override was for.
- **If you paint your own surface with one of those tokens**, it still carries
  no text. That has not changed and will not.
- **An orange rule is not an indicator.** Do not use one as the only mark of a
  selected tab, an active item, an error or a required field.
- **Check the pair, not the value, when you re-point a role.** #1243 was correct
  markup and documented tokens landing on 2.95 because a theme aimed a hover at
  the accent. Nothing in a component review would have found it.
