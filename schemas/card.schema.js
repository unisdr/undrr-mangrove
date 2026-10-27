import {
  schemaDocument,
  textField,
  htmlField,
  urlField,
  imageObject,
  enumField,
  cssColorField,
  arrayOf,
} from './helpers.js';

export default schemaDocument({
  id: 'card',
  title: 'Card',
  description:
    'Content card representing a single item (article, event, publication) ' +
    'with image, labels, title, summary, and call-to-action. Covers vertical, ' +
    'horizontal, book, and icon card variants.',
  schema: {
    type: 'object',
    properties: {
      items: arrayOf(
        {
          type: 'object',
          properties: {
            id: {
              oneOf: [{ type: 'string' }, { type: 'number' }],
              description: 'Unique identifier for the card item',
            },
            image: imageObject(),
            icon: textField('Icon class name (e.g. "mg-icon mg-icon-globe")'),
            iconSize: {
              type: 'number',
              description: 'Width/height of icon in pixels',
              default: 72,
            },
            imageScale: enumField(
              ['small', 'medium', 'large', 'full'],
              'Scale preset for icon/image display',
            ),
            iconColor: cssColorField('Background color for the icon badge'),
            iconFgColor: cssColorField('Foreground color for the icon glyph'),
            borderColor: cssColorField('Border color for the card'),
            labels: {
              type: 'array',
              items: textField('Category or tag label'),
              maxItems: 2,
              description: 'Category labels displayed in the card meta area',
            },
            visualLabel: textField(
              'Text label rendered above the icon/image in the visual area',
            ),
            title: textField('Card heading text'),
            srOnlyTitle: {
              type: 'boolean',
              description:
                'Visually hide title but keep for screen readers (e.g. logo cards)',
              default: false,
            },
            summary: htmlField(
              'Card body text (sanitized HTML supported)',
            ),
            link: urlField('Primary URL for the card'),
            linkText: textField(
              'Text for a text-style link CTA (alternative to button)',
            ),
            button: textField('Button label text'),
            buttonType: enumField(
              ['Primary', 'Secondary'],
              'Button visual style',
              'Primary',
            ),
          },
          required: ['title'],
        },
        { minItems: 1 },
      ),
      variant: enumField(
        [
          'primary',
          'secondary',
          'tertiary',
          'quaternary',
          'default',
          'negative',
        ],
        'Visual variant. Standard cards use primary-quaternary; IconCard uses default/negative.',
        'primary',
      ),
      centered: {
        type: 'boolean',
        description: 'Center-align card content (IconCard only)',
        default: false,
      },
    },
    required: ['items'],
  },
  meta: {
    implementors: [
      'VerticalCard',
      'HorizontalCard',
      'BookCard',
      'HorizontalBookCard',
      'IconCard',
    ],
  },
});
