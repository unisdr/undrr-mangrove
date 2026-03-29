import {
  schemaDocument,
  textField,
  htmlField,
  imageObject,
  enumField,
  cssColorField,
  linkAction,
  arrayOf,
} from './helpers.js';

export default schemaDocument({
  id: 'text-cta',
  title: 'Text CTA',
  description:
    'Call-to-action banner with heading, rich text, action buttons, ' +
    'and optional image.',
  schema: {
    type: 'object',
    properties: {
      headline: textField('Banner heading text'),
      headlineSize: textField(
        'Font size token for headline (e.g. "600", "800"). ' +
          'Maps to mg-u-font-size-{value}.',
      ),
      headlineLevel: {
        type: 'integer',
        minimum: 2,
        maximum: 6,
        default: 2,
        description:
          'Semantic heading level (2-6). Controls the HTML element ' +
          'independently of visual size.',
      },
      text: htmlField('Body text (sanitized HTML supported)'),
      buttons: arrayOf(linkAction({ withType: true })),
      variant: enumField(
        ['primary', 'secondary', 'tertiary', 'quaternary'],
        'Color variant',
        'primary',
      ),
      backgroundColor: cssColorField(
        'Custom CSS background color (overrides variant)',
      ),
      padding: textField('Custom CSS padding value (overrides theme token)'),
      image: imageObject({ description: 'Banner image' }),
      centered: {
        type: 'boolean',
        description:
          'Center-align content (automatically disabled when image is set)',
        default: true,
      },
    },
  },
  meta: {
    implementors: ['TextCta'],
  },
});
