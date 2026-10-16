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
const consumers = [];
const helperApis = [];
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
  // Review-time consumer comparisons: keep the actual Drupal import order,
  // both variable preludes, and sub-brand wrappers in the evidence boundary.
  const partials = [
    'fonts',
    'breakpoints',
    'mixins',
    'foundational',
    'utility',
    '../../Atom/Tag/tag',
    '../../Components/Cards/Card/card',
    '../../Components/Hero/hero',
    '../../Components/Tab/tab',
    '../../Components/Breadcrumbs/breadcrumbs',
  ];
  const compileConsumer = (cwd, source) =>
    sass.compileString(source, {
      loadPaths: [join(cwd, 'stories/assets/scss')],
      style: 'compressed',
      logger: sass.Logger.silent,
    }).css;
  const recipes = [];
  for (const mode of ['use', 'import']) {
    for (const theme of ['', 'irp', 'mcr', 'preventionweb', 'delta']) {
      recipes.push({
        name: `drupal-${mode}-${theme || 'default'}`,
        source:
          `@${mode} "variables"${mode === 'use' ? ' as *' : ''};` +
          (theme ? `@import "theme-${theme}";` : '') +
          partials.map(partial => `@import "${partial}";`).join(''),
      });
    }
    recipes.push({
      name: `intervening-override-${mode}`,
      source:
        `@${mode} "variables"${mode === 'use' ? ' as *' : ''};` +
        ':root{--mg-color-text:1 2 3;}' +
        partials.map(partial => `@import "${partial}";`).join(''),
    });
  }
  for (const { name, source } of recipes) {
    const before = compileConsumer(baseline, source);
    const after = compileConsumer(root, source);
    if (before !== after) throw new Error(`Consumer output changed: ${name}`);
    consumers.push({
      name,
      bytes: Buffer.byteLength(after),
      exact: true,
      beforeSha256: sha256(before),
      afterSha256: sha256(after),
    });
    console.log(`${name}: EXACT; ${Buffer.byteLength(after)} bytes`);
  }
  // Concrete public helper calls that worked before migration, in both APIs.
  // Do not forward unrelated component internals merely to expand this audit.
  const helperProbe = `.consumer-probe {
    width: mg-rem(16); font-size: $mg-font-size-300;
    @include mg-focus-ring; @include mg-focus-ring-inset;
    @include mg-list-unmarked; @include mg-card-image-zoom;
    @include mg-typography("small"); @include mg-font-roles-latin;
    @include mg-tokens-tabs; @include mg-tokens-mangrove;
    @include devicebreak(medium) { height: mg-rem(32); }
  }`;
  for (const bundle of bundles) {
    for (const mode of ['use', 'import']) {
      const source =
        `@${mode} "${bundle}"${mode === 'use' ? ' as *' : ''};` + helperProbe;
      const before = compileConsumer(baseline, source);
      const after = compileConsumer(root, source);
      helperApis.push({ bundle, mode, ...compareSassCss(before, after) });
      console.log(`${bundle} ${mode}: shared helper API restored`);
    }
  }
  if (process.env.SASS_EQUIVALENCE_REPORT)
    writeFileSync(
      process.env.SASS_EQUIVALENCE_REPORT,
      JSON.stringify(
        { baselineRef: ref, sass: sass.info, results, consumers, helperApis },
        null,
        2
      ) + '\n'
    );
  // Public module entries must not retain a parallel legacy import graph.
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
