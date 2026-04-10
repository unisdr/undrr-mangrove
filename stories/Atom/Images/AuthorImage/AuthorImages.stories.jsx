import { Authorimg } from './AuthorImages';

const user =
  'https://www.undrr.org/sites/default/files/styles/por/public/2024-05/Kamal-Kishore_UNDRR-SRSG-C-A.Tardy_min.jpg';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'english':
      const engText = {};
      return engText;
    case 'arabic':
      const arabicText = {};
      return arabicText;
    case 'japanese':
      const japaneseText = {};
      return japaneseText;
    default:
      return {};
  }
};

export default {
  title: 'Components/Images/Author image',
  component: Authorimg,

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
    return (
      <Authorimg
        image={user}
        alt="Kamal Kishore, UNDRR SRSG"
        {...args}
      ></Authorimg>
    );
  },

  name: 'Author image',
};
