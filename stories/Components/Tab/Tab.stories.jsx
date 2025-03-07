// stories\Components\Tab\Tab.stories.jsx
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
            is_default: "true",
          },
          {
            text: "Tab title 3 i am a bit longer and go on and on",
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
            is_default: "true",
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
            is_default: "true",
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
            is_default: "true",
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
            data: "<a href='#'>As the UN Office for Disaster Risk Reduction</a>, UNDRR convenes partners and coordinates activities to create safer, more resilient communities.",
          },
          {
            text: "Tab title 2",
            text_id: "tab-2",
            data: "The Sendai Framework is the <a href='#'>global roadmap</a> for reducing human and economic loss as a direct result of disasters.",
            is_default: "true",
          },
          {
            text: "Tab title 3 i am a bit longer and on and on",
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
    let caption = getCaptionForLocale(locale);
    caption = caption.map(tab => ({ ...tab, is_default: "false" }));
    return <Tab tabdata={caption} />;
  },
};

export const TabsWithDefault = {
  render: (args, { globals: { locale } }) => {
    let caption = getCaptionForLocale(locale);
    return <Tab tabdata={caption} />;
  },
};

export const StackedTabs = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Tab tabdata={caption} variant="stacked" />;
  },
};

/**
 * @deprecated This is a legacy example included only to ensure backwards compatibility with v1 tabs.
 * Do not use this implementation for new features. Use the standard Tab component instead.
 */
export const Version1Tabs = {
  render: () => {
    return (
      <>
        <div className="mg-tabs">
          <ul className="mg-tabs__list | mg-container-full-width" data-mg-js-tabs>
            <li className="mg-tabs__item" role="presentation">
              <a
                className="mg-tabs__link"
                href="#mg-tabs__section-indicators"
                id="mg-tabs__section-indicators"
              >Indicators</a>
            </li>
            <li className="mg-tabs__item" role="presentation">
              <a
                className="mg-tabs__link"
                href="#mg-tabs__section-snapshot"
                id="mg-tabs__section-snapshot"
              >Snapshot of SFM</a>
            </li>
          </ul>
          <div className="mg-tabs-content" data-mg-js-tabs-content>
            <section
              className="mg-tabs__section"
              id="mg-tabs__section-indicators"
            >
              <h2>Indicators</h2>
              <p>
                Global target A: Substantially reduce global disaster mortality by 2030,
                aiming to lower average per 100,000 global mortality between 2020-2030
                compared with 2005-2015.
              </p>
            </section>
            <section
              className="mg-tabs__section"
              id="mg-tabs__section-snapshot"
            >
              <h2>Snapshot of SFM</h2>
              <p>The Sendai Framework Monitor (SFM) provides a comprehensive overview of global progress in disaster risk reduction. It tracks implementation of the Sendai Framework through custom indicators, national reports, and regional assessments to help identify trends and areas needing attention.</p>
            </section>
          </div>
        </div>
        {/* We include a stub of the real React tabs so we hook the JS */}
        <Tab />
      </>
    );
  },
};
