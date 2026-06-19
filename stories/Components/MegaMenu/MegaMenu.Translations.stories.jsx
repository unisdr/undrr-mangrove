/**
 * @file MegaMenu.Translations.stories.jsx
 * @description Stories demonstrating label prop translation for the MegaMenu component.
 *
 * Translatable props are grouped under the `labels` prop object.
 * Pass any subset to override — unspecified keys fall back to English defaults.
 *
 * Note: section titles and menu item labels come from the `sections` data prop
 * and should be translated in the data layer (CMS / Drupal).
 *
 * Languages provided: ES, FR, JA, ZH, AR, RU
 */

import MegaMenu from './MegaMenu';
import {
  LABELS_ES,
  LABELS_FR,
  LABELS_JA,
  LABELS_ZH,
  LABELS_AR,
  LABELS_RU,
} from './_labels';

export default {
  title: 'Components/MegaMenu/Translations',
  component: MegaMenu,
  parameters: {
    layout: 'fullscreen',
  },
};

const sections = [
  {
    title: 'Knowledge Hub',
    items: [
      { title: 'Publications', url: '#' },
      { title: 'Reports', url: '#' },
    ],
  },
  {
    title: 'About',
    items: [
      { title: 'Our Mission', url: '#' },
      { title: 'Contact', url: '#' },
    ],
  },
];

const baseArgs = { sections };

export const Spanish = {
  args: { ...baseArgs, labels: LABELS_ES },
  name: 'Spanish (es)',
};

export const French = {
  args: { ...baseArgs, labels: LABELS_FR },
  name: 'French (fr)',
};

export const Japanese = {
  args: { ...baseArgs, labels: LABELS_JA },
  name: 'Japanese (ja)',
};

export const Chinese = {
  args: { ...baseArgs, labels: LABELS_ZH },
  name: 'Chinese (zh)',
};

export const Arabic = {
  args: { ...baseArgs, labels: LABELS_AR },
  name: 'Arabic (ar)',
};

export const Russian = {
  args: { ...baseArgs, labels: LABELS_RU },
  name: 'Russian (ru)',
};
