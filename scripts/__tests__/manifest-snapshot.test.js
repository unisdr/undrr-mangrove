/** @jest-environment node */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { compareManifestOutput } from '../ai-manifest/output-parity';

let root;
let build;
const write = (filename, value) => {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(
    filename,
    typeof value === 'string' ? value : JSON.stringify(value)
  );
};
const snapshot = (destination, generator) =>
  spawnSync(
    process.execPath,
    [
      'scripts/ai-manifest/snapshot-manifest-output.mjs',
      destination,
      `--build-dir=${build}`,
      `--generator=${generator}`,
    ],
    { encoding: 'utf8' }
  );
const generator = (name, omitted = [], before = '') => {
  const filename = path.join(root, `${name}.mjs`);
  write(
    filename,
    `import fs from 'node:fs'; import path from 'node:path';
const output = process.argv.find(arg => arg.startsWith('--build-dir=')).slice(12);
if (process.argv.includes('--validate')) { console.log('Validated'); process.exit(0); }
${before}
const files = ${JSON.stringify({
      'ai-components/index.json': {
        generatedAt: '2026-10-26T12:00:00Z',
        components: [{ id: 'example' }],
      },
      'ai-components/example.json': { name: 'Example' },
      'llms.txt': 'Example guidance',
      'llms.json': { generatedAt: '2026-10-26T12:00:00Z' },
      'tokens.json': {
        generatedAt: '2026-10-26T12:00:00Z',
        tokens: ['important'],
      },
      'releases.json': { generatedAt: '2026-10-26T12:00:00Z' },
      'content-patterns.json': {},
    })};
for (const [name, value] of Object.entries(files)) {
 if (${JSON.stringify(omitted)}.includes(name)) continue;
 const target = path.join(output,name); fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target, typeof value === 'string' ? value : JSON.stringify(value));
}
`
  );
  return filename;
};
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-snapshot-test-'));
  build = path.join(root, 'build');
  write(path.join(build, 'index.json'), { entries: {} });
  write(path.join(build, 'manifests/components.json'), {
    v: 0,
    components: {
      example: {
        id: 'example',
        name: 'Example',
        path: './stories/Example.stories.jsx',
      },
    },
  });
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

it('does not inherit stale output when a candidate stops generating a file', () => {
  const baseline = path.join(root, 'baseline');
  const candidate = path.join(root, 'candidate');
  expect(snapshot(baseline, generator('complete')).status).toBe(0);
  // Simulate the original snapshot's reused build tree holding baseline output.
  fs.cpSync(baseline, build, { recursive: true });
  expect(
    snapshot(candidate, generator('omitted', ['tokens.json'])).status
  ).toBe(0);
  expect(fs.existsSync(path.join(candidate, 'tokens.json'))).toBe(false);
  expect(compareManifestOutput(baseline, candidate).differences).toContain(
    'Candidate missing required tokens.json'
  );
  expect(
    JSON.parse(fs.readFileSync(path.join(build, 'tokens.json'))).tokens
  ).toEqual(['important']);
});

it('does not overwrite a destination created while the generator is running', () => {
  const destination = path.join(root, 'raced');
  const before = `fs.mkdirSync(${JSON.stringify(destination)}); fs.writeFileSync(path.join(${JSON.stringify(destination)}, 'sentinel'), 'preserved');`;
  const result = snapshot(destination, generator('race', [], before));
  expect(result.status).not.toBe(0);
  expect(fs.readdirSync(destination)).toEqual(['sentinel']);
  expect(fs.readFileSync(path.join(destination, 'sentinel'), 'utf8')).toBe(
    'preserved'
  );
});
