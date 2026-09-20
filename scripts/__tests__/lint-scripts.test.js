/**
 * Guards the lint wiring against unisdr/undrr-mangrove#1226.
 *
 * `yarn lint:js` runs ESLint with `--fix`. ESLint's flat config defaults
 * `linterOptions.reportUnusedDisableDirectives` to `warn`, and `--fix` treats
 * the removal of an unused directive as a fixable problem. Because most
 * `eslint-disable` comments in this repo name rules the config does not
 * enable, a plain `--fix` deleted them silently — leaving trailing whitespace
 * that `yarn prettier:check` rejected while `yarn lint:check` still passed.
 *
 * The contract these tests hold:
 *
 * - `lint:js` restricts `--fix` to fix types that exclude `directive`, and the
 *   behavioural test below runs ESLint with exactly the fix types that script
 *   passes, so a flag that re-admits `directive` by any route fails here.
 * - `lint:check` does not pass `--quiet`, so a stale directive is still
 *   reported to a human as a warning.
 * - CI asserts end to end that `yarn lint` leaves the working tree clean.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..', '..');

const readText = relativePath =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const packageJson = JSON.parse(readText('package.json'));
const lintJs = packageJson.scripts['lint:js'];
const lintCheck = packageJson.scripts['lint:check'];

/**
 * Every fix type the `lint:js` script passes to ESLint.
 *
 * `--fix-type` is a repeatable flag and accepts both `--fix-type a,b` and
 * `--fix-type=a,b`, so a single first-match regex is not enough: a second
 * occurrence re-admitting `directive` has to be seen too.
 *
 * @returns {string[]} the union of every value given to `--fix-type`.
 */
const parseFixTypes = script =>
  [...script.matchAll(/--fix-type(?:=|\s+)(\S+)/g)]
    .flatMap(match => match[1].split(','))
    .map(type => type.replace(/['"]/g, '').trim())
    .filter(Boolean);

// A directive naming a rule the config does not enable for this file: since
// unisdr/undrr-mangrove#1235, `no-bitwise` is on for `.jsx`, and the fixture
// below is a `.js` under scripts/, which that block does not claim. `--fix`
// without a fix-type restriction deletes this line; with one, it must not.
const FIXTURE = `const noop = () => {};
// eslint-disable-next-line no-bitwise
noop();
`;
// Under scripts/, so the flat config resolves the same way it does for the
// real files the lint scripts cover. Fed over stdin — never written to disk.
const FIXTURE_PATH = 'scripts/unused-directive.fixture.js';

// eslint's package exports do not expose its bin, so resolve it by path.
const ESLINT_BIN = path.join(
  repoRoot,
  'node_modules',
  'eslint',
  'bin',
  'eslint.js'
);

/**
 * Lints the fixture through the real ESLint CLI and returns its JSON result.
 *
 * The CLI rather than the Node API because `eslint.config.mjs` is ESM, which
 * Jest's CommonJS runtime cannot dynamically import. `--fix-dry-run` computes
 * the fix without touching the working tree.
 *
 * @param {string[]} fixTypes fix types to restrict `--fix` to; none means
 *   unrestricted, which is the behaviour this repo must not have.
 * @returns {{messages: {message: string}[], output?: string}} ESLint's result.
 */
const lintFixture = fixTypes => {
  const args = [
    ESLINT_BIN,
    '--stdin',
    '--stdin-filename',
    FIXTURE_PATH,
    '--fix-dry-run',
    '--format',
    'json',
  ];
  if (fixTypes.length) args.push('--fix-type', fixTypes.join(','));

  let stdout;
  try {
    stdout = execFileSync(process.execPath, args, {
      cwd: repoRoot,
      input: FIXTURE,
      encoding: 'utf8',
    });
  } catch (error) {
    // Expected: an unused directive is reported at `error` severity, so the
    // CLI exits non-zero. The JSON report is still on stdout, and that report
    // is the whole point of the call. Anything else is a real failure.
    if (!error.stdout) throw error;
    stdout = error.stdout;
  }
  return JSON.parse(stdout)[0];
};

describe('lint script wiring', () => {
  it('runs eslint --fix with an explicit fix-type list', () => {
    expect(lintJs).toContain('--fix');
    expect(parseFixTypes(lintJs).length).toBeGreaterThan(0);
  });

  it('omits the directive fix type so --fix cannot delete eslint-disable comments', () => {
    const fixTypes = parseFixTypes(lintJs);

    expect(fixTypes).not.toContain('directive');
    expect(fixTypes).toEqual(
      expect.arrayContaining(['problem', 'suggestion', 'layout'])
    );
  });

  it('keeps lint:check loud enough to report a stale directive', () => {
    // `--quiet` drops warnings, and an unused disable directive is reported as
    // a warning. Without this, nothing anywhere surfaces a stale suppression.
    expect(lintCheck).not.toContain('--quiet');
  });
});

describe('eslint behaviour under the lint:js fix types', () => {
  it('reports an unused directive rather than keeping quiet about it', () => {
    const result = lintFixture(parseFixTypes(lintJs));

    expect(
      result.messages.map(message => message.message).join('\n')
    ).toContain('Unused eslint-disable directive');
  });

  it('leaves the directive in place when fixing with the lint:js fix types', () => {
    const result = lintFixture(parseFixTypes(lintJs));

    // `output` is absent when nothing was fixed, which is the passing case.
    expect(result.output ?? FIXTURE).toContain(
      '// eslint-disable-next-line no-bitwise'
    );
  });

  it('is a meaningful guard: an unrestricted --fix does delete the directive', () => {
    // The negative control. If this ever stops deleting the comment, ESLint
    // changed and the test above is no longer proving anything.
    const result = lintFixture([]);

    expect(result.output).toBeDefined();
    expect(result.output).not.toContain(
      '// eslint-disable-next-line no-bitwise'
    );
  });
});

describe('eslint config', () => {
  const config = readText('eslint.config.mjs');

  it('reports unused disable directives rather than silencing them', () => {
    expect(config).toMatch(/reportUnusedDisableDirectives:\s*'(warn|error)'/);
  });

  it('enables no-control-regex, which Tree.fromElement.js suppresses', () => {
    expect(config).toMatch(/'no-control-regex':\s*'error'/);
    expect(
      readText('stories/Components/Navigation/Tree/Tree.fromElement.js')
    ).toContain('eslint-disable-next-line no-control-regex');
  });
});

describe('CI', () => {
  it('asserts that yarn lint leaves the working tree unchanged', () => {
    const workflow = readText('.github/workflows/storybook.yml');
    const lines = workflow.split('\n').map(line => line.trim());

    // `toContain('yarn run lint')` would be satisfied by the pre-existing
    // `yarn run lint:check` step, so match the fixing command on its own line.
    expect(lines).toContain('yarn run lint');
    expect(lines).toContain('yarn run prettier:check');
    expect(lines).toContain('git diff --exit-code');
  });
});
