import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { axe } from 'jest-axe';
import { PublicationRecord } from '../PublicationRecord';
import { projectRecord } from '../recordProjection';
import {
  RECORD_LABELS,
  exampleRecord,
  exampleBody,
  severalFiles,
} from '../recordFixtures';
import meta, * as stories from '../PublicationRecord.stories';
import { checkArticleGridGeometry } from '../../../../Atom/Layout/Grid/gridGeometryChecks';

const { LongCopy } = stories;

// The stories import browser play checks; Jest renders the stories only.
jest.mock('storybook/test', () => ({}));

const labels = RECORD_LABELS.english;
const show = record =>
  render(
    <PublicationRecord record={record} labels={labels}>
      {exampleBody}
    </PublicationRecord>
  );

test('identity roles and early access retain structure and known precision', () => {
  const { container } = show({
    ...exampleRecord,
    resources: severalFiles,
    publicationYear: 2026,
    details: [{ label: 'Policy validity period', value: '2025–2030' }],
  });
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  const authorList = container.querySelector('header dd ul');
  expect(within(authorList).getAllByRole('listitem')).toHaveLength(2);
  expect(container.querySelector('time')).toHaveAttribute('datetime', '2026');
  expect(container.querySelector('main img')).toHaveAttribute(
    'src',
    '/images/teaser-publication-cover.svg'
  );
  expect(container.querySelector('main img')).toHaveAttribute('alt', '');
  // Publication year plus the separate "Added" date of the hosted copies.
  expect(
    [...container.querySelectorAll('time')].map(node => node.dateTime)
  ).toEqual(['2026', '2026-03-15']);
  expect(screen.getByText('2025–2030')).toBeInTheDocument();
  // Several files: the Description comes first, then the files section,
  // reached from the header's "Files (3)" jump link.
  const files = screen.getByRole('region', { name: labels.filesHeading });
  const description = screen.getByRole('region', { name: labels.description });
  expect(description.compareDocumentPosition(files)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING
  );
  const jump = screen.getByRole('link', { name: 'Files (3)' });
  expect(jump.closest('header')).not.toBeNull();
  expect(jump).toHaveAttribute('data-vf-analytics-label', 'nav_files_jump');
  expect(container.querySelector(jump.getAttribute('href'))).toBe(
    screen.getByRole('heading', { name: labels.filesHeading, level: 2 })
  );
  const french = screen.getByRole('link', {
    name: 'Access Comprendre les risques de catastrophe : résumé (opens in new tab)',
  });
  expect(french).toHaveAttribute('hreflang', 'fr');
  expect(french.querySelector('[lang="fr"]')).not.toBeNull();
  expect(container.querySelector('.mg-content')).toHaveAttribute('lang', 'en');
});

test('minimal record omits unknown metadata, media, access and citation without fake status', () => {
  const { container } = render(
    meta.render(
      { record: { title: 'Understanding disaster risk', lang: 'en' } },
      { globals: {} }
    )
  );
  expect(screen.queryByRole('region')).not.toBeInTheDocument();
  expect(container.querySelector('main img')).toBeNull();
  expect(container.querySelector('time')).toBeNull();
  expect(container.querySelector('dl')).toBeNull();
  expect(container.querySelector('.mg-demo-lede')).toBeNull();
  expect(container.textContent).not.toMatch(
    /unavailable|last checked|download|citation/i
  );
});

test.each([
  'javascript:alert(1)',
  '//host/file.pdf',
  '/bad\\path',
  '/with space',
  'data:text/html,a',
  'https://host/\nfile',
])('unsafe primary URL %s cannot promote a backup or invented file', href => {
  const result = projectRecord({
    title: 'Work',
    resources: [
      { label: 'Original', href, backup: { label: 'Backup', href: '/backup' } },
    ],
  });
  expect(result.resources).toEqual([]);
});

test('safe primary and backup keep distinct links; metadata is only supplied information', () => {
  const { container } = show({
    title: 'Work',
    resources: [
      {
        label: 'Original',
        href: 'https://example.org/work',
        backup: {
          href: '/backup.html',
          labelLang: 'fr',
          lang: 'fr',
          format: 'HTML',
          language: 'Français',
        },
      },
    ],
    identifiers: ['10.opaque/not-guessed'],
    publicationYear: 'yesterday',
  });
  const original = screen.getByRole('link', {
    name: 'Access Original (opens in new tab)',
  });
  expect(original).toHaveAttribute('href', 'https://example.org/work');
  expect(original).not.toHaveAttribute('hreflang');
  const backup = screen.getByRole('link', {
    // The hidden title can add a space before the colon in the computed name.
    name: new RegExp(`^${labels.backupLink} ?: Original$`),
  });
  expect(backup).toHaveAttribute('href', '/backup.html');
  expect(backup).toHaveAttribute('hreflang', 'fr');
  // One file: the single access row, language first.
  expect(
    container.querySelector('.mg-publication-record__facts').textContent
  ).toBe('Français · HTML');
  expect(
    container.querySelector('.mg-publication-record__facts [lang]')
  ).toHaveAttribute('lang', 'fr');
  expect(container.querySelector('time')).toBeNull();
  // Category + "Files (1)" jump + primary + backup, never a guessed DOI.
  expect(screen.getByRole('main').querySelectorAll('a')).toHaveLength(4);
  // No invented file facts or status. The backup explanation is fixed copy
  // ("slow or unavailable"), so it is left out of the status check.
  const access = screen.getByRole('region', { name: labels.filesHeading });
  const status = access.cloneNode(true);
  status.querySelectorAll('details').forEach(node => node.remove());
  expect(status.textContent).not.toMatch(/PDF|MB|available|last checked/i);
});

