/** Runtime UI labels for Gallery; shared by production and Storybook. */
import { createLabelResolver } from '../../../src/i18n';

// ---------------------------------------------------------------------------
// Spanish (es)
// ---------------------------------------------------------------------------
export const LABELS_ES = {
  galleryAriaLabel: 'Galería',
  prevLabel: 'Elemento anterior',
  nextLabel: 'Elemento siguiente',
  loadingLabel: 'Cargando medio',
};

// ---------------------------------------------------------------------------
// French (fr)
// ---------------------------------------------------------------------------
export const LABELS_FR = {
  galleryAriaLabel: 'Galerie',
  prevLabel: 'Élément précédent',
  nextLabel: 'Élément suivant',
  loadingLabel: 'Chargement du média',
};

// ---------------------------------------------------------------------------
// Japanese (ja)
// ---------------------------------------------------------------------------
export const LABELS_JA = {
  galleryAriaLabel: 'ギャラリー',
  prevLabel: '前のアイテム',
  nextLabel: '次のアイテム',
  loadingLabel: 'メディアを読み込んでいます…',
};

// ---------------------------------------------------------------------------
// Simplified Chinese (zh)
// ---------------------------------------------------------------------------
export const LABELS_ZH = {
  galleryAriaLabel: '图库',
  prevLabel: '上一项',
  nextLabel: '下一项',
  loadingLabel: '正在加载媒体',
};

// ---------------------------------------------------------------------------
// Arabic (ar) — Modern Standard Arabic
// ---------------------------------------------------------------------------
export const LABELS_AR = {
  galleryAriaLabel: 'معرض الصور',
  prevLabel: 'العنصر السابق',
  nextLabel: 'العنصر التالي',
  loadingLabel: 'جارٍ تحميل الوسائط',
};

// ---------------------------------------------------------------------------
// Russian (ru)
// ---------------------------------------------------------------------------
export const LABELS_RU = {
  galleryAriaLabel: 'Галерея',
  prevLabel: 'Предыдущий элемент',
  nextLabel: 'Следующий элемент',
  loadingLabel: 'Загрузка медиа',
};

export const DEFAULT_GALLERY_LABELS = {
  galleryAriaLabel: 'Gallery',
  prevLabel: 'Previous item',
  nextLabel: 'Next item',
  loadingLabel: 'Loading media',
};

export const getGalleryLabels = createLabelResolver(DEFAULT_GALLERY_LABELS, {
  ar: LABELS_AR,
  es: LABELS_ES,
  fr: LABELS_FR,
  ja: LABELS_JA,
  ru: LABELS_RU,
  zh: LABELS_ZH,
});
