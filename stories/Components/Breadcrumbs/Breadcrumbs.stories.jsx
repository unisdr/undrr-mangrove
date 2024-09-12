import { Breadcrumbcomponent } from "./Breadcrumbs";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = {
        data: [
          {
            text: "Home",
          },
          {
            text: "Second-level",
          },
          {
            text: "Third-level",
          },
          {
            text: "Page title",
          },
        ],
      };
      return engText.data;
    case "arabic":
      const arabicText = {
        data: [
          {
            text: "الصفحة الرئيسية",
          },
          {
            text: "المستوى الثاني",
          },
          {
            text: "المستوى الثالث",
          },
          {
            text: "عنوان الصفحة",
          },
        ],
      };
      return arabicText.data;
    case "burmese":
      const burmeseText = {
        data: [
          {
            text: "အိမ်",
          },
          {
            text: "ဒုတိယအဆင့်",
          },
          {
            text: "တတိယအဆင့်",
          },
          {
            text: "စာမျက်နှာခေါင်းစဉ်",
          },
        ],
      };
      return burmeseText.data;
    case "japanese":
      const japaneseText = {
        data: [
          {
            text: "家",
          },
          {
            text: "セカンドレベル",
          },
          {
            text: "第3レベル",
          },
          {
            text: "ページタイトル",
          },
        ],
      };
      return japaneseText.data;
    default:
      const dummy = {
        data: [
          {
            text: "Home",
          },
          {
            text: "Second-level",
          },
          {
            text: "Third-level",
          },
          {
            text: "Page title",
          },
        ],
      };
      return dummy.data;
  }
};

export default {
  title: "Components/Navigation/Breadcrumbs",

  argTypes: {
    Color: {
      options: ["Black", "White"],

      control: {
        type: "inline-radio",
      },

      defaultValue: "Black",
    },
  },

  parameters: {
    backgrounds: {
      default: "white",

      values: [
        {
          name: "gray",
          value: "#D4D6D8",
        },
      ],
    },
  },
};

export const DefaultBreadcrumbs = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Breadcrumbcomponent data={caption} {...args}></Breadcrumbcomponent>;
  },

  name: "Breadcrumbs",

  parameters: {
    backgrounds: {
      default: "gray",
    },
  },
};
