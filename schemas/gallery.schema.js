import {
  schemaDocument,
  textField,
  htmlField,
  urlField,
  enumField,
  arrayOf,
} from './helpers.js';

export default schemaDocument({
  id: 'gallery',
  title: 'Gallery',
  description:
    'Media gallery supporting images, videos, embeds, and HTML content ' +
    'with thumbnails and navigation.',
  schema: {
    type: 'object',
    properties: {
      ariaLabel: textField(
        'Accessible name for the gallery landmark. Required when multiple ' +
        'galleries appear on the same page (e.g. "Programme photos", ' +
        '"Event highlights"). Defaults to "Gallery" in the current component.',
      ),
      media: arrayOf(
        {
          type: 'object',
          properties: {
            id: textField('Unique identifier for the media item'),
            type: enumField(
              ['image', 'video', 'embed', 'html'],
              'Media type',
              'image',
            ),
            src: urlField('Primary media source URL'),
            alt: textField('Alt text for images'),
            title: textField('Title displayed below the media'),
            description: textField('Caption or description text'),
            thumbnail: urlField(
              'Thumbnail image URL (falls back to src for images)',
            ),
            poster: urlField('Poster image for video items'),
            embedUrl: urlField(
              'Embed URL for iframe-based media (used when type is embed)',
            ),
            html: htmlField(
              'Raw HTML content (used when type is html)',
            ),
          },
          required: ['id'],
        },
        { minItems: 1 },
      ),
    },
    required: ['media'],
  },
  meta: {
    implementors: ['Gallery'],
    deviations: {},
    notes:
      'Gallery also accepts presentation-only props (showThumbnails, ' +
      'thumbnailPosition, showArrows, arrowStyle, showDescription, ' +
      'enableKeyboard, loop, initialIndex) that are component configuration, ' +
      'not content data.',
  },
});
