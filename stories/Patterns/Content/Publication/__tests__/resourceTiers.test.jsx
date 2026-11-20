import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { PublicationRecord } from '../PublicationRecord';
import {
  LANGUAGE_FILTER_FROM,
  LANGUAGE_SELECT_FROM,
  PREVIEW_ROWS,
  TABLE_FROM,
  TEXT_FILTER_FROM,
  TIER3_FROM,
  fileFacts,
  filterResources,
  isCollapsedRow,
  languageGroups,
  linkVerb,
  presentation,
} from '../recordAccess';
import {
  RECORD_LABELS,
  exampleRecord,
  manyFiles,
  manyLanguages,
  severalFiles,
  twoFiles,
} from '../recordFixtures';
import meta, {
  ExternalOnly,
  HostedOnly,
  ManyFiles,
  ManyLanguages,
  SeveralFiles,
  Standard,
  TwoFiles,
  Video,
} from '../PublicationRecord.stories';

// The stories import browser play checks; Jest renders the stories only.
jest.mock('storybook/test', () => ({}));

const labels = RECORD_LABELS.english;
const renderStory = (story, locale) =>
  render(meta.render(story.args, { globals: locale ? { locale } : {} }));
const access = () => screen.getByRole('region', { name: labels.access });
const english = (count, extra = {}) =>
  Array.from({ length: count }, (_, index) => ({
    label: `File ${index + 1}`,
    href: `/f${index + 1}`,
    origin: 'hosted',
    language: 'English',
    lang: 'en',
    ...extra,
  }));

describe('tier rules', () => {
  test('thresholds are named constants', () => {
    expect({
      TABLE_FROM,
      TIER3_FROM,
      TEXT_FILTER_FROM,
      LANGUAGE_FILTER_FROM,
      LANGUAGE_SELECT_FROM,
      PREVIEW_ROWS,
    }).toEqual({
      TABLE_FROM: 2,
      TIER3_FROM: 6,
      TEXT_FILTER_FROM: 11,
      LANGUAGE_FILTER_FROM: 2,
      LANGUAGE_SELECT_FROM: 6,
      PREVIEW_ROWS: 6,
    });
  });

  test.each([
    [0, 0, 'none', false],
    [1, 1, 'none', false],
    [2, 2, 'none', false],
    [5, 2, 'none', false],
    [6, 3, 'none', false], // one language: no language filter
    [10, 3, 'none', false],
    [11, 4, 'none', true],
    [34, 4, 'none', true],
  ])('%i files in one language: tier %i', (count, tier, filter, text) => {
    const view = presentation(english(count));
    expect(view.tier).toBe(tier);
    expect(view.languageFilter).toBe(filter);
    expect(view.textFilter).toBe(text);
  });

  test('two languages make a two-file record tier 3 with buttons', () => {
    const view = presentation([
      ...english(1),
      { label: 'Fichier', href: '/fr', language: 'Français', lang: 'fr' },
    ]);
    expect(view.tier).toBe(3);
    expect(view.languageFilter).toBe('buttons');
  });

  test('a single file is tier 1 whatever its language', () => {
    expect(presentation(manyLanguages.slice(0, 1)).tier).toBe(1);
  });

  test.each([
    [5, 'buttons'],
    [6, 'select'],
    [7, 'select'],
  ])('%i languages use %s', (count, kind) => {
    expect(presentation(manyLanguages.slice(0, count)).languageFilter).toBe(
      kind
    );
  });

  test('stories land in the intended tiers', () => {
    expect(presentation(exampleRecord.resources).tier).toBe(1);
    expect(presentation(twoFiles).tier).toBe(2);
    expect(presentation(severalFiles).tier).toBe(3);
    expect(presentation(manyFiles).tier).toBe(4);
    expect(presentation(manyLanguages).languageFilter).toBe('select');
  });

  test('language groups keep first-appearance order with counts', () => {
    expect(
      languageGroups(manyFiles).map(group => [group.key, group.count])
    ).toEqual([
      ['en', 27],
      ['fr', 4],
      ['es', 3],
    ]);
    // A resource with no language appears only under "All".
    expect(languageGroups([{ label: 'x', href: '/x' }])).toEqual([]);
  });

  test.each([
    [6, 5, false],
    [7, 5, false],
    [7, 6, true],
    [34, 33, true],
  ])('a view of %i rows collapses row %i: %s', (total, position, hidden) => {
    expect(isCollapsedRow(position, total)).toBe(hidden);
  });
});

