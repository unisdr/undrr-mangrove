import { schemaDocument, textField } from './helpers.js';

export default schemaDocument({
  id: 'share-action',
  title: 'Share Action',
  description:
    'Configuration for social sharing buttons with customizable labels ' +
    'and email content.',
  schema: {
    type: 'object',
    properties: {
      labels: {
        type: 'object',
        description:
          'UI labels for the share component (supports localization)',
        properties: {
          mainLabel: textField(
            'Header text displayed above share buttons',
          ),
          onCopy: textField(
            'Feedback text shown after copying the link',
          ),
        },
        required: ['mainLabel'],
      },
      sharingSubject: textField('Subject line for email sharing'),
      sharingBody: textField(
        'Body text prepended to the shared URL in emails',
      ),
    },
    required: ['labels'],
  },
  meta: {
    implementors: ['ShareButtons'],
    deviations: {
      sharingSubject:
        'Current component uses PascalCase `SharingSubject` prop.',
      sharingBody:
        'Current component uses PascalCase `SharingTextBody` prop. ' +
        'Schema renames to `sharingBody` (camelCase, drops redundant "Text").',
    },
  },
});
