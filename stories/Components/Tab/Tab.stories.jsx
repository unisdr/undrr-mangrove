// stories\Components\Tab\Tab.stories.jsx
import { Tab } from './Tab';
const getCaptionForLocale = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        tabdata: [
          {
            text: 'Tab title 1',
            text_id: 'tab-1',
            data: 'As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities.',
          },
          {
            text: 'Tab title 2',
            text_id: 'tab-2',
            data: 'The Sendai Framework is the global roadmap for reducing human and economic loss as a direct result of disasters.',
            is_default: 'true',
          },
          {
            text: 'Tab title 3 i am a bit longer and go on and on',
            text_id: 'tab-3',
            data: 'Midterm Review of the Sendai Framework - Register your interest for consultations on the Political Declaration.',
          },
        ],
      };
      return engText.tabdata;
    case 'arabic':
      const arabicText = {
        tabdata: [
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
        ],
      };
      return arabicText.tabdata;
    case 'japanese':
      const japaneseText = {
        tabdata: [
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
        ],
      };
      return japaneseText.tabdata;
    default:
      const dummy = {
        tabdata: [
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
        ],
      };
      return dummy.tabdata;
  }
};

export default {
  title: 'Components/Tabs',
  component: Tab,
};

export const Tabs = {
  render: (args, { globals: { locale } }) => {
    let caption = getCaptionForLocale(locale);
    caption = caption.map(tab => ({ ...tab, is_default: 'false' }));
    return <Tab tabdata={caption} />;
  },
};

export const TabsWithDefault = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Tab tabdata={caption} />;
  },
};

export const StackedTabs = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Tab tabdata={caption} variant="stacked" />;
  },
};

export const StackedWithDefaultOpen = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Tab tabdata={caption} variant="stacked" />;
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
        <Tab tabdata={caption} variant="stacked" />
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
  render: () => (
    <Tab
      tabdata={faqData}
      variant="stacked"
      defaultOpen={false}
      filterable
      filterPlaceholder="Filter questions…"
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
