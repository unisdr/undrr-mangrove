import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PublicationRecord } from '../PublicationRecord';
import {
  COLLAPSE_FROM,
  VISIBLE,
  pluralLabel,
  splitResources,
} from '../recordAccess';
import {
  RECORD_LABELS,
  exampleRecord,
  manyFiles,
  severalFiles,
} from '../recordFixtures';
import meta, { ManyFiles, SeveralFiles } from '../PublicationRecord.stories';

// The stories import browser play checks; Jest renders the stories only.
jest.mock('storybook/test', () => ({}));

const labels = RECORD_LABELS.english;
const files = count => manyFiles.slice(0, count);
const show = resources =>
  render(
    <PublicationRecord
      record={{ ...exampleRecord, resources }}
      labels={labels}
    />
  );
const toggle = container =>
  container.querySelector('.mg-publication-record__show-all');
const more = container =>
  container.querySelector('.mg-publication-record__more-files');
const visibleItems = container =>
  container.querySelectorAll(
    '.mg-publication-record__resources:not(.mg-publication-record__more-files *) > li'
  );

describe('threshold', () => {
  test('is one named constant: collapse from 3, keep 2 in view', () => {
    expect(COLLAPSE_FROM).toBe(3);
    expect(VISIBLE).toBe(2);
  });

  test.each([
    [1, 1, 0],
    [2, 2, 0],
    [3, 2, 1],
    [34, 2, 32],
  ])('%i files: %i visible, %i collapsible', (count, visible, overflow) => {
    const split = splitResources(files(count));
    expect(split.visible).toHaveLength(visible);
    expect(split.overflow).toHaveLength(overflow);
  });

  test('2 files render no toggle and no collapsible container', () => {
    const { container } = show(files(2));
    expect(toggle(container)).toBeNull();
    expect(more(container)).toBeNull();
  });

  test.each([3, 34])(
    '%i files collapse with 2 visible and the true total on the toggle',
    count => {
      const { container } = show(files(count));
      expect(visibleItems(container)).toHaveLength(2);
      expect(more(container).querySelectorAll('li')).toHaveLength(count - 2);
      expect(more(container)).toHaveClass('mg-show-more--collapsed');
      expect(toggle(container).hidden).toBe(false);
      expect(toggle(container).textContent).toBe(`Show all ${count} files`);
      expect(
        screen.getByRole('link', { name: `All downloads (${count})` })
      ).toBeInTheDocument();
    }
  );
});

describe('behaviour', () => {
  test('the toggle opens and closes the collapsible groups', () => {
    const { container } = show(files(34));
    fireEvent.click(toggle(container));
    expect(more(container)).not.toHaveClass('mg-show-more--collapsed');
    expect(toggle(container).textContent).toBe(labels.showFewerFiles);
    fireEvent.click(toggle(container));
    expect(more(container)).toHaveClass('mg-show-more--collapsed');
  });

  test('"All downloads (N)" opens a collapsed list and still jumps to the heading', () => {
    const { container } = show(files(34));
    const jump = screen.getByRole('link', { name: 'All downloads (34)' });
    expect(container.querySelector(jump.getAttribute('href'))).toBe(
      screen.getByRole('heading', { name: labels.access, level: 2 })
    );
    fireEvent.click(jump);
    expect(more(container)).not.toHaveClass('mg-show-more--collapsed');
    // An open list stays open.
    fireEvent.click(jump);
    expect(more(container)).not.toHaveClass('mg-show-more--collapsed');
  });

  test('the cover still targets the first primary resource', () => {
    const { container } = show(files(34));
    expect(
      container.querySelector('.mg-publication-record__cover-link')
    ).toHaveAttribute('href', manyFiles[0].href);
  });

  test('the toggle reports nav_show_all_downloads in both states', () => {
    const { container } = show(files(34));
    const button = toggle(container);
    expect(button).toHaveAttribute(
      'data-vf-analytics-label',
      'nav_show_all_downloads'
    );
    fireEvent.click(button);
    expect(button).toHaveAttribute(
      'data-vf-analytics-label',
      'nav_show_all_downloads'
    );
  });

  test('stories: Several files collapses to 2 of 3; Many files has 34', () => {
    const several = render(meta.render(SeveralFiles.args, { globals: {} }));
    expect(visibleItems(several.container)).toHaveLength(2);
    expect(severalFiles).toHaveLength(3);
    several.unmount();
    const many = render(meta.render(ManyFiles.args, { globals: {} }));
    expect(
      many.container.querySelectorAll('.mg-publication-record__resources > li')
    ).toHaveLength(34);
  });
});

test('without JavaScript the toggle is hidden and every group is open', () => {
  const html = renderToStaticMarkup(
    <PublicationRecord
      record={{ ...exampleRecord, resources: files(34) }}
      labels={labels}
    />
  );
  const document = new DOMParser().parseFromString(html, 'text/html');
  const button = document.querySelector('.mg-publication-record__show-all');
  expect(button.hasAttribute('hidden')).toBe(true);
  expect(button.getAttribute('data-mg-show-more-target')).toBe(
    `#${document.querySelector('.mg-publication-record__more-files').id}`
  );
  expect(
    document.querySelector('.mg-publication-record__more-files').className
  ).not.toMatch(/collapsed/);
  expect(
    document.querySelectorAll('.mg-publication-record__resources > li')
  ).toHaveLength(34);
});

describe('plural toggle labels', () => {
  test.each([
    ['english', 'en', 3, 'Show all 3 files'],
    ['english', 'en', 34, 'Show all 34 files'],
    ['arabic', 'ar', 3, 'عرض جميع الملفات (3)'],
    ['arabic', 'ar', 11, 'عرض جميع الملفات (11)'],
    ['spanish', 'es', 34, 'Mostrar los 34 archivos'],
    ['french', 'fr', 34, 'Afficher les 34 fichiers'],
    ['japanese', 'ja', 34, '34件のファイルをすべて表示'],
    ['chinese', 'zh', 34, '显示全部 34 个文件'],
    ['russian', 'ru', 3, 'Показать все 3 файла'],
    ['russian', 'ru', 5, 'Показать все 5 файлов'],
    ['russian', 'ru', 21, 'Показать все 21 файл'],
    ['russian', 'ru', 34, 'Показать все 34 файла'],
  ])('%s %i', (locale, lang, count, expected) => {
    expect(pluralLabel(RECORD_LABELS[locale].showAllFiles, lang, count)).toBe(
      expected
    );
  });

  test.each(Object.keys(RECORD_LABELS))('%s has both toggle labels', locale => {
    expect(RECORD_LABELS[locale].showAllFiles.other).toMatch(/\{count\}/);
    expect(RECORD_LABELS[locale].showFewerFiles).toBeTruthy();
  });
});
