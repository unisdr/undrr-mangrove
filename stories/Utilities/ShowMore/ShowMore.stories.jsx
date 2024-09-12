import { ShowMore } from "./ShowMore";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = {
        showMoreData: [
          {
            button_text: "Show more button text",
            collapsable_wrapper_class: "show-more-wrapper-class",
            collapsable_text:
              "As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities. As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities. As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities. ",
          },
        ],
      };
      return engText.showMoreData;
    case "arabic":
      const arabicText = {
        showMoreData: [
          {
            button_text: "Needs translation",
            collapsable_wrapper_class: "show-more-wrapper-class",
            collapsable_text:
              'شير النص الوهمي إلى أجزاء المحتوى المستخدمة لملء نموذج موقع الويب. يساعد هذا النص مصممي الويب على تصور أفضل لكيفية ظهور موقع الويب كمنتج نهائي. من المهم أن نفهم أن النص الوهمي ليس له معنى على الإطلاق. والغرض الوحيد منه هو ملء الفراغات بمحتوى "يشبه الكلمات" ، دون القيام بأي انتهاك لحقوق النشر.',
          },
        ],
      };
      return arabicText.showMoreData;
    case "burmese":
      const burmeseText = {
        showMoreData: [
          {
            button_text: "Needs translation",
            collapsable_wrapper_class: "show-more-wrapper-class",
            collapsable_text:
              "Dummy စာသားသည် ၀ က်ဘ်ဆိုက်၏လှောင်ပြောင်မှုကိုဖြည့်ရန်အသုံးပြုသောအကြောင်းအရာအနည်းငယ်ကိုရည်ညွှန်းသည်။ ဤစာသားသည် ၀ က်ဘ်ဒီဇိုင်နာများအနေဖြင့် ၀ က်ဘ်ဆိုက်သည်အချောထည်ထုတ်ကုန်တစ်ခုအဖြစ်မည်သို့ပုံဖော်ရန်စိတ်ကူးကောင်းမြင်နိုင်စေသည်။ dummy စာသားသည်မည်သည့်အဓိပ္ပါယ်မှမရှိကြောင်းနားလည်ရန်အရေးကြီးသည်။ ၎င်း၏တစ်ခုတည်းသောရည်ရွယ်ချက်မှာမူပိုင်ခွင့်ချိုးဖောက်မှုများကိုမပြုလုပ်ဘဲ“ စကားလုံးကဲ့သို့” အကြောင်းအရာဖြင့်ဖြည့်ရန်ဖြစ်သည်။",
          },
        ],
      };
      return burmeseText.showMoreData;
    case "japanese":
      const japaneseText = {
        showMoreData: [
          {
            button_text: "Needs translation",
            collapsable_wrapper_class: "show-more-wrapper-class",
            collapsable_text:
              "ダミーテキストとは、Webサイトのモックアップを埋めるために使用されるコンテンツの一部を指します。このテキストは、WebデザイナーがWebサイトが完成品としてどのように見えるかをよりよく想像するのに役立ちます。ダミーテキストには何の意味もないことを理解することが重要です。その唯一の目的は、著作権を侵害することなく、「単語のような」コンテンツで空白を埋めることです。",
          },
        ],
      };
      return japaneseText.showMoreData;
    default:
      const dummy = {
        showMoreData: [
          {
            button_text: "Show more button text",
            collapsable_wrapper_class: "show-more-wrapper-class",
            collapsable_text:
              "As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities. As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities. As the UN Office for Disaster Risk Reduction, UNDRR convenes partners and coordinates activities to create safer, more resilient communities. ",
          },
        ],
      };
      return dummy.showMoreData;
  }
};

export default {
  title: "Components/ShowMore",
};

export const DefaultShowMore = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <div
        style={{
          maxWidth: "250px",
        }}
      >
        <ShowMore data={caption}></ShowMore>
      </div>
    );
  },

  name: "ShowMore",
};
