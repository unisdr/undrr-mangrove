/**
 * @file ScrollContainer.Translations.stories.jsx
 * @description Stories demonstrating label prop translation for the ScrollContainer component.
 *
 * Translatable props: scrollLeftLabel, scrollRightLabel.
 * These default to English — pass any subset to override.
 * Only visible when showArrows is true.
 *
 * Languages provided: ES, FR, JA, ZH, AR, RU
 */

import React from 'react';
import ScrollContainer from './ScrollContainer';

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

// ---------------------------------------------------------------------------
// Spanish (es)
// ---------------------------------------------------------------------------
export const LABELS_ES = {
  scrollLeftLabel: 'Desplazar a la izquierda',
  scrollRightLabel: 'Desplazar a la derecha',
};

export const Spanish = {
  args: { ...baseArgs, ...LABELS_ES },
  name: 'Spanish (es)',
};

// ---------------------------------------------------------------------------
// French (fr)
// ---------------------------------------------------------------------------
export const LABELS_FR = {
  scrollLeftLabel: 'Faire défiler à gauche',
  scrollRightLabel: 'Faire défiler à droite',
};

export const French = {
  args: { ...baseArgs, ...LABELS_FR },
  name: 'French (fr)',
};

// ---------------------------------------------------------------------------
// Japanese (ja)
// ---------------------------------------------------------------------------
export const LABELS_JA = {
  scrollLeftLabel: '左にスクロール',
  scrollRightLabel: '右にスクロール',
};

export const Japanese = {
  args: { ...baseArgs, ...LABELS_JA },
  name: 'Japanese (ja)',
};

// ---------------------------------------------------------------------------
// Simplified Chinese (zh)
// ---------------------------------------------------------------------------
export const LABELS_ZH = {
  scrollLeftLabel: '向左滚动',
  scrollRightLabel: '向右滚动',
};

export const Chinese = {
  args: { ...baseArgs, ...LABELS_ZH },
  name: 'Chinese (zh)',
};

// ---------------------------------------------------------------------------
// Arabic (ar) — Modern Standard Arabic
// ---------------------------------------------------------------------------
export const LABELS_AR = {
  scrollLeftLabel: 'التمرير لليسار',
  scrollRightLabel: 'التمرير لليمين',
};

export const Arabic = {
  args: { ...baseArgs, ...LABELS_AR },
  name: 'Arabic (ar)',
};

// ---------------------------------------------------------------------------
// Russian (ru)
// ---------------------------------------------------------------------------
export const LABELS_RU = {
  scrollLeftLabel: 'Прокрутить влево',
  scrollRightLabel: 'Прокрутить вправо',
};

export const Russian = {
  args: { ...baseArgs, ...LABELS_RU },
  name: 'Russian (ru)',
};
