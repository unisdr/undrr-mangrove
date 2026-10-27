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

// compareBuffers is ESM; call it in a child process to keep this suite CJS.
const compare = (a, b) => {
  const code = `import { compareBuffers } from ${JSON.stringify(script)};
const [a, b] = JSON.parse(process.argv[1]).map(v => Buffer.from(v, 'base64'));
process.stdout.write(compareBuffers(a, b));`;
  const args = JSON.stringify([
    Buffer.from(a).toString('base64'),
    Buffer.from(b).toString('base64'),
  ]);
  return spawnSync(
    process.execPath,
    ['--input-type=module', '-e', code, args],
    { encoding: 'utf8', cwd }
  ).stdout;
};

describe('compareBuffers', () => {
  const banner = ts => `/*!\n * Compiled on:  ${ts}\n */\nconst a = 1;\n`;

  test('identical files are the same', () => {
    expect(compare('abc', 'abc')).toBe('same');
  });

  test('a banner timestamp alone counts as timestamp-only', () => {
    expect(
      compare(
        banner('2026-09-16T20:56:14.980Z'),
        banner('2026-09-17T08:01:02.003Z')
      )
    ).toBe('timestamp');
  });

  test('a code change next to a timestamp change is still a change', () => {
    const changed = banner('2026-09-17T08:01:02.003Z').replace('= 1', '= 2');
    expect(compare(banner('2026-09-16T20:56:14.980Z'), changed)).toBe(
      'changed'
    );
  });

  test('text on the banner line after the timestamp is not hidden', () => {
    expect(
      compare(
        'Compiled on:  2026-09-16T20:56:14.980Z code()',
        'Compiled on:  2026-09-17T08:01:02.003Z other()'
      )
    ).toBe('changed');
  });

  test('binary files differing in non-UTF-8 bytes are changed', () => {
    expect(compare([0, 0x80, 1], [0, 0x81, 1])).toBe('changed');
  });

  test('files without the banner are never timestamp-only', () => {
    expect(compare('Compiled on: soon', 'Compiled on: later')).toBe('changed');
  });
});
