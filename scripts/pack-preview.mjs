#!/usr/bin/env node
/**
 * Assemble the npm package (see assemble-npm-package.mjs) and report what
 * `npm pack` would put in the tarball, optionally diffed against a version
 * already published on npm.
 *
 * Usage:
 *   node scripts/pack-preview.mjs [outDir] [--compare <version>]
 *
 * The assembled directory is left in place so it can be published from.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assemble } from './assemble-npm-package.mjs';

const PACKAGE_NAME = '@undrr/undrr-mangrove';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function packDryRun(spec, cwd) {
  const args = ['pack', '--dry-run', '--json', '--ignore-scripts'];
  if (spec) args.push(spec);
  const out = execFileSync(npm, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    maxBuffer: 64 * 1024 * 1024,
    shell: process.platform === 'win32',
  });
  return JSON.parse(out)[0];
}

// Decimal megabytes, as npm reports them.
const mb = bytes => `${(bytes / 1e6).toFixed(2)} MB (${bytes} bytes)`;
const summary = info =>
  `${info.entryCount} files, ${mb(info.unpackedSize)} unpacked`;

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--compare') opts.compare = argv[(i += 1)];
    else if (arg.startsWith('--compare=')) opts.compare = arg.slice(10);
    else if (!arg.startsWith('-') && !opts.outDir) opts.outDir = arg;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if ('compare' in opts && !opts.compare) {
    throw new Error('--compare needs a version, e.g. --compare 2.0.0-rc.1');
  }
  return opts;
}

try {
  const opts = parseArgs(process.argv.slice(2));
  const out = assemble({ outDir: opts.outDir });
  const local = packDryRun(null, out);
  console.log(`Local ${local.name}@${local.version}: ${summary(local)}`);

  if (opts.compare) {
    // Run outside the repo so the root package.json cannot interfere.
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mangrove-pack-'));
    let remote;
    try {
      remote = packDryRun(`${PACKAGE_NAME}@${opts.compare}`, tmp);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
    console.log(
      `Published ${PACKAGE_NAME}@${opts.compare}: ${summary(remote)}`
    );

    // Default (UTF-16 code unit) sort, not localeCompare: a locale-aware
    // sort orders paths inconsistently and produces a misleading diff.
    const localFiles = new Set(local.files.map(f => f.path));
    const remoteFiles = new Set(remote.files.map(f => f.path));
    const onlyLocal = [...localFiles].filter(f => !remoteFiles.has(f)).sort();
    const onlyRemote = [...remoteFiles].filter(f => !localFiles.has(f)).sort();

    console.log(`\nOnly in local (${onlyLocal.length}):`);
    onlyLocal.forEach(f => console.log(`  + ${f}`));
    console.log(`\nOnly in ${opts.compare} (${onlyRemote.length}):`);
    onlyRemote.forEach(f => console.log(`  - ${f}`));
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
