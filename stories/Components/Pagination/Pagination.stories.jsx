import { Pagination } from "./Pagination";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = { text: "Page", text2: "of" };
      return engText;
    case "arabic":
      const arabicText = { text: "صفحة", text2: "من" };
      return arabicText;
    case "burmese":
      const burmeseText = { text: "စာမျက်နှာ", text2: "၏" };
      return burmeseText;
    case "japanese":
      const japaneseText = { text: "ページ", text2: "の" };
      return japaneseText;
    default:
      return { text: "Page", text2: "of" };
  }
};

export default {
  title: "Components/Navigation/Pagination",
};

export const DefaultPagination = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Pagination text={caption.text} text2={caption.text2}></Pagination>;
  },

  name: "Pagination",
};
