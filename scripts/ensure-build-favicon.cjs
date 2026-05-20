#!/usr/bin/env node
/**
 * Ensures the Storybook build-output directory has a favicon present before
 * `storybook dev` starts. Chained into the `storybook` and `docker-storybook`
 * npm scripts with `&&` (Yarn 4 does not run pre/post lifecycle scripts, so a
 * `prestorybook` hook would not fire).
 *
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS
 * ---------------------------------------------------------------------------
 * The @chromatic-com/storybook addon resolves the favicon path from the
 * shared webpack cache (node_modules/.cache/storybook). The `build` script
 * (`storybook build -o docs-build-temp`) pins that path to
 * `docs-build-temp/favicon.svg`. When the dev server then reuses the cache
 * but `docs-build-temp` has been cleaned (by a fresh checkout, an interrupted
 * `yarn build`, or a manual clean), the chromatic processAssets hook throws
 * an unhandled ENOENT at the webpack "sealing" phase (~92%) and the preview
 * never finishes compiling. The error looks like:
 *
 *   HtmlWebpackPluginChromatic: Unhandled promise rejection:
 *   {"code":"ENOENT","syscall":"open","path":".../docs-build-temp/favicon.svg"}
 *
 * Copying the source favicons into the build-output directory up front keeps
 * the read target present regardless of cache state. Cheap, idempotent, and
 * avoids clearing the cache (which would slow every dev-server start).
 *
 * This is a workaround for an addon/builder behaviour, not a bug in our code.
 * It became visible in Storybook 10.3.6 with @chromatic-com/storybook; a newer
 * Storybook may resolve the favicon differently and make it unnecessary.
 *
 * ---------------------------------------------------------------------------
 * HOW TO TEST WHETHER THIS IS STILL NEEDED
 * ---------------------------------------------------------------------------
 * Re-check after any Storybook or @chromatic-com/storybook upgrade.
 *
 *   1. In package.json, temporarily remove the
 *      `node scripts/ensure-build-favicon.cjs &&` prefix from the `storybook`
 *      script (or just don't run this file).
 *   2. Reproduce the cache-poisoned state:
 *        yarn build            # pins docs-build-temp/favicon.svg in the cache
 *        rm -rf docs-build-temp # remove the file the cache now points at
 *   3. Start the dev server:
 *        yarn storybook
 *   4. Watch the preview compile. If you see the
 *      `HtmlWebpackPluginChromatic ... ENOENT ... docs-build-temp/favicon.svg`
 *      rejection around "92% sealing asset processing", the workaround is
 *      still needed — restore the prefix.
 *      If the preview reaches 100% and Storybook serves cleanly, the upstream
 *      behaviour has been fixed: delete this file and the two script prefixes.
 *
 * Note: `node_modules/.cache/storybook` must be warm for step 2 to pin the
 * path. If you cleared the cache, run `yarn build` once more before step 3.
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
