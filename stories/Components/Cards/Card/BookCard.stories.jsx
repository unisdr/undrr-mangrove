import { BookCard } from "./BookCard";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = {
        contentdata: [
          {
            contenttile: "CONTENT TAG",
            title: "Title in large size",
            link: "javascript:void(0)",
            imgalt: "A publication cover",
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
            link: "javascript:void(0)",
            imgalt: "A publication cover",
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
            link: "javascript:void(0)",
            imgalt: "A publication cover",
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
            imgalt: "A publication cover",
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
            contenttile: "BOOK CARD",
            title:
              "Book title in normal header size with up to three lines of text",
            link: "javascript:void(0)",
            imgalt: "A publication cover",
            imgback:
              "https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg",
          },
        ],
      };
      return dummy;
  }
};

export default {
  title: "Components/Cards/Book Card",

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

export const DefaultBookCard = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <div
        style={{
          maxWidth: "200px",
        }}
      >
        <BookCard data={caption.contentdata} {...args}></BookCard>
      </div>
    );
  },

  name: "Book Card",
};
