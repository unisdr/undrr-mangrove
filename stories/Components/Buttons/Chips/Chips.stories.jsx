import { Chips } from './Chips';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'english':
      const engText = { detail: 'Label' };
      return engText;
    case 'arabic':
      const arabicText = { detail: 'ملصق' };
      return arabicText;
    case 'japanese':
      const japaneseText = { detail: 'ラベル' };
      return japaneseText;
    default:
      return { detail: 'Label' };
  }
};

export default {
  title: 'Components/Buttons/Chips',
  component: Chips,

  argTypes: {
    Type: {
      options: ['Default', 'With X'],

      control: {
        type: 'inline-radio',
      },
    },
  },
};

export const DefaultChips = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Chips label={caption.detail} {...args}></Chips>;
  },

  name: 'Chips',
};
