import { Select } from './Select';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return {
        label: 'فئة',
        placeholder: 'اختر خيارًا',
        helpText: 'اختر لغتك المفضلة',
        errorText: 'يرجى اختيار خيار',
        options: [
          { value: 'option1', label: 'الخيار 1' },
          { value: 'option2', label: 'الخيار 2' },
          { value: 'option3', label: 'الخيار 3' },
        ],
      };
    case 'burmese':
      return {
        label: 'အမျိုးအစား',
        placeholder: 'ရွေးချယ်ပါ',
        helpText: 'သင်နှစ်သက်သောဘာသာစကားကိုရွေးချယ်ပါ',
        errorText: 'ကျေးဇူးပြု၍ရွေးချယ်ပါ',
        options: [
          { value: 'option1', label: 'ရွေးချယ်မှု ၁' },
          { value: 'option2', label: 'ရွေးချယ်မှု ၂' },
          { value: 'option3', label: 'ရွေးချယ်မှု ၃' },
        ],
      };
    case 'japanese':
      return {
        label: 'カテゴリー',
        placeholder: 'オプションを選択',
        helpText: 'ご希望の言語を選択してください',
        errorText: 'オプションを選択してください',
        options: [
          { value: 'option1', label: 'オプション 1' },
          { value: 'option2', label: 'オプション 2' },
          { value: 'option3', label: 'オプション 3' },
        ],
      };
    default:
      return {
        label: 'Category',
        placeholder: 'Select an option',
        helpText: 'Choose your preferred language',
        errorText: 'Please select an option',
        options: [
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' },
          { value: 'option3', label: 'Option 3' },
        ],
      };
  }
};

export default {
  title: 'Components/Forms/Select',
  component: Select,
};

export const Default = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <Select
        label={caption.label}
        options={caption.options}
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
      <Select
        label={caption.label}
        options={caption.options}
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
      <Select
        label={caption.label}
        options={caption.options}
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
      <Select
        label={caption.label}
        options={caption.options}
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
      <Select
        label={caption.label}
        options={caption.options}
        placeholder={caption.placeholder}
        required
        {...args}
      />
    );
  },
};

export const WithDisabledOption = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    const options = [
      caption.options[0],
      caption.options[1],
      { ...caption.options[2], disabled: true },
    ];
    return (
      <Select
        label={caption.label}
        options={options}
        placeholder={caption.placeholder}
        {...args}
      />
    );
  },
};
