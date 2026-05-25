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
- **Storybook imports**: use `import { Meta, Canvas } from '@storybook/addon-docs/blocks'` — not `@storybook/blocks` (that package was removed in Storybook 9; this project is on Storybook 10)
- **Storybook links**: use `<LinkTo kind="..." story="...">` from `@storybook/addon-links/react` for prose story links. Never use `href="/?path=..."` or `href="?path=..."` — all MDX and stories render inside the preview iframe, so plain `<a href>` navigates the iframe directly, stripping the Storybook UI shell. For interactive navigation that also sets a global (e.g., theme-switching cards), use `linkTo` + `useGlobals` from `@storybook/preview-api` in an onClick handler — see the `StorybookNavCard` component in `stories/Documentation/Brand/components/` as a reference, and the [Component guide — Linking within Storybook docs](COMPONENT-GUIDE.md) section.

## Keeping the AI manifest in sync

The AI manifest (`scripts/ai-manifest/component-data.js` and `css-utilities.js`) is consumed by external AI agents to generate correct Mangrove markup. When you rename CSS classes, add components, or remove components, the manifest must be updated in the same commit.

Things to check:

- **Class names in `cssClasses` arrays** match the actual SCSS
- **HTML examples** use the current class names, not old ones
- **Deleted components** are removed from `component-data.js`
- **Descriptions** don't reference stale facts (e.g., "uses legacy class names" after a rename)

After changes, run `yarn build` to regenerate the compiled manifest and verify it.

### Side-effect components: return an empty Fragment, not `null`

Storybook is configured to use `react-docgen` (the basic, faster variant — see `.storybook/main.js`). `react-docgen` uses JSX presence to identify React components. A component whose render body only does `return null;` — a common shape for purely side-effect components that manage external libraries via `useEffect` — is **not classified as a component** by `react-docgen`, so its `propTypes` are silently dropped from the AI manifest.

Fix: return `<></>` (an empty Fragment) instead of `null`. Empty Fragments render nothing in the DOM — behaviourally identical to `null` from a consumer's perspective — but `react-docgen` sees the JSX and extracts the component's `propTypes` correctly. `CookieConsentBanner` is the canonical example.

```jsx
// Won't be picked up by react-docgen → manifest reports 0 props
return null;

// Same runtime behaviour, but react-docgen extracts the props
return <></>;
```

### PropTypes coverage: the practical ceiling is ~87%

