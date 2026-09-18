#!/usr/bin/env node
/**
 * Assemble the publishable npm package directory from a built `dist/`.
 *
 * This is the single source of truth for what `@undrr/undrr-mangrove`
 * contains: `.github/workflows/npm-publish.yml` runs it before publishing,
 * and the break-glass local release in docs/RELEASES.md runs it too.
 *
 * The repo root is NOT the published package (its own `files` field covers
 * the sources, not the build output), so `npm pack` at the root is
 * misleading. See https://github.com/unisdr/undrr-mangrove/issues/871
 *
 * Usage:
 *   node scripts/assemble-npm-package.mjs [outDir] [--root <repoRoot>]
 *
 * outDir defaults to `npm-package` (relative to the repo root) and is
 * replaced on every run. Because it is deleted first, it must resolve to a
 * directory strictly inside the repo root, outside the repo's own source
 * directories, and be either absent, empty, or a previous package build
 * (a package.json named @undrr/undrr-mangrove and no .git).
 *
 * Intentional quirks, kept to match every published release:
 * - The whole of dist/ is copied to <outDir>/dist, but the generated
 *   `files` array excludes it, so it never reaches the tarball and
 *   `main: "dist/index.js"` points at nothing. Consumers import from the
 *   top-level subpath directories. Changing either changes what is published.
 * - Development-only files (`__tests__/` and friends, `*.test.*`,
 *   `*.spec.*`) are left behind everywhere, because every copy below walks
 *   whole directories. See DEV_ONLY_GLOBS, which webpack.config.js applies to
 *   the same sources so the CDN `dist/` tree stays clean too.
 * - Top-level dotfiles of each copied directory are skipped, matching the
 *   shell glob (`cp -r dir/*`) the workflow used before this script. As with
 *   that glob, a source directory that exists but has nothing to copy fails.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PACKAGE_NAME = '@undrr/undrr-mangrove';

export const PACKAGE_FILES = [
  'components/**/*',
  'css/**/*',
  'js/**/*',
  'scss/**/*.scss',
  'error-pages/**/*',
  'fonts/**/*',
  // Second line of defence: even if a development-only file reaches the
  // assembled directory, npm leaves it out of the tarball.
  '!**/__tests__/**',
  '!**/__snapshots__/**',
  '!**/__mocks__/**',
  '!**/__fixtures__/**',
  '!**/*.test.*',
  '!**/*.spec.*',
];

// Development-only files that must never reach a consumer. Jest specs live
// beside the sources they test (`stories/assets/js/__tests__/`), and both the
// copies below and webpack's `stories/assets` -> `dist/assets` copy walk whole
// directories, so without this they travel into the npm tarball and into every
// versioned CDN folder. See issue unisdr/undrr-mangrove#1218.
const DEV_ONLY_DIRS = new Set([
  '__tests__',
  '__snapshots__',
  '__mocks__',
  '__fixtures__',
]);
// Any `name.test.ext` / `name.spec.ext`, whatever the extension, so this
// stays in step with the globs and the package.json negations below.
const DEV_ONLY_FILE = /\.(test|spec)\.[^.]+$/;

// Glob equivalents of `isDevOnly`, for consumers that filter by pattern
// rather than by path (webpack's CopyPlugin `globOptions.ignore`).
export const DEV_ONLY_GLOBS = [
  '**/__tests__/**',
  '**/__snapshots__/**',
  '**/__mocks__/**',
  '**/__fixtures__/**',
  '**/*.test.*',
  '**/*.spec.*',
];

/** True when `name` (a single path segment) is a development-only file or directory. */
export const isDevOnly = name =>
  DEV_ONLY_DIRS.has(name) || DEV_ONLY_FILE.test(name);

// [source relative to repo root, destination relative to outDir]
const DIST_COPIES = [
  ['dist', 'dist'],
  ['dist/assets/js', 'js'],
  ['dist/assets/css', 'css'],
  ['dist/assets/error-pages', 'error-pages'],
  ['dist/fonts', 'fonts'],
  ['dist/components', 'components'],
];

// Top-level names in the repo that must never be used as (or contain) the
// output directory, even though they are inside the repo root. Compared
// case-insensitively because macOS and Windows filesystems usually are.
const PROTECTED_DIRS = new Set(
  [
    '.git',
    '.github',
    '.storybook',
    '.yarn',
    'dist',
    'docs',
    'githooks',
    'node_modules',
    'schemas',
    'scripts',
    'src',
    'stories',
    'tokens',
  ].map(name => name.toLowerCase())
);

const isDir = p => fs.existsSync(p) && fs.statSync(p).isDirectory();

