/**
 * Make a checkout that has never run a build usable.
 *
 * `stories/assets/scss/generated/_tokens-*.scss` is machine output of
 * `scripts/build-tokens.cjs` and is not committed (see .gitignore), but any
 * Sass compile of Mangrove's entry points `@import` it. Anything that compiles
 * Sass outside `yarn scss` — Jest's globalSetup, `scripts/aria-coverage.cjs` —
 * calls this first so a fresh clone does not fail with an opaque Sass
 * "Can't find stylesheet" error.
 *
 * Only MISSING files are written, deliberately:
 *
 *   - a partial that exists but disagrees with `tokens/*.yaml` is left alone,
 *     so `tokens-source.test.js` still fails loudly and names
 *     `yarn build:tokens` instead of being silently repaired underneath;
 *   - rewriting identical bytes bumps mtime, which rebuilds webpack and
 *     invalidates the chunk hash held by any open Storybook tab.
 *
 * Cost when everything is present: one YAML parse, no writes.
 */
const fs = require('fs');
const path = require('path');

const { build } = require('./build-tokens.cjs');

const ROOT = path.join(__dirname, '..');

/**
 * Write any generated token partial that is absent.
 *
 * @returns {string[]} Repo-relative paths written, empty when nothing was missing.
 */
function ensureGeneratedTokenPartials() {
  const written = [];

  for (const [relative, contents] of build()) {
    const absolute = path.join(ROOT, relative);
    if (fs.existsSync(absolute)) continue;
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, contents);
    written.push(relative);
  }

  return written;
}

module.exports = { ensureGeneratedTokenPartials };
