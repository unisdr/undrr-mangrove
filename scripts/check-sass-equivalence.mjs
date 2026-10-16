#!/usr/bin/env node
// Compare current sources to the unmodified pre-migration commit using the
// SAME installed Sass version. Nothing from the baseline is copied into HEAD.
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  symlinkSync,
  rmSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import * as sass from 'sass';
import { compareSassCss } from './compare-sass-css.mjs';

const root = process.cwd();
const ref = process.argv[2] || '378dcdcc2d9adfd9e8d56b5ad1f585f8eca0e4c1';
const temporary = mkdtempSync(join(tmpdir(), 'mangrove-sass-equivalence-'));
const bundles = [
  'style',
  'style-all',
  'style-delta',
  'style-gutenberg',
  'style-irp',
  'style-mcr',
  'style-preventionweb',
];
const results = [];
try {
  const baseline = join(temporary, 'baseline');
  mkdirSync(baseline);
  const archive = execFileSync(
    'git',
    ['archive', ref, 'stories', 'tokens', 'scripts/build-tokens.cjs'],
    { maxBuffer: 100 * 1024 * 1024 }
  );
  execFileSync('tar', ['-x', '-C', baseline], { input: archive });
  symlinkSync(resolve('node_modules'), join(baseline, 'node_modules'), 'dir');
  for (const cwd of [baseline, root])
    execFileSync(process.execPath, ['scripts/build-tokens.cjs'], {
      cwd,
      stdio: 'pipe',
    });
  const compile = (cwd, bundle) =>
    sass.compile(join(cwd, 'stories/assets/scss', `${bundle}.scss`), {
      style: 'compressed',
      // The baseline is intentionally legacy; the candidate must use modules.
      logger: sass.Logger.silent,
    }).css;
  const sha256 = css => createHash('sha256').update(css).digest('hex');
  for (const bundle of bundles) {
    const before = compile(baseline, bundle);
    const after = compile(root, bundle);
    const result = {
      bundle,
      bytes: Buffer.byteLength(after),
      ...compareSassCss(before, after),
      beforeSha256: sha256(before),
      afterSha256: sha256(after),
    };
    results.push(result);
    console.log(
      `${bundle}: ${result.exact ? 'EXACT' : 'EQUIVALENT (four approved selector-list permutations)'}; ${result.bytes} bytes`
    );
  }
  if (process.env.SASS_EQUIVALENCE_REPORT)
    writeFileSync(
      process.env.SASS_EQUIVALENCE_REPORT,
      JSON.stringify({ baselineRef: ref, sass: sass.info, results }, null, 2) +
        '\n'
    );
  // Verify that the compatibility files contain forwards rather than quietly
  // retaining a parallel legacy implementation.
  const entries = bundles.map(bundle =>
    join(root, 'stories/assets/scss', `${bundle}.scss`)
  );
  for (const entry of entries) {
    if (/^\s*@import\b/m.test(readFileSync(entry, 'utf8')))
      throw new Error(`Legacy import in ${entry}`);
  }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
