/** @jest-environment node */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const script = path.resolve(__dirname, '../update-cdn-version.js');
const target = '2.0.0-alpha.4';
const old = '2.0.0-alpha.3';
const url = (version, prefix = 'static/mangrove') =>
  `https://assets.undrr.org/${prefix}/${version}/css/style.css`;
let root;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'mangrove-cdn-test-'));
  fs.mkdirSync(path.join(root, 'docs'));
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ version: target })
  );
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

it('updates prerelease and stable CDN links while preserving historical releases', () => {
  fs.writeFileSync(
    path.join(root, 'README.md'),
    [
      url(old),
      url('1.8.2'),
      url(old, 'static/testing/mangrove'),
      url(old, 'testing/static/mangrove'),
    ].join('\n')
  );
  fs.writeFileSync(path.join(root, 'docs/RELEASE-1.8.md'), url('1.8.2'));
  fs.writeFileSync(path.join(root, 'docs/RELEASE-2.0.md'), url(old));
  execFileSync(process.execPath, [script, `--root=${root}`]);
  expect(fs.readFileSync(path.join(root, 'README.md'), 'utf8')).toBe(
    Array(4).fill(url(target)).join('\n')
  );
  expect(fs.readFileSync(path.join(root, 'docs/RELEASE-1.8.md'), 'utf8')).toBe(
    url('1.8.2')
  );
  expect(fs.readFileSync(path.join(root, 'docs/RELEASE-2.0.md'), 'utf8')).toBe(
    url(target)
  );
});

it('keeps dry runs read-only and supports prerelease testing URLs', () => {
  const file = path.join(root, 'README.md');
  fs.writeFileSync(file, url(old));
  execFileSync(process.execPath, [script, `--root=${root}`, '--dry-run']);
  expect(fs.readFileSync(file, 'utf8')).toBe(url(old));
  execFileSync(process.execPath, [script, `--root=${root}`, '--testing']);
  expect(fs.readFileSync(file, 'utf8')).toBe(
    url(target, 'static/testing/mangrove')
  );
});
