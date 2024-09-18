import { Sidebar } from "./Sidebar";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = {
        sidebardata: [
          {
            descriptionText: "Subpage title",
          },
          {
            descriptionText:
              "Subpage with an exceptionally long title on two lines",
          },
          {
            descriptionText: "Subpage title",
          },
        ],
        headerText: "PAGE TITLE",
        label: "MENU",
      };
      return engText;
    case "arabic":
      const arabicText = {
        sidebardata: [
          {
            descriptionText: "عنوان الصفحة الفرعية",
          },
          {
            descriptionText: "صفحة فرعية بعنوان طويل بشكل استثنائي في سطرين",
          },
          {
            descriptionText: "عنوان الصفحة الفرعية",
          },
        ],
        headerText: "عنوان الصفحة",
        label: "قائمة",
      };
      return arabicText;
    case "burmese":
      const burmeseText = {
        sidebardata: [
          {
            descriptionText: "စာမျက်နှာခွဲခေါင်းစဉ်",
          },
          {
            descriptionText:
              "စာကြောင်းနှစ်ကြောင်းတွင်ထူးခြားသောခေါင်းစဉ်ရှည်ပါ ၀ င်သောစာမျက်နှာခွဲ",
          },
          {
            descriptionText: "စာမျက်နှာခွဲခေါင်းစဉ်",
          },
        ],
        headerText: "စာမျက်နှာခေါင်းစဉ်",
        label: "မီနူး",
      };
      return burmeseText;
    case "japanese":
      const japaneseText = {
        sidebardata: [
          {
            descriptionText: "サブページのタイトル",
          },
          {
            descriptionText: "2行に非常に長いタイトルのサブページ",
          },
          {
            descriptionText: "サブページのタイトル",
          },
        ],
        headerText: "ページタイトル",
        label: "メニュー",
      };
      return japaneseText;
    default:
      const dummy = {
        sidebardata: [
          {
            descriptionText: "Subpage title",
          },
          {
            descriptionText:
              "Subpage with an exceptionally long title on two lines",
          },
          {
            descriptionText: "Subpage title",
          },
        ],
        headerText: "PAGE TITLE",
        label: "Menu",
      };
      return dummy;
  }
};

export default {
  title: "Components/Navigation/Sidebar",

  argTypes: {
    Height: {
      options: ["Default", "Narrow"],

      control: {
        type: "inline-radio",
      },

      defaultValue: "Default",
    },
  },
};

export const DefaultSidebar = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <Sidebar
        data={caption.sidebardata}
        headerText={caption.headerText}
        label={caption.label}
        size="medium-4"
        active={"default"}
        {...args}
      ></Sidebar>
    );
  },

  name: "Sidebar",
};
