/** Run generation and validation, then snapshot the complete published AI output. */
import fs from 'node:fs';
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
const generationArgs = [generator, `--build-dir=${buildDirectory}`];
const metadata = option('metadata-file');
if (metadata) generationArgs.push(`--metadata-file=${path.resolve(metadata)}`);
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
const input = readComponentMetadata(
  metadata
    ? path.resolve(metadata)
    : path.join(buildDirectory, 'manifests/components.json')
);
input.components = selectPublishedComponents(input.components);
fs.mkdirSync(destination, { recursive: true });
for (const filename of outputFiles(buildDirectory).filter(
  filename => filename !== 'validation.json'
)) {
  const target = path.join(destination, filename);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(buildDirectory, filename), target);
}
fs.writeFileSync(
  path.join(destination, 'validation.json'),
  JSON.stringify(validation, null, 2)
);
fs.writeFileSync(
  path.join(destination, 'metadata-contract.json'),
  JSON.stringify(componentMetadataContract(input), null, 2)
);
console.log(`Snapshot generated and validated: ${destination}`);
