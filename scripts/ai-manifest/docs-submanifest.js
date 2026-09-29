/**
 * docs-submanifest.js: builds topic-scoped llms-*.txt files from docs/*.md.
 *
 * A sub-manifest is one plain-text file an agent can fetch for a single job
 * (writing copy, building a Drupal page, configuring the search widget)
 * without parsing the full component manifest. The Markdown under docs/ stays
 * the source of truth; this wraps one or more of those files in the llms.txt
 * header and links convention.
 *
 * The Storybook site is a single-page app, so these files are also the only
 * fetchable form of the rendered guides. They are what a public AI prompt
 * such as "Using the UNDRR page building guide at <url>..." points at.
 */

import { REPO_BLOB_MAIN } from './repo.js';

export const GITHUB_DOCS_BASE = `${REPO_BLOB_MAIN}docs/`;

/** `](TARGET.md)` or `](TARGET.md#anchor)`, skipping absolute and in-page links. */
const RELATIVE_MD_LINK = /\]\((?!https?:|\/|#)([^)\s]+\.md)(#[^)\s]*)?\)/g;

/**
 * GitHub-style heading slug, used to link to a guide that is part of the same
 * sub-manifest.
 *
 * @param {string} text Heading text
 * @returns {string} Anchor, without the leading `#`
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s/g, '-');
}

/**
 * Strip what only makes sense in the source file and fix up relative links.
 *
 * A link to a guide included in the same sub-manifest becomes an in-page
 * anchor, so an agent reading the file does not fetch content it already
 * has. Any other relative docs/*.md link points at the file on GitHub.
 *
 * @param {string} markdown Raw content of a docs/*.md file
 * @param {Record<string, string>} [localTitles] File name -> title, for the
 *   guides that share this sub-manifest
 * @returns {string} The body, ready to embed in a sub-manifest
 */
export function prepareDocsBody(markdown, localTitles = {}) {
  return (
    markdown
      // Drop the file's own H1 (the wrapper supplies one) and the
      // GitHub/Storybook banner line, both meaningless in a standalone text file.
      .replace(/^# .+\n\n/, '')
      .replace(/^> Edits to this file show up on both.*\n\n?/m, '')
      // Relative docs/*.md links only resolve inside Storybook's <Markdown>
      // block or on GitHub's file browser; neither applies here.
      .replace(RELATIVE_MD_LINK, (match, target, hash = '') => {
        if (localTitles[target]) {
          return `](${hash || `#${slugify(localTitles[target])}`})`;
        }
        return `](${GITHUB_DOCS_BASE}${target}${hash})`;
      })
      .trim()
  );
}

/**
 * Wrap one or more docs/*.md files as a standalone llms-style text file.
 *
 * With several sources, each keeps its own title as an H1 so the guides stay
 * distinguishable; a single source sits directly under the wrapper's H1.
 *
 * @param {object}   options
 * @param {string}   options.title     H1 of the generated file
 * @param {string}   options.summary   One-paragraph blockquote summary
 * @param {Array<{title: string, file: string, storybookId: string, markdown: string}>} options.sources
 * @param {string}   options.docsBase  Storybook base URL, with trailing slash
 * @param {string[]} [options.extraLinks] Further lines for the Links section
 * @returns {string} Contents of the llms-*.txt file
 */
export function buildDocsSubmanifest({
  title,
  summary,
  sources,
  docsBase,
  extraLinks = [],
}) {
  const single = sources.length === 1;
  const localTitles = single
    ? {}
    : Object.fromEntries(sources.map(source => [source.file, source.title]));

  const bodies = sources.map(source => {
    const body = prepareDocsBody(source.markdown, localTitles);
    return single ? body : `# ${source.title}\n\n${body}`;
  });

  const links = sources.flatMap(source => {
    const label = single ? '' : ` (${source.title})`;
    return [
      `- Rendered version in Storybook${label}: ${docsBase}?path=/docs/${source.storybookId}`,
      `- Source on GitHub${label}: ${GITHUB_DOCS_BASE}${source.file}`,
    ];
  });

  return `# ${title}

> ${summary}

${bodies.join('\n\n')}

## Links

${[
  ...links,
  ...extraLinks,
  `- Full component/library manifest: ${docsBase}llms.txt`,
].join('\n')}
`;
}

/**
 * The sub-manifests built from docs/*.md, other than the editorial manual
 * (see editorial-manual.js). `sources` name files under docs/; the generator
 * reads them and passes their contents in as `markdown`.
 */
export const DOCS_SUBMANIFESTS = [
  {
    filename: 'llms-page-building.txt',
    urlKey: 'pageBuilding',
    title: 'Mangrove page building guide for Drupal Gutenberg',
    summary:
      'How to build landing pages on UNDRR websites (undrr.org, preventionweb.net, mcr2030.undrr.org and the microsites) with the Drupal Gutenberg block editor and Mangrove components: page shapes, section structure, layout patterns and component choice, then the UNDRR block reference with serialization rules, rendering constraints and the current markup for every block. Markup can be pasted into the editor through the Code editor. For copy, follow the editorial manual; for search widget configuration, fetch llms-search-widget.txt.',
    sources: [
      {
        title: 'Building landing pages',
        file: 'LANDING-PAGE-GUIDE.md',
        storybookId: 'patterns-building-landing-pages--docs',
      },
      {
        title: 'Drupal Gutenberg integration',
        file: 'DRUPAL-GUTENBERG.md',
        storybookId: 'getting-started-integration-drupal-gutenberg--docs',
      },
    ],
    extraLinks: docsBase => [
      `- Search widget editor configuration: ${docsBase}llms-search-widget.txt`,
      `- Editorial manual: ${docsBase}llms-editorial-manual.txt`,
    ],
  },
  {
    filename: 'llms-search-widget.txt',
    urlKey: 'searchWidget',
    title: 'UNDRR search widget editor configuration',
    summary:
      'How to configure the UNDRR Search Widget Gutenberg block on UNDRR websites: every sidebar setting, practical configurations (curated feeds, locked websites, custom facets, detached search box and facets), what readers can type, and the field:value filter syntax with content types, subtypes, taxonomy term IDs, languages, websites and date ranges.',
    sources: [
      {
        title: 'Search widget editor configuration',
        file: 'SEARCH-WIDGET-EDITOR-GUIDE.md',
        storybookId: 'components-syndicated-search-editor-configuration--docs',
      },
    ],
    extraLinks: docsBase => [
      `- Page building guide: ${docsBase}llms-page-building.txt`,
    ],
  },
];
