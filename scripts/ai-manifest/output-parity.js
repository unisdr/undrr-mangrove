/** Compare complete generated AI output, not only its component count. */
import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const timestampFiles = new Set([
  'llms.json',
  'tokens.json',
  'releases.json',
  'ai-components/index.json',
  'ai-components/utilities.json',
  'ai-components/tokens.json',
  'ai-components/releases.json',
]);
const requiredFiles = [
  'ai-components/index.json',
  'llms.txt',
  'llms.json',
  'tokens.json',
  'releases.json',
  'content-patterns.json',
  'validation.json',
  'metadata-contract.json',
  'navigation-index.json',
];

export function outputFiles(directory) {
  const files = [];
  const visit = relative => {
    for (const entry of fs.readdirSync(path.join(directory, relative), {
      withFileTypes: true,
    })) {
      const filename = relative ? `${relative}/${entry.name}` : entry.name;
      // These are the two read-only Storybook inputs copied into fresh staging.
      if (filename === 'index.json' || filename === 'manifests') continue;
      if (entry.isDirectory()) visit(filename);
      else if (entry.isFile()) files.push(filename);
      else throw new Error(`Snapshot contains a non-regular file: ${filename}`);
    }
  };
  visit('');
  return files.sort();
}

export function compareManifestOutput(baselineDirectory, candidateDirectory) {
  const baselineFiles = outputFiles(baselineDirectory);
  const candidateFiles = outputFiles(candidateDirectory);
  const differences = [];
  for (const filename of requiredFiles) {
    if (!baselineFiles.includes(filename))
      differences.push(`Baseline missing required ${filename}`);
    if (!candidateFiles.includes(filename))
      differences.push(`Candidate missing required ${filename}`);
  }
  for (const [label, directory, files] of [
    ['Baseline', baselineDirectory, baselineFiles],
    ['Candidate', candidateDirectory, candidateFiles],
  ]) {
    if (!files.includes('metadata-contract.json')) continue;
    const contract = JSON.parse(
      fs.readFileSync(path.join(directory, 'metadata-contract.json'), 'utf8')
    );
    for (const id of Object.keys(contract.components || {})) {
      const filename = `ai-components/${id}.json`;
      if (!files.includes(filename))
        differences.push(`${label} missing component output ${filename}`);
    }
  }
  for (const filename of new Set([...baselineFiles, ...candidateFiles])) {
    if (!baselineFiles.includes(filename)) {
      differences.push(`Added ${filename}`);
      continue;
    }
    if (!candidateFiles.includes(filename)) {
      differences.push(`Removed ${filename}`);
      continue;
    }
    const read = directory => {
      const content = fs.readFileSync(path.join(directory, filename));
      if (!filename.endsWith('.json')) return content;
      const data = JSON.parse(content.toString('utf8'));
      if (timestampFiles.has(filename)) {
        if (
          typeof data.generatedAt !== 'string' ||
          Number.isNaN(Date.parse(data.generatedAt))
        ) {
          differences.push(
            `${directory}: ${filename} lacks a valid generatedAt timestamp`
          );
        }
        delete data.generatedAt;
      }
      if (filename === 'validation.json' && data.exitCode !== 0)
        differences.push(`${directory}: validation must have succeeded`);
      return data;
    };
    if (!isDeepStrictEqual(read(baselineDirectory), read(candidateDirectory)))
      differences.push(`Changed ${filename}`);
  }
  return { files: baselineFiles.length, differences };
}
