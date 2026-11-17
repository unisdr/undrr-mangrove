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
  write(directory, 'navigation-index.json', {
    v: 5,
    entries: {
      'example--default': { id: 'example--default' },
      'standalone--docs': { id: 'standalone--docs' },
    },
  });
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

it('detects new root artefacts and nested component guidance rather than silently omitting them', () => {
  write(candidate, 'new-guidance.json', { content: 'new' });
  write(candidate, 'ai-components/examples/example.html', '<p>New example</p>');
  expect(compareManifestOutput(baseline, candidate).differences).toEqual(
    expect.arrayContaining([
      'Added new-guidance.json',
      'Added ai-components/examples/example.html',
    ])
  );
});

it('cannot accept matching snapshots that both omit a metadata component file', () => {
  for (const directory of [baseline, candidate])
    fs.unlinkSync(path.join(directory, 'ai-components/example.json'));
  expect(compareManifestOutput(baseline, candidate).differences).toEqual(
    expect.arrayContaining([
      'Baseline missing component output ai-components/example.json',
      'Candidate missing component output ai-components/example.json',
    ])
  );
});

it('compares unknown generated binary files byte-for-byte', () => {
  fs.writeFileSync(path.join(baseline, 'example.bin'), Buffer.from([0x80]));
  fs.writeFileSync(path.join(candidate, 'example.bin'), Buffer.from([0x81]));
  expect(compareManifestOutput(baseline, candidate).differences).toContain(
    'Changed example.bin'
  );
});

it('detects dropped navigation entries even when no published component references them', () => {
  const filename = path.join(candidate, 'navigation-index.json');
  const navigation = JSON.parse(fs.readFileSync(filename));
  delete navigation.entries['standalone--docs'];
  fs.writeFileSync(filename, JSON.stringify(navigation));
  expect(compareManifestOutput(baseline, candidate).differences).toContain(
    'Changed navigation-index.json'
  );
});
