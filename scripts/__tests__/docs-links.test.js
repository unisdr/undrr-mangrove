/**
 * @file docs-links.test.js
 * @description Guards the internal Storybook links in Markdown and MDX documentation.
 *
 * Three failure modes this catches:
 *
 * 1. A link points at a story id that no longer exists. Renaming a `title`
 *    silently renames every id derived from it, and nothing else in the build
 *    fails when a doc still references the old one. This covers both link
 *    mechanisms: a Markdown `?path=/docs/…--docs` link and the `kind` of a
 *    `<LinkTo>`, which the manager resolves through the same `sanitize()`.
 * 2. An MDX page uses a relative path to a repository file
 *    (`../../../docs/X.md`) or a host-absolute Storybook path
 *    (`/docs/x--docs`). Neither resolves in a built Storybook, so both 404 on
 *    https://mangrove.undrr.org/.
 * 3. A guide under `docs/` loses the rewrite that makes its own relative links
 *    work. Those files are read on GitHub as well as in Storybook, so they
 *    keep `[Testing](TESTING.md)` — the correct link for a GitHub reader and a
 *    404 in Storybook. Rule 2 therefore does not apply to them. Instead the
 *    wrappers in `stories/Documentation/` pass the raw Markdown through
 *    `linkDocsPages()` (`stories/Documentation/docsPageLinks.js`), and the
 *    checks below verify that every wrapper still does, that its id map still
 *    matches the wrappers' own titles, and that nothing unroutable survives
 *    the rewrite.
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
const docsPagesDir = path.join(storiesDir, 'Documentation');

const {
  DOC_PAGE_IDS,
  linkDocsPages,
} = require('../../stories/Documentation/docsPageLinks');

/** Ids referenced in docs that are deliberate placeholders, not real pages. */
const PLACEHOLDER_IDS = new Set([
  'components-category-newcomponent--docs',
  'getting-started-release-notes-vX-Y--docs',
]);

/** `kind` values that are prose examples of the syntax, not real targets. */
const PLACEHOLDER_KINDS = new Set(['...', 'components-category-newcomponent']);

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

const titles = collectTitles();
const validDocsIds = new Set([...titles].map(title => toId(title, 'docs')));
/** The `kind` half of a story id: what `<LinkTo kind="…">` has to match. */
const validKinds = new Set([...titles].map(sanitize));

const docFiles = collectDocFiles();

/**
 * Every guide rendered as a Storybook page, as
 * `{ wrapper, source, title }` — `source` repo-relative, e.g. `docs/TESTING.md`.
 */
function collectRenderedGuides() {
  return fs
    .readdirSync(docsPagesDir)
    .filter(name => name.endsWith('.mdx'))
    .map(name => {
      const file = path.join(docsPagesDir, name);
      const contents = fs.readFileSync(file, 'utf8');
      const imported = contents.match(/from\s+'([^']+\.md)\?raw'/);
      if (!imported) return null;

      const meta = contents.match(/<Meta[\s\S]*?title=(['"])([^'"]+)\1/);
      return {
        wrapper: name,
        contents,
        source: path
          .relative(repoRoot, path.resolve(docsPagesDir, imported[1]))
          .split(path.sep)
          .join('/'),
        title: meta ? meta[2] : null,
      };
    })
    .filter(Boolean);
}

const renderedGuides = collectRenderedGuides();

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

  // `<LinkTo kind="…">` is what docs/COMPONENT-GUIDE.md recommends for prose
  // story links, and the manager resolves that kind the same way it resolves a
  // URL id: `toId(kind, story)`, falling back to `sanitize(kind)`. A kind may
  // therefore be written either already sanitized
  // (`components-navigation-pager`) or as the raw title
  // (`Components/Navigation/Pager`); sanitizing before the lookup accepts both,
  // because sanitize() leaves an already-sanitized string alone.
  it('resolves every <LinkTo kind> to a story that exists', () => {
    const broken = [];

    for (const file of docFiles) {
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(
        /<LinkTo\s[^>]*?kind=(['"])([^'"]+)\1/g
      )) {
        const kind = match[2];
        if (PLACEHOLDER_KINDS.has(kind)) continue;
        if (validKinds.has(sanitize(kind))) continue;

        const line = source.slice(0, match.index).split('\n').length;
        broken.push(`${path.relative(repoRoot, file)}:${line} -> ${kind}`);
      }
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
        // Deliberately `.mdx` only: a `docs/*.md` guide keeps its relative
        // links for GitHub, and `linkDocsPages()` rewrites them for Storybook.
        // The `guides rendered as Storybook pages` block below is what holds
        // that arrangement together.
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

describe('guides rendered as Storybook pages', () => {
  it('finds the wrappers that import a repository guide', () => {
    expect(renderedGuides.length).toBeGreaterThan(15);
  });

  it('passes every guide through linkDocsPages with its own path', () => {
    const offenders = renderedGuides
      .filter(
        guide =>
          !guide.contents.includes(`linkDocsPages(`) ||
          !guide.contents.includes(`, '${guide.source}')`)
      )
      .map(
        guide => `stories/Documentation/${guide.wrapper} -> ${guide.source}`
      );

    expect(offenders).toEqual([]);
  });

  it('maps each guide to the id of the page that renders it', () => {
    const fromWrappers = Object.fromEntries(
      renderedGuides.map(guide => [guide.source, toId(guide.title, 'docs')])
    );

    expect(DOC_PAGE_IDS).toEqual(fromWrappers);
  });

  it('rewrites every relative link into one Storybook can route', () => {
    const offenders = [];

    for (const guide of renderedGuides) {
      const rewritten = linkDocsPages(
        fs.readFileSync(path.join(repoRoot, guide.source), 'utf8'),
        guide.source
      );

      rewritten.split('\n').forEach((line, index) => {
        if (/\]\((?!https?:|\?path=|#)[^)\s]*\.md[)#]/.test(line)) {
          offenders.push(`${guide.source}:${index + 1} -> ${line.trim()}`);
        }
      });
    }

    expect(offenders).toEqual([]);
  });

  it('points every rewritten link at a file that exists', () => {
    const missing = [];

    for (const guide of renderedGuides) {
      const source = fs.readFileSync(path.join(repoRoot, guide.source), 'utf8');
      const dir = path.dirname(path.join(repoRoot, guide.source));

      for (const match of source.matchAll(
        /\]\((?!https?:|\/|#)([^)\s]+\.md)(?:#[^)\s]*)?\)/g
      )) {
        if (fs.existsSync(path.resolve(dir, match[1]))) continue;

        const line = source.slice(0, match.index).split('\n').length;
        missing.push(`${guide.source}:${line} -> ${match[1]}`);
      }
    }

    expect(missing).toEqual([]);
  });
});
