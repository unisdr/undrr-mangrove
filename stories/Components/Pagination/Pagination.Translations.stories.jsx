/**
 * @file Pagination.Translations.stories.jsx
 * @description Stories demonstrating label prop translation for the Pagination component.
 *
 * Translatable props: prevLabel, nextLabel, nextAriaLabel.
 * These default to English — pass any subset to override.
 *
 * Languages provided: ES, FR, JA, ZH, AR, RU
 */

import { Pagination } from './Pagination';

export default {
  title: 'Components/Pagination/Translations',
  component: Pagination,
};

export const Spanish = {
  args: {
    prevLabel: 'Anterior',
    nextLabel: 'Siguiente',
    nextAriaLabel: 'Página siguiente',
  },
  name: 'Spanish (es)',
};

export const French = {
  args: {
    prevLabel: 'Précédent',
    nextLabel: 'Suivant',
    nextAriaLabel: 'Page suivante',
  },
  name: 'French (fr)',
};

export const Japanese = {
  args: {
    prevLabel: '前へ',
    nextLabel: '次へ',
    nextAriaLabel: '次のページ',
  },
  name: 'Japanese (ja)',
};

export const Chinese = {
  args: {
    prevLabel: '上一页',
    nextLabel: '下一页',
    nextAriaLabel: '下一页',
  },
  name: 'Chinese (zh)',
};

export const Arabic = {
  args: {
    prevLabel: 'السابق',
    nextLabel: 'التالي',
    nextAriaLabel: 'الصفحة التالية',
  },
  name: 'Arabic (ar)',
};

export const Russian = {
  args: {
    prevLabel: 'Назад',
    nextLabel: 'Вперёд',
    nextAriaLabel: 'Следующая страница',
  },
  name: 'Russian (ru)',
};
