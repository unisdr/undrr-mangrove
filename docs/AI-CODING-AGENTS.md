# AI coding agent guidelines

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/AI-CODING-AGENTS.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-ai-coding-agent-guidelines--docs).

Practical guidance for AI coding agents (Claude Code, Cursor, Copilot, etc.) working on Mangrove. This covers the specific gaps between how human developers and AI agents approach code changes — the edge cases where an agent naturally drifts from the project's workflow.

Human developers absorb process by reading docs once and internalizing the habits. AI agents start fresh each session and tend to focus on the immediate code change, missing the surrounding process steps. This document bridges that gap.

## Before modifying any component

When you touch a component's JSX, SCSS, stories, or tests, read the [review checklist](REVIEW-CHECKLIST.md) **before committing**. The checklist is referenced in every component's MDX file, but agents typically don't read MDX until late in the process — by then the commit is already made.

Key items agents commonly miss:

- **Changelog entry** in the component's MDX file (date + what changed)
- **No `defaultProps`** — use destructured default parameters (deprecated in React 19)
- **BEM naming** with `mg-` prefix on all CSS classes
- **Story source examples** must match current class names (stale HTML in `parameters.docs.source.code` is invisible to tests but misleads consumers)
- **CSF3 format** for stories (no `Template.bind({})`)

## Keeping the AI manifest in sync

The AI manifest (`scripts/ai-manifest/component-data.js` and `css-utilities.js`) is consumed by external AI agents to generate correct Mangrove markup. When you rename CSS classes, add components, or remove components, the manifest must be updated in the same commit.

Things to check:

- **Class names in `cssClasses` arrays** match the actual SCSS
- **HTML examples** use the current class names, not old ones
- **Deleted components** are removed from `component-data.js`
- **Descriptions** don't reference stale facts (e.g., "uses legacy class names" after a rename)

After changes, run `yarn build` to regenerate the compiled manifest and verify it.

## CSS class rename gotchas

Renaming CSS classes is a common task that creates subtle breakage because CSS failures are silent — elements just lose styling with no error. When renaming classes:

1. **Update both SCSS and JSX** in the same commit
2. **Search the full codebase** for the old class name (`grep -r` across `.scss`, `.jsx`, `.js`, `.mdx`, `.stories.jsx`)
3. **Check story source examples** — hardcoded HTML in `parameters.docs.source.code` blocks doesn't update automatically
4. **Check the AI manifest** — `scripts/ai-manifest/component-data.js` contains curated HTML examples
5. **Check compiled CSS** — after `yarn build` or `yarn scss`, verify old names are absent and new names are present in `stories/assets/css/style.css`
6. **Watch for SCSS nesting** — `.parent { &-child { } }` compiles to `.parent-child`; renaming the parent class requires flattening or adjusting the nesting

## Bare element selectors

Mangrove's BaseTypography SCSS files (`stories/Atom/BaseTypography/`) historically used bare HTML element selectors (`blockquote`, `cite`, `mark`, etc.) that style every instance globally. New additions or modifications to these files should scope styles to `.mg-body` to prevent leaking into non-Mangrove areas:

```scss
// Correct — scoped
.mg-body blockquote { ... }

// Avoid — global
blockquote { ... }
```

See [#865](https://github.com/unisdr/undrr-mangrove/issues/865) for the ongoing migration.

## Process differences: humans vs. agents

| What | Human developer | AI agent tendency | What the agent should do |
|------|----------------|-------------------|--------------------------|
| Review checklist | Reads once, internalizes | Doesn't read unless told | Read `docs/REVIEW-CHECKLIST.md` before committing component changes |
| Changelogs | Habit from past PRs | Skips unless prompted | Add a changelog entry to the component's MDX |
| Cross-file impact | Mentally tracks references | Focuses on the files being edited | `grep` for old names across all file types after renaming |
| Story source examples | Updates by habit | Doesn't notice stale static HTML | Check `parameters.docs.source.code` in `.stories.jsx` |
| AI manifest | Updates after code changes | Doesn't know it exists | Check `scripts/ai-manifest/component-data.js` and `css-utilities.js` |
| Compiled output | Inspects the result | Trusts the build succeeded | Verify class names in `stories/assets/css/style.css` after build |

## Related documentation

- [Review checklist](REVIEW-CHECKLIST.md) — pre-submission component checklist
- [Component guide](COMPONENT-GUIDE.md) — step-by-step tutorial for building a component
- [AI and MCP integration](AI-MCP-INTEGRATION.md) — how the AI manifest is consumed by external agents
- [Agents](AGENTS.md) — specialized Claude Code agent prompts for auditing and review
