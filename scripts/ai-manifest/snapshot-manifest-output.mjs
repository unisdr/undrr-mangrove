/** Run generation and validation against fresh output, then publish a snapshot. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { outputFiles } from './output-parity.js';
import {
  readComponentMetadata,
  componentMetadataContract,
} from './component-metadata.js';
import { selectPublishedComponents } from './catalog-components.js';

const args = process.argv.slice(2);
const option = (name, fallback) =>
  args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ||
  fallback;
const destinationArg = args.find(arg => !arg.startsWith('--'));
if (!destinationArg) {
  console.error(
    'Usage: node scripts/ai-manifest/snapshot-manifest-output.mjs DESTINATION [--build-dir=docs-build-temp] [--generator=scripts/ai-manifest/generate-ai-manifest.js] [--metadata-file=FILE]'
  );
  process.exit(1);
}
const destination = path.resolve(destinationArg);
const buildDirectory = path.resolve(option('build-dir', 'docs-build-temp'));
const generator = path.resolve(
  option('generator', 'scripts/ai-manifest/generate-ai-manifest.js')
);
if (fs.existsSync(destination))
  throw new Error(`Snapshot destination already exists: ${destination}`);
const metadata = path.resolve(
  option(
    'metadata-file',
    path.join(buildDirectory, 'manifests/components.json')
  )
);
// Validate before executing even an earlier generator that lacks the adapter.
const input = readComponentMetadata(metadata);
const navigationIndex = JSON.parse(
  fs.readFileSync(path.join(buildDirectory, 'index.json'), 'utf8')
);
const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'mangrove-ai-snapshot-'));
try {
  // Reusing the producer's output directory could preserve a file the candidate
  // stopped generating, falsely passing parity against stale baseline output.
  fs.mkdirSync(path.join(staging, 'manifests'));
  fs.copyFileSync(metadata, path.join(staging, 'manifests/components.json'));
  fs.copyFileSync(
    path.join(buildDirectory, 'index.json'),
    path.join(staging, 'index.json')
  );
  const generationArgs = [generator, `--build-dir=${staging}`];
  if (option('metadata-file'))
    generationArgs.push(`--metadata-file=${metadata}`);
  const run = validation => {
    const result = spawnSync(
      process.execPath,
      [...generationArgs, ...(validation ? ['--validate'] : [])],
      { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
    );
    if (result.error) throw result.error;
    if (result.status !== 0)
      throw new Error(
        `${validation ? 'Validation' : 'Generation'} failed (${result.status}):\n${result.stdout}\n${result.stderr}`
      );
    return {
      exitCode: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  };
  run(false);
  const validation = run(true);
  input.components = selectPublishedComponents(input.components);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  // Exclusive creation also catches a destination created during generation.
  fs.mkdirSync(destination);
  for (const filename of outputFiles(staging).filter(
    filename =>
      filename !== 'validation.json' &&
      filename !== 'metadata-contract.json' &&
      filename !== 'navigation-index.json'
  )) {
    const target = path.join(destination, filename);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(staging, filename), target);
  }
  fs.writeFileSync(
    path.join(destination, 'validation.json'),
    JSON.stringify(validation, null, 2)
  );
  fs.writeFileSync(
    path.join(destination, 'navigation-index.json'),
    JSON.stringify(navigationIndex, null, 2)
  );
  // Write the required contract last; interrupted copies cannot appear complete.
  fs.writeFileSync(
    path.join(destination, 'metadata-contract.json'),
    JSON.stringify(componentMetadataContract(input), null, 2)
  );
  console.log(`Snapshot generated and validated: ${destination}`);
} finally {
  fs.rmSync(staging, { recursive: true, force: true });
}
