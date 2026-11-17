/** Runtime UI labels for Tab; shared by production and Storybook. */
import { createLabelResolver } from '../../../src/i18n';

export const LABELS_ES = {
  tabListLabel: 'Secciones',
  filterPlaceholder: 'Filtrar secciones…',
};

export const LABELS_FR = {
  tabListLabel: 'Sections',
  filterPlaceholder: 'Filtrer les sections…',
};

export const LABELS_JA = {
  tabListLabel: 'セクション',
  filterPlaceholder: 'セクションを絞り込む…',
};

export const LABELS_ZH = {
  tabListLabel: '章节',
  filterPlaceholder: '筛选章节…',
};

export const LABELS_AR = {
  tabListLabel: 'الأقسام',
  filterPlaceholder: 'تصفية الأقسام…',
};

export const LABELS_RU = {
  tabListLabel: 'Разделы',
  filterPlaceholder: 'Фильтр разделов…',
};

export const DEFAULT_TAB_LABELS = {
  filterPlaceholder: 'Filter sections…',
  tabListLabel: 'Sections',
};

export const getTabLabels = createLabelResolver(DEFAULT_TAB_LABELS, {
  ar: LABELS_AR,
  es: LABELS_ES,
  fr: LABELS_FR,
  ja: LABELS_JA,
  ru: LABELS_RU,
  zh: LABELS_ZH,
});
