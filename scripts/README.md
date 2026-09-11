# Scripts

Utility scripts for the Mangrove project.

| Directory/File | Purpose |
|----------------|---------|
| `ai-manifest/` | AI-friendly component manifest pipeline. Generates llms.txt, component JSON, and CSS utility reference for AI agents. Entry point: `generate-ai-manifest.js`. |
| `update-cdn-version.js` | Updates CDN links in documentation files to the current version from `package.json`. Run after each release. |
| `build-tokens.cjs` | Builds `stories/assets/scss/generated/_tokens-*.scss` from `tokens/*.yaml` (`yarn build:tokens`, run by `yarn scss`). The generated partials are not committed, so `tokens/output-baseline.json` holds a SHA-256 of each of them and `tokens-source.test.js` fails if the generator stops matching it. **After any deliberate `tokens/*.yaml` change, run `yarn build:tokens` and then `node scripts/build-tokens.cjs --baseline`, and commit the updated baseline with it.** |
| `storybook-screenshot.mjs` | Headless-screenshots a running Storybook story via the Chrome DevTools Protocol — no devDependency, just a local Chrome/Chromium install. `node scripts/storybook-screenshot.mjs <storyId> <out.png> [width] [height]` against a `storybook dev` already running (`STORYBOOK_URL` env var if not on the default port). Use it to actually look at a CSS-only change before trusting it — see [AI coding agent guidelines](../docs/AI-CODING-AGENTS.md). |

See also [`CONTRIBUTING.md`](../CONTRIBUTING.md#ai-manifest-for-component-discovery) for the contributor-facing summary of what to update when components change.
