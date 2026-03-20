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
