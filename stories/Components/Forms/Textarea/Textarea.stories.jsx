import { Textarea } from './Textarea';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return { label: 'وصف مختصر', placeholder: 'أدخل النص' };
    case 'burmese':
      return {
        label: 'အကျဉ်းချုပ်ဖော်ပြချက်',
        placeholder: 'စာသားရိုက်ထည့်ပါ',
      };
    case 'japanese':
      return { label: '簡単な説明', placeholder: 'テキストを入力してください' };
    default:
      return { label: 'Brief description', placeholder: 'Enter text' };
  }
};

export default {
  title: 'Components/Forms/Textarea',
  component: Textarea,
};

export const Default = {
  args: {
    label: 'Description',
    placeholder: 'Enter a brief description',
    rows: 4,
  },
};

export const WithHelpText = {
  args: {
    label: 'Comments',
    placeholder: 'Share your thoughts',
    helpText: 'Maximum 500 characters',
  },
};

export const ErrorState = {
  args: {
    label: 'Description',
    placeholder: 'Enter a brief description',
    error: true,
    errorText: 'This field is required',
  },
};

export const Disabled = {
  args: {
    label: 'Description',
    placeholder: 'Enter a brief description',
    disabled: true,
  },
};

export const Required = {
  args: {
    label: 'Description',
    placeholder: 'Enter a brief description',
    required: true,
  },
};

export const Localized = {
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
