import React from 'react';
import { Hero } from './Hero';
import logo from '../../assets/images/undrr-logo-white.svg';

const resilientInfrastructureWide =
  'https://www.undrr.org/sites/default/files/styles/ultrawide_16_6/public/2023-11/resilient-infrastructure-pikoso-kz-shutterstock.jpg?h=82ac03c6&itok=26BkbHiW';
const resilientInfrastructure =
  'https://www.undrr.org/sites/default/files/2023-11/resilient-infrastructure-pikoso-kz-shutterstock.jpg';
const disasterRiskWide =
  'https://www.undrr.org/sites/default/files/styles/ultrawide_16_6/public/2023-03/Shutterstock_656134321-min.jpg?h=90c64985&itok=ukR7hDqu';

const getCaptionForLocale = locale => {
  const contentByLocale = {
    english: {
      contentdata: [
        {
          title: 'Principles for resilient infrastructure',
          summaryText:
            'Practical guidance to improve the continuity of critical services and make risk-informed investment decisions.',
          detail: '72-page publication',
          label: 'Guidance for resilient systems',
          primary_button: 'Read the principles',
          secondary_button: 'Explore infrastructure resilience',
          link: '/#',
          imgalt: 'Aerial view of a canal through Almaty, Kazakhstan',
          imgback: resilientInfrastructureWide,
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
          imgalt: 'منظر جوي لقناة عبر ألماتي في كازاخستان',
          imgback: resilientInfrastructureWide,
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
          imgalt: 'Aerial view of a canal through Almaty, Kazakhstan',
          imgback: resilientInfrastructureWide,
        },
      ],
    },
    default: {
      contentdata: [
        {
          title: 'Principles for resilient infrastructure',
          summaryText:
            'Practical guidance to improve the continuity of critical services and make risk-informed investment decisions.',
          detail: '72-page publication',
          label: 'Guidance for resilient systems',
          primary_button: 'Read the principles',
          secondary_button: 'Explore infrastructure resilience',
          link: '/#',
          imgalt: 'Aerial view of a canal through Almaty, Kazakhstan',
          imgback: resilientInfrastructureWide,
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
        title: 'Shifting to resilient infrastructure',
        summaryText:
          'Prevent new risks and strengthen existing infrastructure challenged by climate change, obsolescence and multisector interdependence.',
        label: 'Regional Assessment Report 2023',
        detail: 'Europe and Central Asia',
        primary_button: 'Explore the report',
        secondary_button: 'Read the analysis',
        link: null,
        imgalt: 'Aerial view of a canal through Almaty, Kazakhstan',
        imgback: resilientInfrastructureWide,
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
        title: 'Infrastructure resilience<br>can no longer be optional',
        summaryText:
          'Critical infrastructure keeps societies functioning. Higher resilience standards can protect lives, development gains and essential services.',
        label: 'Expert perspective',
        detail: 'Kamal Kishore, UN Special Representative',
        primary_button: 'Read the perspective',
        secondary_button: 'View the principles',
        link: '/#',
        imgalt: 'People walking through terraced rice fields',
        imgback: disasterRiskWide,
      },
    ],
    variant: 'tertiary',
  },
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Hero data={caption.contentdata} {...args} />;
  },
};

export const ImmersiveContained = {
  name: 'Immersive (contained)',
  args: {
    data: [
      {
        logo: { src: logo, alt: 'UNDRR' },
        label: 'Component library and design system',
        title: 'Build resilient digital experiences together.',
        summaryText:
          'Accessible, reusable content patterns help teams move faster while preserving each product’s identity.',
        imgback: resilientInfrastructureWide,
        buttons: [
          { label: 'Get started', url: '#' },
          { label: 'Browse components', url: '#', type: 'Secondary' },
        ],
      },
    ],
    contained: true,
    size: 'immersive',
  },
};

// Below the tablet breakpoint the background layout is a different
// composition: the photograph is a banner across the top and the copy sits on
// the brand surface underneath it, because copy over the frame could not be
// made to clear 4.5:1 in any theme (unisdr/undrr-mangrove#1264). That only
// happens at a mobile viewport, so a desktop canvas cannot show it and the
// story pins one. The label is the block the old veil failed hardest on, so
// this story leads with a long one.
// See docs/COLOUR-CONTRAST-METHODOLOGY.md#the-hero-scrim
export const MobileBanner = {
  name: 'Mobile banner and panel',
  globals: { viewport: { value: '390px-844px', isRotated: false } },
  args: {
    data: [
      {
        title: 'Early warnings for all by the end of 2027',
        summaryText:
          'Every person on Earth should be protected by a multi-hazard early warning system. Four pillars carry the target: knowing the risk, detecting it, communicating it, and being ready to act.',
        detail: 'Global initiative',
        label: 'Early warnings for all',
        primary_button: 'Read the initiative',
        secondary_button: 'See country progress',
        link: '/#',
        imgalt: 'Aerial view of a canal through Almaty, Kazakhstan',
        imgback: resilientInfrastructureWide,
      },
    ],
    variant: 'primary',
  },
};

// A background hero with no photograph. The banner inherits the element's
// background image, and there is nothing to inherit -- so without the
// `mg-hero--no-image` class the component now adds, the mobile composition
// would reserve a third of a phone screen for a photograph that never
// arrives. The banner collapses to nothing instead and the copy keeps the
// solid panel. Pinned to a phone viewport for the same reason as the story
// above.
export const NoBackgroundImage = {
  name: 'No background image (mobile)',
  globals: { viewport: { value: '390px-844px', isRotated: false } },
  args: {
    data: [
      {
        title: 'Early warnings for all by the end of 2027',
        summaryText:
          'Every person on Earth should be protected by a multi-hazard early warning system.',
        detail: 'Global initiative',
        label: 'Early warnings for all',
        primary_button: 'Read the initiative',
        link: '/#',
      },
    ],
    variant: 'primary',
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
      src: resilientInfrastructure,
      alt: 'Aerial view of a canal through Almaty, Kazakhstan',
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
          src: 'https://www.youtube.com/embed/lJWNmqYmKEQ',
          title: 'This is how timely early warnings save lives — UNDRR',
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
    <img src="${disasterRiskWide}" alt="People walking through terraced rice fields" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
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
