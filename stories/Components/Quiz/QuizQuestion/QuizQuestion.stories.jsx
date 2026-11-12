import React, { useEffect, useRef } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { withLanguage } from '../../../../.storybook/withLanguage';
import createHydrator from '../../../../src/hydrate';
import sampleImage from '../../../assets/images/sample_image-md.jpg';
import { QUESTIONS, getPageText, getQuestion } from '../_storyFixtures';
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
  return (
    <Story
      {...context}
      args={localized ? { ...context.args, ...localized } : context.args}
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
          'One self-checking question in the page flow. Answers are checked in the browser and nothing is stored.',
      },
    },
  },
  argTypes: {
    media: { control: false },
    onCheck: { action: 'check' },
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
          'With `multiple`, the options are checkboxes and the question says "Select all that apply". The answer is correct only when exactly the right options are selected.',
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
    await userEvent.click(canvas.getByLabelText('Ultraviolet radiation'));
    const button = canvas.getByRole('button', { name: 'Check answer' });
    await userEvent.click(button);
    await expect(button).toHaveFocus();
    await expect(canvas.getByText(/Overexposure can cause/)).toBeVisible();
    await expect(
      canvasElement.querySelector('.mg-quiz-question')
    ).toHaveAttribute('data-mg-quiz-state', 'correct');
  },
};

export const AnsweredIncorrect = {
  args: { ...QUESTIONS.multipleChoice, lang: 'en' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText('Chlorine'));
    await userEvent.click(canvas.getByRole('button', { name: 'Check answer' }));
    await expect(canvas.getByText('Not quite. Try again.')).toBeVisible();
    await expect(canvas.queryByText(/Overexposure can cause/)).toBeNull();
  },
  parameters: {
    docs: {
      description: {
        story:
          'A wrong answer never shows the explanation or marks the right option, because the visitor can try again.',
      },
    },
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
  return (
    <article className="mg-container" lang={lang} dir={dir}>
      <h1>{text.title}</h1>
      <p>{text.intro}</p>
      <QuizQuestion {...question('multipleChoice')} lang={lang} />
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
      <QuizQuestion {...question('trueFalse')} lang={lang} />
      <QuizQuestion {...question('fillBlank')} lang={lang} />
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
          'Five independent questions between ordinary content, one with a figure, followed by QuizScore. The questions number themselves and the score appears once the first answer is checked.',
      },
    },
  },
  render: (args, { globals }) => (
    <QuizPageExample lang={args.lang} dir={args.dir} globals={globals} />
  ),
};

const SERVER_MARKUP = `
<div data-mg-quiz-question data-mg-ssr
  data-question='{"type":"multiple_choice","prompt":"Which hazard does this image show?","options":[{"value":"amr","label":"Antimicrobial resistant microorganisms","correct":false},{"value":"hab","label":"Harmful algal blooms","correct":true},{"value":"toxins","label":"Marine toxins","correct":false}],"explanation":"Warm, nutrient-rich water lets algae multiply quickly."}'>
  <div class="mg-quiz-question mg-quiz-question--multiple-choice">
    <fieldset class="mg-form-group mg-quiz-question__group">
      <legend class="mg-form-group__legend">Which hazard does this image show?</legend>
      <div class="mg-quiz-question__media">
        <img src="${sampleImage}" alt="Aerial view of green algae spreading across a lake shore" width="640" height="360">
      </div>
      <div class="mg-quiz-question__options">
        <label class="mg-form-check mg-quiz-question__option">
          <input class="mg-form-check__input mg-form-check__input--radio" type="radio" value="amr">
          <span class="mg-form-check__label">Antimicrobial resistant microorganisms</span>
        </label>
        <label class="mg-form-check mg-quiz-question__option">
          <input class="mg-form-check__input mg-form-check__input--radio" type="radio" value="hab">
          <span class="mg-form-check__label">Harmful algal blooms</span>
        </label>
        <label class="mg-form-check mg-quiz-question__option">
          <input class="mg-form-check__input mg-form-check__input--radio" type="radio" value="toxins">
          <span class="mg-form-check__label">Marine toxins</span>
        </label>
      </div>
    </fieldset>
  </div>
</div>
<div data-mg-quiz-question data-mg-ssr
  data-question='{"type":"true_false","prompt":"A storm tide is the same thing as a tsunami.","answer":false}'>
  <div class="mg-quiz-question mg-quiz-question--true-false">
    <fieldset class="mg-form-group mg-quiz-question__group">
      <legend class="mg-form-group__legend">A storm tide is the same thing as a tsunami.</legend>
      <div class="mg-quiz-question__options">
        <label class="mg-form-check mg-quiz-question__option">
          <input class="mg-form-check__input mg-form-check__input--radio" type="radio" value="true">
          <span class="mg-form-check__label">True</span>
        </label>
        <label class="mg-form-check mg-quiz-question__option">
          <input class="mg-form-check__input mg-form-check__input--radio" type="radio" value="false">
          <span class="mg-form-check__label">False</span>
        </label>
      </div>
    </fieldset>
  </div>
</div>
<div data-mg-quiz-question data-mg-ssr
  data-question='{"type":"fill_blank","prompt":"The Sendai Framework was adopted in [1], Japan, in the year [2].","blanks":[{"label":"City","expected":["Sendai"]},{"label":"Year","expected":["2015"]}]}'>
  <div class="mg-quiz-question mg-quiz-question--fill-blank">
    <fieldset class="mg-form-group mg-quiz-question__group mg-quiz-question__group--sentence">
      <legend class="mg-form-group__legend">Complete the sentence</legend>
      <p class="mg-quiz-question__sentence">
        The Sendai Framework was adopted in
        <input class="mg-form-input mg-quiz-question__blank" type="text" aria-label="City">, Japan, in the year
        <input class="mg-form-input mg-quiz-question__blank" type="text" aria-label="Year">.
      </p>
    </fieldset>
  </div>
</div>`;

function ServerMarkup({ hydrate, lang, dir }) {
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
      dangerouslySetInnerHTML={{ __html: SERVER_MARKUP }}
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
          'The markup a server renders, before or without Mangrove’s script: a readable question with working controls and no check button, so nothing on the page is dead.',
      },
    },
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
