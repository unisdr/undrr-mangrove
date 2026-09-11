#!/usr/bin/env node
/**
 * Points git at the checked-in `githooks/` directory so the commit-msg hook
 * (Conventional Commits + no AI/bot attribution) runs for every contributor.
 *
 * Wired to the package.json "prepare" script, so it runs automatically on
 * `yarn install`. It is deliberately a no-op when there is no local git repo
 * or no githooks/ directory — e.g. when this package is installed as a
 * dependency from a tarball — so it never breaks a consumer's install.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function quietGit(args) {
  return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
}

try {
  // Only proceed inside a real git working tree...
  if (quietGit('rev-parse --is-inside-work-tree') !== 'true') process.exit(0);

  // ...and only for THIS repo (not a parent repo we happen to be nested in).
  const top = quietGit('rev-parse --show-toplevel');
  const here = path.resolve(__dirname, '..');
  const hooksDir = path.join(here, 'githooks');
  if (path.resolve(top) !== here) process.exit(0);
  if (!fs.existsSync(path.join(hooksDir, 'commit-msg'))) process.exit(0);

  execSync('git config core.hooksPath githooks', { stdio: 'ignore' });
  // eslint-disable-next-line no-console
  console.log('git hooks installed: core.hooksPath -> githooks');
} catch {
  // No git, detached environment, or restricted config — silently skip.
  process.exit(0);
}
