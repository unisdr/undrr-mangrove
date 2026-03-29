import { HorizontalBookCard } from './HorizontalBookCard';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        contentdata: [
          {
            contenttile: 'Content tag',
            title: 'Title in large size',
            summary: `Climate change is a <a href="#" class="mg-card__text-link">global health emergency</a>, with impacts felt most acutely
by vulnerable populations and communities.
This paper explores health risks from climate change in a global context, setting out key risks actions`,
            labels: ['Label 1', 'Label 2'],
            button: 'Primary action',
            link: 'javascript:void(0)',
            image: {
              src: 'https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg',
              alt: 'A person looks on',
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
            summary: `يُعد تغير المناخ <a href="#" class="mg-card__text-link">حالة طوارئ صحية عالمية</a>، حيث تشعر الفئات السكانية والمجتمعات الأكثر ضعفاً بتأثيراته بشكل أكبر. تستكشف هذه الورقة المخاطر الصحية الناجمة عن تغير المناخ في سياق عالمي.`,
            labels: ['التسمية 1', 'التسمية 2'],
            button: 'الإجراء الأساسي',
            link: 'javascript:void(0)',
            image: {
              src: 'https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg',
              alt: 'شخص ينظر',
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
              alt: 'A person looks on',
            },
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
            summary: `Climate change is a <a href="#" class="mg-card__text-link">global health emergency</a>, with impacts felt most acutely
by vulnerable populations and communities.
This paper explores health risks from climate change in a global context, setting out key risks actions`,
            labels: ['Label 1', 'Label 2'],
            button: 'Primary action',
            link: 'javascript:void(0)',
            image: {
              src: 'https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg',
              alt: 'A person looks on',
            },
          },
        ],
      };
      return dummy;
  }
};

export default {
  title: 'Components/Cards/Horizontal Book Card',
  component: HorizontalBookCard,

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

export const DefaultHorizontalBookCard = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <HorizontalBookCard
        items={caption.contentdata}
        {...args}
      ></HorizontalBookCard>
    );
  },

  name: 'Horizontal Book Card',
};

export const HorizontalBookCardNoImageVerticalCard = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    const noImageData = caption.contentdata.map(item => {
      const { image: _image, ...rest } = item;
      return rest;
    });

    return (
      <HorizontalBookCard items={noImageData} {...args}></HorizontalBookCard>
    );
  },

  name: 'Horizontal Book Card Without Image',
};
