#!/usr/bin/env node
/**
 * Guard the published AI catalogue's prop contract against silent drift.
 *
 * `yarn validate-manifest` checks the catalogue is well formed, but a
 * catalogue with weaker data is still well formed: on Storybook 11's docgen
 * server, 156 props became `any` and validation still passed. This compares
 * a summary of every published component (each prop's type, optionality,
 * default and whether it is described, plus example names) with the
 * committed baseline, and fails on any difference.
 *
 * Usage:
 *   yarn check:catalogue-baseline [--build-dir=docs-build-temp]
 *   yarn check:catalogue-baseline --update
 *
 * When a difference is intended (a new prop, a corrected type, a new
 * component), run with --update and explain the baseline diff in the PR.
 */
import fs from 'node:fs';
import path from 'node:path';
import { diffSummaries, summariseCatalogue } from './catalogue-baseline.js';

const args = process.argv.slice(2);
const buildDir = path.resolve(
  args.find(a => a.startsWith('--build-dir='))?.split('=')[1] ||
    'docs-build-temp'
);
const baselineFile = path.resolve(
  'scripts/ai-manifest/catalogue-baseline.json'
);
const actual = summariseCatalogue(path.join(buildDir, 'ai-components'));

if (args.includes('--update')) {
  fs.writeFileSync(baselineFile, `${JSON.stringify(actual, null, 2)}\n`);
  console.log(
    `Catalogue baseline updated: ${Object.keys(actual).length} components.`
  );
} else {
  const expected = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
  const differences = diffSummaries(expected, actual);
  if (differences.length) {
    console.error(
      `Published catalogue differs from scripts/ai-manifest/catalogue-baseline.json (${differences.length}):`
    );
    for (const line of differences) console.error(`  ${line}`);
    console.error(
      '\nIf intended, run "yarn check:catalogue-baseline --update" and explain the baseline diff in the PR.'
    );
    process.exitCode = 1;
  } else {
    console.log(
      `Catalogue matches its baseline: ${Object.keys(actual).length} components.`
    );
  }
}
