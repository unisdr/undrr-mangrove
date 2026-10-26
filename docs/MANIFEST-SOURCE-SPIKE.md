# Source-only manifest extraction candidate

This opt-in candidate evaluates generating Mangrove's static AI catalogue
without building the Storybook site. It addresses the full-build dependency
in [#1354](https://github.com/unisdr/undrr-mangrove/issues/1354); it does **not**
remove the experimental Storybook metadata dependency. The standard `yarn build`
path and `features.componentsManifest` remain unchanged.

## Run without a Storybook site

Install dependencies and prepare the same consumer inputs the regular generator
requires. These commands build library CSS/bundles, not Storybook:

```sh
yarn install --immutable
yarn scss
NODE_ENV=production yarn exec webpack
yarn generate-ai-manifest:source
node scripts/ai-manifest/generate-ai-manifest.js --build-dir=.cache/manifest-source --validate
```

The result is in `.cache/manifest-source/`: an independently generated
`index.json`, `manifests/components.json`, attached docs metadata, the normal
published catalogue files and `source-extraction.json` with counts/timing.
It contains no manager, preview, HTML site or copied story assets, and is not
a deployable Storybook site. Generation still needs `dist/components/`, compiled
CSS, tokens, source MDX/changelogs and curated integration guidance.

To extract only inputs, use `yarn extract:source-metadata`. The extraction CLI
accepts `--output-dir=...` and `--config-dir=...`; run these commands from the
repository root, as with the conventional generator. It requires a fresh/empty
real output directory and refuses symlink destinations and existing Storybook
site directories. Metadata is validated and fully serialized before files are
written to a private sibling staging directory. The complete extraction is
published by directory rename; concurrent writers cannot mix output or
overwrite files created during preset loading. Unsupported manifest filenames
and serialization failures leave the destination unchanged. For repeated local
runs, choose a fresh
`--output-dir` and pass it to the generator, or remove the generated
`.cache/manifest-source` directory before rerunning the default command. This
prevents files for removed components from surviving in a reused catalogue. The subsequent generator's existing
`--build-dir` selects the standalone input/output directory.

## Why reuse the source preset chain

The installed Storybook React renderer already resolves component imports,
extracts React Docgen/PropTypes information, selects component-level source
files, and generates story snippets directly from source. Those operations do
not require a Vite manager/preview build. Reimplementing them locally would
copy a substantial resolver/snippet engine and create another compatibility
contract.

The candidate therefore loads the configured project with
`experimental_loadStorybook` from `storybook/internal/core-server`, asks its
index generator for the source story index, and invokes the configured
`experimental_manifests` preset chain with `watch: false`. The docs preset
attaches source MDX content, including component changelogs. The index selects
navigation identity and metadata candidates; it is never treated as a
replacement for props, defaults, descriptions or snippets.

This preserves current handling of CSS-only/story-only entries, JSX-in-JS,
component groups and errors. In particular, existing duplicate component-ID
warnings remain visible: the candidate does not silently choose a new merged
schema or fix excluded stories as a side effect.

## Compatibility and adoption boundaries

This is a research command, not a stable alternative metadata API:

- It still depends on `storybook/internal/core-server`, the experimental
  loader/preset API, the current `manifest` tag and the existing v0 metadata
  envelope. A Storybook upgrade must pass full output/validation parity before
  the candidate is trusted again.
- The experimental loader initializes **development** preset configuration.
  The static site uses production configuration. Current Mangrove sources
  produce equivalent metadata, but environment-dependent stories/presets could
  break that equivalence. The extraction receipt records its preset config type.
- The configured preset chain executes trusted project configuration. It does
  not start a browser or server, render story components, or invoke the Vite
  manager/preview build; it is not a dependency-free source parser.
- Skipping site generation does not remove the component-bundle build or
  browser accessibility/interaction checks. The normal site remains the
  delivery and browser-test target.

Keep this path opt-in until repeatable CI parity and performance evidence
justify using it for a specific catalogue-only workflow. Removing the
experimental metadata dependency requires a separate validated extraction
engine, not just renaming this command.

## Evidence

Evaluated on 2026-10-26 from the same isolated checkout, with Storybook 10.6.3,
Node 24.18.0 and Yarn 4.18.1. Both paths used the same sources, curated data,
compiled CSS and component bundles. No baseline output is read by the source
extractor. The candidate also succeeded after removing `docs-build-temp` from
its expected path, with a fresh standalone output directory.

| Check | Result |
| --- | --- |
| Full source story index | Exact equality: 742 entries |
| Raw component metadata | Same 91 records and fields; only extraction `meta.durationMs` differs |
| Published catalogue | Same 90 components: 73 vanilla HTML, 17 React-only |
| Rendered examples | Same 37 auto-rendered and 28 curated HTML entries |
| Adapter contract, complete public output and validation diagnostics | 105-file parity passes; only declared generation timestamps ignored |
| Standard generation/validation | Pass |
| Standalone generation/validation | Pass |

One local wall-time observation with common inputs already built:

| Phase | Wall time |
| --- | --- |
| Storybook static site build plus catalogue generation | 25.71 s |
| Source extraction plus catalogue generation | 11.06 s |
| Source extraction alone, within that candidate run | 6.79 s |

A separate fresh full `yarn build` took 65.24 s, but that includes CSS and
component-bundle preparation and is **not** directly comparable with the
catalogue-only command. These are single observations on a shared machine,
with warm caches for the phase comparison, not a controlled benchmark or a CI
performance guarantee. Neither timing includes the separate validation run.

After a regular build, reproduce full parity with the foundation PR's tooling:

```sh
yarn extract:source-metadata
node scripts/ai-manifest/snapshot-manifest-output.mjs .cache/manifest-parity/site
node scripts/ai-manifest/snapshot-manifest-output.mjs .cache/manifest-parity/source --build-dir=.cache/manifest-source
node scripts/ai-manifest/compare-manifest-output.mjs .cache/manifest-parity/site .cache/manifest-parity/source
```

Snapshot destinations must not already exist, so use fresh destinations on
repeated local comparisons. The candidate PR adds the same generation,
validation and parity sequence after the conventional build in CI, without
changing which output is deployed. It depends on the adapter/parity foundation
PR and should be reviewed/merged after it.

## Red-team review

The review reproduced three destination failures in the initial candidate:
files created during asynchronous preset loading could be overwritten, a
manifest key containing `../` could escape its destination, and an unsupported
later payload could fail after writing partial metadata. The extractor now
validates manifest basenames, serializes all payloads before touching output,
and publishes a complete privately staged directory. It rechecks freshness
before publication and refuses symlink destinations. Regression cases exercise
all three failures, concurrent writers and preservation of pre-existing files.
These checks do not make project presets untrusted input; the candidate still
executes trusted repository configuration as described above.
