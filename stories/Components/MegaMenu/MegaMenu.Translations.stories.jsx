/**
 * @file MegaMenu.Translations.stories.jsx
 * @description Stories demonstrating label prop translation for the MegaMenu component.
 *
 * Translatable props: navLabel, closeMobileNavLabel.
 * These default to English — pass any subset to override.
 *
 * Note: section titles and menu item labels come from the `sections` data prop
 * and should be translated in the data layer (CMS / Drupal).
 *
 * Languages provided: ES, FR, JA, ZH, AR, RU
 */

import MegaMenu from './MegaMenu';

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

// ---------------------------------------------------------------------------
// Spanish (es)
// ---------------------------------------------------------------------------
export const LABELS_ES = {
  navLabel: 'Navegación principal',
  closeMobileNavLabel: 'Cerrar navegación móvil',
};

export const Spanish = {
  args: { ...baseArgs, ...LABELS_ES },
  name: 'Spanish (es)',
};

// ---------------------------------------------------------------------------
// French (fr)
// ---------------------------------------------------------------------------
export const LABELS_FR = {
  navLabel: 'Navigation principale',
  closeMobileNavLabel: 'Fermer la navigation mobile',
};

export const French = {
  args: { ...baseArgs, ...LABELS_FR },
  name: 'French (fr)',
};

// ---------------------------------------------------------------------------
// Japanese (ja)
// ---------------------------------------------------------------------------
export const LABELS_JA = {
  navLabel: 'メインナビゲーション',
  closeMobileNavLabel: 'モバイルナビゲーションを閉じる',
};

export const Japanese = {
  args: { ...baseArgs, ...LABELS_JA },
  name: 'Japanese (ja)',
};

// ---------------------------------------------------------------------------
// Simplified Chinese (zh)
// ---------------------------------------------------------------------------
export const LABELS_ZH = {
  navLabel: '主导航',
  closeMobileNavLabel: '关闭移动导航',
};

export const Chinese = {
  args: { ...baseArgs, ...LABELS_ZH },
  name: 'Chinese (zh)',
};

// ---------------------------------------------------------------------------
// Arabic (ar) — Modern Standard Arabic
// ---------------------------------------------------------------------------
export const LABELS_AR = {
  navLabel: 'التنقل الرئيسي',
  closeMobileNavLabel: 'إغلاق قائمة التنقل للجوال',
};

export const Arabic = {
  args: { ...baseArgs, ...LABELS_AR },
  name: 'Arabic (ar)',
};

// ---------------------------------------------------------------------------
// Russian (ru)
// ---------------------------------------------------------------------------
export const LABELS_RU = {
  navLabel: 'Основная навигация',
  closeMobileNavLabel: 'Закрыть мобильную навигацию',
};

export const Russian = {
  args: { ...baseArgs, ...LABELS_RU },
  name: 'Russian (ru)',
};
