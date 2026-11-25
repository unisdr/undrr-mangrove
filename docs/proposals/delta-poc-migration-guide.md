# Delta PoC Migration Guide (v0.7.2 → Shared DTCG 2025.10 Contract)

This guide is for **Anders** (and any code/design-token tooling such as **Claude Code**) to migrate the Delta v0.7.2 proof of concept onto the agreed shared Mangrove–Delta DTCG 2025.10 contract.

## 1. We Already Migrated Your v0.7.2 JSON

You do **not** need to hand-convert `tokens.json` from v0.7.2. All 111 typed values from your 17 November 2026 handoff ([`delta-v0.7.2.dtcg.tokens.json`](delta-v0.7.2.dtcg.tokens.json)) have already been migrated into:

- **Ready-to-use Delta DTCG 2025.10 file:** [`delta-shared-contract.dtcg.tokens.json`](delta-shared-contract.dtcg.tokens.json) _(122 tokens, zero legacy Mangrove clutter, self-contained)_
- **Matching Mangrove / UNDRR DTCG 2025.10 file:** [`mangrove-shared-contract.dtcg.tokens.json`](mangrove-shared-contract.dtcg.tokens.json) _(same shared schema, UNDRR values)_
- **Plain-English token reference:** [`shared-token-specification.md`](shared-token-specification.md)

Every Delta colour, font, spacing, radius, shadow, motion, layout, and target-size value stays **visually identical** to v0.7.2. Only a small set of token paths changed so Mangrove and Delta can share one specification across all UNDRR brands.

---

## 2. Exact Rename & Addition Map (v0.7.2 → Shared Contract)

| Category           | Original v0.7.2 path                           | New shared contract path                                      | Notes                                                                                                                                                                        |
| ------------------ | ---------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surface ramp       | `primitive.warm.{50,100,200,300,400,700,1000}` | `primitive.surface.{50,100,200,300,400,700,1000}`             | Hue-neutral name so cool UNDRR brands fit cleanly                                                                                                                            |
| Brand primary      | `primitive.accent.{100..1100}`                 | `primitive.brand.primary.{100..1100}`                         | Grouped under `brand` to make room for secondary brand colours                                                                                                               |
| Brand secondary    | _(none)_                                       | `primitive.brand.secondary.{600,700}`                         | Set to UNDRR teal (`#007B7A` / `#006968`) in Delta 2027                                                                                                                      |
| Neutral ramp       | `primitive.neutral.{100..1100}`                | `primitive.neutral.{50,100..1100}`                            | Step `50` (`#F0F3F6`) added for cross-brand parity                                                                                                                           |
| Disabled ink       | `semantic.text.placeholder`                    | `semantic.text.disabled`                                      | **Important:** keep `#9BA3B8` for disabled/decorative text only; style actual `<input>` placeholders with `semantic.text.secondary` (`#5E5D59`) so placeholders pass WCAG AA |
| Disabled fill      | _(shared `semantic.background.inset`)_         | `semantic.background.disabled`                                | Decoupled from row hover (`inset`); set to `{primitive.surface.100}`                                                                                                         |
| Toast surface      | _(prose spec: `primitive.neutral.900`)_        | `semantic.background.toast`                                   | Promoted to a formal semantic token                                                                                                                                          |
| Selected row tint  | _(prose spec: `primitive.accent.100`)_         | `semantic.action.selected`                                    | Promoted to `{primitive.brand.primary.100}`                                                                                                                                  |
| Secondary action   | _(none)_                                       | `semantic.action.secondary`, `semantic.action.secondaryHover` | Backed by `primitive.brand.secondary.{600,700}`                                                                                                                              |
| Inverse focus ring | _(none)_                                       | `semantic.focus.ringInverse`                                  | White focus ring (`{semantic.text.inverse}`) for dark surfaces                                                                                                               |
| Type scale         | `typography.scale.11`                          | `typography.size.caption`                                     | `11px` in Delta (`11.25px` in UNDRR)                                                                                                                                         |
| Type scale         | `typography.scale.12`                          | `typography.size.label`                                       | `12px` in Delta (`12.5px` in UNDRR)                                                                                                                                          |
| Type scale         | `typography.scale.14`                          | `typography.size.body`                                        | `14px` in Delta (`16px` in UNDRR)                                                                                                                                            |
| Type scale         | `typography.scale.16`                          | `typography.size.subheading`                                  | `16px` in Delta (`18px` in UNDRR)                                                                                                                                            |
| Type scale         | `typography.scale.20`                          | `typography.size.title`                                       | `20px` in Delta (`23px` in UNDRR)                                                                                                                                            |
| Type scale         | `typography.scale.24`                          | `typography.size.kpi`                                         | `24px` in Delta (`32px` in UNDRR)                                                                                                                                            |
| Type scale         | `typography.scale.30`                          | `typography.size.display`                                     | `30px` in Delta (`40px` in UNDRR)                                                                                                                                            |
| Font weight        | `typography.weight.{regular,medium,semibold}`  | `typography.weight.{regular,medium,semibold,bold}`            | `bold` (`700`) added to shared scale                                                                                                                                         |
| Spacing            | `spacing.{1,2,3,4,6,8,12,16}`                  | `spacing.{2xs,xs,sm,md,lg,xl,2xl,3xl}`                        | `4, 8, 12, 16, 24, 32, 48, 64px` in Delta                                                                                                                                    |

