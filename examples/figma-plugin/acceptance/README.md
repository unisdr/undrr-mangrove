# Maintenance acceptance preparation

Prepared 5 October 2026. These are review and rehearsal materials for occasional maintenance. They do not expand component scope or pass any native, human or merge gate. The existing consolidated handoff ZIP and `.fig` backups remain unchanged.

| Work              | Prepared material                                                                                | Remaining acceptance                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Reduced merge     | [Exact-base review](REDUCED-REVIEW.md), reproducible patch generator                             | Reviewer selection and acceptance; feature PR still contains the full spike                            |
| Changed styles    | [Separate text/effect rehearsals](STYLE-REHEARSAL.md), changed/restoration DTO generator         | Native baseline, selective publication, consumer uptake and exact restoration                          |
| Recovery geometry | [Native trace procedure](RECOVERY-TRACE.md), guarded runtime generator and inspection comparator | Actual ordinary Button trace; demonstrated cause; two ordinary zero-create exact repeats after any fix |
| Designer handoff  | [Novice worksheet](NOVICE-WORKSHEET.md)                                                          | Actual uncoached human observations and receiving-team receipt                                         |

Read [MAINTENANCE](../MAINTENANCE.md), [the split](../MAINTENANCE-SPLIT.md) and [MVP handoff](../MVP-HANDOFF.md) first. Preparation tools live under `dev/` on the retained spike; they are not additions to the reduced merge manifest.

Use a fresh external output directory for each command. Outputs include deliberately changed test definitions; do not substitute them for normal bundled source. Native automation currently captures screenshots but fails interaction with `window_not_focused`, reporting no focused window. Recheck controls after reboot before installing instrumentation.