`yarn validate-manifest` reports the share of components with documented `propTypes`. As of v1.7.0 the ceiling is **~87% (61 of 70)** and reaching it took two scoped passes (#1005, #1007). The remaining 9 entries are *not* PropTypes gaps to chase — they are manifest entries that do not have a React prop contract by design. Don't open PRs trying to push the percentage higher unless you're changing what the manifest classifies as a "component".

The 9 currently exempt entries, grouped by why:

| Why | Entries |
|---|---|
| **CSS-utility documentation pages** (catalogue utility classes; no React props) | `Fontsizeutilities`, `Normalize`, `Typography`, `UtilityCSS` |
| **Vanilla CSS patterns with no `.jsx` file** (consumed as HTML + class names; correctly listed as vanilla-HTML in the manifest) | `Tag` |
| **Story-only examples / page templates** (single-shot demonstrations, not reusable components) | `TypographyIntegrationExample`, `Formvalidation`, `PageTemplateExample` |
| **Intentional empty stubs** (design-token / layout demos with `Component.propTypes = {}`) | `Grid` |

If you add a new entry that falls into one of these buckets, expect it to keep the percentage flat — that's correct behaviour, not coverage drift. If you add a *real* React component, declaring `propTypes` (or fixing the docgen-friendliness of an existing one — see the empty-Fragment gotcha above) is the path to raising the floor.

If at some future point this list shifts (e.g. a vanilla pattern becomes a React component, or an example graduates into a reusable component), update this table in the same PR.

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

## Component quality checks with react-doctor

`react-doctor` is the project's component-quality linter. It bundles a curated set of correctness, performance, accessibility, and architecture rules that complement ESLint and `oxc`. Run it before submitting non-trivial component changes:

```sh
npx -y react-doctor@latest .
```

It prints a 0–100 health score, a categorised list of findings, and writes a full per-rule report to a temp directory. PRs #985, #987, #988, #989 systematically cleared the most mechanical findings (em-dashes, three-period ellipses, `defaultProps`, default `[]`/`{}` props, `useContext`, inline render helpers, etc.). Tracker issue [#986](https://github.com/unisdr/undrr-mangrove/issues/986) tracks remaining categories.

### Refreshing the score badge

A React Doctor badge appears in two places:

- `README.md` — for GitHub / npm visitors
- `stories/Documentation/Intro.mdx` — for Storybook visitors (rendered on the *Introduction* page)

Both are manually-pinned snapshots, not live. Refresh them in lockstep after an audit sweep (or any PR that materially moves the score) by:

1. Run `npx -y react-doctor@latest .` and note the share URL printed at the bottom — it embeds `s` (score), `e` (errors), `w` (warnings), `f` (files affected).
2. Update the four query-string params in both the badge image and the link target in **both files** so they stay in sync.

There is no CI step that does this automatically, so a stale badge is a sign the audit hasn't been refreshed recently — that's by design, since the score itself is most useful as a deliberate periodic check rather than a per-commit signal.

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

The editorial rules in this list (em-dashes, ellipses, English locale) operationalise the brand-voice policy. The source of truth for the editorial side lives in the Storybook `Brand/Written voice` page (`stories/Documentation/Brand/WrittenVoice.mdx`, introduced in PR #983), which catalogues the full set of house conventions with their UN-policy citations. When the brand doc and this section drift, the brand doc wins — this section is the developer-tooling view of those rules.

### Findings to triage carefully

Not every react-doctor finding wants fixing. Two flavours show up:

#### Intentional patterns

Rules that fire correctly on patterns Mangrove deliberately uses. Don't suppress blindly, but also don't try to refactor them away.

- **`react/no-danger` (`dangerouslySetInnerHTML`) ×20.** Mangrove is a Drupal component library; Hero, QuoteHighlight, Gallery, TextCta, MegaMenu/Section, Map, and ScrollContainer accept rich HTML authored in Drupal's text editor (sanitised at save time by Drupal's text-format pipeline). The rule will keep firing on legitimate call sites. Two acceptable patterns:
  - **Sanitise inline** (gold standard) — `dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.summaryText) }}`. The component owns the sanitisation contract; callers can pass any string. See `IconCard.jsx`, `TextCta.jsx`.
  - **Caller-sanitised, documented contract** — `dangerouslySetInnerHTML={{ __html: item.html }}` with the PropTypes JSDoc explicitly declaring the prop pre-sanitised. The component trusts the caller; the contract must be stated in the prop documentation. See `Hero.jsx` — the `html` media variant documents: *"is a pre-sanitised HTML string rendered via dangerouslySetInnerHTML. The consumer (e.g. Drupal) must sanitise."*

  Triage checklist for each call site:
  - Where does the HTML come from? Drupal editor field (trusted, Drupal sanitises at save) / DOMPurify-sanitised (trusted) / user form input / external API (default to untrusted).
  - Is the sanitisation contract documented in PropTypes JSDoc?
  - Prefer inline `// eslint-disable-next-line react/no-danger -- <reason>` over a file-level `/* eslint-disable react/no-danger */`.

- **`react-doctor/rendering-hydration-mismatch-time` ×20.** Chart stories (`Histogram.stories.jsx`, `IndexChart.stories.jsx`) use `Math.random()` to generate fixture data. Fine in Storybook; would mismatch under SSR. The chart *components* themselves are server-safe — the *stories* are intentionally client-only.

#### False positives

Rules that fire but aren't actionable as written.

- **`no-z-index-9999`** — the rule wants a 1–50 scale, but `_variables.scss` defines `$mg-z-index-modal: 5000` etc. by intent. Use the `$mg-z-index-*` tokens instead of raw numbers, accept that the rule will keep firing for tokenised values.
- **`iframe-has-title`** when `title={a || 'fallback'}` — the static analyzer can't see through the `||` fallback. Titles are present and valid.
- **`rendering-conditional-render`** flagged on identifiers prefixed with `show` / `is` (e.g. `showResultsCount`) — the rule infers from the variable name pattern and may fire on booleans.
- **`effect-needs-cleanup`** on d3 chart components that have no `setTimeout` / `addEventListener` in source — likely a d3-pattern false positive.

When you skip a finding, leave a one-line comment explaining why (or note it in the PR's *Out of scope* section) so the next agent doesn't re-investigate.

## Process differences: humans vs. agents

| What | Human developer | AI agent tendency | What the agent should do |
|------|----------------|-------------------|--------------------------|
| Review checklist | Reads once, internalizes | Doesn't read unless told | Read `docs/REVIEW-CHECKLIST.md` before committing component changes |
| Changelogs | Habit from past PRs | Skips unless prompted | Add a changelog entry to the component's MDX |
| Cross-file impact | Mentally tracks references | Focuses on the files being edited | `grep` for old names across all file types after renaming |
| Story source examples | Updates by habit | Doesn't notice stale static HTML | Check `parameters.docs.source.code` in `.stories.jsx` |
| AI manifest | Updates after code changes | Doesn't know it exists | Check `scripts/ai-manifest/component-data.js` and `css-utilities.js` |
| Compiled output | Inspects the result | Trusts the build succeeded | Verify class names in `stories/assets/css/style.css` after build |
| Z-index values | Knows the layer system | Uses raw numbers | Use `$mg-z-index-*` tokens for global stacking (fixed/sticky/portaled); derive backdrops with `$token - 1`; use raw values + comments for local stacking inside a component's own stacking context |
| Quality linter | Runs lint and tests | Skips additional component-quality checks | Run `npx -y react-doctor@latest .` after non-trivial changes; aim to leave the score equal or higher than where you found it |

## Related documentation

- [Review checklist](REVIEW-CHECKLIST.md) — pre-submission component checklist
- [Component guide](COMPONENT-GUIDE.md) — step-by-step tutorial for building a component
- [AI and MCP integration](AI-MCP-INTEGRATION.md) — how the AI manifest is consumed by external agents
- [Agents](AGENTS.md) — specialized Claude Code agent prompts for auditing and review
