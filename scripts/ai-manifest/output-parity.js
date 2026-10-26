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
];

export function outputFiles(directory) {
  const files = fs
    .readdirSync(directory)
    .filter(name =>
      /^(?:llms(?:-[\w-]+)?\.txt|llms\.json|tokens\.json|releases\.json|content-patterns\.json|validation\.json|metadata-contract\.json)$/.test(
        name
      )
    );
  const components = path.join(directory, 'ai-components');
  if (fs.existsSync(components)) {
    files.push(
      ...fs
        .readdirSync(components)
        .filter(name => name.endsWith('.json'))
        .map(name => `ai-components/${name}`)
    );
  }
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
      const text = fs.readFileSync(path.join(directory, filename), 'utf8');
      if (!filename.endsWith('.json')) return text;
      const data = JSON.parse(text);
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
