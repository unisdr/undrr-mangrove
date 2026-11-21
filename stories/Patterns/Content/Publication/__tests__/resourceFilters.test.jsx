import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PublicationRecord } from '../PublicationRecord';
import { pluralLabel } from '../recordAccess';
import { RECORD_LABELS, exampleRecord, manyFiles } from '../recordFixtures';
import meta, {
  ManyFiles,
  ManyLanguages,
  SeveralFiles,
  Standard,
  TwoFiles,
} from '../PublicationRecord.stories';

// The stories import browser play checks; Jest renders the stories only.
jest.mock('storybook/test', () => ({}));

const labels = RECORD_LABELS.english;
const renderStory = (story, locale) =>
  render(meta.render(story.args, { globals: locale ? { locale } : {} }));
const access = () => screen.getByRole('region', { name: labels.filesHeading });
const rows = () => [...access().querySelectorAll('tbody tr')];
const status = () => access().querySelector('.mg-publication-record__status');
const radio = value =>
  access().querySelector(
    `.mg-publication-record__language-filter input[value="${value}"]`
  );

describe('language buttons (a native radio group)', () => {
  test('All plus each language, with counts, and the analytics label', () => {
    renderStory(SeveralFiles);
    const group = within(access()).getByRole('group', {
      name: labels.languageLabel,
    });
    expect(
      within(group)
        .getAllByRole('radio')
        .map(input => input.labels[0].textContent)
    ).toEqual(['All (3)', 'English (2)', 'Français (1)']);
    expect(radio('all').checked).toBe(true);
    expect(radio('fr')).toHaveAttribute(
      'data-vf-analytics-label',
      'nav_filter_language: fr'
    );
    expect(radio('fr').getAttribute('data-vf-analytics-label')).not.toMatch(
      /^download_/
    );
  });

  test('filtering keeps focus, hides the Language column and announces the count', () => {
    renderStory(SeveralFiles);
    radio('fr').focus();
    fireEvent.click(radio('fr'));
    expect(document.activeElement).toBe(radio('fr'));
    expect(rows()).toHaveLength(1);
    expect(
      within(access())
        .getAllByRole('columnheader')
        .map(cell => cell.textContent)
    ).not.toContain('Language');
    expect(status()).toHaveAttribute('aria-live', 'polite');
    expect(status().textContent).toBe('Showing 1 of 3 files');
  });

  test('the cover keeps the first resource whatever the filter', () => {
    const { container } = renderStory(SeveralFiles);
    fireEvent.click(radio('fr'));
    expect(
      container.querySelector('.mg-publication-record__cover-link')
    ).toHaveAttribute('href', SeveralFiles.args.record.resources[0].href);
  });
});

describe('language select (6+ languages)', () => {
  test('a native select labelled Language, All languages first', () => {
    renderStory(ManyLanguages);
    const select = within(access()).getByRole('combobox', {
      name: labels.languageLabel,
    });
    expect(select.options[0].textContent).toBe('All languages (7)');
    expect(select).toHaveAttribute(
      'data-vf-analytics-label',
      'nav_filter_language'
    );
    fireEvent.change(select, { target: { value: 'zh' } });
    expect(rows()).toHaveLength(1);
    expect(status().textContent).toBe('Showing 1 of 7 files');
  });
});

describe('every row, no collapse', () => {
  test('Many files (34) shows the full table; filtering keeps every matching row', () => {
    renderStory(ManyFiles);
    expect(rows()).toHaveLength(34);
    expect(rows().filter(row => row.hidden)).toHaveLength(0);
    expect(
      access().querySelector('.mg-publication-record__show-all')
    ).toBeNull();
    expect(access().querySelector('input[type="search"]')).toBeNull();
    fireEvent.click(radio('en'));
    expect(rows()).toHaveLength(27);
    expect(status().textContent).toBe('Showing 27 of 34 files');
  });

  test('"All downloads (N)" resets the language to All and keeps the anchor', () => {
    renderStory(ManyFiles);
    fireEvent.click(radio('fr'));
    expect(rows()).toHaveLength(4);
    const jump = screen.getByRole('link', { name: 'All downloads (34)' });
    expect(document.querySelector(jump.getAttribute('href'))).toBe(
      screen.getByRole('heading', { name: labels.filesHeading, level: 2 })
    );
    fireEvent.click(jump);
    expect(radio('all').checked).toBe(true);
    expect(rows()).toHaveLength(34);
    expect(status().textContent).toBe('');
  });
});

