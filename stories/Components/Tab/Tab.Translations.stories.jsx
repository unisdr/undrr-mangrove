/**
 * @file Tab.Translations.stories.jsx
 * @description Stories demonstrating label prop translation for the Tab component.
 *
 * Translatable prop (via the `labels` object): filterPlaceholder (the search
 * input shown when filterable=true and variant='stacked').
 * Defaults to English "Filter sections…".
 *
 * Languages provided: ES, FR, JA, ZH, AR, RU
 */

import { Tab } from './Tab';
import {
  LABELS_AR,
  LABELS_ES,
  LABELS_FR,
  LABELS_JA,
  LABELS_RU,
  LABELS_ZH,
} from './_labels';

export default {
  title: 'Components/Tab/Translations',
  component: Tab,
};

const tabdata = [
  {
    text: 'Section A',
    text_id: 'section-a',
    data: '<p>Content for section A.</p>',
    is_default: 'true',
  },
  {
    text: 'Section B',
    text_id: 'section-b',
    data: '<p>Content for section B.</p>',
  },
  {
    text: 'Section C',
    text_id: 'section-c',
    data: '<p>Content for section C.</p>',
  },
];

const baseArgs = {
  tabdata,
  variant: 'stacked',
  filterable: true,
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
