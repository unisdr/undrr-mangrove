/**
 * @file OnThisPageNav.Translations.stories.jsx
 * @description Stories demonstrating label prop translation for the OnThisPageNav component.
 *
 * Translatable prop (via the `labels` object): label (the aria-label for the nav
 * element, also rendered as the section heading by the vanilla JS runtime).
 * Defaults to "On this page" — pass to override.
 *
 * Languages provided: ES, FR, JA, ZH, AR, RU
 */

import OnThisPageNav from './OnThisPageNav';
import {
  LABELS_AR,
  LABELS_ES,
  LABELS_FR,
  LABELS_JA,
  LABELS_RU,
  LABELS_ZH,
} from './_labels';

export default {
  title: 'Components/OnThisPageNav/Translations',
  component: OnThisPageNav,
};

const items = [
  { href: '#introduction', text: 'Introduction' },
  { href: '#background', text: 'Background' },
  { href: '#findings', text: 'Findings' },
  { href: '#conclusion', text: 'Conclusion' },
];

export const Spanish = {
  args: { items, labels: LABELS_ES },
  name: 'Spanish (es)',
};

export const French = {
  args: { items, labels: LABELS_FR },
  name: 'French (fr)',
};

export const Japanese = {
  args: { items, labels: LABELS_JA },
  name: 'Japanese (ja)',
};

export const Chinese = {
  args: { items, labels: LABELS_ZH },
  name: 'Chinese (zh)',
};

export const Arabic = {
  args: { items, labels: LABELS_AR },
  name: 'Arabic (ar)',
};

export const Russian = {
  args: { items, labels: LABELS_RU },
  name: 'Russian (ru)',
};
