/** Runtime UI labels for Snackbar; shared by production and Storybook. */
import { createLabelResolver } from '../../../src/i18n';

// ---------------------------------------------------------------------------
// Spanish (es)
// ---------------------------------------------------------------------------
export const LABELS_ES = {
  closeLabel: 'Cerrar',
  closeAriaLabel: 'Cerrar notificación',
};

// ---------------------------------------------------------------------------
// French (fr)
// ---------------------------------------------------------------------------
export const LABELS_FR = {
  closeLabel: 'Fermer',
  closeAriaLabel: 'Fermer la notification',
};

// ---------------------------------------------------------------------------
// Japanese (ja)
// ---------------------------------------------------------------------------
export const LABELS_JA = {
  closeLabel: '閉じる',
  closeAriaLabel: '通知を閉じる',
};

// ---------------------------------------------------------------------------
// Simplified Chinese (zh)
// ---------------------------------------------------------------------------
export const LABELS_ZH = {
  closeLabel: '关闭',
  closeAriaLabel: '关闭通知',
};

// ---------------------------------------------------------------------------
// Arabic (ar) — Modern Standard Arabic
// ---------------------------------------------------------------------------
export const LABELS_AR = {
  closeLabel: 'إغلاق',
  closeAriaLabel: 'إغلاق الإشعار',
};

// ---------------------------------------------------------------------------
// Russian (ru)
// ---------------------------------------------------------------------------
export const LABELS_RU = {
  closeLabel: 'Закрыть',
  closeAriaLabel: 'Закрыть уведомление',
};

export const DEFAULT_SNACKBAR_LABELS = {
  closeLabel: 'Close',
  closeAriaLabel: 'Close notification',
};

export const getSnackbarLabels = createLabelResolver(DEFAULT_SNACKBAR_LABELS, {
  en: DEFAULT_SNACKBAR_LABELS,
  ar: LABELS_AR,
  es: LABELS_ES,
  fr: LABELS_FR,
  ja: LABELS_JA,
  ru: LABELS_RU,
  zh: LABELS_ZH,
});
