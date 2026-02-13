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
    case 'burmese':
      const burmeseText = {
        contentdata: [
          {
            contenttile: 'အကြောင်းအရာ TAG',
            title:
              'ပို့စ်ခေါင်းစဉ်ကဒီမှာပါ၊ အဲဒါကစာကြောင်းနှစ်ကြောင်းပါ၊ နာမည်က ပို့စ်ခေါင်းစဉ်ကဒီမှာပါ၊ အဲဒါကစာကြောင်းနှစ်ကြောင်းပါ',
            button: 'ပိုပြီးဖတ်ပါ',
            link: 'javascript:void(0)',
            imgalt: 'A person looks on',
            imgback:
              'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
          },
        ],
      };
      return burmeseText;
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
