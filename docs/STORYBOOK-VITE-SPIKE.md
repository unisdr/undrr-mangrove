# Storybook Vite migration

[#1355](https://github.com/unisdr/undrr-mangrove/issues/1355), evaluated
2026-10-16. The first commit preserves the opt-in spike; the stacked 3.0
migration makes Vite and addon-vitest the default. The published library's
Webpack bundle build and the Jest unit-test suite remain separate.

## Run and verify

```sh
yarn install --immutable
yarn scss
yarn playwright install --with-deps chromium
yarn storybook                             # development on 6006
yarn test-storybook                        # Chromium, no Storybook server needed
yarn test-storybook:watch                  # interactive watch mode
```

For production delivery and CSS regression checks:

```sh
yarn build
yarn validate-manifest
yarn serve-storybook                       # port 6099, in another terminal
yarn test:storybook-themes
yarn test:search-selection-browser
yarn test:motion-browser
yarn test:rich-content-browser
```

Set `THEME_STORYBOOK_URL`, `SEARCH_STORYBOOK_URL`, `MOTION_STORYBOOK_URL`
or `CONTENT_STORYBOOK_URL` to test a different production server. A served
build is required for these four gates, while Vitest runs directly from the
story sources. Keep `scripts/serve-storybook.mjs` after removing the old runner.

## Implementation

- Storybook and addon-vitest 10.6.1 use Vite 7.3.7, Vitest and its Playwright
  browser provider 4.1.11, and Playwright/core 1.63.0. Browser dependencies are
  explicit. Node 22.12+ matches Storybook/Vite's supported floor; local
  verification used Node 24.18.0 and Yarn 4.18.1.
- `.storybook/viteConfig.js` configures the automatic React JSX runtime and
  handles JSX in existing `.js` files during both dependency scanning and
  story processing. Storybook and the Vitest plugin share these settings.
- `themeStyles.js` dynamically imports each theme's compiled Sass through
  Vite's `?inline` support. Asset URLs are rewritten by Vite. Each theme is
  emitted in its own cached chunk; the initial preview fetches one theme.
- A global loader awaits the selected CSS before rendering and play
  assertions. A channel listener updates docs-only pages when toolbar globals
  change. A newer selection wins if earlier requests finish out of order.
  Failed requests retain the previous stylesheet and surface an error.
- Managed styles are removed on module disposal, and the DOM is checked when
  attaching a replacement so overlapping HMR module instances cannot leave
  duplicate styles. Theme body classes change with the active stylesheet.
- Storybook 10.6 applies preview/addon annotations to Vitest automatically.
  No additional `setProjectAnnotations` setup file is needed. The existing
  advisory accessibility policy is explicit as `a11y.test: 'todo'`.
- Story tests and hooks retain a 60-second timeout for the live CDN consent
  check. No play assertions or test tags were removed to make the migration pass.
- Webpack-specific Storybook configuration and the deprecated runner are
  removed. Webpack and its loaders remain for the library bundle pipeline.

## Verification evidence

The 3.0 Webpack baseline and Vite build were compared in the same checkout.

| Check | Result |
| --- | --- |
| Complete `index.json` | Exact equality: 651 entries |
| Raw component manifest | Same 89 component IDs, props and story metadata/snippets |
| Published AI output | 88 components: 71 vanilla HTML, 17 React-only |
| Old runner on Webpack baseline | 92 suites, 512 tests passed |
| Vitest Browser Mode | Same 92 files and 512 story tests passed, including the live consent check |
| Search-selection browser gate | Passed across five themes and normal/reduced motion |
| Motion/forced-colour browser gate | 30 theme/media/viewport combinations passed, seven components each |
| Rich-content browser gate | 20 theme/viewport/direction combinations plus combined media passed |
| Theme gate | Cold lazy loading, five themes, delayed-response race, failed chunk recovery and docs-only toolbar changes passed |
| Development theme Sass updates | Active MCR2030 theme retained after adding/removing a CSS probe; exactly one managed stylesheet |
| Jest unit suite | 169 suites, 3720 tests passed; one existing skipped test |
| Lint, formatting, immutable install and manifest validation | Passed |
| Source panels | Tag renders formatted HTML; Container retains JSX source |

The lazy strategy reduced the main preview entry from the spike's roughly
3.56 MB (752 KB gzip) to 1.56 MB (459 KB gzip). Theme chunks are approximately
394–398 KB each before compression. These are build-output sizes, not a
controlled load-time benchmark or the total initial transfer including docs.

The builds retain an existing warning about syndicated-search stories sharing
a component ID. Existing Sass import deprecations on `release/3.0` are outside
this migration; the Sass-module migration on main is not pulled into this PR.

## Regression checks and review

The new theme gate is part of CI alongside the production-site gates. It
holds an IRP chunk response until MCR2030 is already active, then releases it
to prove a stale request cannot override the latest selection. A separate
case aborts a chunk, verifies the previous CSS remains, then changes to a
working theme. Docs checks drive the manager's actual toolbar rather than
emitting events in a standalone iframe, which can reload its original URL.

The rich-content gate previously supplied `a11y.manual:true` as a URL global.
Storybook parses that value as a string. Using `a11y.manual:!true` supplies the
boolean and prevents Storybook's automatic axe run from overlapping the
explicit audit. The explicit audit still runs and fails on violations.

### Red-team pass

The final diff was reviewed against the project code-review checklist, with
adversarial browser checks for ordering, loading errors, HMR and preview paths.
Resolved findings:

- A failed latest request can clear the pending-request state before an older
  response completes. The stale-response branch now tolerates that state;
  the gate holds IRP, fails DELTA, releases IRP and checks that the original
  theme remains before recovering to MCR2030.
- Overlapping hot-replacement instances could leave duplicate CSS. Disposal
  plus managed-style ownership checks prevent that; a live MCR2030 Sass edit
  and its removal retained the selected theme with one stylesheet.
- The rich-content audit's URL flag was a string, allowing simultaneous axe
  runs. The typed boolean fixes the overlap while preserving the explicit audit.
- The root Vitest config is explicitly included in lint and formatting checks.

The complete theme gate also passed through a `/preview/` proxy, exercising
relative lazy-chunk URLs and manager/iframe navigation. No known local
blockers remain. The first full Jest run had one docs-copy subprocess failure;
the targeted file and the subsequent complete 169-suite run passed without
changing that code.

Before merging, review Chromatic's visual diff. Local browser and computed-style
checks cannot replace that review or physical-device testing.

## Historical spike

The first PR/commit keeps Webpack as the default and enables Vite with
`MANGROVE_STORYBOOK_BUILDER=vite`, `yarn storybook:vite` and
`yarn build:storybook:vite`. It established theme/metadata feasibility with all
five Sass strings in the preview entry, identified the JSX/runtime and brand
image `require()` blockers, and proved the existing story runner worked on
the Vite build. Those opt-in scripts and inline-all-themes adapter are
superseded by this migration.

## References

- [React Vite migration](https://storybook.js.org/docs/get-started/frameworks/react-vite#how-do-i-migrate-from-the-react-webpack-framework)
- [Vite CSS without automatic injection](https://vite.dev/guide/features.html#disabling-css-injection-into-the-page)
- [Vitest addon setup](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)
