import { expect } from 'storybook/test';
import ScrollContainer from '../../ScrollContainer/ScrollContainer';
import { scrollCardExamples } from '../../ScrollContainer/ScrollContainerExamples';
import { VerticalCard } from './VerticalCard';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        contentdata: [
          {
            contenttile: 'Content tag',
            title: 'Title in large size',
            summaryText: `Climate change is a <a href="#" class="mg-card__text-link">global health emergency</a>, with impacts felt most acutely
by vulnerable populations and communities.This paper explores health risks from climate change in a global context, setting out key risks actions`,
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
            contenttile: 'Vertical card',
            title: 'Title in large size with up to two lines of text',
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
  title: 'Components/Cards/Vertical Card',
  component: VerticalCard,

  args: {
    variant: 'primary',
  },

  argTypes: {
    variant: {
      options: ['primary', 'secondary', 'tertiary', 'quaternary'],

      control: {
        type: 'inline-radio',
      },
    },
  },
};

export const DefaultVerticalCard = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <div
        style={{
          maxWidth: '300px',
        }}
      >
        <VerticalCard data={caption.contentdata} {...args}></VerticalCard>
      </div>
    );
  },

  name: 'Vertical Card',
};

export const PlainTitleVerticalCard = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <div
        style={{
          maxWidth: '300px',
        }}
      >
        <VerticalCard
          data={caption.contentdata}
          className="mg-card--plain-title"
          {...args}
        ></VerticalCard>
      </div>
    );
  },

  name: 'Plain title (opt-out)',
};

export const NoImageVerticalCard = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    const noImageData = caption.contentdata.map(item => ({
      ...item,
      imgback: null,
      imgalt: null,
    }));

    return (
      <div
        style={{
          maxWidth: '300px',
        }}
      >
        <VerticalCard data={noImageData} {...args}></VerticalCard>
      </div>
    );
  },

  name: 'Vertical Card Without Image',
};

// Cards should normally be links. These stories cover the cases where they
// aren't, so the unlinked treatment is exercised alongside the linked one.

export const NoLinkVerticalCard = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    const unlinked = caption.contentdata.map(item => ({
      ...item,
      link: null,
      button: null,
    }));

    return (
      <div
        style={{
          maxWidth: '300px',
        }}
      >
        <VerticalCard data={unlinked} {...args}></VerticalCard>
      </div>
    );
  },

  name: 'Without a link',
};

export const ButtonOnlyVerticalCard = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    const buttonOnly = caption.contentdata.map(item => ({
      ...item,
      link: null,
      buttonLink: 'javascript:void(0)',
    }));

    return (
      <div
        style={{
          maxWidth: '300px',
        }}
      >
        <VerticalCard data={buttonOnly} {...args}></VerticalCard>
      </div>
    );
  },

  name: 'Button only, no card link',
};

export const MixedLinkVerticalCards = {
  render: (args, { globals: { locale } }) => {
    const [item] = getCaptionForLocale(locale).contentdata;
    const mixed = [
      { ...item },
      { ...item, link: null, buttonLink: 'javascript:void(0)' },
      { ...item, link: null, button: null },
    ];

    return (
      <div
        style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        }}
      >
        <VerticalCard data={mixed} {...args}></VerticalCard>
      </div>
    );
  },

  name: 'Mixed group (linked, button only, unlinked)',
};

// Reference for content already published through Drupal Gutenberg, which
// emits `<a href="">` and a sibling button rather than a plain-text title.
// Rendered as raw markup on purpose: it is what the CSS has to repair.
export const LegacyEmptyHrefMarkup = {
  render: () => (
    <div
      style={{
        maxWidth: '300px',
      }}
      dangerouslySetInnerHTML={{
        __html: `<article class="wp-block-undrr-undrr-card mg-card mg-card__vc">
  <div class="mg-card__visual">
    <img src="https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg" alt="illustration" class="mg-card__image" loading="lazy">
  </div>
  <div class="mg-card__content">
    <header class="mg-card__title"><a href="">Jobs and Careers</a></header>
    <div class="mg-card__summary">Stay current on the latest vacancies and current job trends in disaster risk reduction.</div>
    <a href="javascript:void(0)" class="mg-button mg-button-primary mg-button-arrow" role="button" type="Primary">BUTTON</a>
  </div>
</article>`,
      }}
    />
  ),

  name: 'Legacy Gutenberg markup (empty href)',
};

// Mixed content deliberately exercises wrapping, missing media and missing CTAs.
const groupedCards = scrollCardExamples.map((card, index) => ({
  title: card.title,
  summaryText: card.summary,
  imgback: index === 3 ? undefined : card.image,
  imgalt: card.alt,
  button: index === 4 ? undefined : card.action,
  link: `#card-example-${index + 1}`,
}));

// Browser geometry assertions catch regressions that DOM-only tests cannot.
const checkCardRows = async ({ canvasElement }) => {
  await canvasElement.ownerDocument.fonts.ready;
  const rows = new Map();
  canvasElement.querySelectorAll('.mg-card__vc').forEach(card => {
    const bounds = card.getBoundingClientRect();
    const key = Math.round(bounds.top);
    const row = rows.get(key) || [];
    row.push(card);
    rows.set(key, row);
  });
  expect([...rows.values()].flat()).toHaveLength(groupedCards.length);
  rows.forEach(cards => {
    const bottoms = cards.map(card => card.getBoundingClientRect().bottom);
    expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThan(1);
    const actions = cards
      .map(card => card.querySelector('.mg-button'))
      .filter(Boolean);
    if (actions.length > 1) {
      const actionBottoms = actions.map(
        action => action.getBoundingClientRect().bottom
      );
      expect(
        Math.max(...actionBottoms) - Math.min(...actionBottoms)
      ).toBeLessThan(1);
    }
  });
};

export const GridOfCards = {
  play: checkCardRows,
  render: args => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
        gap: '1rem',
        maxWidth: '1000px',
      }}
    >
      <VerticalCard {...args} data={groupedCards} />
    </div>
  ),
};

export const FlexRowOfCards = {
  play: checkCardRows,
  render: args => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'stretch',
        gap: '1rem',
        maxWidth: '1000px',
      }}
    >
      {groupedCards.map(card => (
        <div
          key={card.link}
          style={{ display: 'flex', flex: '1 1 260px', minWidth: 0 }}
        >
          <VerticalCard {...args} data={[card]} />
        </div>
      ))}
    </div>
  ),
};

export const ScrollingCards = {
  play: checkCardRows,
  render: args => (
    <ScrollContainer stretchItems itemWidth="280px" showArrows>
      {groupedCards.map(card => (
        <VerticalCard {...args} key={card.link} data={[card]} />
      ))}
    </ScrollContainer>
  ),
};
