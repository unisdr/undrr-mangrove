import { PhotoGallery } from './PhotoGallery';

// Sample images (using placeholder service)
const sampleImages = [
  {
    id: '1',
    src: 'https://picsum.photos/800/600?random=1',
    alt: 'Landscape photo 1',
    title: 'Beautiful Mountain Landscape',
    description: 'A stunning view of mountains during sunset with vibrant colors in the sky.',
  },
  {
    id: '2',
    src: 'https://picsum.photos/600/800?random=2',
    alt: 'Portrait photo 2',
    title: 'City Architecture',
    description: 'Modern architecture showcasing geometric patterns and clean lines.',
  },
  {
    id: '3',
    src: 'https://picsum.photos/800/600?random=3',
    alt: 'Landscape photo 3',
    title: 'Ocean Waves',
    description: 'Peaceful ocean scene with gentle waves and clear blue water.',
  },
];

const manyImages = Array.from({ length: 12 }, (_, i) => ({
  id: `${i + 1}`,
  src: `https://picsum.photos/800/600?random=${i + 10}`,
  alt: `Photo ${i + 1}`,
  title: `Image ${i + 1}`,
  description: `This is a description for image ${i + 1} in the gallery.`,
}));

export default {
  title: 'Components/Photo Gallery',
  component: PhotoGallery,
  argTypes: {
    thumbnailPosition: {
      options: ['left', 'bottom'],
      control: { type: 'inline-radio' },
    },
    showThumbnails: {
      control: { type: 'boolean' },
    },
    showArrows: {
      control: { type: 'boolean' },
    },
    arrowStyle: {
      options: ['overlay', 'corner'],
      control: { type: 'inline-radio' },
    },
    showDescription: {
      control: { type: 'boolean' },
    },
    enableKeyboard: {
      control: { type: 'boolean' },
    },
    loop: {
      control: { type: 'boolean' },
    },
  },
};

// Basic gallery with 3 images
export const BasicGallery = {
  args: {
    images: sampleImages,
    showThumbnails: true,
    thumbnailPosition: 'left',
    showArrows: true,
    showDescription: true,
    enableKeyboard: true,
  },
  name: 'Basic Gallery',
};

// Gallery with many images (scrolling thumbnails)
export const ManyImages = {
  args: {
    images: manyImages,
    showThumbnails: true,
    thumbnailPosition: 'left',
    showArrows: true,
    showDescription: true,
    enableKeyboard: true,
  },
  name: 'Many Images (Scrolling)',
};

// Thumbnails at bottom
export const ThumbnailsBottom = {
  args: {
    images: sampleImages,
    showThumbnails: true,
    thumbnailPosition: 'bottom',
    showArrows: true,
    showDescription: true,
    enableKeyboard: true,
  },
  name: 'Thumbnails at Bottom',
};

// Without thumbnails
export const WithoutThumbnails = {
  args: {
    images: sampleImages,
    showThumbnails: false,
    showArrows: true,
    showDescription: true,
    enableKeyboard: true,
  },
  name: 'Without Thumbnails',
};

// Without arrows
export const WithoutArrows = {
  args: {
    images: sampleImages,
    showThumbnails: true,
    thumbnailPosition: 'left',
    showArrows: false,
    showDescription: true,
    enableKeyboard: true,
  },
  name: 'Without Arrows',
};

// Without descriptions
export const WithoutDescriptions = {
  args: {
    images: sampleImages.map((img) => ({
      ...img,
      title: undefined,
      description: undefined,
    })),
    showThumbnails: true,
    thumbnailPosition: 'left',
    showArrows: true,
    showDescription: false,
    enableKeyboard: true,
  },
  name: 'Without Descriptions',
};

// Minimal configuration
export const Minimal = {
  args: {
    images: sampleImages.map((img) => ({
      id: img.id,
      src: img.src,
      alt: img.alt,
    })),
    showThumbnails: true,
    thumbnailPosition: 'left',
    showArrows: false,
    showDescription: false,
    enableKeyboard: true,
  },
  name: 'Minimal Configuration',
};

// Different aspect ratios
const mixedAspectImages = [
  {
    id: '1',
    src: 'https://picsum.photos/800/600?random=20',
    alt: 'Landscape photo',
    title: 'Landscape Format',
    description: 'Wide landscape image (16:9 ratio).',
  },
  {
    id: '2',
    src: 'https://picsum.photos/600/800?random=21',
    alt: 'Portrait photo',
    title: 'Portrait Format',
    description: 'Tall portrait image (9:16 ratio).',
  },
  {
    id: '3',
    src: 'https://picsum.photos/800/800?random=22',
    alt: 'Square photo',
    title: 'Square Format',
    description: 'Square image (1:1 ratio).',
  },
  {
    id: '4',
    src: 'https://picsum.photos/1200/400?random=23',
    alt: 'Panorama photo',
    title: 'Panorama Format',
    description: 'Ultra-wide panoramic image (3:1 ratio).',
  },
];

export const MixedAspectRatios = {
  args: {
    images: mixedAspectImages,
    showThumbnails: true,
    thumbnailPosition: 'left',
    showArrows: true,
    showDescription: true,
    enableKeyboard: true,
  },
  name: 'Mixed Aspect Ratios',
};

// With callback
export const WithCallback = {
  args: {
    images: sampleImages,
    showThumbnails: true,
    thumbnailPosition: 'left',
    showArrows: true,
    showDescription: true,
    enableKeyboard: true,
    onImageChange: (index, image) => {
      console.log('Image changed:', index, image.title);
    },
  },
  name: 'With onChange Callback',
};

// Starting at specific image
export const StartAtSecondImage = {
  args: {
    images: sampleImages,
    initialIndex: 1,
    showThumbnails: true,
    thumbnailPosition: 'left',
    showArrows: true,
    showDescription: true,
    enableKeyboard: true,
  },
  name: 'Start at Second Image',
};

// Infinite loop
export const InfiniteLoop = {
  args: {
    images: sampleImages,
    showThumbnails: true,
    thumbnailPosition: 'left',
    showArrows: true,
    showDescription: true,
    enableKeyboard: true,
    loop: true,
  },
  name: 'Infinite Loop',
};

// Corner navigation buttons
export const CornerNavigation = {
  args: {
    images: sampleImages,
    showThumbnails: true,
    thumbnailPosition: 'left',
    showArrows: true,
    arrowStyle: 'corner',
    showDescription: true,
    enableKeyboard: true,
  },
  name: 'Corner Navigation Buttons',
};
