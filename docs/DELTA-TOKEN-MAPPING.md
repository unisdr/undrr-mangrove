# Delta v0.7.2 → Shared Contract Mapping

Mapping between Anders's Delta v0.7.2 design handoff (received 17 November 2026), Mangrove's existing CSS custom-property adapters, and the proposed shared DTCG 2025.10 semantic contract tracked by [#1495](https://github.com/unisdr/undrr-mangrove/issues/1495).

For the full side-by-side Mangrove vs. Delta DTCG specification and Anders's v0.7.2 migration table, see [Proposed shared token contract](proposals/delta-token-exchange.md).

## Shared Contract Groups

Both [`tokens/mangrove.tokens.json`](../tokens/mangrove.tokens.json) (+ [`tokens/undrr.tokens.json`](../tokens/undrr.tokens.json)) and [`tokens/delta-2027.tokens.json`](../tokens/delta-2027.tokens.json) author the same top-level contract:

- `primitive`: `neutral`, `surface` (was `warm`), `brand.primary` (was `accent`), `brand.secondary`, `green`, `amber`, `red`
- `semantic`: `background` (`default`, `surface`, `inset`, `disabled`, `overlay`, `toast`), `border` (`default`, `subtle`, `strong`, `control`), `text` (`primary`, `secondary`, `disabled`, `inverse`), `action` (`default`, `hover`, `active`, `disabled`, `selected`, `secondary`, `secondaryHover`), `status` (`positive`, `warning`, `critical`, `informational`), `focus` (`ring`, `ringInverse`)
- `typography`: `font.{sans,mono}`, `size.{caption,label,body,subheading,title,kpi,display}`, `weight`, `lineHeight`
- `spacing`: `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`
- `radius.{sm,md,lg,xl,full}`, `shadow.{sm,md,lg}`, `motion.{duration,easing}`, `layout.maxWidth`, `accessibility.targetMin`

In `mangrove.tokens.json` and `undrr.tokens.json`, these shared groups are marked `private: true` for CSS emission so the five existing brand CSS bundles remain 100% byte-identical while [`scripts/build-tokens.cjs`](../scripts/build-tokens.cjs) exports the full shared contract to `dist/tokens/*.tokens.json`. In `delta-2027.tokens.json`, they emit directly as `--mg-semantic-*`, `--mg-typography-*`, `--mg-spacing-*`, `--mg-radius-*`, `--mg-shadow-*`, `--mg-motion-*`, `--mg-layout-max-width`, and `--mg-accessibility-target-min`.

## Mapping to Legacy Mangrove CSS Roles

Existing Mangrove components still read legacy `--mg-color-*`, `--mg-surface-*`, `--mg-form-input-*`, and `--mg-font-size-*` custom properties. `delta-2027.tokens.json` bridges the shared semantic contract to those existing adapter tokens:

| Shared semantic token | Delta 2027 CSS property | Legacy Mangrove adapter target(s) |
| --- | --- | --- |
| `semantic.background.surface` | `--mg-semantic-background-surface` | `--mg-surface-raised`, `--mg-card-background`, `--mg-form-input-background` |
| `semantic.background.overlay` | `--mg-semantic-background-overlay` | `--mg-color-modal-scrim` |
| `semantic.background.inset` | `--mg-semantic-background-inset` | `--mg-color-button-secondary-background--hover`, `--mg-color-tag-accent` |
| `semantic.background.disabled` | `--mg-semantic-background-disabled` | Disabled inputs, checkboxes, and switches in `_delta-2027-components.scss` |
| `semantic.border.control` | `--mg-semantic-border-control` | `--mg-form-input-border-color`; pilot `--mg-control-border` |
| `semantic.text.primary` | `--mg-semantic-text-primary` | `--mg-color-text`, `--mg-color-button-outline-secondary`; pilot `--mg-control-text` |
| `semantic.text.secondary` | `--mg-semantic-text-secondary` | `--mg-color-secondary`, `--mg-empty-state-text-color`, readable `<input>` placeholders |
| `semantic.text.disabled` | `--mg-semantic-text-disabled` | Disabled/decorative ink only (renamed from v0.7.2 `semantic.text.placeholder`) |
| `semantic.text.inverse` | `--mg-semantic-text-inverse` | `--mg-color-button`, `--mg-color-text-button`, `--mg-color-hero-title` |
| `semantic.action.default` | `--mg-semantic-action-default` | `--mg-color-interactive`, `--mg-border-color-button`, `--mg-notice-action-secondary`; pilot `--mg-control-accent` |
| `semantic.action.hover` | `--mg-semantic-action-hover` | `--mg-color-interactive-active`, `--mg-color-button-background--hover` |
| `semantic.status.critical.text` | `--mg-semantic-status-critical-text` | Notice negative tone; pilot `--mg-control-error` |
| `semantic.focus.ring` | `--mg-semantic-focus-ring` | `--mg-color-focus-ring`, `--mg-color-form-focus` |
| `typography.size.{caption..display}` | `--mg-typography-size-*` | `--mg-font-size-button`, `--mg-font-size-form-input`, `--mg-font-size-tab` |
| `spacing.{2xs..3xl}` | `--mg-spacing-*` | `--mg-card-padding`, `--mg-padding-button`, `--mg-form-input-padding` |

## Component Work Beyond Aliasing

The Delta 2027 theme rules in [`stories/assets/scss/_delta-2027-components.scss`](../stories/assets/scss/_delta-2027-components.scss) also handle behaviour and geometry differences that token values alone cannot express:

- Selected options use a checkmark rather than a tinted selected fill in React Aria custom selects (verified in the separate [#1088](https://github.com/unisdr/undrr-mangrove/pull/1088) ComboBox proof).
- Fields use Delta's 1px inset focus treatment rather than an offset ring, and explicit disabled surface/text tokens rather than whole-control opacity.
- Legacy `--mg-color-*` three-channel adapters (`45 111 163`) are computed from `{semantic.*}` at build time so components using `rgb(var(--mg-color-interactive) / <alpha>)` continue working seamlessly alongside direct `--mg-semantic-*` consumers.
