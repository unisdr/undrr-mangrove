#!/usr/bin/env node
/**
 * Assemble the publishable npm package directory from a built `dist/`.
 *
 * This is the single source of truth for what `@undrr/undrr-mangrove`
 * contains: `.github/workflows/npm-publish.yml` runs it before publishing,
 * and the break-glass local release in docs/RELEASES.md runs it too.
 *
 * The repo root is NOT the published package (its package.json has no
 * `files` field), so `npm pack` at the root is misleading. See
 * https://github.com/unisdr/undrr-mangrove/issues/871
 *
 * Usage:
 *   node scripts/assemble-npm-package.mjs [outDir] [--root <repoRoot>]
 *
 * outDir defaults to `npm-package` (relative to the repo root) and is
 * replaced on every run.
 *
 * Intentional quirks, kept to match every published release:
 * - The whole of dist/ is copied to <outDir>/dist, but the generated
 *   `files` array excludes it, so it never reaches the tarball and
 *   `main: "dist/index.js"` points at nothing. Consumers import from the
 *   top-level subpath directories. Changing either changes what is published.
 * - Top-level dotfiles of each copied directory are skipped, matching the
 *   shell glob (`cp -r dir/*`) the workflow used before this script.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PACKAGE_FILES = [
  'components/**/*',
  'css/**/*',
  'js/**/*',
  'scss/**/*.scss',
  'error-pages/**/*',
  'fonts/**/*',
];

// [source relative to repo root, destination relative to outDir]
const DIST_COPIES = [
  ['dist', 'dist'],
  ['dist/assets/js', 'js'],
  ['dist/assets/css', 'css'],
  ['dist/assets/error-pages', 'error-pages'],
  ['dist/fonts', 'fonts'],
  ['dist/components', 'components'],
];

const isDir = p => fs.existsSync(p) && fs.statSync(p).isDirectory();

// Equivalent of `mkdir -p dest && cp -r src/* dest/`.
function copyContents(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    if (entry.startsWith('.')) continue;
    fs.cpSync(path.join(src, entry), path.join(dest, entry), {
      recursive: true,
    });
  }
}

function findScss(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
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
  // Guard the rm below against an outDir that would delete the repo itself.
  if (out === rootDir || rootDir.startsWith(out + path.sep) || out === dist) {
    throw new Error(`Refusing to use ${out} as the output directory.`);
  }

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
    if (arg === '--root') opts.root = argv[(i += 1)];
    else if (arg.startsWith('--root=')) opts.root = arg.slice(7);
    else if (!arg.startsWith('-') && !opts.outDir) opts.outDir = arg;
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
