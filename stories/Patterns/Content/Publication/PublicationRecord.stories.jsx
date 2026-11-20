import React from 'react';
import { resolveLanguage } from '../../../../.storybook/language';
import { PublicationRecord } from './PublicationRecord';
import {
  RECORD_LABELS,
  exampleRecord,
  exampleBody,
  severalFiles,
} from './recordFixtures';
import {
  checkAsideContainment,
  checkCoverAffordance,
} from './recordGeometryChecks';
import './publication-record.scss';
import '../../_shared/pattern-demo.scss';

export default {
  id: 'patterns-publication-record',
  title: 'Patterns/Content/Publication/Record',
  component: PublicationRecord,
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen', docs: { source: { html: true } } },
  play: checkArticleGridGeometry,
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
  play: checkCoverAffordance,
};
// Resource cases (#1502, #1505). Standard is the usual Drupal shape: the
// publisher's original plus a hosted backup. The cover links to the first
// primary resource and shows "All downloads (N)" for two or more resources.
export const SeveralFiles = {
  name: 'Several files',
  args: {
    ...Standard.args,
    record: { ...exampleRecord, resources: severalFiles },
  },
};
export const HostedOnly = {
  name: 'Hosted copy only',
  args: {
    ...Standard.args,
    record: {
      ...exampleRecord,
      resources: [
        {
          label: 'Understanding disaster risk',
          href: '/publication-record/reading-en.html',
          origin: 'hosted',
          language: 'English',
          lang: 'en',
          format: 'HTML',
          size: '360 bytes',
        },
      ],
    },
  },
};
// example.org is a reserved documentation domain: the synthetic fixture does
// not claim a real publisher copy exists. Format and size are unknown, so
// only the language shows.
export const ExternalOnly = {
  name: 'Publisher copy only',
  args: {
    ...Standard.args,
    record: {
      ...exampleRecord,
      resources: [
        {
          label: 'Understanding disaster risk',
          href: 'https://example.org/understanding-disaster-risk',
          language: 'English',
          lang: 'en',
          origin: 'publisher',
        },
      ],
    },
  },
};
// The video ID is a placeholder: only the youtube.com host matters, because
// it switches the verb to "Watch".
export const Video = {
  name: 'Video on a video host',
  args: {
    ...Standard.args,
    record: {
      ...exampleRecord,
      resources: [
        {
          label: 'Understanding disaster risk: video introduction',
          href: 'https://www.youtube.com/watch?v=00000000000',
          language: 'English',
          lang: 'en',
          origin: 'publisher',
        },
      ],
    },
  },
};
export const NoCover = {
  name: 'No cover',
  args: { ...Standard.args, record: { ...exampleRecord, cover: undefined } },
};
export const NoFile = {
  name: 'No public file',
  args: { ...Standard.args, record: { ...exampleRecord, resources: [] } },
};
export const LongCopy = {
  name: 'Long content',
  play: checkAsideContainment,
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
        // Synthetic Arabic-script entry first, so the Latin DOI after it must
        // keep its own direction rather than follow the list's first item.
        'رقم الوثيقة التجريبي',
        // Real-world DOI that overflowed the Drupal sidebar in RTL
        // (https://gitlab.com/undrr/web-backlog/-/work_items/3362).
        '10.21953/researchonline.lse.ac.uk.00138625',
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
