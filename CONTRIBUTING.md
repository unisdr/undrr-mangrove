# Contributing to Mangrove

Thank you for contributing to the UNDRR Mangrove component library.

## Code of conduct

- Be respectful and inclusive in all interactions.
- Follow UNDRR and UN standards of professional conduct.

## Getting started

- See [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) for environment setup, scripts, branching, and commit conventions.
- See [`docs/TESTING.md`](docs/TESTING.md) for unit, visual, and accessibility testing.
- See [`docs/RELEASES.md`](docs/RELEASES.md) for versioning, tagging, and publishing.
- See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the build system, distribution channels, and Drupal integration flow.
- See [`docs/COMPONENT-GUIDE.md`](docs/COMPONENT-GUIDE.md) for a step-by-step tutorial on building a new component.
- For code standards and review process, check out the [component contribution guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-component-contribution-guide--docs) in our Storybook docs.

## Writing guidelines

To keep copy consistent and high quality across UI, docs, and developer messages:

- Read the full guide: [`docs/WRITING.md`](docs/WRITING.md)
- Use the quick reference for AI tools and lookups: [`docs/WRITING-SHORT.md`](docs/WRITING-SHORT.md)
- Headings and titles use sentence case, with proper nouns and acronyms capitalized.

## Component changelogs

Every component MDX file must include a `## Changelog` section tracking its version history. Entries use the format `- **version** — YYYY-MM-DD: description`, with newest entries first. See the [component contribution guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-component-contribution-guide--docs#changelog-format) for the full specification and examples.

When submitting a PR that modifies a component, add a new changelog entry to that component's MDX file. This is separate from the project-level [GitHub Releases](https://github.com/unisdr/undrr-mangrove/releases).

## AI manifest for component discovery

Mangrove publishes an AI-friendly manifest alongside Storybook so coding agents can discover and use components accurately. The manifest includes rendered HTML examples for vanilla HTML consumers and a CSS utility class inventory. The pipeline lives in `scripts/ai-manifest/` (3 files).

Most of the manifest auto-generates from Storybook and component rendering. Two things need manual maintenance:

- **`scripts/ai-manifest/component-data.js`** — per-component metadata (descriptions, CSS class lists, curated HTML examples) and the `REQUIRES_REACT` map. Update when you change a component's HTML structure, add a new component, or rename BEM classes.
- **`scripts/ai-manifest/css-utilities.js`** — inventory of CSS utility classes. Update when you add, rename, or remove utility classes.

Tips for better manifest output:

- **Add PropTypes to your components.** The manifest extracts prop names, types, defaults, and descriptions from PropTypes and JSDoc comments via react-docgen. Components without PropTypes appear in the manifest with no prop documentation.
- **Consider auto-rendering.** If your component renders cleanly in Node.js (no browser APIs), add a webpack entry in `webpack.config.js` and sample props in `SAMPLE_PROPS` in `scripts/ai-manifest/generate-ai-manifest.js`. Auto-rendered HTML stays in sync automatically and requires no manual maintenance.
- **Run `yarn validate-manifest`** after changes to curated data. It checks for stale keys, accessibility anti-patterns in HTML examples, and PropTypes coverage.

## Submitting changes

1. Create a feature branch from `main`.
2. Write clear commits using Conventional Commits.
3. Add or update Storybook docs if behavior or usage changes.
4. If you changed component markup or CSS classes, update `scripts/ai-manifest/component-data.js`.
5. Run tests and linters before you open a pull request.
6. Reference the relevant issue in your PR description.

For more details on component standards and workflow, see the [component contribution guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-component-contribution-guide--docs).
