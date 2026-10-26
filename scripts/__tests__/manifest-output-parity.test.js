/** @jest-environment node */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { compareManifestOutput } from '../ai-manifest/output-parity';

let root;
let baseline;
let candidate;
const write = (directory, filename, value) => {
  fs.mkdirSync(path.dirname(path.join(directory, filename)), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(directory, filename),
    typeof value === 'string' ? value : JSON.stringify(value)
  );
};
const fixture = directory => {
  for (const filename of [
    'llms.json',
    'tokens.json',
    'releases.json',
    'ai-components/index.json',
    'ai-components/utilities.json',
  ]) {
    write(directory, filename, {
      generatedAt: '2026-10-26T12:00:00.000Z',
      components: [{ id: 'example' }],
    });
  }
  write(directory, 'metadata-contract.json', {
    components: { example: { stories: [{ id: 'example--default' }] } },
  });
  write(directory, 'content-patterns.json', { families: [] });
  write(directory, 'llms.txt', 'Generated guidance');
  write(directory, 'validation.json', {
    exitCode: 0,
    stdout: 'Props: 1 of 1\n',
    stderr: 'Expected warning\n',
  });
  write(directory, 'ai-components/example.json', {
    name: 'Example',
    props: { label: { required: true, default: 'Example', type: 'string' } },
    import: 'import { Example } from "example";',
    examples: [{ code: '<Example />' }],
    renderedHtml: [{ html: '<p>Example</p>' }],
    changelog: [{ version: '1.0' }],
    future: { generatedAt: 'user content is significant' },
  });
};

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-parity-'));
  baseline = path.join(root, 'baseline');
  candidate = path.join(root, 'candidate');
  fixture(baseline);
  fixture(candidate);
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

it('ignores only declared top-level generation times and JSON key order', () => {
  write(candidate, 'llms.json', {
    components: [{ id: 'example' }],
    generatedAt: '2026-10-27T12:00:00.000Z',
  });
  expect(compareManifestOutput(baseline, candidate).differences).toEqual([]);
});
it.each(['props', 'import', 'examples', 'renderedHtml', 'changelog', 'future'])(
  'detects lost %s data even when the component count is unchanged',
  field => {
    const filename = path.join(candidate, 'ai-components/example.json');
    const content = JSON.parse(fs.readFileSync(filename));
    delete content[field];
    fs.writeFileSync(filename, JSON.stringify(content));
    expect(compareManifestOutput(baseline, candidate).differences).toContain(
      'Changed ai-components/example.json'
    );
  }
);
it('detects added/removed component files and guidance changes', () => {
  fs.unlinkSync(path.join(candidate, 'ai-components/example.json'));
  write(candidate, 'ai-components/other.json', { name: 'Other' });
  write(candidate, 'llms.txt', 'Changed integration guidance');
  expect(compareManifestOutput(baseline, candidate).differences).toEqual(
    expect.arrayContaining([
      'Removed ai-components/example.json',
      'Added ai-components/other.json',
      'Changed llms.txt',
    ])
  );
});
it('cannot pass two empty directories or matching failed validation', () => {
  fs.rmSync(baseline, { recursive: true });
  fs.mkdirSync(baseline);
  fs.rmSync(candidate, { recursive: true });
  fs.mkdirSync(candidate);
  expect(
    compareManifestOutput(baseline, candidate).differences.length
  ).toBeGreaterThan(0);
  fixture(baseline);
  fixture(candidate);
  for (const directory of [baseline, candidate])
    write(directory, 'validation.json', { exitCode: 1 });
  expect(
    compareManifestOutput(baseline, candidate).differences.join('\n')
  ).toContain('validation must have succeeded');
});
it('compares validation warnings as well as the exit code', () => {
  write(candidate, 'validation.json', {
    exitCode: 0,
    stdout: 'Props: 0 of 1\n',
    stderr: '',
  });
  expect(compareManifestOutput(baseline, candidate).differences).toContain(
    'Changed validation.json'
  );
});

it('detects changed story identity even when published examples would look identical', () => {
  write(candidate, 'metadata-contract.json', {
    components: { example: { stories: [{ id: 'example--renamed' }] } },
  });
  expect(compareManifestOutput(baseline, candidate).differences).toContain(
    'Changed metadata-contract.json'
  );
});
