#!/usr/bin/env node
/** Prepare an exact-base review patch without changing a branch or real index. */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../../..');
const output = path.resolve(process.argv[2] || '');
if (!process.argv[2] || fs.existsSync(output))
  throw new Error('Supply a new output directory outside the repository.');
if (output === ROOT || output.startsWith(`${ROOT}${path.sep}`))
  throw new Error('Review output must stay outside the repository.');
const git = args => execFileSync('git', args, { cwd: ROOT });
const source = git(['rev-parse', 'HEAD']).toString().trim();
const scope = JSON.parse(
  git(['show', `${source}:examples/figma-plugin/maintenance-merge-scope.json`])
);
fs.mkdirSync(output, { recursive: true });
const checkout = path.join(output, 'reduced-checkout');
fs.mkdirSync(checkout);
const archive = path.join(output, 'base.tar');
git(['archive', `--output=${archive}`, scope.baseCommit]);
execFileSync('tar', ['-xf', archive, '-C', checkout]);
fs.unlinkSync(archive);
for (const file of scope.files) {
  const target = path.join(checkout, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  // Pin overlay bytes to the recorded commit, never uncommitted working files.
  fs.writeFileSync(target, git(['show', `${source}:${file}`]));
}
const packagePath = path.join(checkout, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath));
Object.assign(pkg.scripts, scope.packageEdits.scripts);
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
fs.appendFileSync(
  path.join(checkout, '.gitignore'),
  `\n# Generated Figma maintenance assets\n${scope.ignorePaths.join('\n')}\n`
);
const lockPath = path.join(checkout, 'yarn.lock');
const lock = fs.readFileSync(lockPath, 'utf8');
const workspace = /("@undrr\/undrr-mangrove@workspace:\.":\n[\s\S]*?)(?=\n\S)/;
const match = lock.match(workspace);
if (!match) throw new Error('Base workspace lockfile entry missing.');
const oldPeers =
  '  peerDependencies:\n    react: ">=18.0.0"\n    react-dom: ">=18.0.0"\n';
if (!match[1].includes(oldPeers) || match[1].includes('peerDependenciesMeta:'))
  throw new Error('Base peer metadata changed; review the manifest again.');
const peers = oldPeers.replace(
  '    react-dom:',
  '    react-aria-components: ^1.20.0\n    react-dom:'
);
const metadata =
  '  peerDependenciesMeta:\n    react:\n      optional: true\n    react-aria-components:\n      optional: true\n    react-dom:\n      optional: true\n';
fs.writeFileSync(
  lockPath,
  lock.replace(match[1], match[1].replace(oldPeers, peers + metadata))
);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mangrove-review-index-'));
const env = { ...process.env, GIT_INDEX_FILE: path.join(temp, 'index') };
const isolatedGit = args => execFileSync('git', args, { cwd: ROOT, env });
try {
  isolatedGit(['read-tree', scope.baseCommit]);
  isolatedGit([
    '--work-tree',
    checkout,
    'add',
    '--',
    ...scope.files,
    'package.json',
    '.gitignore',
    'yarn.lock',
  ]);
  const patch = isolatedGit(['diff', '--cached', '--binary', scope.baseCommit]);
  fs.writeFileSync(path.join(output, 'maintenance-review.patch'), patch);
  fs.writeFileSync(
    path.join(output, 'diff-stat.txt'),
    isolatedGit(['diff', '--cached', '--stat', scope.baseCommit])
  );
  fs.writeFileSync(
    path.join(output, 'changed-files.txt'),
    isolatedGit(['diff', '--cached', '--name-only', scope.baseCommit])
  );
  fs.writeFileSync(
    path.join(output, 'review-manifest.json'),
    `${JSON.stringify(
      {
        sourceCommit: source,
        baseCommit: scope.baseCommit,
        baseBranch: scope.baseBranch,
        status:
          'Prepared for review; not accepted or applied to the feature branch',
        overlayFiles: scope.files,
        editedBaseFiles: ['package.json', '.gitignore', 'yarn.lock'],
        verificationCommands: scope.verification,
      },
      null,
      2
    )}\n`
  );
} finally {
  fs.rmSync(temp, { recursive: true });
}
console.log(`Prepared review patch and isolated checkout: ${output}`);
