import { Textarea } from './Textarea';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'english':
      const engText = {
        detail1: 'Form Label:',
        detail2: '*Error: this field is required',
        detail3: 'Search',
        detail4: 'Enter search term',
        detail5: 'Number of projects',
        detail6: 'Create password',
        detail7: 'Password',
        detail8: '8 characters minimum',
        detail9: 'Phone number',
        detail10: 'Brief description',
        text: 'Date label',
        text2: 'Enter text',
        text3: 'Placeholder',
      };
      return engText;
    case 'arabic':
      const arabicText = {
        detail1: 'تسمية النموذج:',
        detail2: '* خطأ: هذا الحقل مطلوب',
        detail3: 'بحث',
        detail4: 'أدخل مصطلح البحث',
        detail5: 'عدد المشاريع',
        detail6: 'أنشئ كلمة مرور',
        detail7: 'كلمه السر',
        detail8: '8 أحرف كحد أدنى',
        detail9: 'رقم الهاتف',
        detail10: 'وصف مختصر',
        text: 'تسمية التاريخ',
        text2: 'أدخل النص',
        text3: 'نائب',
      };
      return arabicText;
    case 'burmese':
      const burmeseText = {
        detail1: 'ပုံစံတံဆိပ်:',
        detail2: '*အမှား - ဤအကွက်လိုအပ်သည်',
        detail3: 'ရှာဖွေပါ',
        detail4: 'ရှာဖွေရေးစာလုံးရိုက်ထည့်ပါ',
        detail5: 'စီမံကိန်းအရေအတွက်',
        detail6: 'စကားဝှက်ဖန်တီးပါ',
        detail7: 'စကားဝှက်',
        detail8: 'အနည်းဆုံးစာလုံး ၈ လုံး',
        detail9: 'ဖုန်းနံပါတ်',
        detail10: 'အကျဉ်းချုပ်ဖော်ပြချက်',
        text: 'ရက်စွဲတံဆိပ်',
        text2: 'စာသားရိုက်ထည့်ပါ',
        text3: 'နေရာယူသည်',
      };
      return burmeseText;
    case 'japanese':
      const japaneseText = {
        detail1: 'フォームラベル：',
        detail2: '*エラー：このフィールドは必須です',
        detail3: '検索',
        detail4: '検索語を入力してください',
        detail5: 'プロジェクト数',
        detail6: 'パスワードを作成する',
        detail7: 'パスワード',
        detail8: '最小8文字',
        detail9: '電話番号',
        detail10: '簡単な説明',
        text: '日付ラベル',
        text2: 'テキストを入力してください',
        text3: 'プレースホルダー',
      };
      return japaneseText;
    default:
      return {
        detail1: 'Form Label:',
        detail2: '*Error: this field is required',
        detail3: 'Search',
        detail4: 'Enter search term',
        detail5: 'Number of projects',
        detail6: 'Create password',
        detail7: 'Password',
        detail8: '8 characters minimum',
        detail9: 'Phone number',
        detail10: 'Brief description',
        text: 'Date label',
        text2: 'Enter text',
        text3: 'Placeholder',
      };
  }
};

export default {
  title: 'Components/Forms/Textarea',

  argTypes: {
    State: {
      options: ['Default', 'Focus', 'Error', 'Disabled'],

      control: {
        type: 'inline-radio',
      },

      defaultValue: 'Default',
    },
  },
};

export const DefaultTextarea = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);

    return (
      <Textarea
        labelText={caption.detail10}
        errorText={caption.detail2}
        id="textarea"
        type="textarea"
        cols="40"
        rows="10"
        required="required"
        placeholder={caption.text2}
        {...args}
      ></Textarea>
    );
  },

  name: 'Textarea',
};
