import {
  checkPublicationSurface,
  checkPublicationOverride,
  publicationSurfaceOverrides,
  publicationCoverFixture,
} from './cardGeometryChecks';
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
            image: {
              src: 'https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg',
              alt: 'A publication cover',
            },
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
            image: {
              src: 'https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg',
              alt: 'غلاف منشور',
            },
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
            image: {
              src: 'https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg',
              alt: 'A publication cover',
            },
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
            image: {
              src: 'https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg',
              alt: 'A publication cover',
            },
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
        <BookCard items={caption.contentdata} {...args}></BookCard>
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
        <BookCard items={unlinked} {...args}></BookCard>
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
          items={titles.map((title, index) => ({
            ...base,
            title,
            link: `#publication-${index + 1}`,
          }))}
        />
      </div>
    );
  },
};
export const NaturalCoverRatio = {
  name: 'Complete cover without outer frame',
  render: (args, { globals: { locale } }) => {
    const data = getCaptionForLocale(locale).contentdata.map(item => ({
      ...item,
      image: {
        src: publicationCoverFixture,
      },
    }));
    return <BookCard {...args} items={data} />;
  },
  play: checkPublicationSurface,
};
export const ThemedSurface = {
  name: 'Theme-owned publication surface',
  render: (args, { globals: { locale } }) => (
    <div style={publicationSurfaceOverrides}>
      <BookCard
        {...args}
        items={getCaptionForLocale(locale).contentdata.map(item => ({
          ...item,
          image: {
            src: publicationCoverFixture,
          },
        }))}
      />
    </div>
  ),
  play: checkPublicationOverride,
};

// Gutenberg's supported book shape omits mg-card__vc.
export const PlainHtmlBook = {
  name: 'Publication with CMS classes',
  render: () => (
    <article className="mg-card mg-card__book">
      <div className="mg-card__visual">
        <img className="mg-card__image" src={publicationCoverFixture} alt="" />
      </div>
      <div className="mg-card__content">
        <header className="mg-card__title">
          <a href="#cms-publication">Publication title</a>
        </header>
      </div>
    </article>
  ),
  play: checkPublicationSurface,
};
