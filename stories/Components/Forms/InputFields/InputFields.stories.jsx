import { Inputcomponent } from "./InputFields";

const getCaptionForLocale = (locale) => {
  switch (locale) {
    case "english":
      const engText = {
        detail1: "Form Label:",
        detail2: "*Error: this field is required",
        detail3: "Search",
        detail4: "Enter search term",
        detail5: "Number of projects",
        detail6: "Create password",
        detail7: "Password",
        detail8: "8 characters minimum",
        detail9: "Phone number",
        detail10: "Brief description",
        text: "Date label",
        text2: "Enter text",
        text3: "Placeholder",
      };
      return engText;
    case "arabic":
      const arabicText = {
        detail1: "تسمية النموذج:",
        detail2: "* خطأ: هذا الحقل مطلوب",
        detail3: "بحث",
        detail4: "أدخل مصطلح البحث",
        detail5: "عدد المشاريع",
        detail6: "أنشئ كلمة مرور",
        detail7: "كلمه السر",
        detail8: "8 أحرف كحد أدنى",
        detail9: "رقم الهاتف",
        detail10: "وصف مختصر",
        text: "تسمية التاريخ",
        text2: "أدخل النص",
        text3: "نائب",
      };
      return arabicText;
    case "burmese":
      const burmeseText = {
        detail1: "ပုံစံတံဆိပ်:",
        detail2: "*အမှား - ဤအကွက်လိုအပ်သည်",
        detail3: "ရှာဖွေပါ",
        detail4: "ရှာဖွေရေးစာလုံးရိုက်ထည့်ပါ",
        detail5: "စီမံကိန်းအရေအတွက်",
        detail6: "စကားဝှက်ဖန်တီးပါ",
        detail7: "စကားဝှက်",
        detail8: "အနည်းဆုံးစာလုံး ၈ လုံး",
        detail9: "ဖုန်းနံပါတ်",
        detail10: "အကျဉ်းချုပ်ဖော်ပြချက်",
        text: "ရက်စွဲတံဆိပ်",
        text2: "စာသားရိုက်ထည့်ပါ",
        text3: "နေရာယူသည်",
      };
      return burmeseText;
    case "japanese":
      const japaneseText = {
        detail1: "フォームラベル：",
        detail2: "*エラー：このフィールドは必須です",
        detail3: "検索",
        detail4: "検索語を入力してください",
        detail5: "プロジェクト数",
        detail6: "パスワードを作成する",
        detail7: "パスワード",
        detail8: "最小8文字",
        detail9: "電話番号",
        detail10: "簡単な説明",
        text: "日付ラベル",
        text2: "テキストを入力してください",
        text3: "プレースホルダー",
      };
      return japaneseText;
    default:
      return {
        detail1: "Form Label:",
        detail2: "*Error: this field is required",
        detail3: "Search",
        detail4: "Enter search term",
        detail5: "Number of projects",
        detail6: "Create password",
        detail7: "Password",
        detail8: "8 characters minimum",
        detail9: "Phone number",
        detail10: "Brief description",
        text: "Date label",
        text2: "Enter text",
        text3: "Placeholder",
      };
  }
};

export default {
  title: "Components/Forms/Input fields",

  argTypes: {
    State: {
      options: ["Default", "Focus", "Error", "Disabled"],

      control: {
        type: "inline-radio",
      },

      defaultValue: "Default",
    },
  },
};

export const Date = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <Inputcomponent
        labelText={caption.text}
        errorText={caption.detail2}
        element="input"
        type="date"
        id="date"
        placeholder="dd/mm/yyyy"
        {...args}
      ></Inputcomponent>
    );
  },

  name: "Date",
};

export const Number = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <Inputcomponent
        labelText={caption.detail5}
        errorText={caption.detail2}
        element="input"
        type="number"
        id="number"
        pattern="[0-9]*"
        placeholder={caption.text3}
        {...args}
      ></Inputcomponent>
    );
  },

  name: "Number",
};

export const Password = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <Inputcomponent
        labelText={caption.detail6}
        element="input"
        helpText={caption.detail8}
        errorText={caption.detail2}
        type="password"
        id="password"
        minlength="8"
        placeholder={caption.detail7}
        {...args}
      ></Inputcomponent>
    );
  },

  name: "Password",
};

export const Telephone = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <Inputcomponent
        labelText={caption.detail9}
        element="input"
        type="tel"
        id="tel"
        errorText={caption.detail2}
        placeholder="+234 000 000 0000"
        pattern="[0-9]{3}-[0-9]{2}-[0-9]{3}"
        {...args}
      ></Inputcomponent>
    );
  },

  name: "Telephone",
};

export const Text = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <Inputcomponent
        labelText={caption.detail1}
        errorText={caption.detail2}
        element="input"
        type="text"
        id="text"
        placeholder={caption.text3}
        {...args}
      ></Inputcomponent>
    );
  },

  name: "Text",
};
