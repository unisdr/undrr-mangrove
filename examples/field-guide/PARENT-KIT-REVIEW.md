# Parent kit review — edition 04

Reviewed the parent through `ad2fbf26` on 5 October 2026. The field-guide branch
merged 28 parent commits after `ea33e7b8`, without conflicts. All incoming changes
are in the Figma example and exporter; shared component and token sources did
not change in this sync.

## Changes justified by the parent

| Before                                            | After                                                            | Reason                                                                                                                                                |
| ------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Handoff describes Figma variables and collections | Source → exporter → native kit → implementation                  | The parent now builds linked native components, typography and effects as well as variables.                                                          |
| Integration routes cover HTML, React and CSS      | A fourth Figma route explains a first design                     | Welcome now has installed destinations and a separate personal workspace; fresh Assets instances keep personal work outside generated ownership.      |
| No native readiness guidance                      | Separate core controls, draft Cards/Heroes and planned templates | Core use is bounded; Card/Hero resizing does not switch presets; the planned source catalogue is documentation rather than accepted Assets templates. |
| Generic source links                              | Current kit, status and maintenance documents                    | The exploratory branch differs from public Storybook. Five browser colour layers do not establish native acceptance for five brands.                  |

The applications atlas keeps its current visual treatment. Native kit packing
is a different design problem: the parent's overall canvas review recommends
shorter navigation distances and tighter local row bounds, but those changes
are still recommendations. They do not justify changing the communications
compositions or packing native variants into this guide.

## Evidence and limits

- [Kit guide](../figma-plugin/README.md): Welcome uses linked components and
  points to six installed destinations. A personal frame belongs in **Your
  workspace**; insert a fresh component from the local file's Assets.
- [Core status](../figma-plugin/CORE-KIT-STATUS.md): the 25-family, 297-variant
  construction preset remains bounded draft use. Supporting parts count in
  that inventory; the total is not a count of independent widgets.
- [Card/Hero status](../figma-plugin/CARD-HERO-STATUS.md): four families and
  56 variants are draft components outside that core preset. Page/Section and
  Desktop/Phone are declared presets, not automatic CSS breakpoints.
- [Source catalogue](../figma-plugin/README.md): the planned 68-row,
  414-example source catalogue is documentation rather than accepted templates.
- [Canvas review](../figma-plugin/UX-DOGFOOD.md): outstanding canvas flow and
  navigation recommendations are recorded separately from native acceptance.
- [Maintenance](../figma-plugin/MAINTAINING-KIT.md): update scope and identity
  preservation belong to the importer workflow, not the field guide.

The export at this snapshot contains 520 variables in five modes, 102 text style
choices and eight effect styles. These are a dated snapshot, not promised
minimums. Native evidence covers local UNDRR; other brands, RTL, shared
publishing and novice handoff still have separate checks. This review made no
native Figma writes or new acceptance claims.

## Validation and inherited follow-up

The field-guide build produces 202 tokens and five property bundles. Scoped
ESLint, Prettier, JavaScript syntax and whitespace checks pass. The Figma export
build and `--check` pass without output drift.

All 47 parent `dev/mock-*.cjs` harnesses were run individually. Forty-four pass,
including the kit, Welcome, layout, navigation, Card/Hero, planned inventory,
importer and UI harnesses. Three inherited harnesses fail:

| Harness                                         | Assertion                                                                                                                   | Follow-up                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `mock-editorial-contracts.cjs:161`              | Expects zero errors after mutating a DIRECT Editorial label's decoration offset; gets the source-owned Label state refusal. | Reconcile the fixture with the exact source contract.                          |
| `mock-segmented-canonical-capabilities.cjs:124` | Expects a duplicate-ownership rejection for an inherited instance; no rejection occurs.                                     | Reconcile the fixture with inherited-instance ownership handling.              |
| `mock-segmented-wrapper.cjs:40`                 | Expects 418 exported variables; the current export has 520.                                                                 | Replace the obsolete global count assertion with the intended family contract. |

No Figma source, exporter or harness file differs from the merged parent.
These failures are recorded for its owner rather than treated as passing native
acceptance. The synthetic harnesses do not prove native layout or rendering.

The new Figma route was visually reviewed on desktop and at 390px, with no
horizontal overflow. All four integration routes still show their appropriate
panels and code examples. UNDRR desktop and mobile axe scans have zero
violations; symbol navigation retains incomplete automated contrast checks.
The filtered browser print view has ten complete chapter pages, including the
new Figma instructions, readiness panel and handoff footer on one page. An
unfiltered token appendix remains longer.
