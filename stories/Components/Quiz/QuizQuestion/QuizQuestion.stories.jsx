import React, { useEffect, useRef } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { withLanguage } from '../../../../.storybook/withLanguage';
import createHydrator from '../../../../src/hydrate';
import sampleImage from '../../../assets/images/sample_image-md.jpg';
import {
  HELP,
  QUESTIONS,
  getHelp,
  getPageText,
  getQuestion,
  getServerMarkup,
} from '../_storyFixtures';
import { QuizScore } from '../QuizScore/QuizScore';
import quizScoreFromElement, {
  ensureQuizScoreHost,
} from '../QuizScore/QuizScore.fromElement';
import { QuizQuestion } from './QuizQuestion';
import quizQuestionFromElement from './QuizQuestion.fromElement';

// Swaps the English question content for Arabic when the locale toolbar asks
// for it. Interface labels are not touched: they come from the component.
const withQuestionContent = (Story, context) => {
  const key = context.parameters.quizFixture;
  const localized = key ? getQuestion(context.globals, key) : null;
  // Only the hint is content. Whether "Show answer" is offered stays with the
  // story's own args.
  const hint =
    key && context.parameters.quizHint
      ? { hint: getHelp(context.globals, key).hint }
      : null;
  return (
    <Story
      {...context}
      args={
        localized ? { ...context.args, ...localized, ...hint } : context.args
      }
    />
  );
};

export default {
  title: 'Components/Quiz/Quiz question',
  component: QuizQuestion,
  decorators: [withQuestionContent, withLanguage],
  parameters: {
    docs: {
      description: {
        component:
          'One self-checking question in the page flow. Answers are checked in the browser, and the component stores and sends nothing.',
      },
    },
  },
  argTypes: {
    type: { table: { defaultValue: { summary: 'multiple_choice' } } },
    multiple: { table: { defaultValue: { summary: 'false' } } },
    caseSensitive: { table: { defaultValue: { summary: 'false' } } },
    showNumber: { table: { defaultValue: { summary: 'true' } } },
    media: { control: false },
    showAnswer: { table: { defaultValue: { summary: 'false' } } },
    onCheck: { action: 'check' },
    onReveal: { action: 'reveal' },
  },
};

export const MultipleChoice = {
  args: QUESTIONS.multipleChoice,
  parameters: { quizFixture: 'multipleChoice' },
};

export const MultipleAnswers = {
  args: QUESTIONS.multipleAnswers,
  parameters: {
    quizFixture: 'multipleAnswers',
    docs: {
      description: {
        story:
          'With `multiple`, the options are checkboxes and the question shows the "Select all that apply." instruction. The answer is correct only when exactly the right options are selected.',
      },
    },
  },
};

export const TrueFalse = {
  args: QUESTIONS.trueFalse,
  parameters: {
    quizFixture: 'trueFalse',
    docs: {
      description: {
        story:
          'The True and False labels come from the language catalogue, so the consumer passes only `answer`.',
      },
    },
  },
};

export const ShortAnswer = {
  args: QUESTIONS.shortAnswer,
  parameters: { quizFixture: 'shortAnswer' },
};

export const FillInTheBlank = {
  args: QUESTIONS.fillBlank,
  parameters: {
    quizFixture: 'fillBlank',
    docs: {
      description: {
        story:
          '`[1]` and `[2]` in the prompt become inputs in the sentence. Each input is named by its blank label, or "Blank 1 of 2" without one.',
      },
    },
  },
};

export const FillInTheBlankFieldsBelow = {
  args: {
    type: 'fill_blank',
    prompt:
      'Name the city and the year in which the Sendai Framework was adopted.',
    blanks: [
      { label: 'City', expected: ['Sendai'] },
      { label: 'Year', expected: ['2015'] },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'A blank that the prompt does not refer to is listed under it as a labelled field. With no references at all, the prompt is the legend of the group.',
      },
    },
  },
};

export const WithImage = {
  args: QUESTIONS.image,
  parameters: { quizFixture: 'image' },
  render: (args, { globals }) => (
    <QuizQuestion
      {...args}
      media={
        <img
          src={sampleImage}
          alt={getPageText(globals).imageAlt}
          width="640"
          height="360"
        />
      }
    />
  ),
};

export const LongLabels = {
  args: QUESTIONS.longLabels,
  parameters: {
    docs: {
      description: {
        story:
          'Long prompts and options wrap, including an unbroken word. The control stays aligned with the first line of its label.',
      },
    },
  },
};

