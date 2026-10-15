# Loader under reduced motion: research brief

Status: proposed study, not conducted. Tracked by unisdr/undrr-mangrove#1368, following the release review disposition in unisdr/undrr-mangrove#1367 and the interface quality review, unisdr/undrr-mangrove#1280. The research ticket remains open after the release review is resolved. A product/design owner must arrange participants and record the resulting decision; no recruitment or participant findings are implied by this brief.

## Question and current release disposition

Can people who request reduced motion understand ongoing work comfortably with the current slow Loader, and would a deliberately designed still indicator serve them better?

For 2.1, retain the existing documented Loader exception: rotation takes three times the normal cycle duration (`2.7s` by default). The open research is a follow-up, not a claim of validated comfort or a release blocker solely because the study has not happened. Do not extend the exception to new bespoke indicators. Keep the [motion guidance](MOTION.md#keep-progress-understandable) and the existing labelled static ProgressBar option available to authors. This brief changes no Loader runtime behaviour.

A concrete report of unacceptable discomfort or an inability to identify the current state should reopen this disposition. Automated checks can establish timing, visibility and semantics, but cannot settle comfort or comprehension.

## Participants and comparison

Plan a first qualitative round with six to eight adults who already choose reduced motion, including people who describe sensitivity to interface motion. Seek variation in device, magnification and assistive technology use; do not require a diagnosis or collect medical history. Record gaps in this small sample rather than treating it as representative of everyone.

Compare two prototypes in the same layout with identical labels, timing and outcomes:

- The shared Loader at its current reduced-motion speed, beside visible loading text.
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

The deliverable is a short findings record: participant coverage without identifying details, prototype versions, observations, unresolved cases and a named decision owner. State whether to retain, replace or constrain the current exception, and link any implementation work with its compatibility and documentation implications. Keep the research open if participants have not been recruited or observations are inconclusive. A six-to-eight-person round can guide the next design decision; it cannot prove universal tolerance.
