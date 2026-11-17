# Delta 2027 follow-up review — 17 November 2026

Three agents reviewed the deliverable at `f8fc7df4`: one compared it with the approved issue plan, one examined the architecture, and one applied the local reader-first skill. The review found implementation defects and promised examples that had not yet been delivered. The approved acceptance criteria were retained.

## Findings and corrections

| Finding | Correction and evidence |
| --- | --- |
| Typography tokens were exported, but several components repeated their initial values. Changing the tokens did not change the rendered weight or line height. | Component rules now consume the supplied typography tokens. The browser gate changes the values and checks the resulting headings, buttons, card titles and status labels. |
| Button size/padding adapters were bypassed, and some Select/StatusLabel rules repeated supplied values. | The component rules now use their mapped roles or supplied tokens. The browser gate verifies changes to the button hooks, Select spacing and status text size. |
| Delta's motion tokens were not connected to Mangrove's existing roles. | Fast/medium duration and standard easing now map to the supplied values. Finite button transitions use them; animation-cycle and reduced-motion rules remain separate. |
| Tree labels were 32px high but repeated every 37px; nesting also retained the older indentation. RTL added a further prose-list inset. | Scoped rules remove item margins and clear the shared list inset. Both Chromium checks and independent WebKit measurements now establish actual 16px nesting and 32px row spacing in LTR and RTL. |
| The mobile Dialog retained the browser's maximum width, leaving a gap beside a nominally full-screen dialog. | The theme now resets the maximum inline size. Chromium and WebKit measure 390 × 844 in a 390 × 844 viewport; Escape closes it. |
| The approved standalone token/source-edit examples were missing. | A [plain HTML consumer](http://127.0.0.1:6105/) now reads complete exported JSON without React or the Mangrove component stylesheet. It compares original data with regenerated data after three edits to a temporary source copy. The repository's sources remain unchanged. |
| The temporary ComboBox integration had been deferred despite the approved plan. | A separate proof branch now combines the pilot with Delta 2027. It checks body and wrapper portal arrangements, selection checkmarks, focus, disabled/error states, filtering, keyboard operation and mobile RTL. It does not retarget or publish #1088. |
| The gallery covered eight changed guide families; the other 13 had examples but lacked a recorded visual review. | The [review guide](DELTA-2027-LOCAL-REVIEW.md) now links all 21 families and records the additional desktop/mobile examples and interactions actually checked. Availability and test coverage are distinguished. |

## Architecture decision

Keep the current pipeline: typed source data, brand composition, output adapters, component recipes and complete exchange exports. The review found wiring defects at those boundaries; it did not establish a need for another repository or a compiler rewrite.

The standalone example independently resolves the complete token documents and demonstrates source changes reaching a downstream application. It is a small example consumer, not a replacement general-purpose DTCG library.

## Reproduce the review

- [Theme, component catalogue and browser checks](DELTA-2027-LOCAL-REVIEW.md)
- [Token format, package paths and implementation boundaries](DELTA-2027.md)
- [Isolated ComboBox proof guide](https://github.com/unisdr/undrr-mangrove/blob/khawkins98/delta-2027-combobox-proof/docs/DELTA-2027-COMBOBOX-PROOF.md)
- [Standalone source-edit screenshot](review/delta-2027/token-only-source-edit.png)

The ComboBox source and its evidence live on `khawkins98/delta-2027-combobox-proof`. The core theme and standalone example live on `khawkins98/delta-2027-theme`, in draft PR #1498.

## Validation

The fresh full Jest run passes 223 suites and 5,113 tests, with one existing skip. The production build and the core/standalone browser gates pass. Independent review checked the additional component examples and remeasured the corrected Tree and Dialog layouts in WebKit. The separate ComboBox branch records its own production browser checks and the axe finding below.

## Remaining review boundaries

**An open-popup axe finding needs assistive-technology review.** The proof records an `aria-hidden-focus` report for an outside field while the popup is open. The same report occurs with the unchanged #1088 component. Native Tab closes the popup and removes the hidden state before the next field receives focus; closed-state checks pass. Exact reports and the narrowly scoped test condition are retained in the proof. This is not a completed VoiceOver/NVDA assessment.

**The temporary ComboBox proof is not production integration.** Its portal-container API remains marked unstable upstream. Packaging and adoption still need review before the proven changes enter a production component release.

**Some design differences remain deliberate and visible.** The existing Snackbar keeps its top placement rather than the handoff's bottom toast placement. Native Select keeps its native popup. The implementation guide records the other boundaries, including colour adapters that resolve at build time.

The review does not establish Figma approval, validation in the consuming Delta application, every component variant, or complete accessibility conformance. Those limits do not remove the original issue's acceptance criteria.
