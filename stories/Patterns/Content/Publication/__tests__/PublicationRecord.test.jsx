import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { axe } from 'jest-axe';
import { PublicationRecord } from '../PublicationRecord';
import { projectRecord } from '../recordProjection';
import { RECORD_LABELS, exampleRecord, exampleBody } from '../recordFixtures';
import meta, { Minimal, LongCopy } from '../PublicationRecord.stories';

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
  expect(container.querySelectorAll('time')).toHaveLength(1);
  expect(screen.getByText('2025–2030')).toBeInTheDocument();
  const access = screen.getByRole('region', { name: labels.access });
  const description = screen.getByRole('region', { name: labels.description });
  expect(access.compareDocumentPosition(description)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING
  );
  expect(
    screen.getByRole('link', {
      name: 'Lire Comprendre les risques de catastrophe',
    })
  ).toHaveAttribute('hreflang', 'fr');
  expect(container.querySelector('.mg-content')).toHaveAttribute('lang', 'en');
});

test('minimal record omits unknown metadata, media, access and citation without fake status', () => {
  const { container } = render(meta.render(Minimal.args, { globals: {} }));
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
        label: 'Read original',
        href: 'https://example.org/work',
        backup: {
          label: 'Lire la copie',
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
  expect(screen.getByRole('link', { name: 'Read original' })).toHaveAttribute(
    'href',
    'https://example.org/work'
  );
  expect(screen.getByRole('link', { name: 'Lire la copie' })).toHaveAttribute(
    'href',
    '/backup.html'
  );
  expect(screen.getByRole('link', { name: 'Lire la copie' })).toHaveAttribute(
    'hreflang',
    'fr'
  );
  expect(screen.getByRole('link', { name: 'Lire la copie' })).toHaveAttribute(
    'lang',
    'fr'
  );
  expect(
    screen.getByRole('link', { name: 'Read original' })
  ).not.toHaveAttribute('hreflang');
  expect(container.querySelector('time')).toBeNull();
  expect(screen.getByRole('main').querySelectorAll('a')).toHaveLength(3); // category + primary + backup, never a guessed DOI
  expect(
    screen.getByRole('region', { name: labels.access }).textContent
  ).not.toMatch(/PDF|MB|available|last checked/);
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
    document.querySelector('a[href="/publication-record/reading-en.html"]')
  ).not.toBeNull();
});

test.each(Object.keys(RECORD_LABELS))(
  'toolbar %s changes authored interface but preserves English work language',
  locale => {
    const { container } = render(
      meta.render({ record: exampleRecord }, { globals: { locale } })
    );
    expect(
      screen.getByRole('heading', { name: RECORD_LABELS[locale].access })
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
