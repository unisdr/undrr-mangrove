import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PublicationRecord } from '../PublicationRecord';
import {
  COLLAPSE_FROM,
  VISIBLE,
  isCollapsible,
  pluralLabel,
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
const allItems = container =>
  container.querySelectorAll('.mg-publication-record__resources > li');
const shownItems = container =>
  [...allItems(container)].filter(item => !item.hasAttribute('hidden'));

describe('threshold', () => {
  test('is one named constant: collapse from 3, keep 2 in view', () => {
    expect(COLLAPSE_FROM).toBe(3);
    expect(VISIBLE).toBe(2);
  });

  test.each([
    [1, 0],
    [2, 0],
    [3, 1],
    [34, 32],
  ])('%i files: %i collapsible', (count, collapsible) => {
    const marked = Array.from({ length: count }, (_, index) =>
      isCollapsible(index, count)
    ).filter(Boolean);
    expect(marked).toHaveLength(collapsible);
  });

  test('2 files render no toggle and nothing hidden', () => {
    const { container } = show(files(2));
    expect(toggle(container)).toBeNull();
    expect(container.querySelector('[data-mg-show-more-item]')).toBeNull();
  });

  test.each([3, 34])(
    '%i files: one list, 2 shown, the rest hidden until found',
    count => {
      const { container } = show(files(count));
      expect(
        container.querySelectorAll('.mg-publication-record__resources')
      ).toHaveLength(1);
      expect(allItems(container)).toHaveLength(count);
      expect(shownItems(container)).toHaveLength(2);
      [...allItems(container)].slice(2).forEach(item => {
        expect(item).toHaveAttribute('data-mg-show-more-item');
        expect(item).toHaveAttribute('hidden', 'until-found');
      });
      // Hidden groups leave the accessibility tree.
      expect(screen.getAllByRole('listitem', { hidden: false })).toEqual(
        expect.arrayContaining(shownItems(container))
      );
      const button = toggle(container);
      expect(button.hidden).toBe(false);
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute(
        'aria-controls',
        container.querySelector('.mg-publication-record__resources').id
      );
      expect(button.textContent).toBe(`Show all ${count} files`);
      expect(
        screen.getByRole('link', { name: `All downloads (${count})` })
      ).toBeInTheDocument();
    }
  );
});

describe('behaviour', () => {
  test('the toggle opens and closes the hidden groups, with aria-expanded', () => {
    const { container } = show(files(34));
    const button = toggle(container);
    fireEvent.click(button);
    expect(shownItems(container)).toHaveLength(34);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button.textContent).toBe(labels.showFewerFiles);
    fireEvent.click(button);
    expect(shownItems(container)).toHaveLength(2);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('"All downloads (N)" opens the list through the API, without clicking the toggle', () => {
    const { container } = show(files(34));
    const button = toggle(container);
    const onToggleClick = jest.fn();
    button.addEventListener('click', onToggleClick);
    const jump = screen.getByRole('link', { name: 'All downloads (34)' });
    expect(container.querySelector(jump.getAttribute('href'))).toBe(
      screen.getByRole('heading', { name: labels.access, level: 2 })
    );
    fireEvent.click(jump);
    expect(shownItems(container)).toHaveLength(34);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(onToggleClick).not.toHaveBeenCalled();
    // An open list stays open.
    fireEvent.click(jump);
    expect(shownItems(container)).toHaveLength(34);
  });

  test('find-in-page (beforematch) on a hidden group opens the list', () => {
    const { container } = show(files(34));
    allItems(container)[20].dispatchEvent(
      new Event('beforematch', { bubbles: true })
    );
    expect(shownItems(container)).toHaveLength(34);
    expect(toggle(container)).toHaveAttribute('aria-expanded', 'true');
  });

  test('closing moves focus from a hidden group to the toggle', () => {
    const { container } = show(files(34));
    const button = toggle(container);
    fireEvent.click(button);
    allItems(container)[33].querySelector('a').focus();
    fireEvent.click(button);
    expect(document.activeElement).toBe(button);
  });

  test('changing the resources re-initialises the collapse', () => {
    const { container, rerender } = render(
      <PublicationRecord
        record={{ ...exampleRecord, resources: files(3) }}
        labels={labels}
      />
    );
    // New items 4 and 5 must be hidden too, not only the one captured first.
    rerender(
      <PublicationRecord
        record={{ ...exampleRecord, resources: files(5) }}
        labels={labels}
      />
    );
    expect(allItems(container)).toHaveLength(5);
    expect(shownItems(container)).toHaveLength(2);
    fireEvent.click(toggle(container));
    expect(shownItems(container)).toHaveLength(5);
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

  test('stories: Several files shows 2 of 3; Many files has 34', () => {
    const several = render(meta.render(SeveralFiles.args, { globals: {} }));
    expect(shownItems(several.container)).toHaveLength(2);
    expect(severalFiles).toHaveLength(3);
    several.unmount();
    const many = render(meta.render(ManyFiles.args, { globals: {} }));
    expect(allItems(many.container)).toHaveLength(34);
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
  expect(button.getAttribute('data-mg-show-more-mode')).toBe('items');
  // A host's auto-init picks it up: no opt-out attribute.
  expect(button.hasAttribute('data-mg-show-more-skip-auto-init')).toBe(false);
  expect(button.getAttribute('data-mg-show-more-target')).toBe(
    `#${document.querySelector('.mg-publication-record__resources').id}`
  );
  expect(document.querySelectorAll('li[hidden]')).toHaveLength(0);
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
