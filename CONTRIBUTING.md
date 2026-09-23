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
- See [`docs/AI-CODING-AGENTS.md`](docs/AI-CODING-AGENTS.md) if you are an AI coding agent (Claude Code, Cursor, Copilot, etc.) — covers the workflow gaps between human and agent contributors, including the `react-doctor` quality check and the project's house conventions for JSX text.
- For code standards and review process, see the [component contribution guide](https://mangrove.undrr.org/?path=/docs/contributing-component-standards--docs).
  - Source: [`stories/Documentation/ComponentContribution.mdx`](stories/Documentation/ComponentContribution.mdx)

## Writing guidelines

To keep copy consistent and high quality across UI, docs, and developer messages:

- Read the full guide: [`docs/WRITING.md`](docs/WRITING.md)
- Use the quick reference for AI tools and lookups: [`docs/WRITING-SHORT.md`](docs/WRITING-SHORT.md)
- For mechanical style rules (capitalization, punctuation, numbers, abbreviations, italics, spelling), UNDRR terminology and inclusive-language terms, see [`docs/EDITORIAL-MANUAL.md`](docs/EDITORIAL-MANUAL.md), credited to United Nations system sources and the UNDRR Publications SOP.
- Headings and titles use sentence case, with proper nouns and acronyms capitalized.

## Storybook translations and RTL

Use Storybook's global locale toolbar for translated component content and text direction. Stories should read `context.globals.locale` directly or use a shared locale-label decorator; do not create one story export per language.

Keep a dedicated RTL, long-label, or translation-stress story only when it exercises a distinct layout or interaction condition that the ordinary toolbar-driven story cannot demonstrate clearly. See the [RTL support and locale-toolbar guidance](https://mangrove.undrr.org/?path=/docs/contributing-component-standards--docs#rtl-support) in the component contribution guide.

This work supports sites in meeting the [minimum standards for multilingualism on United Nations websites](https://www.un.org/en/multilingualism-web-standards), including the requirement for a language bar and right-to-left support for Arabic.

## Component changelogs

Every component MDX file must include a `## Changelog` section tracking its version history. When submitting a PR that modifies a component, add a new changelog entry (e.g. `- **X.Y.Z** — YYYY-MM-DD ([#PR](https://...)): Description`).

The manifest pipeline automatically parses each `## Changelog` into machine-readable format for `releases.json` and the component's `ai-components/{id}.json` detail file.

See the [component contribution guide](https://mangrove.undrr.org/?path=/docs/contributing-component-standards--docs#changelog-format) for the full format specification, issue link guidance, and examples.

- Source: [`stories/Documentation/ComponentContribution.mdx`](stories/Documentation/ComponentContribution.mdx)

## AI manifest for component discovery

Mangrove publishes an AI-friendly manifest (`llms.txt`, `llms.json`, `releases.json`, `tokens.json`, and `ai-components/`) alongside Storybook so coding agents can discover and use components accurately. The manifest includes rendered HTML examples for vanilla HTML consumers, a CSS utility class inventory, and machine-readable design token definitions. `llms-editorial-manual.txt` is a separate, topic-scoped sub-manifest generated from [`docs/EDITORIAL-MANUAL.md`](docs/EDITORIAL-MANUAL.md), for agents that only need writing/style rules and terminology. The pipeline lives in `scripts/ai-manifest/` (6 files).

Most of the manifest auto-generates from Storybook, component rendering, tokens, and `CHANGELOG.md`. Two things need manual maintenance when adding or modifying components:

- **`scripts/ai-manifest/component-data.js`** — per-component metadata (descriptions, CSS class lists, curated HTML examples) and the `REQUIRES_REACT` map. Update when you change a component's HTML structure, add a new component, or rename BEM classes. The curated `description` is published as the component's `description` in `index.json` and in its detail file, ahead of the component's own docblock, so write it for an agent that only ever sees the manifest and keep it accurate as the component changes. A description longer than 200 characters also needs a one-sentence `summary` for the index listing; `yarn validate-manifest` fails without one.
- **`scripts/ai-manifest/css-utilities.js`** — inventory of CSS utility classes. Update when you add, rename, or remove utility classes.
- **`scripts/ai-manifest/custom-properties.js`** — what each CSS custom property a component exposes is for. The names, kinds and defaults are extracted from the compiled CSS, so only the prose is maintained here. Add a description when you add a property, and claim a new component's prefix in `OWNERS` with its count in `MIN_PROPERTIES`. `yarn validate-manifest` fails on a property that nothing describes, on a description for a property the CSS no longer has, and on a component that publishes fewer properties than its floor — removing one from the public API means lowering that number in the same commit.

Tips for better manifest output:

- **Add PropTypes to your components.** The manifest extracts prop names, types, defaults, and descriptions from PropTypes and JSDoc comments via react-docgen. Components without PropTypes appear in the manifest with no prop documentation. The practical ceiling is ~87% (the remaining ~13% are CSS-utility doc pages, vanilla CSS patterns, story-only examples, or intentional stubs); see [`docs/AI-CODING-AGENTS.md`](docs/AI-CODING-AGENTS.md#proptypes-coverage-the-practical-ceiling-is-87) before chasing gaps.
- **Consider auto-rendering.** If your component renders cleanly in Node.js (no browser APIs), add a webpack entry in `webpack.config.js`, a `COMPONENT_IDS` mapping, and a `buildSampleProps()` entry — both in `scripts/ai-manifest/generate-ai-manifest.js`. Auto-rendered HTML stays in sync automatically and requires no manual maintenance.
- **Run `yarn validate-manifest`** after changes to curated data. It checks for stale keys, accessibility anti-patterns in HTML examples, and PropTypes coverage.

## Component stylesheets and CSS documentation

- **Docblocks on every stylesheet**: Every component SCSS file must begin with a docblock comment containing a concise 1–2 sentence description of what the component does and a direct link to its full `.mdx` file on GitHub (e.g., `https://github.com/unisdr/undrr-mangrove/blob/main/stories/.../Component.mdx`).
- **Compiled CSS banners**: Build banners automatically guide developers and LLMs to Storybook docs (`https://mangrove.undrr.org/`) and the machine-readable LLM context (`https://mangrove.undrr.org/llms.txt`).
- **Registration**: All component SCSS files must be imported in `stories/assets/scss/_components.scss`.

## Reviewing PRs

Use the [review checklist](https://mangrove.undrr.org/?path=/docs/contributing-build-a-component-review-checklist--docs) when reviewing component PRs.

- Source: [`docs/REVIEW-CHECKLIST.md`](docs/REVIEW-CHECKLIST.md)

## Submitting changes

1. Create a feature branch from `main`.
2. Write clear commits using Conventional Commits.
3. Add or update Storybook docs if behavior or usage changes.
4. Add a version entry to the component's `## Changelog` in its `.mdx` file citing your PR or issue.
5. Ensure the component SCSS file has a top docblock linking to its `.mdx` file and is imported in `_components.scss`.
6. If you changed component markup or CSS classes, update `scripts/ai-manifest/component-data.js` and `scripts/ai-manifest/css-utilities.js`.
7. Run tests and linters before opening a pull request (`yarn test`, `yarn lint`, `yarn prettier:check`, `yarn validate-manifest`). For component-quality findings, also run `npx -y react-doctor@latest .` — see [`docs/AI-CODING-AGENTS.md`](docs/AI-CODING-AGENTS.md) for the house conventions it enforces.
8. Validate against the [review checklist](docs/REVIEW-CHECKLIST.md).
9. Reference the relevant issue in your PR description.

For more details on component standards and workflow, see the [component contribution guide](https://mangrove.undrr.org/?path=/docs/contributing-component-standards--docs).

- Source: [`stories/Documentation/ComponentContribution.mdx`](stories/Documentation/ComponentContribution.mdx)
