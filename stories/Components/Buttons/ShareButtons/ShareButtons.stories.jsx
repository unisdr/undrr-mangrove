//import { Meta, ArgTypes, Controls, Story, Canvas } from '@storybook/blocks';
import ShareButtons from "./ShareButtons";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = {
        mainLabel: "Share this",
        onCopy: "Copied",
      };
      return engText;
    case "arabic":
      const arabicText = {
        mainLabel: "شارك هذا",
        onCopy: "تم النسخ",
      };
      return arabicText;
    case "burmese":
      const burmeseText = {
        mainLabel: "မြန်မာ",
        onCopy: "ကူးယူသည်။",
      };
      return burmeseText;
    case "japanese":
      const japaneseText = {
        mainLabel: "ビルマ語",
        onCopy: "コピーされました",
      };
      return japaneseText;
    default:
      return {
        mainLabel: "Share this",
        onCopy: "Copied",
      };
  }
};

export default {
  title: "Components/Buttons/ShareButtons",

  argTypes: {
    SharingSubject: {
      control: {
        type: "text",
      },

      defaultValue: "Sharing Link",
    },

    SharingTextBody: {
      control: {
        type: "text",
      },

      defaultValue: "Check out this link: ",
    },
  },
};

export const DefaultShareButtons = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <ShareButtons labels={caption} />;
  },

  name: "ShareButtons",
};
