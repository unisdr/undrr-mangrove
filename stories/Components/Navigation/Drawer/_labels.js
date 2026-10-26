/** Runtime UI labels for Drawer; shared by production and Storybook. */
import { createLabelResolver } from '../../../../src/i18n';

export const DEFAULT_DRAWER_LABELS = {
  closeLabel: 'Close',
};

export const LABELS_ES = { closeLabel: 'Cerrar' };
export const LABELS_FR = { closeLabel: 'Fermer' };
export const LABELS_JA = { closeLabel: '閉じる' };
export const LABELS_ZH = { closeLabel: '关闭' };
export const LABELS_AR = { closeLabel: 'إغلاق' };
export const LABELS_RU = { closeLabel: 'Закрыть' };

export const getDrawerLabels = createLabelResolver(DEFAULT_DRAWER_LABELS, {
  en: DEFAULT_DRAWER_LABELS,
  ar: LABELS_AR,
  es: LABELS_ES,
  fr: LABELS_FR,
  ja: LABELS_JA,
  ru: LABELS_RU,
  zh: LABELS_ZH,
});
