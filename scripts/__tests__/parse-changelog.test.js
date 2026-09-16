/** @jest-environment node */

import {
  parseChangelog,
  parseComponentChangelog,
  buildReleasesManifest,
} from '../ai-manifest/parse-changelog.js';

describe('parseChangelog', () => {
  const sampleMarkdown = `
# Changelog

Detailed change records live in two places.

## Unreleased

_Notable cross-cutting changes between releases land here._

## 2.0.0-beta.3 — 2026-09-15

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-beta.3) for full details.

This section is intentionally brief.

- **Sub-brand button tokens** defined secondary button background and hover tokens for PreventionWeb, MCR, and IRP themes. ([#1150](https://github.com/unisdr/undrr-mangrove/pull/1150))
- **Hero title** removed max-width constraint. (#1151)

## 2.0.0 — unreleased

Planning notes for the stable release.

- [2.0.0-beta.3](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-beta.3) (release candidate)

## 1.8.2 — 2026-08-27

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v1.8.2) for full details.

### Features

- **Grid layout extended.** 12 columns with auto-fit. ([#1081](https://github.com/unisdr/undrr-mangrove/pull/1081))

### Bug fixes

- **Card z-index.** No longer conflicts with mega menu. ([#1075](https://github.com/unisdr/undrr-mangrove/pull/1075))
`;

  it('skips undated planning headings such as "2.0.0 — unreleased"', () => {
    const releases = parseChangelog(sampleMarkdown);
    expect(releases.map(release => release.version)).not.toContain('2.0.0');
    expect(releases.find(r => r.version === '1.8.2').changes).toHaveLength(2);
  });

  it('parses releases, tags, prerelease flags, and categories', () => {
    const releases = parseChangelog(sampleMarkdown);

    expect(releases).toHaveLength(2);

    // Beta release
    expect(releases[0].version).toBe('2.0.0-beta.3');
    expect(releases[0].date).toBe('2026-09-15');
    expect(releases[0].isPrerelease).toBe(true);
    expect(releases[0].tag).toBe('v2.0.0-beta.3');
    expect(releases[0].releaseUrl).toBe(
      'https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-beta.3'
    );
    expect(releases[0].summary).toBe('This section is intentionally brief.');
    expect(releases[0].changes).toHaveLength(2);
    expect(releases[0].changes[0]).toEqual({
      category: 'General',
      title: 'Sub-brand button tokens',
      description:
        'defined secondary button background and hover tokens for PreventionWeb, MCR, and IRP themes. ([#1150](https://github.com/unisdr/undrr-mangrove/pull/1150))',
      pr: 1150,
      prUrl: 'https://github.com/unisdr/undrr-mangrove/pull/1150',
      raw: '**Sub-brand button tokens** defined secondary button background and hover tokens for PreventionWeb, MCR, and IRP themes. ([#1150](https://github.com/unisdr/undrr-mangrove/pull/1150))',
    });
    expect(releases[0].changes[1].pr).toBe(1151);

    // Stable release
    expect(releases[1].version).toBe('1.8.2');
    expect(releases[1].date).toBe('2026-08-27');
    expect(releases[1].isPrerelease).toBe(false);
    expect(releases[1].changes).toHaveLength(2);
    expect(releases[1].changes[0].category).toBe('Features');
    expect(releases[1].changes[1].category).toBe('Bug fixes');
  });

  it('returns an empty array on null or empty input', () => {
    expect(parseChangelog('')).toEqual([]);
    expect(parseChangelog(null)).toEqual([]);
  });
});

describe('parseComponentChangelog', () => {
  const sampleMdx = `
# Table Component

## Overview
Some table docs...

## Changelog

- **2.4.0** — 2026-09-16 ([#1157](https://github.com/unisdr/undrr-mangrove/pull/1157)): Added data table modifier and sticky cells.
- **2.3.0** — 2026-09-09: Improved cell spacing.
  - Sub-detail item 1
  - Sub-detail item 2
- **1.0.0**: Initial release.
`;

  it('extracts versioned component changelog entries', () => {
    const entries = parseComponentChangelog(sampleMdx);

    expect(entries).toHaveLength(3);
    expect(entries[0]).toEqual({
      version: '2.4.0',
      date: '2026-09-16',
      notes:
        '([#1157](https://github.com/unisdr/undrr-mangrove/pull/1157)): Added data table modifier and sticky cells.',
      pr: 1157,
      prUrl: 'https://github.com/unisdr/undrr-mangrove/pull/1157',
    });

    expect(entries[1].version).toBe('2.3.0');
    expect(entries[1].details).toEqual([
      'Sub-detail item 1',
      'Sub-detail item 2',
    ]);

    expect(entries[2].version).toBe('1.0.0');
    expect(entries[2].date).toBeNull();
  });

  it('returns empty array when no changelog section exists', () => {
    expect(parseComponentChangelog('# No Changelog Here')).toEqual([]);
    expect(parseComponentChangelog('')).toEqual([]);
  });
});

describe('buildReleasesManifest', () => {
  it('builds a complete releases.json object with latest release and component changelogs', () => {
    const manifest = buildReleasesManifest({
      changelogPath: '/non-existent/CHANGELOG.md',
      pkg: { name: '@undrr/undrr-mangrove', version: '2.0.0-beta.3' },
      generatedAt: '2026-09-16T00:00:00.000Z',
      docsBase: 'https://preventionweb.github.io/undrr-mangrove/',
      componentChangelogs: {
        'components-table': {
          name: 'Table',
          entries: [
            { version: '2.4', date: '2026-09-16', notes: 'Sticky headers' },
          ],
        },
      },
    });

    expect(manifest.$schema).toBe(
      'https://json-schema.org/draft/2020-12/schema'
    );
    expect(manifest.version).toBe('2.0.0-beta.3');
    expect(manifest.urls.releases).toBe(
      'https://preventionweb.github.io/undrr-mangrove/releases.json'
    );
    expect(manifest.componentChangelogs['components-table'].name).toBe('Table');
  });
});
