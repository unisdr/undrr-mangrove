# AI and MCP integration

> Edits to this file show up on both [GitHub](https://github.com/PreventionWeb/undrr-mangrove/blob/main/docs/AI-MCP-INTEGRATION.md) and in [Storybook](https://mangrove.undrr.org/?path=/docs/getting-started-ai-and-mcp-integration--docs).

Mangrove publishes structured component data so AI coding agents can look up components, props, rendered HTML, and usage examples. This page shows you how to point your agent at that data.

## Content-pattern discovery

`content-patterns.json` (version 2) on the Storybook site describes source-independent content archetypes, their editorial profiles, default selections, and explicit provisional Drupal bundle bindings in `integrations.drupal.bindings`. Drupal bindings remain owned by Mangrove and have a separate `components/DrupalContentPatterns.js` data entry; they select `{ type, profile }` without extracting fields or resolving URLs. Card profiles expose vertical/book layout inputs for ContentCard separately from ContentTeaser. It describes content families and their full-page, teaser and card presentations separately from the usable component catalogue. It distinguishes experimental implementations, existing references and stubs. A stub has no rendering implementation or import; agents must not present it as a completed page. The content family's model is provisional, and a teaser input is only one presentation projection. Start at [Content patterns](?path=/docs/patterns-content-overview--docs) when choosing a content presentation.

## Quick start: point your agent at Mangrove

Pick whichever option fits your setup. Each one gives the agent enough context to start generating correct Mangrove markup.

### Option 1: give it `llms.txt`

The quickest way to get any agent up to speed. This works with any tool that can fetch a URL.

```
Fetch the component library metadata from:
https://mangrove.undrr.org/llms.txt

Use these components to build the requested UI.
```

### Option 2: give it the repo

Agents that can read files (Claude Code, Cursor, Copilot) can work directly from the source.

```
I'm working with the UNDRR Mangrove component library.
Repository: https://github.com/PreventionWeb/undrr-mangrove

Help me create a page layout using the MegaMenu, Hero, and Footer components.
```

### Option 3: give it a specific component

If you know which component you need, point straight at its detail file:

```
Fetch the Pager component metadata:
https://mangrove.undrr.org/ai-components/components-navigation-pager.json

Create a similar paginated list using this component.
```

## Choose the shortest discovery path

Start with the task, then fetch only the relevant guide and component details:

| Task | Start here | Next step |
|---|---|---|
| UI prototype | `llms.json`, then `ai-components/index.json` | Make a small component map (page section → component → `detailsUrl` → static HTML, hydration or vanilla module) before writing custom markup. |
| Drupal Gutenberg page | [Page-building guide](https://mangrove.undrr.org/llms-page-building.txt) | Choose the page shape and supported blocks, then inspect only the selected components. This guide owns the Hero/HubHeader distinction. |
| Copy or editorial review | [Editorial manual](https://mangrove.undrr.org/llms-editorial-manual.txt) | Consult the relevant content-family guide when choosing editorial fields. |
| Search configuration or metadata | [Search widget guide](https://mangrove.undrr.org/llms-search-widget.txt), or the relevant structured manifest named in `llms.json` | Use the dedicated reference for the requested configuration or metadata, then fetch component details if needed. |
| CSS-property validation | [Validation recipe below](#consumer-validation-recipe) | Combine theme, component and global evidence before judging a property. |

Always follow the selected index entry's **`detailsUrl`**. Do not construct a URL from a display name or a guessed short ID: StatsCard, for example, uses `components-cards-stats-card`, not `stats-card`. Keep the library version and source URLs with your component map; deployed metadata may be newer than a pinned stylesheet.

## Tool-specific setup

### Claude Code

For consuming projects, add to your `CLAUDE.md`:

```markdown
## Component library

This project uses the UNDRR Mangrove component library.
- AI manifest: https://mangrove.undrr.org/llms.txt
- Component index: https://mangrove.undrr.org/ai-components/index.json
- CSS prefix: mg-
- Naming: BEM (e.g., mg-card__title, mg-card__icon--bordered); buttons are single-dash (mg-button-primary)
```

### Cursor

Add to your `.cursor/rules` or project instructions:

```
Use the UNDRR Mangrove component library for all UI components.
AI manifest: https://mangrove.undrr.org/llms.txt
Component index: https://mangrove.undrr.org/ai-components/index.json
CSS prefix: mg-
```

### GitHub Copilot

Add a comment at the top of your file:

```jsx
// Using UNDRR Mangrove components
// Component index: https://mangrove.undrr.org/ai-components/index.json
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
- Some components have optional variants that matter for AI output, such as linked blocks, inverse dark-surface treatments, or text-only states with no image. For example, the Author image supports horizontal and vertical layouts, optional linking, `tone="inverse"`, and a no-image variant; check the Storybook canvas examples and component detail file before inventing a new markup shape.

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

The site root has a [`llms.txt`](https://mangrove.undrr.org/llms.txt) file following the [llms.txt convention](https://llmstxt.org/). It is plain text with a project summary, CDN theme URLs, conventions, and links to the component index, utilities, Icons gallery, and the machine-readable icon inventory.

A structured [`llms.json`](https://mangrove.undrr.org/llms.json) provides the same data in machine-parseable JSON, with all URLs as proper fields. Fetch tools that summarize markdown won't lose the URLs from the JSON version. It now includes an `iconsUrl` field that points directly to the static icon inventory JSON.

A separate, topic-scoped sub-manifest, [`llms-editorial-manual.txt`](https://mangrove.undrr.org/llms-editorial-manual.txt), carries only writing/style rules (capitalization, punctuation, numbers, abbreviations, italics, spelling, UNDRR terminology, disability inclusive and gender-inclusive language) for an agent generating UI copy or docs prose — fetch it instead of the full `llms.txt` when component data isn't needed.

The [motion guidance](https://mangrove.undrr.org/llms-motion.txt) (`urls.motion` in `llms.json`) publishes [Motion and animation](MOTION.md) for agents implementing components: purpose, timing, reduced motion, loading, forced colours and RTL. It is also copied to `dist/docs/llms-motion.txt` and the versioned asset library by the existing sub-manifest pipeline.

Two more sub-manifests serve editors building pages on UNDRR websites, and the AI tools they use:

- [`llms-page-building.txt`](https://mangrove.undrr.org/llms-page-building.txt) combines [Building landing pages](https://mangrove.undrr.org/?path=/docs/patterns-building-landing-pages--docs) and [Drupal Gutenberg integration](https://mangrove.undrr.org/?path=/docs/getting-started-integration-drupal-gutenberg--docs): page shapes, layout patterns, component choice and the current markup of every UNDRR Gutenberg block. It replaces the Gutenberg content guide formerly published on assets.undrr.org. A prompt such as "Using the UNDRR page building guide at https://mangrove.undrr.org/llms-page-building.txt, draft a landing page about…" works in any tool that can fetch URLs.
- [`llms-search-widget.txt`](https://mangrove.undrr.org/llms-search-widget.txt) carries [Search widget editor configuration](https://mangrove.undrr.org/?path=/docs/components-syndicated-search-editor-configuration--docs): block settings, search syntax and `field:value` filters with taxonomy term IDs.

These topic guides are built from `docs/*.md` by `scripts/ai-manifest/docs-submanifest.js` and are listed in `llms.txt` and under `urls` in `llms.json` (`editorialManual`, `pageBuilding`, `searchWidget`).

### Component index (`ai-components/index.json`)

The [component index](https://mangrove.undrr.org/ai-components/index.json) lists every component with:

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
- **`iconsUrl`** — link to the authoritative static icon inventory JSON

Agents can filter by `vanillaHtml: true` (works as plain HTML/CSS) or `requiresReact: true` (needs React runtime). Entries flagged `hydration: true` have a vanilla hydration contract in their detail file, and entries flagged `vanillaModule: true` have a plain ES module contract (see below).

### Per-component details (`ai-components/{id}.json`)

Each component gets its own JSON file (roughly 0.3-21 KB) with some of:

- **Props** with types, defaults, and descriptions (from PropTypes and JSDoc)
- **Story examples** with JSX code snippets (from Storybook)
- **Rendered HTML** — copy-pasteable HTML showing the actual DOM structure. Some components are auto-rendered from the built React bundles using `renderToStaticMarkup`; others have curated HTML examples.
- **CSS classes** — list of the classes the component uses. Only curated components carry this (about a third of the files); `renderedHtml` is on roughly three quarters. Check for the key rather than assuming it is there.
- **CSS custom properties** — under `customProperties`, the properties the component exposes for theming. Present on the 24 components that have any; the index entry carries the count. See below.
- **Changelog** — structured version history with release dates, notes, and PR links (from the component's MDX docs)
- **Branding flags** — `doNotModify` warnings on components like PageHeader and Footer where the markup is a UNDRR branding requirement

Components with syndication support (Footer) include a `vanillaHtmlEmbed` field with the complete script-tag embed pattern and configuration options.

Components whose static `renderedHtml` is not interactive on its own (ServiceNotice) include a `hydration` field: the container selector, CDN module URLs, every `data-*` attribute, the custom events the component dispatches, and a complete vanilla HTML example (stylesheet, import map, container and module script). Module and stylesheet URLs carry the current package version. The index entry for such a component has `hydration: true`, and `yarn validate-manifest` fails if a curated `hydration` object is missing `selector`, `modules` or `example`. Curate it in `scripts/ai-manifest/component-data.js`, using `{{version}}` in URLs like the rest of the curated data.

Components enhanced by a dependency-free module from `/js/` instead of React (the `.mg-switch` pending state on Checkbox) use a `vanillaModule` field with the same shape and validation. It needs neither React, `hydrate.js` nor an import map, so it is kept apart from `hydration`, and the index flags it `vanillaModule: true`.

### CSS custom properties (`customProperties`)

A component's custom properties are how it is restyled. Writing rules against its classes instead is more fragile — a rule of equal specificity replaces what the component draws, and several components build their geometry on a property the rule would then be fighting. They are **not** in `tokens.json`, which is a theme token dictionary; they are in each component's detail file.

Each record carries the property name, what it does, its resting value, and one of two types:

- `type: "default"` — a plain, unconditional rule already gives it the value in `default`. Setting it replaces that value.
- `type: "hook"` — nothing unconditional defines it: either no rule at all, or only a modifier or a media query. `default` is the fallback it resolves to, and a wrapper, an inline style or a React prop supplies the real value. `--mg-icon-fg` is one: IconCard's `iconFgColor` prop sets it. So is `--mg-switch-size`, which only `.mg-switch--small` declares.

A record that also carries `"format": "srgb-channels"` and `"wrapInRgb": true` takes sRGB channels (`255 255 255`), not a colour — the stylesheet wraps it in `rgb()`, so a hex or a keyword makes the declaration invalid and it drops with no console warning. It is the same pair of fields `tokens.json` uses for the same distinction, and it is extracted rather than asserted: a property qualifies when every read of it in the compiled CSS sits directly inside `rgb()` or `rgba()`.

```json
{
  "name": "--mg-status-label-indicator-size",
  "type": "default",
  "description": "Size of the indicator. Every shape is a multiple of it, and the wider shapes are pulled back with a compensating margin so each one occupies the same inline space.",
  "default": "0.875rem"
}
```

The names, types and defaults are extracted from the compiled CSS bundles on every build, so a renamed property or a changed default reaches the manifest with no edit. Only the descriptions are written by hand, in `scripts/ai-manifest/custom-properties.js`. `yarn validate-manifest` fails on a description for a property the CSS no longer has, on a property the CSS exposes that nothing describes, and on one that belongs to no component — so the list cannot go quietly stale in either direction. It also fails if a component publishes fewer properties than the `MIN_PROPERTIES` floor in the same file records, and prints the `NOT_PUBLIC` list on every run: `NOT_PUBLIC` is the one way to remove a property from the published API, and without those two it did so in silence.

Not every `--mg-*` property is in `tokens.json` or in this field. The groups that are global rather than component-scoped but declared straight in SCSS rather than generated from `tokens/*.yaml` — the data visualisation palettes (`--mg-dataviz-*`), the Sendai Framework ramps (`--mg-sendai-*`), the five typography roles (`--mg-font-family-*`) and the legacy one-off brand colours (`--mg-color-*`) — are in neither. `llms.txt` names every group and says where each is defined, generated from `GLOBAL_PREFIXES` in `custom-properties.js` so the sentence cannot drift from the list.

### Consumer validation recipe

This is a recipe for a consuming project's validator, not an exhaustive public-property registry. A custom property can accept arbitrary token text when declared and still make the consuming CSS declaration invalid after substitution. Separate **name resolution**, **value format**, and **rendered behaviour** in the report.

The current JSON shapes are `tokens.json.tokens[]` (records keyed by `name`), `index.json.components[]` (with `detailsUrl` and an optional numeric `customProperties` count), and each detail's `customProperties.properties[]`. The library version is `tokens.json.version`, `llms.json.version` or `index.json.library.version`; `schemaVersion` describes the dictionary schema, not the library release. Component detail responses do not carry their own release version. An index version therefore cannot prove that a separately fetched detail belongs to the same snapshot: archive a coherent matching build for reproducible audits, and leave checks that depend on unavailable matching metadata unresolved.

To obtain matching global source for a released npm/CDN build, inspect its registry record, for example `npm view @undrr/undrr-mangrove@2.3.0 gitHead dist.tarball dist.integrity --json`. Download that exact package with `npm pack @undrr/undrr-mangrove@2.3.0 --ignore-scripts` in a scratch directory. The assembled release package places the relevant source at `package/scss/assets/scss/_variables.scss`, `_fonts.scss` and `_tokens-data-viz.scss`; the repository paths below start at `stories/assets/scss/`. Inspect the archive rather than assuming a package layout in future versions. Where the registry supplies `gitHead`, an immutable checkout at that commit is another source; confirm that the public mirror actually serves it. Do not substitute the public mirror's moving `main`, assume a `v{version}` tag exists, or infer source equivalence from the package version alone. If the package/source is unavailable or cannot be tied to the loaded build, report the affected check as unresolved.

1. **Record the evidence version.** Save the loaded stylesheet URL/theme/version, the metadata URLs and their reported versions, and the source revision used for global declarations. Fetch failures or mismatched versions make a check unresolved; they do not prove an invalid property. Use matching release assets or a local build rather than silently comparing an old pinned CSS bundle with today's metadata.
2. **Load the theme dictionary.** Read `tokens.json`, including `scope` and the token records' `format`/`wrapInRgb` metadata. This establishes theme-generated names only.
3. **Load component properties.** Follow `detailsUrl` for the components in the component map; collect `customProperties.properties`. For a whole-library name audit, inspect every index entry with a non-zero `customProperties` count. Keep the owning component and its `type`, `default`, description and any wrapping metadata. A component's `type: "default"` or `"hook"` describes how the value is supplied, not a CSS value grammar. A default is not an enumeration of permitted values.
4. **Resolve global names separately.** For names absent from those records, inspect the documented SCSS sources for the matching release: typography roles and legacy brand colours in `_variables.scss` (Arabic font routing in `_fonts.scss`), and visualization/Sendai palettes in `_tokens-data-viz.scss`, all under `stories/assets/scss/`. The global groups above identify where to look; a matching prefix alone does not prove an exact property exists or is public. Confirm the exact declaration, intended use and consumer reads. If the matching source is unavailable, retain an unresolved result.
5. **Check the value at its use site.** Follow explicit `format` and `wrapInRgb` metadata. Channel values such as `255 255 255` require the consuming `rgb()` wrapper; complete colour expressions are used directly. Do not infer wrapping from `--mg-color-*`, or add a second wrapper merely because the value represents a colour. Where metadata supplies no value grammar, inspect the consuming declaration and test the resolved value in that CSS property's context. Preserve `var()` references and fallbacks; unresolved references, cascade or conditional states require further inspection.
6. **Report evidence, then verify rendering.** Emit the property, owner/scope, source/version, expected format, supplied value and one of the outcomes below. Check the actual consuming CSS property in a browser on the target element/theme/state, including inherited values and overrides. `CSS.supports('--mg-example', value)` only tests custom-property syntax and cannot validate the eventual colour, font or length; `getComputedStyle(element).getPropertyValue('--mg-example')` alone does not establish that a consumer uses it successfully.

| Outcome | Meaning | Example |
|---|---|---|
| Resolved | Exact name and any checked format have supporting evidence; rendering still needs verification. | `--mg-font-family-text` and `--mg-font-family-ui` are resolved from matching global SCSS even though the theme dictionary omits them. |
| Invalid | A specific use contradicts an evidenced contract or demonstrably fails in the consuming declaration. | Assigning `#fff` to a record explicitly marked `format: "srgb-channels"`, `wrapInRgb: true` produces an invalid colour when the component wraps it in `rgb()`. |
| Unresolved | Available evidence is insufficient or incompatible. | An unlisted `--mg-*` name, a missing component detail response, an unavailable global source or an unexpanded `var()` dependency needs review; absence from `tokens.json` is insufficient to label it invalid. |

For example, `color: rgb(var(--mg-color-interactive))` uses channels, while `color: var(--mg-color-text-tab)` uses a complete colour expression. Confirm their records or matching source rather than generalizing from either name. Apply the same lookup process to `--mg-dataviz-*` and `--mg-sendai-*`; these groups are not enumerated by the theme dictionary. A known internal property is unsupported public API, which is a different finding from invalid CSS. Consumer-owned properties also need their own contract rather than a Mangrove rejection.

A successful name/format audit does not establish contrast, focus visibility, responsive behaviour or accessibility. Keep those checks and any unresolved properties visible in the handoff instead of reporting a blanket “all tokens valid”.

### CSS utilities (`ai-components/utilities.json`)

The [utilities reference](https://mangrove.undrr.org/ai-components/utilities.json) lists all CSS utility classes grouped by category. Each class has a description and usage example.

### Release changelog (`releases.json`)

The [releases endpoint](https://mangrove.undrr.org/releases.json) provides machine-readable version history across all library tags, pre-releases, and individual components. It summarizes what changed between releases, categorizes changes (Features, Bug fixes, Tooling, Security) and includes granular component changelogs. Pull requests and issues are merged on `unisdr/undrr-mangrove`, which is not publicly readable, so they appear as plain-text references (`prRef`, such as `unisdr/undrr-mangrove#1234`) with a null `prUrl`, and `tagUrl` is null. Do not look these numbers up on the public fork, whose numbering is separate. Each release has a `changelogUrl` to its section of `CHANGELOG.md` on the fork, and `latest.releaseUrl` falls back to it.

### Versioned copies on assets.undrr.org (`docs/`)

The editorial manual and every `llms-*.txt` sub-manifest are also copied into the build output, `dist/docs/`, and published in the npm package under `docs/`. The UNDRR asset library mirrors both, so the same files are served next to Mangrove's CSS and JavaScript:

- Latest build: `https://assets.undrr.org/mangrove/latest/docs/EDITORIAL-MANUAL.md` and `https://assets.undrr.org/mangrove/latest/docs/llms-editorial-manual.txt`
- Pinned to a release: `https://assets.undrr.org/mangrove/{version}/docs/EDITORIAL-MANUAL.md` and `https://assets.undrr.org/mangrove/{version}/docs/llms-editorial-manual.txt`, from the release after 2.0.0
- The page building and search widget sub-manifests sit alongside: `docs/llms-page-building.txt` and `docs/llms-search-widget.txt` under the same latest or versioned folder

Use a pinned URL where the guidance has to stay fixed, for example in a prompt that is reviewed and reused. The Markdown copy starts with a provenance line, and its links to other guides point at their Storybook pages. `llms.txt` and `llms.json` are not copied; they index the Storybook site. `scripts/copy-docs-to-dist.mjs` does the copy at the end of `yarn build`.

### Page templates

The [PageTemplateExample](https://mangrove.undrr.org/ai-components/example-page-template-example.json) detail file includes four complete page templates:

1. **Canonical UNDRR page shell** — full HTML boilerplate with PageHeader, content area, Footer, and all required scripts in the correct load order
2. **Listing page** — breadcrumbs, filter chips, card grid, pagination
3. **Detail page** — child hero, article body with highlight boxes, sidebar with related cards
4. **Form page** — contact form with all input types, validation patterns, and error summary

### Expected agent workflow

**Vanilla HTML consumers**
1. Fetch `llms.json` for URLs and conventions.
2. Fetch `ai-components/index.json` and filter `vanillaHtml: true`.
3. Make a component map before custom markup. Follow each selected entry's `detailsUrl`; use `quickstart` + `requiredAssets`, then component `renderedHtml`.
4. For entries with `hydration: true`, use the detail file's `hydration.example` instead of the static `renderedHtml` when the component needs to be interactive. For entries with `vanillaModule: true`, use `vanillaModule.example`, which loads a plain module script and no React.

**React consumers**
1. Fetch `ai-components/index.json`.
2. Make a component map, then follow each selected entry's `detailsUrl` for props/types/examples; do not guess component IDs.
3. Use the entry's own `import` line, which names the package subpath: `import { ComponentName } from "@undrr/undrr-mangrove/components/ComponentName.js"`. The package root is not an entry point and resolves on no published version (unisdr/undrr-mangrove#1252). An entry with no `import` line ships in no bundle; one flagged `importRequiresDom: true` cannot be imported in Node or during server-side rendering.

### How it's generated

A single script generates the manifest after Storybook and webpack finish, and a small one then copies the published guidance into `dist/`:

```
storybook build → manifests/components.json (props, types, stories)
webpack build   → dist/components/*.js (compiled React bundles)
        ↓
generate-ai-manifest.js → llms.txt, llms.json, index.json, {id}.json, utilities.json, tokens.json, releases.json
        ↓
copy-docs-to-dist.mjs   → dist/docs/EDITORIAL-MANUAL.md, dist/docs/llms-*.txt
```

`generate-ai-manifest.js` auto-renders React components from `dist/` using `renderToStaticMarkup`, then merges four data sources: the Storybook manifest (props, types), auto-rendered HTML, curated data from `component-data.js` (descriptions, CSS classes, flags, page templates), and release/changelog data from `CHANGELOG.md` via `parse-changelog.js`. Components that render cleanly in Node.js get auto-generated HTML. Components needing browser APIs fall back to curated HTML examples. When run with `--validate`, it checks for stale curated keys, accessibility anti-patterns, and PropTypes coverage.

The pipeline lives in `scripts/ai-manifest/`. Its Storybook input now passes through a preserving, validated adapter in `component-metadata.js`. See the [input contract and parity workflow](MANIFEST-INPUT-CONTRACT.md) before changing metadata extraction; `index.json` does not replace prop/docgen information or attached MDX changelogs. An [opt-in source-only extraction candidate](MANIFEST-SOURCE-SPIKE.md) can generate the same catalogue without building the site, while retaining the experimental Storybook preset dependency; the normal build remains the default.

To regenerate by hand:

```bash
MANGROVE_DOCS_BASE_URL=https://mangrove.undrr.org/ \
node scripts/ai-manifest/generate-ai-manifest.js
```

The generator also accepts `--docs-base=...` when you need a different host.

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
- [Claude Code agent prompts](https://github.com/PreventionWeb/undrr-mangrove/blob/main/docs/AGENTS.md) — specialized agents for accessibility auditing, code review, and other contributor tasks
- [Getting started guide](https://mangrove.undrr.org/?path=/docs/getting-started-getting-started-guide--docs)
- [React integration](https://mangrove.undrr.org/?path=/docs/getting-started-integration-react-integration--docs)
