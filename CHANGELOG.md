# Changelog

Detailed change records live in two places:

- **Project releases**: [GitHub Releases](https://github.com/unisdr/undrr-mangrove/releases) — library-wide version history.
- **Component changelogs**: Each component's MDX file has a `## Changelog` section with per-component version history. Browse them in [Storybook](https://unisdr.github.io/undrr-mangrove/) or in the `stories/` directory.

For the changelog format specification, see the [component contribution guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs#changelog-format).

This file collects only cross-cutting library-wide notes that don't fit either location above (e.g. repo-wide build / tooling / policy changes).

## Unreleased

_Notable cross-cutting changes between releases land here. Per-component changes belong in the component's MDX changelog._

- **Brand documentation expansion** — added six new Storybook MDX pages under `Brand/` covering the layered identity model (core UNDRR → sub-brand → campaign), visual voice, written voice and tone, audience mapping, anti-patterns, and AI imagery prompts. Reconciled the Arabic typography note in `BrandGuidelines.mdx` with the live Mangrove guidance (Noto Kufi Arabic + Dubai).
- **New AI agent: UN Brand Strategist** (`.claude/agents/un-brand-strategist.md`) — strategic / external-consultant lens for UNDRR's layered identity. Distinct from the tactical Brand Guardian (token consistency).
