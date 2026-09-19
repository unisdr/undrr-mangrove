/** @jest-environment node */
/**
 * @file published-paths.test.js
 * @description Keeps `scripts/published-paths.cjs` honest.
 *
 * The model is only useful if it matches the tarball. Two checks:
 *
 * 1. It still agrees with the constants in `assemble-npm-package.mjs`, which
 *    is the single source of truth for what is published.
 * 2. When a `dist/` is present, every path the model claims really is there.
 *    Without a build this is skipped — `yarn test` must work on a fresh clone
 *    — so CI, which builds, is where it bites.
 *
 * Verified once by hand against a packed 2.0.0-rc.2 tarball: `npm pack`
 * produced 275 files, the model produced 229, and the 46 extras were
 * webpack's `components/*.js.LICENSE.txt` banner sidecars and two
 * content-hashed `components/assets/*.svg`. Neither is ever a documented
 * import, so the model leaves them out on purpose; the dist comparison below
 * encodes exactly that.
 */
const fs = require('fs');
const path = require('path');

const {
  ROOT,
  componentEntryNames,
  publishedPaths,
} = require('../published-paths.cjs');

const assembleSource = fs.readFileSync(
  path.join(ROOT, 'scripts/assemble-npm-package.mjs'),
  'utf8'
);

describe('the published-path model', () => {
  const paths = publishedPaths();

  test('covers every top-level directory the package ships', () => {
    // PACKAGE_FILES in assemble-npm-package.mjs.
    for (const dir of [
      'components',
      'css',
      'js',
      'scss',
      'error-pages',
      'fonts',
    ]) {
      expect([...paths].some(entry => entry.startsWith(`${dir}/`))).toBe(true);
    }
  });

  test('stays in step with assemble-npm-package.mjs', () => {
    // The dist -> package directory mapping the model inverts.
    for (const line of [
      "['dist/assets/js', 'js']",
      "['dist/assets/css', 'css']",
      "['dist/assets/error-pages', 'error-pages']",
      "['dist/fonts', 'fonts']",
      "['dist/components', 'components']",
    ]) {
      expect(assembleSource).toContain(line);
    }
    // The scss copy is flattened from stories/, which is why the published
    // entry point is scss/assets/scss/style.scss.
    expect(assembleSource).toContain(
      "path.join(out, 'scss', path.relative(storiesDir, file))"
    );
    // Development-only files never reach the tarball, in either direction.
    expect([...paths].some(entry => entry.includes('__tests__/'))).toBe(false);
    expect([...paths].some(entry => /\.(test|spec)\./.test(entry))).toBe(false);
  });

  test('names the SCSS entry point and the vanilla modules as published', () => {
    // The two paths #1266 and #1267 were filed about.
    expect(paths.has('scss/assets/scss/style.scss')).toBe(true);
    expect(paths.has('js/on-this-page-nav.js')).toBe(true);
    expect(paths.has('js/preview-access.js')).toBe(true);
    // And the shapes the docs used to teach, which never existed.
    expect(paths.has('stories/assets/scss/style.scss')).toBe(false);
    expect(paths.has('scss/style.scss')).toBe(false);
  });

  test('derives one component bundle per webpack entry', () => {
    const names = componentEntryNames();
    expect(names.length).toBeGreaterThan(30);
    expect(names).toContain('hydrate');
    for (const name of names)
      expect(paths.has(`components/${name}.js`)).toBe(true);
  });

  const dist = path.join(ROOT, 'dist');
  const built = fs.existsSync(path.join(dist, 'components'));
  const maybe = built ? test : test.skip;

  maybe('matches a real build, where one exists', () => {
    // dist/ -> package path, the same mapping assemble-npm-package.mjs uses.
    const toPackage = entry => {
      for (const [from, to] of [
        ['assets/js', 'js'],
        ['assets/css', 'css'],
        ['assets/error-pages', 'error-pages'],
        ['fonts', 'fonts'],
        ['components', 'components'],
      ]) {
        if (entry === from || entry.startsWith(`${from}/`)) {
          return `${to}${entry.slice(from.length)}`;
        }
      }
      return null;
    };

    const walk = (dir, found = []) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, found);
        else found.push(full);
      }
      return found;
    };

    const inDist = new Set();
    for (const file of walk(dist)) {
      const mapped = toPackage(
        path.relative(dist, file).split(path.sep).join('/')
      );
      if (mapped) inDist.add(mapped);
    }
    // scss/ is copied straight from the sources, not from dist/.
    for (const entry of publishedPaths()) {
      if (entry.startsWith('scss/')) inDist.add(entry);
    }
    inDist.add('README.md');
    inDist.add('LICENSE');
    inDist.add('package.json');

    const missing = [...publishedPaths()].filter(entry => !inDist.has(entry));
    expect(missing).toEqual([]);

    // The reverse direction, minus the two categories the model omits on
    // purpose: webpack banner sidecars and content-hashed bundle assets.
    const unmodelled = [...inDist].filter(
      entry =>
        !paths.has(entry) &&
        !entry.endsWith('.js.LICENSE.txt') &&
        !entry.startsWith('components/assets/')
    );
    expect(unmodelled).toEqual([]);
  });
});
