#!/usr/bin/env node
/**
 * Ensures the Storybook build-output directory has a favicon present before
 * `storybook dev` starts.
 *
 * Why this exists: the @chromatic-com/storybook addon resolves the favicon
 * path from the shared webpack cache (node_modules/.cache/storybook). The
 * `build` script (`storybook build -o docs-build-temp`) pins that path to
 * `docs-build-temp/favicon.svg`. When the dev server then reuses the cache
 * but `docs-build-temp` has been cleaned (by a fresh checkout, a `yarn build`
 * that was interrupted, or a manual clean), the chromatic processAssets hook
 * throws an unhandled ENOENT at the webpack "sealing" phase and the preview
 * never finishes compiling.
 *
 * Copying the source favicons into the build-output directory up front keeps
 * the read target present regardless of cache state. Cheap, idempotent, and
 * avoids clearing the cache (which would slow every dev-server start).
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs-build-temp');
const assetsDir = path.join(root, 'stories', 'assets');

fs.mkdirSync(outDir, { recursive: true });

for (const file of ['favicon.svg', 'favicon.ico']) {
  const src = path.join(assetsDir, file);
  const dest = path.join(outDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}