// Canonical path, following symlinks (and, with .native, normalising case on
// macOS) for the part of the path that exists.
function realish(p) {
  const missing = [];
  let current = p;
  for (;;) {
    try {
      return path.join(fs.realpathSync.native(current), ...missing.reverse());
    } catch (err) {
      if (err.code !== 'ENOENT' && err.code !== 'ENOTDIR') throw err;
      const parent = path.dirname(current);
      if (parent === current) return p;
      missing.push(path.basename(current));
      current = parent;
    }
  }
}

function isPreviousBuild(dir) {
  if (fs.existsSync(path.join(dir, '.git'))) return false;
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(dir, 'package.json'), 'utf8')
    );
    return pkg.name === PACKAGE_NAME;
  } catch {
    return false;
  }
}

/**
 * Throw unless `out` is safe to delete: strictly inside rootDir, not in a
 * protected repo directory, and absent, empty or a previous package build.
 */
export function assertSafeOutDir(rootDir, out) {
  const refuse = reason => {
    throw new Error(
      `Refusing to use ${out} as the output directory: ${reason}.`
    );
  };
  const realRoot = realish(rootDir);
  const realOut = realish(out);
  const rel = path.relative(realRoot, realOut);
  if (
    !rel ||
    rel === '..' ||
    rel.startsWith(`..${path.sep}`) ||
    path.isAbsolute(rel)
  ) {
    refuse(`it must be a directory inside ${realRoot}`);
  }
  const [first] = rel.split(path.sep);
  if (PROTECTED_DIRS.has(first.toLowerCase())) {
    refuse(`${first}/ is part of the repository`);
  }
  if (!fs.existsSync(out)) return;
  if (!fs.statSync(realOut).isDirectory()) refuse('it is not a directory');
  if (fs.readdirSync(realOut).length > 0 && !isPreviousBuild(realOut)) {
    refuse(
      `it is not empty and is not a previous ${PACKAGE_NAME} package build`
    );
  }
}

// Equivalent of `mkdir -p dest && cp -r src/* dest/`, including failing when
// the glob matches nothing.
function copyContents(src, dest) {
  const entries = fs.readdirSync(src).filter(entry => !entry.startsWith('.'));
  if (entries.length === 0) {
    throw new Error(`${src} exists but has no files to copy.`);
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of entries) {
    if (isDevOnly(entry)) continue;
    fs.cpSync(path.join(src, entry), path.join(dest, entry), {
      recursive: true,
      verbatimSymlinks: true,
      filter: from => !isDevOnly(path.basename(from)),
    });
  }
}

function findScss(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (isDevOnly(entry.name)) continue;
    if (entry.isDirectory()) findScss(full, found);
    else if (entry.isFile() && entry.name.endsWith('.scss')) found.push(full);
  }
  return found;
}

export function buildPackageJson(pkg) {
  return {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    main: 'dist/index.js',
    files: PACKAGE_FILES,
    repository: pkg.repository,
    keywords: pkg.keywords,
    author: pkg.author,
    license: pkg.license,
  };
}

export function assemble({
  root = process.cwd(),
  outDir = 'npm-package',
} = {}) {
  const rootDir = path.resolve(root);
  const out = path.resolve(rootDir, outDir);
  const dist = path.join(rootDir, 'dist');

  if (!isDir(dist)) {
    throw new Error(
      `No dist/ directory found in ${rootDir}. Run \`yarn build\` first.`
    );
  }
  assertSafeOutDir(rootDir, out);

  fs.rmSync(out, { recursive: true, force: true });

  for (const [src, dest] of DIST_COPIES) {
    const srcDir = path.join(rootDir, src);
    if (isDir(srcDir)) copyContents(srcDir, path.join(out, dest));
  }

  const storiesDir = path.join(rootDir, 'stories');
  fs.mkdirSync(path.join(out, 'scss'), { recursive: true });
  if (isDir(storiesDir)) {
    for (const file of findScss(storiesDir)) {
      const dest = path.join(out, 'scss', path.relative(storiesDir, file));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(file, dest);
    }
  }

  fs.copyFileSync(path.join(rootDir, 'README.md'), path.join(out, 'README.md'));
  const license = path.join(rootDir, 'LICENSE');
  if (fs.existsSync(license)) {
    fs.copyFileSync(license, path.join(out, 'LICENSE'));
  } else {
    console.warn('No LICENSE file found');
  }

  const pkg = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')
  );
  fs.writeFileSync(
    path.join(out, 'package.json'),
    JSON.stringify(buildPackageJson(pkg), null, 2)
  );

  return out;
}

export function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root' || arg.startsWith('--root=')) {
      const value = arg === '--root' ? argv[(i += 1)] : arg.slice(7);
      if (!value || value.startsWith('-')) {
        throw new Error('--root needs a directory path');
      }
      opts.root = value;
    } else if (!arg.startsWith('-') && !opts.outDir) opts.outDir = arg;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const out = assemble(parseArgs(process.argv.slice(2)));
    console.log(
      `Assembled npm package in ${path.relative(process.cwd(), out) || '.'}`
    );
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