test('supplied citation is verbatim text, never generated HTML or preview identity', () => {
  const citation = 'Approved citation. <script>unsafe()</script>';
  const { container } = show({
    title: 'Work',
    citation,
    canonicalUrl: '/approved-record',
  });
  expect(screen.getByText(citation)).toBeInTheDocument();
  expect(container.querySelector('script')).toBeNull();
  expect(screen.getByRole('link', { name: labels.recordLink })).toHaveAttribute(
    'href',
    '/approved-record'
  );
});

test('server output has usable native content/links and unique instance anchors without hydration', () => {
  const html = renderToStaticMarkup(
    <>
      <PublicationRecord record={exampleRecord} labels={labels} />
      <PublicationRecord record={exampleRecord} labels={labels} />
    </>
  );
  const document = new DOMParser().parseFromString(html, 'text/html');
  const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
  expect(new Set(ids).size).toBe(ids.length);
  document
    .querySelectorAll('[aria-labelledby]')
    .forEach(node =>
      expect(
        document.getElementById(node.getAttribute('aria-labelledby'))
      ).not.toBeNull()
    );
  document
    .querySelectorAll('.mg-skip-link')
    .forEach(link =>
      expect(document.querySelector(link.getAttribute('href'))).not.toBeNull()
    );
  expect(
    document.querySelector(
      'a[href="/publication-record/reading-en-backup.html"]'
    )
  ).not.toBeNull();
});

test.each(Object.keys(RECORD_LABELS))(
  'toolbar %s changes authored interface but preserves English work language',
  locale => {
    const { container } = render(
      meta.render({ record: exampleRecord }, { globals: { locale } })
    );
    expect(
      screen.getByRole('heading', {
        name: RECORD_LABELS[locale].filesHeading,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute(
      'lang',
      'en'
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute(
      'dir',
      'auto'
    );
    expect(container.firstChild).toHaveAttribute(
      'dir',
      locale === 'arabic' ? 'rtl' : 'ltr'
    );
    const related = screen.getByRole('link', {
      name: 'Explore UNDRR publications',
    });
    expect(related).toHaveAttribute('lang', 'en');
    expect(related).toHaveAttribute('dir', 'auto');
  }
);

test.each([exampleRecord, LongCopy.args.record, { title: 'Work' }])(
  'native record semantics pass axe for optional and long content',
  async record => {
    const { container } = show(record);
    expect(await axe(container)).toHaveNoViolations();
  }
);

test('empty original title is omitted; populated historical title retains its known language', () => {
  expect(
    projectRecord({ title: 'Work', originalTitle: { text: ' ' } }).originalTitle
  ).toBeUndefined();
  const { container } = show({
    title: 'Work',
    originalTitle: { text: 'Titre historique', lang: 'fr' },
  });
  expect(screen.getByText('Titre historique')).toHaveAttribute('lang', 'fr');
  expect(container.querySelectorAll('main header p')).toHaveLength(2);
});

test('invalid optional destinations remain text or disappear without leaking unsafe URLs', () => {
  const record = projectRecord({
    title: 'Work',
    canonicalUrl: 'javascript:bad()',
    cover: { src: '//host/image' },
    sources: [{ label: 'Known organization', href: 'data:text/html,x' }],
    related: [{ label: 'Unsafe related', href: '//host/path' }],
  });
  expect(record.canonicalUrl).toBeNull();
  expect(record.cover).toBeUndefined();
  expect(record.sources).toEqual([{ label: 'Known organization', href: null }]);
  expect(record.related).toEqual([]);
  expect(() => projectRecord({ title: ' ' })).toThrow(/approved title/);
});

test('every record story runs the article grid check (#1504)', () => {
  // A story-level play replaces the meta play, so it must wrap the check.
  expect(meta.play).toBe(checkArticleGridGeometry);
  const named = Object.entries(stories).filter(([name]) => name !== 'default');
  expect(named.length).toBeGreaterThan(8);
  named.forEach(([name, story]) => {
    expect([name, story.play ? story.play.runsGridCheck : true]).toEqual([
      name,
      true,
    ]);
  });
});
