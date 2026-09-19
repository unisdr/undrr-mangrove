/**
 * Guards lint coverage against unisdr/undrr-mangrove#1235 and #1241.
 *
 * ESLint says nothing useful about a file no config claims. It is not an
 * error, and unless the file is named on the command line there is not even a
 * warning — `yarn lint:check` walks past it and exits 0. Plain `.jsx` sat in
 * that blind spot for the life of the library: 205 component files, every rule
 * the config enables applying to none of them. `src/` sat in a second one, a
 * whole directory that no lint or format script passed to either tool.
 *
 * The contract these tests hold:
 *
 * - `scripts/check-lint-coverage.mjs` passes on the current tree.
 * - It runs as part of `lint:check`, so CI fails on a new blind spot.
 * - The lint and format scripts cover `src` as well as `stories` and
 *   `scripts`.
 * - The signal it reads is real: a config without a `.jsx` pattern does leave
 *   component files unmatched.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..', '..');

const readText = relativePath =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const packageJson = JSON.parse(readText('package.json'));

// A component file, not a story file: the whole point of #1235 is that the two
// were treated differently.
const COMPONENT_FILE = 'stories/Components/Cards/Card/VerticalCard.jsx';

// eslint's package exports do not expose its bin, so resolve it by path.
const ESLINT_BIN = path.join(
  repoRoot,
  'node_modules',
  'eslint',
  'bin',
  'eslint.js'
);

/**
 * Ask the ESLint CLI what configuration a file resolves to.
 *
 * The CLI rather than the Node API because the flat config is ESM, which Jest
 * cannot dynamically import without --experimental-vm-modules. It also matches
 * the command in the issue reports.
 *
 * @param {string} file relative path to ask about.
 * @param {string} [configFile] a config to use instead of the repo's own.
 * @returns {string} what `--print-config` printed: JSON, or `undefined`.
 */
const printConfig = (file, configFile) =>
  execFileSync(
    process.execPath,
    [
      ESLINT_BIN,
      ...(configFile ? ['--config', configFile] : []),
      '--print-config',
      file,
    ],
    { cwd: repoRoot, encoding: 'utf8' }
  );

describe('the lint coverage guard', () => {
  it('passes on the current tree', () => {
    // Throws on a non-zero exit, which is the failure this asserts against.
    const output = execFileSync(
      process.execPath,
      ['scripts/check-lint-coverage.mjs'],
      { cwd: repoRoot, encoding: 'utf8' }
    );

    expect(output).toContain('all match an ESLint configuration');
  }, 60000);

  it('runs as part of lint:check', () => {
    expect(packageJson.scripts['lint:check']).toContain('lint:coverage');
  });
});

describe('the lint and format scripts', () => {
  const sourceDirectories = ['src', 'stories', 'scripts'];

  it.each(sourceDirectories)('lint:check covers %s', directory => {
    expect(packageJson.scripts['lint:check']).toContain(`./${directory}`);
  });

  it.each(sourceDirectories)('lint:js covers %s', directory => {
    expect(packageJson.scripts['lint:js']).toContain(`./${directory}`);
  });

  it('prettier:check covers all three', () => {
    // A brace list, so assert on the set rather than the spelling.
    const glob = packageJson.scripts['prettier:check'];
    const braced = glob.match(/\{([^}]+)\}\/\*\*/);

    expect(braced).not.toBeNull();
    expect(braced[1].split(',').sort()).toEqual(sourceDirectories.sort());
  });
});

describe('the eslint config', () => {
  it('claims component .jsx, not only story .jsx', () => {
    expect(readText('eslint.config.mjs')).toMatch(/'\*\*\/\*\.jsx'/);
  });

  it('matches a component file rather than leaving it unclaimed', () => {
    expect(printConfig(COMPONENT_FILE)).toContain('"rules"');
  });

  it('is a meaningful guard: without a .jsx pattern the file is unmatched', () => {
    // The negative control. A config that claims no `.jsx` prints `undefined`
    // for a component file — the exact signal check-lint-coverage.mjs reads.
    // If ESLint ever stopped reporting it this way, the guard would pass on a
    // tree it should fail.
    const configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mangrove-lint-'));
    const configPath = path.join(configDir, 'eslint.config.mjs');
    fs.writeFileSync(
      configPath,
      "export default [{ files: ['**/*.js'], rules: {} }];\n"
    );

    try {
      expect(printConfig(COMPONENT_FILE, configPath).trim()).toBe('undefined');
    } finally {
      fs.rmSync(configDir, { recursive: true, force: true });
    }
  });
});
