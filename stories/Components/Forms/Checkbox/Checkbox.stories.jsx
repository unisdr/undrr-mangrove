import { Checkbox } from "./Checkbox";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = { label: "Category", value: "category" };
      return engText;
    case "arabic":
      const arabicText = { label: "فئة", value: "فئة" };
      return arabicText;
    case "burmese":
      const burmeseText = { label: "အမျိုးအစား", value: "အမျိုးအစား" };
      return burmeseText;
    case "japanese":
      const japaneseText = { label: "カテゴリー", value: "カテゴリー" };
      return japaneseText;
    default:
      return { label: "Category" };
  }
};

export default {
  title: "Components/Forms/Checkbox",
};

export const DefaultCheckbox = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <Checkbox
        label={caption.label}
        value={caption.value}
        id="edit-checkbox"
      ></Checkbox>
    );
  },

  name: "Checkbox",
};
