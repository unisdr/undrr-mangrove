import { VerticalCard } from './VerticalCard';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        contentdata: [
          {
            contenttile: 'CONTENT TAG',
            title: 'Title in large size',
            summaryText: `Climate change is a <a href="#" class="mg-card__text-link">global health emergency</a>, with impacts felt most acutely
by vulnerable populations and communities.This paper explores health risks from climate change in a global context, setting out key risks actions`,
            share: 'Social Share Button',
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
            title: ' عنوان المشاركة يظهر هنا ويتكون من سطرين',
            button: 'اقرأ أكث',
            link: 'javascript:void(0)',
            imgalt: 'A person looks on',
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
            contenttile: 'VERTICAL CARD',
            title: 'Title in large size with up to two lines of text',
            summaryText: `Climate change is a <a href="#" class="mg-card__text-link">global health emergency</a>, with impacts felt most acutely
by vulnerable populations and communities.
This paper explores health risks from climate change in a global context, setting out key risks actions`,
            share: 'Social Share Button',
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

export const NoImageVerticalCard = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    const noImageData = caption.contentdata.map(item => ({
      ...item,
      imgback: null,
      imgalt: null,
      share: null,
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
