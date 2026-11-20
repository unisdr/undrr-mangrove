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
} from '../PublicationRecord.stories';

// The stories import browser play checks; Jest renders the stories only.
jest.mock('storybook/test', () => ({}));

const labels = RECORD_LABELS.english;
const renderStory = (story, locale) =>
  render(meta.render(story.args, { globals: locale ? { locale } : {} }));
const access = () => screen.getByRole('region', { name: labels.access });
const rows = () => [...access().querySelectorAll('tbody tr')];
const shown = () => rows().filter(row => !row.hidden);
const toggle = () => access().querySelector('.mg-publication-record__show-all');
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

describe('text filter (11+ files) and collapse', () => {
  test('first 6 rows of the view; the rest behind the toggle with the true count', () => {
    renderStory(ManyFiles);
    expect(rows()).toHaveLength(34);
    expect(shown()).toHaveLength(6);
    expect(toggle().textContent).toBe('Show all 34 files');
    expect(toggle()).toHaveAttribute(
      'data-vf-analytics-label',
      'nav_show_all_downloads'
    );
    fireEvent.click(toggle());
    expect(shown()).toHaveLength(34);
  });

  test('a filter resets the collapse; the text filter combines with language', () => {
    renderStory(ManyFiles);
    fireEvent.click(toggle());
    const input = within(access()).getByRole('searchbox', {
      name: labels.filterFiles,
    });
    expect(input).toHaveAttribute('data-vf-analytics-label', 'nav_filter_text');
    fireEvent.change(input, { target: { value: 'country' } });
    // 26 English annex rows match; collapsed again to 6.
    expect(rows()).toHaveLength(26);
    expect(shown()).toHaveLength(6);
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(toggle().textContent).toBe('Show all 26 files');
    expect(status().textContent).toBe('Showing 26 of 34 files');
    fireEvent.click(radio('es'));
    expect(rows()).toHaveLength(0);
    expect(access().textContent).toContain(labels.noMatch);
    fireEvent.change(input, { target: { value: 'perfil' } });
    expect(rows()).toHaveLength(3);
    expect(toggle()).toBeNull();
  });

  test('"All downloads (N)" resets the filters, opens the list and keeps the anchor', () => {
    renderStory(ManyFiles);
    fireEvent.click(radio('fr'));
    const jump = screen.getByRole('link', { name: 'All downloads (34)' });
    expect(document.querySelector(jump.getAttribute('href'))).toBe(
      screen.getByRole('heading', { name: labels.access, level: 2 })
    );
    fireEvent.click(jump);
    expect(radio('all').checked).toBe(true);
    expect(rows()).toHaveLength(34);
    expect(shown()).toHaveLength(34);
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
  });

  test('"All downloads (N)" also opens an unfiltered collapsed list', () => {
    renderStory(ManyFiles);
    fireEvent.click(screen.getByRole('link', { name: 'All downloads (34)' }));
    expect(shown()).toHaveLength(34);
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

  test('every row and link is present and nothing is hidden', () => {
    expect(doc.querySelectorAll('tbody tr')).toHaveLength(34);
    expect(doc.querySelectorAll('tbody tr[hidden]')).toHaveLength(0);
    expect(
      doc.querySelectorAll('[data-vf-analytics-label^="download_"]').length
    ).toBeGreaterThan(34);
  });

  test('no filter controls or live region render without a script', () => {
    expect(doc.querySelector('.mg-publication-record__filters')).toBeNull();
    expect(doc.querySelector('.mg-publication-record__status')).toBeNull();
  });

  test('the ShowMore toggle ships hidden, items marked, auto-init allowed', () => {
    const button = doc.querySelector('.mg-publication-record__show-all');
    expect(button.hasAttribute('hidden')).toBe(true);
    expect(button.getAttribute('data-mg-show-more-mode')).toBe('items');
    expect(button.hasAttribute('data-mg-show-more-skip-auto-init')).toBe(false);
    expect(button.getAttribute('data-mg-show-more-target')).toBe(
      `#${doc.querySelector('tbody').id}`
    );
    expect(
      doc.querySelectorAll('tbody tr[data-mg-show-more-item]')
    ).toHaveLength(28);
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
      'filterFiles',
      'noMatch',
      'accessShort',
      'watchShort',
      'downloadShort',
      'addedLabel',
    ].forEach(key => expect(typeof set[key]).toBe('string'));
    expect(set.showing.other).toMatch(/\{shown\}/);
    expect(set.added).toBeUndefined();
  });
});
