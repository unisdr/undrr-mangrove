/**
 * @file ScrollContainer.Translations.stories.jsx
 * @description Stories demonstrating label prop translation for the ScrollContainer component.
 *
 * Pass a `labels` object to override any subset of UI strings.
 * Only visible when showArrows is true.
 *
 * Languages provided: ES, FR, JA, ZH, AR, RU
 */

import React from 'react';
import ScrollContainer from './ScrollContainer';
import {
  LABELS_AR,
  LABELS_ES,
  LABELS_FR,
  LABELS_JA,
  LABELS_RU,
  LABELS_ZH,
} from './_labels';

export default {
  title: 'Components/ScrollContainer/Translations',
  component: ScrollContainer,
};

const cardStyle = {
  minWidth: '250px',
  padding: '16px',
  background: '#f5f5f5',
  borderRadius: '4px',
  marginRight: '16px',
};

const items = Array.from({ length: 6 }, (_, i) => (
  <div key={i} style={cardStyle}>
    Item {i + 1}
  </div>
));

const baseArgs = {
  showArrows: true,
  children: items,
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
