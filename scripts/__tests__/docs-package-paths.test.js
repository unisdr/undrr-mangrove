/** @jest-environment node */
/**
 * @file docs-package-paths.test.js
 * @description Guards every published path the documentation names.
 *
 * Four issues in a row were the same defect: a doc naming an import path the
 * published package does not contain. `main: "dist/index.js"` pointed at a file
 * no tarball ever held (#1252), `dist/js/*.min.js` named a bundle webpack never
 * emitted (#1253), the SCSS entry point was documented under a `stories/`
 * directory the tarball does not ship (#1266), and the vanilla JS snippets used
 * extensionless specifiers that no `exports` map makes resolvable (#1267).
 *
 * They share one cause: docs are written against the repo tree, consumers
 * install the tarball, and the two have never had the same shape. Nothing in
 * the build reads documentation, so a wrong path fails only in a consumer's
 * project, months later.
 *
 * This suite narrows that gap. It resolves four shapes out of every tracked
 * `.md` and `.mdx` in the repository against `scripts/published-paths.cjs` — a
 * model of the tarball **this working tree would produce**, which
 * `published-paths.test.js` keeps honest against a real build:
 *
 * 1. `@undrr/undrr-mangrove/<subpath>` in an import, require or `@import`.
 * 2. A Sass `@import` written relative to the package root, the form the Sass
 *    integration guide teaches next to `includePaths`.
 * 3. A CDN URL under `assets.undrr.org/mangrove/<version>/`.
 * 4. A path in one of the CDN reference's tables, which has no host.
 *
 * ## What this does NOT cover
 *
 * - **Whether anything is actually published.** This is the boundary that
 *   matters most, so it goes first. The model is built from *this working
 *   tree*, not from a registry tarball or a CDN listing. A path that is new on
 *   this branch resolves here and 404s for every consumer until a release
 *   ships it. Resolution against the model is a necessary condition, never a
 *   sufficient one. `js/drawer.js` is the live example: it is in the sources,
 *   so the model has it, and no released version folder serves it yet because
 *   it postdates the current tag. `docs/RELEASES.md` carries the step that
 *   clears that up at release time.
 * - **Specifiers outside `.md` / `.mdx`.** JSDoc, code comments and story
 *   source are not scanned.
 * - **Named exports.** `import { mgTabs } from '…/js/tabs.js'` is checked as
 *   far as the file; whether the file exports `mgTabs` is not checked here.
 * - **Relative paths.** A doc that writes `path/to/tabs.js` or a Drupal
 *   library path is deliberately illustrative and cannot be resolved.
 * - **CDN paths at any version other than the one in `package.json`.**
 *   `mangrove/1.4.1/…` is a different tree and is skipped. So is
 *   `mangrove/latest/…`, for the reason spelled out at the check itself: the
 *   `latest` dist-tag does *not* track this branch.
 * - **Completeness.** A doc that omits a module that ships passes. The guard
 *   answers "does everything named resolve?", not "is everything that resolves
 *   named?".
 * - **Table rows in a release note, and prose after a `## Changelog` heading.**
 *   `CHANGELOG.md`, the migration tables in `docs/RELEASE-*.md` and any
 *   `## Changelog` section record what a path used to be and why it was wrong,
 *   so quoting a dead one there is the point. The exemption is deliberately
 *   narrow: in a release note only table rows are exempt, because the
 *   forward-looking "here is what to do in 2.0" prose beside those tables is
 *   the migration guide consumers actually follow, and a wrong path in it is a
 *   defect like any other. Fenced code is checked everywhere.
 * - **The allow-lists below.** They are the escape hatch, one line of reason
 *   each. Adding an entry is a reviewer decision, not a formality.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { ROOT, publishedPaths } = require('../published-paths.cjs');

const PACKAGE_NAME = '@undrr/undrr-mangrove';
const { version: CURRENT_VERSION } = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')
);

const SKIP_DIRS = new Set([
  '.git',
  '.yarn',
  'dist',
  'docs-build-temp',
  '_site',
  'node_modules',
  'npm-package',
  'storybook-static',
]);

/**
 * Specifier shapes that are illustrative rather than real. A doc writing
 * `components/<Name>.js` is teaching the pattern, not naming a file.
 *
 * A trailing slash is deliberately NOT in here. "the SCSS source lives in
 * `@undrr/undrr-mangrove/stories/`" is a claim about the package's shape, and
 * it was false on every version ever published — one of the two claims this
 * sweep deleted. Skipping it as "a directory being discussed" would let the
 * same falsehood back in wearing a slash, so a named directory is resolved
 * too, against the package's top level.
 */
const isPlaceholder = subpath =>
  /[…<>{}*]/.test(subpath) || // <Name>, {name}, …, glob
  /^(components|js)\/(ComponentName|MyComponent|Name|X|my-script)\./.test(
    subpath
  );

