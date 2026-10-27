import { withLanguage } from '../../../../.storybook/withLanguage';
import ShareButtons from './ShareButtons';

export default {
  title: 'Components/Buttons/ShareButtons',
  component: ShareButtons,
  decorators: [withLanguage],
  argTypes: {
    SharingSubject: {
      control: { type: 'text' },
      defaultValue: 'Sharing Link',
    },
    SharingTextBody: {
      control: { type: 'text' },
      defaultValue: 'Check out this link: ',
    },
  },
};

export const DefaultShareButtons = {
  name: 'ShareButtons',
};
