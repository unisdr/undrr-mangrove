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
 * - `lint:js` restricts `--fix` to fix types that exclude `directive`.
 * - `lint:check` does not pass `--quiet`, so a stale directive is still
 *   reported to a human as a warning.
 * - CI asserts end to end that `yarn lint` leaves the working tree clean.
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');

const readText = relativePath =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const packageJson = JSON.parse(readText('package.json'));

describe('lint script wiring', () => {
  const lintJs = packageJson.scripts['lint:js'];
  const lintCheck = packageJson.scripts['lint:check'];

  it('runs eslint --fix with an explicit fix-type list', () => {
    expect(lintJs).toContain('--fix');
    expect(lintJs).toMatch(/--fix-type\s+\S+/);
  });

  it('omits the directive fix type so --fix cannot delete eslint-disable comments', () => {
    const fixTypes = lintJs
      .match(/--fix-type\s+(\S+)/)[1]
      .split(',')
      .map(type => type.trim());

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

    expect(workflow).toContain('yarn run lint');
    expect(workflow).toContain('git diff --exit-code');
  });
});
