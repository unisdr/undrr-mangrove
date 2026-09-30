/** @jest-environment node */

import fs from 'fs';
import path from 'path';
import {
  findPrivateLinks,
  githubHeadingAnchor,
  privateGithubRef,
  toPublicMarkdown,
} from '../ai-manifest/repo.js';
import {
  buildReleasesManifest,
  parseComponentChangelog,
} from '../ai-manifest/parse-changelog.js';

const root = path.resolve(__dirname, '../..');

describe('privateGithubRef', () => {
  it('names a pull request or issue on the unisdr organization', () => {
    expect(
      privateGithubRef('https://github.com/unisdr/undrr-mangrove/pull/1317')
    ).toBe('unisdr/undrr-mangrove#1317');
    expect(
      privateGithubRef('https://github.com/unisdr/undrr-mangrove/issues/906')
    ).toBe('unisdr/undrr-mangrove#906');
  });

  it('returns null for anything else', () => {
    expect(
      privateGithubRef('https://github.com/PreventionWeb/undrr-mangrove/pull/1')
    ).toBeNull();
    expect(
      privateGithubRef(
        'https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0'
      )
    ).toBeNull();
    expect(privateGithubRef(undefined)).toBeNull();
  });
});

describe('toPublicMarkdown', () => {
  it('turns pull request and issue links into plain references', () => {
    expect(
      toPublicMarkdown(
        'Fixed. ([#1249](https://github.com/unisdr/undrr-mangrove/pull/1249), [#1196](https://github.com/unisdr/undrr-mangrove/issues/1196))'
      )
    ).toBe('Fixed. (unisdr/undrr-mangrove#1249, unisdr/undrr-mangrove#1196)');
  });

  it('keeps a descriptive label beside the reference', () => {
    expect(
      toPublicMarkdown(
        '[2.0.0-alpha.1](https://github.com/unisdr/undrr-mangrove/pull/1061)'
      )
    ).toBe('2.0.0-alpha.1 (unisdr/undrr-mangrove#1061)');
  });

  it('keeps the text of a release or comparison link and drops the URL', () => {
    expect(
      toPublicMarkdown(
        '[2.0.0-rc.3](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-rc.3) and [the diff](https://github.com/unisdr/undrr-mangrove/compare/v1.4.0...v1.5.0)'
      )
    ).toBe('2.0.0-rc.3 and the diff');
  });

  it('moves file links on the default branch to the public fork', () => {
    expect(
      toPublicMarkdown(
        'See [the scrim](https://github.com/unisdr/undrr-mangrove/blob/main/docs/COLOUR-CONTRAST-METHODOLOGY.md#the-hero-scrim).'
      )
    ).toBe(
      'See [the scrim](https://github.com/PreventionWeb/undrr-mangrove/blob/main/docs/COLOUR-CONTRAST-METHODOLOGY.md#the-hero-scrim).'
    );
  });

  it('unlinks bare and angle-bracket URLs', () => {
    expect(
      toPublicMarkdown(
        'See https://github.com/unisdr/undrr-mangrove/issues/906 and <https://github.com/unisdr/undrr-mangrove/releases>.'
      )
    ).toBe('See unisdr/undrr-mangrove#906 and unisdr/undrr-mangrove/releases.');
  });

  it('leaves text with no unisdr link untouched', () => {
    const text = '[#1](https://github.com/PreventionWeb/undrr-mangrove/pull/1)';
    expect(toPublicMarkdown(text)).toBe(text);
    expect(toPublicMarkdown(null)).toBeNull();
  });
});

describe('githubHeadingAnchor', () => {
  it('matches the anchors GitHub renders for CHANGELOG.md headings', () => {
    expect(githubHeadingAnchor('2.0.0, 2026-09-24')).toBe('200-2026-09-24');
    expect(githubHeadingAnchor('2.0.0-beta.3, 2026-09-15')).toBe(
      '200-beta3-2026-09-15'
    );
    expect(githubHeadingAnchor('[1.8.2], 2026-08-27')).toBe('182-2026-08-27');
  });
});

describe('findPrivateLinks', () => {
  it('allows only the canonical repository identity field', () => {
    const json = JSON.stringify({
      repository: 'https://github.com/unisdr/undrr-mangrove',
      publicRepository: 'https://github.com/PreventionWeb/undrr-mangrove',
    });
    expect(findPrivateLinks(json)).toEqual([]);
  });

  it('reports any other unisdr URL', () => {
    expect(
      findPrivateLinks(
        '{"prUrl": "https://github.com/unisdr/undrr-mangrove/pull/1150"}'
      )
    ).toEqual(['https://github.com/unisdr/undrr-mangrove/pull/1150']);
  });
});

describe('releases.json from the repository sources', () => {
  function mdxFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return mdxFiles(full);
      return entry.name.endsWith('.mdx') ? [full] : [];
    });
  }

  it('links nothing on the unisdr organization', () => {
    const componentChangelogs = {};
    for (const file of mdxFiles(path.join(root, 'stories'))) {
      const entries = parseComponentChangelog(fs.readFileSync(file, 'utf8'));
      if (entries.length > 0) {
        componentChangelogs[path.relative(root, file)] = { entries };
      }
    }
    expect(Object.keys(componentChangelogs).length).toBeGreaterThan(0);

    const manifest = buildReleasesManifest({
      changelogPath: path.join(root, 'CHANGELOG.md'),
      pkg: { name: '@undrr/undrr-mangrove', version: '0.0.0' },
      generatedAt: '2026-01-01T00:00:00.000Z',
      docsBase: 'https://mangrove.undrr.org/',
      componentChangelogs,
    });
    expect(manifest.releases.length).toBeGreaterThan(0);

    expect(findPrivateLinks(JSON.stringify(manifest, null, 2))).toEqual([]);
  });
});
