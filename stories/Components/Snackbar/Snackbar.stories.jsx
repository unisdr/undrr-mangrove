// import { CtaButton } from "./../Buttons/CtaButton/CtaButton";
import { ShowOffSnackbar } from "./Snackbar.jsx";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = { detail: "Read more" };
      return engText;
    case "arabic":
      const arabicText = { detail: "اقرأ أكثر" };
      return arabicText;
    case "burmese":
      const burmeseText = { detail: "ပိုပြီးဖတ်ပါ" };
      return burmeseText;
    case "japanese":
      const japaneseText = { detail: "続きを読む" };
      return japaneseText;
    default:
      return { detail: "Read more" };
  }
};

export default {
  title: "Components/Snackbar",

  argTypes: {
    message: {
      control: {
        type: "text",
      },

      defaultValue: "Message ...",
    },

    severity: {
      options: ["error", "info", "success"],

      control: {
        type: "inline-radio",
      },

      defaultValue: "error",
    },

    openedMiliseconds: {
      control: {
        type: "text",
      },

      defaultValue: "5000",
    },
  },
};

export const Snackbar = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <ShowOffSnackbar {...args} />;
  },

  name: "Snackbar",
};
