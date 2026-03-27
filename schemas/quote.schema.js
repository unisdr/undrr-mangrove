import {
  schemaDocument,
  htmlField,
  imageObject,
  enumField,
} from './helpers.js';

export default schemaDocument({
  id: 'quote',
  title: 'Quote',
  description:
    'Highlighted quote with optional attribution, portrait image, and visual styling.',
  schema: {
    type: 'object',
    properties: {
      quote: htmlField('The quote text (sanitized HTML supported)'),
      attribution: htmlField('Name of the person being quoted'),
      attributionTitle: htmlField(
        'Title or position of the person being quoted',
      ),
      image: imageObject({ description: 'Portrait or related image' }),
      backgroundColor: enumField(
        ['light', 'dark', 'bright'],
        'Background color variant',
        'light',
      ),
      variant: enumField(
        ['line', 'image'],
        'Layout variant: line (with separator) or image (with background image)',
        'line',
      ),
      alignment: enumField(
        ['full', 'left', 'right'],
        'Layout alignment',
        'full',
      ),
    },
    required: ['quote'],
  },
  meta: {
    implementors: ['QuoteHighlight'],
    deviations: {
      image:
        'Current component uses flat `imageSrc` (string) and `imageAlt` (string) props instead of a nested image object.',
      'image.src': 'Maps to current `imageSrc` prop.',
      'image.alt': 'Maps to current `imageAlt` prop.',
    },
  },
});