**Everything else kept its exact v0.7.2 path:**
`semantic.background.{default,surface,inset,overlay}`, `semantic.border.{default,subtle,strong,control}`, `semantic.text.{primary,secondary,inverse}`, `semantic.action.{default,hover,active,disabled}`, `semantic.status.*`, `semantic.focus.ring`, `typography.font.{sans,mono}`, `typography.lineHeight.{tight,normal}`, `radius.{sm,md,lg,xl,full}`, `shadow.{sm,md,lg}`, `motion.duration.{fast,normal,slow}`, `motion.easing.{default,in,out}`, `layout.maxWidth`, and `accessibility.targetMin`.

---

## 3. Code & CSS Wiring Examples

If your PoC generates CSS custom properties (`--*`) or reads the JSON tokens in JS/TS:

```css
/* Before (v0.7.2 paths) */
.delta-field {
  font-size: var(--typography-scale-14);
  padding: 0 var(--spacing-3);
  border: 1px solid var(--semantic-border-control);
}
.delta-field::placeholder {
  color: var(--semantic-text-placeholder); /* failed WCAG AA at 2.52:1 */
}
.delta-field:disabled {
  background: var(--semantic-background-inset);
  color: var(--semantic-text-placeholder);
}

/* After (shared contract — same names used in Mangrove's .mg-theme-delta-2027) */
.delta-field {
  font-size: var(--mg-typography-size-body);
  padding: 0 var(--mg-spacing-sm);
  border: 1px solid var(--mg-semantic-border-control);
}
.delta-field::placeholder {
  color: var(--mg-semantic-text-secondary);
}
.delta-field:disabled {
  background: var(--mg-semantic-background-disabled);
  color: var(--mg-semantic-text-disabled);
}
```

---

## 4. Drop-In Claude Code Prompt for Your PoC

Replace your PoC's `tokens.json` with [`delta-shared-contract.dtcg.tokens.json`](delta-shared-contract.dtcg.tokens.json) (and keep [`shared-token-specification.md`](shared-token-specification.md) nearby for reference), then paste this prompt into Claude Code:

```text
We are migrating our Delta v0.7.2 proof of concept to the shared Mangrove–Delta DTCG 2025.10 token contract.
I have replaced our token file with delta-shared-contract.dtcg.tokens.json (documented in shared-token-specification.md).

Please update our token build/loader, CSS/Tailwind/Style Dictionary config, and all component styles to use the new paths:
1. Read standard DTCG 2025.10 values ($value / $type; sRGB colour components in 0..1 floats, dimensions as { value, unit }, etc.).
2. Update primitive.warm.* -> primitive.surface.* and primitive.accent.* -> primitive.brand.primary.* (and add primitive.brand.secondary.*).
3. Update semantic.text.placeholder -> semantic.text.disabled, and ensure visible <input>/<textarea> placeholders use semantic.text.secondary while disabled controls use semantic.text.disabled + semantic.background.disabled.
4. Adopt semantic.background.toast, semantic.action.selected, semantic.action.secondary, semantic.action.secondaryHover, and semantic.focus.ringInverse where components previously hardcoded or referenced primitives directly.
5. Update typography.scale.{11,12,14,16,20,24,30} -> typography.size.{caption,label,body,subheading,title,kpi,display}.
6. Update spacing.{1,2,3,4,6,8,12,16} -> spacing.{2xs,xs,sm,md,lg,xl,2xl,3xl}.
7. Verify that all rendered colours, sizes, and spacings match v0.7.2 visually and that no references to the old keys remain.
```
