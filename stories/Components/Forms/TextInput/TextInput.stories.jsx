import { TextInput } from './TextInput';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return {
        label: 'تسمية النموذج',
        placeholder: 'نائب',
        helpText: '8 أحرف كحد أدنى',
        errorText: 'هذا الحقل مطلوب',
      };
    case 'burmese':
      return {
        label: 'ပုံစံတံဆိပ်',
        placeholder: 'နေရာယူသည်',
        helpText: 'အနည်းဆုံးစာလုံး ၈ လုံး',
        errorText: 'ဤအကွက်လိုအပ်သည်',
      };
    case 'japanese':
      return {
        label: 'フォームラベル',
        placeholder: 'プレースホルダー',
        helpText: '最小8文字',
        errorText: 'このフィールドは必須です',
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
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <TextInput
        label={caption.label}
        placeholder={caption.placeholder}
        {...args}
      />
    );
  },
};

export const WithHelpText = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <TextInput
        label={caption.label}
        type="password"
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
      <TextInput
        label={caption.label}
        type="email"
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
      <TextInput
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
      <TextInput
        label={caption.label}
        placeholder={caption.placeholder}
        required
        {...args}
      />
    );
  },
};

export const TypeDate = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <TextInput label={caption.label} type="date" {...args} />;
  },
  name: 'Date',
};

export const TypeNumber = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <TextInput
        label={caption.label}
        type="number"
        placeholder="0"
        {...args}
      />
    );
  },
  name: 'Number',
};

export const TypeTelephone = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <TextInput
        label={caption.label}
        type="tel"
        placeholder={caption.placeholder}
        {...args}
      />
    );
  },
  name: 'Telephone',
};

export const TypeSearch = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <TextInput
        label={caption.label}
        type="search"
        placeholder={caption.placeholder}
        {...args}
      />
    );
  },
  name: 'Search',
};
