/**
 * @file ShareButtons.Translations.stories.jsx
 * @description Stories demonstrating the `labels` prop for ShareButtons UI string translation.
 *
 * All user-visible strings are overridable via the `labels` prop. Unspecified
 * keys fall back to the English defaults in DEFAULT_SHARE_LABELS.
 *
 * Import the defaults for reference:
 *   import { DEFAULT_SHARE_LABELS } from '@undrr/undrr-mangrove';
 *
 * Languages provided: ES, FR, JA, ZH, AR, RU
 */

import ShareButtons from './ShareButtons';
import {
  LABELS_ES,
  LABELS_FR,
  LABELS_JA,
  LABELS_ZH,
  LABELS_AR,
  LABELS_RU,
} from './_labels';

export default {
  title: 'Components/Buttons/ShareButtons/Translations',
  component: ShareButtons,
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
