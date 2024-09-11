import MultiSelect from "./MultiSelect";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = "Category";
      return engText;
    case "arabic":
      const arabicText = "فئة";
      return arabicText;
    case "burmese":
      const burmeseText = "အမျိုးအစား";
      return burmeseText;
    case "japanese":
      const japaneseText = "カテゴリー";
      return japaneseText;
    default:
      return "Category";
  }
};

export default {
  title: "Components/Forms/Dropdown/MultiSelect",
  component: MultiSelect,

  argTypes: {
    Height: {
      options: ["Fix height", "Auto height"],

      control: {
        type: "radio",
      },

      defaultValue: "Auto height",
    },

    variant: {
      options: ["Radio", "Checkbox"],

      control: {
        type: "radio",
      },

      defaultValue: "Checkbox",
    },
  },
};

export const DefaultMultiSelect = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <MultiSelect
        locale={locale}
        {...args}
        text={caption}
        eleId=""
      ></MultiSelect>
    );
  },

  name: "MultiSelect",
};
