# AI and MCP integration

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/AI-MCP-INTEGRATION.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-ai-and-mcp-integration--docs).

Mangrove publishes structured component data so AI coding agents can look up components, props, rendered HTML, and usage examples. This page shows you how to point your agent at that data.

## Quick start: point your agent at Mangrove

Pick whichever option fits your setup. Each one gives the agent enough context to start generating correct Mangrove markup.

### Option 1: give it `llms.txt`

The quickest way to get any agent up to speed. This works with any tool that can fetch a URL.

```
Fetch the component library metadata from:
https://unisdr.github.io/undrr-mangrove/llms.txt

Use these components to build the requested UI.
```

### Option 2: give it the repo

Agents that can read files (Claude Code, Cursor, Copilot) can work directly from the source.

```
I'm working with the UNDRR Mangrove component library.
Repository: https://github.com/unisdr/undrr-mangrove

Help me create a page layout using the MegaMenu, Hero, and Footer components.
```

### Option 3: give it a specific component

If you know which component you need, point straight at its detail file:

```
Fetch the Pager component metadata:
https://unisdr.github.io/undrr-mangrove/ai-components/components-pager.json

Create a similar paginated list using this component.
```

## Tool-specific setup

### Claude Code

For consuming projects, add to your `CLAUDE.md`:

```markdown
## Component library

This project uses the UNDRR Mangrove component library.
- AI manifest: https://unisdr.github.io/undrr-mangrove/llms.txt
- Component index: https://unisdr.github.io/undrr-mangrove/ai-components/index.json
- CSS prefix: mg-
- Naming: BEM (e.g., mg-card__title, mg-card__icon--bordered); buttons are single-dash (mg-button-primary)
```

### Cursor

Add to your `.cursor/rules` or project instructions:

```
Use the UNDRR Mangrove component library for all UI components.
AI manifest: https://unisdr.github.io/undrr-mangrove/llms.txt
Component index: https://unisdr.github.io/undrr-mangrove/ai-components/index.json
CSS prefix: mg-
```

### GitHub Copilot

Add a comment at the top of your file:

```jsx
// Using UNDRR Mangrove components
// Component index: https://unisdr.github.io/undrr-mangrove/ai-components/index.json
// CSS prefix: mg-, BEM naming
```

## Getting better results

### Mention Mangrove by name

If you don't mention Mangrove by name, agents tend to invent their own class names:

```
# Good prompt
Using the Mangrove component library (mg- prefix classes),
create a hero section with a primary CTA button.

# Less effective prompt
Create a hero section with a button.
```

### Include conventions in your prompt

The things agents most often get wrong: CSS class prefix, naming pattern, and theme support. Including these up front saves a round of corrections.

- All CSS classes use the `mg-` prefix (e.g., `mg-button`, `mg-card`)
- Classes follow BEM (e.g., `mg-card__title`, `mg-card__icon--bordered`). Buttons are the exception and use single-dash names: `mg-button-primary`, `mg-button-secondary`, `mg-button-outline` — `mg-button--primary` does not exist and has no styles.
- Components use semantic HTML for accessibility
- Five themes: undrr (default), preventionweb, irp, mcr2030, delta
- RTL is supported for Arabic and other right-to-left languages

### Check what you get back

Look for these in AI-generated output:

1. Classes should start with `mg-`
2. HTML structure should match what the docs show
3. ARIA attributes should be present
4. Layout should follow Mangrove's responsive patterns

---

## For contributors: local MCP server

If you're working on Mangrove itself (not just consuming it), you can connect your AI agent directly to the running Storybook dev server using MCP (Model Context Protocol).

With the Storybook MCP server running, agents can:

- Query component data through an API instead of parsing files
- Get URLs to specific stories for visual checks
- Run interaction and accessibility tests against generated components

### Setting up MCP for local development

Storybook can serve an MCP endpoint at `/mcp`, but **it is not enabled in this repository**: the installed Storybook (10.5.x) only reports that endpoint as ready when `@storybook/addon-mcp` is listed in `.storybook/main.js`, and it is neither listed nor installed. Without it, `/mcp` reports `status: "not-installed"`.

To try it locally you have to add the addon first:

1. **Install and register the addon**: add `@storybook/addon-mcp` to `devDependencies` and to the `addons` array in `.storybook/main.js`.

2. **Start Storybook**:
   ```bash
   yarn dev
   ```

3. **Configure your AI tool** to connect to `http://localhost:6006/mcp`

   For Claude Code:
   ```bash
   claude mcp add storybook-mcp --transport http http://localhost:6006/mcp --scope project
   ```

