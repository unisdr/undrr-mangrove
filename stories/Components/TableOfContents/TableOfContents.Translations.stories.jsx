/**
 * @file TableOfContents.Translations.stories.jsx
 * @description Stories demonstrating label prop translation for the TableOfContents component.
 *
 * Translatable prop: title (the heading displayed above the list).
 * Defaults to "On this page" — pass to override.
 *
 * Note: tocData item text comes from page headings and should be
 * translated in the content layer.
 *
 * Languages provided: ES, FR, JA, ZH, AR, RU
 */

import TableOfContents from './TableOfContents';

export default {
  title: 'Components/TableOfContents/Translations',
  component: TableOfContents,
};

const tocData = [
  { id: 'introduction', text: 'Introduction' },
  { id: 'background', text: 'Background' },
  { id: 'findings', text: 'Findings' },
  { id: 'conclusion', text: 'Conclusion' },
];

export const Spanish = {
  args: { tocData, title: 'En esta página' },
  name: 'Spanish (es)',
};

export const French = {
  args: { tocData, title: 'Sur cette page' },
  name: 'French (fr)',
};

export const Japanese = {
  args: { tocData, title: 'このページの内容' },
  name: 'Japanese (ja)',
};

export const Chinese = {
  args: { tocData, title: '本页内容' },
  name: 'Chinese (zh)',
};

export const Arabic = {
  args: { tocData, title: 'في هذه الصفحة' },
  name: 'Arabic (ar)',
};

export const Russian = {
  args: { tocData, title: 'На этой странице' },
  name: 'Russian (ru)',
};
