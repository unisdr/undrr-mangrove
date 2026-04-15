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
          label: 'تسمية بحجم متوسط',
          primary_button: 'إجراء أساسي',
          secondary_button: 'إجراء ثانوي',
          link: null,
          imgalt: 'شخص ينظر',
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
    layout: {
      options: ['background', 'split'],
      control: { type: 'inline-radio' },
      description:
        'Layout mode: full-bleed background image, or solid background with media column.',
      defaultValue: 'background',
    },
    headingLevel: {
      options: ['h1', 'h2', 'h3'],
      control: { type: 'inline-radio' },
      description:
        "Heading element for the title. Use h1 for the page's primary heading, h2/h3 for mid-page.",
      defaultValue: 'h1',
    },
    split: {
      options: ['2/3', '1/2', '1/3'],
      control: { type: 'inline-radio' },
      description:
        'Column split for layout="split". Content column is always first.',
      defaultValue: '2/3',
    },
  },
};

export const Default = {
  args: {
    variant: 'primary',
  },
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Hero data={caption.contentdata} {...args} />;
  },
};

export const NoLink = {
  args: {
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
  },
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Hero data={caption.contentdata} {...args} />;
  },
};

export const WithHtmlInTitle = {
  args: {
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
  },
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Hero data={caption.contentdata} {...args} />;
  },
};

const splitMediaData = [
  {
    title: 'Comprehensive disaster and climate risk management',
    summaryText:
      '<p>CRM is a holistic approach to managing the risks associated with both climatic and non-climatic hazards across varied time scales and levels.</p><p>It seeks to build long-term resilience among countries and communities in vulnerable conditions.</p>',
    label: 'Topic',
    primary_button: 'Download a flyer on CRM',
    secondary_button: 'Learn more',
    media: {
      type: 'image',
      src: 'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
      alt: 'Aerial view of a road through a green forest',
    },
  },
];

export const SplitDefault = {
  name: 'Split (2/3 content, default)',
  args: {
    data: splitMediaData,
    layout: 'split',
    variant: 'primary',
    headingLevel: 'h1',
    split: '2/3',
  },
};

export const SplitBalanced = {
  name: 'Split (1/2 balanced)',
  args: {
    data: splitMediaData,
    layout: 'split',
    variant: 'secondary',
    headingLevel: 'h2',
    split: '1/2',
  },
};

export const SplitMediaLed = {
  name: 'Split (1/3 media-led)',
  args: {
    data: splitMediaData,
    layout: 'split',
    variant: 'tertiary',
    headingLevel: 'h2',
    split: '1/3',
  },
};

export const SplitWithVideo = {
  name: 'Split (video embed)',
  args: {
    data: [
      {
        title: 'Watch: early warning for all',
        summaryText:
          '<p>A short film on how multi-hazard early warning systems save lives in every region.</p>',
        label: 'Video',
        primary_button: 'More stories',
        media: {
          type: 'video',
          src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          title: 'Early warning for all — UNDRR',
        },
      },
    ],
    layout: 'split',
    variant: 'primary',
    headingLevel: 'h2',
    split: '1/2',
  },
};

export const SplitWithHtml = {
  name: 'Split (custom HTML slot)',
  args: {
    data: [
      {
        title: 'Global Assessment Report 2026',
        summaryText:
          "<p>UNDRR's flagship biennial review of global progress on disaster risk reduction.</p>",
        label: 'Flagship report',
        primary_button: 'Read the report',
        media: {
          type: 'html',
          html: `
<div style="padding: 1.5rem; box-sizing: border-box; height: 100%; display: flex; flex-direction: column; gap: 0.75rem;">
  <span style="align-self: flex-start; background: rgba(255, 255, 255, 0.18); color: #fff; font-size: 0.75rem; letter-spacing: 0.05em; text-transform: uppercase; padding: 0.25rem 0.75rem; border-radius: 999px;">Custom composition</span>
  <figure style="margin: 0; flex: 1; position: relative; overflow: hidden; border-radius: 4px;">
    <img src="https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg" alt="Aerial view of a road through a green forest" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
    <figcaption style="position: absolute; inset-inline: 0; inset-block-end: 0; background: rgba(0, 0, 0, 0.7); color: #fff; padding: 0.5rem 0.75rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; font-size: 0.875rem;">
      <strong>From the cover essay</strong>
      <span>Photo: UNDRR</span>
    </figcaption>
  </figure>
</div>`,
        },
      },
    ],
    layout: 'split',
    variant: 'quaternary',
    headingLevel: 'h2',
    split: '1/2',
  },
};
