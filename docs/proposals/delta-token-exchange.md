# Proposed Delta–Mangrove token contract

**Status: proposal for agreement with Anders.** The initial integration works; this document proposes the format and naming contract for future handoffs. It does not propose another visual redesign.

## Format

Use the [DTCG 2025.10 specification](https://www.designtokens.org/tr/2025.10/format/) for exchanged token data.

The [Delta-only example](delta-v0.7.2.dtcg.tokens.json) converts the 111 typed values from Anders's v0.7.2 handoff. It retains their paths and design values, with standard representations for colours, dimensions, durations, easing and shadows. For example:

```json
{
  "spacing": {
    "3": {
      "$type": "dimension",
      "$value": { "value": 12, "unit": "px" }
    }
  }
}
```

Each token has a known type, directly, through inheritance or through its reference. Usage notes use `$description`. Tool-specific metadata can use namespaced `$extensions`. Accessibility targets and component instructions remain guidance rather than invented token types. A link to the specification is documentation, not a JSON Schema validator.

## Naming and ownership

- Retain Delta's existing `primitive`, `semantic`, `typography`, `spacing` and other groups as the starting proposal. DTCG allows different grouping conventions.
- Agree each semantic role's intended use. In particular, clarify `semantic.text.placeholder`, whose supplied guidance reserves the pale colour for decorative or disabled content.
- Delta maintains the design values and intent. Mangrove maintains its component mappings and CSS property names. Mangrove-specific inheritance and output settings stay outside the Delta exchange file.
- Agree the authoritative source, export workflow and versioning process. Changes to names or meaning should be identified so consumers can update their mappings.

## What to agree next

Review the example with Anders, confirm the format and names, and identify how future versions will be produced and shared. Then use that contract in a representative Delta application form and review its design and behaviour.

## About the example

This is a review snapshot derived from the conversion in [PR #1498](https://github.com/unisdr/undrr-mangrove/pull/1498), not another maintained source of truth. It omits Mangrove's adapters, its added selected-action/toast aliases, and its namespace wrapper. The accessibility target and component guidance remain in the original handoff and implementation documentation.

Original handoff SHA-256: `e25a55fd14ab67908e6de8b6bc7b2debc0e2d42427054e77a9293d03645299cf`.
