import { BookCard } from './BookCard';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        contentdata: [
          {
            contenttile: 'Content tag',
            title: 'Title in large size',
            link: 'javascript:void(0)',
            imgalt: 'A publication cover',
            imgback:
              'https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg',
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
            link: 'javascript:void(0)',
            imgalt: 'غلاف منشور',
            imgback:
              'https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg',
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
            imgalt: 'A publication cover',
            imgback:
              'https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg',
          },
        ],
      };
      return japaneseText;
    default:
      const dummy = {
        contentdata: [
          {
            contenttile: 'Book card',
            title:
              'Book title in normal header size with up to three lines of text',
            link: 'javascript:void(0)',
            imgalt: 'A publication cover',
            imgback:
              'https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg',
          },
        ],
      };
      return dummy;
  }
};

export default {
  title: 'Components/Cards/Book Card',
  component: BookCard,

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

export const DefaultBookCard = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <div
        style={{
          maxWidth: '200px',
        }}
      >
        <BookCard data={caption.contentdata} {...args}></BookCard>
      </div>
    );
  },

  name: 'Book Card',
};

// Cards should normally be links. A book cover without a destination still
// needs a readable title, just without the link affordances.

export const NoLinkBookCard = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    const unlinked = caption.contentdata.map(item => ({
      ...item,
      link: null,
    }));

    return (
      <div
        style={{
          maxWidth: '200px',
        }}
      >
        <BookCard data={unlinked} {...args}></BookCard>
      </div>
    );
  },

  name: 'Without a link',
};

export const MixedTitleLengths = {
  render: (args, { globals: { locale } }) => {
    const base = getCaptionForLocale(locale).contentdata[0];
    const titles =
      locale === 'arabic'
        ? [
            'إطار سنداي',
            'الحد من مخاطر الكوارث وبناء القدرة على الصمود',
            'دليل عملي لدعم المجتمعات المحلية في تخطيط نظم الإنذار المبكر الشاملة للجميع',
          ]
        : [
            'Sendai Framework',
            'Disaster risk reduction and resilience',
            'A practical guide to inclusive early warning systems and community preparedness',
          ];
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(min(100%, 180px), 200px))',
          gap: '1rem',
        }}
      >
        <BookCard
          {...args}
          data={titles.map((title, index) => ({
            ...base,
            title,
            link: `#publication-${index + 1}`,
          }))}
        />
      </div>
    );
  },
};
