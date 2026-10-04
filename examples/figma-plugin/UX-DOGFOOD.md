# Kit usability review

Date: 4 October 2026. A UX designer agent exercised the real Free/UNDRR desktop file. This is expert dogfooding, not a human novice acceptance study. The review used normal navigation and two fresh Assets instances; it did not import, rebuild or edit main components.

## Observed journeys and changes

| Journey                 | Observation                                                                                                                                                        | Applied response                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Find your way around    | Welcome is readable and matches the six actual Layers destinations.                                                                                                | Preserve the actual-name contents and reading order.                                                                                                                                   |
| Insert Card or Hero     | Assets shows leaf names such as Vertical, Background and Split alongside unrelated results. Clicking inserts at the current viewport centre and can cover a guide. | Onboarding explains local-file selection, those tile names, F to draw a personal frame and dragging into it.                                                                           |
| Understand availability | Core, new scaffolds and planned entries are distinguished, but “source scaffold” is specialist wording.                                                            | Use “Draft component” in consumer-facing status, retaining the internal source-scaffold metadata and explicit acceptance limits.                                                       |
| Read usage guidance     | Wide main-component sets cause very long guidance lines. Desktop Hero specimens exceed the earlier 736px nominal review board.                                     | Cap family body guidance at 720px and fit the review grid/board around its specimens. Component internals remain unchanged.                                                            |
| Edit a Card             | Fresh 300px Card title and nested action edits work. Optional labels can hide and restore.                                                                         | Preserve the instance for a scoped rebuild/restart check.                                                                                                                              |
| Edit a Hero             | Section/Desktop to Page/Phone switching retains edited title and first action. The second action hides and restores its original label.                            | Preserve the Page/390px instance for the same update check. Broader state/width contracts remain open.                                                                                 |
| Find source examples    | Hero's exact public source link is available after loading JSON, but manual selection in Diagnostics is cumbersome.                                                | Add Source examples beside Browse component. It opens references for the selected family without a native mutation. Public revision and native correspondence remain explicit caveats. |
| Replace media           | Upload is reachable after expanding nested layers, but the path is undisclosed.                                                                                    | Family guidance and the status document give exact image-frame paths. Image replacement was not executed by this review.                                                               |
| Read planned entries    | Fitting the whole catalogue produces a 21% overview.                                                                                                               | Explain selecting one row and pressing Shift+2 to read it. Entries remain documentation-only.                                                                                          |
| Maintain the file       | Workspace ownership guidance is clear. Core selection can clip its upper controls at 600×740.                                                                      | Put guidance/organisation actions in Diagnostics > Kit maintenance, keep Core presets/search/count/Build together, and permit deliberate panel scrolling when results are expanded.    |

## Preservation evidence

The two temporary PAGE consumers are Card `31:6493` and Hero `31:6508`. The Card has an edited title and nested action with labels restored. The Hero uses Page heading and the 390px preset, with edited title/first action and the second action restored.

The first normal scoped rebuild after the presentation changes creates zero nodes, updates 2,108 and reports zero errors. Independent comparison passes 5,881 checks: all 40 consumer records and all 583 foundation records match the settled baseline exactly. All 383 canonical mains and their 3,654 descendant records preserve local component fields, excluding world bounds/ancestry as the containing boards move. The 56 Card/Hero main descriptions change deliberately to the current guidance. All 32 guidance blocks fit at 720px; the four Card/Hero review boards fit their desktop specimens at 1,328px.

After plugin restart, the same scope creates zero nodes, updates 2,136 and reports zero errors. All 40 edited consumer records and 583 foundation records remain exact. All 383 canonical mains and their 3,654 descendant records preserve every saved local component field when presentation x/y, absolute bounds and ancestry are excluded. The strict whole-scene comparison records 14 tiny generated placement/bounds differences, at most 0.00390625px. It is not a claim of byte-identical scene geometry.

The final targeted expert recheck passes at 600×740: collapsed Core shows presets, search, counts, two family rows, refresh and Build. Expanding the real two-line file-load result permits scrolling to Build. Filtering and keyboard focus retain selection. The Hero shortcut opens the matching source reference controls with their revision caveat. Usage opens at 100% with 720px guidance and a 1,328px review containing the desktop specimen. Page/Section, media paths, workspace ownership and planned-row Shift+2 instructions are readable. A long build receipt is covered by UI/runtime tests, not this native recheck.

Cleanup removes exactly the two temporary roots and their 40 records. All 9,407 retained scene records and foundations match the restart inspection exactly. The independent typography audit passes 32 families and 859 canonical TEXT with zero gaps. Start here is unobstructed, the plugin is closed and the six destinations are collapsed. A fresh local backup is saved; cloud sync and persistent opening view remain unconfirmed.

A human novice handoff, public browser-link opening, the full colour/viewport render matrix, media replacement in these two consumers and arbitrary responsive content remain outside this review.

## Exact media paths

- Card: instance > `mg-card / source layout` > `mg-card__visual`.
- Background Hero Desktop: instance > `mg-hero / background image`.
- Background Hero Phone: instance > `mg-hero / mobile composition` > `mg-hero / banner image`.
- Split Hero: instance > `mg-hero__split-grid mg-container` > `mg-hero__media`.

Select the image frame, then open its Image fill and choose Upload from computer. Keep the consumer linked. Choose Heading Page for h1 or Section for h2; resizing alone does not change the declared viewport preset.

## Follow-up

Test with an unfamiliar designer before promoting this exploratory kit to a supported shared library. Observe orientation, choosing a local asset, inserting into a personal frame, editing nested actions, selecting declared Page/Section presets, interpreting planned entries and updating safely. The expert review establishes concrete usability findings and bounded editor behaviour; it does not substitute for that handoff.
