import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { PublicationRecord } from '../PublicationRecord';
import { projectRecord } from '../recordProjection';
import {
  ANALYTICS,
  coverAccess,
  pluralLabel,
  showAllDownloads,
} from '../recordAccess';
import { RECORD_LABELS, exampleRecord, severalFiles } from '../recordFixtures';
import meta, {
  ExternalOnly,
  HostedOnly,
  NoFile,
  SeveralFiles,
  Standard,
  Video,
} from '../PublicationRecord.stories';

// The stories import browser play checks; Jest renders the stories only.
jest.mock('storybook/test', () => ({}));

const labels = RECORD_LABELS.english;
const show = (record, lang = 'en') =>
  render(<PublicationRecord record={record} labels={labels} lang={lang} />);
const coverLink = container =>
  container.querySelector('.mg-publication-record__cover-link');
const firstResourceLink = container =>
  container.querySelector(
    '.mg-publication-record__access-row .mg-publication-record__primary, .mg-publication-record__file-action a'
  );

const publisherWithBackup = {
  title: 'Work',
  cover: { src: '/cover.svg', alt: '' },
  resources: [
    {
      label: 'Read on the publisher site',
      href: 'https://example.org/work',
      backup: { label: 'Backup copy', href: '/backup.pdf' },
    },
    { label: 'Second file', href: '/second.pdf' },
  ],
};

describe('cover target selection', () => {
  test('uses the publisher copy, never the backup, when both exist', () => {
    const access = coverAccess(projectRecord(publisherWithBackup).resources);
    expect(access).toMatchObject({
      href: 'https://example.org/work',
      origin: 'publisher',
      icon: 'external-link',
      analyticsLabel: 'download_publisher_cover',
    });
  });

  test('uses the hosted copy when there is no publisher copy', () => {
    const access = coverAccess(
      projectRecord({
        title: 'Work',
        resources: [{ label: 'File', href: '/file.pdf', lang: 'fr' }],
      }).resources
    );
    expect(access).toMatchObject({
      href: '/file.pdf',
      lang: 'fr',
      origin: 'hosted',
      icon: 'download',
      analyticsLabel: 'download_internal_cover',
    });
  });

  test('an explicit origin wins over the URL shape', () => {
    const { resources } = projectRecord({
      title: 'Work',
      resources: [
        { label: 'A', href: 'https://www.undrr.org/a.pdf', origin: 'hosted' },
        { label: 'B', href: '/b', origin: 'publisher' },
        { label: 'C', href: '/c', origin: 'unknown' },
      ],
    });
    expect(resources.map(resource => resource.origin)).toEqual([
      'hosted',
      'publisher',
      'hosted',
    ]);
  });

  test('an absolute URL with no origin is treated as hosted and warns', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const [resource] = projectRecord({
        title: 'Work',
        resources: [
          { label: 'A', href: 'https://www.undrr.org/media/123/download' },
        ],
      }).resources;
      expect(resource.origin).toBe('hosted');
      expect(coverAccess([resource])).toMatchObject({
        icon: 'download',
        analyticsLabel: 'download_internal_cover',
      });
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toMatch(/has no origin/);
    } finally {
      warn.mockRestore();
    }
  });

  test('a root-relative URL or a supplied origin does not warn', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      projectRecord({
        title: 'Work',
        resources: [
          { label: 'A', href: '/a' },
          { label: 'B', href: 'https://example.org/b', origin: 'publisher' },
          {
            label: 'C',
            href: 'https://example.org/c',
            backup: { label: 'D', href: '/d' },
          },
        ],
      });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  test('a primary with a backup is the publisher copy; the backup is hosted', () => {
    const [resource] = projectRecord({
      title: 'Work',
      resources: [
        { label: 'A', href: '/a', backup: { label: 'B', href: '/b' } },
      ],
    }).resources;
    expect(resource.origin).toBe('publisher');
    expect(resource.backup.origin).toBe('hosted');
  });

  test('no usable resource leaves no target', () => {
    expect(coverAccess([])).toBeUndefined();
    expect(coverAccess(undefined)).toBeUndefined();
    expect(
      coverAccess(
        projectRecord({
          title: 'Work',
          resources: [
            {
              label: 'Unsafe',
              href: 'javascript:x()',
              backup: { label: 'Backup', href: '/b' },
            },
          ],
        }).resources
      )
    ).toBeUndefined();
  });

  test('"All downloads" needs two or more resources', () => {
    expect(showAllDownloads([])).toBe(false);
    expect(showAllDownloads([{}])).toBe(false);
    expect(showAllDownloads([{}, {}])).toBe(true);
  });
});

