/**
 * parse-changelog.js — Parser for CHANGELOG.md and component MDX changelogs.
 *
 * Produces structured, machine-readable release and changelog records for:
 *   - releases.json (deployed at root and ai-components/releases.json)
 *   - ai-components/{id}.json (per-component changelog arrays)
 *   - llms.txt & llms.json discovery links
 */

import fs from 'fs';

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
    // ## 2.0.0-beta.3 — 2026-09-15
    // ## 2.0.0 — unreleased
    // ## [1.8.2] — 2026-08-27
    const releaseHeaderMatch = line.match(
      /^##\s+(?:\[?([0-9a-zA-Z.-]+)\]?)(?:\s+[—–-]\s+(\d{4}-\d{2}-\d{2}|unreleased))?/i
    );

    if (releaseHeaderMatch && !line.toLowerCase().startsWith('## unreleased')) {
      const rawVersion = releaseHeaderMatch[1];
      const rawDate =
        releaseHeaderMatch[2] ||
        (line.toLowerCase().includes('unreleased') ? 'unreleased' : null);

      currentRelease = {
        version: rawVersion,
        date: rawDate,
        isPrerelease: /-(alpha|beta|rc)/i.test(rawVersion),
        tag: `v${rawVersion}`,
        tagUrl: `https://github.com/unisdr/undrr-mangrove/releases/tag/v${rawVersion}`,
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
      const text = bulletMatch[1].trim();

      // Extract title: **Title**
      const titleMatch = text.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/);
      let title = '';
      let description = text;
      if (titleMatch) {
        title = titleMatch[1].trim();
        description = titleMatch[2].trim();
      }

      // Extract PR number & URL if present: ([#1150](https://github.com/.../pull/1150)) or (#1150)
      let pr = null;
      let prUrl = null;
      const prMatch =
        text.match(/\[#(\d+)\]\((https:\/\/github\.com\/[^)]+)\)/) ||
        text.match(/\(#(\d+)\)/);
      if (prMatch) {
        pr = parseInt(prMatch[1], 10);
        prUrl =
          prMatch[2] || `https://github.com/unisdr/undrr-mangrove/pull/${pr}`;
      }

      currentRelease.changes.push({
        category: currentCategory,
        title: title || null,
        description,
        pr,
        prUrl,
        raw: text,
      });
      continue;
    }

    // Extract GitHub release link if present in prose
    const ghReleaseMatch = line.match(
      /\[GitHub Release\]\((https:\/\/github\.com\/[^)]+)\)/
    );
    if (ghReleaseMatch) {
      currentRelease.releaseUrl = ghReleaseMatch[1];
    }

    // Prose text before changes constitutes the summary narrative
    if (
      line.trim() &&
      !line.startsWith('#') &&
      currentRelease.changes.length === 0
    ) {
      if (!line.includes('[GitHub Release]')) {
        currentRelease.summary = currentRelease.summary
          ? `${currentRelease.summary} ${line.trim()}`
          : line.trim();
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
    // Matches: - **2.4.0** — 2026-09-16: ... or - **2.4.0** — 2026-09-16 ([#1157](url)): ...
    const match = line.match(
      /^[-*]\s+\*\*([0-9a-zA-Z.-]+)\*\*(?:\s+[—–-]\s+(\d{4}-\d{2}-\d{2}))?:?\s*(.*)$/
    );
    if (match) {
      const version = match[1];
      const date = match[2] || null;
      const notes = match[3] || '';

      let pr = null;
      let prUrl = null;
      const prMatch =
        notes.match(/\[#(\d+)\]\((https:\/\/github\.com\/[^)]+)\)/) ||
        notes.match(/\(#(\d+)\)/);
      if (prMatch) {
        pr = parseInt(prMatch[1], 10);
        prUrl =
          prMatch[2] || `https://github.com/unisdr/undrr-mangrove/pull/${pr}`;
      }

      currentEntry = {
        version,
        date,
        notes: notes.trim(),
        pr,
        prUrl,
      };
      entries.push(currentEntry);
    } else if (currentEntry && line.trim().startsWith('-')) {
      // Sub-bullet
      if (!currentEntry.details) currentEntry.details = [];
      currentEntry.details.push(line.trim().replace(/^[-*]\s+/, ''));
    } else if (currentEntry && line.trim() && !line.startsWith('#')) {
      // Continuation of notes
      currentEntry.notes += ' ' + line.trim();
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
    generatedAt: generatedAt || new Date().toISOString(),
    urls: {
      releases: `${docsBase}releases.json`,
      changelog:
        'https://github.com/unisdr/undrr-mangrove/blob/main/CHANGELOG.md',
      repository: 'https://github.com/unisdr/undrr-mangrove',
      releaseNotesV2: `${docsBase}?path=/docs/getting-started-release-notes-v2-0--docs`,
    },
    latest: latestRelease
      ? {
          version: latestRelease.version,
          date: latestRelease.date,
          isPrerelease: latestRelease.isPrerelease,
          tag: latestRelease.tag,
          tagUrl: latestRelease.tagUrl,
          releaseUrl: latestRelease.releaseUrl || latestRelease.tagUrl,
          summary: latestRelease.summary,
          changesCount: latestRelease.changes.length,
          changes: latestRelease.changes,
        }
      : null,
    releases,
    componentChangelogs,
  };
}
