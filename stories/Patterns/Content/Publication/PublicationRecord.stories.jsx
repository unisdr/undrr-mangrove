import React from 'react';
import { resolveLanguage } from '../../../../.storybook/language';
import { PublicationRecord } from './PublicationRecord';
import { RECORD_LABELS, exampleRecord, exampleBody } from './recordFixtures';
import './publication-record.scss';
import '../../_shared/pattern-demo.scss';

export default {
  id: 'patterns-publication-record',
  title: 'Patterns/Content/Publication/Record',
  component: PublicationRecord,
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen', docs: { source: { html: true } } },
  render: (args, context) => {
    const language = resolveLanguage(context.globals);
    return (
      <PublicationRecord
        {...args}
        lang={language.lang}
        dir={language.dir}
        labels={RECORD_LABELS[language.locale] || RECORD_LABELS.english}
      />
    );
  },
};
export const Standard = {
  name: 'Experimental publication record',
  args: { record: exampleRecord, children: exampleBody },
};
export const NoCover = {
  name: 'No cover',
  args: { ...Standard.args, record: { ...exampleRecord, cover: undefined } },
};
export const NoFile = {
  name: 'No public file',
  args: { ...Standard.args, record: { ...exampleRecord, resources: [] } },
};
// Duplicate local copy demonstrates original/backup roles without implying real external provenance.
export const LocalBackup = {
  name: 'Original / local backup',
  args: {
    record: {
      ...exampleRecord,
      resources: [
        {
          ...exampleRecord.resources[0],
          backup: {
            label: 'Read the backup copy',
            href: '/publication-record/reading-en-backup.html',
            lang: 'en',
            language: 'English',
            format: 'HTML',
          },
        },
      ],
    },
    children: exampleBody,
  },
};
export const LongCopy = {
  name: 'Long content',
  args: {
    record: {
      ...exampleRecord,
      title:
        'Understanding disaster risk: a comprehensive demonstration of bibliographic identity, evidence, uncertainty and information for decisions across communities and institutions',
      authors: [
        'A very long authored name with several family names preserved as one author',
        ...exampleRecord.authors,
      ],
      identifiers: [
        'EXAMPLE/very-long-opaque-identifier-without-invented-DOI-linking-000000000000000000000000000000000000000000000000000000000',
      ],
      details: [
        { label: 'Policy validity period', value: '2025–2030' },
        { label: 'Resolution / report date', value: '15 March 2026' },
      ],
    },
    children: (
      <>
        {exampleBody}
        {Array.from({ length: 8 }, (_, index) => (
          <p key={index}>
            Long-copy reading specimen. Preserve the complete approved
            description rather than substituting a teaser summary. Keep
            publication year, policy validity and resolution dates distinct, and
            do not infer them from the page posting time.
          </p>
        ))}
      </>
    ),
  },
};
