/**
 * Model of what `@undrr/undrr-mangrove` publishes, derived from the sources.
 *
 * Documentation keeps naming import paths the package does not contain
 * (unisdr/undrr-mangrove#1252, #1253, #1266, #1267), because docs are written
 * against the repo tree and consumers install the tarball, and the two have
 * never had the same shape. Answering "does this specifier resolve?" needs the
 * tarball, but a full `yarn build` plus `npm pack` is far too slow for a unit
 * test, so this rebuilds the same answer from the repo in a few milliseconds.
 *
 * It mirrors, and must stay in step with, three things:
 *
 * 1. `scripts/assemble-npm-package.mjs` — `DIST_COPIES` (which `dist/`
 *    directory becomes which top-level package directory), the `scss/` copy
 *    that flattens `stories/**\/*.scss`, `PACKAGE_FILES` and `isDevOnly()`.
 * 2. `webpack.config.js` — the CopyPlugin patterns that fill `dist/assets`,
 *    `dist/fonts` and `dist/assets/error-pages`, and the `entry` map of the
 *    component build, whose keys become `components/<Key>.js`.
 * 3. `package.json` — the `scss` script's Sass directory compile
 *    (`stories/assets/scss` -> `stories/assets/css`), whose output becomes
 *    `css/`.
 *
 * `scripts/__tests__/published-paths.test.js` compares the model against a
 * real `dist/` when one is present, so the drift is caught rather than assumed
 * away. Without a build that comparison is skipped and the model stands alone.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Kept as a literal rather than imported from assemble-npm-package.mjs, which
// is ESM; published-paths.test.js asserts the two still agree.
const DEV_ONLY_DIRS = new Set([
  '__tests__',
  '__snapshots__',
  '__mocks__',
  '__fixtures__',
]);
const DEV_ONLY_FILE = /\.(test|spec)\.[^.]+$/;
const isDevOnly = name => DEV_ONLY_DIRS.has(name) || DEV_ONLY_FILE.test(name);

/** Every file under `dir`, repo-relative, skipping development-only files. */
function walk(dir, found = []) {
  if (!fs.existsSync(dir)) return found;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || isDevOnly(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, found);
    else if (entry.isFile()) found.push(full);
  }
  return found;
}

const rel = (from, file) => path.relative(from, file).split(path.sep).join('/');

/**
 * Component bundle names, parsed out of the webpack `entry` map.
 *
 * Read as text on purpose: `webpack.config.js` is ESM that uses `import.meta`
 * and pulls in the whole webpack toolchain, neither of which a CommonJS Jest
 * suite can do cheaply. Same approach as `webpack-entries.test.js`.
 */
function componentEntryNames() {
  const config = fs.readFileSync(path.join(ROOT, 'webpack.config.js'), 'utf8');
  const start = config.indexOf('hydrate:');
  const block = config.slice(start, config.indexOf('externals', start));
  return [...block.matchAll(/([A-Za-z]\w*):\s*\n?\s*'(\.\/[^']+)'/g)].map(
    match => match[1]
  );
}

/**
 * Every path the published tarball contains, as a consumer would write it
 * after the package name: `components/Pager.js`, `css/style.css`,
 * `js/tabs.js`, `scss/assets/scss/style.scss`, and so on.
 *
 * @returns {Set<string>} Package-relative POSIX paths.
 */
function publishedPaths() {
  const paths = new Set(['README.md', 'LICENSE', 'package.json']);

  // components/ — one ES module per webpack entry.
  for (const name of componentEntryNames()) paths.add(`components/${name}.js`);

  // js/, fonts/, error-pages/ — CopyPlugin copies these trees verbatim into
  // dist/, and assemble-npm-package.mjs lifts them to the package root.
  const verbatim = [
    ['stories/assets/js', 'js'],
    ['stories/assets/fonts/mangrove-icon-set', 'fonts/mangrove-icon-set'],
    ['stories/Components/ErrorPages/static', 'error-pages'],
  ];
  for (const [from, to] of verbatim) {
    const dir = path.join(ROOT, from);
    for (const file of walk(dir)) paths.add(`${to}/${rel(dir, file)}`);
  }

  // css/ — `yarn scss` compiles the entry points (non-partials) of
  // stories/assets/scss, each emitting a stylesheet and a source map.
  const scssRoot = path.join(ROOT, 'stories/assets/scss');
  for (const file of walk(scssRoot)) {
    const name = path.basename(file);
    if (!name.endsWith('.scss') || name.startsWith('_')) continue;
    const stem = rel(scssRoot, file).replace(/\.scss$/, '');
    paths.add(`css/${stem}.css`);
    paths.add(`css/${stem}.css.map`);
  }

  // scss/ — every .scss under stories/, keeping its path below stories/.
  // This is why the published SCSS entry point is `scss/assets/scss/style.scss`
  // and not `scss/style.scss`.
  const storiesRoot = path.join(ROOT, 'stories');
  for (const file of walk(storiesRoot)) {
    if (!file.endsWith('.scss')) continue;
    paths.add(`scss/${rel(storiesRoot, file)}`);
  }

  return paths;
}

module.exports = { ROOT, isDevOnly, componentEntryNames, publishedPaths, walk };
