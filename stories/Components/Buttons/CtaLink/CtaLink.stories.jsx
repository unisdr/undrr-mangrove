import { Ctalink } from './CtaLink';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'english':
      const engText = { detail1: 'READ MORE' };
      return engText;
    case 'arabic':
      const arabicText = { detail1: 'اقرأ أكثر' };
      return arabicText;
    case 'burmese':
      const burmeseText = { detail1: 'ပိုပြီးဖတ်ပါ' };
      return burmeseText;
    case 'japanese':
      const japaneseText = { detail1: '続きを読む' };
      return japaneseText;
    default:
      return { detail1: 'READ MORE' };
  }
};

export default {
  title: 'Components/Buttons/CTA link',
  component: Ctalink,

  argTypes: {
    Type: {
      options: ['Expanding Arrow', 'Space'],

      control: {
        type: 'inline-radio',
      },

      defaultValue: 'Expanding Arrow',
    },

    Tag: {
      options: ['Hyperlink', 'Inline'],

      control: {
        type: 'inline-radio',
      },

      defaultValue: 'Hyperlink',
    },
  },
};

export const DefaultCtaLink = {
  // replace key
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    args['button_option'] = args['Tag'];
    delete args['Tag'];
    return <Ctalink label={caption.detail1} {...args}></Ctalink>;
  },

  name: 'CTA link',
};
