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

const PREVIOUS_BUILD_PACKAGE = JSON.stringify({
  name: '@undrr/undrr-mangrove',
  version: '9.9.8',
});

let root;
let out;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'mangrove-assemble-root-'));
  out = path.join(root, 'npm-package');
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
});

test('copies dist subpaths and SCSS sources into the CI layout', () => {
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

test('fails like `cp -r dir/*` when a source directory is empty', () => {
  fs.rmSync(path.join(root, 'dist/fonts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'dist/fonts'));
  const result = run(out, '--root', root);
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/no files to copy/);
});

test('defaults to npm-package inside the root', () => {
  expect(run('--root', root).status).toBe(0);
  expect(fs.existsSync(path.join(root, 'npm-package/package.json'))).toBe(true);
});

test('clears a previous package build', () => {
  write(out, 'package.json', PREVIOUS_BUILD_PACKAGE);
  write(out, 'stale.txt');
  write(out, 'components/Old.js');
  expect(run(out, '--root', root).status).toBe(0);
  expect(fs.existsSync(path.join(out, 'stale.txt'))).toBe(false);
  expect(fs.existsSync(path.join(out, 'components/Old.js'))).toBe(false);
  expect(fs.existsSync(path.join(out, 'components/MegaMenu.js'))).toBe(true);
});

describe('output directory guard', () => {
  let sentinelParent;
  beforeEach(() => {
    // A throwaway parent so `..` points somewhere disposable, never a real
    // directory, even if the guard were broken.
    sentinelParent = fs.mkdtempSync(
      path.join(os.tmpdir(), 'mangrove-assemble-parent-')
    );
    const nestedRoot = path.join(sentinelParent, 'repo');
    fs.cpSync(root, nestedRoot, { recursive: true });
    fs.rmSync(root, { recursive: true, force: true });
    root = nestedRoot;
    out = path.join(root, 'npm-package');
    write(sentinelParent, 'keep.txt');
    write(root, '.git/HEAD', 'ref: refs/heads/main');
    write(root, 'src/index.js');
  });
  afterEach(() => {
    fs.rmSync(sentinelParent, { recursive: true, force: true });
  });

  const snapshot = () => listFiles(sentinelParent);

  // Checked with the guard alone, so a broken guard can never reach the
  // delete for a directory this test does not own.
  test.each([
    ['the filesystem root', () => path.parse(root).root],
    ['a doubled filesystem root', () => '//'],
    ['a directory outside the root', () => os.tmpdir()],
  ])('guard refuses %s', (label, target) => {
    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import path from 'node:path';
        import { assertSafeOutDir } from ${JSON.stringify(script)};
        const [root, target] = process.argv.slice(1);
        assertSafeOutDir(root, path.resolve(root, target));`,
        root,
        target(),
      ],
      { encoding: 'utf8' }
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Refusing to use/);
  });

  test.each([
    ['the repo root', () => root],
    ['. (relative to the root)', () => '.'],
    ['.. (relative to the root)', () => '..'],
    ['the parent directory', () => sentinelParent],
    ['stories', () => 'stories'],
    ['a directory nested in stories', () => 'stories/Components'],
    ['.git', () => '.git'],
    ['src', () => 'src'],
    ['dist', () => 'dist'],
    ['DIST (case variant)', () => 'DIST'],
  ])('refuses %s', (label, target) => {
    const before = snapshot();
    const result = spawnSync(
      process.execPath,
      [script, target(), '--root', root],
      { encoding: 'utf8', cwd: root }
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Refusing to use/);
    expect(snapshot()).toEqual(before);
  });

  test('refuses a non-empty directory that is not a package build', () => {
    write(root, 'notes/important.txt');
    const before = snapshot();
    const result = run('notes', '--root', root);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/not a previous/);
    expect(snapshot()).toEqual(before);
  });

  test('refuses a package build that contains .git', () => {
    write(out, 'package.json', PREVIOUS_BUILD_PACKAGE);
    write(out, '.git/HEAD');
    const before = snapshot();
    expect(run(out, '--root', root).status).toBe(1);
    expect(snapshot()).toEqual(before);
  });

  test('refuses a symlink that points at the repo root', () => {
    fs.symlinkSync(root, path.join(root, 'link'));
    const before = snapshot();
    expect(run('link', '--root', root).status).toBe(1);
    expect(snapshot()).toEqual(before);
  });
});

test.each([[['--root']], [['--root=']], [['--root', '--foo']]])(
  'rejects %j as a --root value',
  args => {
    const result = spawnSync(process.execPath, [script, ...args], {
      encoding: 'utf8',
      cwd: os.tmpdir(),
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/--root needs a directory path/);
  }
);
