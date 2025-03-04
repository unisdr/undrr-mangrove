import { HorizontalBookCard } from "./HorizontalBookCard";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = {
        contentdata: [
          {
            contenttile: "CONTENT TAG",
            title: "Title in large size",
            summaryText: `Climate change is a <a href="#" class="mg-card__text-link">global health emergency</a>, with impacts felt most acutely
by vulnerable populations and communities.
This paper explores health risks from climate change in a global context, setting out key risks actions`,
            share: "Social Share Button",
            label1: "Label 1",
            label2: "Label 2",
            button: "Primary action",
            link: "javascript:void(0)",
            imgalt: "A person looks on",
            imgback:
              "https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg",
          },
        ],
      };
      return engText;
    case "arabic":
      const arabicText = {
        contentdata: [
          {
            contenttile: "علامة المحتوى",
            title: " عنوان المشاركة يظهر هنا ويتكون من سطرين",
            button: "اقرأ أكث",
            link: "javascript:void(0)",
            imgalt: "A person looks on",
            imgback:
              "https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg",
          },
        ],
      };
      return arabicText;
    case "burmese":
      const burmeseText = {
        contentdata: [
          {
            contenttile: "အကြောင်းအရာ TAG",
            title:
              "ပို့စ်ခေါင်းစဉ်ကဒီမှာပါ၊ အဲဒါကစာကြောင်းနှစ်ကြောင်းပါ၊ နာမည်က ပို့စ်ခေါင်းစဉ်ကဒီမှာပါ၊ အဲဒါကစာကြောင်းနှစ်ကြောင်းပါ",
            button: "ပိုပြီးဖတ်ပါ",
            link: "javascript:void(0)",
            imgalt: "A person looks on",
            imgback:
              "https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg",
          },
        ],
      };
      return burmeseText;
    case "japanese":
      const japaneseText = {
        contentdata: [
          {
            contenttile: "コンテンツタグ",
            title: "投稿のタイトルはここにあり、2行です",
            button: "続きを読む",
            link: "javascript:void(0)",
            imgalt: "A person looks on",
            imgback:
              "https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg",
          },
        ],
      };
      return japaneseText;
    default:
      const dummy = {
        contentdata: [
          {
            contenttile: "HORIZONTAL CARD",
            title: "Title in large size",
            summaryText: `Climate change is a <a href="#" class="mg-card__text-link">global health emergency</a>, with impacts felt most acutely
by vulnerable populations and communities.
This paper explores health risks from climate change in a global context, setting out key risks actions`,
            share: "Social Share Button",
            label1: "Label 1",
            label2: "Label 2",
            button: "Primary action",
            link: "javascript:void(0)",
            imgalt: "A person looks on",
            imgback:
              "https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg",
          },
        ],
      };
      return dummy;
  }
};

export default {
  title: "Components/Cards/Horizontal Book Card",

  argTypes: {
    variant: {
      options: ["primary", "secondary", "tertiary", "quaternary"],

      control: {
        type: "inline-radio",
      },

      defaultValue: "primary",
    },
  },
};

export const DefaultHorizontalBookCard = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <HorizontalBookCard
        data={caption.contentdata}
        {...args}
      ></HorizontalBookCard>
    );
  },

  name: "Horizontal Book Card",
};


export const HorizontalBookCardNoImageVerticalCard = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    const noImageData = caption.contentdata.map(item => ({
      ...item,
      imgback: null,
      imgalt: null,
    }));

    return (
      <HorizontalBookCard data={noImageData} {...args}></HorizontalBookCard>
    );
  },

  name: "Horizontal Book Card Without Image",
};
