# MVP consumer validation brief

Prepared 5 October 2026. **Not built or accepted.** The separate consumer file exists in the paid Mangrove MVP folder and is empty. Publication is the next dependency, recorded in [paid status](PAID-KIT-STATUS.md). Use actual published components, styles and variables; local copies would not exercise the delivery route.

First enable the published library, insert one Primary/Filled/Default Button and change its Label successfully. Capture its linked source key and rendering before building either page frame. A failed import leaves this first checkpoint open.

## Page to build

Create a UNDRR **Disaster risk resources** page, with desktop and mobile design frames and a small validation appendix. It is an editable design example, not a working website or an accepted responsive template. Use linked whole widgets from the bounded core. Keep Card, Hero, Tabs and Editorial CTA draft assets outside this release.

Use a vertical auto-layout page with readable headings, section spacing from Mangrove variables and published text styles. Show this reading order: page introduction, featured resource action, resource table, framework explanation, email updates. Record each instance's source key, properties, mode and bounds in the local evidence ledger. Do not put native IDs or account details in repository copy.

| Area                  | Initial component and supported preset                                                    | Consumer edits and constraints                                                                                                                                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Introduction          | Published heading and body styles; plain page-owned text                                  | Heading: Disaster risk resources. Body: Practical guidance for understanding risk and strengthening resilience. Page text is consumer-owned.                                                                                                    |
| Featured action       | Text CTA, `Tone=Strong`, `Viewport=Desktop`, `Content=Short`, 720px                       | Retain the declared desktop copy initially. Desktop consumer text edits are deferred in the core contract. Its Button remains a nested linked instance.                                                                                         |
| Resources             | Table, `Size=Large`, `Treatment=Default`, `Content=Story`, 720px                          | Start from the existing four-row source specimen. Probe one exposed nested cell text property in the appendix and accept its rendered result before using edited rows on the page. Arbitrary row counts and widths require separate acceptance. |
| Framework explanation | Details, closed/default, `Typography=MediumUp`, `MeasuredViewport=900`                    | Retain the declared Title and Paragraph on this preset. Use the exact previously tested edit fixture in the appendix: Open, BelowMedium/390 preset at 240px instance width. A state variant does not demonstrate prototype interaction.         |
| Email updates         | Text input, Default, 320px, plus Primary/Filled/Default Button and Published Status Label | Set Label to Email address and Button Label to Subscribe. Probe Help text and optional visibility in the appendix before promoting those edits onto the page. The status is a specimen, not a promise of a functioning subscription service.    |

The desktop content column is 900px; centre the 720px CTA and Table within it. Other page dimensions describe the example composition, not new component width contracts.

For mobile, use a 390px content column. Use the tested Text CTA Mobile preset and the documented 390px Headline edit. Use an unedited Details `BelowMedium/390` specimen; retain the 320px Text input preset. Stack the email action. The desktop Table has no accepted responsive conversion: leave it in the desktop example and record mobile tabular presentation as an open page-pattern gate. A plausible looking crop or stretched instance is not evidence of responsiveness.

## Before publishing an update

Capture a fresh consuming-file baseline after the first insertion and visual review. Record instance IDs, main-component keys, modes, exposed text, nested cell properties, optional label/help visibility, selected variants, bounds and variable/style links. Table-cell edits and Text input Help text/optional-visibility changes are new cross-file validation probes. They are not already accepted published preservation contracts. Keep deliberate consumer edits visible in the appendix:

- An edited Button Label and a non-default supported variant.
- A Text input with edited Label and Help text and one optional element hidden.
- One edited Table cell reached through the supported nested property.
- An edited Details Title and Paragraph on the exact tested Open BelowMedium/390 preset resized to 240px, plus the tested mobile CTA Headline. Other edited Details presets remain unverified.
- Page-owned notes and layout outside the linked components.

## Published update acceptance

1. In the canonical kit, make one bounded source change through its recipe/token workflow. Choose a change with an identifiable rendered difference and capture precisely which mains should change. Retain all native identities; record the source diff and importer receipt.
2. Publish that reviewed change with a precise description. Capture the confirmation and release selection. A local rebuild alone does not update a consumer.
3. In the consumer, review and accept the library update. Capture the update panel and fresh resulting state.
4. Verify the intended change reaches linked instances while edited text, optional visibility, variant selections, nested cell edits, explicit UNDRR mode, source links and page-owned content survive. Inspect rendering as well as properties.
5. If the change was a reversible validation probe, restore through the same source workflow, publish the restoration and accept it in the consumer. Confirm the intended fields return without losing consumer edits. Do not leave a temporary probe as the release state.

Publication, propagation and preservation are separate checks. A failed import or unavailable native update panel leaves this gate open. The expert walkthrough follows a passing consumer build/update; novice handoff remains a separate usability task in [kit architecture](KIT-ARCHITECTURE.md).
