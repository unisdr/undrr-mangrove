/**
 * @file Gallery.Translations.stories.jsx
 * @description Stories demonstrating label prop translation for the Gallery component.
 *
 * Translatable props: galleryAriaLabel, prevLabel, nextLabel, loadingLabel.
 * These default to English — pass any subset to override.
 *
 * Languages provided: ES, FR, JA, ZH, AR, RU
 */

import { Gallery } from './Gallery';

export default {
  title: 'Components/Gallery/Translations',
  component: Gallery,
};

const sampleImages = [
  {
    id: '1',
    src: 'https://picsum.photos/800/600?random=1',
    alt: 'Landscape photo 1',
    title: 'Mountain Landscape',
    description: 'A view of mountains at sunset.',
  },
  {
    id: '2',
    src: 'https://picsum.photos/800/600?random=2',
    alt: 'Landscape photo 2',
    title: 'City Architecture',
    description: 'Modern architecture with geometric patterns.',
  },
  {
    id: '3',
    src: 'https://picsum.photos/800/600?random=3',
    alt: 'Landscape photo 3',
    title: 'Ocean Waves',
    description: 'Peaceful ocean scene with clear blue water.',
  },
];

const baseArgs = {
  media: sampleImages,
  showThumbnails: true,
  showArrows: true,
  showDescription: true,
  enableKeyboard: true,
};

// ---------------------------------------------------------------------------
// Spanish (es)
// ---------------------------------------------------------------------------
export const LABELS_ES = {
  galleryAriaLabel: 'Galería',
  prevLabel: 'Elemento anterior',
  nextLabel: 'Elemento siguiente',
  loadingLabel: 'Cargando medio',
};

export const Spanish = {
  args: { ...baseArgs, ...LABELS_ES },
  name: 'Spanish (es)',
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

export const French = {
  args: { ...baseArgs, ...LABELS_FR },
  name: 'French (fr)',
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

export const Japanese = {
  args: { ...baseArgs, ...LABELS_JA },
  name: 'Japanese (ja)',
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

export const Chinese = {
  args: { ...baseArgs, ...LABELS_ZH },
  name: 'Chinese (zh)',
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

export const Arabic = {
  args: { ...baseArgs, ...LABELS_AR },
  name: 'Arabic (ar)',
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

export const Russian = {
  args: { ...baseArgs, ...LABELS_RU },
  name: 'Russian (ru)',
};
