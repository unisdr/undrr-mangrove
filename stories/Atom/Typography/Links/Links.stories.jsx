import { Link } from "./Links";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = { detail: "Default link" };
      return engText;
    case "arabic":
      const arabicText = { detail: "الارتباط الافتراضي" };
      return arabicText;
    case "burmese":
      const burmeseText = { detail: "မူရင်းလင့်ခ်" };
      return burmeseText;
    case "japanese":
      const japaneseText = { detail: "デフォルトのリンク" };
      return japaneseText;
    default:
      return { detail: "Default link" };
  }
};

export default {
  title: "Components/Typography/Links",
};

export const DefaultLinks = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <>
        <Link label={caption.detail} {...args}></Link>
      </>
    );
  },

  name: "Links",
};
