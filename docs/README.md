# Mangrove documentation

Guides for building, testing, and maintaining components in the Mangrove library. All guides in this directory are also published in [Storybook](https://unisdr.github.io/undrr-mangrove/).

## Creating a component

Start here when building a new component. Follow these guides in order:

1. [Component guide](COMPONENT-GUIDE.md) — step-by-step tutorial from scaffolding to registration
2. [Testing guide](TESTING.md) — unit, visual, and accessibility testing
3. [Hydration authoring](HYDRATION-AUTHORING.md) — adding Drupal integration via `fromElement` and `createHydrator`
4. [Review checklist](REVIEW-CHECKLIST.md) — pre-submission component checklist

## Standards

- [Accessibility](ACCESSIBILITY.md) — WCAG 2.2 AA requirements and testing methodology
- [Writing guidelines](WRITING.md) — UX writing standards and UN terminology
- [Writing guidelines (short)](WRITING-SHORT.md) — quick-reference writing rules

## Architecture

- [Architecture](ARCHITECTURE.md) — build system, distribution channels, and Drupal integration
- [Hydration guide](HYDRATION.md) — consumer-facing `createHydrator` API and integration examples
- [CDN reference](CDN-REFERENCE.md) — using Mangrove via CDN without npm

## Releasing

- [Release process](RELEASES.md) — versioning, tagging, and publishing to npm
- [Release 1.4](RELEASE-1.4.md) — migration notes for the 1.4 release (may be removed after 2026)

## Other guides

- [Development setup](DEVELOPMENT.md) — local environment, Docker, and common commands
- [Browser support](BROWSER-SUPPORT.md) — supported browsers and testing matrix
- [Analytics](ANALYTICS.md) — event tracking and analytics integration
- [Critical messaging](CRITICAL-MESSAGING.md) — emergency banner and alert patterns
- [AI and MCP integration](AI-MCP-INTEGRATION.md) — AI manifest and MCP server configuration
- [Agents](AGENTS.md) — specialized Claude Code agent prompts
- [Design system research](DESIGN-SYSTEM-RESEARCH.md) — survey of UN agency design systems
