import { StatsCards } from "./StatsCards";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = {
        titlename: "Lorem ipsum",
        percentname: "Percent",
        numbername: "35",
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      };
      return engText;
    case "arabic":
      const arabicText = {
        titlename: "عنوان مستقل",
        percentname: "نسبه مئويه",
        numbername: "35",
        text: "الألم بحد ذاته هو الحب ، الزبون الرئيسي",
      };
      return arabicText;
    case "burmese":
      const burmeseText = {
        titlename: "လွတ်လပ်သောခေါင်းစဉ်",
        percentname: "ရာခိုင်နှုန်း",
        numbername: "35",
        text: "နာကျင်မှုကိုယ်တိုင်ကအချစ်ကိုအဓိကဖောက်သည်ချသည်",
      };
      return burmeseText;
    case "japanese":
      const japaneseText = {
        titlename: "独立したタイトル",
        percentname: "パーセント",
        numbername: "35",
        text: "痛み自体は愛、主な顧客です",
      };
      return japaneseText;
    default:
      return {
        titlename: "Lorem Title",
        percentname:
          "Percents, with very long subheader, spanning several lines",
        numbername: "35",
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      };
  }
};

export default {
  title: "Components/Cards/Stats card",
  component: StatsCards,

  argTypes: {
    Size: {
      options: ["Small", "Medium", "Large", "Extra large"],

      control: {
        type: "inline-radio",
      },

      defaultValue: "Medium",
    },

    Accent: {
      options: ["yellow", "red", "green", "blue"],

      control: {
        type: "inline-radio",
      },

      defaultValue: "yellow",
    },
  },
};

export const StatsCard = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <StatsCards
        title={caption.titlename}
        percent={caption.percentname}
        content={caption.text}
        number={caption.numbername}
        {...args}
      ></StatsCards>
    );
  },

  name: "Stats card",
};
