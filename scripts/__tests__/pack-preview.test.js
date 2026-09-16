/** @jest-environment node */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const script = path.resolve(__dirname, '../pack-preview.mjs');

// Argument errors are raised before anything is assembled or downloaded.
// Run from an empty temp dir so a regression cannot touch the repo.
let cwd;
beforeEach(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'mangrove-pack-preview-'));
});
afterEach(() => {
  fs.rmSync(cwd, { recursive: true, force: true });
});

const run = (...args) =>
  spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', cwd });

test.each([
  [['--compare']],
  [['--compare', '--foo']],
  [['--compare', '-1.0.0']],
  [['--compare=']],
  [['--compare=-x']],
])('rejects %j as a --compare value', args => {
  const result = run(...args);
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/--compare needs a version/);
  expect(fs.readdirSync(cwd)).toEqual([]);
});

test('rejects unknown flags', () => {
  const result = run('--foo');
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/Unknown argument: --foo/);
});