export const Numbered = {
  args: { ...QUESTIONS.trueFalse, number: 2, total: 5 },
  parameters: {
    quizFixture: 'trueFalse',
    docs: {
      description: {
        story:
          'Questions number themselves when several share a page. Pass `number` and `total` to set the position yourself, or `showNumber={false}` to leave it out.',
      },
    },
  },
};

export const AnsweredCorrect = {
  args: { ...QUESTIONS.multipleChoice, lang: 'en' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const answer = canvas.getByLabelText('Ultraviolet radiation');
    await userEvent.click(answer);
    await userEvent.click(canvas.getByRole('button', { name: 'Check answer' }));
    await expect(canvas.getByText(/Overexposure can cause/)).toBeVisible();
    await expect(
      canvasElement.querySelector('.mg-quiz-question')
    ).toHaveAttribute('data-mg-quiz-state', 'correct');
    // Locked: the button has gone, focus is on the result (a group named
    // "Correct", not the live region around it) and the answer can no longer
    // be changed.
    await expect(
      canvas.queryByRole('button', { name: 'Check answer' })
    ).toBeNull();
    await expect(canvas.getByRole('group', { name: 'Correct' })).toHaveFocus();
    await expect(
      canvasElement.querySelector('.mg-quiz-question__feedback')
    ).not.toHaveFocus();
    await userEvent.click(canvas.getByLabelText('Chlorine'));
    await expect(answer).toBeChecked();
  },
  parameters: {
    docs: {
      description: {
        story:
          'A correct answer locks the question. The controls become read-only, the check button is removed and focus moves to the result.',
      },
    },
  },
};

export const AnsweredIncorrect = {
  args: { ...QUESTIONS.multipleChoice, lang: 'en' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText('Chlorine'));
    await userEvent.click(canvas.getByRole('button', { name: 'Check answer' }));
    await expect(canvas.getByText('Not correct yet. Try again.')).toBeVisible();
    await expect(canvas.queryByText(/Overexposure can cause/)).toBeNull();
    await expect(
      canvasElement.querySelector('.mg-quiz-question')
    ).toHaveAttribute('data-mg-quiz-state', 'incorrect');
  },
  parameters: {
    docs: {
      description: {
        story:
          'A wrong answer never shows the explanation or marks the right option, because the visitor can try again. Changing the answer clears the message.',
      },
    },
  },
};

// The stories below are driven by structure, not by label text, so they run
// in every language of the locale toolbar.
const questionRoot = canvasElement =>
  canvasElement.querySelector('.mg-quiz-question');
const checkAnswer = canvasElement =>
  userEvent.click(canvasElement.querySelector('.mg-quiz-question__check'));
const revealButton = canvasElement =>
  canvasElement.querySelector('.mg-quiz-question__reveal');
// The third option of the multiple choice fixture is a wrong answer.
const chooseWrongOption = async canvasElement => {
  await userEvent.click(canvasElement.querySelectorAll('input')[2]);
  await checkAnswer(canvasElement);
};
const typeWrongBlank = async canvasElement => {
  await userEvent.type(canvasElement.querySelector('input'), 'Kobe');
  await checkAnswer(canvasElement);
};

