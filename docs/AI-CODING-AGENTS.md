# AI coding agent guidelines

> This file is GitHub-only: no MDX imports it, so it does not appear in Storybook. Several other `docs/*.md` guides, including `AI-MCP-INTEGRATION.md` and `FIGMA-INTEGRATION.md`, have Storybook wrappers.

Practical guidance for AI coding agents (Claude Code, Cursor, Copilot, etc.)
working on Mangrove. It focuses on workflow gaps that commonly cause drift in
agent-generated changes.

## Before modifying any component

When you touch a component's JSX, SCSS, stories, or tests, read the [review checklist](REVIEW-CHECKLIST.md) **before committing**. The checklist is referenced in every component's MDX file, but agents typically don't read MDX until late in the process — by then the commit is already made.

For visual refinements, first read [Experience principles](../stories/Documentation/ExperiencePrinciples.mdx)
([published](https://mangrove.undrr.org/?path=/docs/design-decisions-experience-principles--docs)).
Use its decision order: semantics, accessibility and content comprehension precede
visual polish. Shared components own behaviour and geometry; themes own surface
expression. Keep new visual defaults themeable, document changed token routing,
and verify an override as well as the default across all five themes.

### Apply the editorial spelling policy

For UI copy, examples, documentation and changelogs, follow the [Editorial manual](EDITORIAL-MANUAL.md#spelling): Oxford `-ize`/`-ization` forms such as organization, organize, normalize and localize, alongside British forms such as colour, behaviour, centre and programme. Keep source field names, API identifiers and proper names intact. Check linked Storybook labels when correcting spelling.

### Separate archetypes, profiles, presentations and consumer mappings

Organize content patterns around reader needs, not a list of CMS bundles. Reuse Article for news/commentary, Event for general events/programme sessions, Reference entry for definitions/hazard profiles, and Opportunity for jobs. Profiles own editorial differences; presentations select page/teaser/card content; layout supplies geometry. Group existing full-page examples beneath their owning content archetype in Storybook: Article, Publication, Collection or Landing page. Pin existing CSF IDs when changing titles so shared story/docs URLs survive. Hub home is a Landing page variant; persistent hub navigation also composes with detail pages and does not redefine their content types. Do not expose old page-pattern names as competing top-level content families.

Keep Drupal bindings in Mangrove's `stories/Integrations/Drupal/contentPatterns.js`: Drupal is a major consumer. Change those provisional bindings when consumer needs change, without importing Drupal knowledge into the renderer or creating an archetype for every bundle. Preserve audited metadata and omission rules when consolidating profiles. Do not treat a teaser projection as a canonical schema, or a full-page/card stub as an implemented component. Update `content-patterns.json` generation and documentation alongside registry changes.

### Ground CMS content patterns in source configuration

Before implementing a CMS content pattern, inspect its entity view display, layout template, field formatters, conditional visibility and theme overrides in the source repository. Record the source revision, visible field order, hidden fields and deliberate departures in the pattern documentation. A generic card example does not establish parity with a Drupal teaser. The [content teaser audit](CONTENT-TEASER-DRUPAL-AUDIT.md) is the baseline for all 15 indexed node bundles. Keep publication dates, collection freshness, occurrence ranges and vacancy deadlines distinct. Preserve source/author list structure and optional taxonomy links; source adapters own field extraction, domain visibility and URL resolution.

### Content families and presentation stubs

Organize editorial patterns under `stories/Patterns/Content/{Family}/`. Each family's `patterns.js` records its provisional domain meaning and separate full-page, teaser and card presentations. The shared ContentTeaser and ContentCard entry points consume separate family/profile projections; do not expand that input into a universal domain model. Reconcile canonical contracts with schema work before adoption. Status `reference` links an existing example; `experimental` identifies implemented provisional work; `stub` reserves a presentation that is not designed or implemented. Never publish a stub as a callable component or fabricate an import. Card layouts (vertical/book) share card field selection; do not reuse a full teaser hierarchy in cards or render fields hidden in the audited card view. `fields` describes information selection, not geometry. Source bindings publish separately as `components/DrupalContentPatterns.js`; renderers must not re-export them. Update the family registry and generated `content-patterns.json` discovery metadata together when a presentation graduates. Keep existing story routes compatible while connecting them to their content family. In family guides, explain editorial profiles before presentations and keep each presentation's status, references and live examples together; do not append a second teaser section after the card stub.

### Review the component family, not just the first screenshot

- Check optional content: labels present/absent, media absent, long titles, summaries and actions. A first title should not inherit spacing intended to separate metadata.
- Distinguish photographs, complete publication covers, navigation glyphs and illustrations. Shared card classes do not require identical framing or cropping. Standalone photo cards use an enclosed edge image; publication teasers default to a complete square-edged cover with an unboxed caption. Themes can change publication surfaces through `--mg-card-publication-*`. Horizontal editorial teasers follow their audited content pattern, including Drupal’s shared unboxed horizontal shell; do not add images merely because the entity has an image field.
- Compact variants should reduce padding and internal spacing together; check child margins so they do not duplicate the gap.
- Use `imageScale: 'small'` for ordinary navigation icon examples. Medium/large/full are explicit illustration scales; changing a demo does not change the React prop default. `iconSize` supplies image dimensions, not CSS glyph sizing.
- Verify supported plain HTML/CMS shapes as well as React. Gutenberg book cards use `mg-card mg-card__book` without `mg-card__vc`; do not accidentally require an extra class for their layout.
- Keep copyable examples, curated AI descriptions, public token descriptions and the page-building guide consistent with the chosen defaults. Update source files, not generated manifests.
- Record the problem, before/after evidence, themes, relevant accessibility conditions and migration impact in the PR. Label design review as design review; it is not user research.

Before adding or changing motion, read [Motion and animation](MOTION.md). It is the shared policy for interaction tokens, looping indicators, reduced motion in CSS and JavaScript, forced colours and RTL. The published equivalent is [llms-motion.txt](https://mangrove.undrr.org/llms-motion.txt).

Common misses:

- **SCSS docblock comment**: every component stylesheet must begin with a docblock describing the component and linking to its full `.mdx` file on GitHub
- **Changelog entry** in the component's MDX file (date + what changed)
- **No `defaultProps`** — use destructured default parameters (deprecated in React 19)
- **BEM naming** with `mg-` prefix on all CSS classes
- **Story source examples** must match current class names (stale HTML in `parameters.docs.source.code` is invisible to tests but misleads consumers)
- **CSF3 format** for stories (no `Template.bind({})`)
- **"Show code" snippets are generated; don't hand-write them.** By default they show JSX: the args snippet for args stories, the story source for `render` stories. Story files for CSS-only components (such as EmptyState, StatusLabel and Tag) set `parameters.docs.source.html: true` in their meta, and "Show code" then shows the story rendered to formatted HTML. The HTML comes from the story without any decorators (global, file or story), with React `useId` values replaced by readable placeholder ids and React's image preload hints removed. The transform is `.storybook/docsSource.js`; the renderer (`react-dom/server` and Prettier) is a lazy chunk, `.storybook/docsSourceRender.js`, loaded only for opted-in files. It depends on `babel.config.js` applying the CommonJS transform only when the Babel caller is `babel-jest`: compiling stories to CommonJS stops Storybook reading story source, and every `render` story's code panel goes empty
- **Storybook imports**: use `import { Meta, Canvas } from '@storybook/addon-docs/blocks'` — not `@storybook/blocks` (that package was removed in Storybook 9; this project is on Storybook 10)
- **Storybook links**: use `<LinkTo kind="..." story="...">` from `@storybook/addon-links/react` for prose story links. Never hand-write `<a href="/?path=...">` or `<a href="?path=...">` in JSX — all MDX and stories render inside the preview iframe, so a raw anchor navigates the iframe directly, stripping the Storybook UI shell. A Markdown `[text](?path=/docs/...--docs)` link is fine and is the right form where JSX is awkward (table cells, headings, plain Markdown): MDX compiles it to Storybook's `AnchorMdx`, which cancels the click and emits `NAVIGATE_URL`. A leading slash (`](/docs/...--docs)`) is not a Storybook route and 404s. For interactive navigation that also sets a global (e.g., theme-switching cards), use `linkTo` from `@storybook/addon-links` plus `addons.getChannel()` from `storybook/preview-api` (bare `storybook/`, not `@storybook/` — Storybook 10 moved it, and `@storybook/preview-api` is not installed) in an onClick handler. Do not reach for the `useGlobals` hook here: Storybook hooks can only be called inside a story or decorator function. See the `StorybookNavCard` component in `stories/Documentation/Brand/components/` as a reference, and the [Component guide — Linking within Storybook docs](COMPONENT-GUIDE.md) section.

## Keeping the AI manifest in sync

The AI manifest (`scripts/ai-manifest/component-data.js` and `css-utilities.js`) is consumed by external AI agents to generate correct Mangrove markup. When you rename CSS classes, add components, or remove components, the manifest must be updated in the same commit.

Things to check:

- **Class names in `cssClasses` arrays** match the actual SCSS
- **HTML examples** use the current class names, not old ones
- **Deleted components** are removed from `component-data.js`
- **Descriptions** don't reference stale facts (e.g., "uses legacy class names" after a rename)

After changes, run `yarn build` to regenerate the compiled manifest and verify it.

### Side-effect components: return an empty Fragment, not `null`

Storybook uses `react-docgen`, which relies on JSX presence to classify React
components. Pure side-effect components that `return null` may be skipped and
lose `propTypes` in the AI manifest.

Fix: return `<></>` instead. Runtime behavior is the same (renders nothing), but
docgen detects the component correctly. `CookieConsentBanner` is the reference.

```jsx
// Won't be picked up by react-docgen → manifest reports 0 props
return null;

// Same runtime behaviour, but react-docgen extracts the props
return <></>;
```

### PropTypes coverage: there is a practical ceiling

`yarn validate-manifest` reports PropTypes coverage. Some entries are
intentionally non-React or story-only, so coverage has a practical ceiling.
Treat those as expected unless classification changes.

The 12 currently exempt entries, grouped by why (re-derive the count with `yarn validate-manifest` rather than trusting this number):

| Why | Entries |
|---|---|
| **CSS-utility documentation pages** (catalogue utility classes; no React props) | `Fontsizeutilities`, `Normalize`, `Typography`, `UtilityCSS` |
| **Vanilla CSS patterns with no `.jsx` file** (consumed as HTML + class names; correctly listed as vanilla-HTML in the manifest) | `Tag`, `Statuslabel`, `Emptystate` |
| **Story-only examples / page templates** (single-shot demonstrations, not reusable components) | `TypographyIntegrationExample`, `Formvalidation`, `PageTemplateExample`, `LanguageBoundaryDemo` |
| **Intentional empty stubs** (design-token / layout demos with `Component.propTypes = {}`) | `Grid` |

If you add a real React component, declare `propTypes` (and ensure docgen can
see it) to raise coverage. If category membership changes, update the table in
the same PR.

## CSS class rename gotchas

Renaming CSS classes is a common task that creates subtle breakage because CSS failures are silent — elements just lose styling with no error. When renaming classes:

1. **Update both SCSS and JSX** in the same commit
2. **Search the full codebase** for the old class name (`grep -r` across `.scss`, `.jsx`, `.js`, `.mdx`, `.stories.jsx`)
3. **Check story source examples** — hardcoded HTML in `parameters.docs.source.code` blocks doesn't update automatically
4. **Check the AI manifest** — `scripts/ai-manifest/component-data.js` contains curated HTML examples
5. **Check compiled CSS** — after `yarn build` or `yarn scss`, verify old names are absent and new names are present in `stories/assets/css/style.css`
6. **Watch for SCSS nesting** — `.parent { &-child { } }` compiles to `.parent-child`; renaming the parent class requires flattening or adjusting the nesting

## Bare element selectors

For trusted rendered editorial HTML, use the [Rich content pattern](https://mangrove.undrr.org/?path=/docs/patterns-rich-content--docs). Put `mg-content` on the actual body field, keep composed controls outside it, and preserve classed component islands. Its new semantic defaults pass through classless wrappers; existing paragraph-link cues still reach through CMS classes. Wide authored tables/code need local keyboard-accessible overflow, not hidden content or a page-width reset. `.mg-body` remains supported without deprecation.

Mangrove's BaseTypography SCSS files (`stories/Atom/BaseTypography/`) historically used bare HTML element selectors (`blockquote`, `cite`, `mark`, etc.) that style every instance globally. New additions or modifications to these files should scope styles to `.mg-body` to prevent leaking into non-Mangrove areas:

```scss
// Correct — scoped
.mg-body blockquote { ... }

// Avoid — global
blockquote { ... }
```

See [#865](https://github.com/unisdr/undrr-mangrove/issues/865) for the ongoing migration.

## Component quality checks with react-doctor

`react-doctor` is the component-quality linter and complements ESLint/`oxc`.
Run it before non-trivial component changes:

```sh
npx -y react-doctor@latest .
```

It outputs a 0–100 score and categorized findings. Tracker issue
[#986](https://github.com/unisdr/undrr-mangrove/issues/986) tracks remaining categories.

### Refreshing the score badge

A React Doctor badge appears in two places:

- `README.md` — for GitHub / npm visitors
- `stories/Documentation/Intro.mdx` — for Storybook visitors (rendered on the *Introduction* page)

Both are manual snapshots. Refresh them together after any score-moving audit:

1. Run `npx -y react-doctor@latest .` and note the share URL printed at the bottom — it embeds `s` (score), `e` (errors), `w` (warnings), `f` (files affected).
2. Update the four query-string params in both the badge image and the link target in **both files** so they stay in sync.

There is no CI auto-refresh for this badge.

### House conventions enforced by react-doctor

Beyond standard React linting, these conventions have been codified through the audit. Future agents should follow them rather than re-introducing the patterns:

- **No em-dashes (`—`) in JSX text** — use parentheses, colons, semicolons, or commas. Em dashes read as model-output filler. *(Story names and UI labels follow the same rule.)*
- **No three-period ellipses (`...`) in JSX text** — use the typographic `…` (or `&hellip;`). Common in loading / init labels: `Loading…`, `Initialising search…`.
- **English locale follows the editorial split:** Oxford-flavoured British English (UN editorial style) in JSX text, story titles, error messages, JSDoc descriptions, and MDX prose; US English in code identifiers (variable / function / file / package names; CSS properties; JS API names) to match the JavaScript ecosystem. So `color` (CSS property) but `Wait while we colour the chart…` (UI string).
- **No `Component.defaultProps`** — use destructured default parameters. React 19 removes this for function components.
- **Prefer `use(Context)` over `useContext(Context)`** on React 19+. `use()` reads context conditionally inside branches, hooks, and loops; identical at top-level call sites.
- **Hoist default `[]` / `{}` props to module-level constants.** `function X({ items = [] })` creates a new array reference every render, breaking `useMemo` / `React.memo` consumer stability. Write `const EMPTY_ITEMS = []` at module scope and use `items = EMPTY_ITEMS`.
- **Extract inline render helpers as named components.** Arrow helpers like `const renderTitle = (item) => (…)` defined inside the component body get a new identity each render. Lift them to module scope (PascalCase) so React reconciles them as real components.
- **Lazy-init `useState` from computed values.** `useState(data.map(…))` re-runs the initializer every render — use `useState(() => data.map(…))`.
- **Always return a cleanup from `useEffect`** for `setTimeout` / `setInterval` / `addEventListener` / subscriptions. Anything that registers must unregister on re-run and unmount.

For editorial policy source of truth, use
`stories/Documentation/ComponentContribution.mdx` and the Brand guidelines
Storybook page. If this file drifts, brand docs win.

### Findings to triage carefully

Not every react-doctor finding wants fixing. Two flavours show up:

#### Intentional patterns

Rules that fire on deliberate Mangrove patterns. Do not suppress blindly, and do
not refactor away valid patterns.

- **`react/no-danger` (`dangerouslySetInnerHTML`), ~30 call sites.** Mangrove is a Drupal component library; Hero, QuoteHighlight, Gallery, TextCta, MegaMenu/Section and ScrollContainer accept rich HTML authored in Drupal's text editor (sanitised at save time by Drupal's text-format pipeline). The rule will keep firing on legitimate call sites. Two acceptable patterns:
  - **Sanitize inline** — component owns sanitization (see `IconCard.jsx`, `TextCta.jsx`).
  - **Caller-sanitized contract** — documented pre-sanitized input contract (see `Hero.jsx` `html` media variant).

  Triage checklist for each call site:
  - Where does the HTML come from? Drupal editor field (trusted, Drupal sanitises at save) / DOMPurify-sanitised (trusted) / user form input / external API (default to untrusted).
  - Is the sanitisation contract documented in PropTypes JSDoc?
  - Prefer inline `// eslint-disable-next-line react/no-danger -- <reason>` over a file-level `/* eslint-disable react/no-danger */`.


#### False positives

Rules that fire but aren't actionable as written.

- **`no-z-index-9999`** — the rule wants a 1–50 scale, but the token set defines `--mg-z-index-modal: 5000` etc. by intent. Use the `--mg-z-index-*` custom properties instead of raw numbers, and accept that the rule will keep firing for tokenised values. (These were `$mg-z-index-*` Sass variables in `_variables.scss` before 2.0; that file no longer contains any z-index at all.)
- **`iframe-has-title`** when `title={a || 'fallback'}` — the static analyzer can't see through the `||` fallback. Titles are present and valid.
- **`rendering-conditional-render`** flagged on identifiers prefixed with `show` / `is` (e.g. `showResultsCount`) — the rule infers from the variable name pattern and may fire on booleans.

When skipping a finding, add a one-line rationale in code or PR notes.

## Process differences: humans vs. agents

| What | Human developer | AI agent tendency | What the agent should do |
|------|----------------|-------------------|--------------------------|
| Review checklist | Reads once, internalizes | Doesn't read unless told | Read `docs/REVIEW-CHECKLIST.md` before committing component changes |
| Changelogs | Habit from past PRs | Skips unless prompted | Add a changelog entry to the component's MDX |
| Cross-file impact | Mentally tracks references | Focuses on the files being edited | `grep` for old names across all file types after renaming |
| Story source examples | Updates by habit | Doesn't notice stale static HTML | Check `parameters.docs.source.code` in `.stories.jsx` |
| AI manifest | Updates after code changes | Doesn't know it exists | Check `scripts/ai-manifest/component-data.js` and `css-utilities.js` |
| Compiled output | Inspects the result | Trusts the build succeeded | Verify class names in `stories/assets/css/style.css` after build |
| Z-index values | Knows the layer system | Uses raw numbers | Use `--mg-z-index-*` custom properties for global stacking (fixed/sticky/portaled); derive backdrops with `calc(var(--token) - 1)`; use raw values + comments for local stacking inside a component's own stacking context |
| Quality linter | Runs lint and tests | Skips additional component-quality checks | Run `npx -y react-doctor@latest .` after non-trivial changes; aim to leave the score equal or higher than where you found it |
| Local Storybook boot | Already has it running | Hits a `sass-loader` "Can't find stylesheet to import" error in a fresh clone/worktree | Run `npm run build:tokens` (or `npm run scss`) first — `stories/assets/scss/generated/*.scss` is gitignored and generated on demand |
| CSS-only changes | Eyeballs the result in a browser | Trusts passing `jest`/`stylelint` as proof it works | jsdom never loads external SCSS, so cascade bugs (wrong specificity, a rule that never sets `display`, a crop tuned for the wrong asset) pass tests silently — verify in a real browser with `node scripts/storybook-screenshot.mjs`, not just green CI |

## Related documentation

- [Review checklist](REVIEW-CHECKLIST.md) — pre-submission component checklist
- [Component guide](COMPONENT-GUIDE.md) — step-by-step tutorial for building a component
- [AI and MCP integration](AI-MCP-INTEGRATION.md) — how the AI manifest is consumed by external agents
- [Agents](AGENTS.md) — specialized Claude Code agent prompts for auditing and review
