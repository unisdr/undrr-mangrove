# Changelog

Detailed change records live in two places:

- **Project releases**: [GitHub Releases](https://github.com/unisdr/undrr-mangrove/releases) — library-wide version history.
- **Component changelogs**: Each component's MDX file has a `## Changelog` section with per-component version history. Browse them in [Storybook](https://mangrove.undrr.org/) or in the `stories/` directory.

For the changelog format specification, see the [component contribution guide](https://mangrove.undrr.org/?path=/docs/contributing-component-standards--docs#changelog-format).

This file collects only cross-cutting library-wide notes that don't fit either location above (e.g. repo-wide build / tooling / policy changes).

## Unreleased

_Notable cross-cutting changes between releases land here. Per-component changes belong in the component's MDX changelog._

- **Breaking — the four CamelCase SCSS aliases removed:** `ShowMore.scss`, `FullWidth.scss`, `TableOfContents.scss` and `SyndicationSearchWidget.scss` each existed only to `@import` their kebab-case sibling and `@warn` that they were deprecated. All four are deleted, so the npm package no longer ships `scss/Utilities/ShowMore/ShowMore.scss`, `scss/Utilities/FullWidth/FullWidth.scss`, `scss/Components/TableOfContents/TableOfContents.scss` or `scss/Components/SyndicationSearchWidget/SyndicationSearchWidget.scss`. Nothing in the library imported them (`stories/assets/scss/_components.scss` already imports the kebab-case files); they shipped only because the package assembly copies every `stories/**/*.scss`. Consumers importing a CamelCase path switch to the kebab-case one — `show-more`, `full-width`, `table-of-contents`, `syndication-search-widget` — which is the same stylesheet the alias forwarded to, so the compiled CSS is unchanged. Dropping one and keeping three would give consumers a break they could not generalise from, and a major release is the moment to take all four. Migration table in [the 2.0 release notes](https://mangrove.undrr.org/?path=/docs/getting-started-release-notes-v2-0--docs). ([#1193](https://github.com/unisdr/undrr-mangrove/pull/1193))
- **Story fixture hygiene:** a sweep of demo-only defects found in the 2.0 polish audit — a Legend "Dark theme" story that depended on a class the library never defined, a dead `via.placeholder.com` image, three demo pages that scrolled a 375px viewport sideways (including a ScrollContainer story that asked for a 1500px minimum width in an unbounded parent), colour inventories with no contrast caveat, and an empty CookieConsentBanner canvas with nothing explaining it. Each is recorded in the affected component's own changelog. The CookieConsentBanner "Default" story now states in the canvas that the component renders nothing itself and that the consent bar is drawn by the CDN library, which does not show it inside Storybook. ([#1193](https://github.com/unisdr/undrr-mangrove/pull/1193))
- **Documentation links resolve again:** the review-checklist banner on all 75 component docs pages linked a relative repository path (`../../../docs/REVIEW-CHECKLIST.md`), which 404s in a built Storybook; it now links the published [review checklist](https://mangrove.undrr.org/?path=/docs/contributing-build-a-component-review-checklist--docs), as does the template in `docs/COMPONENT-GUIDE.md`. Six links pointed at story ids or `<LinkTo>` kinds the rc.1 regrouping renamed, and 24 more used a host-absolute `/docs/…--docs` path that is not a Storybook route. The guides under `docs/` are read on GitHub as well as in Storybook, so they keep their relative `FILE.md` links and the wrappers in `stories/Documentation/` now rewrite them at import time (`stories/Documentation/docsPageLinks.js`) — the review checklist's own links work on both. A new `scripts/__tests__/docs-links.test.js` fails the build on a Markdown link or a `<LinkTo kind>` that resolves to no story, on either broken path form, and on a guide whose rewrite is missing or stale. ([#1191](https://github.com/unisdr/undrr-mangrove/pull/1191))
- **Documentation accuracy:** the CopyButton vanilla snippet pointed at `dist/js/copy-button.min.js`, which the CDN does not serve, and loaded an ES module without `type="module"`; the contribution and accessibility guides taught `$mg-color-*` / `$mg-spacing-*` SCSS variables that 2.0 removed, and `$mg-text-color` / `$mg-link-color`, which never existed. The Brand guidelines page no longer nests a `<p>` inside a `<p>`, the only console error on any docs page, and the Loader page no longer carries a work-in-progress caveat. The Component gallery and the Content syndication page no longer advertise `BarChart`, `MapComponent` and `Fetcher`, removed in 1.8.0. ([#1191](https://github.com/unisdr/undrr-mangrove/pull/1191))
- **AI manifest hydration coverage:** every component that ships a `*.hydrate.js` now carries a structured `hydration` contract — note, selector, CDN modules, data attributes, events and a runnable example. Previously only ServiceNotice and Tree did, so an agent copying `renderedHtml` for CopyButton, ShareButtons, IconCard, StatsCard, Gallery, MegaMenu, Pager, QuoteHighlight, ScrollContainer, TextCta, UserFeedback, Syndicated search, Drawer or Notice got markup with no behaviour and nothing saying so. CopyButton also gains a `vanillaModule` contract for `js/copy-button.js`. ShareButtons, Gallery, MegaMenu, Pager, ScrollContainer and Syndicated search had no `component-data.js` entry at all and gain one. ([#1194](https://github.com/unisdr/undrr-mangrove/pull/1194))
- **Drawer, Tree and Legend docs:** the Drawer and Tree docs pages embed their stories instead of showing prose and a props table with no example, the placeholder "Item 1 / Item 2" and "Drawer content goes here." copy is replaced with realistic content, and Legend's duplicated canvas is gone and the page is filled out to match its peers. ([#1194](https://github.com/unisdr/undrr-mangrove/pull/1194))
- **The orange accent carries no text:** Sendai orange (`orange-900`, `orange-800`, and the `secondary`, `tag-accent`, `tag-accent--hover` and `hero--secondary` tokens that resolve to them) is documented as a non-text accent — borders, rules, icon fills and blocks with no copy over them. No text colour clears AA on it: white measures 2.65 to 2.95 against a 4.5 minimum, and black, which passes WCAG at 7.11 to 7.92, still misses the perceptual body-text floor of 63. The rule is stated in `docs/COLOUR-CONTRAST-METHODOLOGY.md`, in `docs/REVIEW-CHECKLIST.md`, at the token definitions in `tokens/undrr.yaml` and `tokens/mangrove.yaml`, at each stylesheet that paints the surface, on the Storybook colour inventories (Utility CSS background and text colours, Brand identity) and in each affected component's docs. The components that still pair text with the orange — `Tag --accent`, `TextCta --secondary`, `Hero --secondary`, `HubHeader --surface-secondary`, `Card --secondary` and `AuthorImage --secondary` — are named as recorded exceptions with their measured values; removing the combination is a brand decision tracked in [#1196](https://github.com/unisdr/undrr-mangrove/issues/1196). The contrast suite gains the Text CTA, hub header, author-image and quote-highlight pairs it was not measuring, so none of them can drift unnoticed. No colour changed. ([#1198](https://github.com/unisdr/undrr-mangrove/pull/1198))
- **Accessible names and announcements across six components:** a pre-release sweep for controls that exist but are not named, announced or distinguishable. **ShowMore's documented markup changes visibly:** the toggle is now `<button type="button">` instead of `<a href="#">`, with `aria-controls` maintained by `mgShowMore()`; an anchor still in consumer markup keeps working and is given `role="button"` plus the Space handler that role promises. The toggle carries no `aria-expanded`: the collapse is `overflow: hidden` clipping, which leaves the content in the accessibility tree and the tab order, so there is nothing hidden to describe — the docs now say so, and focus entering a clipped container expands it. Error page logo links get an accessible name, in the component and, separately, in the eleven static Cloudflare templates, whose markup is maintained by hand rather than generated from the component. Card summary links and error-page body links are underlined at rest rather than distinguished by colour alone. Gallery HTML thumbnail previews are `inert`, so injected links and buttons are no longer focusable inside the tab button. Dismissing a Notice returns focus to the control that raised it or to the nearest neighbour instead of `<body>`. The vanilla CopyButton example has a real `aria-label`, every integration path now reads that plain `aria-label`, and both the script and `fromElement` still honour the older `data-aria-label` on an otherwise unnamed button. Per-component detail is in each component's MDX changelog. ([#1190](https://github.com/unisdr/undrr-mangrove/pull/1190))
- **Logical properties in RTL:** Hero, FormErrorSummary, Syndicated search, Card, StatsCard, Author image and the legacy `.fa-before` icon gap use logical properties (`margin-inline-start`, `padding-inline-end`, `border-inline-start`, `inset-inline-end`, `text-align: start`) instead of physical left/right ones. The visible fix is the split hero, which broke out of the viewport in Arabic at mobile widths and gave the whole page a horizontal scrollbar; the syndicated search clear button also grew to a 36x36 target with an 18px glyph, and the field's reserved inline-end padding grew from 24px to 44px to match. The rest of the syndicated search widget's direction-specific spacing (custom select trigger and chevron, active-filter label, chip connector, result separator, facet label and subtype indents) is logical too. Apart from the search field's clear button and padding, LTR rendering is unchanged. ([#1192](https://github.com/unisdr/undrr-mangrove/pull/1192))
- **StatusLabel indicators carry a shape:** every status label's indicator now has its own shape as well as its own colour — draft a rounded square, waiting for more information a capsule, waiting for validation a rounded diamond, degraded a chamfered triangle, offline an octagon; published and the unmodified base keep the circle. This is a visible change wherever `.mg-status-label` is used, and consumers need change no markup: the shapes come from CSS on the same empty `<span>`. The status name is still always present as text, so this is a redundant cue rather than a WCAG fix; it is there because several of the colours are close under colour vision deficiency (degraded and offline are 3.3 CIE76 / 1.1 dE2000 apart simulated for deuteranopia, against a just-noticeable difference of about 2.3), because a CSS-only component gets reused without its label, and because a second cue is faster to scan. The seven marks are drawn as one family — all convex, all softened at one corner radius, all carrying the same ring — and that ring is now exactly `--mg-status-label-indicator-border-width` on every edge of every shape, including the two drawn with a clip path, where it used to vary from the full width down to nothing ([#1208](https://github.com/unisdr/undrr-mangrove/issues/1208)). `.mg-status-label-group` keeps its list semantics in Safari, so VoiceOver announces the item count ([#1209](https://github.com/unisdr/undrr-mangrove/issues/1209)). The indicators also survive Windows High Contrast and printing without background graphics, and each shape still occupies one `--mg-status-label-indicator-size` of inline space, so a column or a table of statuses keeps a single text alignment edge. The AI manifest entry now lists the component's fourteen custom-property hooks. See [Status label](https://mangrove.undrr.org/?path=/docs/components-status-label--docs), "Shape as well as colour". ([#1206](https://github.com/unisdr/undrr-mangrove/pull/1206))
- **The status indicator palette is documented as measured, and deliberately unchanged:** the seven `--mg-status-label-indicator--*` fills were re-measured for WCAG contrast on each surface they actually appear on, for Oklab perceptual lightness, and pairwise as CIE76 and CIEDE2000 under protanopia, deuteranopia and tritanopia, in two independent simulation models (Machado 2009 and Viénot 1999) applied in linear RGB. Both models agree that degraded and offline are indistinguishable to a deuteranope (1.1 and 0.6 dE2000 against a ~2.3 just-noticeable difference), which is what the shapes added in [#1206](https://github.com/unisdr/undrr-mangrove/pull/1206) are for. Rebalancing the palette was measured and rejected: holding the hue associations and requiring every fill to clear 3:1 on white, the best worst-pair available from the tokens this system already owns is 2.34 dE2000 — still at the threshold, merely relocated — and it costs all four DELTA status colours, drops the worst normal-vision pair from 13.4 to 6.8 dE2000, and leaves the ring at 1.0-1.8:1 against its own fills. Seven unordered categories is past what colour carries, the same limit `_tokens-data-viz.scss` already records as `--mg-dataviz-categorical-safe-count: 4`. The reasoning and the full tables are in [Status label](https://mangrove.undrr.org/?path=/docs/components-status-label--docs), "Why the palette is not rebalanced instead". Also newly documented: none of the five themes overrides any of the seven fills, so the status palette is identical in all of them by design; and dropping the ring with `--mg-status-label-indicator-border-width: 0` removes the only part of the four pale marks that clears 3:1 and, in forced colours, removes the base indicator altogether. No colour changed.
- **Font families are role custom properties, and the AI docs now say so once:** `llms.txt` listed font families with breakpoints and `$mg-tabs-border-bottom` as SCSS-only build-time variables, 38 lines above the Typography section that correctly describes the five `--mg-font-family-*` roles. An agent reading top to bottom hit the wrong statement first and hard-coded a typeface, which takes the page out of the Arabic re-pointing in `_fonts.scss`. All five roles are defined on `:root` in the shipped bundle, which reads `var(--mg-font-family-text)` throughout. Breakpoints and `$mg-tabs-border-bottom` genuinely have no custom property — neither appears in the compiled CSS — so they stay, and the `$mg-font-face-*` variables are named separately as what the roles are built from at compile time. The project standards page carried the same claim twice and the brand common-patterns page named the typefaces without saying that CSS must name a role. The same sweep corrected the typeface-to-element mapping on the two brand pages, which said Roboto Condensed sets h1-h6: in Latin it does not — headings inherit Roboto from `body`, and Roboto Condensed is the `display` and `ui` roles. Fixed at the source in `scripts/ai-manifest/generate-ai-manifest.js`. ([#1210](https://github.com/unisdr/undrr-mangrove/pull/1210))
- **Release notes format:** `docs/RELEASES.md` now defines a standard format and template for GitHub Release notes (intro, full-detail link, and fixed section order: breaking and visible changes, new features, bug fixes and hardening, documentation and discoverability, dependencies, CDN), based on the 2.0.0-rc.1 and 2.0.0-rc.2 releases.

## 2.0.0-rc.2 — 2026-09-17

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-rc.2) for the release when published. This prerelease is prepared for the npm `next` tag; `latest` stays on 1.x.

This section is intentionally brief. Full detail and migration steps are in the [v2.0 release notes](https://mangrove.undrr.org/?path=/docs/getting-started-release-notes-v2-0--docs) (source: [`docs/RELEASE-2.0.md`](docs/RELEASE-2.0.md)).

- **Buttons:** filled primary, secondary and disabled buttons paint their fill under the border, so they render the same size as outline buttons. New `--mg-border-color-button-primary` and `--mg-border-color-button-secondary` tokens (default `transparent`) colour that stroke; Hero and strong TextCta surfaces set a light one. Icons are vertically centred, and buttons with an icon and a label are 36px tall. A bare `.mg-icon-button` owns its ghost styling, keeps its icon visible on hover in every theme, and no longer picks up `display: flex` and `10px` padding from a MegaMenu rule (see upgrade notes). ([#1173](https://github.com/unisdr/undrr-mangrove/pull/1173), [#1171](https://github.com/unisdr/undrr-mangrove/issues/1171))
- **Tree hydration:** Tree hydrates from a plain nested list in a `data-mg-tree` container and gains a `toggleIcon` prop. The default export of `components/Tree.js` is now `HydratedTree` (named `Tree` / `TreeItem` exports are unchanged), and item DOM ids are scoped to each tree instead of `mg-treeitem-{id}`. Keyboard, RTL chevron and IRP contrast fixes. ([#1176](https://github.com/unisdr/undrr-mangrove/pull/1176), [#1172](https://github.com/unisdr/undrr-mangrove/issues/1172))
- **ServiceNotice:** the status link announces that it opens a new tab (translatable `labels.opensInNewTab`) and survives server rendering; the hydration contract is documented and published in a new AI manifest `hydration` field; the `mg-notice--compact` / `mg-notice--overlay` class fallbacks are removed from the container once read; DELTA's status link meets 4.5:1 through `--mg-notice-action-secondary`. ([#1175](https://github.com/unisdr/undrr-mangrove/pull/1175), [#1178](https://github.com/unisdr/undrr-mangrove/pull/1178), [#1172](https://github.com/unisdr/undrr-mangrove/issues/1172))
- **Line heights are public:** `--mg-font-line-height-500` and `--mg-font-line-height-700` custom properties are emitted in every theme; compiled line heights are unchanged. `$mg-font-line-height-*` are deprecated Sass aliases until 3.0. ([#1170](https://github.com/unisdr/undrr-mangrove/pull/1170), [#1085](https://github.com/unisdr/undrr-mangrove/issues/1085))
- **Hydration `identifierPrefix` is unique page-wide:** roots take a page-wide number shared by every hydrator and runtime copy, so a later `update(context)` no longer reuses a prefix and pages loading two copies of React no longer get duplicate DOM ids. The option and return value are unchanged; only the number in the generated prefix differs. ([#1178](https://github.com/unisdr/undrr-mangrove/pull/1178))
- **Tabs lifecycle:** a vanilla tab set removed from the page without `mgTabsDestroy()` is suspended instead of leaking: its window, `document.fonts` and `ResizeObserver` registrations are released, its markup and selection stay, and it resumes if the same node is re-attached. `mgTabs()` and `mgTabsRuntime()` accept an optional `{ signal }` third argument; aborting it destroys the tab sets that call initialised, and the React `Tab` wrapper passes one. A hash change made while a set was suspended is followed when it resumes or is re-initialised. While any set is tracked, the runtime holds one page-wide window `resize` and one `hashchange` listener to find removed sets. `mgTabsDestroy(scope)` destroys every set in scope even if one throws. ([#1183](https://github.com/unisdr/undrr-mangrove/pull/1183), [#1180](https://github.com/unisdr/undrr-mangrove/issues/1180))
- **Switch pending state and `js/switch-pending.js`:** `aria-busy="true"` on `.mg-switch__input`, or `.mg-switch--pending` on the label, shows a spinning ring in the thumb (a static dotted ring under reduced motion) over a greyed track, without disabling the input. `aria-disabled="true"` switches are now dimmed like `:disabled` but keep a full-strength focus ring. In forced colours the switch was invisible; it now draws itself in system colours. New `--mg-switch-*` custom properties can be set on the switch or any ancestor. A new dependency-free module, `js/switch-pending.js` (CDN and npm), handles the announcements, ignored presses, timeout and revert for plain HTML and Drupal sites: `mgSwitchPending(input, { save, status, timeout, labels, signal })` returns `{ destroy() }`, `[data-mg-switch-pending]` switches are enhanced on page load and can be answered by one `mg-switch:save` listener through `respondWith()`, `mgSwitchPendingInit()` / `mgSwitchPendingDestroy()` handle dynamic content, and it dispatches `mg-switch:pending`, `mg-switch:settled` and `mg-switch:failed`. See [Checkbox](https://mangrove.undrr.org/?path=/docs/components-forms-checkbox--docs), "Pending state". ([#1184](https://github.com/unisdr/undrr-mangrove/pull/1184))
- **StatusLabel and EmptyState docs:** `--warning` / `--negative` are documented as supported service-health modifiers, EmptyState has heading-level guidance, and a StatusLabel group in RTL no longer picks up the global list padding. ([#1174](https://github.com/unisdr/undrr-mangrove/pull/1174))
- **Docs domain is `mangrove.undrr.org`:** Storybook, `llms.txt`, `llms.json`, `releases.json`, `tokens.json` and `ai-components/` are published at `https://mangrove.undrr.org/`, and documentation links, generated AI manifest URLs and the CSS/JS banners use it. Old `preventionweb.github.io/undrr-mangrove/` URLs redirect to the same path on the new domain. CDN URLs (`assets.undrr.org/mangrove/`) and the npm package are unchanged. ([#1185](https://github.com/unisdr/undrr-mangrove/pull/1185))
- **AI manifest:** a new `vanillaModule` field describes components enhanced by a plain module from `/js/` with no React or import map (Checkbox, flagged `vanillaModule: true` in the index). The `vanillaScripts` URLs and the `llms.txt` script glob pointed at `js/*.min.js`, which the CDN does not serve; they now use `js/*.js`. ([#1184](https://github.com/unisdr/undrr-mangrove/pull/1184))
- **Repo tooling (no change to the published package):** `yarn pack:assemble` / `yarn pack:preview` build and compare the npm package locally with the same script as the publish workflow ([#1169](https://github.com/unisdr/undrr-mangrove/pull/1169)); Storybook "Show code" works on every docs page again, with opt-in HTML snippets for CSS-only stories ([#1179](https://github.com/unisdr/undrr-mangrove/pull/1179), [#1177](https://github.com/unisdr/undrr-mangrove/issues/1177)); and `preview-stats.json` is no longer uploaded with the Storybook Pages site ([#1181](https://github.com/unisdr/undrr-mangrove/pull/1181)).

## 2.0.0-rc.1 — 2026-09-16

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-rc.1) for the release when published. This prerelease is prepared for the npm `next` tag; `latest` stays on 1.x.

This section is intentionally brief. Full detail and migration steps are in the [v2.0 release notes](https://mangrove.undrr.org/?path=/docs/getting-started-release-notes-v2-0--docs) (source: [`docs/RELEASE-2.0.md`](docs/RELEASE-2.0.md)).

- **Notice foundation:** new `Notice` component (`info`, `warning`, `negative`, `positive`; compact, prominent and overlay modifiers; hydration) with `ServiceNotice` for degraded or offline embeds, including capped automatic retry and UN-language labels. **Snackbar now renders through Notice** (visual change; see upgrade notes). StatusLabel gains `--warning` / `--negative`. ([#1164](https://github.com/unisdr/undrr-mangrove/pull/1164))
- **Type scale is public:** `--mg-font-size-100` … `--mg-font-size-1100` custom properties are emitted in every theme and read by all components with `var()`; compiled sizes are unchanged. `$mg-font-size-*`, `$mg-font-body` and `$mg-font-tag` are deprecated Sass aliases until 3.0. A new test fails the build on any `var(--mg-*)` that nothing defines. ([#1168](https://github.com/unisdr/undrr-mangrove/pull/1168), [#1167](https://github.com/unisdr/undrr-mangrove/issues/1167))
- **New prototype primitives:** Drawer and Tree navigation ([#1158](https://github.com/unisdr/undrr-mangrove/pull/1158)), map and chart Legend ([#1159](https://github.com/unisdr/undrr-mangrove/pull/1159)) and Range slider ([#1160](https://github.com/unisdr/undrr-mangrove/pull/1160)), with hydration for Drawer and full keyboard navigation for Tree ([#1163](https://github.com/unisdr/undrr-mangrove/pull/1163)). Before rc.1 these were hardened: Drawer renders strings as text, is inert when closed, manages focus and hydrates with trigger buttons; Tree mirrors in RTL; Legend and Range gained accessibility fixes and tests. ([#1166](https://github.com/unisdr/undrr-mangrove/pull/1166))
- **CopyButton:** new copy-to-clipboard button ([#1160](https://github.com/unisdr/undrr-mangrove/pull/1160)) with React hydration and a zero-dependency vanilla script, `js/copy-button.js` (`window.UNDRR.copyButton`), plus UN-language labels ([#1163](https://github.com/unisdr/undrr-mangrove/pull/1163)). It reports failed copies with a manual-copy hint ([#1166](https://github.com/unisdr/undrr-mangrove/pull/1166)).
- **New styles:** data table, badge, accordion, switch and icon-button styles. ([#1157](https://github.com/unisdr/undrr-mangrove/pull/1157))
- **Discoverability:** machine-readable `releases.json` and `tokens.json`, CSS/JS banners and SCSS docblocks linking to Storybook and `llms.txt`, and expanded AI manifest coverage. ([#1156](https://github.com/unisdr/undrr-mangrove/pull/1156), [#1157](https://github.com/unisdr/undrr-mangrove/pull/1157), [#1162](https://github.com/unisdr/undrr-mangrove/pull/1162))
- **Storybook organisation and docs:** messaging components are grouped under Components/Notice and page navigation under Components/Navigation, so those Storybook URLs and AI manifest ids changed. Documentation links now point at `preventionweb.github.io/undrr-mangrove`. ([#1164](https://github.com/unisdr/undrr-mangrove/pull/1164), [#1166](https://github.com/unisdr/undrr-mangrove/pull/1166))

## 2.0.0-beta.3 — 2026-09-15

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-beta.3) for the release when published. This prerelease is prepared for the npm `next` tag; `latest` stays on 1.x.

This section is intentionally brief. Full detail and migration steps are in the [v2.0 release notes](https://mangrove.undrr.org/?path=/docs/getting-started-release-notes-v2-0--docs) (source: [`docs/RELEASE-2.0.md`](docs/RELEASE-2.0.md)).

- **Sub-brand button tokens** defined secondary button background and hover tokens for PreventionWeb, MCR, and IRP themes. ([#1150](https://github.com/unisdr/undrr-mangrove/pull/1150))
- **Hero title** removed the `max-width: 12ch` constraint from `.mg-hero--immersive:not(.mg-hero--split) .mg-hero__title` so headings flow naturally across the overlay container. ([#1151](https://github.com/unisdr/undrr-mangrove/pull/1151))
- **Card layout, MegaMenu, and ScrollContainer** gained height fill (`block-size: 100%`) for vertical cards in separate column wrappers, animated active-tab underline transitions for MegaMenu, and themed desktop scrollbars. ([#1153](https://github.com/unisdr/undrr-mangrove/pull/1153))
- **Code style** swept all story and doc files into compliance with Prettier. ([#1152](https://github.com/unisdr/undrr-mangrove/pull/1152))

## 2.0.0-beta.2 — 2026-09-15

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-beta.2) for the release when published. This prerelease is prepared for the npm `next` tag; `latest` stays on 1.x.

This section is intentionally brief. Full detail and migration steps are in the [v2.0 release notes](https://mangrove.undrr.org/?path=/docs/getting-started-release-notes-v2-0--docs) (source: [`docs/RELEASE-2.0.md`](docs/RELEASE-2.0.md)).

- **Translated logos and PageHeader** now resolve locale-specific wordmarks through the shared asset helper, with `crop="autocrop"` kept for the default English wordmark only. ([#1148](https://github.com/unisdr/undrr-mangrove/pull/1148))
- **Author image and icons** gained the new stacked/link/no-image layout options plus the higher-value utility and OCHA icon additions. ([#1147](https://github.com/unisdr/undrr-mangrove/pull/1147), [#1145](https://github.com/unisdr/undrr-mangrove/pull/1145))
- **CTA, AI manifest, and docs cleanup** tightened strong-surface contrast, made the docs-base URL configurable, and trimmed stale release notes noise. ([#1142](https://github.com/unisdr/undrr-mangrove/pull/1142), [#1143](https://github.com/unisdr/undrr-mangrove/pull/1143), [#1144](https://github.com/unisdr/undrr-mangrove/pull/1144))

## 2.0.0-beta.1 — 2026-09-11

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-beta.1) for the release when published. This prerelease is prepared for the npm `next` tag; `latest` stays on 1.x.

This section is intentionally brief. Full detail and migration steps are in the [v2.0 release notes](https://mangrove.undrr.org/?path=/docs/getting-started-release-notes-v2-0--docs) (source: [`docs/RELEASE-2.0.md`](docs/RELEASE-2.0.md)).

- Storybook inline Docs canvases now receive the selected locale’s language and direction, fixing Arabic examples that inherited an explicit English canvas boundary and preserving RTL across theme or control changes. ([#1109](https://github.com/unisdr/undrr-mangrove/issues/1109))
- CDN references now use the canonical `assets.undrr.org/` root across documentation, examples, font URLs and component defaults. The release URL updater emits canonical paths while continuing to accept legacy paths as migration inputs.
- Pre-beta.1 paper-cuts pass: PageHeader adds `languageDisplay="links"` and tighter icon-only accessibility semantics, MegaMenu desktop flyout/refined reduced-motion behavior lands, and Storybook/docs guidance adds screenshot workflow and token-generation reminders. ([#1134](https://github.com/unisdr/undrr-mangrove/pull/1134))

## 2.0.0-alpha.4 — 2026-09-09

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-alpha.4) for the release when published. This prerelease is prepared for the npm `next` tag; `latest` stays on 1.x.

This section is intentionally brief. Full detail and migration steps are in the [v2.0 release notes](https://mangrove.undrr.org/?path=/docs/getting-started-release-notes-v2-0--docs) (source: [`docs/RELEASE-2.0.md`](docs/RELEASE-2.0.md)).

- Arabic typography and font roles were finalized for v2.0 (including removal of legacy font-family SCSS variables). ([#1089](https://github.com/unisdr/undrr-mangrove/issues/1089), [#1092](https://github.com/unisdr/undrr-mangrove/issues/1092), [#1098](https://github.com/unisdr/undrr-mangrove/issues/1098))
- Tabs and MegaMenu received the alpha.4 navigation refinements. ([#1097](https://github.com/unisdr/undrr-mangrove/pull/1097), [#1100](https://github.com/unisdr/undrr-mangrove/pull/1100))
- Release tooling updates included `_site` Jest exclusion and prerelease CDN URL updates. ([#1090](https://github.com/unisdr/undrr-mangrove/pull/1090))

## 2.0.0 — unreleased

This section is intentionally brief. The complete 2.0 record, migration guidance, and numbered breaking changes are in the [v2.0 release notes](https://mangrove.undrr.org/?path=/docs/getting-started-release-notes-v2-0--docs) (source: [`docs/RELEASE-2.0.md`](docs/RELEASE-2.0.md)).

Development releases:

- [2.0.0-alpha.1](https://github.com/unisdr/undrr-mangrove/pull/1061)
- [2.0.0-alpha.2](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-alpha.2)
- [2.0.0-alpha.3](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-alpha.3)
- [2.0.0-alpha.4](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-alpha.4)
- [2.0.0-beta.1](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-beta.1) (release candidate)
- [2.0.0-beta.2](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-beta.2) (release candidate)
- [2.0.0-beta.3](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-beta.3) (release candidate)
- [2.0.0-rc.1](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-rc.1) (release candidate)
- [2.0.0-rc.2](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-rc.2) (release candidate)

## 1.8.2 — 2026-08-27

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v1.8.2) for full details.

### Features

- **Grid layout extended to 12 columns with an auto-fit fallback.** Numbered column classes now cover `col-7`–`col-12`, and a new `.mg-grid--auto-fit` modifier lays any larger item count out in a single row. Fixes StatsCard collapsing to a stacked single column past 6 stats. ([#1081](https://github.com/unisdr/undrr-mangrove/pull/1081))

### Bug fixes

- **Card z-index no longer conflicts with the mega menu.** Cards no longer overlap the open mega-menu overlay. ([#1075](https://github.com/unisdr/undrr-mangrove/pull/1075))
- **Syndication search strips hidden teaser fields.** Hidden teaser fields are now removed programmatically from the React search output. ([#1077](https://github.com/unisdr/undrr-mangrove/pull/1077))

### Build & tooling

- Major toolchain upgrades: Babel 8, `sass-loader` 17, and `jest-axe` 11. ([#1083](https://github.com/unisdr/undrr-mangrove/pull/1083))
- Storybook to 10.5.10, React to 19.2.8, PostCSS to 8.5.26, and a roundup of patch and minor dependency updates. ([#1078](https://github.com/unisdr/undrr-mangrove/pull/1078), [#1082](https://github.com/unisdr/undrr-mangrove/pull/1082), [#1071](https://github.com/unisdr/undrr-mangrove/pull/1071))

## 1.8.1 — 2026-07-06

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v1.8.1) for full details.

### Bug fixes

- **Syndication search organization routing.** Organization results now always resolve to PreventionWeb instead of whichever domain appears first in `field_domain_access`, fixing incorrect organization links in multi-domain index data. ([#1066](https://github.com/unisdr/undrr-mangrove/pull/1066))

### Security

- **DOMPurify patched to 3.4.11.** Security dependency update merged as part of patch release maintenance. ([#1051](https://github.com/unisdr/undrr-mangrove/pull/1051))

### Build & tooling

- Dependency maintenance updates: `chromaui/action` v17, `actions/checkout` v7, `serialize-javascript` v7.0.6, `babel-plugin-polyfill-corejs3` v1, Yarn v4.17.0, `autoprefixer` v10.5.2, and `postcss` v8.5.16. ([#1042](https://github.com/unisdr/undrr-mangrove/pull/1042), [#1059](https://github.com/unisdr/undrr-mangrove/pull/1059), [#1062](https://github.com/unisdr/undrr-mangrove/pull/1062), [#1063](https://github.com/unisdr/undrr-mangrove/pull/1063), [#1065](https://github.com/unisdr/undrr-mangrove/pull/1065), [#1067](https://github.com/unisdr/undrr-mangrove/pull/1067), [#1068](https://github.com/unisdr/undrr-mangrove/pull/1068), [#1069](https://github.com/unisdr/undrr-mangrove/pull/1069))

### Documentation

- Added Drupal hydration wrapper integration guidance to `README.md` and expanded release-writing guidance in `docs/RELEASES.md` (curated, themed GitHub Release notes format). ([#1016](https://github.com/unisdr/undrr-mangrove/pull/1016))

## 1.8.0 — 2026-06-19

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v1.8.0) for full details.

### Security

- **Dependency update cooldown.** Renovate now waits until a release is at least 7 days old before it proposes the update (`minimumReleaseAge: "7 days"` with `internalChecksFilter: "strict"`), so a compromised package version that gets detected and unpublished within its first days never reaches a pull request here. Security advisories (`vulnerabilityAlerts`) are exempt, so genuine fixes are not delayed. Dependabot is retired and Renovate is now the sole dependency bot, which also ends the duplicate update PRs. A separate spike tracks evaluating pnpm for its scripts-off-by-default behaviour (#1038). (#1039)

### Removed

- **D3 chart components, `MapComponent`, and `Fetcher` removed.** The npm exports `BarChart`, `MapComponent`, and `Fetcher` are no longer published. The internal-only Storybook stories `Histogram`, `IndexChart`, and `ConnectedScatterplot` are also removed. D3 and Leaflet packages are dropped from the dependency tree. Migrate charting to [Recharts](https://recharts.org/), mapping to [MAPX](https://mapx.org/), and data loading to [react-query](https://tanstack.com/query) / [SWR](https://swr.vercel.app/) or server-side load. ([#1011](https://github.com/unisdr/undrr-mangrove/issues/1011))

## 1.7.0 — 2026-05-11

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v1.7.0) for full details.

### Runtime

- **Node.js 22 is now the declared minimum** (Node 20 reached EOL on 2026-04-30). `engines.node` set to `>=22.0.0`. CI and Docker continue to run Node 24. `.nvmrc` added so `nvm use` picks the CI-pinned version. (#1003)

### Build & tooling

- TypeScript 5 → 6, ESLint 9 → 10 majors (#977).
- React 19.2.5 → 19.2.6 (#991).
- Yarn 4.14.1 (#952).
- Batch dep updates: `jest` 30.4.x monorepo (#997), `typescript-eslint` 8.59.2 (#993), `@babel/preset-env` 7.29.5 (#961), `stylelint` ~17.11.0 (#937), `globals` 17.6.0 (#964), `sass-loader` 16.0.8 (#990), plus batched minor/patch (#960, #984).

### Security

- Patched 17 Dependabot security alerts via yarn resolutions (#978).
- Patched `brace-expansion` ReDoS via resolution (#979).

### Code quality

- New `react-doctor` component-quality linter codified as a project convention. Health score moved 57 → 68 across the sweep, with 66 of the original 398 findings cleared. (#985, #987, #988, #989, #996.)
- House conventions for component authors documented in `docs/AI-CODING-AGENTS.md`: no em-dashes or three-period ellipses in JSX text; prefer `use()` over `useContext()` on React 19+; hoist default `[]` / `{}` props to module-level constants; no inline render helpers (extract as named subcomponents); lazy `useState` init; effect cleanup discipline; per-call-site triage for `dangerouslySetInnerHTML` (inline DOMPurify vs documented caller contract). (#992)
- React Doctor health badge added to `README.md` and the Storybook _Introduction_ page. The badge is a manually-refreshed periodic snapshot — see `docs/AI-CODING-AGENTS.md#refreshing-the-score-badge`. (#992, #996.)
- **Consumer-visible API note:** `Component.defaultProps` has been removed from `FooterIcons`, `FooterConditions`, `FooterConditions2`, `FooterLists`, `Link`, and `ScrollContainer`. React 19 deprecates `defaultProps` on function components; the defaults are now declared via destructured parameters, so component behaviour is unchanged. Only consumers that read `Component.defaultProps` for introspection (rare) need to adjust. (#985, #988)
- `useContext(SearchContext)` swapped to React 19's `use(SearchContext)` in `SyndicationSearchWidget` (#988). Internal change; identical behaviour at top-level call sites.

### Documentation

- `docs/AI-CODING-AGENTS.md` extended with the _Component quality checks with react-doctor_ section (above), linked from `CONTRIBUTING.md`, `docs/DEVELOPMENT.md`, and `docs/REVIEW-CHECKLIST.md`. (#992)
- Tracking issue [#986](https://github.com/unisdr/undrr-mangrove/issues/986) documents the remaining `react-doctor` work, organised into risk buckets for future sweeps.
