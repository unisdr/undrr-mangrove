# Component metadata input contract

The AI catalogue currently reads Storybook's experimental `componentsManifest`
output, not the standard navigation `index.json`. The boundary in
`scripts/ai-manifest/component-metadata.js` validates the consumed shape before
curated validation or output generation. It preserves all fields, including
unconsumed upstream fields, and does not rewrite paths, supply missing props,
or replace generated snippets with hand-maintained examples.

This is an adapter contract for current tooling, not a canonical component or
editorial content schema. It still requires Storybook metadata. It neither
removes the full Storybook build nor establishes Storybook 11 compatibility.

## Audited consumers

The baseline uses envelope `v: 0`. An unsupported version, empty map, mismatched
component key/ID, duplicate story ID or malformed consumed field fails with its
source filename and field path. CSS-only and story-only records can legitimately
have no docgen metadata and may carry Storybook extraction diagnostics; the
adapter does not turn those known cases into invented prop tables.

| Input | Consumer |
| --- | --- |
| `components` map and component `id` | Curated-key validation, catalogue identity, generated docs URLs and content references. |
| `name` | Fallback display name when curated data has none. |
| `path` | Excludes `stories/Quality/` records from published output and the PropTypes denominator. |
| `description`, `reactDocgen.description` | Description/summary fallback after curated text. |
| `jsDocTags.param[]` | Fallback prop descriptions parsed from JSDoc. |
| `reactDocgen.props.*.type` | Recursively flattens `name` and enum/union/shape/arrayOf/objectOf/instanceOf values. Unknown type names remain printable; some existing TypeScript records have only `tsType`, which is retained while current public output keeps its existing `unknown` fallback. |
| `reactDocgen.props.*.required`, `.defaultValue.value`, `.description` | Published prop contract; presence of props also determines coverage. |
| `stories[].name`, `.snippet` | Generated React source examples. Story IDs are preserved and checked separately for parity. |
| `import` | Counts discarded Storybook import hints; actual public imports are resolved from built bundle exports. |
| `docs.*.content` | Parses component changelogs; dropping MDX content would silently lose release history. |

Rendered HTML still comes from built `dist/components` bundles or existing
curated/supplemental examples. CSS properties, tokens, importability, content
patterns and guidance retain their current sources and validators. The regular
Storybook `index.json` still supplies navigation IDs for content references.

The generator defaults to `BUILD_DIR/manifests/components.json`. An experimental
producer can instead supply `--metadata-file=FILE` without changing the rest
of the pipeline; its build directory must still contain a compatible `index.json`.

## Repeatable parity check

Hold source, package version, curated data, compiled CSS, bundles and docs base
constant. Generate a baseline snapshot before changing extraction or adaptation,
then generate the candidate snapshot from the same checkout:

```sh
yarn build
node scripts/ai-manifest/snapshot-manifest-output.mjs /tmp/ai-baseline
# Apply the candidate adapter/extractor and create its metadata/index as needed.
node scripts/ai-manifest/snapshot-manifest-output.mjs /tmp/ai-candidate \
  --metadata-file=/path/to/candidate/components.json
node scripts/ai-manifest/compare-manifest-output.mjs /tmp/ai-baseline /tmp/ai-candidate
```

Destinations must not already exist. The snapshot tool reruns generation and
validation and refuses either failure. `--build-dir=DIR` selects the navigation
index/output directory; `--generator=FILE` permits an earlier generator entry
point when checking an adapter change. Run both commands in the same checkout
so absolute paths in validation diagnostics do not create unrelated differences.

Snapshots contain the generated `ai-components/*.json`, root `llms*.txt`,
`llms.json`, `tokens.json`, `releases.json` and `content-patterns.json`, plus
`metadata-contract.json` and the validation exit code/stdout/stderr. The metadata
projection includes consumed fields, complete prop/docgen records (including
TypeScript types not yet published by the generator) and stable story identity,
while excluding absolute docgen file locations, extraction error locations and timings.
Unknown input fields are still preserved by the runtime adapter.

The comparison checks exact file sets, all JSON values and text, and validation
diagnostics. Object-key formatting is immaterial; array order remains material.
Only the known top-level `generatedAt` fields in index, utilities, tokens,
releases and `llms.json` are ignored, after verifying they are valid timestamps.
Nested timestamps and rendered markup are not normalized. Changed component
sets, props/defaults, imports, snippets, HTML, changelogs or guidance fail parity.
Two empty snapshots or two matching failed validations cannot pass.

Before removing an input or enabling a replacement, require this check against
fresh real metadata and review every difference. Matching illustrative fixtures,
matching counts or a successful build alone are not equivalent evidence.
