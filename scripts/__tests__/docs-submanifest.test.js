/** @jest-environment node */

import fs from 'fs';
import path from 'path';
import {
  buildDocsSubmanifest,
  DOCS_SUBMANIFESTS,
  plainTextGuides,
  prepareDocsBody,
  slugify,
} from '../ai-manifest/docs-submanifest.js';
import { PUBLIC_ISSUES_URL } from '../ai-manifest/repo.js';
import { DOC_PAGE_IDS } from '../../stories/Documentation/docsPageLinks';

const DOCS_BASE = 'https://mangrove.undrr.org/';
const GITHUB_DOCS =
  'https://github.com/PreventionWeb/undrr-mangrove/blob/main/docs/';

// The unisdr organization is flagged on GitHub: every page under it is a 404
// to anonymous readers, AI tools included (undrr/web-backlog#3109).
const UNREADABLE_GITHUB = /github\.com\/unisdr\//;

const readDoc = file =>
  fs.readFileSync(path.resolve(process.cwd(), 'docs', file), 'utf8');

describe('prepareDocsBody', () => {
  const sample = `# Source title

> Edits to this file show up on both [GitHub](https://example.org) and in [Storybook](https://example.org).

See [the manual](EDITORIAL-MANUAL.md), [a manual section](EDITORIAL-MANUAL.md#capitalization), [the search guide](SEARCH-WIDGET-EDITOR-GUIDE.md), [Writing guidelines](WRITING.md), [a writing section](WRITING.md#tone), [the short version](WRITING-SHORT.md), [a local guide](LOCAL.md), [a local section](LOCAL.md#hero), [absolute](https://www.un.org/x.md) and [same page](#top).
`;

  const output = prepareDocsBody(sample, {
    localTitles: { 'LOCAL.md': 'Local guide' },
    docsBase: DOCS_BASE,
  });

  it('drops the source H1 and the banner', () => {
    expect(output).not.toContain('# Source title');
    expect(output).not.toContain('Edits to this file show up on both');
  });

  it('points guides that have a plain-text copy at that copy', () => {
    expect(output).toContain(
      `[the manual](${DOCS_BASE}llms-editorial-manual.txt)`
    );
    expect(output).toContain(
      `[a manual section](${DOCS_BASE}llms-editorial-manual.txt#capitalization)`
    );
    expect(output).toContain(
      `[the search guide](${DOCS_BASE}llms-search-widget.txt)`
    );
  });

  it('points other guides at their Storybook page, keeping anchors', () => {
    expect(output).toContain(
      `[Writing guidelines](${DOCS_BASE}?path=/docs/contributing-writing-guidelines--docs)`
    );
    expect(output).toContain(
      `[a writing section](${DOCS_BASE}?path=/docs/contributing-writing-guidelines--docs#tone)`
    );
  });

  it('keeps only the text of a link to a guide with neither', () => {
    expect(output).toContain('See [the manual]');
    expect(output).toContain(', the short version, ');
    expect(output).not.toContain('WRITING-SHORT.md');
  });

  it('never links to GitHub', () => {
    expect(output).not.toContain('github.com');
  });

  it('turns links to guides in the same sub-manifest into anchors', () => {
    expect(output).toContain('[a local guide](#local-guide)');
    expect(output).toContain('[a local section](#hero)');
  });

  it('leaves absolute and same-page links alone', () => {
    expect(output).toContain('[absolute](https://www.un.org/x.md)');
    expect(output).toContain('[same page](#top)');
  });
});

describe('plainTextGuides', () => {
  it('maps every guide with a sub-manifest to a file that exists', () => {
    const guides = plainTextGuides();

    expect(guides['EDITORIAL-MANUAL.md']).toBe('llms-editorial-manual.txt');
    expect(guides['LANDING-PAGE-GUIDE.md']).toBe('llms-page-building.txt');
    expect(guides['DRUPAL-GUTENBERG.md']).toBe('llms-page-building.txt');
    expect(guides['SEARCH-WIDGET-EDITOR-GUIDE.md']).toBe(
      'llms-search-widget.txt'
    );
    for (const file of Object.keys(guides)) {
      expect(fs.existsSync(path.resolve(process.cwd(), 'docs', file))).toBe(
        true
      );
    }
  });
});

