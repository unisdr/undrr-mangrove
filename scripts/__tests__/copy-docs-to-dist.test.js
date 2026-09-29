/** @jest-environment node */
/**
 * @file copy-docs-to-dist.test.js
 * @description Covers scripts/copy-docs-to-dist.mjs, which puts the editorial
 * manual and the llms-*.txt sub-manifests in dist/docs/ so the asset library
 * serves them (undrr/web-backlog#3109).
 *
 * The script is ESM and uses `import.meta`, so it runs as a subprocess against
 * a temporary repo root, as assemble-npm-package.test.js does.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const script = path.resolve(__dirname, '../copy-docs-to-dist.mjs');

const write = (base, rel, content = 'x') => {
  const file = path.join(base, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

const run = (args = [], env = {}) =>
  spawnSync(process.execPath, [script, ...args], {
    encoding: 'utf8',
    env: { ...process.env, MANGROVE_DOCS_BASE_URL: '', ...env },
  });

const MANUAL = `# Editorial manual for Mangrove

> Edits to this file show up on both [GitHub](https://example.org) and in [Storybook](https://example.org).

See [Writing guidelines](WRITING.md), [its tone section](WRITING.md#tone), [Writing quick reference](WRITING-SHORT.md), [Keeping this updated](#keeping-this-updated) and [the source](https://www.un.org/x.md).

## Keeping this updated
`;

let root;
let outDir;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'mangrove-docs-root-'));
  outDir = path.join(root, 'dist/docs');
  write(
    root,
    'package.json',
    JSON.stringify({ name: '@undrr/undrr-mangrove', version: '9.9.9' })
  );
  write(root, 'docs/EDITORIAL-MANUAL.md', MANUAL);
  write(root, 'docs-build-temp/llms.txt', 'index');
  write(root, 'docs-build-temp/llms.json', '{}');
  write(root, 'docs-build-temp/llms-editorial-manual.txt', 'manual');
  write(root, 'docs-build-temp/llms-page-building.txt', 'pages');
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

const readManual = () =>
  fs.readFileSync(path.join(outDir, 'EDITORIAL-MANUAL.md'), 'utf8');

test('copies the manual and every llms-*.txt, but not llms.txt or llms.json', () => {
  const result = run([`--root=${root}`]);
  expect(result.stderr).toBe('');
  expect(result.status).toBe(0);
  expect(fs.readdirSync(outDir).sort()).toEqual([
    'EDITORIAL-MANUAL.md',
    'llms-editorial-manual.txt',
    'llms-page-building.txt',
  ]);
  expect(
    fs.readFileSync(path.join(outDir, 'llms-page-building.txt'), 'utf8')
  ).toBe('pages');
});

test('starts the copy with a provenance line and drops the source banner', () => {
  expect(run([`--root=${root}`]).status).toBe(0);
  const [first, second, third] = readManual().split('\n');
  expect(first).toBe(
    '> Copy of docs/EDITORIAL-MANUAL.md from Mangrove 9.9.9, generated at build time; edit docs/EDITORIAL-MANUAL.md in unisdr/undrr-mangrove, not this file. Rendered: https://mangrove.undrr.org/?path=/docs/contributing-editorial-manual--docs'
  );
  expect(second).toBe('');
  expect(third).toBe('# Editorial manual for Mangrove');
  expect(readManual()).not.toContain('Edits to this file show up on both');
});

test('points relative .md links at Storybook, or GitHub where there is no page', () => {
  expect(run([`--root=${root}`]).status).toBe(0);
  const manual = readManual();
  expect(manual).toContain(
    '[Writing guidelines](https://mangrove.undrr.org/?path=/docs/contributing-writing-guidelines--docs)'
  );
  expect(manual).toContain(
    '[its tone section](https://mangrove.undrr.org/?path=/docs/contributing-writing-guidelines--docs#tone)'
  );
  expect(manual).toContain(
    '[Writing quick reference](https://github.com/unisdr/undrr-mangrove/blob/main/docs/WRITING-SHORT.md)'
  );
  expect(manual).toContain('[Keeping this updated](#keeping-this-updated)');
  expect(manual).toContain('[the source](https://www.un.org/x.md)');
});

test('honours --docs-base, then MANGROVE_DOCS_BASE_URL', () => {
  expect(
    run([`--root=${root}`], {
      MANGROVE_DOCS_BASE_URL: 'https://preview.example.org/sb',
    }).status
  ).toBe(0);
  expect(readManual()).toContain(
    '](https://preview.example.org/sb/?path=/docs/contributing-writing-guidelines--docs)'
  );

  expect(
    run([`--root=${root}`, '--docs-base=https://other.example.org/'], {
      MANGROVE_DOCS_BASE_URL: 'https://preview.example.org/sb',
    }).status
  ).toBe(0);
  expect(readManual()).toContain('](https://other.example.org/?path=/docs/');
});

test('reads sub-manifests from --build-dir', () => {
  fs.renameSync(
    path.join(root, 'docs-build-temp'),
    path.join(root, 'storybook-out')
  );
  expect(run([`--root=${root}`, '--build-dir=storybook-out']).status).toBe(0);
  expect(fs.existsSync(path.join(outDir, 'llms-editorial-manual.txt'))).toBe(
    true
  );
});

test('replaces dist/docs/, so a removed sub-manifest does not linger', () => {
  write(root, 'dist/docs/llms-retired.txt', 'old');
  write(root, 'dist/components/Keep.js', 'keep');
  expect(run([`--root=${root}`]).status).toBe(0);
  expect(fs.existsSync(path.join(outDir, 'llms-retired.txt'))).toBe(false);
  expect(fs.existsSync(path.join(root, 'dist/components/Keep.js'))).toBe(true);
});

test('fails when the manifest step has not produced the editorial sub-manifest', () => {
  fs.rmSync(path.join(root, 'docs-build-temp/llms-editorial-manual.txt'));
  const result = run([`--root=${root}`]);
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/llms-editorial-manual\.txt not found/);
  expect(fs.existsSync(outDir)).toBe(false);
});

test('fails without a build directory', () => {
  fs.rmSync(path.join(root, 'docs-build-temp'), { recursive: true });
  const result = run([`--root=${root}`]);
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/No build directory/);
});

test('rejects unknown arguments', () => {
  const result = run([`--root=${root}`, '--nope=1']);
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/Unknown argument/);
});
