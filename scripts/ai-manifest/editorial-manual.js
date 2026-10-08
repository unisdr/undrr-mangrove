/**
 * editorial-manual.js — Builds llms-editorial-manual.txt from
 * docs/EDITORIAL-MANUAL.md.
 *
 * A separate, topic-scoped sub-manifest (not a section of llms.txt) so an
 * agent that only needs writing/style rules doesn't have to fetch and parse
 * the full component manifest. docs/EDITORIAL-MANUAL.md is the source of
 * truth; this just wraps it in the llms.txt header/links convention.
 */

import { buildDocsSubmanifest } from './docs-submanifest.js';

/**
 * Wrap the editorial manual markdown as a standalone llms-style text file.
 *
 * @param {string} markdown Raw content of docs/EDITORIAL-MANUAL.md
 * @param {string} docsBase Storybook base URL, with trailing slash
 * @returns {string} Contents of llms-editorial-manual.txt
 */
export function buildEditorialManualTxt(markdown, docsBase) {
  return buildDocsSubmanifest({
    title: 'Mangrove editorial manual',
    summary:
      'Mechanical style rules (capitalization, punctuation, numbers and dates, abbreviations, italics, spelling), UNDRR-specific terminology, plus disability inclusive and gender-inclusive language for UNDRR web content (news, publications, blogs, events, landing pages) and for Mangrove UI copy, component docs and Storybook pages. Each rule is credited to its source: the UNDRR Publications SOP, the UN Geneva Web Style Guide, the United Nations Editorial Manual, the United Nations Disability-Inclusive Communications Guidelines or the DPI Gender Checklist for Content Creators; see the "Keeping this updated" section below for the full source list and priority order.',
    sources: [
      {
        title: 'Editorial manual',
        file: 'EDITORIAL-MANUAL.md',
        storybookId: 'contributing-editorial-manual--docs',
        markdown,
      },
    ],
    docsBase,
  });
}
