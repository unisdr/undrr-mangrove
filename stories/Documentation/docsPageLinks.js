/**
 * @file docsPageLinks.js
 * @description Makes the relative Markdown links in `docs/*.md` work in Storybook.
 *
 * The guides under `docs/` have two audiences. On GitHub they are read as files,
 * where `[Testing](TESTING.md)` is the correct link and a Storybook URL would be
 * a detour. In Storybook the same files are imported with `?raw` and rendered
 * through the `<Markdown>` block, where that relative path resolves against the
 * docs page URL and 404s.
 *
 * Rather than pick one audience, the wrappers in `stories/Documentation/` pass
 * the raw Markdown through `linkDocsPages()` first. The file on disk keeps the
 * relative link; the rendered page gets a link Storybook can route:
 *
 * - a guide that has a Storybook page becomes `?path=/docs/<id>--docs`, which
 *   `AnchorMdx` intercepts and turns into a `NAVIGATE_URL` event;
 * - a guide that has none (for example `WRITING-SHORT.md`) becomes an absolute
 *   GitHub link to the source file, which opens in a new context rather than
 *   dead-ending inside the preview iframe.
 *
 * `scripts/__tests__/docs-links.test.js` checks that `DOC_PAGE_IDS` still matches
 * the wrappers' own `<Meta title>` values, and that every relative link in a
 * rendered guide resolves to a file that exists.
 */

/** Repo-relative Markdown file -> the Storybook docs id that renders it. */
export const DOC_PAGE_IDS = {
  'CHANGELOG.md': 'contributing-changelog--docs',
  'docs/ACCESSIBILITY.md': 'getting-started-accessibility--docs',
  'docs/AI-MCP-INTEGRATION.md': 'getting-started-ai-and-mcp-integration--docs',
  'docs/ANALYTICS.md': 'platform-services-analytics-enhancements--docs',
  'docs/ARCHITECTURE.md': 'contributing-architecture--docs',
  'docs/BROWSER-SUPPORT.md': 'getting-started-browser-support--docs',
  'docs/CDN-REFERENCE.md': 'getting-started-integration-cdn-reference--docs',
  'docs/COLOUR-CONTRAST-METHODOLOGY.md':
    'design-decisions-colour-contrast-methodology--docs',
  'docs/COMPONENT-GUIDE.md':
    'contributing-build-a-component-step-by-step--docs',
  'docs/CRITICAL-MESSAGING.md': 'platform-services-critical-messaging--docs',
  'docs/EDITORIAL-MANUAL.md': 'contributing-editorial-manual--docs',
  'docs/HYDRATION-AUTHORING.md':
    'contributing-build-a-component-hydration--docs',
  'docs/HYDRATION.md': 'getting-started-integration-hydration-guide--docs',
  'docs/RELEASE-1.4.md': 'getting-started-release-notes-v1-4--docs',
  'docs/RELEASE-1.5.md': 'getting-started-release-notes-v1-5--docs',
  'docs/RELEASE-2.0.md': 'getting-started-release-notes-v2-0--docs',
  'docs/RELEASES.md': 'contributing-release-process--docs',
  'docs/REVIEW-CHECKLIST.md':
    'contributing-build-a-component-review-checklist--docs',
  'docs/TESTING.md': 'contributing-build-a-component-testing--docs',
  'docs/WRITING.md': 'contributing-writing-guidelines--docs',
};

const GITHUB_BLOB = 'https://github.com/unisdr/undrr-mangrove/blob/main/';

/** `](TARGET.md)` or `](TARGET.md#anchor)`, skipping absolute and in-page links. */
const RELATIVE_MD_LINK = /\]\((?!https?:|\/|#)([^)\s]+\.md)(#[^)\s]*)?\)/g;

/**
 * Resolves a relative link target against the directory holding the source file.
 * A small POSIX-only `path.resolve`, because this module runs in the browser.
 *
 * @param {string} sourcePath Repo-relative path of the file holding the link.
 * @param {string} target     The link target, as written in the Markdown.
 * @returns {string} The repo-relative path the link points at.
 */
function resolveTarget(sourcePath, target) {
  const parts = sourcePath.split('/').slice(0, -1);

  for (const segment of target.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') parts.pop();
    else parts.push(segment);
  }

  return parts.join('/');
}

/**
 * Rewrites the relative Markdown links in a guide so they resolve in Storybook.
 *
 * @param {string} markdown   The file's raw contents.
 * @param {string} sourcePath The file's repo-relative path, e.g. `docs/TESTING.md`.
 * @returns {string} The same Markdown with its repo-file links rewritten.
 */
export function linkDocsPages(markdown, sourcePath) {
  return markdown.replace(RELATIVE_MD_LINK, (match, target, hash = '') => {
    const resolved = resolveTarget(sourcePath, target);
    const id = DOC_PAGE_IDS[resolved];

    return id
      ? `](?path=/docs/${id}${hash})`
      : `](${GITHUB_BLOB}${resolved}${hash})`;
  });
}
