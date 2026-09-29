/** @jest-environment node */

import fs from 'fs';
import path from 'path';
import {
  buildDocsSubmanifest,
  DOCS_SUBMANIFESTS,
  prepareDocsBody,
  slugify,
} from '../ai-manifest/docs-submanifest.js';
import { DOC_PAGE_IDS } from '../../stories/Documentation/docsPageLinks';

const DOCS_BASE = 'https://mangrove.undrr.org/';
const GITHUB_DOCS = 'https://github.com/unisdr/undrr-mangrove/blob/main/docs/';

const readDoc = file =>
  fs.readFileSync(path.resolve(process.cwd(), 'docs', file), 'utf8');

describe('prepareDocsBody', () => {
  const sample = `# Source title

> Edits to this file show up on both [GitHub](https://example.org) and in [Storybook](https://example.org).

See [Other guide](OTHER.md), [a section](OTHER.md#tabs), [a local guide](LOCAL.md), [a local section](LOCAL.md#hero), [absolute](https://www.un.org/x.md) and [same page](#top).
`;

  const output = prepareDocsBody(sample, { 'LOCAL.md': 'Local guide' });

  it('drops the source H1 and the banner', () => {
    expect(output).not.toContain('# Source title');
    expect(output).not.toContain('Edits to this file show up on both');
  });

  it('points other guides at GitHub, keeping anchors', () => {
    expect(output).toContain(`[Other guide](${GITHUB_DOCS}OTHER.md)`);
    expect(output).toContain(`[a section](${GITHUB_DOCS}OTHER.md#tabs)`);
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
