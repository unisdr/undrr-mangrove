import { renderToStaticMarkup } from "react-dom/server";

import { Accordion } from "./Accordion";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = {
        header: "Section Header",
        country: "Algeria",
        description:
          "Dummy text refers to the bits of content that are used to fill a website mock-up. This text helps web designers better envision how the website will look as a finished product. It is important to understand that dummy text has no meaning whatsoever. Its sole purpose is to fill out blank spaces with “word-like” content, without making any copyright infringements.",
      };
      return engText;
    case "arabic":
      const arabicText = {
        header: "مقطع الرأس",
        country: "الجزائر",
        description:
          'يشير النص الوهمي إلى أجزاء المحتوى المستخدمة لملء نموذج موقع الويب. يساعد هذا النص مصممي الويب على تصور أفضل لكيفية ظهور موقع الويب كمنتج نهائي. من المهم أن نفهم أن النص الوهمي ليس له معنى على الإطلاق. والغرض الوحيد منه هو ملء الفراغات بمحتوى "يشبه الكلمات" ، دون القيام بأي انتهاك لحقوق النشر.',
      };
      return arabicText;
    case "burmese":
      const burmeseText = {
        header: "အပိုင်းခေါင်းစီး",
        country: "အယ်လ်ဂျီးရီးယား",
        description:
          "Dummy စာသားသည် ၀ က်ဘ်ဆိုက်၏လှောင်ပြောင်မှုကိုဖြည့်ရန်အသုံးပြုသောအကြောင်းအရာအနည်းငယ်ကိုရည်ညွှန်းသည်။ ဤစာသားသည် ၀ က်ဘ်ဒီဇိုင်နာများအနေဖြင့် ၀ က်ဘ်ဆိုက်သည်အချောထည်ထုတ်ကုန်တစ်ခုအဖြစ်မည်သို့ပုံဖော်ရန်စိတ်ကူးကောင်းမြင်နိုင်စေသည်။ dummy စာသားသည်မည်သည့်အဓိပ္ပါယ်မှမရှိကြောင်းနားလည်ရန်အရေးကြီးသည်။ ၎င်း၏တစ်ခုတည်းသောရည်ရွယ်ချက်မှာမူပိုင်ခွင့်ချိုးဖောက်မှုများကိုမပြုလုပ်ဘဲ“ စကားလုံးကဲ့သို့” အကြောင်းအရာဖြင့်ဖြည့်ရန်ဖြစ်သည်။",
      };
      return burmeseText;
    case "japanese":
      const japaneseText = {
        header: "セクションヘッダー",
        country: "アルジェリア",
        description:
          "ダミーテキストとは、Webサイトのモックアップを埋めるために使用されるコンテンツの一部を指します。このテキストは、WebデザイナーがWebサイトが完成品としてどのように見えるかをよりよく想像するのに役立ちます。ダミーテキストには何の意味もないことを理解することが重要です。その唯一の目的は、著作権を侵害することなく、「単語のような」コンテンツで空白を埋めることです。",
      };
      return japaneseText;
    default:
      return {
        header: "Section Header",
        country: "Algeria",
        description:
          "Dummy text refers to the bits of content that are used to fill a website mock-up. This text helps web designers better envision how the website will look as a finished product. It is important to understand that dummy text has no meaning whatsoever. Its sole purpose is to fill out blank spaces with “word-like” content, without making any copyright infringements.",
      };
  }
};

export default {
  title: "Components/Accordion",
  component: Accordion,
};

export const DefaultAccordion = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <Accordion
        headerText={caption.header}
        descriptionText={caption.description}
      ></Accordion>
    );
  },

  name: "Accordion",
};
