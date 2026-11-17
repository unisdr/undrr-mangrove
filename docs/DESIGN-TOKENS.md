# Design-token sources for Mangrove 3

Edit `tokens/*.tokens.json`, then run `yarn build:tokens`. These authoring fragments contain DTCG 2025.10 token data and namespaced Mangrove build settings. Brand inheritance is a Mangrove build convention; fragments must be composed before generic tools can resolve all their references.

The build emits generated Sass partials and self-contained exchange documents in `dist/tokens/*.tokens.json`. The npm package exposes those exchange files at `tokens/{brand}.tokens.json`; the `mangrove` file is the default UNDRR brand. Each exchange document contains its complete reference graph and omits Mangrove output recipes and build settings. Generic token tools should consume the exchange document rather than an individual source fragment.

This migration changes the source format. Existing CSS property names, theme selectors and Sass exports remain supported. Delta 2027 is a separate theme implementation tracked by [#1495](https://github.com/unisdr/undrr-mangrove/issues/1495); the existing `delta` identity is preserved. The [Delta mapping inventory](DELTA-TOKEN-MAPPING.md) records the first-pass roles and component differences for that follow-up.

## Values and references

A token has a standard type and value. A group can supply the type for its children:

```json
{
  "spacing": {
    "$type": "dimension",
    "comfortable": { "$value": { "value": 16, "unit": "px" } }
  },
  "field": {
    "padding": { "$type": "dimension", "$value": "{spacing.comfortable}" }
  }
}
```

Colours use a colour-space/components object; durations use value/unit objects; easing curves use four-number arrays. Descriptions belong in `$description`. See the [format specification](https://www.designtokens.org/tr/2025.10/format/) and [colour specification](https://www.designtokens.org/tr/2025.10/color/) for value definitions.

Mangrove's compiler validates the representations it reads and rejects unsupported output conversions. A valid DTCG type or colour space does not by itself guarantee that this compiler can emit it to CSS. Keep format validation and output-transform support distinct when adding new values.

## Brands and CSS output

`$extensions["org.undrr.mangrove"]` holds Mangrove-specific settings. The document root declares a `brand` with its ID, parent (`extends`), title and selector. The neutral `mangrove` source is the base; `undrr` is the default brand and other brands can extend it or the neutral base.

Brand layers merge before references resolve. This lets a primitive override flow to dependent values without copying them into each brand.

Output settings include:

| Setting | Purpose |
| --- | --- |
| `format` | Select the CSS representation, such as `srgb-channels`, `srgb-rgb-function`, `rem` or `literal`. |
| `resolve: "literal"` | Resolve a standard alias at build time rather than emit a CSS variable link. |
| `private` | Keep a source value out of the public CSS properties. |
| `sass` | Preserve a build-time Sass export where the consumer requires it. |
| `name` | Preserve an existing public property whose name differs from its source path. |

These settings describe generated output. They do not introduce additional DTCG token types. Portable tools can read standard token data while ignoring Mangrove's extension.

A runtime alias resolves on the element where its custom property is declared. Re-declare theme-dependent aliases inside the relevant theme selector when a theme can change below the document root. Flattening every alias at build time would break supported runtime overrides.

### References inside composites

Public colour and dimension references inside shadows can remain CSS variable links. References to private values, or composites with `resolve: "literal"`, are materialised recursively during the build.

A derived colour can retain a runtime link when its referenced colour emits RGB channels. If the referenced property already emits a complete CSS colour, the compiler materialises the derived colour from typed source data instead of extracting channels from the CSS string. Source edits propagate on rebuild; runtime overrides of that complete-colour property do not propagate into the materialised derivative. A consumer needing that runtime relationship requires an explicit output mapping.

## CSS-only recipes

Some existing output is CSS syntax rather than a portable design value: multi-value padding, a theme-loaded string marker, or the keyword `none`. These are represented as explicit output recipes within the Mangrove extension on groups, rather than inventing a DTCG `string` type or labelling a shorthand as one dimension.

A standard token reader will not expose those recipes as tokens. Consumers that need the complete existing CSS contract should use the generated styles or the theme-property dictionary. Adding a new recipe requires a reason why standard typed values and references are insufficient.

The published `tokens.json` theme-property dictionary, distinct from the `tokens/*.tokens.json` exchange files, describes generated `--mg-*` values and RGB-wrapping rules. It remains a consumer lookup format, not a DTCG source file. Properties defined directly in component Sass remain documented in component metadata.

## Verification

Run the generator and focused token checks after editing a source:

```sh
yarn build:tokens
node scripts/build-tokens.cjs --check
yarn jest --runInBand --testPathPatterns='dtcg-source|tokens-source|tokens-contract'
```

The source tests detect invalid values and references. The existing output baseline also detects changes in generated partials. Update that baseline only after reviewing an intentional change; it is not evidence of output equivalence by itself.

For a source-format migration, compare the compiled theme bundles against the pre-migration commit using the same installed Sass version:

```sh
yarn test:sass-equivalence adae1531513c806456e8fd69c581188ac9114bcd
```

Also check theme switching, local overrides and build-time versus runtime references. A stylesheet that initially looks the same can still have different override behaviour.
