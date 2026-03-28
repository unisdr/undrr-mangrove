import {
  schemaDocument,
  textField,
  htmlField,
  urlField,
  enumField,
  arrayOf,
} from './helpers.js';

export default schemaDocument({
  id: 'statistic',
  title: 'Statistic',
  description:
    'Statistics display with icon, value, labels, and optional description. ' +
    'Used for key metrics and data highlights.',
  schema: {
    type: 'object',
    properties: {
      ariaLabel: textField(
        'Accessible name for the statistics group landmark. Required when no ' +
        'visible title is present, or when multiple statistics groups appear ' +
        'on the same page.',
      ),
      title: textField('Heading for the statistics section'),
      stats: arrayOf(
        {
          type: 'object',
          properties: {
            icon: textField(
              'Icon class name (e.g. "mg-icon mg-icon-lightbulb")',
            ),
            label: textField('Label displayed above the value'),
            value: {
              oneOf: [{ type: 'string' }, { type: 'number' }],
              description:
                'The main statistic value (e.g. "1,500+", "45%", "$223B")',
            },
            bottomLabel: textField('Label displayed below the value'),
            summary: htmlField(
              'Descriptive text (sanitized HTML supported)',
            ),
            link: urlField('URL to make the stat item clickable'),
          },
          required: ['value'],
        },
        { minItems: 1 },
      ),
      variant: enumField(
        ['default', 'compact', 'highlighted', 'negative'],
        'Visual variant',
        'default',
      ),
    },
    required: ['stats'],
  },
  meta: {
    implementors: ['StatsCard', 'StatsCardItem'],
    deviations: {
      'stats[].summary':
        'Current component uses `summaryText` as the prop name.',
    },
  },
});
