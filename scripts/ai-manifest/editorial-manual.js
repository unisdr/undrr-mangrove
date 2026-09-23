/**
 * editorial-manual.js — Builds llms-editorial-manual.txt from
 * docs/EDITORIAL-MANUAL.md.
 *
 * A separate, topic-scoped sub-manifest (not a section of llms.txt) so an
 * agent that only needs writing/style rules doesn't have to fetch and parse
 * the full component manifest. docs/EDITORIAL-MANUAL.md is the source of
 * truth; this just wraps it in the llms.txt header/links convention.
 */

const GITHUB_DOCS_BASE =
  'https://github.com/unisdr/undrr-mangrove/blob/main/docs/';

/**
 * Wrap the editorial manual markdown as a standalone llms-style text file.
 *
 * @param {string} markdown Raw content of docs/EDITORIAL-MANUAL.md
 * @param {string} docsBase Storybook base URL, with trailing slash
 * @returns {string} Contents of llms-editorial-manual.txt
 */
export function buildEditorialManualTxt(markdown, docsBase) {
  const body = markdown
    // Drop the file's own H1 (the wrapper below supplies one) and the
    // GitHub/Storybook banner line, both meaningless in a standalone text file.
    .replace(/^# .+\n\n/, '')
    .replace(/^> Edits to this file show up on both.*\n\n?/m, '')
    // Relative docs/*.md links only resolve inside Storybook's <Markdown>
    // block or on GitHub's file browser — neither applies here, so point
    // them at the GitHub file directly.
    .replace(
      /\]\((?!https?:|\/|#)([^)\s]+\.md)(#[^)\s]*)?\)/g,
      (match, target, hash = '') => `](${GITHUB_DOCS_BASE}${target}${hash})`
    );

  return `# Mangrove editorial manual

> Mechanical style rules (capitalization, punctuation, numbers and dates, abbreviations, italics, spelling), UNDRR-specific terminology, plus disability inclusive and gender-inclusive language for UNDRR Mangrove UI copy, component docs and Storybook pages. Each rule is credited to its source – the UNDRR Publications SOP, the UN Geneva Web Style Guide, the United Nations Editorial Manual, the United Nations Disability-Inclusive Communications Guidelines or the DPI Gender Checklist for Content Creators; see the "Keeping this updated" section below for the full source list and priority order.

${body.trim()}

## Links

- Rendered version in Storybook: ${docsBase}?path=/docs/contributing-editorial-manual--docs
- Source on GitHub: ${GITHUB_DOCS_BASE}EDITORIAL-MANUAL.md
- Full component/library manifest: ${docsBase}llms.txt
`;
}
