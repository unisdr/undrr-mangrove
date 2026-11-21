/**
 * Check that Storybook's docgen server and PropTypes describe the same props.
 *
 *   yarn check:prop-contracts [--build-dir=docs-build-temp] [--quiet]
 *
 * Reads the docgen server output (`<build-dir>/services/core/docgen`) of a
 * Storybook build and compares it, for every component with PropTypes, with
 * the PropTypes read by react-docgen: same prop names, same optionality, a
 * real type wherever PropTypes give one, the same enum members wherever
 * PropTypes list `oneOf` literals, and the same default wherever both sides
 * state one. Every component is reported. Only components listed in
 * scripts/prop-contracts-migrated.json fail the check, so a migrated batch
 * cannot regress while the rest are pending (unisdr/undrr-mangrove#1511).
 *
 * The normal build runs with the docgen server off, so it writes no
 * `services/core/docgen`. Build with it on first:
 *
 *   MANGROVE_DOCGEN_SERVER=true yarn exec storybook build -o .cache/docgen-server-build
 *   yarn check:prop-contracts --build-dir=.cache/docgen-server-build
 *
 * A build directory without docgen server output fails the check, so it
 * never passes by comparing nothing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { checkContracts, readBuiltContracts } from './lib/prop-contracts.js';

const args = process.argv.slice(2);
const buildDirArg = args.find(arg => arg.startsWith('--build-dir='));
const buildDir = buildDirArg
  ? buildDirArg.slice('--build-dir='.length)
  : 'docs-build-temp';
if (!buildDir) {
  console.error('--build-dir= needs a directory.');
  process.exit(1);
}
const quiet = args.includes('--quiet');
const allowlistPath = path.resolve('scripts/prop-contracts-migrated.json');
const { migrated = [] } = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));

let contracts;
try {
  contracts = readBuiltContracts(buildDir);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
if (!contracts.length) {
  console.error(
    `No components in ${path.join(buildDir, 'services', 'core', 'docgen')}. ` +
      'Was Storybook built with MANGROVE_DOCGEN_SERVER=true?'
  );
  process.exit(1);
}
const { reports, failures, unknown } = checkContracts(contracts, migrated);

const agreeing = reports.filter(report => !report.problems.length);
const pending = reports.filter(
  report => report.problems.length && !report.enforced
);

for (const report of reports) {
  if (!report.problems.length || (quiet && !report.enforced)) continue;
  const label = report.enforced ? 'FAIL' : 'report';
  console.log(`${label} ${report.id} (${report.filePath})`);
  for (const problem of report.problems) console.log(`  - ${problem}`);
}

console.log(
  `\nProp contracts: ${reports.length} components with PropTypes, ` +
    `${agreeing.length} agree, ${pending.length} pending migration, ` +
    `${failures.length} of ${migrated.length} migrated components failing.`
);

if (unknown.length) {
  console.error(
    `Listed in ${path.relative(process.cwd(), allowlistPath)} but not a built component with PropTypes: ${unknown.join(', ')}`
  );
}
if (failures.length || unknown.length) process.exitCode = 1;
