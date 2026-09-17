/**
 * @file docs-links.test.js
 * @description Guards the internal Storybook links in Markdown and MDX documentation.
 *
 * Two failure modes this catches:
 *
 * 1. A link points at a story id that no longer exists. Renaming a `title`
 *    silently renames every id derived from it, and nothing else in the build
 *    fails when a doc still references the old one.
 * 2. A link uses a relative path to a repository file (`../../../docs/X.md`)
 *    or a host-absolute Storybook path (`/docs/x--docs`). Neither resolves in
 *    a built Storybook, so both 404 on https://mangrove.undrr.org/.
 */

const fs = require('fs');
const path = require('path');

/**
 * Storybook's own title-to-id transform, inlined because
 * `storybook/internal/csf` ships as ESM and this suite runs under CommonJS.
 * Keep in sync with `sanitize()` in @storybook/csf.
 */
function sanitize(string) {
  return string
    .toLowerCase()
    .replace(/[ ’–—―′¿'`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function toId(title, name) {
  return `${sanitize(title)}--${sanitize(name)}`;
}

const repoRoot = path.resolve(__dirname, '..', '..');
const storiesDir = path.join(repoRoot, 'stories');
const docsDir = path.join(repoRoot, 'docs');

/** Ids referenced in docs that are deliberate placeholders, not real pages. */
const PLACEHOLDER_IDS = new Set([
  'components-category-newcomponent--docs',
  'getting-started-release-notes-vX-Y--docs',
]);

function walk(dir, extensions) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') return [];
      return walk(full, extensions);
    }
    return extensions.some(ext => entry.name.endsWith(ext)) ? [full] : [];
  });
}

/** Every Storybook title declared by a story file or a standalone MDX page. */
function collectTitles() {
  const titles = new Set();

  for (const file of walk(storiesDir, [
    '.stories.js',
    '.stories.jsx',
    '.stories.ts',
    '.stories.tsx',
  ])) {
    const source = fs.readFileSync(file, 'utf8');
    // The meta title sits at the top level of the default export. Sample data
    // in the same file can share that indentation, so take every candidate:
    // a title that is never referenced costs nothing, a missing one would
    // fail a link that is in fact valid.
    const matches = source.matchAll(/^ {2}title:\s*(['"`])([^'"`]+)\1/gm);
    for (const match of matches) titles.add(match[2]);
  }

  for (const file of walk(storiesDir, ['.mdx'])) {
    const source = fs.readFileSync(file, 'utf8');
    const match = source.match(/<Meta[\s\S]*?title=(['"])([^'"]+)\1/);
    if (match) titles.add(match[2]);
  }

  return titles;
}

function collectDocFiles() {
  return [...walk(storiesDir, ['.mdx', '.md']), ...walk(docsDir, ['.md'])];
}

const validDocsIds = new Set(
  [...collectTitles()].map(title => toId(title, 'docs'))
);

const docFiles = collectDocFiles();

describe('documentation links', () => {
  it('finds Storybook titles to check against', () => {
    expect(validDocsIds.size).toBeGreaterThan(50);
  });

  it('references only story ids that exist', () => {
    const broken = [];

    for (const file of docFiles) {
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, index) => {
        const matches = line.matchAll(/\/docs\/([A-Za-z0-9_-]+--docs)/g);
        for (const match of matches) {
          const id = match[1];
          if (PLACEHOLDER_IDS.has(id)) continue;
          if (validDocsIds.has(id)) continue;
          broken.push(`${path.relative(repoRoot, file)}:${index + 1} -> ${id}`);
        }
      });
    }

    expect(broken).toEqual([]);
  });

  it('does not link Storybook pages by a path that 404s when built', () => {
    const offenders = [];

    for (const file of docFiles) {
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, index) => {
        const location = `${path.relative(repoRoot, file)}:${index + 1}`;
        // Host-absolute Storybook path: only `?path=/docs/…` is a real route.
        if (/\]\(\/docs\/[A-Za-z0-9_-]+--docs/.test(line)) {
          offenders.push(`${location} -> use ?path=/docs/… instead`);
        }
        // Relative link from an MDX page to a repository Markdown file.
        if (
          file.endsWith('.mdx') &&
          /\]\((?:\.\.\/)+[^)]*\.md[)#]/.test(line)
        ) {
          offenders.push(
            `${location} -> link the published page, not the file`
          );
        }
      });
    }

    expect(offenders).toEqual([]);
  });
});