describe('plural selection', () => {
  const ar = RECORD_LABELS.arabic.allDownloads;
  test.each([
    [0, 'جميع التنزيلات (0)'],
    [1, 'التنزيل (1)'],
    [2, 'كلا التنزيلين (2)'],
    [3, 'جميع التنزيلات (3)'],
    [11, 'جميع التنزيلات (11)'],
    [100, 'جميع التنزيلات (100)'],
  ])('Arabic %i gives the Drupal string', (count, expected) => {
    expect(pluralLabel(ar, 'ar', count)).toBe(expected);
  });

  // The real Arabic strings repeat across categories, so check the category
  // choice with distinct templates.
  test.each([
    [0, 'zero 0'],
    [1, 'one 1'],
    [2, 'two 2'],
    [3, 'few 3'],
    [11, 'many 11'],
    [100, 'other 100'],
    [102, 'other 102'],
  ])('Arabic %i selects its CLDR category', (count, expected) => {
    const forms = Object.fromEntries(
      ['zero', 'one', 'two', 'few', 'many', 'other'].map(key => [
        key,
        `${key} {count}`,
      ])
    );
    expect(pluralLabel(forms, 'ar', count)).toBe(expected);
  });

  test('counts use ASCII digits, as Drupal does, even for ar-EG', () => {
    expect(pluralLabel({ other: '({count})' }, 'ar-EG', 12)).toBe('(12)');
  });

  test.each([
    ['english', 'en', 2, 'All downloads (2)'],
    ['french', 'fr', 1, 'Téléchargement (1)'],
    ['french', 'fr', 2, 'Tous les téléchargements (2)'],
    ['spanish', 'es', 1, 'Descarga (1)'],
    ['spanish', 'es', 4, 'Todas las descargas (4)'],
    ['japanese', 'ja', 3, 'すべてのダウンロード (3)'],
    ['chinese', 'zh', 3, '所有下载文件 (3)'],
  ])('%s', (locale, lang, count, expected) => {
    expect(pluralLabel(RECORD_LABELS[locale].allDownloads, lang, count)).toBe(
      expected
    );
  });

  test('a missing category falls back to other; bad input stays safe', () => {
    expect(pluralLabel({ other: 'N={count}' }, 'ar', 2)).toBe('N=2');
    expect(pluralLabel({ other: 'N={count}' }, 'not a tag!', 2)).toBe('N=2');
    expect(pluralLabel('Fixed {count}', 'en', 5)).toBe('Fixed 5');
    expect(pluralLabel(undefined, 'en', 5)).toBe('');
  });
});