See the [Storybook MCP documentation](https://storybook.js.org/docs/next/ai/mcp/overview/) for detailed setup instructions for other AI tools.

---

## How the manifest works

Storybook is a single-page app. If an agent fetches the deployed URL, it gets an empty HTML shell and a bunch of script tags. To work around that, the build generates static JSON files at predictable paths on GitHub Pages. No running server needed.

### Entry points: `llms.txt` and `llms.json`

The site root has a [`llms.txt`](https://unisdr.github.io/undrr-mangrove/llms.txt) file following the [llms.txt convention](https://llmstxt.org/). It is plain text with a project summary, CDN theme URLs, conventions, and links to the component index and utilities.

A structured [`llms.json`](https://unisdr.github.io/undrr-mangrove/llms.json) provides the same data in machine-parseable JSON, with all URLs as proper fields. Fetch tools that summarize markdown won't lose the URLs from the JSON version.

### Component index (`ai-components/index.json`)

The [component index](https://unisdr.github.io/undrr-mangrove/ai-components/index.json) lists every component with:

```json
{
  "id": "components-cards-vertical-card",
  "name": "VerticalCard",
  "description": "Card with stacked image, labels, title, summary, and optional CTA button.",
  "docsUrl": "...",
  "detailsUrl": "...",
  "vanillaHtml": true
}
```

The index also includes library-level metadata:

- **`quickstart`** — two keys only: `css` (a ready-made `<link>` tag for the default UNDRR theme) and `cssThemes` (the bundle URL per theme). Full page boilerplate is not here; it is in the `renderedHtml` of `ai-components/example-page-template-example.json`.
- **`breakpoints`** — mobile (480px), tablet (900px), desktop (1164px), wide (1440px)
- **`requiredAssets`** — every stylesheet, script, and logo URL a UNDRR page needs, with load order and `defer`/`async` attributes
- **`utilitiesUrl`** — link to the CSS utility class reference

Agents can filter by `vanillaHtml: true` (works as plain HTML/CSS) or `requiresReact: true` (needs React runtime).

### Per-component details (`ai-components/{id}.json`)

Each component gets its own JSON file (roughly 0.3-21 KB) with some of:

- **Props** with types, defaults, and descriptions (from PropTypes and JSDoc)
- **Story examples** with JSX code snippets (from Storybook)
- **Rendered HTML** — copy-pasteable HTML showing the actual DOM structure. Some components are auto-rendered from the built React bundles using `renderToStaticMarkup`; others have curated HTML examples.
- **CSS classes** — list of the classes the component uses. Only curated components carry this (about a third of the files); `renderedHtml` is on roughly three quarters. Check for the key rather than assuming it is there.
- **Branding flags** — `doNotModify` warnings on components like PageHeader and Footer where the markup is a UNDRR branding requirement

Components with syndication support (Footer) include a `vanillaHtmlEmbed` field with the complete script-tag embed pattern and configuration options.

### CSS utilities (`ai-components/utilities.json`)

The [utilities reference](https://unisdr.github.io/undrr-mangrove/ai-components/utilities.json) lists all CSS utility classes grouped by category. Each class has a description and usage example.

### Page templates

The [PageTemplateExample](https://unisdr.github.io/undrr-mangrove/ai-components/example-page-template-example.json) detail file includes four complete page templates:

1. **Canonical UNDRR page shell** — full HTML boilerplate with PageHeader, content area, Footer, and all required scripts in the correct load order
2. **Listing page** — breadcrumbs, filter chips, card grid, pagination
3. **Detail page** — child hero, article body with highlight boxes, sidebar with related cards
4. **Form page** — contact form with all input types, validation patterns, and error summary

### Expected agent workflow

**Vanilla HTML consumers**
1. Fetch `llms.json` for URLs and conventions.
2. Fetch `ai-components/index.json` and filter `vanillaHtml: true`.
3. Use `quickstart` + `requiredAssets`, then component `renderedHtml`.

**React consumers**
1. Fetch `ai-components/index.json`.
2. Fetch component detail files for props/types/examples.
3. Import from npm: `import { ComponentName } from "@undrr/undrr-mangrove"`.

### How it's generated

A single script runs after Storybook and webpack finish:

```
storybook build → manifests/components.json (props, types, stories)
webpack build   → dist/components/*.js (compiled React bundles)
        ↓
generate-ai-manifest.js → llms.txt, llms.json, index.json, {id}.json, utilities.json
```

`generate-ai-manifest.js` auto-renders React components from `dist/` using `renderToStaticMarkup`, then merges three data sources: the Storybook manifest (props, types), auto-rendered HTML, and curated data from `component-data.js` (descriptions, CSS classes, flags, page templates). Components that render cleanly in Node.js get auto-generated HTML. Components needing browser APIs fall back to curated HTML examples. When run with `--validate`, it checks for stale curated keys, accessibility anti-patterns, and PropTypes coverage.

The pipeline is 3 files in `scripts/ai-manifest/`: `generate-ai-manifest.js`, `component-data.js`, and `css-utilities.js`.

To regenerate by hand:

```bash
node scripts/ai-manifest/generate-ai-manifest.js
```

### Why a custom pipeline

Several tools exist for connecting Storybook to LLMs. We evaluated them and found they solve a narrower problem than what UNDRR sites need.

| Tool | What it does | What it doesn't do |
|------|-------------|-------------------|
| [`@storybook/mcp`](https://www.npmjs.com/package/@storybook/mcp) (Storybook 10.3+) | Built-in MCP server with component docs, story previews, and test running. Live queries against a running dev server. | Generate static files. Provide rendered HTML for vanilla consumers. Work without a running server (unless self-hosted). Include page recipes, required assets, or branding constraints. |
| [`@fluentui/storybook-llms-extractor`](https://www.npmjs.com/package/@fluentui/storybook-llms-extractor) | Extracts Storybook metadata into llms.txt format using Playwright. Per-component text files with props and stories. | Provide rendered HTML output. Include page recipes, required scripts, or branding constraints. |
| [Storybook component manifest](https://github.com/storybookjs/storybook/issues/32276) | Built-in JSON manifest with props, types, and story snippets. | Include rendered HTML, CSS class inventories, or integration guidance. Storybook's own research explicitly excluded visual rendering. |

Our pipeline adds what those tools do not provide:

- **Rendered HTML** for vanilla/CDN consumers.
- **UNDRR page recipes** (required scripts, syndication patterns, branding constraints).
- **Static deploy artifacts** on GitHub Pages (no runtime server required).
- **CSS utility inventory** grouped by category.

The ecosystem tools are complementary, not competing. We recommend `@storybook/mcp` for local development alongside our static pipeline for deployed documentation.

---

## Ecosystem and alternatives

### Storybook MCP (`@storybook/addon-mcp`)

Recent Storybook versions can serve an MCP endpoint at `http://localhost:6006/mcp`. The package name the installed Storybook looks for is [`@storybook/addon-mcp`](https://www.npmjs.com/package/@storybook/addon-mcp); it is not a dependency of this repository, so the endpoint is inactive here until it is added. It exposes three tool groups — docs (list/get component metadata), development (story-writing guidance, preview rendering), and testing (run story tests and accessibility checks). Requires a running Storybook dev server or a self-hosted Node.js server with generated manifests.

- [Storybook changelog](https://github.com/storybookjs/storybook/blob/main/CHANGELOG.md)
- [npm package](https://www.npmjs.com/package/@storybook/addon-mcp)
- [Storybook MCP docs](https://storybook.js.org/docs/next/ai/mcp/overview/)

### Fluent UI LLMs extractor (`@fluentui/storybook-llms-extractor`)

Microsoft's CLI tool that extracts Storybook metadata into llms.txt format using Playwright. Produces per-component text files with props and story code. Good for teams that want automated llms.txt generation without custom scripting.

- [npm package](https://www.npmjs.com/package/@fluentui/storybook-llms-extractor)
- [Community fork](https://github.com/Acring/storybook-llms-extractor)

### Storybook Agentic UI research

The Storybook team's research on agent workflows (closed Oct 2025). Key finding: structured metadata about components significantly improves LLM output quality. Visual rendering was explicitly out of scope.

- [Tracking issue #32276](https://github.com/storybookjs/storybook/issues/32276)
- [Design Systems with Agents RFC](https://github.com/storybookjs/ds-mcp-experiment-reshaped/discussions/1)

## What's next

- **Expand auto-rendering** — most webpack-bundled components are auto-rendered from `dist/` builds. Components that depend on `document` or `window` (e.g., ShareButtons) still need curated HTML
- **MDX content in the manifest** — the Storybook manifest includes raw MDX source that we don't currently process. The Fluent UI extractor shows this can be converted to useful Markdown.
- **HTML browse page** — a static `index.html` for debugging the manifest in a browser (idea from the Fluent UI extractor)
- **Watch `@storybook/mcp`** — Storybook 10.3 ships a built-in MCP server with story test running. If we add it, it would complement our static pipeline for local development, not replace it.

## Further reading

- [llms.txt specification](https://llmstxt.org/)
- [Storybook MCP announcement](https://storybook.js.org/blog/storybook-mcp-sneak-peek/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Supercharge Your Design System with LLMs and Storybook MCP (Codrops)](https://tympanus.net/codrops/2025/12/09/supercharge-your-design-system-with-llms-and-storybook-mcp/)
- [Dear LLM, here's how my design system works (UX Collective)](https://uxdesign.cc/dear-llm-heres-how-my-design-system-works-b59fb9a342b7)
- [Claude Code agent prompts](https://github.com/unisdr/undrr-mangrove/blob/main/docs/AGENTS.md) — specialized agents for accessibility auditing, code review, and other contributor tasks
- [Getting started guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-getting-started-guide--docs)
- [React integration](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-react-integration--docs)
