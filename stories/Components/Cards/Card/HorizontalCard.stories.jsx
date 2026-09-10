import { expect } from 'storybook/test';
import { HorizontalCard } from './HorizontalCard';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        contentdata: [
          {
            contenttile: 'Content tag',
            title: 'Title in large size',
            summaryText: `Climate change is a <a href="#" class="mg-card__text-link">global health emergency</a>, with impacts felt most acutely
by vulnerable populations and communities.
This paper explores health risks from climate change in a global context, setting out key risks actions`,
            label1: 'Label 1',
            label2: 'Label 2',
            button: 'Primary action',
            link: 'javascript:void(0)',
            imgalt: 'A person looks on',
            imgback:
              'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
          },
        ],
      };
      return engText;
    case 'arabic':
      const arabicText = {
        contentdata: [
          {
            contenttile: 'علامة المحتوى',
            title: 'عنوان بحجم كبير',
            summaryText: `يُعد تغير المناخ <a href="#" class="mg-card__text-link">حالة طوارئ صحية عالمية</a>، حيث تشعر الفئات السكانية والمجتمعات الأكثر ضعفاً بتأثيراته بشكل أكبر. تستكشف هذه الورقة المخاطر الصحية الناجمة عن تغير المناخ في سياق عالمي.`,
            label1: 'التسمية 1',
            label2: 'التسمية 2',
            button: 'الإجراء الأساسي',
            link: 'javascript:void(0)',
            imgalt: 'شخص ينظر',
            imgback:
              'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
          },
        ],
      };
      return arabicText;
    case 'japanese':
      const japaneseText = {
        contentdata: [
          {
            contenttile: 'コンテンツタグ',
            title: '投稿のタイトルはここにあり、2行です',
            button: '続きを読む',
            link: 'javascript:void(0)',
            imgalt: 'A person looks on',
            imgback:
              'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
          },
        ],
      };
      return japaneseText;
    default:
      const dummy = {
        contentdata: [
          {
            contenttile: 'Horizontal card',
            title: 'Title in large size',
            summaryText: `Climate change is a <a href="#" class="mg-card__text-link">global health emergency</a>, with impacts felt most acutely
by vulnerable populations and communities.
This paper explores health risks from climate change in a global context, setting out key risks actions`,
            label1: 'Label 1',
            label2: 'Label 2',
            button: 'Primary action',
            link: 'javascript:void(0)',
            imgalt: 'A person looks on',
            imgback:
              'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
          },
        ],
      };
      return dummy;
  }
};

export default {
  title: 'Components/Cards/Horizontal Card',
  component: HorizontalCard,

  argTypes: {
    variant: {
      options: ['primary', 'secondary', 'tertiary', 'quaternary'],

      control: {
        type: 'inline-radio',
      },

      defaultValue: 'primary',
    },
  },
};

export const DefaultHorizontalCard = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <HorizontalCard data={caption.contentdata} {...args}></HorizontalCard>
    );
  },

  name: 'Horizontal Card',
};

// Cards should normally be links. These stories cover the cases where they
// aren't, so the unlinked treatment is exercised alongside the linked one.

export const NoLinkHorizontalCard = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    const unlinked = caption.contentdata.map(item => ({
      ...item,
      link: null,
      button: null,
    }));

    return <HorizontalCard data={unlinked} {...args}></HorizontalCard>;
  },

  name: 'Without a link',
};

export const ButtonOnlyHorizontalCard = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    const buttonOnly = caption.contentdata.map(item => ({
      ...item,
      link: null,
      buttonLink: 'javascript:void(0)',
    }));

    return <HorizontalCard data={buttonOnly} {...args}></HorizontalCard>;
  },

  name: 'Button only, no card link',
};

export const MixedLinkHorizontalCards = {
  render: (args, { globals: { locale } }) => {
    const [item] = getCaptionForLocale(locale).contentdata;
    const mixed = [
      { ...item },
      { ...item, link: null, buttonLink: 'javascript:void(0)' },
      { ...item, link: null, button: null },
    ];

    return <HorizontalCard data={mixed} {...args}></HorizontalCard>;
  },

  name: 'Mixed group (linked, button only, unlinked)',
};

export const LongContent = {
  render: (args, { globals: { locale } }) => {
    const base = getCaptionForLocale(locale).contentdata[0];
    return (
      <div style={{ maxWidth: '900px' }}>
        <HorizontalCard
          {...args}
          data={[
            {
              ...base,
              summaryText: Array(3)
                .fill(base.summaryText || base.title)
                .join(' '),
            },
          ]}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    await canvasElement.ownerDocument.fonts.ready;
    const frame = canvasElement
      .querySelector('.mg-card__visual')
      .getBoundingClientRect();
    const image = canvasElement
      .querySelector('.mg-card__image')
      .getBoundingClientRect();
    expect(Math.abs(frame.bottom - image.bottom)).toBeLessThan(1);
    expect(Math.abs(frame.height - image.height)).toBeLessThan(1);
  },
};
