#!/usr/bin/env node
/**
 * React Aria styling coverage for the distributed Mangrove surface.
 *
 * Compares the stock `.react-aria-*` class names that react-aria-components
 * actually renders against the ones the Mangrove Aria stylesheet styles. The
 * gap is the list of components a consumer would get unstyled, which is the
 * number that matters when arguing this surface is a usable alternative to a
 * batteries-included component library.
 *
 * Method caveat: the denominator is derived by grepping the package for
 * `react-aria-<Name>` string literals, which includes names that appear only
 * as `@selector` annotations in type declarations. It is a good relative
 * measure and a fair absolute one, but treat it as approximate rather than an
 * authoritative component count.
 *
 * This module is the single implementation of that measurement. The
 * token-contract suite imports `coverage()` from here and applies a floor to
 * it, so the CLI and the guard cannot drift apart. The suite passes its own
 * freshly compiled Sass; the CLI reads the built `aria/react-aria.css` when it
 * is present and compiles the Sass itself when it is not, so neither depends
 * on a build artifact being committed or current.
 *
 * Usage: node scripts/aria-coverage.cjs [--list] [--json]
 */
const fs = require('fs');
const path = require('path');

const PKG = path.join(__dirname, '..', 'node_modules', 'react-aria-components');
const SCSS_DIR = path.join(__dirname, '..', 'stories', 'assets', 'scss');
const SCSS = path.join(SCSS_DIR, 'aria', '_react-aria.scss');
const CSS = path.join(__dirname, '..', 'aria', 'react-aria.css');

/**
 * The Aria stylesheet to measure.
 *
 * `aria/react-aria.css` is build output and is not committed, so it may not
 * exist. The Sass source always does, and compiling it is the same bytes the
 * build would emit, so fall back to that rather than telling the caller to run
 * a build first. This also makes the CLI immune to reading a half-written file
 * while a concurrent `yarn build:aria` is truncating it.
 *
 * @returns {string} CSS text.
 */
function ariaCss() {
  if (fs.existsSync(CSS)) return fs.readFileSync(CSS, 'utf8');
  const sass = require('sass');
  // The Sass source @imports generated token partials, which are build output
  // and may be absent on a clone that has never built.
  require('./ensure-generated.cjs').ensureGeneratedTokenPartials();
  return sass.compile(SCSS, {
    loadPaths: [SCSS_DIR],
    silenceDeprecations: ['import'],
    logger: sass.Logger.silent,
  }).css;
}

/**
 * Every stock `react-aria-<Name>` class name the installed package mentions.
 *
 * @param {string} [dir] Directory to walk. Defaults to the installed package.
 * @returns {Set<string>} Component names, without the `react-aria-` prefix.
 */
function stockClasses(dir = PKG) {
  const found = new Set();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      for (const name of stockClasses(full)) found.add(name);
    } else if (/\.(js|mjs|cjs|d\.ts)$/.test(entry.name)) {
      const src = fs.readFileSync(full, 'utf8');
      for (const m of src.matchAll(/react-aria-([A-Z][A-Za-z]+)/g))
        found.add(m[1]);
    }
  }
  return found;
}

/**
 * Intersect the stock class names with the ones a stylesheet styles.
 *
 * @param {string} css CSS text to measure. Either the built
 *   `aria/react-aria.css` or a fresh compile of `aria/_react-aria.scss`; see
 *   `ariaCss()`.
 * @param {Set<string>} [stock] Denominator, defaults to the installed package.
 * @returns {{total: number, covered: string[], missing: string[], pct: number}}
 */
function coverage(css, stock = stockClasses()) {
  const all = [...stock].sort();
  const styled = new Set(
    [...css.matchAll(/\.react-aria-([A-Za-z]+)/g)].map(m => m[1])
  );
  const covered = all.filter(name => styled.has(name));
  const missing = all.filter(name => !styled.has(name));
  return {
    total: all.length,
    covered,
    missing,
    pct: Math.round((covered.length / all.length) * 100),
  };
}

/** One-line summary, e.g. `70/124 (56%)`. */
function summary({ covered, total, pct }) {
  return `${covered.length}/${total} (${pct}%)`;
}

/** The `--list` body: the components a consumer would get unstyled. */
function listMissing({ missing }) {
  return missing.length
    ? `Unstyled (${missing.length}):\n  ${missing.join(' ')}`
    : 'Nothing unstyled.';
}

function main() {
  if (!fs.existsSync(PKG)) {
    console.error(
      'react-aria-components is not installed; run yarn install first.'
    );
    process.exit(1);
  }
  const result = coverage(ariaCss());
  if (process.argv.includes('--json')) {
    const { total, covered, pct, missing } = result;
    console.log(
      JSON.stringify({ total, covered: covered.length, pct, missing }, null, 2)
    );
    return;
  }
  console.log(`React Aria styling coverage: ${summary(result)}`);
  if (process.argv.includes('--list')) console.log(`\n${listMissing(result)}`);
}

if (require.main === module) main();

module.exports = {
  PKG,
  CSS,
  SCSS,
  ariaCss,
  stockClasses,
  coverage,
  summary,
  listMissing,
};
