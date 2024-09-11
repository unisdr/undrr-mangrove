import { BlockquoteComponent } from "./BlockquoteComponent";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = {
        blockquote:
          "“As the United Nations Office for Disaster Risk Reduction, UNDRR brings governments, partners and communities together to reduce disaster risk and losses and to ensure a safer, sustainable future.”",
        cite: "—Firstname Lastname",
      };
      return engText;
    case "arabic":
      const arabicText = {
        blockquote:
          "“يعمل برنامج الأمم المتحدة الإنمائي في حوالي 170 دولة ومنطقة ، مما يساعد على تحقيق القضاء على الفقر ، والحد من عدم المساواة والإقصاء”",
        cite: "-الاسم الاول الاسم الاخير",
      };
      return arabicText;
    case "burmese":
      const burmeseText = {
        blockquote:
          "“UNDRR သည်နိုင်ငံနှင့်နယ်မြေ ၁၇၀ ခန့်တွင်အလုပ်လုပ်ပြီးဆင်းရဲမွဲတေမှုပပျောက်ရေး၊ မညီမျှမှုများနှင့်ဖယ်ထုတ်မှုလျော့ချရန်ကူညီသည်။”",
        cite: "—ပထမနာမည် မျိုးနွယ်အမည်",
      };
      return burmeseText;
    case "japanese":
      const japaneseText = {
        blockquote:
          "“UNDRRは約170の国と地域で活動しており、貧困の撲滅と不平等と排除の削減を支援しています”",
        cite: "—名前苗字",
      };
      return japaneseText;
    default:
      return {
        blockquote:
          "“As the United Nations Office for Disaster Risk Reduction, UNDRR brings governments, partners and communities together to reduce disaster risk and losses and to ensure a safer, sustainable future.”",
        cite: "—Firstname Lastname",
      };
  }
};

export default {
  title: "Components/Callout",
  component: BlockquoteComponent,

  argTypes: {
    Colors: {
      options: ["default", "yellow", "red", "green", "blue", "gray"],

      control: {
        type: "inline-radio",
      },

      defaultValue: "default",
    },
  },
};

export const DefaultCallout = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <BlockquoteComponent
        blockquoteText={caption.blockquote}
        citeText={caption.cite}
        {...args}
      ></BlockquoteComponent>
    );
  },

  name: "Callout",
};
