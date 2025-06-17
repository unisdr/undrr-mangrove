import { Authorimg } from './AuthorImages';
import user from '../../../assets/images/author.png';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'english':
      const engText = {};
      return engText;
    case 'arabic':
      const arabicText = {};
      return arabicText;
    case 'burmese':
      const burmeseText = {};
      return burmeseText;
    case 'japanese':
      const japaneseText = {};
      return japaneseText;
    default:
      return {};
  }
};

export default {
  title: 'Components/Images/Author image',

  argTypes: {
    variant: {
      options: ['Large', 'Small'],

      control: {
        type: 'inline-radio',
      },

      defaultValue: 'Small',
    },

    hovercolor: {
      options: ['yellow', 'red', 'green', 'blue'],

      control: {
        type: 'inline-radio',
      },

      defaultValue: 'yellow',
    },
  },
};

export const DefaultAuthorImage = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Authorimg image={user} alt="Headshot of XYZ" {...args}></Authorimg>;
  },

  name: 'Author image',
};
