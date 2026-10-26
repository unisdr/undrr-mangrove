/** Runtime UI labels for OnThisPageNav; shared by production and Storybook. */
import { createLabelResolver } from '../../../src/i18n';

export const LABELS_ES = {
  label: 'En esta página',
};

export const LABELS_FR = {
  label: 'Sur cette page',
};

export const LABELS_JA = {
  label: 'このページの内容',
};

export const LABELS_ZH = {
  label: '本页内容',
};

export const LABELS_AR = {
  label: 'في هذه الصفحة',
};

export const LABELS_RU = {
  label: 'На этой странице',
};

export const DEFAULT_ON_THIS_PAGE_LABELS = {
  label: 'On this page',
};

export const getOnThisPageNavLabels = createLabelResolver(
  DEFAULT_ON_THIS_PAGE_LABELS,
  {
    ar: LABELS_AR,
    es: LABELS_ES,
    fr: LABELS_FR,
    ja: LABELS_JA,
    ru: LABELS_RU,
    zh: LABELS_ZH,
  }
);
