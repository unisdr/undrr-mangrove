module.exports = {
    branches: [{name: 'main', prerelease: 'alpha'}],
    plugins: [
      '@semantic-release/commit-analyzer',
      '@semantic-release/release-notes-generator',
      '@semantic-release/changelog',
      ['@semantic-release/git', {
        assets: ['package.json', 'yarn.lock', 'CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }],
      '@semantic-release/github'
    ],
    tagFormat: 'v${version}'
  };