describe('slugify', () => {
  it('matches GitHub heading anchors', () => {
    expect(slugify('Drupal Gutenberg integration')).toBe(
      'drupal-gutenberg-integration'
    );
    expect(slugify('Core blocks used alongside the UNDRR blocks')).toBe(
      'core-blocks-used-alongside-the-undrr-blocks'
    );
  });
});

describe('buildDocsSubmanifest', () => {
  const source = {
    title: 'Guide',
    file: 'GUIDE.md',
    storybookId: 'patterns-guide--docs',
    markdown: '# Guide\n\nBody.\n',
  };

  it('puts a single source directly under the wrapper H1', () => {
    const output = buildDocsSubmanifest({
      title: 'Wrapper',
      summary: 'Summary.',
      sources: [source],
      docsBase: DOCS_BASE,
    });

    expect(output.startsWith('# Wrapper\n\n> Summary.\n\nBody.\n')).toBe(true);
    expect(output).toContain(
      `- Rendered version in Storybook: ${DOCS_BASE}?path=/docs/patterns-guide--docs`
    );
    expect(output).toContain(`- Source on GitHub: ${GITHUB_DOCS}GUIDE.md`);
    expect(output).toContain(`${DOCS_BASE}llms.txt`);
    expect(output).toContain(PUBLIC_ISSUES_URL);
    expect(output).not.toMatch(UNREADABLE_GITHUB);
  });

  it('keeps each source title when there are several', () => {
    const output = buildDocsSubmanifest({
      title: 'Wrapper',
      summary: 'Summary.',
      sources: [source, { ...source, title: 'Second', file: 'SECOND.md' }],
      docsBase: DOCS_BASE,
      extraLinks: ['- Extra: link'],
    });

    expect(output).toContain('# Guide\n\nBody.');
    expect(output).toContain('# Second\n\nBody.');
    expect(output).toContain('(Second)');
    expect(output).toContain('- Extra: link');
  });
});

describe('DOCS_SUBMANIFESTS', () => {
  it.each(DOCS_SUBMANIFESTS.map(sub => [sub.filename, sub]))(
    '%s builds from the real guides',
    (filename, sub) => {
      const output = buildDocsSubmanifest({
        title: sub.title,
        summary: sub.summary,
        sources: sub.sources.map(source => ({
          ...source,
          markdown: readDoc(source.file),
        })),
        docsBase: DOCS_BASE,
        extraLinks: sub.extraLinks(DOCS_BASE),
      });

      expect(filename).toMatch(/^llms-[a-z-]+\.txt$/);
      expect(output).not.toContain('Edits to this file show up on both');
      expect(output).not.toMatch(/\]\((?!https?:|\/|#)[^)\s]+\.md/);
      expect(output).not.toMatch(UNREADABLE_GITHUB);
      expect(output).toContain('## Links');
    }
  );

  it('links each guide to the Storybook page that renders it', () => {
    for (const sub of DOCS_SUBMANIFESTS) {
      for (const source of sub.sources) {
        expect(DOC_PAGE_IDS[`docs/${source.file}`]).toBe(source.storybookId);
      }
    }
  });

  it('gives every sub-manifest its own file name and llms.json key', () => {
    const names = DOCS_SUBMANIFESTS.map(sub => sub.filename);
    const keys = DOCS_SUBMANIFESTS.map(sub => sub.urlKey);

    expect(new Set(names).size).toBe(names.length);
    expect(new Set(keys).size).toBe(keys.length);
    expect(names).not.toContain('llms-editorial-manual.txt');
  });
});
