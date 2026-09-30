/**
 * parse-changelog.js — Parser for CHANGELOG.md and component MDX changelogs.
 *
 * Produces structured, machine-readable release and changelog records for:
 *   - releases.json (deployed at root and ai-components/releases.json)
 *   - ai-components/{id}.json (per-component changelog arrays)
 *   - llms.txt & llms.json discovery links
 */

import fs from 'fs';
import {
  PUBLIC_REPO_BLOB_MAIN,
  PUBLIC_REPO_URL,
  REPO_URL,
  githubHeadingAnchor,
  privateGithubRef,
  qualifyBareRefs,
  toPublicMarkdown,
} from './repo.js';

const REPO_SLUG = REPO_URL.replace('https://github.com/', '');

/**
 * Changelog prose as published: no link into the unisdr organization, and no
 * bare `#1234` that a reader of the public fork would look up there.
 */
const publicText = text => qualifyBareRefs(toPublicMarkdown(text));

/**
 * Resolve a change's pull request reference. A link on the unisdr organization,
 * or a bare `(#1234)`, names a pull request merged on unisdr/undrr-mangrove:
 * it becomes the plain-text `prRef` with no `prUrl`, since the only URL for it
 * is not publicly readable. Any other GitHub link is kept as `prUrl`.
 */
function pullRequestFields(text) {
  const prMatch =
    text.match(/\[#(\d+)\]\((https:\/\/github\.com\/[^)]+)\)/) ||
    text.match(/\(#(\d+)\)/);
  if (!prMatch) return { pr: null, prRef: null, prUrl: null };

  const pr = parseInt(prMatch[1], 10);
  const url = prMatch[2] || null;
  const privateRef = url ? privateGithubRef(url) : `${REPO_SLUG}#${pr}`;
  return {
    pr,
    prRef: privateRef,
    prUrl: privateRef ? null : url,
  };
}

/**
 * Parse project CHANGELOG.md into structured release objects.
 *
 * @param {string} markdown Raw markdown content of CHANGELOG.md
 * @returns {Array<object>} Array of parsed release records
 */
export function parseChangelog(markdown) {
  if (!markdown) return [];

  const lines = markdown.split('\n');
  const releases = [];
  let currentRelease = null;
  let currentCategory = 'General';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Matches headings like:
    // ## 2.0.0-beta.3, 2026-09-15
    // ## 2.0.0, unreleased
    // ## [1.8.2], 2026-08-27
    // The older em/en dash separator (`## 1.8.2 — 2026-08-27`) is still accepted.
    const releaseHeaderMatch = line.match(
      /^##\s+(?:\[?([0-9a-zA-Z.-]+)\]?)(?:(?:\s*,\s*|\s+[—–-]\s+)(\d{4}-\d{2}-\d{2}|unreleased))?/i
    );

    if (releaseHeaderMatch && !line.toLowerCase().startsWith('## unreleased')) {
      const rawVersion = releaseHeaderMatch[1];
      const rawDate =
        releaseHeaderMatch[2] ||
        (line.toLowerCase().includes('unreleased') ? 'unreleased' : null);

      // Only dated headings are releases. `## 2.0.0, unreleased` is a planning
      // section; publishing it would advertise a stable version and tag that
      // do not exist. Stop collecting until the next real release heading.
      if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate || '')) {
        currentRelease = null;
        continue;
      }

      currentRelease = {
        version: rawVersion,
        date: rawDate,
        isPrerelease: /-(alpha|beta|rc)/i.test(rawVersion),
        tag: `v${rawVersion}`,
        // Tags are pushed to unisdr/undrr-mangrove, which is not publicly
        // readable, and are not all synced to the fork: no public tag URL.
        tagUrl: null,
        changelogUrl: `${PUBLIC_REPO_BLOB_MAIN}CHANGELOG.md#${githubHeadingAnchor(
          line.replace(/^##\s+/, '')
        )}`,
        summary: '',
        changes: [],
      };
      releases.push(currentRelease);
      currentCategory = 'General';
      continue;
    }

    if (!currentRelease) continue;

    // Check for category heading: ### Features, ### Bug fixes, etc.
    const categoryMatch = line.match(/^###\s+(.+)$/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      continue;
    }

    // Check for bullet point: - ... or * ...
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      const text = publicText(bulletMatch[1].trim());

      // Extract title: **Title**
      const titleMatch = text.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/);
      let title = '';
      let description = text;
      if (titleMatch) {
        title = titleMatch[1].trim();
        description = titleMatch[2].trim();
      }

      // PR reference, read from the source line before its link is rewritten:
      // ([#1150](https://github.com/.../pull/1150)) or (#1150)
      const { pr, prRef, prUrl } = pullRequestFields(bulletMatch[1]);

      currentRelease.changes.push({
        category: currentCategory,
        title: title || null,
        description,
        pr,
        prRef,
        prUrl,
        raw: text,
      });
      continue;
    }

    // Extract GitHub release link if present in prose
    const ghReleaseMatch = line.match(
      /\[GitHub Release\]\((https:\/\/github\.com\/[^)]+)\)/
    );
    // A GitHub Release on unisdr/undrr-mangrove is not publicly readable, so
    // only a release published somewhere readable is linked.
    if (ghReleaseMatch && !ghReleaseMatch[1].includes('github.com/unisdr/')) {
      currentRelease.releaseUrl = ghReleaseMatch[1];
    }

    // Prose text before changes constitutes the summary narrative
    if (
      line.trim() &&
      !line.startsWith('#') &&
      currentRelease.changes.length === 0
    ) {
      if (!line.includes('[GitHub Release]')) {
        const prose = publicText(line.trim());
        currentRelease.summary = currentRelease.summary
          ? `${currentRelease.summary} ${prose}`
          : prose;
      }
    }
  }

  return releases;
}

