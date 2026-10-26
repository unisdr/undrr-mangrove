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
accepts `--output-dir=...` and `--config-dir=...`. It refuses to write into an
existing Storybook site directory. The subsequent generator's existing
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

Measurements and the exact parity commands are recorded below after the
contract/parity tooling is applied. Treat local wall times as observations on
a shared machine, not a controlled performance benchmark.