/**
 * Paths a doc may name although they do not resolve today, because naming
 * them is the point: a migration table's "before" column, or a correction
 * recording what a page used to say wrongly.
 *
 * Keyed by `<repo-relative file>::<path as written>`.
 */
const RETIRED_PATHS = new Map([
  [
    'docs/RELEASE-1.4.md::css/style-legacy.css',
    'The 1.4 release notes, where the legacy stylesheets were current. 2.0 deleted them.',
  ],
  [
    'docs/RELEASE-1.4.md::stories/assets/scss/style',
    'The correction note itself, which has to quote the path it corrects (#1266).',
  ],
  [
    'docs/RELEASE-2.0.md::scss/Utilities/ShowMore/ShowMore',
    'The "Removed" side of the 2.0 PascalCase-alias migration table.',
  ],
  [
    'docs/CDN-REFERENCE.md::/css/style-legacy.css',
    'Listed as 1.x-only; the table says so and 2.0 deleted it.',
  ],
  [
    'docs/CDN-REFERENCE.md::/css/style-preventionweb-legacy.css',
    'Listed as 1.x-only; the table says so and 2.0 deleted it.',
  ],
  [
    'docs/CDN-REFERENCE.md::/css/style-mcr-legacy.css',
    'Listed as 1.x-only; the table says so and 2.0 deleted it.',
  ],
  [
    'docs/CDN-REFERENCE.md::/css/style-irp-legacy.css',
    'Listed as 1.x-only; the table says so and 2.0 deleted it.',
  ],
  [
    'docs/CDN-REFERENCE.md::/js/main.js',
    'Named as the combined bundle that does not exist, so readers stop asking for it.',
  ],
]);

function walkDocs(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDocs(full, found);
    else if (/\.mdx?$/.test(entry.name)) found.push(full);
  }
  return found;
}

/**
 * Every tracked `.md` and `.mdx`, `git ls-files` first.
 *
 * The walk used to skip every `.`-prefixed entry, which quietly dropped
 * `.github/pull_request_template.md` and `.claude/agents/*.md` — eleven files
 * the sweep claimed to cover. Not skipping them is not enough on its own:
 * a developer's `git worktree` directories live under `.claude/`, and each is
 * a whole second copy of the repository. Asking git for the tracked set gets
 * exactly the files the branch is responsible for, and nothing that happens to
 * be sitting on the disk. The walk stays as a fallback for a checkout without
 * a usable git.
 */
function docFiles() {
  try {
    return execFileSync('git', ['ls-files', '-z', '*.md', '*.mdx'], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 16,
    })
      .split('\0')
      .filter(Boolean)
      .map(relative => path.join(ROOT, relative));
  } catch {
    return walkDocs(ROOT);
  }
}

const PATHS = publishedPaths();

/**
 * Sass resolves a partial by adding the extension and the leading underscore,
 * so `scss/assets/scss/style` and `scss/assets/scss/variables` are both legal
 * ways to name a published `.scss` file. Node ESM does neither, which is why
 * only `scss/` subpaths get this treatment.
 */
function resolvesAsSass(subpath) {
  const dir = path.posix.dirname(subpath);
  const base = path.posix.basename(subpath);
  return [
    subpath,
    `${subpath}.scss`,
    `${dir}/_${base}.scss`,
    `${subpath}/_index.scss`,
  ].some(candidate => PATHS.has(candidate));
}

/**
 * A subpath written with a trailing slash names a directory, so it resolves
 * when the package ships anything under it. `scss/` does; `stories/` and
 * `tokens/` do not, which is the pair of false claims #1266 removed.
 */
const resolvesAsDirectory = subpath =>
  [...PATHS].some(published => published.startsWith(subpath));

const resolves = subpath => {
  if (subpath.endsWith('/')) return resolvesAsDirectory(subpath);
  return subpath.startsWith('scss/')
    ? resolvesAsSass(subpath)
    : PATHS.has(subpath);
};

