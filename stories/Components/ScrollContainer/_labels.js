/** Runtime UI labels for ScrollContainer; shared by production and Storybook. */
import { createLabelResolver } from '../../../src/i18n';

// ---------------------------------------------------------------------------
// Spanish (es)
// ---------------------------------------------------------------------------
export const LABELS_ES = {
  ariaLabel: 'Contenido desplazable',
  navigationLabel: 'Navegación de {label}',
  scrollLeftLabel: 'Desplazar a la izquierda',
  scrollRightLabel: 'Desplazar a la derecha',
};

// ---------------------------------------------------------------------------
// French (fr)
// ---------------------------------------------------------------------------
export const LABELS_FR = {
  ariaLabel: 'Contenu défilant',
  navigationLabel: 'Navigation : {label}',
  scrollLeftLabel: 'Faire défiler à gauche',
  scrollRightLabel: 'Faire défiler à droite',
};

// ---------------------------------------------------------------------------
// Japanese (ja)
// ---------------------------------------------------------------------------
export const LABELS_JA = {
  ariaLabel: 'スクロール可能なコンテンツ',
  navigationLabel: '{label}のナビゲーション',
  scrollLeftLabel: '左にスクロール',
  scrollRightLabel: '右にスクロール',
};

// ---------------------------------------------------------------------------
// Simplified Chinese (zh)
// ---------------------------------------------------------------------------
export const LABELS_ZH = {
  ariaLabel: '可滚动内容',
  navigationLabel: '{label}导航',
  scrollLeftLabel: '向左滚动',
  scrollRightLabel: '向右滚动',
};

// ---------------------------------------------------------------------------
// Arabic (ar) — Modern Standard Arabic
// ---------------------------------------------------------------------------
export const LABELS_AR = {
  ariaLabel: 'محتوى قابل للتمرير',
  navigationLabel: 'التنقل في {label}',
  scrollLeftLabel: 'التمرير لليسار',
  scrollRightLabel: 'التمرير لليمين',
};

// ---------------------------------------------------------------------------
// Russian (ru)
// ---------------------------------------------------------------------------
export const LABELS_RU = {
  ariaLabel: 'Прокручиваемое содержимое',
  navigationLabel: 'Навигация: {label}',
  scrollLeftLabel: 'Прокрутить влево',
  scrollRightLabel: 'Прокрутить вправо',
};

export const DEFAULT_SCROLL_LABELS = {
  ariaLabel: 'Scrollable content',
  navigationLabel: '{label} navigation',
  scrollLeftLabel: 'Scroll left',
  scrollRightLabel: 'Scroll right',
};

export const getScrollContainerLabels = createLabelResolver(
  DEFAULT_SCROLL_LABELS,
  {
    ar: LABELS_AR,
    es: LABELS_ES,
    fr: LABELS_FR,
    ja: LABELS_JA,
    ru: LABELS_RU,
    zh: LABELS_ZH,
  }
);
