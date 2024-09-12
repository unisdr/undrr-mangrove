import { Hero } from "./Hero";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = {
        contentdata: [
          {
            title: "Text in xxl large size",
            summaryText:
              "Some introductry and summary text t hat can often occupy multiple lines.",
            detail: "Detail label: Detail",
            label: "Label in medium size",
            primary_button: "Primary action",
            secondary_button: "Secondary action",
            tertiary_button: "Tertiary action",
            link: "javascript:void(0)",
            imgalt: "A person looks on",
            imgback:
              "https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg",
          },
        ],
      };
      return engText;
    case "arabic":
      const arabicText = {
        contentdata: [
          {
            title: "علامة المحتوى",
            summaryText: " عنوان المشاركة يظهر هنا ويتكون من سطرين",
            detail: "اقرأ أكث",
            label: "Label in medium size",
            primary_button: "Primary action",
            secondary_button: "Secondary action",
            tertiary_button: "Tertiary action",
            link: "javascript:void(0)",
            imgalt: "A person looks on",
            imgback:
              "https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg",
          },
        ],
      };
      return arabicText;
    case "burmese":
      const burmeseText = {
        contentdata: [
          {
            title: "အကြောင်းအရာ TAG",
            summaryText:
              "ပို့စ်ခေါင်းစဉ်ကဒီမှာပါ၊ အဲဒါကစာကြောင်းနှစ်ကြောင်းပါ၊ နာမည်က ပို့စ်ခေါင်းစဉ်ကဒီမှာပါ၊ အဲဒါကစာကြောင်းနှစ်ကြောင်းပါ",
            detail: "ပိုပြီးဖတ်ပါ",
            label: "Label in medium size",
            primary_button: "Primary action",
            secondary_button: "Secondary action",
            tertiary_button: "Tertiary action",
            link: "javascript:void(0)",
            imgalt: "A person looks on",
            imgback:
              "https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg",
          },
        ],
      };
      return burmeseText;
    case "japanese":
      const japaneseText = {
        contentdata: [
          {
            title: "コンテンツタグ",
            summaryText: "投稿のタイトルはここにあり、2行です",
            detail: "続きを読む",
            label: "Label in medium size",
            primary_button: "Primary action",
            secondary_button: "Secondary action",
            tertiary_button: "Tertiary action",
            link: "javascript:void(0)",
            imgalt: "A person looks on",
            imgback:
              "https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg",
          },
        ],
      };
      return japaneseText;
    default:
      const dummy = {
        contentdata: [
          {
            title: "Text in xxl large size",
            summaryText:
              "Some introductry and summary text t hat can often occupy multiple lines.",
            detail: "Detail label: Detail",
            label: "Label in medium size",
            primary_button: "Primary action",
            secondary_button: "Secondary action",
            tertiary_button: "Tertiary action",
            link: "javascript:void(0)",
            imgalt: "A person looks on",
            imgback:
              "https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg",
          },
        ],
      };
      return dummy;
  }
};

export default {
  title: "Components/Hero/Hero",

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

export const DefaultHero = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Hero data={caption.contentdata} {...args}></Hero>;
  },

  name: "Hero",
};
