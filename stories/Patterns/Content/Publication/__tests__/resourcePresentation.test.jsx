import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { PublicationRecord } from '../PublicationRecord';
import { projectRecord } from '../recordProjection';
import { fileMeta, linkVerb, resourceMeta } from '../recordAccess';
import { RECORD_LABELS, exampleRecord } from '../recordFixtures';
import meta, {
  ExternalOnly,
  HostedOnly,
  SeveralFiles,
  Standard,
  Video,
} from '../PublicationRecord.stories';

// The stories import browser play checks; Jest renders the stories only.
jest.mock('storybook/test', () => ({}));

const labels = RECORD_LABELS.english;
const renderStory = (story, locale) =>
  render(meta.render(story.args, { globals: locale ? { locale } : {} }));
const access = () => screen.getByRole('region', { name: labels.access });
const items = () => [
  ...access().querySelectorAll('.mg-publication-record__resources > li'),
];
const metaLines = item =>
  [...item.querySelectorAll('.mg-publication-record__meta')].map(node => ({
    text: node.textContent,
    onBackup: Boolean(node.closest('.mg-publication-record__backup')),
  }));

describe('verbs, file facts and their placement', () => {
  test.each([
    ['https://example.org/report', 'publisher', 'access'],
    ['https://www.youtube.com/watch?v=x', 'publisher', 'watch'],
    ['https://m.youtube.com/watch?v=x', 'publisher', 'watch'],
    ['https://youtu.be/x', 'publisher', 'watch'],
    ['https://vimeo.com/1', 'publisher', 'watch'],
    ['https://notyoutube.com/x', 'publisher', 'access'],
    ['https://www.youtube.com.example.org/x', 'publisher', 'access'],
    ['/media/1/download', 'hosted', 'title'],
    ['https://www.youtube.com/watch?v=x', 'hosted', 'title'],
  ])('%s (%s) uses %s', (href, origin, verb) => {
    expect(linkVerb({ href, origin })).toBe(verb);
  });

  test.each([
    [
      { format: 'PDF', size: '1.6 MB', language: 'English' },
      'PDF, 1.6 MB · English',
    ],
    [{ format: 'PDF', language: 'English' }, 'PDF · English'],
    [{ size: '1.6 MB' }, '1.6 MB'],
    [{ language: 'English' }, 'English'],
    [{}, ''],
  ])('file facts %o read "%s"', (file, expected) => {
    expect(fileMeta(file)).toBe(expected);
  });

  test('with a backup, the facts describe the hosted file and sit on the backup line', () => {
    const [resource] = projectRecord({
      title: 'Work',
      resources: [
        {
          label: 'Work',
          href: 'https://example.org/work',
          language: 'English',
          // A publisher-side format is not moved onto the hosted copy.
          format: 'EPUB',
          backup: { href: '/backup.pdf', format: 'PDF', size: '1.6 MB' },
        },
      ],
    }).resources;
    expect(resourceMeta(resource)).toMatchObject({
      line: 'backup',
      text: 'PDF, 1.6 MB · English',
    });
  });

  test('without a backup, the facts sit on the primary line', () => {
    const [resource] = projectRecord({
      title: 'Work',
      resources: [
        { label: 'Work', href: '/file.pdf', format: 'PDF', size: '2 MB' },
      ],
    }).resources;
    expect(resourceMeta(resource)).toMatchObject({
      line: 'primary',
      text: 'PDF, 2 MB',
    });
  });

  test('a backup needs only a URL; its wording comes from the interface', () => {
    const [resource] = projectRecord({
      title: 'Work',
      resources: [
        {
          label: 'Work',
          href: 'https://example.org/w',
          backup: { href: '/b' },
        },
      ],
    }).resources;
    expect(resource.backup.href).toBe('/b');
  });
});

describe.each(Object.keys(RECORD_LABELS))('%s interface', locale => {
  test.each([Standard, SeveralFiles, HostedOnly, ExternalOnly, Video])(
    'fills every placeholder and keeps the section heading',
    story => {
      const { container } = renderStory(story, locale);
      expect(container.textContent).not.toMatch(/\{(title|date|count)\}/);
      expect(
        screen.getByRole('heading', { name: RECORD_LABELS[locale].access })
      ).toBeInTheDocument();
    }
  );
});