describe('filtering', () => {
  test('language and text filters combine, ignoring case and accents', () => {
    const fr = filterResources(manyFiles, { language: 'fr' });
    expect(fr).toHaveLength(4);
    expect(filterResources(manyFiles, { query: 'ANNEXE' })).toEqual(fr);
    expect(
      filterResources(manyFiles, { language: 'es', query: 'anexo 9' })
    ).toEqual([9]);
    expect(filterResources(manyFiles, { query: 'pais' })).toHaveLength(3);
    expect(filterResources(manyFiles, { query: 'nothing here' })).toEqual([]);
  });

  test('sizes are not searched', () => {
    expect(filterResources(manyFiles, { query: '422' })).toEqual([]);
  });
});

describe('tier 1: one access row', () => {
  test.each([
    [
      Standard,
      'Access Understanding disaster risk (opens in new tab)',
      'download_publisher',
    ],
    [
      ExternalOnly,
      'Access Understanding disaster risk (opens in new tab)',
      'download_publisher',
    ],
    [
      Video,
      'Watch Understanding disaster risk: video introduction (opens in new tab)',
      'download_publisher',
    ],
    [HostedOnly, 'Understanding disaster risk', 'download_internal'],
  ])('%#: the primary link', (story, name, analytics) => {
    renderStory(story);
    expect(access().querySelector('table')).toBeNull();
    expect(within(access()).getByRole('link', { name })).toHaveAttribute(
      'data-vf-analytics-label',
      analytics
    );
  });

  test('facts read language · format, size; the backup is an icon link with a full name', () => {
    renderStory(Standard);
    expect(
      access().querySelector('.mg-publication-record__facts').textContent
    ).toBe('English · HTML, 360 bytes');
    const backup = within(access()).getByRole('link', {
      name: /^Download a backup copy hosted by this site ?: Understanding disaster risk$/,
    });
    expect(backup).toHaveAttribute(
      'data-vf-analytics-label',
      'download_backup'
    );
    expect(backup.querySelector('.mg-icon-download')).not.toBeNull();
  });

  test('publisher-only shows facts only when known', () => {
    renderStory(ExternalOnly);
    expect(
      access().querySelector('.mg-publication-record__facts').textContent
    ).toBe('English');
    expect(access().querySelector('details')).toBeNull();
  });
});