/**
 * Parse a component MDX file's ## Changelog section into structured version entries.
 *
 * @param {string} mdxContent Raw MDX text
 * @returns {Array<object>} Array of component changelog entries
 */
export function parseComponentChangelog(mdxContent) {
  if (!mdxContent) return [];
  const changelogSectionMatch = mdxContent.match(
    /##\s+Changelog\s*\n([\s\S]*?)(?:\n##\s+|$)/i
  );
  if (!changelogSectionMatch) return [];

  const section = changelogSectionMatch[1];
  const entries = [];
  const bulletLines = section.split('\n');

  let currentEntry = null;

  for (const line of bulletLines) {
    // Matches: - **2.4.0**, 2026-09-16: ... or - **2.4.0**, 2026-09-16 ([#1157](url)): ...
    // The older em/en dash separator (`- **2.4.0** — 2026-09-16`) is still accepted.
    const match = line.match(
      /^[-*]\s+\*\*([0-9a-zA-Z.-]+)\*\*(?:(?:\s*,\s*|\s+[—–-]\s+)(\d{4}-\d{2}-\d{2}))?:?\s*(.*)$/
    );
    if (match) {
      const version = match[1];
      const date = match[2] || null;
      const notes = match[3] || '';
      const { pr, prRef, prUrl } = pullRequestFields(notes);

      currentEntry = {
        version,
        date,
        notes: publicText(notes.trim()),
        pr,
        prRef,
        prUrl,
      };
      entries.push(currentEntry);
    } else if (currentEntry && line.trim().startsWith('-')) {
      // Sub-bullet
      if (!currentEntry.details) currentEntry.details = [];
      currentEntry.details.push(
        publicText(line.trim().replace(/^[-*]\s+/, ''))
      );
    } else if (currentEntry && line.trim() && !line.startsWith('#')) {
      // Continuation of notes
      currentEntry.notes += ' ' + publicText(line.trim());
    }
  }

  return entries;
}

/**
 * Build the full releases.json payload combining library releases and component changelogs.
 */
export function buildReleasesManifest({
  changelogPath,
  pkg,
  generatedAt,
  docsBase,
  componentChangelogs = {},
}) {
  const changelogContent = fs.existsSync(changelogPath)
    ? fs.readFileSync(changelogPath, 'utf8')
    : '';

  const releases = parseChangelog(changelogContent);
  const latestRelease =
    releases.find(r => r.version !== 'unreleased') || releases[0] || null;

  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    name: pkg.name,
    version: pkg.version,
    description:
      'Machine-readable release history, tag diffs, and component changelogs for UNDRR Mangrove.',
    _note:
      '100% automated by the build. Generated from CHANGELOG.md and component MDX documentation stories. Do not edit manually.',
    _links: `Pull requests, issues, tags and GitHub Releases are on ${REPO_SLUG}, where changes are merged; it is not publicly readable, so they are given as plain-text references (prRef, such as ${REPO_SLUG}#1234, and tag) with no URL, in the text fields as well. Do not look these numbers up on the public fork, whose numbering is separate. Each release's changelogUrl points at its section of CHANGELOG.md on the public fork, ${PUBLIC_REPO_URL}.`,
    generatedAt: generatedAt || new Date().toISOString(),
    urls: {
      releases: `${docsBase}releases.json`,
      changelog: `${PUBLIC_REPO_BLOB_MAIN}CHANGELOG.md`,
      repository: REPO_URL,
      publicRepository: PUBLIC_REPO_URL,
      releaseNotesV2: `${docsBase}?path=/docs/getting-started-release-notes-v2-0--docs`,
    },
    latest: latestRelease
      ? {
          version: latestRelease.version,
          date: latestRelease.date,
          isPrerelease: latestRelease.isPrerelease,
          tag: latestRelease.tag,
          tagUrl: latestRelease.tagUrl,
          changelogUrl: latestRelease.changelogUrl,
          releaseUrl: latestRelease.releaseUrl || latestRelease.changelogUrl,
          summary: latestRelease.summary,
          changesCount: latestRelease.changes.length,
          changes: latestRelease.changes,
        }
      : null,
    releases,
    componentChangelogs,
  };
}