/** Collect every checkable reference, with enough context to report it. */
function collect() {
  const found = [];

  for (const file of docFiles(ROOT)) {
    const relative = path.relative(ROOT, file).split(path.sep).join('/');
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    // A specifier inside a fenced block is an instruction a reader copies; the
    // same string in prose is usually a doc talking about a path, including
    // about one that no longer works. Some checks below only apply to the
    // first kind.
    let fenced = false;
    const inCode = lines.map(text => {
      if (/^\s*(```|~~~)/.test(text)) {
        fenced = !fenced;
        return false;
      }
      return fenced;
    });

    // Changelog and migration-table *prose* is where a doc records what a path
    // used to be and why it was wrong: "it reached into `…/src/hydrate`, and
    // the tarball ships no `src/`". Naming the dead path is the whole value of
    // the sentence, so prose in those regions is not resolved. Fenced code is,
    // everywhere — a reader copies a fence — and so is prose anywhere else,
    // which is where the Grid page's broken CSS link was hiding.
    const isChangelog = relative === 'CHANGELOG.md';

    // A release note is not historical end to end. Most of `RELEASE-2.0.md` is
    // forward-looking "here is what to do in 2.0" guidance — the migration
    // guide consumers actually follow — and a path that does not resolve there
    // misleads exactly the reader it is written for. Only the rows of its
    // before/after tables are exempt, because a "Removed" column names dead
    // paths by design.
    const isReleaseNote = /^docs\/RELEASE-[\d.]+\.md$/.test(relative);
    const isTableRow = text => /^\s*\|/.test(text);

    // `## Changelog` has to be found the way the rest of the file reads the
    // document, or a fenced example of the heading is mistaken for the real
    // one. `ComponentContribution.mdx` fences exactly that as a template, at
    // line 655 of 1031 — taking the first match exempted the back third of the
    // component-authoring guide. Take the last unfenced heading: a page's real
    // changelog is its final section.
    const changelogFrom = lines.reduce(
      (last, text, index) =>
        !inCode[index] && /^#{2,3}\s+Changelog\s*$/.test(text) ? index : last,
      -1
    );

    const isHistoricalProse = index =>
      !inCode[index] &&
      (isChangelog ||
        (isReleaseNote && isTableRow(lines[index])) ||
        (changelogFrom !== -1 && index > changelogFrom));

    lines.forEach((text, index) => {
      const at = {
        file: relative,
        line: index + 1,
        inCode: inCode[index],
        historical: isHistoricalProse(index),
      };

      // 1. Bare package specifiers: `@undrr/undrr-mangrove/js/tabs.js`.
      for (const match of text.matchAll(
        /(\S*)@undrr\/undrr-mangrove\/([^"'`\s,;)\]}]+)/g
      )) {
        // https://www.npmjs.com/package/@undrr/undrr-mangrove/access is a
        // registry page, not a subpath export.
        if (match[1].includes('npmjs.com/package/')) continue;
        const subpath = match[2].replace(/[.,:]+$/, '');
        if (isPlaceholder(subpath)) continue;
        found.push({ ...at, kind: 'import', written: subpath });
      }

      // 2. Sass imports written relative to the package root, the form the
      // Sass integration guide teaches alongside `includePaths`. The whole
      // guide named these under `stories/`, which the tarball does not ship.
      for (const match of text.matchAll(
        /@(?:import|use)\s+['"]((?:components|css|js|scss|error-pages|fonts|src|stories|tokens|dist)\/[^'"]+)['"]/g
      )) {
        found.push({ ...at, kind: 'sass-root', written: match[1] });
      }

      // 3. CDN URLs at the version in `package.json`, and at no other.
      //
      // `latest` is skipped, and the reason is worth writing down because the
      // opposite was asserted here and survived review. `latest` is a moving
      // pointer — the dist-tag for the newest *stable* release — and it does
      // not track this branch. Whenever a prerelease line is open it addresses
      // a different major than the sources here, so resolving `latest/` URLs
      // against this model is wrong in both directions at once: it blesses
      // paths that exist only on this branch, and it rejects files the older
      // tree genuinely serves.
      //
      // Deliberately not fixed by looking the tag up. Hard-coding the version
      // it points at today would quietly change meaning the moment a release
      // is cut, and asking the registry at test time would make the suite
      // network-dependent and non-reproducible — both worse than the bug. A
      // wrong answer in a guard is worse than no answer, so a `latest/` URL is
      // a manual check. Docs should pin a version; the `latest/` URLs that
      // remain are listed as a step in the release procedure
      // (`docs/RELEASES.md`), to be re-pointed when the tag moves.
      for (const match of text.matchAll(
        /https:\/\/assets\.undrr\.org\/mangrove\/([^/]+)\/([^"'`\s,;)\]>}]+)/g
      )) {
        const [, version, rest] = match;
        if (version !== CURRENT_VERSION) continue;
        const subpath = rest.replace(/[.,:]+$/, '');
        if (isPlaceholder(subpath)) continue;
        found.push({ ...at, kind: 'cdn', written: subpath });
      }
    });

    // 4. The CDN reference's tables list paths relative to the version
    // folder, with no host: `| Tabs | `/js/tabs.js` |`.
    if (relative === 'docs/CDN-REFERENCE.md') {
      lines.forEach((text, index) => {
        for (const match of text.matchAll(
          /`(\/(?:css|js|components|fonts|error-pages)\/[^`]+)`/g
        )) {
          found.push({
            file: relative,
            line: index + 1,
            inCode: false,
            historical: false,
            kind: 'cdn-table',
            written: match[1],
          });
        }
      });
    }
  }

  return found;
}

const references = collect();

describe('published paths named in documentation', () => {
  test('the sweep reads every tracked .md and .mdx', () => {
    // The count in the changelog and the PR body is this number. It was wrong
    // by eleven files because the walk skipped `.`-prefixed directories, and a
    // stated coverage figure nothing checks is how that survived.
    const tracked = execFileSync('git', ['ls-files', '*.md', '*.mdx'], {
      cwd: ROOT,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean);
    const swept = new Set(
      docFiles().map(file =>
        path.relative(ROOT, file).split(path.sep).join('/')
      )
    );
    expect(tracked.filter(file => !swept.has(file))).toEqual([]);
    expect(swept.size).toBe(tracked.length);
  });

  test('the sweep actually found the documentation', () => {
    expect(references.length).toBeGreaterThan(150);
    expect(references.some(ref => ref.file.endsWith('.mdx'))).toBe(true);
    expect(references.some(ref => ref.file.startsWith('docs/'))).toBe(true);
  });

  test('every path named resolves in the published package', () => {
    const unresolved = references
      .filter(ref => {
        if (ref.historical) return false;
        const subpath = ref.written.replace(/^\//, '');
        if (resolves(subpath)) return false;
        return !RETIRED_PATHS.has(`${ref.file}::${ref.written}`);
      })
      .map(
        ref =>
          `${ref.file}:${ref.line} [${ref.kind}${ref.inCode ? ', code example' : ''}] ` +
          `${ref.written} — not in the tarball`
      );

    // A failure here means a doc names a path a consumer cannot import. Fix
    // the doc; add to RETIRED_PATHS only when naming the dead path is the
    // point (a migration "before", or a correction).
    expect(unresolved).toEqual([]);
  });

  test('no allow-list entry outlives the path it excuses', () => {
    // A retired path that starts resolving again, or a file that no longer
    // mentions it, leaves a stale excuse that would hide the next regression.
    const written = new Set(
      references
        .filter(ref => !ref.historical)
        .map(ref => `${ref.file}::${ref.written}`)
    );
    expect([...RETIRED_PATHS.keys()].filter(key => !written.has(key))).toEqual(
      []
    );
  });

  test('no JS or CSS subpath is named without its extension', () => {
    // #1267: Node ESM will not add `.js` for you, and the package ships no
    // `exports` map that could. Sass is the one place bare names are legal.
    const bare = references
      .filter(ref => {
        if (ref.historical) return false;
        const subpath = ref.written.replace(/^\//, '');
        if (ref.kind === 'sass-root') return false; // Sass, by definition
        if (subpath.startsWith('scss/')) return false;
        if (subpath.endsWith('/')) return false; // a directory has no extension
        if (RETIRED_PATHS.has(`${ref.file}::${ref.written}`)) return false;
        return !path.posix.extname(subpath);
      })
      .map(ref => `${ref.file}:${ref.line} ${ref.written}`);

    expect(bare).toEqual([]);
  });

  test('the two specifiers that filed #1266 and #1267 stay fixed', () => {
    // Named explicitly so a revert fails with the issue number attached,
    // rather than as one line in a list. Changelog prose is excluded: the
    // entries recording these fixes necessarily quote the paths they replaced.
    const all = references
      .filter(
        ref =>
          !ref.historical && !RETIRED_PATHS.has(`${ref.file}::${ref.written}`)
      )
      .map(ref => ref.written);
    expect(all).not.toContain('stories/assets/scss/style');
    expect(all).toContain('scss/assets/scss/style');
    expect(all).toContain('js/on-this-page-nav.js');
    expect(all).toContain('js/preview-access.js');
    expect(all).not.toContain('js/on-this-page-nav');
    expect(all).not.toContain('js/preview-access');
  });

  test('no code example imports the package root', () => {
    // The published package has no `main` and no `exports` (#1252), so
    // `import … from '@undrr/undrr-mangrove'` resolves nowhere. Only fenced
    // code is checked: prose says this in so many words, on several pages.
    const rootImport = new RegExp(
      `(?:from|import|require\\()\\s*['"]${PACKAGE_NAME}['"]`
    );
    const offenders = [];

    for (const file of docFiles(ROOT)) {
      const relative = path.relative(ROOT, file).split(path.sep).join('/');
      let fenced = false;
      fs.readFileSync(file, 'utf8')
        .split('\n')
        .forEach((text, index) => {
          if (/^\s*(```|~~~)/.test(text)) {
            fenced = !fenced;
            return;
          }
          if (fenced && rootImport.test(text)) {
            offenders.push(`${relative}:${index + 1} ${text.trim()}`);
          }
        });
    }

    expect(offenders).toEqual([]);
  });
});
