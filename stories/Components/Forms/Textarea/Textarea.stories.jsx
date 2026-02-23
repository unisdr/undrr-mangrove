import { Textarea } from './Textarea';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return {
        label: 'وصف مختصر',
        placeholder: 'أدخل النص',
        helpText: '500 حرف كحد أقصى',
        errorText: 'هذا الحقل مطلوب',
      };
    case 'burmese':
      return {
        label: 'အကျဉ်းချုပ်ဖော်ပြချက်',
        placeholder: 'စာသားရိုက်ထည့်ပါ',
        helpText: 'အများဆုံးစာလုံး ၅၀၀',
        errorText: 'ဤအကွက်လိုအပ်သည်',
      };
    case 'japanese':
      return {
        label: '簡単な説明',
        placeholder: 'テキストを入力してください',
        helpText: '最大500文字',
        errorText: 'このフィールドは必須です',
      };
    default:
      return {
        label: 'Brief description',
        placeholder: 'Enter text',
        helpText: 'Maximum 500 characters',
        errorText: 'This field is required',
      };
  }
};

export default {
  title: 'Components/Forms/Textarea',
  component: Textarea,
};

export const Default = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <Textarea
        label={caption.label}
        placeholder={caption.placeholder}
        rows={4}
        {...args}
      />
    );
  },
};

export const WithHelpText = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <Textarea
        label={caption.label}
        placeholder={caption.placeholder}
        helpText={caption.helpText}
        {...args}
      />
    );
  },
};

export const ErrorState = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <Textarea
        label={caption.label}
        placeholder={caption.placeholder}
        error
        errorText={caption.errorText}
        {...args}
      />
    );
  },
};

export const Disabled = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <Textarea
        label={caption.label}
        placeholder={caption.placeholder}
        disabled
        {...args}
      />
    );
  },
};

export const Required = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <Textarea
        label={caption.label}
        placeholder={caption.placeholder}
        required
        {...args}
      />
    );
  },
};
