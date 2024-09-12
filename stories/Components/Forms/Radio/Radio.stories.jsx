import { Radio } from "./Radio";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = { label: "Category" };
      return engText;
    case "arabic":
      const arabicText = { label: "فئة" };
      return arabicText;
    case "burmese":
      const burmeseText = { label: "အမျိုးအစား" };
      return burmeseText;
    case "japanese":
      const japaneseText = { label: "カテゴリー" };
      return japaneseText;
    default:
      return { label: "Category" };
  }
};

export default {
  title: "Components/Forms/Radio",
};

export const DefaultRadio = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Radio label={caption.label} id="undrr" name="undrr"></Radio>;
  },

  name: "Radio",
};