describe('tiers 2–4: the table', () => {
  test('caption, column headers and row headers', () => {
    renderStory(TwoFiles);
    const table = within(access()).getByRole('table', {
      name: labels.caption,
    });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map(cell => cell.textContent)
    ).toEqual(['Title', 'Format / size', 'Original', 'Backup']);
    expect(
      within(table)
        .getAllByRole('rowheader')
        .map(cell => cell.textContent)
    ).toEqual([
      'Understanding disaster risk',
      'Understanding disaster risk: plain-text edition',
    ]);
    table
      .querySelectorAll('thead th')
      .forEach(cell => expect(cell).toHaveAttribute('scope', 'col'));
    table
      .querySelectorAll('tbody th')
      .forEach(cell => expect(cell).toHaveAttribute('scope', 'row'));
  });

  test('one language drops the Language column; two languages show it under All', () => {
    renderStory(SeveralFiles);
    expect(
      within(access())
        .getAllByRole('columnheader')
        .map(cell => cell.textContent)
    ).toEqual(['Title', 'Language', 'Format / size', 'Original', 'Backup']);
  });

  test('actions name their file; hosted-only rows say Download and have no backup', () => {
    renderStory(TwoFiles);
    expect(
      within(access()).getByRole('link', {
        name: 'Access Understanding disaster risk (opens in new tab)',
      })
    ).toHaveAttribute('target', '_blank');
    const download = within(access()).getByRole('link', {
      name: 'Download Understanding disaster risk: plain-text edition',
    });
    expect(download).toHaveAttribute(
      'data-vf-analytics-label',
      'download_internal'
    );
    expect(download).not.toHaveAttribute('target');
    const lastRow = access().querySelectorAll('tbody tr')[1];
    expect(
      lastRow.querySelector('.mg-publication-record__file-backup').textContent
    ).toBe('—');
    expect(
      lastRow.querySelector('.mg-publication-record__file-backup [aria-hidden]')
    ).not.toBeNull();
  });

  test('backup links have unique names', () => {
    renderStory(ManyFiles);
    const names = [
      ...access().querySelectorAll(
        '[data-vf-analytics-label="download_backup"]'
      ),
    ].map(link => link.textContent);
    expect(names.length).toBeGreaterThan(20);
    expect(new Set(names).size).toBe(names.length);
  });

  test('formats and sizes are isolated for RTL; titles carry their language', () => {
    renderStory(SeveralFiles, 'arabic');
    const row = screen
      .getByRole('region', { name: RECORD_LABELS.arabic.access })
      .querySelectorAll('tbody tr')[1];
    expect(
      row.querySelector('.mg-publication-record__file-facts bdi').textContent
    ).toBe('HTML, 422 bytes');
    expect(
      row.querySelector('th span[lang="fr"][dir="auto"]').textContent
    ).toBe('Comprendre les risques de catastrophe : résumé');
  });
});

describe('shared parts', () => {
  test('one shared backup explanation, only when a resource has a backup', () => {
    renderStory(ManyFiles);
    expect(access().querySelectorAll('details')).toHaveLength(1);
    expect(access().querySelector('details summary').textContent).toBe(
      labels.backupHelp
    );
  });

  test.each([HostedOnly, ExternalOnly, Video])(
    'no backup, no explanation (%#)',
    story => {
      renderStory(story);
      expect(access().querySelector('details')).toBeNull();
    }
  );

  test('"Added" moves into Bibliographic details', () => {
    renderStory(Standard);
    expect(access().textContent).not.toMatch(/Added|Last checked/);
    const details = screen.getByRole('region', { name: labels.details });
    expect(within(details).getByText('Added')).toBeInTheDocument();
    expect(details.querySelector('time')).toHaveAttribute(
      'datetime',
      '2026-03-15'
    );
    expect(details.querySelector('time').textContent).toBe('15 March 2026');
  });

  test.each(Object.keys(RECORD_LABELS))(
    '%s: every tier fills its placeholders',
    locale => {
      [Standard, TwoFiles, SeveralFiles, ManyFiles, ManyLanguages].forEach(
        story => {
          const { container, unmount } = renderStory(story, locale);
          expect(container.textContent).not.toMatch(
            /\{(title|date|count|shown|total)\}/
          );
          unmount();
        }
      );
    }
  );

  test.each([Standard, TwoFiles, SeveralFiles, ManyFiles, ManyLanguages])(
    'passes axe (%#)',
    async story => {
      const { container } = renderStory(story);
      expect(await axe(container)).toHaveNoViolations();
    }
  );

  test('file facts come from the hosted backup when there is one', () => {
    expect(
      fileFacts({
        format: 'EPUB',
        language: 'English',
        backup: { format: 'PDF', size: '1.6 MB' },
      })
    ).toMatchObject({ facts: 'PDF, 1.6 MB', language: 'English' });
    expect(linkVerb({ origin: 'hosted', href: '/x' })).toBe('title');
  });
});
