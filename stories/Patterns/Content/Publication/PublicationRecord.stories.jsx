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
export const Minimal = {
  args: { record: { title: 'Understanding disaster risk', lang: 'en' } },
};
export const NoCover = {
  args: { ...Standard.args, record: { ...exampleRecord, cover: undefined } },
};
export const NoFile = {
  args: { ...Standard.args, record: { ...exampleRecord, resources: [] } },
};
export const ExternalOnly = {
  args: {
    record: {
      title: 'Sendai Framework for Disaster Risk Reduction 2015–2030',
      lang: 'en',
      publicationYear: 2015,
      sources: [
        { label: 'United Nations – Headquarters', href: 'https://www.un.org' },
        {
          label: 'United Nations Office for Disaster Risk Reduction',
          href: 'https://www.undrr.org',
        },
      ],
      resources: [
        {
          label: 'Access the Sendai Framework publication record',
          href: 'https://www.undrr.org/publication/sendai-framework-disaster-risk-reduction-2015-2030',
        },
      ],
    },
  },
};
// Duplicate local copy demonstrates original/backup roles without implying real external provenance.
export const LocalBackup = {
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
export const RtlStress = {
  args: {
    record: {
      ...exampleRecord,
      title: 'فهم مخاطر الكوارث',
      summary:
        'مقدمة لفهم مخاطر الكوارث وتفسير الأدلة واستخدام المعلومات في اتخاذ القرارات.',
      edition: 'طبعة توضيحية',
      identifiers: ['مثال / ٢٠٢٦ / ٠١'],
      lang: 'ar',
      cover: undefined,
      authors: ['مجموعة العمل التحريرية'],
      sources: [],
      citation: undefined,
      resources: [],
    },
    children: (
      <p lang="ar" dir="rtl">
        نموذج تحريري لاختبار قراءة النص العربي مع الحفاظ على معنى البيانات
        الببليوغرافية وترتيبها.
      </p>
    ),
  },
  render: (args, context) => {
    const language = resolveLanguage(context.globals);
    return (
      <PublicationRecord
        {...args}
        lang={language.lang}
        dir="rtl"
        labels={RECORD_LABELS[language.locale] || RECORD_LABELS.english}
      />
    );
  },
};
