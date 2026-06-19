/**
 * @file Breadcrumbs.Translations.stories.jsx
 * @description Stories demonstrating label prop translation for the Breadcrumbs component.
 *
 * Translatable prop: navLabel (the aria-label on the nav element).
 * Defaults to "breadcrumbs" — pass to override.
 *
 * Note: breadcrumb item text comes from the `data` prop and should be
 * translated in the data layer (CMS / Drupal).
 *
 * Languages provided: ES, FR, JA, ZH, AR, RU
 */

import { Breadcrumbcomponent } from './Breadcrumbs';

export default {
  title: 'Components/Breadcrumbs/Translations',
  component: Breadcrumbcomponent,
};

const data = [
  { text: 'Home' },
  { text: 'Section' },
  { text: 'Current page' },
];

export const Spanish = {
  args: { data, navLabel: 'ruta de navegación' },
  name: 'Spanish (es)',
};

export const French = {
  args: { data, navLabel: 'fil d’Ariane' },
  name: 'French (fr)',
};

export const Japanese = {
  args: { data, navLabel: 'パンくずリスト' },
  name: 'Japanese (ja)',
};

export const Chinese = {
  args: { data, navLabel: '面包屑导航' },
  name: 'Chinese (zh)',
};

export const Arabic = {
  args: { data, navLabel: 'مسار التنقل' },
  name: 'Arabic (ar)',
};

export const Russian = {
  args: { data, navLabel: 'хлебные крошки' },
  name: 'Russian (ru)',
};
