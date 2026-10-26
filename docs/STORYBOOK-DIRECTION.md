# Storybook direction controls

Storybook's native globals toolbar owns the manual direction control. The
external RTL addon and legacy parent-document checkbox lookup are removed.
No custom manager addon, icon rendering or motion is required.

## Compatibility contract

The existing `addonRtl` global is retained so saved globals and links such as
`globals=locale:english;addonRtl:rtl` continue to work. Its values keep their
existing additive meaning:

| Locale | `addonRtl` | Effective direction |
| --- | --- | --- |
| Arabic | `ltr` or `rtl` | RTL |
| Other locales | `ltr` | LTR |
| Other locales | `rtl` | RTL |

The toolbar labels are **Locale direction** (`ltr`) and **Force right-to-left**
(`rtl`). There is deliberately no forced-LTR Arabic mode. Direction changes
never change the language or translated story content.

`.storybook/language.js` resolves the language and direction once for preview
loaders, story layout effects and the globals listener used by docs-only pages.
It writes `lang` and `dir` to the preview document, `#storybook-root` if present,
and the active canvas. `window.UNDRR.langCode` retains the English-language
locale name; `window.UNDRR.dir` retains the resolved direction. Unrelated
`window.UNDRR` properties remain intact. The existing delayed `load` signal for
vanilla story integrations is retained with cleanup.

Docs-only pages now receive the same document language/direction updates on
initial globals and toolbar changes. Storybook’s own language boundary on English docs prose remains in place.
The Storybook manager itself remains in its own UI language and direction. This is preview tooling, not a change to
published component CSS, Drupal direction handling or a Storybook 11 upgrade.

## Maintenance and verification

The control uses `globalTypes`, `initialGlobals` and Storybook's existing
`GLOBALS_UPDATED` channel event. On a Storybook major upgrade, verify the
native toolbar, initial bookmarked globals and docs-only event delivery. There
is no new manager UI dependency.

```sh
yarn test .storybook/__tests__/language.test.js --runInBand
yarn build
yarn validate-manifest
yarn serve-storybook  # production build on 6099, in another terminal
yarn test:storybook-direction
yarn test:storybook-themes
yarn test:storybook-html
```

The direction gate drives the real manager menus and checks all seven supported
locales, manual RTL overrides, Arabic direction after Controls/theme rerenders,
all five themes, and cold docs-only links followed by toolbar changes. Set
`DIRECTION_STORYBOOK_URL` for another server or a deployment under a path prefix.
The gate runs in CI with the existing production browser checks.
