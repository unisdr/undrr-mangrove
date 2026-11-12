import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { withLanguage } from '../../../../.storybook/withLanguage';
import { getQuestion } from '../_storyFixtures';
import { QuizQuestion } from '../QuizQuestion/QuizQuestion';
import { QuizScore } from './QuizScore';

export default {
  title: 'Components/Quiz/Quiz score',
  component: QuizScore,
  decorators: [withLanguage],
  parameters: {
    docs: {
      description: {
        component:
          'Running score and end summary for the quiz questions that share a page or a `data-mg-quiz` wrapper. It is empty until the first answer is checked.',
      },
    },
  },
};

const renderQuiz = (args, { globals }) => (
  <div data-mg-quiz="">
    <QuizQuestion {...getQuestion(globals, 'trueFalse')} lang={args.lang} />
    <QuizQuestion
      {...getQuestion(globals, 'multipleAnswers')}
      lang={args.lang}
    />
    <QuizScore {...args} />
  </div>
);

export const Default = {
  render: renderQuiz,
  parameters: {
    docs: {
      description: {
        story: 'Check an answer to see the running score and progress.',
      },
    },
  },
};

export const InProgress = {
  args: { lang: 'en' },
  render: renderQuiz,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText('False'));
    await userEvent.click(
      canvas.getAllByRole('button', { name: 'Check answer' })[0]
    );
    await expect(canvas.getByRole('status')).toHaveTextContent(
      '1 of 2 correct so far.'
    );
    await expect(canvas.getByRole('progressbar')).toHaveAttribute('value', '1');
  },
};

export const Complete = {
  args: { lang: 'en' },
  render: renderQuiz,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const check = () => canvas.getAllByRole('button', { name: 'Check answer' });
    await userEvent.click(canvas.getByLabelText('False'));
    await userEvent.click(check()[0]);
    // The first question is now locked, so one check button is left.
    await userEvent.click(canvas.getByLabelText('Flood'));
    await userEvent.click(check()[0]);
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'You got 1 of 2 correct.'
    );
    await expect(
      canvas.getByRole('button', { name: 'Start again' })
    ).toBeVisible();
  },
};

export const WithoutProgressOrReset = {
  args: { showProgress: false, showReset: false },
  render: renderQuiz,
  parameters: {
    docs: {
      description: {
        story:
          'The progress bar and the "Start again" action are optional. Without the progress bar the running score uses its longer form, which also says how many questions are answered.',
      },
    },
  },
};
