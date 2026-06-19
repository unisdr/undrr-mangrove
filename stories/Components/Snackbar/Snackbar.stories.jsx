import { ShowOffSnackbar, SnackbarPreview } from './Snackbar.jsx';
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
  title: 'Components/Snackbar',
  component: ShowOffSnackbar,
  decorators: [withLocaleLabels],
  parameters: {
    docs: {
      description: {
        component:
          "Snackbars provide brief notifications or feedback messages to users about an operation's status.",
      },
    },
  },
  argTypes: {
    message: {
      control: {
        type: 'text',
      },
      description: 'The text content to display in the snackbar',
      defaultValue: 'This is a notification message',
    },
    severity: {
      options: ['error', 'warning', 'info', 'success'],
      control: {
        type: 'select',
      },
      description: 'Determines the appearance and icon of the snackbar',
      defaultValue: 'info',
    },
    openedMiliseconds: {
      control: {
        type: 'number',
      },
      description:
        'Duration in milliseconds before the snackbar automatically closes',
      defaultValue: 5000,
    },
  },
};

// Primary example
export const Snackbar = {
  render: args => {
    return <ShowOffSnackbar {...args} />;
  },
};

// Additional examples for the documentation
export const Error = {
  args: {
    severity: 'error',
    message: 'An error occurred while processing your request',
    openedMiliseconds: 5000,
  },
};

export const Warning = {
  args: {
    severity: 'warning',
    message: 'Your session will expire in 5 minutes',
    openedMiliseconds: 5000,
  },
};

export const Info = {
  args: {
    severity: 'info',
    message: 'New updates are available for your application',
    openedMiliseconds: 5000,
  },
};

export const Success = {
  args: {
    severity: 'success',
    message: 'Your changes have been saved successfully',
    openedMiliseconds: 5000,
  },
};
