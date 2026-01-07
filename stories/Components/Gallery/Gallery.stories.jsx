import { Gallery } from './Gallery';

// Sample images (using placeholder service)
const sampleImages = [
  {
    id: '1',
    src: 'https://picsum.photos/800/600?random=1',
    alt: 'Landscape photo 1',
    title: 'Beautiful Mountain Landscape',
    description:
      'A stunning view of mountains during sunset with vibrant colors in the sky.',
  },
  {
    id: '2',
    src: 'https://picsum.photos/600/800?random=2',
    alt: 'Portrait photo 2',
    title: 'City Architecture',
    description:
      'Modern architecture showcasing geometric patterns and clean lines.',
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
  title: 'Components/Gallery',
  component: Gallery,
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
    media: sampleImages,
    showThumbnails: true,
    thumbnailPosition: 'left',
    showArrows: true,
    showDescription: true,
    enableKeyboard: true,
  },
};

// Gallery with many images (scrolling thumbnails)
export const ManyImages = {
  args: {
    media: manyImages,
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
    media: sampleImages,
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
    media: sampleImages,
    showThumbnails: false,
    showArrows: true,
    showDescription: true,
    enableKeyboard: true,
  },
};

// Without arrows
export const WithoutArrows = {
  args: {
    media: sampleImages,
    showThumbnails: true,
    thumbnailPosition: 'left',
    showArrows: false,
    showDescription: true,
    enableKeyboard: true,
  },
};

// Without descriptions
export const WithoutDescriptions = {
  args: {
    media: sampleImages.map(img => ({
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
};

// Minimal configuration
export const Minimal = {
  args: {
    media: sampleImages.map(img => ({
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
    media: mixedAspectImages,
    showThumbnails: true,
    thumbnailPosition: 'left',
    showArrows: true,
    showDescription: true,
    enableKeyboard: true,
  },
};

// With callback
export const WithCallback = {
  args: {
    media: sampleImages,
    showThumbnails: true,
    thumbnailPosition: 'left',
    showArrows: true,
    showDescription: true,
    enableKeyboard: true,
    onMediaChange: (index, item) => {
      console.log('Media changed:', index, item.title);
    },
  },
  name: 'With onChange Callback',
};

// Starting at specific image
export const StartAtSecondImage = {
  args: {
    media: sampleImages,
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
    media: sampleImages,
    showThumbnails: true,
    thumbnailPosition: 'left',
    showArrows: true,
    showDescription: true,
    enableKeyboard: true,
    loop: true,
  },
};

// Corner navigation buttons
export const CornerNavigation = {
  args: {
    media: sampleImages,
    showThumbnails: true,
    thumbnailPosition: 'left',
    showArrows: true,
    arrowStyle: 'corner',
    showDescription: true,
    enableKeyboard: true,
  },
  name: 'Corner Navigation Buttons',
};

// Mixed media (images, videos, embeds)
const mixedMediaItems = [
  {
    id: '1',
    type: 'image',
    src: 'https://picsum.photos/800/600?random=30',
    alt: 'Sample image',
    title: 'Image Example',
    description: 'A regular image in the gallery.',
  },
  {
    id: '2',
    type: 'video',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://picsum.photos/800/600?random=31',
    poster: 'https://picsum.photos/800/600?random=31',
    alt: 'Big Buck Bunny video',
    title: 'Video Example',
    description: 'A video with controls. Click play to watch.',
  },
  {
    id: '3',
    type: 'embed',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://picsum.photos/800/600?random=32',
    alt: 'YouTube video',
    title: 'Embedded YouTube Video',
    description: 'An embedded YouTube video using iframe.',
  },
  {
    id: '4',
    type: 'image',
    src: 'https://picsum.photos/800/600?random=33',
    alt: 'Another image',
    title: 'Another Image',
    description: 'Back to a regular image.',
  },
];

export const MixedMedia = {
  args: {
    media: mixedMediaItems,
    showThumbnails: true,
    thumbnailPosition: 'left',
    showArrows: true,
    showDescription: true,
    enableKeyboard: true,
  },
  name: 'Mixed Media (Images, Videos, Embeds)',
};

// Mixed media with HTML content
const mixedMediaWithHtml = [
  {
    id: '1',
    type: 'image',
    src: 'https://picsum.photos/800/600?random=40',
    alt: 'Sample image',
    title: 'Image slide',
    description: 'A regular image in the gallery.',
  },
  {
    id: '2',
    type: 'html',
    html: '<h2 style="margin: 0 0 1rem;">Welcome to the Gallery</h2><p style="color: #666;">This slide contains custom HTML content.<br/>You can add any HTML here.</p>',
    title: 'HTML Content Slide',
    description: 'This slide displays inline HTML content.',
  },
  {
    id: '3',
    type: 'image',
    src: 'https://picsum.photos/800/600?random=42',
    alt: 'Another image',
    title: 'Another image',
    description: 'Back to a regular image.',
  },
  {
    id: '4',
    type: 'html',
    html: '<div style="padding: 2rem;"><h3 style="color: #0077b6; margin: 0 0 1rem;">Call to Action</h3><p style="margin-bottom: 1.5rem;">Click the button below to learn more about disaster risk reduction.</p><a href="#" style="display: inline-block; padding: 0.75rem 1.5rem; background: #0077b6; color: white; text-decoration: none; border-radius: 4px;">Learn More</a></div>',
    title: 'Call to Action Slide',
    description: 'An HTML slide with a call to action button.',
  },
];

export const WithHtmlContent = {
  args: {
    media: mixedMediaWithHtml,
    showThumbnails: true,
    thumbnailPosition: 'left',
    showArrows: true,
    showDescription: true,
    enableKeyboard: true,
  },
  name: 'With HTML Content',
};
