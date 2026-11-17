# Delta v0.7.2 mapping inventory

First-pass mapping for the Delta token handoff received on 17 November 2026, tracked by [#1495](https://github.com/unisdr/undrr-mangrove/issues/1495). This is an integration plan for the separate Delta 2027 theme, not an approved change to existing themes.

The inventory covers all 30 `semantic` colour tokens. Primitive palettes and the prose component specifications are excluded. Counts describe existing-role coverage, not implementation effort or the quality of Delta's data.

| Outcome | Count |
| --- | --- |
| Existing target, requiring naming/format/value mapping | 10 |
| Related component role, requiring meaning/scope agreement | 13 |
| No dedicated shared counterpart identified | 7 |

## Existing targets

All Delta names below are relative to `semantic`. An existing component property is a possible adapter target, not proof of a universal shared role.

| Delta role | Existing target or use |
| --- | --- |
| `background.surface` | `--mg-surface-raised` and the field/card surface properties. |
| `background.overlay` | `--mg-color-modal-scrim`. |
| `border.control` | `--mg-form-input-border-color`; pilot `--mg-control-border`. |
| `text.primary` | `--mg-color-text`; pilot `--mg-control-text`. |
| `text.secondary` | Supporting-copy properties such as `--mg-empty-state-text-color`. |
| `text.inverse` | Inverse-facing button/text properties; centralising the role remains useful. |
| `action.default` | `--mg-color-interactive`; pilot `--mg-control-accent`. |
| `action.hover` | `--mg-color-interactive-active`, despite its current name. |
| `status.critical.text` | Validation/error colour; pilot `--mg-control-error`. |
| `focus.ring` | `--mg-color-focus-ring`. |

The pilot properties belong to the proposed ComboBox integration in [#1088](https://github.com/unisdr/undrr-mangrove/pull/1088); they are not part of this foundation branch.

## Related roles needing a decision

| Delta role | Reconciliation needed |
| --- | --- |
| `background.inset` | Pilot hover/selection roles cover part of its use; Delta also applies it to navigation and disabled controls. |
| `text.placeholder` | Delta restricts it to decorative/disabled content. The pilot's muted role styles actual placeholders, so these purposes cannot be blindly joined. |
| `status.positive.text` | Notice's positive icon colour is related; ordinary copy colour is a separate decision. |
| `status.positive.background` | Notice positive background is currently component-local and palette-derived. |
| `status.positive.border` | Notice positive border is component-local and palette-derived. |
| `status.warning.text` | Related warning icon/indicator colour; decide which copy should use it. |
| `status.warning.background` | Related Notice warning background. |
| `status.warning.border` | Related Notice warning border. |
| `status.critical.background` | Related Notice negative background. |
| `status.critical.border` | Related Notice negative border. |
| `status.informational.text` | Related Notice informational icon colour; distinguish it from body copy. |
| `status.informational.background` | Related Notice informational background. |
| `status.informational.border` | Related Notice informational border. |

These can become shared semantic roles or stay in a Delta-specific adapter. Components only need to consume the roles relevant to them.

## Additional roles

No dedicated shared counterpart was identified for:

- `background.default`, a page-background role.
- `border.default`, `border.subtle` and `border.strong`, separate decorative border strengths.
- `action.active`, a pressed colour distinct from hover.
- `action.disabled`, an explicit disabled-action colour.
- `status.critical.hover`, a destructive-action hover colour distinct from ordinary actions.

Existing CSS can express these values. The question is where to define and consume them. Different palette, spacing, type or density values are expected theme variation, not missing capabilities.

## Component work beyond aliasing

The first integration should verify the supplied specification against actual rendering:

- Selected options need a checkmark without a selected fill; the pilot currently renders a label with tinted fill and heavier text.
- Fields need Delta's inset focus treatment rather than an offset ring.
- Disabled controls need explicit fill/text treatment rather than whole-control opacity.

The full component inventory, source-generation workflow and interpretation questions remain part of Delta 2027 implementation planning. This list does not imply that all other components have been verified.
