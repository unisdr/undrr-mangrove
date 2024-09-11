import CustomSelect from "./CustomSelect";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = "Select Language";
      return engText;
    case "arabic":
      const arabicText = "اختار اللغة";
      return arabicText;
    case "burmese":
      const burmeseText = "ဘာသာစကားကို ရွေးပါ။";
      return burmeseText;
    case "japanese":
      const japaneseText = "言語を選択する";
      return japaneseText;
    default:
      return "Category";
  }
};

export default {
  title: "Components/Forms/Dropdown/Select",
  component: CustomSelect,
};

export const Select = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <CustomSelect text={caption}></CustomSelect>;
  },

  name: "Select",
};
