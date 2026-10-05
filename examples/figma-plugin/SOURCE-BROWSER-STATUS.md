# Draft source browser comparison

Observed 5 October 2026 against source revision `53523889`. Parallel auditors
used isolated Chromium sessions on a current-source Storybook server. The owned
server and sessions were closed after captures. No JSX/SCSS, normal exporter,
maintenance runtime, Figma assets or prior deliveries changed during capture.

These observations advance the [nine-family source drafts](COMPONENT-DRAFTS.md).
They do not establish native Figma geometry, font-file identity, publication or
consumer acceptance. Raw JSON, screenshots, capture/comparison scripts, source
hashes and the desktop retry receipt accompany the separate versioned delivery.

| Family        | Browser evidence                                                                                                               | Remaining boundary                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Range         | Default/Disabled in five brands; input and wrapper height 4px, input block margins 20px; exact 240/390px component allocations | Native thumb ink, other browser engines and CSS margin collapse                                   |
| Accordion     | Default three-item story in five brands; at 390px, open height 279px, closed height 136px; paragraph bottom margin 16px        | Draft native sizing; authored Flush story has two items rather than the draft's three             |
| Breadcrumbs   | Default/White in five brands; source typography and CSS border chevrons captured                                               | Baseline/intrinsic native sizing; browser separator quantization 5.59375px versus algebraic 5.6px |
| Pager         | Three snapshots in five brands; 44px controls, 20px SVG allocation, current/navigation/disabled alpha paints                   | Native vectors, font identity, arbitrary edits and pagination behaviour                           |
| Skip Link     | Focused state in five brands; 390px block width and 46px height, source padding, bottom border and inset bands                 | Native focus compositing and browser keyboard/navigation behaviour                                |
| Tag           | Five static tones in five brands; 28px height, source padding/borders/radius and colour bindings                               | Native intrinsic text widths, wrapping and font-file equivalence                                  |
| Notice        | Four short fixtures in five brands; source title/body typography, border, alpha paints and 24px icons                          | Body fixture omits draft punctuation; exact glyph/full-box native geometry                        |
| Highlight Box | Three actual stories in five brands; inherited heading, margins, fallback colours and inset shadow                             | Stories have two paragraphs, draft has one; whole-box equivalence remains open                    |
| User Feedback | Initial mobile/desktop in five brands; desktop 1164px height 72px, mobile 390px height 104px except MCR2030 116px              | Native wrapping/grid sizing, responsive switching and confirmation                                |

Pager, Skip Link and Tag comprise 30 contexts with 1,175 exact checked source
parameters and zero mismatches. The checks cover selected recipe parameters;
they are not whole-component comparisons. Loaded font inventories and equal
canvas advances support the existing CSS weight matching inferences. They do not
prove the exact font file used by Figma.

MCR2030 User Feedback actions grow to 52px because of their larger source
typography/padding. The draft already uses a 40px minimum with HUG sizing, so no
fixed-height correction is required.

## Range source correction

The earlier drawing allocated a 24px input box. Actual Chromium lays out a 4px
input/rail while the authored 24px thumb overflows it. The recipe now places the
track at y=0 and thumb at y=-10, leaves clipping off and retains existing anatomy
IDs. Its 20px root padding produces a 44px margin-flow allocation. That is an
explicit surrogate, not the browser wrapper's measured 4px bounds or a general
CSS margin-collapse model. Storybook's 16px side padding means 272/422px
viewports yield 240/390px component allocations.

The correction is limited to the unpublished source draft. All-five-brand mock
tests verify the negative offset, two zero-create repeats, retained identities
and independent consumer placement. Source thumb-margin changes and altered
spacing reject the measured contract. Independent review passes. This does not
fix or close the unrelated tiny native recovery rebuild drift.

## Desktop and native next step

Figma launched successfully and its recovery checkpoint window was captured.
A documented coordinate click, after window restoration, aborted with
`window_not_focused`: `current: no focused window`. Accessibility and Screenshots
permissions report granted. Permissions are not a confirmed cause. Unchanged
retries stopped, and no file edits or publications occurred.

The [reviewed experiment plan](DRAFT-NATIVE-EXPERIMENT.md) requires a new empty,
unpublished file and an enforced exact-file gate before any import/controller
execution. The existing canonical, consumer and recovery files are excluded.
Native file-key availability and guard execution must be verified before an
importable experiment DTO is prepared. No such DTO or guarded runtime exists
yet. The source packet remains deliberately non-importable.

Once control is restored, verify the gate, construct one family at a time, compare
native source parameters and preserve supported consumer edits through two
ordinary zero-create exact-geometry repeats. Selective publication, consumer
updates/restoration, changed-style publication, recovery verification, human
handoff and reduced merge acceptance remain separate gates.
