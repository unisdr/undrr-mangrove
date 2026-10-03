# Editorial atlas direction and implementation

The user requested a design-studio critique of the applications screenshot on
3 October 2026, then asked to apply the recommendation. The studio reviewed the
screenshot, the current guide and DELTA’s local brand-book/lookbook references.

The finding: the guide’s introduction and nested frame claimed more attention
than its applications. The artwork began near y=535 in the supplied screenshot,
and the fixed navigation obscured its lower edge and Sendai rule. The studio
recommended an editorial visual atlas with compact headings, complete objects,
asymmetric exhibit columns and restrained marginal notes.

## Implemented changes

| Before                                                   | After                                                                                                                             |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Large two-line chapter headline and long introduction    | A 34px “Applications” heading and one sentence; strongest display typography stays inside the communication                       |
| Grey backdrop, rounded white page and padded beige stage | One white screen surface for the applications chapter; stage padding/background removed and the object keeps its own edges/shadow |
| Four outlined format buttons with repeated ratio text    | Underlined format buttons with 44px minimum hit areas, pressed/control associations and a separate format label                   |
| A smaller object alongside a lengthy sidebar             | At 1632 × 940, a 920 × 482px social card beside a 280px notes column, separated by a thin rule; centred A4 spread                 |
| Ownership explanation competes with the object           | Three compositional notes in the margin; full sources and ownership remain in an expandable section below                         |
| Large fixed navigation overlaps the artwork              | Compact white folio/navigation, reserved scroll space and viewport-height sizing for shorter desktop screens                      |
| A second slogan in the social signature                  | The unchanged UNDRR logo, clear space and explicit concept label carry ownership                                                  |
| Mobile signature conceals its concept label              | Concept label remains visible; reflowed format labels update on viewport changes                                                  |
| Removing mobile line breaks joins headline words         | Explicit spaces preserve the full sentence when the social headline reflows                                                       |
| Shallow mobile learning photo                            | A taller, upward-biased crop preserves the participants’ faces and community context                                              |
| Screen and print treatments share every shell change     | Editorial screen styling is chapter-scoped; existing all-chapter print treatment stays independent                                |
| Edition 02 and an initial nine-page counter              | Edition 03 and a ten-chapter initial counter; earlier review/validation records remain available                                  |

Implementation lives in `index.html`, `guide.css` and `guide.js`. The body’s
`data-chapter` identifies the active screen chapter; switching away restores
the other chapters’ existing shell. The responsive format labels use one media
query listener attached after the guide has loaded. No artwork, token or shared
component was changed.

## Review and verification

The studio reviewed desktop social, short-screen web and mobile learning
captures after implementation and found no material blockers. It confirmed
that the compositions lead, the Sendai rule is visible, ownership is clearer
and the mobile sequence reads naturally. Its optional crop refinement was
also applied to mobile learning.

- All four complete objects fit above navigation at 1632 × 940, 1440 × 900
  and 1366 × 768. At the reference size, the social card begins at y=300 and
  ends at y=782; navigation begins at y=875.
- Axe 4.12 reports zero violations for all four formats across all five
  properties, and for all four UNDRR formats at 390px. Existing incomplete
  symbol contrast checks still require human review.
- Mobile formats have no horizontal overflow or broken images. Enter activates
  format buttons; contents/Escape and chapter-arrow navigation work. Changing
  chapter restores the original screen background.
- Browser print with the A4 application and a one-token appendix filter still
  produces ten complete chapter pages. The revised applications page was
  rendered and inspected.
- Build, scoped ESLint, Prettier, syntax and Git whitespace checks pass.

This iteration keeps the previous [brand review](BRAND-REVIEW.md) and
[image provenance](assets/README.md) boundaries. The layouts are exploratory
communications; no new institutional identity approval is implied.
