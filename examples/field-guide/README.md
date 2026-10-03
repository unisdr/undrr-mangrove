# Mangrove field guide exploration

A standalone interactive companion to Mangrove’s existing Storybook brand and
integration documentation. Inspired by the page-by-page DELTA Resilience brand
book in `delta-pw/_docs/brand/brand-book/index.html` (reference branch
`docs/logo-exploration`, inspected at brand-book commit `62276621`). No Delta
artwork, animation code or generated lookbook images are copied.

This work starts from `spike/figma-token-bridge` at `f3531558`, in the separate
branch `spike/mangrove-field-guide`. It changes no existing component or token.

Edition 02 applies a user-requested brand analyst review of DELTA’s lookbook.
See [BRAND-REVIEW.md](BRAND-REVIEW.md) for the critique and resulting changes.
The new fictional community image, generated with the built-in image tool,
is documented with its complete prompt in [assets/README.md](assets/README.md).

Edition 03 applies the subsequent design-studio critique as an editorial atlas:
a compact applications introduction, complete objects, quiet format controls,
marginal notes and a simplified ownership panel. See
[DESIGN-STUDIO-REVIEW.md](DESIGN-STUDIO-REVIEW.md) for all changes and current
visual/interaction checks.

## Run

From the repository root, with the repository’s dependencies installed:

```sh
yarn build:field-guide
yarn example:field-guide:serve
```

Open <http://127.0.0.1:6117/>. The server stays running until stopped. The
generated `examples/field-guide/dist/` directory is ignored by Git. To use a
different port:

```sh
node scripts/serve-storybook.mjs examples/field-guide/dist 6120
```

The build uses the existing token generator and Sass entry points to produce
the five property stylesheets and the full theme-token dictionary. Generated
token partials are written only inside this checkout. Rebuild after changing
source files or YAML tokens; this example has no watch mode.

Serve `dist/` over HTTP, since the guide fetches `tokens.json`. Its files can be
copied as a directory to any static host. Font faces retain Mangrove’s existing
UNDRR asset CDN URLs, so exact typography needs access to that CDN. Other assets
are included locally. There are no new runtime packages, analytics or storage.

## Explore

| Before                                       | After                                                                                                                                                |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| DELTA’s linear brand-book reference          | Ten Mangrove chapters: introduction, identities, applications, colour, type, patterns, voice, handoff, tokens and next steps                         |
| One project identity                         | UNDRR, PreventionWeb, MCR2030, IRP and DELTA Resilience, with a persistent property selector                                                         |
| Static palette examples                      | Semantic swatches, correct CSS expressions, copy actions and a live WCAG contrast pairing                                                            |
| Static type samples                          | Editable specimens, Latin/Arabic language boundaries and role-based typography                                                                       |
| Application lookbook                         | Social, web, guide and learning compositions with audience and hierarchy notes, followed by working Mangrove card/button/tag specimens               |
| Separate design and implementation reference | YAML-to-CSS/Figma/component overview, HTML/React/CSS examples and searchable generated tokens with descriptions, value formats, copying and download |
| Sequential reading                           | Chapter contents dialog, keyboard arrows, stable `#chapter/property` links, browser history, keyboard focus and skip navigation                      |
| Screen-only prototype                        | Responsive layout, reduced-motion support and all-chapter browser printing with compact specimen styles                                              |

Examples:

- `/#applications/undrr`
- `/#colour/delta`
- `/#type/preventionweb`
- `/#patterns/mcr`
- `/#reference/irp`

Arrow keys turn chapters except inside text fields, selects or the contents
dialog. Escape dismisses the dialog. Copying requires a browser secure context
(localhost qualifies); failures show a message so the visible example can be
copied manually.

The print action uses the current property and includes all chapters, with the
selected application format and its annotations. The
reference table follows its current search query. This is a browser print view,
not a separately typeset publication.

## Sources and scope

