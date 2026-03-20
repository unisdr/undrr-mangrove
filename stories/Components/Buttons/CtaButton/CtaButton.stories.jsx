import { CtaButton } from './CtaButton';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'english':
      const engText = { detail: 'Read more' };
      return engText;
    case 'arabic':
      const arabicText = { detail: 'اقرأ أكثر' };
      return arabicText;
    case 'japanese':
      const japaneseText = { detail: '続きを読む' };
      return japaneseText;
    default:
      return { detail: 'Read more' };
  }
};

export default {
  title: 'Components/Buttons/Buttons',
  component: CtaButton,

  argTypes: {
    Type: {
      options: ['Primary', 'Secondary'],
      control: { type: 'inline-radio' },
    },

    State: {
      options: ['Default', 'Disabled'],
      control: { type: 'inline-radio' },
    },

    For_Primary: {
      options: ['Arrow', 'No Arrow'],
      control: { type: 'inline-radio' },
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
