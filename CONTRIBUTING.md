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
- See [`docs/AI-CODING-AGENTS.md`](docs/AI-CODING-AGENTS.md) if you are an AI coding agent (Claude Code, Cursor, Copilot, etc.). It covers the workflow gaps between human and agent contributors, including the `react-doctor` quality check and the project's house conventions for JSX text.
- For code standards and review process, see the [component contribution guide](https://mangrove.undrr.org/?path=/docs/contributing-component-standards--docs).
  - Source: [`stories/Documentation/ComponentContribution.mdx`](stories/Documentation/ComponentContribution.mdx)

## Writing guidelines

To keep copy consistent and high quality across UI, docs, and developer messages:

- Read the full guide: [`docs/WRITING.md`](docs/WRITING.md)
- Use the quick reference for AI tools and lookups: [`docs/WRITING-SHORT.md`](docs/WRITING-SHORT.md)
- For mechanical style rules (capitalization, punctuation, numbers, abbreviations, italics, spelling), UNDRR terminology and inclusive-language terms, see [`docs/EDITORIAL-MANUAL.md`](docs/EDITORIAL-MANUAL.md), credited to United Nations system sources and the UNDRR Publications SOP.
- Headings and titles use sentence case, with proper nouns and acronyms capitalized.

For documentation maintenance, keep setup in the development guide, checks in
the testing guide and integration paths in the consumer guides. Update the
maintained explanation before linking to it from entrances such as the README;
avoid copying command lists or rolling component inventories into those pages.
Preserve historical evidence and update generated documents through their sources.

## Storybook translations and RTL

Use Storybook's global locale toolbar for translated component content and text direction. Stories should read `context.globals.locale` directly or use a shared locale-label decorator; do not create one story export per language.

Keep a dedicated RTL, long-label, or translation-stress story only when it exercises a distinct layout or interaction condition that the ordinary toolbar-driven story cannot demonstrate clearly. See the [RTL support and locale-toolbar guidance](https://mangrove.undrr.org/?path=/docs/contributing-component-standards--docs#rtl-support) in the component contribution guide.

This work supports sites in meeting the [minimum standards for multilingualism on United Nations websites](https://www.un.org/en/multilingualism-web-standards), including the requirement for a language bar and right-to-left support for Arabic.

## Component changelogs

Every component MDX file must include a `## Changelog` section tracking its version history. When submitting a PR that modifies a component, add a new changelog entry (e.g. `- **X.Y.Z**, YYYY-MM-DD ([#PR](https://...)): Description`).

The manifest pipeline automatically parses each `## Changelog` into machine-readable format for `releases.json` and the component's `ai-components/{id}.json` detail file.

See the [component contribution guide](https://mangrove.undrr.org/?path=/docs/contributing-component-standards--docs#changelog-format) for the full format specification, issue link guidance, and examples.

- Source: [`stories/Documentation/ComponentContribution.mdx`](stories/Documentation/ComponentContribution.mdx)

## AI manifest for component discovery

Mangrove publishes component metadata alongside Storybook. When adding or
changing a component, use the [manifest review checklist](docs/REVIEW-CHECKLIST.md#ai-discoverability-and-manifests)
for the source files to update and the validation command. It covers component
markup, descriptions, utility classes, public CSS properties and changelogs.
Edit maintained sources, then regenerate output; do not edit generated manifests.

The [AI and MCP integration guide](docs/AI-MCP-INTEGRATION.md#how-its-generated)
explains the pipeline and published formats. The
[component guide](docs/COMPONENT-GUIDE.md#step-8-ai-manifest-optional) covers
registration for auto-rendered, curated and React-only examples. Agent-specific extraction pitfalls,
including side-effect components and PropTypes coverage exemptions, belong in
[AI coding agent guidelines](docs/AI-CODING-AGENTS.md#keeping-the-ai-manifest-in-sync).

## Component stylesheets and CSS documentation

- **Docblocks on every stylesheet**: Every component SCSS file must begin with a docblock comment containing a concise 1–2 sentence description of what the component does and a direct link to its full `.mdx` file on GitHub (e.g., `https://github.com/PreventionWeb/undrr-mangrove/blob/main/stories/.../Component.mdx`).
- **Compiled CSS banners**: Build banners automatically guide developers and LLMs to Storybook docs (`https://mangrove.undrr.org/`) and the machine-readable LLM context (`https://mangrove.undrr.org/llms.txt`).
- **Registration**: All component SCSS files must be imported in `stories/assets/scss/_components.scss`.

## Reviewing PRs

Use the [review checklist](https://mangrove.undrr.org/?path=/docs/contributing-build-a-component-review-checklist--docs) when reviewing component PRs.

- Source: [`docs/REVIEW-CHECKLIST.md`](docs/REVIEW-CHECKLIST.md)

## Submitting changes

1. Create a feature branch from `main`, following the [branch and commit workflow](docs/DEVELOPMENT.md#branch-and-commit-workflow).
2. Write clear commits using Conventional Commits.
3. Add or update Storybook docs if behavior or usage changes.
4. For component changes, add a version entry to the component's `## Changelog` in its `.mdx` file citing your PR or issue.
5. For component changes, ensure the component SCSS file has a top docblock linking to its `.mdx` file and is imported in `_components.scss`.
6. If you changed component markup or CSS classes, update `scripts/ai-manifest/component-data.js` and `scripts/ai-manifest/css-utilities.js`.
7. Run tests and linters before opening a pull request (`yarn test`, `yarn lint`, `yarn prettier:check`, `yarn validate-manifest`). For component-quality findings, also run `npx -y react-doctor@latest .`. See [`docs/AI-CODING-AGENTS.md`](docs/AI-CODING-AGENTS.md) for the house conventions it enforces.
8. Validate against the [review checklist](docs/REVIEW-CHECKLIST.md).
9. Reference the relevant issue in your PR description.

For more details on component standards and workflow, see the [component contribution guide](https://mangrove.undrr.org/?path=/docs/contributing-component-standards--docs).

- Source: [`stories/Documentation/ComponentContribution.mdx`](stories/Documentation/ComponentContribution.mdx)
