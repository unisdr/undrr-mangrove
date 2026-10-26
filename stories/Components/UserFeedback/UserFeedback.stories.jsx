import UserFeedback from './UserFeedback';
import { expect, userEvent, within } from 'storybook/test';

const LOCALE_LANGUAGES = {
  english: 'en',
  arabic: 'ar',
  chinese: 'zh',
  french: 'fr',
  japanese: 'ja',
  russian: 'ru',
  spanish: 'es',
};

export default {
  title: 'Components/User feedback',
  component: UserFeedback,
  render: (args, { globals }) => (
    <UserFeedback
      {...args}
      lang={args.lang ?? LOCALE_LANGUAGES[globals.locale]}
    />
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A compact pre-footer prompt that records a binary page response and offers a route for detailed feedback.',
      },
    },
  },
};

export const Default = {};

export const ArabicConfirmation = {
  args: { lang: 'ar' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', {
      name: 'هل كانت هذه الصفحة مفيدة؟',
    });
    await expect(region).toHaveAttribute('lang', 'ar');
    await expect(getComputedStyle(region).direction).toBe('rtl');
    canvas.getByRole('button', { name: 'نعم' }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByText(/شكراً لملاحظاتك/)).toHaveFocus();
    await expect(
      canvas.getByRole('link', { name: 'إخبارنا بالمزيد' })
    ).toHaveAttribute('target', '_blank');
  },
};

export const LongLabels = {
  args: {
    labels: {
      question:
        'Did this page give you the information you needed to complete your task?',
      yes: 'Yes, it answered my question',
      no: 'No, I still need help',
      reportIssue:
        'Tell the website team about inaccurate or outdated information',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Translation-stress example. Labels wrap naturally without overlapping the issue link.',
      },
    },
  },
};