describe('rendered cases', () => {
  test('A. publisher plus backup (Standard)', () => {
    renderStory(Standard);
    const [item] = items();
    const primary = within(item).getByRole('link', {
      name: 'Access Understanding disaster risk (opens in new tab)',
    });
    expect(primary).toHaveAttribute(
      'href',
      'https://example.org/understanding-disaster-risk'
    );
    expect(primary).toHaveAttribute('target', '_blank');
    expect(primary).toHaveAttribute('rel', 'noopener');
    expect(primary).toHaveAttribute(
      'data-vf-analytics-label',
      'download_publisher'
    );
    expect(primary.querySelector('.mg-icon-external-link')).not.toBeNull();
    expect(primary.querySelector('span[lang="en"]').textContent).toBe(
      'Understanding disaster risk'
    );

    // The visible label comes first; the hidden title keeps names unique.
    const backup = within(item).getByRole('link', {
      // The hidden title can add a space before the colon in the computed name.
      name: new RegExp(`^${labels.backupLink} ?: Understanding disaster risk$`),
    });
    expect(backup.textContent.startsWith(labels.backupLink)).toBe(true);
    expect(backup).toHaveAttribute(
      'href',
      '/publication-record/reading-en-backup.html'
    );
    expect(backup).not.toHaveAttribute('target');
    expect(backup).toHaveAttribute(
      'data-vf-analytics-label',
      'download_backup'
    );
    // The facts are on the backup line only.
    expect(metaLines(item)).toEqual([
      { text: 'HTML, 360 bytes · English', onBackup: true },
    ]);

    const details = item.querySelector('details');
    expect(details.open).toBe(false);
    expect(within(details).getByText(labels.backupHelp).tagName).toBe(
      'SUMMARY'
    );
    expect(details.textContent).toContain(labels.backupExplanation);
    const contact = details.querySelector(
      '[data-vf-analytics-label="contact_download_help"]'
    );
    expect(contact).toHaveAttribute('href', 'https://www.undrr.org/contact-us');
    expect(contact).toHaveAccessibleName(
      `${labels.contactUs} (${labels.opensInNewTab})`
    );
    expect(contact).toHaveAttribute('target', '_blank');
    expect(contact).toHaveAttribute('rel', 'noopener');
    // Drupal's full stop follows the link.
    expect(contact.nextSibling.textContent).toBe('.');
    expect(contact).toHaveAttribute(
      'data-vf-analytics-label',
      'contact_download_help'
    );
  });

  test('B. hosted copy only: title as the link, facts on the primary line', () => {
    renderStory(HostedOnly);
    const [item] = items();
    const link = within(item).getByRole('link', {
      name: 'Understanding disaster risk',
    });
    expect(link).not.toHaveAttribute('target');
    expect(link.querySelector('.mg-icon')).toBeNull();
    expect(link).toHaveAttribute(
      'data-vf-analytics-label',
      'download_internal'
    );
    expect(metaLines(item)).toEqual([
      { text: 'HTML, 360 bytes · English', onBackup: false },
    ]);
    expect(item.querySelector('details')).toBeNull();
  });

  test('C. publisher copy only: Access, facts only when known', () => {
    renderStory(ExternalOnly);
    const [item] = items();
    expect(
      within(item).getByRole('link', {
        name: 'Access Understanding disaster risk (opens in new tab)',
      })
    ).toHaveAttribute('data-vf-analytics-label', 'download_publisher');
    expect(metaLines(item)).toEqual([{ text: 'English', onBackup: false }]);
    expect(item.querySelector('details')).toBeNull();
  });

  test('video host: Watch', () => {
    renderStory(Video);
    expect(
      screen.getByRole('link', {
        name: 'Watch Understanding disaster risk: video introduction (opens in new tab)',
      })
    ).toHaveAttribute('data-vf-analytics-label', 'download_publisher');
  });

  test('several files keep their own case and every access link is labelled', () => {
    const { container } = renderStory(SeveralFiles);
    expect(items()).toHaveLength(3);
    expect(access()).toHaveAttribute(
      'data-vf-google-analytics-region',
      'undrr-download-box'
    );
    const names = [...access().querySelectorAll('a')].map(link =>
      link.getAttribute('data-vf-analytics-label')
    );
    expect(names).toEqual([
      'download_publisher',
      'download_backup',
      'contact_download_help',
      'download_publisher',
      'download_backup',
      'contact_download_help',
      'download_internal',
    ]);
    expect(
      container.querySelector('.mg-publication-record__cover-link')
    ).toHaveAttribute(
      'href',
      'https://example.org/understanding-disaster-risk'
    );
    expect(
      screen.getByRole('link', { name: 'All downloads (3)' })
    ).toBeInTheDocument();
  });

  test('backup links have unique accessible names', () => {
    renderStory(SeveralFiles);
    const backups = [
      ...access().querySelectorAll(
        '[data-vf-analytics-label="download_backup"]'
      ),
    ];
    expect(backups.length).toBeGreaterThanOrEqual(2);
    const names = backups.map(link => link.textContent);
    expect(new Set(names).size).toBe(names.length);
    names.forEach(name =>
      expect(name.startsWith(labels.backupLink)).toBe(true)
    );
  });

  test('a backup falls back to its resource language for hreflang and the language name', () => {
    renderStory(SeveralFiles);
    const french = items()[1];
    const backup = french.querySelector(
      '[data-vf-analytics-label="download_backup"]'
    );
    expect(backup).toHaveAttribute('hreflang', 'fr');
    const language = within(french).getByText('Français');
    expect(language).toHaveAttribute('lang', 'fr');
    expect(language.parentElement.textContent).toBe(
      'HTML, 422 bytes · Français'
    );
  });

  test.each([
    ['japanese', '。'],
    ['chinese', '。'],
    ['arabic', '.'],
  ])('%s ends the contact sentence with %s', (locale, mark) => {
    renderStory(Standard, locale);
    const contact = document.querySelector(
      '[data-vf-analytics-label="contact_download_help"]'
    );
    expect(contact.nextSibling.textContent).toBe(mark);
  });

  test('the date line says Added, never Last checked', () => {
    renderStory(Standard);
    const line = access().querySelector('.mg-publication-record__added');
    expect(line.textContent).toBe('Added 15 March 2026');
    expect(line.querySelector('time')).toHaveAttribute(
      'datetime',
      '2026-03-15'
    );
    expect(access().textContent).not.toMatch(/last checked/i);
  });

  test.each([HostedOnly, ExternalOnly, Video, SeveralFiles])(
    'the date line shows in every case, as in Drupal',
    story => {
      renderStory(story);
      expect(
        access().querySelector('.mg-publication-record__added').textContent
      ).toBe('Added 15 March 2026');
    }
  );

  test('no date line without a valid date or without resources', () => {
    const { container, rerender } = render(
      <PublicationRecord
        record={{ ...exampleRecord, resourcesAdded: '15/03/2026' }}
        labels={labels}
      />
    );
    expect(container.querySelector('.mg-publication-record__added')).toBeNull();
    rerender(
      <PublicationRecord
        record={{ ...exampleRecord, resources: [] }}
        labels={labels}
      />
    );
    expect(container.querySelector('.mg-publication-record__added')).toBeNull();
  });

  test('no contact sentence without a contact URL', () => {
    render(
      <PublicationRecord
        record={{ ...exampleRecord, contactHref: undefined }}
        labels={labels}
      />
    );
    const details = document.querySelector('details');
    expect(details.textContent).toBe(
      labels.backupHelp + labels.backupExplanation
    );
  });

  test.each([
    ['arabic', 'الوصول إلى Understanding disaster risk'],
    ['japanese', 'Understanding disaster riskにアクセス'],
    ['chinese', '访问Understanding disaster risk'],
  ])('%s places the title in the verb template', (locale, expected) => {
    renderStory(Standard, locale);
    const link = document.querySelector('.mg-publication-record__primary a');
    expect(link.textContent.startsWith(expected)).toBe(true);
    expect(link.querySelector('span[lang="en"]')).not.toBeNull();
  });

  test('Arabic dates use Latin digits, as Drupal prints them', () => {
    renderStory(Standard, 'arabic');
    const time = document.querySelector('.mg-publication-record__added time');
    expect(time.textContent).toMatch(/15/);
    expect(time.textContent).not.toMatch(/[٠-٩]/);
  });

  test('passes axe with the backup explanation open', async () => {
    const { container } = renderStory(Standard);
    container.querySelector('details').open = true;
    expect(await axe(container)).toHaveNoViolations();
  });
});
