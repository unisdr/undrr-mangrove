// stories\Components\Tab\Tab.stories.jsx
import { Tab } from './Tab';
import {
  LABELS_AR,
  LABELS_ES,
  LABELS_FR,
  LABELS_JA,
  LABELS_RU,
  LABELS_ZH,
} from './_labels';

const LOCALE_LABELS = {
  spanish: LABELS_ES,
  french: LABELS_FR,
  japanese: LABELS_JA,
  chinese: LABELS_ZH,
  arabic: LABELS_AR,
  russian: LABELS_RU,
};

const withLocaleLabels = (Story, context) => {
  const labels = LOCALE_LABELS[context.globals?.locale];
  if (!labels) return <Story />;
  return <Story {...context} args={{ ...context.args, labels }} />;
};

// Tab content (tabdata) per locale — separate from UI labels.
const getCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return [
        {
          text: 'عنوان التبويب 1',
          text_id: 'tab-1',
          data: 'بصفته مكتب الأمم المتحدة للحد من مخاطر الكوارث، يجمع المكتب الشركاء وينسق الأنشطة لإنشاء مجتمعات أكثر أمانًا ومرونة.',
        },
        {
          text: 'عنوان التبويب 2',
          text_id: 'tab-2',
          data: 'إطار سنداي هو خارطة الطريق العالمية للحد من الخسائر البشرية والاقتصادية الناتجة مباشرة عن الكوارث.',
          is_default: 'true',
        },
        {
          text: 'عنوان التبويب 3 وهو أطول قليلاً',
          text_id: 'tab-3',
          data: 'المراجعة النصفية لإطار سنداي - سجل اهتمامك للمشاركة في المشاورات حول الإعلان السياسي.',
        },
      ];
    case 'japanese':
      return [
        {
          text: 'タブ1',
          text_id: 'tab-1',
          data: 'ダミーテキストとは、Webサイトのモックアップを埋めるために使用されるコンテンツの一部を指します。このテキストは、WebデザイナーがWebサイトが完成品としてどのように見えるかをよりよく想像するのに役立ちます。ダミーテキストには何の意味もないことを理解することが重要です。その唯一の目的は、著作権を侵害することなく、「単語のような」コンテンツで空白を埋めることです。',
        },
        {
          text: 'タブ2',
          text_id: 'tab-2',
          data: 'このテキストは、WebデザイナーがWebサイトが完成品としてどのように見えるかをよりよく想像するのに役立ちます。ダミーテキストには何の意味もないことを理解することが重要です。その唯一の目的は、著作権を侵害することなく、「単語のような」コンテンツで空白を埋めることです。',
          is_default: 'true',
        },
        {
          text: 'タブ3',
          text_id: 'tab-3',
          data: 'ダミーテキストとは、Webサイトのモックアップを埋めるために使用されるコンテンツの一部を指します。このテキストは、WebデザイナーがWebサイトが完成品としてどのように見えるかをよりよく想像するのに役立ちます。ダミーテキストには何の意味もないことを理解することが重要です。',
        },
      ];
    case 'english':
    default:
      return [
        {
          text: 'Tab title 1',
          text_id: 'tab-1',
          data: "<a href='#'>As the UN Office for Disaster Risk Reduction</a>, UNDRR convenes partners and coordinates activities to create safer, more resilient communities.",
        },
        {
          text: 'Tab title 2',
          text_id: 'tab-2',
          data: "The Sendai Framework is the <a href='#'>global roadmap</a> for reducing human and economic loss as a direct result of disasters.",
          is_default: 'true',
        },
        {
          text: 'Tab title 3 i am a bit longer and on and on',
          text_id: 'tab-3',
          data: 'Midterm Review of the Sendai Framework - Register your interest for consultations on the Political Declaration.',
        },
      ];
  }
};

export default {
  title: 'Components/Tabs',
  component: Tab,
  decorators: [withLocaleLabels],
};

export const Tabs = {
  render: (args, { globals: { locale } }) => {
    let caption = getCaptionForLocale(locale);
    caption = caption.map(tab => ({ ...tab, is_default: 'false' }));
    return <Tab tabdata={caption} labels={args.labels} />;
  },
};

export const TabsWithDefault = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Tab tabdata={caption} labels={args.labels} />;
  },
};

export const StackedTabs = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Tab tabdata={caption} variant="stacked" labels={args.labels} />;
  },
};

export const StackedWithDefaultOpen = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <Tab
        tabdata={caption}
        variant="stacked"
        defaultOpen
        labels={args.labels}
      />
    );
  },
  name: 'Stacked with default open',
};

export const StackedWithDeepLink = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <>
        <p>Click a link below to activate a section via deep link:</p>
        <ul>
          <li>
            <a href="#mg-tabs__section-tab-1">Open section 1</a>
          </li>
          <li>
            <a href="#mg-tabs__section-tab-2">Open section 2</a>
          </li>
          <li>
            <a href="#mg-tabs__section-tab-3">Open section 3</a>
          </li>
        </ul>
        <Tab tabdata={caption} variant="stacked" labels={args.labels} />
      </>
    );
  },
  name: 'Stacked with deep link',
};

const faqData = [
  {
    text: 'What is the Sendai Framework?',
    text_id: 'faq-sendai',
    data: '<p>The Sendai Framework for Disaster Risk Reduction 2015-2030 is a voluntary, non-binding agreement that maps out a broad, people-centred approach to disaster risk reduction.</p>',
  },
  {
    text: 'How do I report national progress?',
    text_id: 'faq-reporting',
    data: '<p>National progress is reported through the <a href="#">Sendai Framework Monitor</a>, an online tool for countries to track and report on their implementation.</p>',
  },
  {
    text: 'What data sources are available?',
    text_id: 'faq-data',
    data: '<p>Several data platforms support disaster risk reduction:</p><ul><li>DesInventar Sendai — disaster loss data</li><li>Sendai Monitor — national progress reports</li><li>Global Risk Data Platform — hazard and risk data</li></ul>',
  },
  {
    text: 'Who can I contact for support?',
    text_id: 'faq-contact',
    data: '<p>Contact the UNDRR regional offices or visit <a href="#">preventionweb.net</a> for resources and community support.</p>',
  },
];

export const StackedAsFaq = {
  render: args => (
    <Tab
      tabdata={faqData}
      variant="stacked"
      defaultOpen={false}
      filterable
      labels={{ filterPlaceholder: 'Filter questions…', ...args.labels }}
    />
  ),
  name: 'Stacked as FAQ',
};

export const StackedSingleOpen = {
  render: () => (
    <Tab tabdata={faqData} variant="stacked" defaultOpen={false} singleOpen />
  ),
  name: 'Stacked single-open',
};

export const StackedFaqAccordion = {
  render: args => (
    <Tab
      tabdata={faqData}
      variant="stacked"
      defaultOpen={false}
      singleOpen
      filterable
      labels={{ filterPlaceholder: 'Search questions…', ...args.labels }}
    />
  ),
  name: 'Stacked FAQ accordion',
};