describe('rendered cover link and cue', () => {
  test('several resources: cover duplicates the first link and the cue jumps to the list', () => {
    const { container } = show({ ...exampleRecord, resources: severalFiles });
    const link = coverLink(container);
    expect(link).toHaveAttribute(
      'href',
      firstResourceLink(container).getAttribute('href')
    );
    expect(link.getAttribute('href')).toBe(severalFiles[0].href);
    expect(link).toHaveAttribute('aria-hidden', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    // Same window behaviour as the publisher link it duplicates.
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener');
    expect(link).toHaveAttribute(
      'data-vf-analytics-label',
      'download_publisher_cover'
    );
    expect(link.querySelector('.mg-icon-external-link')).not.toBeNull();
    const cue = screen.getByRole('link', { name: 'All downloads (3)' });
    const target = container.querySelector(cue.getAttribute('href'));
    expect(target).toBe(
      screen.getByRole('heading', { name: labels.access, level: 2 })
    );
    expect(cue).toHaveAttribute(
      'data-vf-analytics-label',
      'nav_all_downloads_cover'
    );
    expect(cue).not.toHaveAttribute('tabindex');
  });

  test('one resource: cover link, no cue', () => {
    const { container } = render(meta.render(HostedOnly.args, { globals: {} }));
    expect(coverLink(container)).not.toBeNull();
    expect(container.textContent).not.toMatch(/All downloads/);
  });

  test('publisher copy only: external icon and publisher labels', () => {
    const { container } = render(
      meta.render(ExternalOnly.args, { globals: {} })
    );
    const link = coverLink(container);
    expect(link).toHaveAttribute(
      'href',
      'https://example.org/understanding-disaster-risk'
    );
    expect(link.querySelector('.mg-icon-external-link')).not.toBeNull();
    expect(link).toHaveAttribute(
      'data-vf-analytics-label',
      'download_publisher_cover'
    );
    expect(firstResourceLink(container)).toHaveAttribute(
      'data-vf-analytics-label',
      'download_publisher'
    );
  });

  test('publisher copy plus backup: cover never points at the backup', () => {
    const { container } = render(meta.render(Standard.args, { globals: {} }));
    const backup = Standard.args.record.resources[0].backup.href;
    expect(coverLink(container).getAttribute('href')).not.toBe(backup);
    expect(coverLink(container).getAttribute('href')).toBe(
      Standard.args.record.resources[0].href
    );
    expect(container.querySelector(`a[href="${backup}"]`)).toHaveAttribute(
      'data-vf-analytics-label',
      'download_backup'
    );
  });

  test('no resources: the cover is not linked and has no analytics region', () => {
    const { container } = render(meta.render(NoFile.args, { globals: {} }));
    expect(container.querySelector('main img')).not.toBeNull();
    expect(coverLink(container)).toBeNull();
    expect(
      container.querySelector('main [data-vf-google-analytics-region]')
    ).toBeNull();
  });

  test('each identifier, author and source resolves its own direction', () => {
    const { container } = show({
      ...exampleRecord,
      identifiers: [
        'رقم الوثيقة',
        '10.21953/researchonline.lse.ac.uk.00138625',
      ],
    });
    const items = container.querySelectorAll('dd li');
    expect(items.length).toBeGreaterThan(3);
    items.forEach(item => expect(item).toHaveAttribute('dir', 'auto'));
  });

  test('informative alt text stays exposed when the cover is linked', () => {
    show({
      ...exampleRecord,
      cover: {
        src: '/cover.svg',
        alt: 'Cover showing a flood map of the delta',
      },
    });
    expect(
      screen.getByRole('img', {
        name: 'Cover showing a flood map of the delta',
      })
    ).toBeInTheDocument();
  });

  test('analytics regions: resource list and cover are separate, labels match the prefix rule', () => {
    const { container } = show(publisherWithBackup);
    const list = container.querySelector(
      `[data-vf-google-analytics-region="${ANALYTICS.region}"]`
    );
    const cover = container.querySelector(
      `[data-vf-google-analytics-region="${ANALYTICS.coverRegion}"]`
    );
    const names = element =>
      [...element.querySelectorAll('[data-vf-analytics-label]')].map(node =>
        node.getAttribute('data-vf-analytics-label')
      );
    expect(names(list)).toEqual([
      'download_publisher',
      'download_backup',
      'download_internal',
    ]);
    expect(names(cover)).toEqual([
      'download_publisher_cover',
      'nav_all_downloads_cover',
    ]);
    const all = [...names(list), ...names(cover)];
    // Downloads start download_, cover clicks contain cover, navigation is nav_.
    expect(all.filter(name => name.startsWith('download_'))).toHaveLength(4);
    expect(
      all.filter(name => name.startsWith('download_') && !/cover/.test(name))
    ).toEqual(names(list));
    expect(all.filter(name => name.startsWith('nav_'))).toEqual([
      'nav_all_downloads_cover',
    ]);
  });

  test('Arabic interface uses the Arabic plural for the cue', () => {
    render(meta.render(SeveralFiles.args, { globals: { locale: 'arabic' } }));
    const aside = document.querySelector('.mg-publication-record__aside');
    expect(
      within(aside).getByRole('link', { name: /^جميع التنزيلات/ })
    ).toBeInTheDocument();
  });

  test.each([
    exampleRecord,
    ExternalOnly.args.record,
    HostedOnly.args.record,
    Video.args.record,
    SeveralFiles.args.record,
  ])('linked cover passes axe', async record => {
    const { container } = show(record);
    expect(await axe(container)).toHaveNoViolations();
  });
});