export const IncorrectWithHint = {
  args: { ...QUESTIONS.multipleChoice, hint: HELP.multipleChoice.hint },
  parameters: {
    quizFixture: 'multipleChoice',
    quizHint: true,
    docs: {
      description: {
        story:
          'With `hint`, the "Not correct yet. Try again." feedback carries a line of help. It is shown only after an incorrect attempt, never before one and never for an empty attempt.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector('.mg-quiz-question__feedback-hint')
    ).toBeNull();
    await chooseWrongOption(canvasElement);
    await expect(questionRoot(canvasElement)).toHaveAttribute(
      'data-mg-quiz-state',
      'incorrect'
    );
    await expect(
      canvasElement.querySelector('.mg-quiz-question__feedback-hint')
    ).toBeVisible();
    await expect(
      canvasElement.querySelector('.mg-quiz-question__explanation')
    ).toBeNull();
    await expect(revealButton(canvasElement)).toBeNull();
  },
};

export const ShowAnswerOffered = {
  args: { ...QUESTIONS.multipleChoice, ...HELP.multipleChoice },
  parameters: {
    quizFixture: 'multipleChoice',
    quizHint: true,
    docs: {
      description: {
        story:
          'With `showAnswer`, a "Show answer" button joins "Check answer" after the first incorrect attempt. It is the quieter of the two, and it stays while the visitor edits the answer.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(revealButton(canvasElement)).toBeNull();
    // An empty attempt does not earn the button.
    await checkAnswer(canvasElement);
    await expect(revealButton(canvasElement)).toBeNull();
    await chooseWrongOption(canvasElement);
    await expect(revealButton(canvasElement)).toBeVisible();
    await expect(revealButton(canvasElement)).toHaveAttribute(
      'data-vf-analytics-label',
      'Quiz: Show answer'
    );
    await expect(
      canvasElement.querySelector('.mg-quiz-question__check')
    ).toBeVisible();
  },
};

export const AnswerRevealed = {
  args: { ...QUESTIONS.multipleChoice, ...HELP.multipleChoice },
  parameters: {
    quizFixture: 'multipleChoice',
    quizHint: true,
    docs: {
      description: {
        story:
          '"Show answer" selects the correct option in place of the visitor’s, locks the question and shows a neutral message with the explanation. Focus moves to that message. Quiz score counts the question as answered and not correct.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await chooseWrongOption(canvasElement);
    await userEvent.click(revealButton(canvasElement));
    const inputs = Array.from(canvasElement.querySelectorAll('input'));
    await expect(inputs.map(input => input.checked)).toEqual([
      true,
      false,
      false,
      false,
    ]);
    const root = questionRoot(canvasElement);
    await expect(root).toHaveAttribute('data-mg-quiz-state', 'revealed');
    await expect(root).toHaveClass('mg-quiz-question--revealed');
    await expect(canvasElement.querySelector('button')).toBeNull();
    const notice = canvasElement.querySelector('.mg-notice');
    await expect(notice).toHaveClass('mg-notice--info');
    await expect(notice).toHaveFocus();
    await expect(
      canvasElement.querySelector('.mg-quiz-question__explanation')
    ).toBeVisible();
    await expect(
      canvasElement.querySelector('.mg-quiz-question__feedback-hint')
    ).toBeNull();
    // Locked: another option cannot be chosen.
    await userEvent.click(inputs[2]);
    await expect(inputs[0]).toBeChecked();
  },
};

export const AnswerRevealedFillInTheBlank = {
  args: { ...QUESTIONS.fillBlank, ...HELP.fillBlank },
  parameters: {
    quizFixture: 'fillBlank',
    quizHint: true,
    docs: {
      description: {
        story:
          'In a text question "Show answer" fills each field with its first accepted answer and makes the fields read-only.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    await typeWrongBlank(canvasElement);
    await expect(
      canvasElement.querySelector('.mg-quiz-question__feedback-hint')
    ).toBeVisible();
    await userEvent.click(revealButton(canvasElement));
    const inputs = Array.from(canvasElement.querySelectorAll('input'));
    await expect(inputs.map(input => input.value)).toEqual(
      args.blanks.map(blank => blank.expected[0])
    );
    for (const input of inputs) {
      // eslint-disable-next-line no-await-in-loop -- sequential assertions
      await expect(input).toHaveAttribute('readonly');
    }
    await expect(questionRoot(canvasElement)).toHaveAttribute(
      'data-mg-quiz-state',
      'revealed'
    );
    await expect(canvasElement.querySelector('button')).toBeNull();
    await expect(canvasElement.querySelector('.mg-notice')).toHaveFocus();
  },
};

export const EmptyAttempt = {
  args: { ...QUESTIONS.shortAnswer, lang: 'en' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Check answer' }));
    await expect(canvas.getByText('Type an answer first.')).toBeVisible();
    await expect(
      canvasElement.querySelector('.mg-quiz-question')
    ).toHaveAttribute('data-mg-quiz-state', 'unanswered');
  },
};

function QuizPageExample({ lang, dir, globals }) {
  const text = getPageText(globals);
  const question = key => getQuestion(globals, key);
  const help = key => getHelp(globals, key);
  return (
    <article className="mg-container" lang={lang} dir={dir}>
      <h1>{text.title}</h1>
      <p>{text.intro}</p>
      <QuizQuestion
        {...question('multipleChoice')}
        {...help('multipleChoice')}
        lang={lang}
      />
      <p>{text.between}</p>
      <QuizQuestion
        {...question('image')}
        lang={lang}
        media={
          <figure>
            <img
              src={sampleImage}
              alt={text.imageAlt}
              width="640"
              height="360"
            />
            <figcaption>{text.caption}</figcaption>
          </figure>
        }
      />
      <QuizQuestion {...question('multipleAnswers')} lang={lang} />
      <QuizQuestion
        {...question('trueFalse')}
        {...help('trueFalse')}
        lang={lang}
      />
      <QuizQuestion
        {...question('fillBlank')}
        {...help('fillBlank')}
        lang={lang}
      />
      <QuizScore lang={lang} />
      <h2>{text.after}</h2>
      <p>{text.afterBody}</p>
    </article>
  );
}

export const QuizPage = {
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Five independent questions between ordinary content, one with a figure, followed by QuizScore. The questions number themselves and the score appears once the first answer is checked. The first, fourth and fifth questions have a hint, and the first and fifth offer "Show answer" after a wrong attempt.',
      },
    },
  },
  render: (args, { globals }) => (
    <QuizPageExample lang={args.lang} dir={args.dir} globals={globals} />
  ),
};

const SERVER_MARKUP = getServerMarkup(sampleImage);

// Storybook always runs scripts, so a browser here never shows what is inside
// <noscript>. The no-JavaScript story unwraps the note to show that state.
const NO_SCRIPT_MARKUP = SERVER_MARKUP.replace(/<\/?noscript>/g, '');

function ServerMarkup({ hydrate, lang, dir }) {
  const markup = hydrate ? SERVER_MARKUP : NO_SCRIPT_MARKUP;
  const ref = useRef(null);
  useEffect(() => {
    if (!hydrate) return undefined;
    const scope = ref.current;
    const questions = createHydrator({
      selector: '[data-mg-quiz-question]',
      component: QuizQuestion,
      fromElement: quizQuestionFromElement,
    });
    ensureQuizScoreHost(scope);
    const score = createHydrator({
      selector: '[data-mg-quiz-score]',
      component: QuizScore,
      fromElement: quizScoreFromElement,
    });
    return () => {
      questions.unmountAll();
      score.unmountAll();
    };
  }, [hydrate]);
  return (
    <div
      ref={ref}
      className="mg-container"
      lang={lang}
      dir={dir}
      data-mg-quiz=""
      // eslint-disable-next-line react/no-danger -- static story fixture standing in for server-rendered markup
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

export const NoJavaScript = {
  parameters: {
    layout: 'fullscreen',
    docs: {
      source: { code: SERVER_MARKUP, language: 'html' },
      description: {
        story:
          'The markup a server renders, as a browser without JavaScript shows it: a readable question with working controls, no check button and a note from `<noscript>` that checking answers needs JavaScript. The radios of each question share a `name`, so only one can be selected. The note is the consumer’s text, in the page’s language.',
      },
    },
  },
  // Nothing is mounted in this story, so these are the browser's own radio
  // groups: the shared `name` in the markup is all that makes them exclusive.
  play: async ({ canvasElement }) => {
    const questions = Array.from(
      canvasElement.querySelectorAll('[data-mg-quiz-question]')
    );
    const groups = questions
      .map(question =>
        Array.from(question.querySelectorAll('input[type="radio"]'))
      )
      .filter(radios => radios.length > 0);
    await expect(groups).toHaveLength(2);
    await expect(
      canvasElement.querySelector('.mg-quiz-question__check')
    ).toBeNull();
    for (const radios of groups) {
      for (const radio of radios) {
        // eslint-disable-next-line no-await-in-loop -- one click after another, as a visitor would
        await userEvent.click(radio.closest('label'));
      }
    }
    for (const radios of groups) {
      // eslint-disable-next-line no-await-in-loop -- sequential assertions
      await expect(radios.filter(radio => radio.checked)).toEqual([
        radios[radios.length - 1],
      ]);
    }
    // The arrow keys move within one question's group only.
    groups[0][0].focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(groups[0][1]).toBeChecked();
    await expect(groups[1][groups[1].length - 1]).toBeChecked();
  },
  render: args => (
    <ServerMarkup hydrate={false} lang={args.lang} dir={args.dir} />
  ),
};

export const ServerRendered = {
  parameters: {
    layout: 'fullscreen',
    docs: {
      source: { code: SERVER_MARKUP, language: 'html' },
      description: {
        story:
          'The same markup after `createHydrator` has mounted QuizQuestion on each container and `ensureQuizScoreHost` has added the score after the last one. Interface labels follow the nearest `lang`; the question content is whatever the server rendered.',
      },
    },
  },
  render: args => <ServerMarkup hydrate lang={args.lang} dir={args.dir} />,
};
