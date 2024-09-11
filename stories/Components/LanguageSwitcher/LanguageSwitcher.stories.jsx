import { Languageswitcher } from "./LanguageSwitcher";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = {
        languagedata: [
          {
            descriptionText: "Français",
            lang: "fr",
          },
          {
            descriptionText: "Español",
            lang: "es",
          },
        ],
        headerText: "English",
      };
      return engText;
    case "arabic":
      const arabicText = {
        languagedata: [
          {
            descriptionText: "فرنسي",
            lang: "fr",
          },
          {
            descriptionText: "الاسبانية",
            lang: "es",
          },
        ],
        headerText: "إنجليزي",
      };
      return arabicText;
    case "burmese":
      const burmeseText = {
        languagedata: [
          {
            descriptionText: "ပြင်သစ်",
            lang: "fr",
          },
          {
            descriptionText: "ငပိ",
            lang: "es",
          },
        ],
        headerText: "အင်္ဂလိပ်စာ",
      };
      return burmeseText;
    case "japanese":
      const japaneseText = {
        languagedata: [
          {
            descriptionText: "フランス語",
            lang: "fr",
          },
          {
            descriptionText: "スペイン語",
            lang: "es",
          },
        ],
        headerText: "英語",
      };
      return japaneseText;
    default:
      const dummy = {
        languagedata: [
          {
            descriptionText: "Français",
            lang: "fr",
          },
          {
            descriptionText: "Español",
            lang: "es",
          },
        ],
        headerText: "English",
      };
      return dummy;
  }
};

export default {
  title: "Components/Language switcher",

  argTypes: {
    variant: {
      options: ["blue", "white"],

      control: {
        type: "radio",
      },

      defaultValue: "blue",
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

export const LanguageSwitcher = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <Languageswitcher
        data={caption.languagedata}
        headerText={caption.headerText}
        {...args}
      ></Languageswitcher>
    );
  },

  name: "Language switcher",

  parameters: {
    backgrounds: {
      default: "gray",
    },

    docs: {
      inlineStories: false,
      iframeHeight: "100%",
    },
  },
};
