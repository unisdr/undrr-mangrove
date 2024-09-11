import { Statscardslider } from "./StatsCardSlider";

const statsArray = (locale) => {
  switch (locale) {
    case "english":
      const engText = {
        data: [
          {
            percentname: "Million",
            numbername: "821",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          },
          {
            percentname: "Countries",
            numbername: "63",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          },
          {
            percentname: "Percent",
            numbername: "22",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          },
          {
            percentname: "Programs",
            numbername: "13",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          },
          {
            percentname: "In three",
            numbername: "ONE",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          },
          {
            percentname: "Offices",
            numbername: "9",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          },
        ],
      };
      return engText.data;
    case "arabic":
      const arabicText = {
        data: [
          {
            percentname: "نسبه",
            numbername: "821",
            text: "الألم بحد ذاته هو الحب ، الزبون الرئيسي",
          },
          {
            percentname: "بلدان",
            numbername: "63",
            text: "الألم بحد ذاته هو الحب ، الزبون الرئيسي",
          },
          {
            percentname: "نسبه مئويه",
            numbername: "22",
            text: "الألم بحد ذاته هو الحب ، الزبون الرئيسي",
          },
          {
            percentname: "البرامج",
            numbername: "13",
            text: "الألم بحد ذاته هو الحب ، الزبون الرئيسي",
          },
          {
            percentname: "سنوات",
            numbername: "ONE",
            text: "الألم بحد ذاته هو الحب ، الزبون الرئيسي",
          },
          {
            percentname: "مكاتب",
            numbername: "9",
            text: "الألم بحد ذاته هو الحب ، الزبون الرئيسي",
          },
        ],
      };
      return arabicText.data;
    case "burmese":
      const burmeseText = {
        data: [
          {
            percentname: "ရာခိုင်နှုန်း",
            numbername: "821",
            text: "နာကျင်မှုကိုယ်တိုင်ကအချစ်ကိုအဓိကဖောက်သည်ချသည်",
          },
          {
            percentname: "နိုင်ငံတွေ",
            numbername: "63",
            text: "နာကျင်မှုကိုယ်တိုင်ကအချစ်ကိုအဓိကဖောက်သည်ချသည်",
          },
          {
            percentname: "ရာခိုင်နှုန်း",
            numbername: "22",
            text: "နာကျင်မှုကိုယ်တိုင်ကအချစ်ကိုအဓိကဖောက်သည်ချသည်",
          },
          {
            percentname: "အစီအစဉ်မျာ",
            numbername: "13",
            text: "နာကျင်မှုကိုယ်တိုင်ကအချစ်ကိုအဓိကဖောက်သည်ချသည်",
          },
          {
            percentname: "နှစ်တွေ",
            numbername: "တစ်ခု",
            text: "နာကျင်မှုကိုယ်တိုင်ကအချစ်ကိုအဓိကဖောက်သည်ချသည်",
          },
          {
            percentname: "ရုံးများ",
            numbername: "9",
            text: "နာကျင်မှုကိုယ်တိုင်ကအချစ်ကိုအဓိကဖောက်သည်ချသည်",
          },
        ],
      };
      return burmeseText.data;
    case "japanese":
      const japaneseText = {
        data: [
          {
            percentname: "パーセント",
            numbername: "821",
            text: "痛み自体は愛、主な顧客です",
          },
          {
            percentname: "国",
            numbername: "63",
            text: "痛み自体は愛、主な顧客です",
          },
          {
            percentname: "パーセント",
            numbername: "22",
            text: "痛み自体は愛、主な顧客です",
          },
          {
            percentname: "プログラム",
            numbername: "13",
            text: "痛み自体は愛、主な顧客です",
          },
          {
            percentname: "年",
            numbername: "1",
            text: "痛み自体は愛、主な顧客です",
          },
          {
            percentname: "オフィス",
            numbername: "9",
            text: "痛み自体は愛、主な顧客です",
          },
        ],
      };
      return japaneseText.data;
    default:
      const dummy = {
        data: [
          {
            percentname: "Million",
            numbername: "821",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          },
          {
            percentname: "Percent",
            numbername: "63",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          },
          {
            percentname: "Percent",
            numbername: "22",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          },
          {
            percentname: "Percent",
            numbername: "13",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          },
          {
            percentname: "In three",
            numbername: "One",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          },
          {
            percentname: "Offices",
            numbername: "9",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          },
        ],
      };
      return dummy.data;
  }
};

export default {
  title: "Components/Stats card slider",
};

export const StatsCardSlider = {
  render: (args, { globals: { locale } }) => {
    const caption = statsArray(locale);
    return <Statscardslider data={caption}></Statscardslider>;
  },

  name: "Stats card slider",
};
