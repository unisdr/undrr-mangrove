/**
 * @file Snackbar.Translations.stories.jsx
 * @description Stories demonstrating label prop translation for the Snackbar component.
 *
 * Translatable props are grouped under the `labels` prop object.
 * Pass any subset to override — unspecified keys fall back to English defaults.
 *
 * Languages provided: ES, FR, JA, ZH, AR, RU
 */

import Snackbar from './Snackbar';
import {
  LABELS_ES,
  LABELS_FR,
  LABELS_JA,
  LABELS_ZH,
  LABELS_AR,
  LABELS_RU,
} from './_labels';

export default {
  title: 'Components/Snackbar/Translations',
  component: Snackbar,
};

const baseArgs = {
  severity: 'info',
  opened: true,
  message: 'This is a notification message.',
  onClose: () => {},
};

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
