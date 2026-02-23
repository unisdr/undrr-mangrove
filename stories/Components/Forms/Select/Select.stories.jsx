import { Select } from './Select';

const sampleOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return { label: 'فئة', placeholder: 'اختر خيارًا' };
    case 'burmese':
      return { label: 'အမျိုးအစား', placeholder: 'ရွေးချယ်ပါ' };
    case 'japanese':
      return { label: 'カテゴリー', placeholder: 'オプションを選択' };
    default:
      return { label: 'Category', placeholder: 'Select an option' };
  }
};

export default {
  title: 'Components/Forms/Select',
  component: Select,
};

export const Default = {
  args: {
    label: 'Country',
    options: sampleOptions,
    placeholder: 'Select an option',
  },
};

export const WithHelpText = {
  args: {
    label: 'Language',
    options: sampleOptions,
    placeholder: 'Select a language',
    helpText: 'Choose your preferred language',
  },
};

export const ErrorState = {
  args: {
    label: 'Country',
    options: sampleOptions,
    placeholder: 'Select an option',
    error: true,
    errorText: 'Please select a country',
  },
};

export const Disabled = {
  args: {
    label: 'Country',
    options: sampleOptions,
    placeholder: 'Select an option',
    disabled: true,
  },
};

export const Required = {
  args: {
    label: 'Country',
    options: sampleOptions,
    placeholder: 'Select an option',
    required: true,
  },
};

export const WithDisabledOption = {
  args: {
    label: 'Status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'pending', label: 'Pending' },
      { value: 'archived', label: 'Archived', disabled: true },
    ],
    placeholder: 'Select status',
  },
};

export const Localized = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <Select
        label={caption.label}
        options={sampleOptions}
        placeholder={caption.placeholder}
        {...args}
      />
    );
  },
};
