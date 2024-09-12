import { TextCta } from "./TextCta";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = {
        header: "United Nations Office for Disaster Risk Reduction",
        description:
          "Together, we can achieve the global goal set by the UN Secretary-General that every person on the planet is covered by an early warning system within the next 5 years.",
        button: "READ MORE",
      };
      return engText;
    case "arabic":
      const arabicText = {
        header: "انضم إلينا في شراكة برنامج الأمم المتحدة الإنمائية",
        description:
          "الشراكة هي جوهر كل ما يقوم به برنامج الأمم المتحدة الإنمائي. نحن نقدم حضورًا عالميًا تقريبًا في جميع أنحاء العالم. نحن مصممون على حشد الوسائل اللازمة لتنفيذ خطة عام 2030 من خلال شراكة عالمية متجددة من أجل التنمية المستدامة ، مع التركيز على الأشد فقرا وضعفا.",
        button: "انضم إلينا",
      };
      return arabicText;
    case "burmese":
      const burmeseText = {
        header: "UNDRR Partnership တွင် ကျွန်ုပ်တို့နှင့် ပူးပေါင်းပါ။",
        description:
          "UNDRR ၏လုပ်ဆောင်မှုအားလုံး၏ အဓိကအချက်မှာ မိတ်ဖက်ဆက်ဆံရေးဖြစ်သည်။ ကျွန်ုပ်တို့သည် ကမ္ဘာတစ်ဝှမ်းရှိ စကြဝဠာနီးပါးတည်ရှိမှုကို ပေးဆောင်ပါသည်။ အဆင်းရဲဆုံးနှင့် ထိခိုက်လွယ်ဆုံးသူများကို အာရုံစိုက်ခြင်းဖြင့် စဉ်ဆက်မပြတ်ဖွံ့ဖြိုးတိုးတက်သော ကမ္ဘာလုံးဆိုင်ရာ ပူးပေါင်းဆောင်ရွက်မှုကို ပြန်လည်အသက်သွင်းထားသော ကမ္ဘာလုံးဆိုင်ရာ ပူးပေါင်းဆောင်ရွက်မှုမှတစ်ဆင့် 2030 အစီအစဉ်ကို အကောင်အထည်ဖော်ရန် နည်းလမ်းများကို စုစည်းရန် ကျွန်ုပ်တို့ ဆုံးဖြတ်ထားပါသည်။",
        button: "ငါတို့နဲ့လာပူးပေါင်းပါ",
      };
      return burmeseText;
    case "japanese":
      const japaneseText = {
        header: "UNDRRパートナーシップにご参加ください",
        description:
          "パートナーシップは、UNDRRが行うすべての中心です。私たちは世界中でほぼ普遍的な存在感を提供します。私たちは、最も貧しく最も脆弱な人々に焦点を当て、持続可能な開発のためのグローバルなパートナーシップを活性化することにより、2030アジェンダを実施するための手段を動員することを決意しています。",
        button: "参加しませんか",
      };
      return japaneseText;
    default:
      return {
        header: "United Nations Office for Disaster Risk Reduction",
        description:
          "Together, we can achieve the global goal set by the UN Secretary-General that every person on the planet is covered by an early warning system within the next 5 years.",
        button: "READ MORE",
      };
  }
};

export default {
  title: "Components/CTA",
  component: TextCta,
};

export const DefaultTextCta = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <TextCta
        headerText={caption.header}
        descriptionText={caption.description}
        label={caption.button}
      ></TextCta>
    );
  },

  name: "Text cta",
};
