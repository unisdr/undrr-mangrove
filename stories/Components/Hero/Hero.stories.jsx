import React from 'react';
import { Hero } from './Hero';

const getCaptionForLocale = locale => {
  const contentByLocale = {
    english: {
      contentdata: [
        {
          title: 'Text in xxl large size<br>&nbsp;Extra large',
          summaryText:
            'Some introductory and summary text that can often occupy multiple lines.<br>&nbsp;This text is after a line break.',
          detail: 'Detail label: Detail',
          label: 'Label in medium size',
          primary_button: 'Primary action',
          secondary_button: 'Secondary action',
          link: '/#',
          imgalt: 'A person looks on',
          imgback:
            'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
        },
      ],
    },
    arabic: {
      contentdata: [
        {
          title: 'علامة المحتوى',
          summaryText: 'عنوان المشاركة يظهر هنا ويتكون من سطرين',
          detail: 'اقرأ أكثر',
          label: 'Label in medium size',
          primary_button: 'Primary action',
          secondary_button: 'Secondary action',
          link: null,
          imgalt: 'A person looks on',
          imgback:
            'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
        },
      ],
    },
    burmese: {
      contentdata: [
        {
          title: 'အကြောင်းအရာ TAG',
          summaryText: 'ပို့စ်ခေါင်းစဉ်ကဒီမှာပါ၊ အဲဒါကစာကြောင်းနှစ်ကြောင်းပါ',
          detail: 'ပိုပြီးဖတ်ပါ',
          label: 'Label in medium size',
          primary_button: 'Primary action',
          secondary_button: 'Secondary action',
          link: '/#',
          imgalt: 'A person looks on',
          imgback:
            'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
        },
      ],
    },
    japanese: {
      contentdata: [
        {
          title: 'コンテンツタグ',
          summaryText: '投稿のタイトルはここにあり、2行です',
          detail: '続きを読む',
          label: 'Label in medium size',
          primary_button: 'Primary action',
          secondary_button: 'Secondary action',
          link: '/#',
          imgalt: 'A person looks on',
          imgback:
            'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
        },
      ],
    },
    default: {
      contentdata: [
        {
          title: 'Text in xxl large size',
          summaryText:
            'Some introductory and summary text that can often occupy multiple lines.',
          detail: 'Detail label: Detail',
          label: 'Label in medium size',
          primary_button: 'Primary action',
          secondary_button: 'Secondary action',
          link: '/#',
          imgalt: 'A person looks on',
          imgback:
            'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
        },
      ],
    },
  };

  return contentByLocale[locale] || contentByLocale.default;
};

export default {
  title: 'Components/Hero/Hero',
  component: Hero,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      options: ['primary', 'secondary', 'tertiary', 'quaternary'],
      control: { type: 'inline-radio' },
      description: 'Variant of the Hero component',
      defaultValue: 'primary',
    },
  },
};

const Template = (args, { globals: { locale } }) => {
  const caption = getCaptionForLocale(locale);
  return <Hero data={caption.contentdata} {...args} />;
};

export const Default = Template.bind({});
Default.args = {
  variant: 'primary',
};

export const NoLink = Template.bind({});
NoLink.args = {
  data: [
    {
      title: 'Title without a link<br>&nbsp;and a line break',
      summaryText:
        'This summary supports HTML.<br>&nbsp;Here is some extra text with a line break.',
      label: 'Label in medium size',
      detail: 'Detail label: Detail',
      primary_button: 'Primary action',
      secondary_button: 'Secondary action',
      link: null,
      imgback:
        'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
    },
  ],
  variant: 'secondary',
};

export const WithHtmlInTitle = Template.bind({});
WithHtmlInTitle.args = {
  data: [
    {
      title: 'Custom title<br>with&nbsp;line breaks and spaces',
      summaryText: 'This is custom summary text.<br>&nbsp;Another line.',
      label: 'Custom Label',
      detail: 'Custom Detail',
      primary_button: 'Custom primary',
      secondary_button: 'Custom secondary',
      link: '/#',
      imgback:
        'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
    },
  ],
  variant: 'tertiary',
};
