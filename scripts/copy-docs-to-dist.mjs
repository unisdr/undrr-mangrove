#!/usr/bin/env node
/**
 * Copy the editorial manual and the llms-*.txt sub-manifests into dist/docs/.
 *
 * The UNDRR asset library mirrors Mangrove twice: `mangrove/latest/` is a copy
 * of this repository's `dist` branch (the contents of `dist/`), and
 * `mangrove/{version}/` is the unpacked npm package, which
 * `assemble-npm-package.mjs` builds from `dist/`. Anything written here
 * therefore reaches both, as `docs/<file>`, with no change on the asset
 * library side. See undrr/web-backlog#3109.
 *
 * Runs as the last step of `yarn build`, after the AI manifest generator has
 * written the sub-manifests into the Storybook build directory:
 *
 * - `docs/EDITORIAL-MANUAL.md`, with a provenance line on top and its
 *   relative `.md` links made absolute. Links to a guide with a Storybook page
 *   point at that page, using the same map (`DOC_PAGE_IDS` in
 *   `stories/Documentation/docsPageLinks.js`) that makes the links work inside
 *   Storybook; anything else points at the file on GitHub, as in Storybook.
 *   In-page `#anchor` links are kept.
 * - Every `llms-*.txt` in the build directory, found by pattern rather than
 *   listed, so a new sub-manifest ships without touching this script.
 *   `llms.txt` and `llms.json` are not copied: they index the Storybook site
 *   and only make sense next to it.
 *
 * dist/docs/ is replaced on every run, so a sub-manifest that is removed from
 * the generator does not linger in the next `dist` branch push.
 *
 * Usage:
 *   node scripts/copy-docs-to-dist.mjs [--build-dir=docs-build-temp]
 *     [--docs-base=https://mangrove.undrr.org/] [--root=<repoRoot>]
 *
 * `--build-dir` and `--docs-base` (or MANGROVE_DOCS_BASE_URL) match
 * `scripts/ai-manifest/generate-ai-manifest.js`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DOC_PAGE_IDS,
  linkDocsPages,
} from '../stories/Documentation/docsPageLinks.js';

export const DEFAULT_DOCS_BASE = 'https://mangrove.undrr.org/';

/** Repo-relative Markdown files copied verbatim (apart from links) to dist/docs/. */
export const DOCS_SOURCES = ['docs/EDITORIAL-MANUAL.md'];

/** Topic-scoped sub-manifests. Deliberately excludes `llms.txt` itself. */
export const SUBMANIFEST_FILE = /^llms-[\w.-]+\.txt$/;

/** The one sub-manifest every build must produce; its absence means the manifest step failed. */
const REQUIRED_SUBMANIFEST = 'llms-editorial-manual.txt';

const SOURCE_BANNER = /^> Edits to this file show up on both.*\n\n?/m;

/**
 * Prepare a docs/*.md file for publishing outside the repository.
 *
 * @param {string} markdown   The file's raw contents.
 * @param {string} sourcePath Repo-relative path, e.g. `docs/EDITORIAL-MANUAL.md`.
 * @param {object} options
 * @param {string} options.docsBase Storybook base URL, with trailing slash.
 * @param {string} options.version  Mangrove version the copy was built from.
 * @returns {string} The Markdown to write to dist/docs/.
 */
export function prepareDocsCopy(markdown, sourcePath, { docsBase, version }) {
  const pageId = DOC_PAGE_IDS[sourcePath];
  const rendered = pageId ? ` Rendered: ${docsBase}?path=/docs/${pageId}` : '';
  const provenance = `> Copy of ${sourcePath} from Mangrove ${version}, generated at build time; edit ${sourcePath} in unisdr/undrr-mangrove, not this file.${rendered}\n\n`;

  const body = linkDocsPages(markdown, sourcePath)
    // The banner describes the source file, not this copy.
    .replace(SOURCE_BANNER, '')
    .replaceAll('](?path=/docs/', `](${docsBase}?path=/docs/`);

  return provenance + body;
}

function normalizeDocsBase(url) {
  const parsed = new URL(url);
  if (!parsed.pathname.endsWith('/')) parsed.pathname += '/';
  return parsed.toString();
}

/**
 * Write dist/docs/ from the docs sources and the built sub-manifests.
 *
 * @returns {string[]} The file names written, sorted.
 */
export function copyDocsToDist({
  root = process.cwd(),
  buildDir = 'docs-build-temp',
  docsBase = DEFAULT_DOCS_BASE,
} = {}) {
  const rootDir = path.resolve(root);
  const build = path.resolve(rootDir, buildDir);
  const out = path.join(rootDir, 'dist', 'docs');

  if (!fs.existsSync(build)) {
    throw new Error(
      `No build directory at ${build}. Run \`yarn build\`, which generates the sub-manifests first.`
    );
  }
  const submanifests = fs
    .readdirSync(build)
    .filter(name => SUBMANIFEST_FILE.test(name))
    .sort();
  if (!submanifests.includes(REQUIRED_SUBMANIFEST)) {
    throw new Error(
      `${REQUIRED_SUBMANIFEST} not found in ${build}. Run \`yarn generate-ai-manifest\` first.`
    );
  }

  const { version } = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')
  );
  const base = normalizeDocsBase(docsBase);

  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  const written = [];
  for (const source of DOCS_SOURCES) {
    const markdown = fs.readFileSync(path.join(rootDir, source), 'utf8');
    const name = path.basename(source);
    fs.writeFileSync(
      path.join(out, name),
      prepareDocsCopy(markdown, source, { docsBase: base, version })
    );
    written.push(name);
  }
  for (const name of submanifests) {
    fs.copyFileSync(path.join(build, name), path.join(out, name));
    written.push(name);
  }

  return written.sort();
}

export function parseArgs(argv, env = process.env) {
  const opts = {};
  for (const arg of argv) {
    const [flag, ...rest] = arg.split('=');
    const value = rest.join('=');
    if (!value) throw new Error(`${flag} needs a value, as ${flag}=<value>`);
    if (flag === '--build-dir') opts.buildDir = value;
    else if (flag === '--docs-base') opts.docsBase = value;
    else if (flag === '--root') opts.root = value;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!opts.docsBase && env.MANGROVE_DOCS_BASE_URL) {
    opts.docsBase = env.MANGROVE_DOCS_BASE_URL;
  }
  return opts;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const written = copyDocsToDist(parseArgs(process.argv.slice(2)));
    console.log(`Copied to dist/docs/: ${written.join(', ')}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
