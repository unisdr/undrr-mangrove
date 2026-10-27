#!/usr/bin/env node
/**
 * Assemble the npm package (see assemble-npm-package.mjs) and report what
 * `npm pack` would put in the tarball, optionally diffed against a version
 * already published on npm.
 *
 * Usage:
 *   node scripts/pack-preview.mjs [outDir] [--compare <version>]
 *
 * With --compare, the published tarball is downloaded to a temp directory
 * and every file is compared by content. Files that differ only in the
 * webpack banner's `Compiled on:` timestamp are counted separately, because
 * every build changes that line.
 *
 * The assembled directory is left in place so it can be published from.
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assemble, PACKAGE_NAME } from './assemble-npm-package.mjs';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
// Matches only the webpack banner's ISO timestamp, never the rest of a line.
const TIMESTAMP =
  /Compiled on:\s+\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g;

function runNpm(args, cwd) {
  return execFileSync(npm, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    maxBuffer: 64 * 1024 * 1024,
    shell: process.platform === 'win32',
  });
}

function packDryRun(cwd) {
  return JSON.parse(
    runNpm(['pack', '--dry-run', '--json', '--ignore-scripts'], cwd)
  )[0];
}

// Download and unpack a published version; returns its npm pack info and the
// directory holding the unpacked files.
function fetchPublished(version, tmp) {
  const info = JSON.parse(
    runNpm(
      [
        'pack',
        `${PACKAGE_NAME}@${version}`,
        '--json',
        '--ignore-scripts',
        '--pack-destination',
        tmp,
      ],
      tmp
    )
  )[0];
  execFileSync('tar', ['-xzf', path.join(tmp, info.filename), '-C', tmp]);
  return { info, dir: path.join(tmp, 'package') };
}

// Decimal megabytes, as npm reports them.
const mb = bytes => `${(bytes / 1e6).toFixed(2)} MB (${bytes} bytes)`;
const summary = info =>
  `${info.entryCount} files, ${mb(info.unpackedSize)} unpacked`;

const hash = buf => crypto.createHash('sha256').update(buf).digest('hex');

// 'same', 'timestamp' (differs only in the `Compiled on:` banner timestamp)
// or 'changed'. latin1 maps every byte to one character, so binary files
// (fonts, images) cannot collapse to equal strings the way invalid UTF-8
// would; and a file only counts as timestamp-only if both sides carry the
// banner.
export function compareBuffers(bufA, bufB) {
  if (bufA.equals(bufB)) return 'same';
  const textA = bufA.toString('latin1');
  const textB = bufB.toString('latin1');
  const hasBanner = text => new RegExp(TIMESTAMP.source).test(text);
  if (!hasBanner(textA) || !hasBanner(textB)) return 'changed';
  const strip = text => text.replace(TIMESTAMP, 'Compiled on:');
  return hash(strip(textA)) === hash(strip(textB)) ? 'timestamp' : 'changed';
}

function compareFiles(a, b) {
  return compareBuffers(fs.readFileSync(a), fs.readFileSync(b));
}

export function parseArgs(argv) {
  const opts = {};
  const compareValue = value => {
    if (!value || value.startsWith('-')) {
      throw new Error('--compare needs a version, e.g. --compare 2.0.0-rc.1');
    }
    return value;
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--compare') opts.compare = compareValue(argv[(i += 1)]);
    else if (arg.startsWith('--compare=')) {
      opts.compare = compareValue(arg.slice(10));
    } else if (!arg.startsWith('-') && !opts.outDir) opts.outDir = arg;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

function printList(title, items, marker) {
  console.log(`\n${title} (${items.length}):`);
  items.forEach(f => console.log(`  ${marker} ${f}`));
}

function compare(local, out, version) {
  // Run outside the repo so the root package.json cannot interfere.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mangrove-pack-'));
  try {
    const remote = fetchPublished(version, tmp);
    console.log(
      `Published ${PACKAGE_NAME}@${version}: ${summary(remote.info)}`
    );

    // Default (UTF-16 code unit) sort, not localeCompare: a locale-aware
    // sort orders paths inconsistently and produces a misleading diff.
    const localFiles = new Set(local.files.map(f => f.path));
    const remoteFiles = new Set(remote.info.files.map(f => f.path));
    const onlyLocal = [...localFiles].filter(f => !remoteFiles.has(f)).sort();
    const onlyRemote = [...remoteFiles].filter(f => !localFiles.has(f)).sort();
    const changed = [];
    const timestampOnly = [];
    [...localFiles]
      .filter(f => remoteFiles.has(f))
      .sort()
      .forEach(f => {
        const result = compareFiles(
          path.join(out, f),
          path.join(remote.dir, f)
        );
        if (result === 'changed') changed.push(f);
        else if (result === 'timestamp') timestampOnly.push(f);
      });

    printList('Only in local', onlyLocal, '+');
    printList(`Only in ${version}`, onlyRemote, '-');
    printList('Changed content', changed, '~');
    console.log(
      `\n${timestampOnly.length} other file(s) differ only in the ` +
        '"Compiled on:" build timestamp (expected for every build, not listed).'
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const opts = parseArgs(process.argv.slice(2));
    const out = assemble({ outDir: opts.outDir });
    const local = packDryRun(out);
    console.log(`Local ${local.name}@${local.version}: ${summary(local)}`);
    if (opts.compare) compare(local, out, opts.compare);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
