import { Tab } from "./Tab";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = {
        tabdata: [
          {
            text: "Tab title 1",
            text_id: "tab-1",
            data: "As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities.",
          },
          {
            text: "Tab title 2",
            text_id: "tab-2",
            data: "The Sendai Framework is the global roadmap for reducing human and economic loss as a direct result of disasters.",
          },
          {
            text: "Tab title 3",
            text_id: "tab-3",
            data: "Midterm Review of the Sendai Framework - Register your interest for consultations on the Political Declaration.",
          },
        ],
      };
      return engText.tabdata;
    case "arabic":
      const arabicText = {
        tabdata: [
          {
            text: "علامة التبويب 1",
            text_id: "tab-1",
            data: 'شير النص الوهمي إلى أجزاء المحتوى المستخدمة لملء نموذج موقع الويب. يساعد هذا النص مصممي الويب على تصور أفضل لكيفية ظهور موقع الويب كمنتج نهائي. من المهم أن نفهم أن النص الوهمي ليس له معنى على الإطلاق. والغرض الوحيد منه هو ملء الفراغات بمحتوى "يشبه الكلمات" ، دون القيام بأي انتهاك لحقوق النشر.',
          },
          {
            text: "علامة التبويب 2",
            text_id: "tab-2",
            data: 'شير النص الوهمي إلى أجزاءيفية ظهور موقع الويب كمنتج نهائي. من المهم أن نفهم أن النص الوهمي ليس له معنى على الإطلاق. والغرض الوحيد منه هو ملء الفراغات بمحتوى "يشبه الكلمات" ، دون القيام بأي انتهاك لحقوق النشر.',
          },
          {
            text: "علامة التبويب 3",
            text_id: "tab-3",
            data: "شير النص الوهمي إلى أجزاءيفية ظهور موقع الويب كمنتج نهائي. من المهم أن نفهم أن النص الوهمي ليس له معنى على ، دون القيام بأي انتهاك لحقوق النشر.",
          },
        ],
      };
      return arabicText.tabdata;
    case "burmese":
      const burmeseText = {
        tabdata: [
          {
            text: "tab ၁",
            text_id: "tab-1",
            data: "Dummy စာသားသည် ၀ က်ဘ်ဆိုက်၏လှောင်ပြောင်မှုကိုဖြည့်ရန်အသုံးပြုသောအကြောင်းအရာအနည်းငယ်ကိုရည်ညွှန်းသည်။ ဤစာသားသည် ၀ က်ဘ်ဒီဇိုင်နာများအနေဖြင့် ၀ က်ဘ်ဆိုက်သည်အချောထည်ထုတ်ကုန်တစ်ခုအဖြစ်မည်သို့ပုံဖော်ရန်စိတ်ကူးကောင်းမြင်နိုင်စေသည်။ dummy စာသားသည်မည်သည့်အဓိပ္ပါယ်မှမရှိကြောင်းနားလည်ရန်အရေးကြီးသည်။ ၎င်း၏တစ်ခုတည်းသောရည်ရွယ်ချက်မှာမူပိုင်ခွင့်ချိုးဖောက်မှုများကိုမပြုလုပ်ဘဲ“ စကားလုံးကဲ့သို့” အကြောင်းအရာဖြင့်ဖြည့်ရန်ဖြစ်သည်။",
          },
          {
            text: "tab ၂",
            text_id: "tab-2",
            data: "က်ဘ်ဒီဇိုင်နာများအနေဖြင့် ၀ က်ဘ်ဆိုက်သည်အချောထည်ထုတ်ကုန်တစ်ခုအဖြစ်မည်သို့ပုံဖော်ရန်စိတ်ကူးကောင်းမြင်နိုင်စေသည်။ dummy စာသားသည်မည်သည့်အဓိပ္ပါယ်မှမရှိကြောင်းနားလည်ရန်အရေးကြီးသည်။ ၎င်း၏တစ်ခုတည်းသောရည်ရွယ်ချက်မှာမူပိုင်ခွင့်ချိုးဖောက်မှုများကိုမပြုလုပ်ဘဲ“ စကားလုံးကဲ့သို့” အကြောင်းအရာဖြင့်ဖြည့်ရန်ဖြစ်သည်။",
          },
          {
            text: "tab ၃",
            text_id: "tab-3",
            data: "dummy စာသားသည်မည်သည့်အဓိပ္ပါယ်မှမရှိကြောင်းနားလည်ရန်အရေးကြီးသည်။ ၎င်း၏တစ်ခုတည်းသောရည်ရွယ်ချက်မှာမူပိုင်ခွင့်ချိုးဖောက်မှုများကိုမပြုလုပ်ဘဲ“ စကားလုံးကဲ့သို့” အကြောင်းအရာဖြင့်ဖြည့်ရန်ဖြစ်သည်။",
          },
        ],
      };
      return burmeseText.tabdata;
    case "japanese":
      const japaneseText = {
        tabdata: [
          {
            text: "タブ1",
            text_id: "tab-1",
            data: "ダミーテキストとは、Webサイトのモックアップを埋めるために使用されるコンテンツの一部を指します。このテキストは、WebデザイナーがWebサイトが完成品としてどのように見えるかをよりよく想像するのに役立ちます。ダミーテキストには何の意味もないことを理解することが重要です。その唯一の目的は、著作権を侵害することなく、「単語のような」コンテンツで空白を埋めることです。",
          },
          {
            text: "タブ2",
            text_id: "tab-2",
            data: "このテキストは、WebデザイナーがWebサイトが完成品としてどのように見えるかをよりよく想像するのに役立ちます。ダミーテキストには何の意味もないことを理解することが重要です。その唯一の目的は、著作権を侵害することなく、「単語のような」コンテンツで空白を埋めることです。",
          },
          {
            text: "タブ3",
            text_id: "tab-3",
            data: "ダミーテキストとは、Webサイトのモックアップを埋めるために使用されるコンテンツの一部を指します。このテキストは、WebデザイナーがWebサイトが完成品としてどのように見えるかをよりよく想像するのに役立ちます。ダミーテキストには何の意味もないことを理解することが重要です。",
          },
        ],
      };
      return japaneseText.tabdata;
    default:
      const dummy = {
        tabdata: [
          {
            text: "Tab title 1",
            text_id: "tab-1",
            data: "As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities.",
          },
          {
            text: "Tab title 2",
            text_id: "tab-2",
            data: "The Sendai Framework is the global roadmap for reducing human and economic loss as a direct result of disasters.",
          },
          {
            text: "Tab title 3",
            text_id: "tab-3",
            data: "Midterm Review of the Sendai Framework - Register your interest for consultations on the Political Declaration.",
          },
        ],
      };
      return dummy.tabdata;
  }
};

export default {
  title: "Components/Tabs",
};

export const Tabs = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Tab tabdata={caption}></Tab>;
  },

  name: "Tabs",
};
