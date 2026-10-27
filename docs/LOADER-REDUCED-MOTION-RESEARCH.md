# Loader under reduced motion: decision and research record

Status: static-default design decision for unisdr/undrr-mangrove#1368, superseding the provisional slow-rotation exception recorded in unisdr/undrr-mangrove#1367. The proposed participant study below was not conducted. Close the implementation ticket only after the new treatment and its regression checks have landed; do not record the study as completed.

## Decision for 2.1

Replace the shared Loader's reduced-motion rotation with a deliberately static dashed ring. Non-decorative Loaders show their translated label visibly in normal flow, with wrapping in narrow contexts. Decorative Loaders remain icon-only and require visible pending text and an announcement owner from their caller. Keep normal-motion rotation, the existing label/announcement contract, forced-colour visibility and application-owned completion/error states.

This removes an optional motion exception whose comfort had not been evaluated. It is a design decision, not a claim that every person understands or prefers the new treatment. The [CSS reduced-motion technique](https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html) and [media-feature guidance](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion) support responding to the preference by removing non-essential motion. They do not establish that every loading spinner violates WCAG or that a particular static design is validated.

The retained legacy search-spinner CSS is a separate compatibility path pending a consumer migration audit. This decision removes the shared Loader exception; it does not claim that every external or legacy loading indicator has been migrated.

Acceptance requires visible pending text, no Loader animation under reduced motion, unchanged normal-motion rotation, usable default/inline and CSS-only patterns, translated and long labels, RTL, forced colours both alone and combined, and correct behaviour when the preference changes while mounted. Verify Gallery and search consumers as well as the standalone component. Automated checks establish these observable behaviours, not user comfort or comprehension.

## Optional future evaluation (not conducted)

The original qualitative study plan follows as a record and a possible basis for future work. It is not a prerequisite for removing the unvalidated rotation exception. If user feedback identifies ambiguity, discomfort or a lost loading state, open a focused follow-up and revise the design. Any future participant study needs an owner, recruitment and actual observations; none are implied here.

## Participants and comparison

Plan a first qualitative round with six to eight adults who already choose reduced motion, including people who describe sensitivity to interface motion. Seek variation in device, magnification and assistive technology use; do not require a diagnosis or collect medical history. Record gaps in this small sample rather than treating it as representative of everyone.

Compare two prototypes in the same layout with identical labels, timing and outcomes:

- The previous slow-rotation treatment, beside visible loading text, only if participants are comfortable trying it. It is no longer the shared reduced-motion default.
- A designed still indicator beside the same text, clearly different from success and failure states. Use the existing static indeterminate ProgressBar where the layout accommodates it; for an inline slot, prototype a meaningful still shape rather than freezing a spinner frame.

Agree the test conditions with each participant. Explain that motion is optional, provide a still preview first, and let them skip the moving condition or stop immediately. For participants comfortable trying both, vary their order to reduce ordering effects. A skipped or stopped moving condition is relevant evidence; it is not a failed participant task. Keep keyboard and screen-reader semantics equivalent between candidates so those differences do not confound the visual comparison.

## Tasks and observations

Use a small local prototype with controlled responses, without depending on a live service. Ask participants to:

1. Request search results, then describe what is happening during a short wait and recognise when results arrive.
2. Continue reading retained results during a longer wait, then find a newly available result. Observe whether the indicator distracts them or disrupts their place.
3. Encounter an explicitly timed-out request and choose the offered recovery action. Distinguish pending, failed and completed states from application messages, never from whether an indicator happens to move.

Use brief and longer waits, for example two and eight seconds, only as prototype scenarios, not performance targets. Let participants use their usual reduced-motion setting and preferred display/assistive technology configuration. Include at least one narrow viewport and check combined forced colours separately before sessions.

Record task outcome, state interpretation before prompting, unnecessary repeated activation, lost place, assistance needed and the participant's own comfort/distraction account. Ask which version they would choose for everyday use and why. Do not infer comfort from task speed or from an absence of complaints.

## Decision and completion criteria

Before sessions, agree these qualitative decision rules:

- Participants can distinguish pending, completed and failed work and recover from failure without facilitator correction. Any consequential misunderstanding triggers a design revision and another check.
- Do not recommend a moving reduced-motion default when a participant reports unacceptable discomfort or needs to stop that condition. Investigate a still default or a suitable still alternative; do not average the report away.
- A still candidate must preserve understandable progress, focus, readable labels and reliable announcements. If it falls short, revise those cues before concluding that motion is required.

The deliverable is a short findings record: participant coverage without identifying details, prototype versions, observations, unresolved cases and a named decision owner. State whether to retain or revise the static treatment, and link any implementation work with its compatibility and documentation implications. If a separate research ticket is opened, keep it open until participants have actually been recruited and observations support a decision. A six-to-eight-person round can guide the next design decision; it cannot prove universal tolerance.