describe('order and the inline language control', () => {
  const regions = () =>
    screen
      .getAllByRole('region')
      .map(region => region.getAttribute('aria-labelledby'))
      .map(id => document.getElementById(id).textContent);

  test.each([Standard, TwoFiles, SeveralFiles, ManyFiles])(
    'every tier: Description first, then Files, with a header jump link (%#)',
    story => {
      renderStory(story);
      const order = regions();
      expect(order.indexOf(labels.description)).toBeLessThan(
        order.indexOf(labels.filesHeading)
      );
      const count = story.args.record.resources.length;
      // "File (1)" for one file, "Files (N)" otherwise.
      const jump = screen.getByRole('link', {
        name: pluralLabel(labels.filesJump, 'en', count),
      });
      expect(jump.closest('header')).not.toBeNull();
      expect(jump).toHaveAttribute('data-vf-analytics-label', 'nav_files_jump');
      expect(document.querySelector(jump.getAttribute('href'))).toBe(
        screen.getByRole('heading', { name: labels.filesHeading, level: 2 })
      );
    }
  );

  test('the button group sits in the heading row, named "Language", with a decorative icon', () => {
    renderStory(SeveralFiles);
    const head = access().querySelector('.mg-publication-record__access-head');
    expect(head.querySelector('h2').textContent).toBe(labels.filesHeading);
    const group = within(head).getByRole('group', { name: 'Language' });
    expect(group.querySelector('legend')).toHaveClass('mg-u-sr-only');
    const icon = head.querySelector('.mg-icon-languages');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  test('the select sits in the heading row with a visually hidden "Language" label', () => {
    renderStory(ManyLanguages);
    const head = access().querySelector('.mg-publication-record__access-head');
    const select = within(head).getByRole('combobox', { name: 'Language' });
    expect(select.labels[0]).toHaveClass('mg-u-sr-only');
    expect(head.querySelector('.mg-icon-languages')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  test.each([
    ['arabic', 'ar', 3, 'الملفات (3)'],
    ['arabic', 'ar', 2, 'الملفان (2)'],
    ['french', 'fr', 3, 'Fichiers (3)'],
    ['japanese', 'ja', 3, 'ファイル (3)'],
    ['english', 'en', 1, 'File (1)'],
    ['french', 'fr', 1, 'Fichier (1)'],
    ['spanish', 'es', 1, 'Archivo (1)'],
    ['arabic', 'ar', 1, 'الملف (1)'],
    ['russian', 'ru', 1, 'Файлы (1)'],
    ['chinese', 'zh', 1, '文件 (1)'],
  ])('%s jump link for %i files', (locale, lang, count, expected) => {
    expect(pluralLabel(RECORD_LABELS[locale].filesJump, lang, count)).toBe(
      expected
    );
  });
});

describe('vanilla contract: server output without JavaScript', () => {
  const html = renderToStaticMarkup(
    <PublicationRecord
      record={{ ...exampleRecord, resources: manyFiles }}
      labels={labels}
    />
  );
  const doc = new DOMParser().parseFromString(html, 'text/html');

  test('every row and link is present and nothing is hidden or collapsible', () => {
    expect(doc.querySelectorAll('tbody tr')).toHaveLength(34);
    expect(doc.querySelectorAll('tbody tr[hidden]')).toHaveLength(0);
    expect(doc.querySelector('[data-mg-show-more]')).toBeNull();
    expect(
      doc.querySelectorAll('[data-vf-analytics-label^="download_"]').length
    ).toBeGreaterThan(34);
  });

  test('no filter controls or live region render without a script', () => {
    expect(doc.querySelector('.mg-publication-record__filters')).toBeNull();
    expect(doc.querySelector('.mg-publication-record__status')).toBeNull();
  });
});

describe('labels', () => {
  test.each([
    ['english', 'en', 'Showing {shown} of 34 files'],
    ['arabic', 'ar', 'عرض {shown} من أصل 34'],
    ['japanese', 'ja', '34件中{shown}件を表示'],
  ])('%s "Showing" uses the total for plurals', (locale, lang, expected) => {
    expect(
      pluralLabel(RECORD_LABELS[locale].showing, lang, 34).replace(
        '{total}',
        '34'
      )
    ).toBe(expected);
  });

  test.each(Object.keys(RECORD_LABELS))('%s has every new label', locale => {
    const set = RECORD_LABELS[locale];
    [
      'caption',
      'colTitle',
      'colLanguage',
      'colFormat',
      'colOriginal',
      'colBackup',
      'allCount',
      'allLanguages',
      'languageLabel',
      'accessShort',
      'watchShort',
      'downloadShort',
      'addedLabel',
      'filesHeading',
      'downloadOptions',
    ].forEach(key => expect(typeof set[key]).toBe('string'));
    expect(set.showing.other).toMatch(/\{shown\}/);
    expect(set.filesJump.other).toMatch(/\{count\}/);
    expect(set.added).toBeUndefined();
    // "Read or access this publication" is gone: every record says "Files".
    expect(set.access).toBeUndefined();
  });
});
