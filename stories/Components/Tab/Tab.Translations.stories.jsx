/**
 * @file Tab.Translations.stories.jsx
 * @description Stories demonstrating label prop translation for the Tab component.
 *
 * Translatable prop: filterPlaceholder (the search input shown when filterable=true
 * and variant='stacked'). Defaults to English "Filter sections…".
 *
 * Languages provided: ES, FR, JA, ZH, AR, RU
 */

import { Tab } from './Tab';

export default {
  title: 'Components/Tab/Translations',
  component: Tab,
};

const tabdata = [
  { text: 'Section A', text_id: 'section-a', data: '<p>Content for section A.</p>', is_default: 'true' },
  { text: 'Section B', text_id: 'section-b', data: '<p>Content for section B.</p>' },
  { text: 'Section C', text_id: 'section-c', data: '<p>Content for section C.</p>' },
];

const baseArgs = {
  tabdata,
  variant: 'stacked',
  filterable: true,
};

export const Spanish = {
  args: { ...baseArgs, filterPlaceholder: 'Filtrar secciones…' },
  name: 'Spanish (es)',
};

export const French = {
  args: { ...baseArgs, filterPlaceholder: 'Filtrer les sections…' },
  name: 'French (fr)',
};

export const Japanese = {
  args: { ...baseArgs, filterPlaceholder: 'セクションを絞り込む…' },
  name: 'Japanese (ja)',
};

export const Chinese = {
  args: { ...baseArgs, filterPlaceholder: '筛选章节…' },
  name: 'Chinese (zh)',
};

export const Arabic = {
  args: { ...baseArgs, filterPlaceholder: 'تصفية الأقسام…' },
  name: 'Arabic (ar)',
};

export const Russian = {
  args: { ...baseArgs, filterPlaceholder: 'Фильтр разделов…' },
  name: 'Russian (ru)',
};
