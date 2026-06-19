import ShareButtons from './ShareButtons';
import {
  LABELS_ES,
  LABELS_FR,
  LABELS_JA,
  LABELS_ZH,
  LABELS_AR,
  LABELS_RU,
} from './_labels';

const LOCALE_LABELS = {
  spanish: LABELS_ES,
  french: LABELS_FR,
  japanese: LABELS_JA,
  chinese: LABELS_ZH,
  arabic: LABELS_AR,
  russian: LABELS_RU,
};

const withLocaleLabels = (Story, context) => {
  const labels = LOCALE_LABELS[context.globals?.locale];
  if (!labels) return <Story />;
  return <Story {...context} args={{ ...context.args, labels }} />;
};

export default {
  title: 'Components/Buttons/ShareButtons',
  component: ShareButtons,
  decorators: [withLocaleLabels],
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
