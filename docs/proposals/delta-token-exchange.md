# Shared Mangrove–Delta DTCG 2025.10 Token Specification

**Status: proposed alignment (stacked on [PR #1498](https://github.com/unisdr/undrr-mangrove/pull/1498)) for agreement with Anders and [#1495](https://github.com/unisdr/undrr-mangrove/issues/1495).**

This proposal moves Mangrove and Delta 2027 onto **the exact same DTCG 2025.10 token schema**. Both systems publish the same top-level groups and semantic token paths (`primitive`, `semantic`, `typography`, `spacing.{2xs..3xl}`, `radius`, `shadow`, `motion`, `layout`, `accessibility`) with different brand values, while Mangrove's existing `--mg-*` CSS custom properties and legacy Sass outputs remain 100% unchanged and backwards-compatible.

## Format and DTCG Exchange Files

Both specs conform to the [DTCG 2025.10 format specification](https://www.designtokens.org/tr/2025.10/format/) and are generated from `tokens/*.tokens.json` by [`scripts/build-tokens.cjs`](../../scripts/build-tokens.cjs):

| System | Complete DTCG 2025.10 export | Editable source | Notes |
| --- | --- | --- | --- |
| Mangrove / UNDRR default | [mangrove-default.dtcg.tokens.json](mangrove-default.dtcg.tokens.json) | [`tokens/mangrove.tokens.json`](../../tokens/mangrove.tokens.json) + [`tokens/undrr.tokens.json`](../../tokens/undrr.tokens.json) | Same shared semantic contract; legacy `--mg-*` bundles stay byte-identical |
| Delta 2027 (aligned) | [delta-2027.dtcg.tokens.json](delta-2027.dtcg.tokens.json) | [`tokens/delta-2027.tokens.json`](../../tokens/delta-2027.tokens.json) | Same shared contract with Delta values; emits clean `--mg-semantic-*` / `--mg-typography-*` CSS vars |
| Delta v0.7.2 (historical input) | [delta-v0.7.2.dtcg.tokens.json](delta-v0.7.2.dtcg.tokens.json) | Anders's 17 Nov 2026 handoff (`sha256: e25a55fd...`) | Retained unmodified for diffing and migration |

In CSS, the aligned contract removes the temporary `--mg-delta-2027-*` prefix so Delta components read the shared property names directly:

```css
/* Shared CSS custom property names, themed via .mg-theme-delta-2027 */
.mg-button-primary {
  background-color: var(--mg-semantic-action-default);
  color: var(--mg-semantic-text-inverse);
  border-radius: var(--mg-radius-md);
  font-size: var(--mg-typography-size-body);
}
```

## Same Specification, Different Settings

Every semantic, typography, spacing step, radius, shadow, motion, layout, and accessibility token exists at the same JSON path in both exports:

| Shared DTCG path | Mangrove / UNDRR value | Delta 2027 value |
| --- | --- | --- |
| `semantic.background.default` | `#FFFFFF` (`rgb(255 255 255)`) | `#FAF9F5` (`rgb(250 249 245)`) |
| `semantic.background.inset` | `#F0F3F6` (cool neutral) | `#F0EEE6` (warm surface) |
| `semantic.text.primary` | `#1A1A1A` | `#141413` |
| `semantic.action.default` | `#004F91` (`primitive.brand.primary.600`) | `#2D6FA3` (`primitive.brand.primary.600`) |
| `semantic.action.secondary` | `#EB6834` (UNDRR orange) | `#007B7A` (UNDRR teal) |
| `semantic.focus.ring` | `#866200` (`color.gold-800`) | `#2D6FA3` (`primitive.brand.primary.600`) |
| `typography.font.sans` | `["Roboto", "sans-serif"]` | `["Inter", "system-ui", "-apple-system", "sans-serif"]` |
| `typography.size.body` | `16px` | `14px` |
| `typography.size.title` | `23px` | `20px` |
| `spacing.sm` / `spacing.md` / `spacing.lg` | `12.5px` / `15px` / `24px` | `12px` / `16px` / `24px` |
| `radius.md` / `radius.lg` | `5px` / `5px` | `6px` / `8px` |
| `layout.maxWidth` | `1440px` | `1280px` |
| `accessibility.targetMin` | `24px` | `24px` |

Example DTCG comparison (same schema, brand-specific values):

```json
// mangrove-default.dtcg.tokens.json
{
  "semantic": {
    "action": {
      "default": { "$type": "color", "$value": "{primitive.brand.primary.600}" }
    }
  },
  "typography": {
    "size": {
      "body": { "$type": "dimension", "$value": { "value": 16, "unit": "px" } }
    }
  }
}

// delta-2027.dtcg.tokens.json
{
  "semantic": {
    "action": {
      "default": { "$type": "color", "$value": "{primitive.brand.primary.600}" }
    }
  },
  "typography": {
    "size": {
      "body": { "$type": "dimension", "$value": { "value": 14, "unit": "px" } }
    }
  }
}
```

## Meet-in-the-Middle Sanity Checks

Rather than copying Delta v0.7.2 verbatim or forcing Delta back onto Mangrove's older `--mg-color-*` naming, this contract adopts Delta's semantic hierarchy with targeted multi-brand and accessibility fixes:

1. **Remove the `delta-2027.*` wrapper**: tokens live at `semantic.*`, `typography.*`, `spacing.*`, etc. so any DTCG consumer (such as [`scripts/token-consumer/delta-consumer.mjs`](../../scripts/token-consumer/delta-consumer.mjs)) works identically against both files.
2. **Rename `primitive.warm.*` → `primitive.surface.*`**: neutral surface ramps should not encode a single brand's warm hue in their key name when UNDRR and PreventionWeb use cool neutrals.
3. **Rename `primitive.accent.*` → `primitive.brand.primary.*` + `primitive.brand.secondary.*`** and add `semantic.action.secondary` / `semantic.action.secondaryHover`: Mangrove brands have two brand colours (for example UNDRR blue + orange, or Delta blue + teal).
4. **Rename `semantic.text.placeholder` → `semantic.text.disabled`**: v0.7.2's `#9BA3B8` has `2.52:1` contrast on white, which fails WCAG 1.4.3 for visible `<input>` placeholders. Naming it `disabled` keeps pale ink strictly for disabled/decorative states, while actual placeholders use `semantic.text.secondary`.
5. **Decouple `semantic.background.disabled` from `semantic.background.inset`**: row-hover fills and disabled input backgrounds are separate intents even when Delta happens to set both to `{primitive.surface.100}`.
6. **Role-named type scale (`typography.size.{caption,label,body,subheading,title,kpi,display}`)**: pixel-named `typography.scale.14` breaks across brands where body text is `16px` (UNDRR) vs `14px` (Delta).
7. **T-shirt spacing steps (`spacing.{2xs..3xl}`)**: avoids colliding with Mangrove's legacy `spacing.0..1000` numeric scale while using shared names (`2xs`–`3xl`) across both specs.
8. **Add `semantic.focus.ringInverse`**: supports keyboard focus indicators on dark/hero surfaces alongside `semantic.focus.ring`.

## Migration Guide for Delta (v0.7.2 → Shared Contract)

For Anders and Delta tooling: map future DTCG exports from the original v0.7.2 paths to the shared contract paths below (all unchanged `semantic.background.*`, `semantic.border.*`, `semantic.status.*`, `radius.*`, `shadow.*`, `motion.duration.*`, `motion.easing.*`, `layout.maxWidth`, and `accessibility.targetMin` paths keep their exact v0.7.2 names without a `delta-2027.` wrapper):

| Original v0.7.2 path | Shared contract path | Reason |
| --- | --- | --- |
| `primitive.warm.{50..1000}` | `primitive.surface.{50..1000}` | Hue-neutral name for cool + warm brands |
| `primitive.accent.{100..1100}` | `primitive.brand.primary.{100..1100}` | Supports `brand.primary` + `brand.secondary` |
| `semantic.text.placeholder` | `semantic.text.disabled` | WCAG clarity (`text.secondary` styles placeholders) |
| *(row hover / disabled shared)* | `semantic.background.disabled` | Decoupled from `semantic.background.inset` |
| *(none)* | `semantic.action.selected` | Selected table row / tree item tint |
| *(none)* | `semantic.action.secondary`, `secondaryHover` | Two-colour Mangrove brands |
| *(none)* | `semantic.background.toast` | Toast / tooltip dark surface (`neutral.900`) |
| *(none)* | `semantic.focus.ringInverse` | Inverse focus ring on dark surfaces |
| `typography.scale.11` | `typography.size.caption` | Role-based sizing across 16px / 14px bases |
| `typography.scale.12` | `typography.size.label` | Role-based sizing |
| `typography.scale.14` | `typography.size.body` | Role-based sizing |
| `typography.scale.16` | `typography.size.subheading` | Role-based sizing |
| `typography.scale.20` | `typography.size.title` | Role-based sizing |
| `typography.scale.24` | `typography.size.kpi` | Role-based sizing |
| `typography.scale.30` | `typography.size.display` | Role-based sizing |
| `spacing.{1,2,3,4,6,8,12,16}` | `spacing.{2xs,xs,sm,md,lg,xl,2xl,3xl}` | Semantic steps alongside legacy `spacing.0..1000` |

## What Remains to Agree

1. Confirm the sanity-check renames above (`primitive.surface.*`, `primitive.brand.*`, `semantic.text.disabled`, `typography.size.*`, `spacing.{2xs..3xl}`) with Anders and [#1495](https://github.com/unisdr/undrr-mangrove/issues/1495).
2. Confirm whether `dist/tokens/delta-2027.tokens.json` or an external Figma/Style Dictionary export becomes the canonical upstream handoff once Delta adopts the shared schema.
3. Decide how existing Mangrove components gradually adopt `--mg-semantic-*` / `--mg-typography-size-*` / `--mg-spacing-sm..xl` alongside legacy `--mg-*` adapters in Mangrove 3.
