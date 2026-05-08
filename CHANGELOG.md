# Changelog

Detailed change records live in two places:

- **Project releases**: [GitHub Releases](https://github.com/unisdr/undrr-mangrove/releases) — library-wide version history.
- **Component changelogs**: Each component's MDX file has a `## Changelog` section with per-component version history. Browse them in [Storybook](https://unisdr.github.io/undrr-mangrove/) or in the `stories/` directory.

For the changelog format specification, see the [component contribution guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs#changelog-format).

This file collects only cross-cutting library-wide notes that don't fit either location above (e.g. repo-wide build / tooling / policy changes).

## Unreleased

_Notable cross-cutting changes between releases land here. Per-component changes belong in the component's MDX changelog._

- **Brand documentation expansion** ([#983](https://github.com/unisdr/undrr-mangrove/pull/983)) — added eight new Storybook MDX pages under `Brand/`: Where to start (canonical reading order), Layered identity (core UNDRR → sub-brand → campaign), Visual voice, Written voice and tone, Audience mapping, Sub-brand rationale (working hypothesis pending UNDRR Communications review), Anti-patterns, and AI imagery prompts. Reconciled the Arabic typography note in `BrandGuidelines.mdx` with the live Mangrove guidance (Noto Kufi Arabic + Dubai). The AI imagery page is explicit that it is derivative of UNDRR's in-development institutional AI guidance, not a one-to-one match. Also updated the `llms.txt` template in `scripts/ai-manifest/generate-ai-manifest.js` to surface the new pages to external AI agents.
- **AI imagery hard-bans** ([#983](https://github.com/unisdr/undrr-mangrove/pull/983)) — explicit standing rules: no photorealistic AI of human beings (stylised illustration only); no AI imagery for named people or specific real events; no AI-generated images of children; no rendered text or standalone icons in AI outputs (text comes out as gibberish; icons drift from OCHA + Mangrove); named country required (no regional pastiche); within-country diversity must be named explicitly when single-country contexts would otherwise collapse into a single ethnic phenotype; disability inclusion required in every people-inclusive prompt; decolonial framing required; specific hex codes required when prompts mention colour.
