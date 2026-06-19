/**
 * @file Snackbar.Translations.stories.jsx
 * @description Stories demonstrating label prop translation for the Snackbar component.
 *
 * Translatable props: closeLabel (visible button text), closeAriaLabel (screen-reader label).
 * These default to English — pass any subset to override.
 *
 * Languages provided: ES, FR, JA, ZH, AR, RU
 */

import Snackbar from './Snackbar';

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

// ---------------------------------------------------------------------------
// Spanish (es)
// ---------------------------------------------------------------------------
export const LABELS_ES = {
  closeLabel: 'Cerrar',
  closeAriaLabel: 'Cerrar notificación',
};

export const Spanish = {
  args: { ...baseArgs, ...LABELS_ES },
  name: 'Spanish (es)',
};

// ---------------------------------------------------------------------------
// French (fr)
// ---------------------------------------------------------------------------
export const LABELS_FR = {
  closeLabel: 'Fermer',
  closeAriaLabel: 'Fermer la notification',
};

export const French = {
  args: { ...baseArgs, ...LABELS_FR },
  name: 'French (fr)',
};

// ---------------------------------------------------------------------------
// Japanese (ja)
// ---------------------------------------------------------------------------
export const LABELS_JA = {
  closeLabel: '閉じる',
  closeAriaLabel: '通知を閉じる',
};

export const Japanese = {
  args: { ...baseArgs, ...LABELS_JA },
  name: 'Japanese (ja)',
};

// ---------------------------------------------------------------------------
// Simplified Chinese (zh)
// ---------------------------------------------------------------------------
export const LABELS_ZH = {
  closeLabel: '关闭',
  closeAriaLabel: '关闭通知',
};

export const Chinese = {
  args: { ...baseArgs, ...LABELS_ZH },
  name: 'Chinese (zh)',
};

// ---------------------------------------------------------------------------
// Arabic (ar) — Modern Standard Arabic
// ---------------------------------------------------------------------------
export const LABELS_AR = {
  closeLabel: 'إغلاق',
  closeAriaLabel: 'إغلاق الإشعار',
};

export const Arabic = {
  args: { ...baseArgs, ...LABELS_AR },
  name: 'Arabic (ar)',
};

// ---------------------------------------------------------------------------
// Russian (ru)
// ---------------------------------------------------------------------------
export const LABELS_RU = {
  closeLabel: 'Закрыть',
  closeAriaLabel: 'Закрыть уведомление',
};

export const Russian = {
  args: { ...baseArgs, ...LABELS_RU },
  name: 'Russian (ru)',
};
