/** @jest-environment node */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const script = path.resolve(__dirname, '../assemble-npm-package.mjs');

const write = (base, rel, content = 'x') => {
  const file = path.join(base, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

const listFiles = dir =>
  fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry =>
      path
        .relative(dir, path.join(entry.parentPath, entry.name))
        .split(path.sep)
        .join('/')
    )
    .sort();

const run = (...args) =>
  spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });

let root;
let out;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'mangrove-assemble-root-'));
  out = fs.mkdtempSync(path.join(os.tmpdir(), 'mangrove-assemble-out-'));
  write(
    root,
    'package.json',
    JSON.stringify({
      name: '@undrr/undrr-mangrove',
      version: '9.9.9-test.1',
      description: 'Test package',
      type: 'module',
      scripts: { build: 'noop' },
      devDependencies: { jest: '1.0.0' },
      repository: { type: 'git', url: 'https://example.org/repo.git' },
      keywords: ['a'],
      author: 'UNDRR',
      license: 'Apache-2.0',
    })
  );
  write(root, 'README.md', '# readme');
  write(root, 'LICENSE', 'license');
  write(root, 'dist/index.js');
  write(root, 'dist/.hidden');
  write(root, 'dist/assets/js/tabs.js');
  write(root, 'dist/assets/css/style.css');
  write(root, 'dist/assets/css/.hidden');
  write(root, 'dist/assets/error-pages/404.html');
  write(root, 'dist/assets/images/logo.png');
  write(root, 'dist/fonts/mangrove-icon-set.woff2');
  write(root, 'dist/components/MegaMenu.js');
  write(root, 'dist/components/nested/Thing.js');
  write(root, 'stories/assets/scss/style.scss');
  write(root, 'stories/Components/Tabs/tabs.scss');
  write(root, 'stories/Components/Tabs/Tabs.jsx');
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
  fs.rmSync(out, { recursive: true, force: true });
});

test('copies dist subpaths and SCSS sources into the CI layout', () => {
  write(out, 'stale.txt');
  const result = run(out, '--root', root);
  expect(result.status).toBe(0);

  const files = listFiles(out);
  expect(files).toEqual(
    [
      'LICENSE',
      'README.md',
      'components/MegaMenu.js',
      'components/nested/Thing.js',
      'css/style.css',
      'dist/assets/css/.hidden',
      'dist/assets/css/style.css',
      'dist/assets/error-pages/404.html',
      'dist/assets/images/logo.png',
      'dist/assets/js/tabs.js',
      'dist/components/MegaMenu.js',
      'dist/components/nested/Thing.js',
      'dist/fonts/mangrove-icon-set.woff2',
      'dist/index.js',
      'error-pages/404.html',
      'fonts/mangrove-icon-set.woff2',
      'js/tabs.js',
      'package.json',
      'scss/Components/Tabs/tabs.scss',
      'scss/assets/scss/style.scss',
    ].sort()
  );
});

test('generates the slimmed package.json', () => {
  expect(run(out, '--root', root).status).toBe(0);
  const pkg = JSON.parse(fs.readFileSync(path.join(out, 'package.json')));
  expect(pkg).toEqual({
    name: '@undrr/undrr-mangrove',
    version: '9.9.9-test.1',
    description: 'Test package',
    main: 'dist/index.js',
    files: [
      'components/**/*',
      'css/**/*',
      'js/**/*',
      'scss/**/*.scss',
      'error-pages/**/*',
      'fonts/**/*',
    ],
    repository: { type: 'git', url: 'https://example.org/repo.git' },
    keywords: ['a'],
    author: 'UNDRR',
    license: 'Apache-2.0',
  });
  expect(Object.keys(pkg)).toEqual([
    'name',
    'version',
    'description',
    'main',
    'files',
    'repository',
    'keywords',
    'author',
    'license',
  ]);
});

test('skips optional directories that are not in dist', () => {
  fs.rmSync(path.join(root, 'dist/fonts'), { recursive: true });
  fs.rmSync(path.join(root, 'dist/assets/error-pages'), { recursive: true });
  expect(run(out, '--root', root).status).toBe(0);
  expect(fs.existsSync(path.join(out, 'fonts'))).toBe(false);
  expect(fs.existsSync(path.join(out, 'error-pages'))).toBe(false);
  expect(fs.existsSync(path.join(out, 'css/style.css'))).toBe(true);
});

test('fails with a build hint when dist is missing', () => {
  fs.rmSync(path.join(root, 'dist'), { recursive: true });
  const result = run(out, '--root', root);
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/yarn build/);
});

test('refuses to use the repo root as the output directory', () => {
  const result = run(root, '--root', root);
  expect(result.status).toBe(1);
  expect(fs.existsSync(path.join(root, 'package.json'))).toBe(true);
});
