# React Aria integration: architecture notes and decision record

Working notes from the PR #1080 spike and the reconciliation work that followed.
The surface these notes describe originated in a proposed `2.0.0-alpha.4` and
is being updated for a post-2.0 release in
[PR #1088](https://github.com/unisdr/undrr-mangrove/pull/1088). Its original
foundation, PR #1087, has already merged.
This is a thinking document, not a specification. It records what was decided,
what was measured, what turned out to be wrong, and what is still open, so that
whoever picks this up can see the reasoning rather than just the diff.

Status: in progress. Nothing here is a commitment.

The first narrow Mangrove 2 reconciliation slice is documented in
[ARIA-V2-RECONCILIATION.md](ARIA-V2-RECONCILIATION.md). It adds shared control
roles and one scoped React Aria ComboBox; the broad stock-class surface below
remains a Storybook-only research artifact. The public component ownership
decision is in [REACT-ARIA-BOUNDARY.md](REACT-ARIA-BOUNDARY.md). References to
distributing the broad skin below describe the earlier experiment.

Every factual claim below was independently verified against the repository and,
where relevant, re-measured in a browser. That pass found four wrong claims and
three imprecise ones, all since corrected. Where something remains unverified it
says so.

---

## 1. The question this work is actually answering

Two different questions have been running together, and separating them is most
of the value:

1. **Can Mangrove style React Aria components and re-theme them by swapping a
   CSS file?** The spike answers yes, in detail.
2. **Can DELTA, and the next product after it, share brand with the estate
   without sharing a component suite?** This is the question the organisation is
   asking, and the spike only partly addresses it.

Most of the disagreement in this workstream comes from people answering
different ones of these in the same conversation.

### The organisational context

Mangrove serves content websites (Drupal/Twig, plus non-Drupal sites and the
risk and resilience mapping platform), and already ships React through a Drupal
hydration runtime, so React is not a new commitment. DELTA is a data-heavy
application in its own repository, currently sharing nothing with Mangrove
except hand-copied token values. The duplication concern is concrete: if DELTA
builds its own suite, the next product likely commissions a second one, and we
are back to the position MCR left us in.

### The framing that works best

Not "DELTA should adopt Mangrove", but **DELTA uses Mangrove as one part of its
solution**: its own React Aria usage, its own Tailwind, and Mangrove for the
parts that help. Tokens always, CSS optionally, components only where useful.

That reframing requires four things of us. Three already hold:

| Requirement | Status |
| --- | --- |
| Selective consumption without the component bundle | proven in the spike |
| No requirement to adopt our component model | true today |
| Overridable by the consumer's own tooling | **gap — see cascade layers** |
| Tokens consumable by Tailwind | not yet built |

---

## 2. Cascade layers: the decision that reversed

This is the most important technical finding in the whole workstream, and it
went the opposite way from where it started.

Layers were originally rejected. The reasoning: DELTA has significant unlayered
legacy CSS, and unlayered styles beat layered ones for normal declarations, so a
layered Mangrove would lose to exactly the rules it needed to beat. The spike
shipped ordinary unlayered author CSS and this was recorded as settled.

What was never tested: Tailwind 4 emits its utilities inside `@layer utilities`.
Nobody checked what an unlayered Mangrove does to a layered Tailwind. Five cases,
measured in a browser rather than reasoned about:

| Setup | Result |
| --- | --- |
| A — everything unlayered | Tailwind utility wins |
| B — Mangrove unlayered, Tailwind in `@layer utilities` (**the real DELTA shape**) | **Mangrove wins** |
| C — all layered, order `legacy, mangrove, utilities` | utility wins, and Mangrove still beats legacy |
| D — Mangrove layered, legacy unlayered | legacy wins |
| E — both unlayered, Mangrove imported later | Mangrove beats legacy |

The original decision was right about D and never considered B. B is the
situation DELTA is actually in: **our unlayered stylesheet silently outranks
every Tailwind utility they write.** That is precisely the chokehold they are
worried about, delivered by the cascade rather than by policy — and the PR
comment told them the opposite, that their Tailwind would win by source order.

C is reachable now that the aria surface is no longer compiled unlayered into
every theme stylesheet. A pre-wrapped
`aria/react-aria.layered.css` was built for one wave and then removed: it was a
byte-copy of the unlayered file that could only have helped a consumer loading
no Mangrove stylesheet at all, and it carried a build script, a wrapper library
and a sync test to stay honest. A layered build is cheap to reinstate if an
adopter needs it (postcss is already a dependency).
**`docs/CASCADE-LAYERS.md` is the consumer-facing guidance** — why Mangrove is
unlayered, where a layer order statement has to go, why `@import … layer()` is
the wrong tool (webpack hoists the inlined block above the order statement and
Drupal's `CssOptimizer` skips the import outright), and what happens if you
double-wrap. That document supersedes anything about layers written here; this
section records only that the decision moved and what moved it.

Two consequences worth carrying that are not consumer guidance:

- Layering Mangrove wholesale makes it *always the lesser of peers* for normal
  declarations. Not unconditionally: for `!important` the order reverses and
  layered wins, so an `!important` inside a layered Mangrove becomes *harder*
  for a consumer to beat, not easier. Measured. For a design system that is
  often desirable — site overrides become easy — but it inverts current
  behaviour for sites that fight specificity today. 2.0-alpha is the moment to
  make that call if we are going to, and Mangrove v1 is the escape hatch for
  consumers who need the old behaviour.
- Still unverified: whether Drupal's aggregator preserves a plain `@layer`
  block. Nothing in `CssOptimizer` is layer-aware, but nobody has run it.

---

## 3. The token layer: what is wrong with its current shape

The `--mg-aria-*` layer is really Mangrove's **missing semantic tier wearing an
adapter's name**, and it is wired upside down.

`_variables.scss` jumps straight from palette (`--mg-color-blue-900`) to
component tokens (`--mg-color-button-background`). The semantic tier that does
exist — `--mg-color-interactive`, `--mg-color-text`, `--mg-surface-raised` — is
partial, never declared as a tier, and used inconsistently. Component tokens do
resolve through it where it exists, so the accurate criticism is not that it is
missing but that `--mg-aria-*` **renames** it under a second, library-specific
prefix rather than promoting it. `_runtime-theme-aliases.scss` then invents one — `color-accent`,
`color-surface`, `color-border`, `space-1..4`, `radius-control` — and labels it
private and library-specific.

Then the rule adopted during reconciliation, "the adapter reads the legacy
component's tokens", inverts the hierarchy: the semantic layer now depends on
the component layer. That is why the key count grows with every component
reconciled — each one is mirrored one-for-one under a second prefix, and the
contract test's alias list has to be hand-extended each time.

**The right shape is the other way up:** palette → semantic → component. Both
`.mg-button` and `.react-aria-Button` read the component token; the semantic
tier is what we hand a consumer. The `aria` prefix should go entirely, since it
encodes a rendering library DELTA has not chosen.

This is recorded as a direction, not a decision. Reversing it is a larger change
than anything done so far.

### The value-type trap

Mangrove stores colours as channel triplets (`0 79 145`) so they can carry alpha
via `rgb(var(--x) / 0.5)`. A triplet is only valid inside `rgb()`. Dropped raw
into a colour position it makes the whole declaration invalid, and CSS discards
it **silently**.

This is not theoretical. It has produced two real, shipped bugs (see §5). A
token layer whose readers must remember each key's value type will keep
producing them, especially as brand files are edited by brand owners rather than
by whoever wrote the mixin. Any future token format should carry the type
explicitly.

### Why theme-dependent aliases live in a mixin

A custom property's inner `var()` is substituted **on the element the property
is declared on**, and descendants inherit the already-substituted value. A theme
override applied *lower down the tree* therefore never reaches an alias declared
at `:root`. The rule is per-element, not `:root`-specific: put the theme class
on `<html>` and the alias does pick up the override (measured). It bites here
because Mangrove's theme class goes on `<body>` or a wrapper. The opt-in
`aria/react-aria.css` therefore declares `mg-aria-runtime-theme-aliases` both
at `:root` and inside every `.mg-theme-*` block.

The cost is real: each brand block carries a copy of the alias table, and the
*distributed* `aria/tokens/mangrove.css` had no theme blocks at all, so an
external consumer importing the published CSS got **no sub-brand theming**.
Generating one token file per brand with everything in one flat block removes
the resolution problem, the duplication, and that gap in one move.

**Done.** `scripts/build-tokens.cjs` now emits one standalone file per brand —
`aria/tokens/{mangrove,preventionweb,irp,mcr,delta}.css` — each carrying the
transitive closure of the ~55 Mangrove tokens the `--mg-aria-*` adapter reads,
resolved for that brand. Two corrections to the sketch above:

- The block is `:where(:root)`, not `:root`. Zero specificity is what lets the
  file work standalone *and* still lose to Mangrove's own stylesheet whenever
  both are loaded, in either load order. A plain `:root` block would let a
  stale published package outrank a newer stylesheet.
- The closure is computed, not curated: the generator scans the adapter Sass
  for `var(--mg-*)` and refuses to build if any of it names a token no source
  defines. `aria/tokens/mangrove.css` previously carried 28 references to
  properties it never defined; the contract test now resolves each file in
  isolation rather than only checking that keys exist.

---

## 4. Reciprocity: the claim that does not survive

The argument made to DELTA was: if both sides style through React Aria's stock
`.react-aria-*` classes, Mangrove can consume anything DELTA builds and vice
versa.

It is not enforced and will not be followed, and the evidence is inside our own
repository. (React Aria does offer a composition path — a function-valued
`className` receiving `defaultClassName` — so the library does not force the
choice. The convention fails through disuse, not by design.)

React Aria applies its stock class **only when `className` is not supplied**.
`stories/Documentation/AriaCrudSpike.stories.jsx` passes `className` 68 times,
including `className="react-aria-Column aria-crud-selection-column"` — manually
re-adding the stock class the moment a second class was needed. Mangrove's own
proof abandoned the convention inside one file. A Tailwind codebase will not
hold it either.

A second problem: a DELTA component styled with Tailwind utilities carries no
CSS of its own. It depends on utility CSS generated by scanning DELTA's source.
Mangrove cannot import that.

**What actually survives contact with two teams is tokens, not classes.** Custom
properties are technology-neutral. Tailwind 4 can be pointed at them via
`@theme`, and MUI 6 has a CSS-variables mode. That is the only reciprocity that
costs neither team autonomy. If component-level sharing is genuinely wanted, it
needs a package boundary — thin wrappers that own default styling and merge a
consumer `className` — not a naming convention nobody will follow.

---

## 5. Bugs found, and what they say about the system

These were all found by measuring rather than reading, and each points at a
systemic weakness rather than a one-off slip.

| Bug | Consequence | What it says |
| --- | --- | --- |
| `--mg-border-color-button` was a triplet in a `border:` shorthand | `.mg-button-outline` rendered as **bare text** — no border, no background. Non-functional since it shipped | value-type ambiguity; no test covered a variant's rendered result |
| `--mg-color-button-background` triplet everywhere except DELTA, which needs `transparent` | DELTA's button hover was **dead**, and a "buttons match across four themes" claim was two invalid declarations both collapsing to transparent | a convention that one theme cannot express will be broken by that theme |
| Form input border was `rgb(neutral-600 / 0.22)` | **1.43:1** against the page, **1.39:1** against its own fill. Every input, textarea and select in the design system failed WCAG 1.4.11 | contrast is a property of the resolved chain and cannot be reviewed by reading |
| `.react-aria-Text[data-slot="description"]` | React Aria emits no `data-slot`; field descriptions and errors were **never styled** | selectors were written from documentation rather than from the installed package |
| `:where()` on base Button/Input | zero specificity, so normalize's `button { font-size: 100% }` beat the themed value | zero specificity is wrong for a surface that ships unlayered |
| Spike fixtures imported into the theme rollup | `.aria-crud-*` shipped in `style.css` to **every** consumer | guarding one artefact and not the other |

**Resolved after the spike:** both the demo rules and the React Aria surface
were removed from the normal theme rollups. The opt-in `aria/react-aria.css`
is built and distributed separately. See §12 for the distribution decision.

Two general lessons worth keeping:

- **Coverage scales cheaply; correctness does not.** Agents took React Aria
  styling coverage from 29% to 56% in one session (57% today, after later work), and the same pass introduced
  accessibility defects that a separate audit had to find. Neither half worked
  alone.
- **A guard you have not mutation-tested is not a guard.** Two detectors written
  in this session reported "zero problems" while being silently broken.

---

## 6. Legacy and React Aria coexistence

Mangrove will have two implementations of several components. That is
legitimate: the legacy components are CSS plus progressive enhancement that work
in server-rendered Drupal with no React, while React Aria requires React. They
serve the two consumption tiers Mangrove actually has.

The risk is not duplication, it is **divergence**. Measured under PreventionWeb
before reconciliation, legacy and React Aria tabs shared only their accent
colour: radius 0px vs 5px, 15px/20px padding vs 10px/15px, 18px type vs 16px,
56px tall vs 44px. Colour flowed through the tokens and geometry did not.

Tabs, buttons, tags, checkbox/radio and form inputs have since been converged
onto shared tokens. Colour, padding and type size were verified identical for
tabs and buttons across four brands; the other components were not measured that
broadly, and §5's second row is exactly a case where a wider "identical across
four themes" claim turned out to be two broken declarations agreeing. Hero, CTA
and
navigation have no React Aria counterpart and carry no divergence risk.

**Caveat worth carrying:** the brands' *tab identity* is dead for the default
horizontal variant, and this predates the convergence — alpha.2's modernisation
bypassed the tab-specific tokens. The underline colour still reads
`--mg-color-interactive`, so brand *accent* reaches the default tab; what died is
each brand's tab *identity* — radius, padding, fill, text and tabbar colour. The
reconciliation
tokenised what was already there and propagated it to a second surface. MCR2030
and PreventionWeb still define tab tokens that no longer affect the default
variant. Brand owners will notice.

---

## 6a. What we learned about DELTA

The DELTA product's repository and design file were examined directly during
this work, which corrected a significant error: Mangrove's DELTA theme had been
built on `#132E48`, a navy that does not appear in DELTA at all. **DELTA's brand
blue is `#004F91`** — which is `--mg-color-blue-900`, Mangrove's own UNDRR blue.
DELTA's design file labels that swatch "UNDRR Blue". The theme also had its
primary and outline buttons swapped, and collapsed a two-colour brand into one.

All of that is corrected in the token sources, and the values there carry their
own provenance notes. That is the part which belongs in this repository.

The wider review — DELTA's stack, its styling architecture, and the specific
defects found in its source — is deliberately **not recorded here**. This is a
public repository, and a file-and-line critique of another team's private
codebase does not belong in one, however useful the analysis. It has been kept
separately for sharing with the DELTA team directly.


## 6b. Form control states: what each surface expresses

DELTA's design file models every form control across seven states — default,
hover, focus active, focus typing, filled, error, disabled. Mangrove has two
form surfaces that are meant to agree: the legacy `.mg-form-*` controls and the
React Aria surface in `aria/_react-aria.scss`. A specimen sheet was built that
rendered both side by side, one live control per state, and each cell was
verdicted with `getComputedStyle` in Chromium rather than by reading the
stylesheet — hover driven with a real pointer, keyboard focus with a real Tab,
pointer focus with a real click. It was checked in all five themes and both
directions. The sheet itself is not kept: hardcoded computed-style snapshots
that nothing re-runs rot the moment the CSS beneath them changes. The findings
are kept, because they were expensive to obtain and nothing else records them.

### Which states each surface actually expresses

Measured at the UNDRR default, per control (legacy → aria):

- **Text input** — hover: neither. Focus active: legacy draws the full ring;
  aria draws it only for keyboard focus. Filled: neither. Error: both.
  Disabled: legacy inverts to a *white* background, lighter than the enabled
  grey, and leaves the border alone; aria is measurably identical to default —
  no opacity, no colour, no border change, only the UA cursor differs.
- **Textarea** — hover: aria moves the border to the focus colour, legacy does
  nothing. Focus/filled/error as the text input. Disabled: aria uses opacity
  0.55 and `cursor: not-allowed`; legacy repeats the white inversion.
- **Date** — legacy is a native `input type="date"`, so segment-level focus is
  drawn by the user agent and varies by browser. Aria is the only place in
  either surface that distinguishes **focus typing**: `DateSegment[data-focused]`
  highlights the segment being typed while the field keeps its focus-within
  treatment. But aria's DateInput has no `[data-invalid]` and no `[data-disabled]`
  rule, so an invalid or disabled date field looks ordinary — only the
  `FieldError` text signals a problem. `DateSegment[data-placeholder]` is muted,
  which marks the *unfilled* case rather than the filled one.
- **Select** — aria hovers (`[data-hovered]` lightens the trigger), legacy does
  not. Neither distinguishes a chosen option from a placeholder. Aria has no
  `[data-invalid]` rule reaching the trigger, so an invalid select looks valid.
  Disabled: legacy measures opacity 0.7 — different from the disabled input and
  textarea beside it; aria inherits the base Button's 0.55, a CTA treatment
  applied to a field.
- **Stepper** — legacy is a native `input type="number"` with the browser's own
  spinner, not a Mangrove control. On aria the increment/decrement buttons hover
  and dim; the Input between them does neither, for the same reason the plain
  text input does not.

### Controls that do not exist on either surface

- **Dropdown breadcrumb.** Mangrove has a Breadcrumb and a Select; nothing
  composes them. React Aria offers `Breadcrumbs` plus a `Select` hand-composed,
  with none of the seven states defined for the composition as a whole.
- **Multiselect.** Legacy offers a checkbox group, which is a different
  interaction with a different affordance. Aria styles `ListBox` with
  `selectionMode="multiple"`, but `[data-selected]` shares the `[data-focused]`
  background so a focused-unselected option and a selected one look the same,
  and there is no multiselect trigger, token display or removal affordance.

### Where the two surfaces disagree

- **hover** — three behaviours for one state: aria TextArea hovers, aria Input
  does not, neither legacy control does.
- **disabled** — four treatments: legacy input/textarea white-plus-grey at
  opacity 1, legacy select at 0.7, aria TextArea at 0.55, aria Input nothing at
  all.
- **error** — every legacy control turns its border red. On aria, Input and
  TextArea do; DateInput and the Select trigger do not.
- **focus from a pointer** — the sharpest one. Legacy uses the CSS
  `:focus-visible` pseudo-class, which browsers *do* apply when a pointer user
  clicks into a text field. The aria surface uses `[data-focus-visible]`, which
  React Aria withholds on a pointer click. Measured: a clicked aria text input
  has `data-focused` but not `data-focus-visible`, so it keeps its default
  border, background and 1px UA outline while the legacy field in the same
  situation shows the full ring. Keyboard focus is fine on both. The loser is
  the sighted pointer user who needs to see where they are.
- **focus indicator shape** — legacy draws a 2px white band inside a 2px blue
  band with `box-shadow`; aria draws one 2px outline with an offset. Both settle
  on `0 79 145`, but the legacy focus *border* re-themes per sub-brand (teal on
  PreventionWeb, purple on MCR2030) while the ring around it stays UNDRR blue in
  every theme — a themed border inside an unthemed ring.
- **focus typing** — only the aria DateInput expresses it, and only because
  React Aria gives each segment its own focus. Everywhere else it collapses into
  focus active.
- **filled** — neither surface expresses it on any control.
- **reduced motion and forced colours** — aria gates every transition behind
  `prefers-reduced-motion: no-preference` and repaints focus and selection under
  `forced-colors: active`. `forced-colors` appears nowhere in the legacy
  stylesheet and the legacy form controls carry no transitions at all. The two
  surfaces will not match for a user who has asked their OS for either.

RTL was clean on both: layout and reading order mirror, the legacy select moves
its chevron and the legacy date input its picker button, and the aria surface
reflows on its own because it is written in logical properties. The error red is
`193 9 32` in every theme.

---

## 7. Open questions

- Do we invert the token hierarchy to palette → semantic → component, and drop
  the `aria` prefix?
- Is Figma the upstream for brand values? They currently reach both
  repositories by hand and nothing syncs. (Per-brand token file generation is
  no longer open — see §3.)
- Do we adopt cascade layers in 2.0, given it is breaking and v1 is the escape
  hatch?
- Where should font loading live? A token file currently carries an
  `@font-face`.
- Portalled overlays render under `<body>`. Any site scoping `.mg-theme-*` to a
  wrapper gets unbranded popovers and menus.
- Forced-colours rendering has never been verified in Windows High Contrast.
  Everything in §10e was measured in Chrome under
  `Emulation.setEmulatedMedia`, which is the same media query and not the
  same renderer.
- Further open items opened by the refinement wave — bundling, distribution,
  tab identity and the component stylesheets that bypass the focus-ring token
  — are in §12, with owners.

---

## 8. What would be decided, and by whom

The choice is a spectrum, not a binary, and each rung is independently useful:

1. **Shared tokens only** — brand coherence, no component coupling.
2. **Tokens plus the shared Aria stylesheet** — what the spike proves.
3. **Plus Mangrove content patterns per route** — syndicated search, tabs,
   cards, the UNDRR footer. This is the rung that unblocks the landing page.
4. **Full component adoption** — only where it helps.

A team can sit on rung 1 indefinitely and step to rung 3 the week a programme
asks for a branded page, without rework.

Whichever rung is chosen, the reasoning should be written down, including what
is knowingly given up. A faster product-only path is a legitimate choice;
discovering in a year that it cannot be reused should be an accepted consequence
rather than a surprise.

**And one thing that is not an architecture problem at all:** the DELTA-branded
landing page a programme has been asking for over a year is not blocked on any
of this. `_theme-delta.scss` and `style-delta.scss` already exist and the theme
switch already works. It is blocked because nobody owns keeping the DELTA brand
file faithful to DELTA's design. That is governance.

---

## 9. The refinement wave: what the token contract learned

Four waves of aesthetic work — `80b71493`, `7e2432c7`, `16a832a9` and the
commits around them — took the React Aria surface from "coloured correctly" to
"shaped correctly". The diff shows what moved. This section records the
reasoning that the diff does not.

### 9a. The contract gained a quiet register

`--mg-aria-color-border` was doing nine unrelated jobs: form-field edge,
popover and modal edge, table rule, tab rail, disclosure dividers, separator,
tag edge and the slider rail outline. Those are two jobs wearing one name.
Modern Mangrove draws them with two values, and the adapter now does too:

- **opaque `neutral-400`** where SC 1.4.11 applies to a *control* boundary — a
  field, a check, a Select trigger. That stays `--mg-aria-color-border`.
- **`rgb(neutral-600 / 0.24)`** for *structure* — table rules, tab rails,
  section dividers, card and overlay edges. That is the new
  `--mg-aria-color-rule`. It is the same value as the `.mg-tabs__list` rule
  (`tab.scss:211`) and as `--mg-shadow-raised`'s inset, so the two surfaces
  agree by construction rather than by coincidence.

Fourteen declarations in `_react-aria.scss` read the new token.

**The constraint worth stating plainly:** `--mg-aria-color-rule` is
translucent, and it is deliberately **not** graded by the contract test's
contrast pairs. It appears in `RUNTIME_ARIA_ALIASES` (existence) and is absent
from `ARIA_PAIRS` (contrast) on purpose — a translucent value composited over
an unknown backdrop has no single ratio to assert. So it **must never be the
only boundary of a control**. If a future change points a field, a check or a
trigger at it, the contract test will stay green and the control will fail
1.4.11. That review has to be done by a person.

The same reasoning produced the pairing in the elevation ladder: a popover now
draws a *quiet* edge and a soft shadow, rather than an opaque form-field border
*and* a long shadow, which was two mechanisms doing one job.

### 9b. The other new seams, and why each one exists

None of these changed a rendered value for its own sake; each names a decision
that was previously a repeated literal or an unreachable one.

| Token | Why it exists |
| --- | --- |
| `--mg-aria-color-hover-surface` | Mangrove hovers with 6% of the interactive colour (pager, details, scroll-container, and the v2 tab). Grey hover was the last brand-blind surface in the adapter. Never the sole state signal — it is ~4% luminance and is always paired with colour or weight. |
| `--mg-aria-color-invalid-surface` | A scannable wash for an invalid field, deliberately far below any contrast threshold. `--mg-aria-color-invalid` on the border and in the message stays the contrast carrier. |
| `--mg-aria-control-block-size` | Reads `--mg-form-input-block-size`, which has existed since #1086 and which the adapter never read. Steppers, ComboBox and DatePicker triggers were 41px against a 46px field. |
| `--mg-aria-radius-item` | `min(control, surface)`. Nothing guarantees a theme's control radius is smaller than its surface radius; MCR2030 was a live counter-example, a 10px MenuItem inside a 5px Popover. |
| `--mg-aria-radius-check` | `min(control, 4px)`. At MCR2030's 10px a 24px check reads as a radio button, which is a meaning change rather than a style one. |
| `--mg-aria-radius-control-inner` | `max(0, control − border)`. Concentric corners share a centre, so a child inside a 1px border needs the outer radius minus that border or its corner cuts across the parent's. `max()` keeps it legal for a square-field theme. |
| `--mg-aria-check-size` | 24px, the WCAG 2.5.8 minimum, matching the thumb. |
| `--mg-aria-color-fill` | See §9c. |
| `--mg-aria-modal-shadow` | The modal has to out-elevate the popover rather than match it, so the ladder is card rule → popover → modal rather than two rungs. |
| `--mg-aria-button-outline-color{,-hover}` | The contract could previously only express "primary", so the outline variant every brand defines reached nothing. Both source tokens are channel triplets and are wrapped in `rgb()` here — see the value-type trap in §3. |
| `--mg-aria-opacity-disabled`, `--mg-aria-press-scale`, `--mg-aria-font-weight-strong` | Nineteen repeated literals (0.55 twelve times, the press scale twice, the strong weight five times) became three decisions. No rendered value changed. |

### 9c. The rail contrast requirement is unsatisfiable as it was stated

The brief was "raise the track until the rail clears 3:1 against the page".
Measured across the neutral ramp, no value does, and the reason is algebraic
rather than a matter of picking a better grey.

Take IRP, whose interactive colour is `#0f78bf` — relative luminance 0.173,
which is **4.71:1 on white**. On a white page:

- rail vs page at 3:1 requires rail luminance ≤ **0.300**
- fill vs rail at 3:1 requires rail luminance ≥ **0.619**

The two constraints do not intersect. Satisfying both would require a rail
*lighter than the page it sits on*. Every surveyed system reaches the same
place: Adobe neutral-300, Spectrum 2 gray-300, Jolly zinc-200 — all around
1.2:1 on white, all unbordered.

So the guarantee moved rather than being abandoned. The rail stays light, and
the **fill** carries the contract: `--mg-aria-color-fill` is graded against
`--mg-aria-color-track` *and* against `--mg-aria-color-surface`, so a part-full
bar is readable by its own edge against the page. The fill is a separate seam
from `--mg-aria-color-accent` precisely so a theme whose accent is too light
can repoint one property instead of restyling four components — Spectrum 2's
answer to the same problem.

Record this because someone will propose bordering the rails again. In forced
colours the rails *do* carry a border, because there the fill is `Highlight`
and the rail forces to `Canvas`; that is a different problem with a different
answer, and it is not evidence that the normal-mode border was wrong.

### 9d. The focus ring is no longer the brand colour

`--mg-color-focus-ring` is `#866200` in all five themes: the amber this system
already ships (`accent-500`, `#fec124`) held at its Oklch hue and taken down to
L 52%. It is not a brand hue, on purpose — the focus ring is the one colour in
Mangrove that must never be mistaken for anything else, and a ring that changes
per property is a ring people have to relearn per property.

The obvious question is why we did not use one of the loud public-sector
yellows. The answer is structural rather than aesthetic. Our perceptual measure
is **lightness-only** on Oklab and grades non-text against a floor of 50.
Measured with `scripts/lib/perceptual-contrast.cjs`:

| Colour | Oklab measure vs white | WCAG 2 vs white |
| --- | --- | --- |
| `#ffdd00` (GOV.UK yellow) | 5.3 | 1.35:1 |
| `#ffeb3b` (a common material yellow) | −3.2 | 1.22:1 |
| `#866200` (ours) | 68.7 | 5.58:1 |

No light colour can pass as a *single band*, under either measure. That is
exactly why GOV.UK and NHS both ship **two**: a bright ring plus a dark anchor
bar underneath it, where the dark half carries the contrast. A two-part
indicator is a legitimate design we have not adopted; a single bright band is
not.

`--mg-color-form-focus` deliberately stays brand-coloured and continues to
resolve to `{color.interactive}` in every brand. The two are saying different
things: the field border says "this field is active", the ring says "the
keyboard is here". Collapsing them would lose one of the two facts.

---

## 10. Traps found while doing the work

Each of these cost real time to establish and none of them is visible in the
resulting diff.

### 10a. `border: 0` on the base Button made every later `border-color` a no-op

`.react-aria-Button { border: 0 }` set the border *width* to zero, so every
later rule in the stylesheet that set only `border-color` on a Button — the
Select trigger, the Disclosure trigger, the dialog's close button — painted
nothing at all. The Select trigger shipping with a tint and no boundary (which
"never rely on tint alone to identify a control" rules out, and which fails SC
1.4.11 outright) was the visible symptom of a file-wide defect.

It is now `border: var(--mg-aria-button-border-width) solid transparent` — a
real border, transparent on the filled variant so nothing changes visually
there, and an edge for the quiet variants to colour in. The general lesson: a
`border: 0` in a base rule is not a neutral reset, it is a silent veto over
every state rule that follows.

### 10b. `min-block-size` is a floor and cannot pull a control down

Setting `--mg-aria-control-block-size` on the MCR2030 Select trigger achieved
nothing until the field's *padding* was applied as well. MCR2030's button
padding is 15px/30px, which makes the trigger's content box 52px — past the
46px field it is meant to match. A floor only ever raises. This bit an
implementer once and will bite the next one, so the Select trigger explicitly
takes the **Input's** padding, not `--mg-aria-button-padding`.

The same applies to radius: the trigger takes `--mg-aria-radius-control`, never
`--mg-aria-radius-button`, because MCR2030's button radius is a 30px pill
beside 10px inputs.

### 10c. A control that never states its type metrics inherits the page's

`.react-aria-DateInput` declared no `font-family`, `font-size` or
`line-height`, so it took the page's. Under the default theme that happened to
match; under DELTA, whose base type is larger, it rendered 49px beside a 46px
Input and a 46px calendar trigger. Invisible in the theme everyone reviews in,
which is why three review passes missed it. Any control that sets its own
height must also state its own type metrics, or the height is only true in one
theme.

### 10d. The calendar cell is a `<div>` inside an unclassed `<td>`

`CalendarGrid` renders a real `<table>`; `CalendarCell` renders an **unclassed**
`<td>` wrapping an inner `<div class="react-aria-CalendarCell">` which carries
every `data-*` attribute — `data-today`, `data-selection-start` and
`data-selection-end` included. So the old
`.react-aria-CalendarHeaderCell, .react-aria-CalendarCell { padding: 5px }`
put padding on a `<th>` in one case and on an inner `<div>` in the other, and
the `<td>` in between — reachable by no class at all — kept the UA default
`padding: 1px`.

That 1px was a gutter around every date that no token could reach, and it is
why range selection rendered as broken-up segments: the band painted the 30px
div and left an unpainted moat on all four sides. `CalendarGrid td, th
{ padding: 0 }` plus all sizing on the inner div is what makes adjacent
selected days actually touch.

### 10e. Forced colours: three facts that were measured, not assumed

The `@media (forced-colors: active)` block used to sit mid-file with ~450 lines
after it. A media query adds no specificity, so later equal-specificity rules
were silently overriding their own repaints. **It now lives at the end of
`_react-aria.scss` and must stay there.** Anything appended after it is
appended after the repaints too.

Three behaviours, all verified in Chrome under `Emulation.setEmulatedMedia`
rather than reasoned about:

- **`border-color` is forced to `CanvasText` even when the author value is
  `transparent`.** Both collections reserve their 3px selection marker as
  `solid transparent` so selecting does not shift the layout. In forced colours
  that reservation painted an opaque black bar on every row, every GridList
  item and the table header's first column — inverting the exact state the bar
  exists to carry. `Canvas` restores the reservation; `Highlight` marks the
  selection.
- **`background: Highlight; color: HighlightText` computes correctly and still
  paints blank.** Chrome draws a Canvas text backplate behind the text of any
  element left on `forced-color-adjust: auto`, so `HighlightText` renders
  white-on-white. `forced-color-adjust: none` is therefore **mandatory** on a
  Highlight fill with text over it — and **unnecessary** on a Highlight border
  or a text-free fill. Confirmed by screenshot: two identical divs, one opted
  out and one not, only the opted-out one readable.
- **`box-shadow` is suppressed entirely**, even when written inside the media
  query. An `inset 0 0 0 2px CanvasText` shadow declared in the block computes
  to `none`. So anything whose only boundary is a shadow has no boundary here,
  and anything opted out of forcing keeps its *brand* shadow, which is worse.

A fourth, less obvious: `forced-color-adjust: none` disables forcing for
**every** declaration reaching that element, including more specific state
rules written elsewhere. The slider thumb's disabled and hover colours were
painting brand values no forced-colours rule had authorised, purely because the
base element was opted out.

Windows High Contrast itself remains unverified — see §7.

### 10f. React Aria replaces its default class when you pass `className`

This is a trap for every consumer, not a detail of our stories.

`<Foo className="x">` renders `class="x"` — `react-aria-Foo` is **gone**, and
every rule in the distributed stylesheet with it. The CRUD demo carried
`className="mg-search__input-wrapper aria-crud-search"` on its SearchField, so
`react-aria-SearchField` was never on the element and no distributed styling
ever reached it; the same on the editor Dialog, which would have silently
broken the `slot="close"` outline button. Both now re-add the default class by
hand (`className="react-aria-SearchField aria-crud-search"`).

React Aria does offer a composition path — a function-valued `className`
receiving `defaultClassName` — so this is avoidable. It is simply not what
anyone writes by default, which is the same reason the reciprocity argument in
§4 does not survive contact with a second team. Anyone consuming
`aria/react-aria.css` needs to know this before their first `className`.

### 10g. React Aria derives reading direction from `navigator.language`

Not from the `dir` attribute, and not from `lang`. Without an `I18nProvider`
the page was visually RTL while the library believed it was LTR, which inverts
arrow-key mapping in Tabs, Slider, DateField and Table columns — the layout
mirrors and the keyboard does not follow it.

`.storybook/preview.js` now wraps every story in
`<I18nProvider locale={…}>`. **Consumers need the same.** A Drupal page served
in Arabic that mounts React Aria components without an `I18nProvider` has
working RTL layout and backwards arrow keys, and nothing in the DOM says so.

### 10h. A `font-family` set at `:root` cannot be overridden by `:root:lang(ar)` alone

This is the §3 mixin trap in a second costume, and worth cross-referencing
because the two look unrelated until you have hit both.

A custom property's value is resolved on the element it is declared on, and
descendants inherit it **already resolved**. Arabic React Aria controls were
falling through to the system sans while `mg-status-label` beside them
correctly rendered Dubai, because every `.react-aria-*` rule sets
`font-family: var(--mg-aria-font-family)` explicitly — which beats the
inherited value the legacy `:lang(ar)` blocks rely on.

The fix is in `mg-aria-token-constants` and needs **two** selectors, for two
different reasons:

- `&:lang(ar)` — the document case (`<html lang="ar">`). It compiles to
  `:root:lang(ar)` inside Mangrove's bundle and `:where(:root):lang(ar)` in the
  standalone token files; in both it is strictly more specific than the block
  it overrides, so it wins on specificity rather than on source order.
- `@at-root :lang(ar)` — the subtree case, an Arabic pull-quote inside an
  English page. `:root` does not match that element at all, so there is no
  contest: the declaration simply replaces the inherited value.

`_runtime-theme-aliases.scss` documents the same mechanism for theme values.
The rule generalises: **any custom property whose value depends on a condition
that can vary below the root cannot be declared only at the root.**

---

## 11. Corrections to claims made earlier in this document

- **`CalendarHeading` does not remove the `:has()` header hack.** React Aria
  1.20 does ship a `CalendarHeading` with the default class
  `react-aria-CalendarHeading`, verified in the installed build, and it is
  styled now. But the `:has(> .react-aria-Button[slot="previous"])` selector
  targets the previous/heading/next **row wrapper**, which is author markup
  under a class we cannot know. The hack stays. Only the heading itself gained
  a real class.
- **`--disclosure-panel-height` does not exist in RAC 1.20.** The only custom
  property the library emits that this surface could read is `--trigger-width`
  (plus `--tab-panel-width/height`, `--table-row-level`, `--tree-item-level`
  and the visual-viewport pair). Any animation of a disclosure panel's height
  has to measure it, not read it.
- **§6b's form-state findings predate the joined-field work.** The Group is now
  the field: it carries the border, radius, height, background and focus ring,
  and the controls inside are borderless and flush, which is what every RAC
  starter in the ecosystem does. Several disagreements §6b records are
  therefore closed — the Select trigger now expresses invalid and disabled, the
  DateInput states its own metrics, hover and filled are expressed on the
  Input, and the disabled treatments were unified on
  `--mg-aria-opacity-disabled`. §6b is kept as written because it is the record
  of a measurement pass, not a live status board. Re-measure before citing it.
- **The `~4.2:1` figure in the rail comment in `_runtime-theme-aliases.scss` is
  wrong.** IRP's interactive colour is 4.71:1 on white. The conclusion the
  comment draws is unaffected — see §9c for the arithmetic — but the number
  should be corrected next time that file is touched.

---

## 12. Open, and who owns it

Deliberately unresolved. Recorded so that "nobody decided" does not later read
as "somebody decided".

- **The sub-brand tab identity question**, recorded at length in
  `_runtime-theme-aliases.scss` and in §6's caveat. MCR2030, PreventionWeb and
  DELTA designed a *filled* tab; alpha.2 shipped an underline. Piping the brand
  tab tokens into the underline mechanically puts white text on a white page
  (measured 1.00:1). Either the brands re-express their tab identity in the
  underline vocabulary, or the v2 tab regains a filled variant. **Owner: design
  plus the brand owners** — it cannot be resolved by wiring.
- **Component stylesheets that draw their own focus outline and bypass
  `--mg-color-focus-ring`.** A survey of `stories/Components` finds focus
  outlines hardcoded in **24 rules across 13 stylesheets** — Syndication
  search widget (6), Gallery (4), Hero, Card and PreviewAccess (2 each), and
  one apiece in Boilerplate, Chips, Forms, MegaMenu, Pager, Snackbar, Tab and
  TextCta. **Fourteen of those, across six files, read the brand colour the
  ring was deliberately moved away from in §9d** (`--mg-color-interactive`,
  `--mg-color-blue-800`, or the widget's local `$search-primary`); the rest
  hardcode a neutral or read `--mg-color-form-focus`, the field border token,
  which is a near-miss rather than a hit. Counts measured, not recalled: the
  narrow query is the one the changelog quotes.

  The one to fix first is **`stories/Components/Forms/_form-base.scss:264`**,
  which hardcodes `rgb(var(--mg-color-blue-800))` — a UNDRR blue *primitive*,
  not a semantic token — inside `.mg-form-error-summary`, a **shared** form
  rule. No sub-brand overrides `blue-800`, so that rule leaks UNDRR blue into
  PreventionWeb, IRP, MCR2030 and DELTA. **Owner: forms.** Out of scope for
  this wave and reported rather than fixed.
