/**
 * @file Pagination.Translations.stories.jsx
 * @description Stories demonstrating label prop translation for the Pagination component.
 *
 * Translatable props (via the `labels` object): prevLabel, nextLabel, nextAriaLabel.
 * These default to English — pass any subset to override.
 *
 * Languages provided: ES, FR, JA, ZH, AR, RU
 */

import { Pagination } from './Pagination';
import {
  LABELS_AR,
  LABELS_ES,
  LABELS_FR,
  LABELS_JA,
  LABELS_RU,
  LABELS_ZH,
} from './_labels';

export default {
  title: 'Components/Pagination/Translations',
  component: Pagination,
};

export const Spanish = {
  args: { labels: LABELS_ES },
  name: 'Spanish (es)',
};

export const French = {
  args: { labels: LABELS_FR },
  name: 'French (fr)',
};

export const Japanese = {
  args: { labels: LABELS_JA },
  name: 'Japanese (ja)',
};

export const Chinese = {
  args: { labels: LABELS_ZH },
  name: 'Chinese (zh)',
};

export const Arabic = {
  args: { labels: LABELS_AR },
  name: 'Arabic (ar)',
};

export const Russian = {
  args: { labels: LABELS_RU },
  name: 'Russian (ru)',
};
