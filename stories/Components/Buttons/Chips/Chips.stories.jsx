import { Chips } from "./Chips";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = { detail: "Label" };
      return engText;
    case "arabic":
      const arabicText = { detail: "ملصق" };
      return arabicText;
    case "burmese":
      const burmeseText = { detail: "တံဆိပ်" };
      return burmeseText;
    case "japanese":
      const japaneseText = { detail: "ラベル" };
      return japaneseText;
    default:
      return { detail: "Label" };
  }
};

export default {
  title: "Components/Buttons/Chips",

  argTypes: {
    Type: {
      options: ["Without X", "With X"],

      control: {
        type: "inline-radio",
      },

      defaultValue: "Without X",
    },
  },
};

export const DefaultChips = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Chips label={caption.detail} {...args}></Chips>;
  },

  name: "Chips",
};