- `stories/Documentation/Brand/{AboutThisGuide,BrandGuidelines,CommonPatterns}.mdx`
- `stories/Documentation/Brand/data/themes.js`
- `stories/Documentation/ReactIntegration.mdx`
- `docs/AI-MCP-INTEGRATION.md`
- `tokens/*.yaml` and `scripts/build-tokens.cjs`
- `stories/assets/scss/{style*,_variables,_fonts}.scss`
- Current `VerticalCard`, `cardParts`, `CtaButton` and `Tag` markup

The existing documentation and tokens remain authoritative. Five property
identities are layered over the Mangrove base; the base is not a sixth property.
The token dictionary intentionally excludes component style hooks, typography
roles defined in Sass, Sendai ramps and data visualisation palettes.

The page specimens contain illustrative content and a compact teaching header,
not the complete official page shell. The guide links to the production recipes
and canonical PageHeader/Footer documentation. Brand marks use the existing
UNDRR SVG only. This exploration grants no new artwork or identity approval.

The Figma bridge chapter describes the branch’s existing workflow. The guide
does not read or write a Figma file. Figma decisions can continue independently.

## Possible next decisions

- Keep this as a standalone field guide, or integrate chapters into Storybook.
- Decide whether the main audience is designers/editors, developers, or both.
- Add selected real page applications once the reading format is agreed.
- If promoted to maintained documentation, automate the build and check guide
  links, token freshness and browser interactions in CI.

## Draft handoff

The exploration is stacked on the Figma token branch in
[PR #1319](https://github.com/unisdr/undrr-mangrove/pull/1319), which is itself
stacked on the React Aria work. Before opening the field-guide draft, its two
commits were rebased onto parent revision `201cd8be`. Keep the PR base at
`spike/figma-token-bridge` while that parent remains open.

For another agent taking over, start with this README and
[BRAND-REVIEW.md](BRAND-REVIEW.md) and
[DESIGN-STUDIO-REVIEW.md](DESIGN-STUDIO-REVIEW.md), then run the guide and review its applications
chapter in all five properties. Continue the audience and format decisions
above; approved documentary imagery and actual property artwork are the next
brand refinements. Preserve the source/provenance distinctions and check mobile,
keyboard and print behaviour after edits. The existing Storybook documentation
and YAML tokens remain authoritative.

Generated `dist/` files and the local `node_modules` symlink are not committed.
A fresh checkout needs repository dependencies installed. No deployment is
included in this draft.

## Initial edition validation

- Built all five property bundles and the 202-token dictionary successfully.
- Passed scoped ESLint, Prettier, JavaScript syntax and Git whitespace checks.
- Reviewed desktop and 390px mobile screenshots; checked theme switching,
  shared links, search (including no results), the contents dialog, Escape,
  keyboard navigation and skip focus without changing the active chapter.
- Confirmed Arabic display/body roles resolve to Noto Kufi Arabic and Noto Sans
  Arabic, with right-to-left direction.
- Ran axe 4.12 on all nine chapters with the UNDRR theme: zero violations in
  each. Also checked the DELTA action specimen, including its save feedback.
  Symbol-only navigation controls remain automated contrast checks marked
  incomplete; a scan is not an accessibility certification.
- Rendered and visually inspected the browser print output: nine pages with a
  two-token reference filter, including complete pattern and handoff pages.
  An unfiltered token appendix is intentionally longer.

The Sass build emits the repository’s existing syndication-search deprecation
warning. The guide adds no suppression for that component.

## Edition 02 validation

- Rebuilt all five property bundles and the 202-token dictionary; passed scoped
  ESLint, Prettier, JavaScript syntax and Git whitespace checks.
- Inspected the four application compositions on desktop and mobile. At 390px,
  all formats have no horizontal overflow or broken images.
- Ran axe 4.12 on each of the four formats across all five properties, and on
  all four mobile formats with UNDRR: zero violations after refinement. The
  existing incomplete contrast checks for symbol navigation still require
  human review.
- Removed the format selector’s background fade so its selected text/background
  contrast changes together, including during rapid switching.
- Rendered the browser print view with the A4 guide selected and a one-token
  reference filter: ten complete chapter pages. Visually checked the new
  applications and voice/imagery pages, including image crops, ownership,
  concept labels and chapter footers. The unfiltered token appendix remains
  longer.
