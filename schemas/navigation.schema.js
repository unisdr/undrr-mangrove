import {
  schemaDocument,
  textField,
  htmlField,
  urlField,
  linkAction,
  arrayOf,
} from './helpers.js';

// Navigation items support up to 3 levels of nesting in practice.
// Spelled out explicitly rather than using recursive $ref for clarity.
const level3Item = {
  type: 'object',
  properties: {
    title: textField('Menu item display text'),
    url: urlField('Menu item URL'),
  },
  required: ['title'],
};

const level2Item = {
  type: 'object',
  properties: {
    title: textField('Menu item display text'),
    url: urlField('Menu item URL'),
    items: arrayOf(level3Item),
  },
  required: ['title'],
};

const level1Item = {
  type: 'object',
  properties: {
    title: textField('Menu item display text'),
    url: urlField('Menu item URL'),
    items: arrayOf(level2Item),
  },
  required: ['title'],
};

export default schemaDocument({
  id: 'navigation',
  title: 'Navigation',
  description:
    'Multi-level navigation structure with section banners and recursive ' +
    'menu items. Used for mega-menu and primary site navigation.',
  schema: {
    type: 'object',
    properties: {
      sections: arrayOf(
        {
          type: 'object',
          properties: {
            bannerHeading: textField('Heading text for the section banner'),
            bannerDescription: htmlField(
              'Description text for the section banner (HTML supported)',
            ),
            bannerButton: linkAction(),
            items: arrayOf(level1Item),
          },
        },
        { minItems: 1 },
      ),
    },
    required: ['sections'],
  },
  meta: {
    implementors: ['MegaMenu'],
    deviations: {},
    notes:
      'MegaMenu also accepts presentation-only props (delay, hoverDelay, ' +
      'logo*) that are component configuration, not content. These are not ' +
      'part of the content schema.',
  },
});
