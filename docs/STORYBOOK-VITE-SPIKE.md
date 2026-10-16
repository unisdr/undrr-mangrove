# Storybook Vite builder spike

Evaluation for [#1355](https://github.com/unisdr/undrr-mangrove/issues/1355),
2026-10-16. The full migration targets 2.2 on main; this opt-in spike does
not change the default builder, release workflow, published bundle build or
Jest unit-test suite.

The Vite builder is feasible with small compatibility changes: the production
build, component metadata pipeline and existing Chromium story suite work.
Continue the 2.2 migration while validating addon-vitest, theme hot updates
and a smaller theme-loading strategy.

## Run the spike

```sh
yarn install --immutable
yarn scss
yarn storybook:vite --ci                    # development server on 6010
```

For production-build verification:

```sh
yarn build:storybook:vite                  # docs-build-temp/vite-spike
node scripts/serve-storybook.mjs docs-build-temp/vite-spike 6101
```

With that server running, in another terminal:

```sh
yarn exec test-storybook --url http://127.0.0.1:6101 --testTimeout=60000 --maxWorkers=2
MOTION_STORYBOOK_URL=http://127.0.0.1:6101 yarn test:motion-browser
```

`yarn build` and `yarn storybook` continue to select Webpack. Run the normal
build **before** the Vite build if comparing both: the normal build cleans
`docs-build-temp`, including the nested spike output. For a separate Webpack
Storybook comparison, use `yarn exec storybook build -o docs-build-temp/webpack-verified`.

The AI generator still needs the library bundles in `dist/components` from
`yarn build`. Once those exist:

```sh
node scripts/ai-manifest/generate-ai-manifest.js --build-dir=docs-build-temp/vite-spike
node scripts/ai-manifest/generate-ai-manifest.js --build-dir=docs-build-temp/vite-spike --validate
```

## Approach and compatibility findings

- Storybook 10.6.1 with `@storybook/react-vite` 10.6.1 and Vite 7.3.7
  (resolved from `^7.3.0`). Evaluation ran on Node 24.18.0 and Yarn 4.18.1.
- `.storybook/main.js` selects Vite only when
  `MANGROVE_STORYBOOK_BUILDER=vite`; it omits the Webpack Babel compiler addon
  for that builder. The spike config is loaded only on that path.
- Shared preview behaviour imports a theme map. Webpack keeps its original
  lazy-style modules; a Vite alias substitutes `themeStyles.vite.js`.
  Vite's `?inline` imports compile Sass and resolve asset URLs without
  injecting every theme. The adapter implements the existing `.use()` and
  `.unuse()` contract with one style element per theme, attached only while
  active. Initial default CSS also loads for docs-only pages. Hot replacement
  disposes the old module's style elements; without this cleanup a Sass edit
  left duplicate theme styles in the preview.
- JSX in `preview.js` and `ScrollContainer.stories.js` requires a pre-transform
  and dependency-scanner loader for `.js`. The automatic JSX runtime must
  also be selected for `.jsx`; otherwise stories without a React import
  build successfully but fail at runtime with `React is not defined`.
- Brand metadata contained a Webpack-only image `require()`. Converting it
  to an ES import fixes the Vite brand-docs runtime failure and works with
  Webpack as well.
- The current preview builds without copying Webpack's Node built-in
  fallbacks or `process.version`/`process.platform` definitions into Vite.

## Evidence

Both the normal `yarn build` and a fresh Webpack Storybook build after the
shared preview extraction passed. The Vite production build passed.

| Check | Result |
| --- | --- |
| Complete `index.json` entries | Exact equality: 651 entries |
| Raw component manifest IDs | Same 89 components |
| `reactDocgen.props` | Exact equality for every component |
| Manifest story metadata, including source snippets | Exact equality for every component |
| AI generation | 88 published components; 71 vanilla HTML, 17 React-only |
| AI validation | Passed; 73/88 components have documented props (83%), with existing advisory findings |
| Theme switching in built Chromium preview | All five themes and return to default; one active theme style element throughout |
| Computed Tag fill | UNDRR `rgb(0, 79, 145)`; PreventionWeb `rgb(10, 105, 105)`; IRP `rgb(15, 120, 191)`; MCR2030 `rgb(89, 26, 97)`; DELTA `rgb(0, 79, 145)` |
| MDX and source panels | Tag renders formatted HTML; Container renders nonempty JSX source |
| Brand docs | Render after replacing the image `require()`; DELTA placeholder SVG loads |
| Development Sass updates | Default-theme probe added and removed successfully, returning to one active stylesheet; preview reload can occur |
| Representative font requests | CDN and Storybook fonts returned HTTP 200 |
| Existing Chromium story suite against the Vite build | 92 suites, 512 tests passed (including CookieConsentBanner live integration) |
| Motion/forced-colour browser gate against Vite | 30 theme/media/viewport combinations passed, seven components each |
| Docs source unit tests | 12 passed |
| ESLint on changed JavaScript | Passed |

The successful builds still report the existing duplicate syndicated-search
component-ID warning. Vite reports a large preview chunk: embedding all five
compiled theme strings contributes to a roughly 3.56 MB preview entry
(approximately 752 KB gzipped in the first build). Build success alone is not
a performance acceptance criterion.

## Follow-up before the 2.2 cutover

- Install addon-vitest in a separate phase and verify its Chromium Browser
  Mode setup. Passing the existing runner against a Vite build does not
  establish parity with addon-vitest.
- Extend the default-theme Sass hot-update check to active sub-brand themes;
  verify manager toolbar behaviour and docs-only theme changes. Confirm that
  reloads preserve the selected theme and do not leave stale styles.
- Measure startup, theme-switch latency and preview transfer size; decide
  whether theme CSS should use separate cached assets instead of inline strings.
- Run visual review/Chromatic across the five themes, RTL and responsive
  examples, plus search-selection and rich-content browser gates.
- Keep the built-site server and explicit Playwright installation for the
  standalone browser gates after removing the old runner.
- Keep the library's Webpack build and Jest migration outside this issue.

## References

- [React Vite migration](https://storybook.js.org/docs/get-started/frameworks/react-vite#how-do-i-migrate-from-the-react-webpack-framework)
- [Vite CSS without automatic injection](https://vite.dev/guide/features.html#disabling-css-injection-into-the-page)
- [Vitest addon setup](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)
