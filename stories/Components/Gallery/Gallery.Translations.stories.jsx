/**
 * @file Gallery.Translations.stories.jsx
 * @description Stories demonstrating label prop translation for the Gallery component.
 *
 * Pass a `labels` object to override any subset of UI strings.
 * Languages provided: ES, FR, JA, ZH, AR, RU
 */

import { Gallery } from './Gallery';
import {
  LABELS_AR,
  LABELS_ES,
  LABELS_FR,
  LABELS_JA,
  LABELS_RU,
  LABELS_ZH,
} from './_labels';

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

export const Spanish = {
  args: { ...baseArgs, labels: LABELS_ES },
  name: 'Spanish (es)',
};

export const French = {
  args: { ...baseArgs, labels: LABELS_FR },
  name: 'French (fr)',
};

export const Japanese = {
  args: { ...baseArgs, labels: LABELS_JA },
  name: 'Japanese (ja)',
};

export const Chinese = {
  args: { ...baseArgs, labels: LABELS_ZH },
  name: 'Chinese (zh)',
};

export const Arabic = {
  args: { ...baseArgs, labels: LABELS_AR },
  name: 'Arabic (ar)',
};

export const Russian = {
  args: { ...baseArgs, labels: LABELS_RU },
  name: 'Russian (ru)',
};
