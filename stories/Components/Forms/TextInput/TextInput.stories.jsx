import { TextInput } from './TextInput';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return {
        label: 'تسمية النموذج',
        placeholder: 'نائب',
        helpText: '8 أحرف كحد أدنى',
        errorText: '* خطأ: هذا الحقل مطلوب',
      };
    case 'burmese':
      return {
        label: 'ပုံစံတံဆိပ်',
        placeholder: 'နေရာယူသည်',
        helpText: 'အနည်းဆုံးစာလုံး ၈ လုံး',
        errorText: '*အမှား - ဤအကွက်လိုအပ်သည်',
      };
    case 'japanese':
      return {
        label: 'フォームラベル',
        placeholder: 'プレースホルダー',
        helpText: '最小8文字',
        errorText: '*エラー：このフィールドは必須です',
      };
    default:
      return {
        label: 'Form label',
        placeholder: 'Placeholder',
        helpText: '8 characters minimum',
        errorText: 'This field is required',
      };
  }
};

export default {
  title: 'Components/Forms/Text input',
  component: TextInput,
  argTypes: {
    type: {
      control: { type: 'select' },
      options: [
        'text',
        'email',
        'password',
        'number',
        'tel',
        'search',
        'date',
        'url',
      ],
    },
  },
};

export const Default = {
  args: {
    label: 'Full name',
    placeholder: 'Enter your name',
  },
};

export const WithHelpText = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    helpText: '8 characters minimum',
  },
};

export const ErrorState = {
  args: {
    label: 'Email address',
    type: 'email',
    placeholder: 'you@example.com',
    error: true,
    errorText: 'This field is required',
  },
};

export const Disabled = {
  args: {
    label: 'Full name',
    placeholder: 'Enter your name',
    disabled: true,
  },
};

export const Required = {
  args: {
    label: 'Full name',
    placeholder: 'Enter your name',
    required: true,
  },
};

export const TypeDate = {
  args: {
    label: 'Date of birth',
    type: 'date',
  },
  name: 'Date',
};

export const TypeNumber = {
  args: {
    label: 'Number of projects',
    type: 'number',
    placeholder: '0',
  },
  name: 'Number',
};

export const TypeTelephone = {
  args: {
    label: 'Phone number',
    type: 'tel',
    placeholder: '+234 000 000 0000',
  },
  name: 'Telephone',
};

export const TypeSearch = {
  args: {
    label: 'Search',
    type: 'search',
    placeholder: 'Enter search term',
  },
  name: 'Search',
};

export const Localized = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <TextInput
        label={caption.label}
        placeholder={caption.placeholder}
        helpText={caption.helpText}
        {...args}
      />
    );
  },
};
