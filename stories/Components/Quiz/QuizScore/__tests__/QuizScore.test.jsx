import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import createHydrator from '../../../../../src/hydrate';
import { QuizQuestion } from '../../QuizQuestion/QuizQuestion';
import questionFromElement from '../../QuizQuestion/QuizQuestion.fromElement';
import { QuizScore } from '../QuizScore';
import scoreFromElement, {
  ensureQuizScoreHost,
} from '../QuizScore.fromElement';

const TRUE = { type: 'true_false', prompt: 'Water is wet.', answer: true };
const TEXT = {
  type: 'text',
  prompt: 'Name the framework.',
  expected: ['Sendai'],
};

const answer = (question, label) => {
  fireEvent.click(within(question).getByLabelText(label));
  fireEvent.click(
    within(question).getByRole('button', { name: 'Check answer' })
  );
};
const questions = container =>
  Array.from(container.querySelectorAll('.mg-quiz-question'));

describe('QuizScore', () => {
  it('is empty until the first answer is checked', () => {
    const { container } = render(
      <>
        <QuizQuestion {...TRUE} />
        <QuizScore />
      </>
    );
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();
    expect(container.querySelector('.mg-quiz-score')).not.toHaveClass(
      'mg-quiz-score--active'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(status).toBeEmptyDOMElement();
  });

  it('shows the running score with progress, then the final score', () => {
    const { container } = render(
      <>
        <QuizQuestion {...TRUE} />
        <QuizQuestion {...TRUE} prompt="Fire is cold." answer={false} />
        <QuizScore />
      </>
    );
    const [first, second] = questions(container);
    answer(first, 'True');
    expect(screen.getByRole('status')).toHaveTextContent(
      /^1 of 2 correct so far\.$/
    );
    const progress = screen.getByRole('progressbar', {
      name: 'Questions answered',
    });
    expect(progress).toHaveAttribute('value', '1');
    expect(progress).toHaveAttribute('max', '2');
    expect(progress).toHaveAttribute('aria-valuetext', '1 of 2');

    answer(second, 'True');
    expect(screen.getByRole('status')).toHaveTextContent(
      'You got 1 of 2 correct.'
    );
    expect(screen.queryByRole('progressbar')).toBeNull();

    answer(second, 'False');
    expect(screen.getByRole('status')).toHaveTextContent(
      'You got 2 of 2 correct.'
    );
  });

  it('starts again: clears every question and moves focus to the first', () => {
    const { container } = render(
      <>
        <QuizQuestion {...TRUE} />
        <QuizScore />
      </>
    );
    const [question] = questions(container);
    answer(question, 'True');
    fireEvent.click(screen.getByRole('button', { name: 'Start again' }));

    expect(question).toHaveAttribute('data-mg-quiz-state', 'unanswered');
    expect(within(question).getByLabelText('True')).not.toBeChecked();
    expect(question.querySelector('.mg-notice')).toBeNull();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.queryByRole('button', { name: 'Start again' })).toBeNull();
    expect(within(question).getByLabelText('True')).toHaveFocus();
  });

  it('starts again: unlocks every locked question', () => {
    const { container } = render(
      <>
        <QuizQuestion {...TRUE} />
        <QuizQuestion {...TEXT} />
        <QuizScore />
      </>
    );
    const [choice, text] = questions(container);
    answer(choice, 'True');
    const input = within(text).getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Sendai' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(within(choice).queryByRole('button')).toBeNull();
    expect(input).toHaveAttribute('readonly');

    fireEvent.click(screen.getByRole('button', { name: 'Start again' }));

    [choice, text].forEach(question => {
      expect(question).toHaveAttribute('data-mg-quiz-state', 'unanswered');
      expect(question).not.toHaveClass('mg-quiz-question--correct');
      expect(
        within(question).getByRole('button', { name: 'Check answer' })
      ).toBeInTheDocument();
    });
    expect(input).not.toHaveAttribute('readonly');
    expect(input).toHaveValue('');
    within(choice)
      .getAllByRole('radio')
      .forEach(radio => expect(radio).not.toHaveAttribute('aria-disabled'));

    // Unlocked for real: a different answer can be given and graded.
    answer(choice, 'False');
    expect(choice).toHaveAttribute('data-mg-quiz-state', 'incorrect');
  });

  it('drops a stale result from the count when the answer changes', () => {
    const { container } = render(
      <>
        <QuizQuestion {...TRUE} />
        <QuizQuestion {...TRUE} prompt="Fire is cold." answer={false} />
        <QuizScore />
      </>
    );
    const [first, second] = questions(container);
    answer(first, 'True');
    answer(second, 'True');
    expect(screen.getByRole('status')).toHaveTextContent(
      'You got 1 of 2 correct.'
    );
    fireEvent.click(within(second).getByLabelText('False'));
    expect(second).toHaveAttribute('data-mg-quiz-state', 'unanswered');
    expect(screen.getByRole('status')).toHaveTextContent(
      '1 of 2 correct so far.'
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '1');
    expect(screen.queryByRole('button', { name: 'Start again' })).toBeNull();
  });

  it('follows questions that arrive or leave later', async () => {
    // Keys keep the same QuizScore mounted while questions come and go.
    const page = list => (
      <>
        {list.map((props, index) => (
          <QuizQuestion key={index} {...props} />
        ))}
        <QuizScore key="score" />
      </>
    );
    const { container, rerender } = render(page([TRUE]));
    const status = screen.getByRole('status');
    answer(questions(container)[0], 'True');
    expect(status).toHaveTextContent('You got 1 of 1 correct.');

    rerender(page([TRUE, TEXT]));
    expect(status).toHaveTextContent('1 of 2 correct so far.');

    rerender(page([]));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByRole('status')).toBe(status);
    expect(status).toBeEmptyDOMElement();
  });

  it('counts only its own data-mg-quiz scope', () => {
    const { container } = render(
      <>
        <div data-mg-quiz="" data-testid="one">
          <QuizQuestion {...TRUE} />
          <QuizScore />
        </div>
        <div data-mg-quiz="" data-testid="two">
          <QuizQuestion {...TRUE} />
          <QuizQuestion {...TEXT} />
          <QuizScore />
        </div>
      </>
    );
    const one = screen.getByTestId('one');
    const two = screen.getByTestId('two');
    answer(questions(one)[0], 'True');
    expect(within(one).getByRole('status')).toHaveTextContent(
      'You got 1 of 1 correct.'
    );
    expect(within(two).getByRole('status')).toBeEmptyDOMElement();
    expect(within(two).getByText('Question 2 of 2')).toBeInTheDocument();
    expect(
      container.querySelectorAll('.mg-quiz-question__number')
    ).toHaveLength(2);
  });

  it('uses the longer running score only without the progress bar', () => {
    const { container } = render(
      <>
        <QuizQuestion {...TRUE} />
        <QuizQuestion {...TEXT} />
        <QuizScore
          showProgress={false}
          labels={{ scoreSoFar: 'Short {correct}/{total}' }}
        />
      </>
    );
    answer(questions(container)[0], 'True');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Score so far: 1 of 2 correct (answered: 1).'
    );
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('applies overrides to both forms of the running score', () => {
    const page = showProgress => (
      <>
        <QuizQuestion {...TRUE} />
        <QuizQuestion {...TEXT} />
        <QuizScore
          showProgress={showProgress}
          labels={{
            scoreSoFar: 'Short {correct}/{total}',
            scoreSoFarWithAnswered: 'Long {correct}/{total}/{answered}',
          }}
        />
      </>
    );
    const { container, rerender } = render(page(true));
    answer(questions(container)[0], 'True');
    expect(screen.getByRole('status')).toHaveTextContent('Short 1/2');
    rerender(page(false));
    expect(screen.getByRole('status')).toHaveTextContent('Long 1/2/1');
  });

  it('translates the score and hides optional parts', () => {
    const { container } = render(
      <>
        <QuizQuestion {...TRUE} lang="fr" />
        <QuizQuestion {...TEXT} lang="fr" />
        <QuizScore lang="fr" showProgress={false} />
      </>
    );
    fireEvent.click(within(questions(container)[0]).getByLabelText('Vrai'));
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Vérifier la réponse' })[0]
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Score actuel : 1 sur 2 (questions traitées : 1).'
    );
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(container.querySelector('.mg-quiz-score')).toHaveAttribute(
      'lang',
      'fr'
    );
  });

  it('has no axe violations in progress and when complete', async () => {
    const { container } = render(
      <main>
        <QuizQuestion {...TRUE} />
        <QuizQuestion {...TRUE} prompt="Fire is cold." answer={false} />
        <QuizScore />
      </main>
    );
    const [first, second] = questions(container);
    answer(first, 'True');
    expect(await axe(container)).toHaveNoViolations();
    answer(second, 'True');
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('quiz hydration from server-rendered markup', () => {
  const host = (question, fallback = '<p>fallback</p>') =>
    `<div data-mg-quiz-question data-mg-ssr data-question='${JSON.stringify(question)}'><div class="mg-quiz-question">${fallback}</div></div>`;

  afterEach(() => {
    document.body.innerHTML = '';
  });

  const hydrate = () => {
    let handles;
    act(() => {
      const question = createHydrator({
        selector: '[data-mg-quiz-question]',
        component: QuizQuestion,
        fromElement: questionFromElement,
      });
      ensureQuizScoreHost(document);
      const score = createHydrator({
        selector: '[data-mg-quiz-score]',
        component: QuizScore,
        fromElement: scoreFromElement,
      });
      handles = { question, score };
    });
    return handles;
  };

  it('mounts each question, adds the score after the last and grades', () => {
    document.body.innerHTML = `<main lang="es">${host(TRUE)}<p>Text</p>${host(TRUE)}<p>After</p></main>`;
    const handles = hydrate();

    const hosts = document.querySelectorAll('[data-mg-quiz-question]');
    const scoreHost = document.querySelector('[data-mg-quiz-score]');
    expect(hosts[1].nextElementSibling).toBe(scoreHost);
    expect(document.querySelectorAll('.mg-quiz-question')).toHaveLength(2);
    expect(document.body).not.toHaveTextContent('fallback');
    expect(screen.getByText('Pregunta 2 de 2')).toBeInTheDocument();

    // The same question twice: separate groups, separate answers.
    const [first, second] = questions(document.body);
    const names = [first, second].map(
      question => question.querySelector('input').name
    );
    expect(names[0]).not.toBe(names[1]);

    act(() => {
      fireEvent.click(within(first).getByLabelText('Verdadero'));
      fireEvent.click(
        within(first).getByRole('button', { name: 'Comprobar respuesta' })
      );
    });
    expect(first).toHaveAttribute('data-mg-quiz-state', 'correct');
    expect(second).toHaveAttribute('data-mg-quiz-state', 'unanswered');
    expect(screen.getByRole('status')).toHaveTextContent(
      '1 de 2 correctas hasta ahora.'
    );

    act(() => {
      handles.question.unmountAll();
      handles.score.unmountAll();
    });
  });

  it('leaves the server markup alone when the question data is unreadable', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    document.body.innerHTML =
      '<div data-mg-quiz-question data-mg-ssr data-question="{broken"><div class="mg-quiz-question"><p>fallback</p></div></div>';
    const handles = hydrate();
    expect(document.body).toHaveTextContent('fallback');
    expect(screen.queryByRole('button')).toBeNull();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
    act(() => handles.score.unmountAll());
  });

  it('keeps a consumer-rendered score where it is and moves its own', () => {
    document.body.innerHTML = `<div data-mg-quiz><div data-mg-quiz-score id="own"></div>${host(TRUE)}</div>${host(TRUE)}`;
    expect(ensureQuizScoreHost(document)).toHaveLength(1);
    const own = document.getElementById('own');
    expect(own.previousElementSibling).toBeNull();
    const auto = document.querySelector('[data-mg-quiz-score-auto]');
    expect(auto.previousElementSibling).toBe(
      document.querySelectorAll('[data-mg-quiz-question]')[1]
    );

    document.body.insertAdjacentHTML('beforeend', host(TEXT));
    expect(ensureQuizScoreHost(document)).toHaveLength(0);
    expect(document.body.lastElementChild).toBe(auto);
  });

  it('reads score options and language', () => {
    document.body.innerHTML =
      '<div lang="ja"><div data-mg-quiz-score data-show-progress="false" data-show-reset="false" data-labels=\'{"reset":"Again"}\'></div></div>';
    expect(
      scoreFromElement(document.querySelector('[data-mg-quiz-score]'))
    ).toEqual({
      lang: 'ja',
      showProgress: false,
      showReset: false,
      labels: { reset: 'Again' },
    });
  });
});
