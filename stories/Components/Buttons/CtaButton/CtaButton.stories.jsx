import { CtaButton } from './CtaButton';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'english':
      const engText = { detail: 'Read more' };
      return engText;
    case 'arabic':
      const arabicText = { detail: 'اقرأ أكثر' };
      return arabicText;
    case 'burmese':
      const burmeseText = { detail: 'ပိုပြီးဖတ်ပါ' };
      return burmeseText;
    case 'japanese':
      const japaneseText = { detail: '続きを読む' };
      return japaneseText;
    default:
      return { detail: 'Read more' };
  }
};

export default {
  title: 'Components/Buttons/Buttons',

  argTypes: {
    Type: {
      options: ['Primary', 'Secondary'],

      control: {
        type: 'inline-radio',
      },

      defaultValue: 'Primary',
    },

    State: {
      options: ['Active', 'Disabled'],

      control: {
        type: 'inline-radio',
      },

      defaultValue: 'Active',
    },

    For_Primary: {
      options: ['Arrow', 'No Arrow'],

      control: {
        type: 'inline-radio',
      },

      defaultValue: 'Arrow',
    },
  },
};

export const DefaultButtons = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <CtaButton label={caption.detail} {...args}></CtaButton>;
  },

  name: 'Buttons',
};
