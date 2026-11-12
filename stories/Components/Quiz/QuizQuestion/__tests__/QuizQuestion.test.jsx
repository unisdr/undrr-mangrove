import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { QuizQuestion } from '../QuizQuestion';

const CHOICE = {
  type: 'multiple_choice',
  prompt: 'Which hazard is water-related?',
  options: [
    { value: 'flood', label: 'Flood', correct: true },
    { value: 'quake', label: 'Earthquake' },
  ],
};
const MULTI = {
  type: 'multiple_choice',
  multiple: true,
  prompt: 'Which of these hazards are water-related?',
  options: [
    { value: 'flood', label: 'Flood', correct: true },
    { value: 'surge', label: 'Storm surge', correct: true },
    { value: 'quake', label: 'Earthquake' },
  ],
};
const TEXT = {
  type: 'text',
  prompt: 'Which framework guides disaster risk reduction to 2030?',
  expected: ['Sendai Framework'],
};
const BLANKS = {
  type: 'fill_blank',
  prompt: 'Adopted in [1], Japan, in the year [2].',
  blanks: [{ label: 'City', expected: ['Sendai'] }, { expected: ['2015'] }],
};

const check = (container = document.body) =>
  fireEvent.click(
    within(container).getByRole('button', { name: 'Check answer' })
  );
const root = container => container.querySelector('.mg-quiz-question');

describe('QuizQuestion', () => {
  it('renders a single-answer question as a named radio group', () => {
    const { container } = render(<QuizQuestion {...CHOICE} />);
    expect(
      screen.getByRole('group', { name: 'Which hazard is water-related?' })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'unanswered');
    expect(root(container)).toHaveClass('mg-quiz-question--multiple-choice');
    expect(screen.getByRole('button', { name: 'Check answer' })).toHaveClass(
      'mg-button',
      'mg-button-primary'
    );
  });

  it('gives correct feedback with the explanation and reports the result', () => {
    const onCheck = jest.fn();
    const { container } = render(
      <QuizQuestion
        {...CHOICE}
        explanation="Floods are hydrological."
        onCheck={onCheck}
      />
    );
    fireEvent.click(screen.getByLabelText('Flood'));
    check();

    const feedback = container.querySelector('.mg-quiz-question__feedback');
    expect(feedback).toHaveAttribute('aria-live', 'polite');
    const notice = feedback.querySelector('.mg-notice');
    expect(notice).toHaveClass('mg-notice--positive');
    expect(notice).not.toHaveAttribute('role');
    expect(notice).toHaveTextContent('Correct');
    expect(notice).toHaveTextContent('Floods are hydrological.');
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
    expect(root(container)).toHaveClass('mg-quiz-question--correct');
    expect(
      container.querySelector('.mg-quiz-question__status')
    ).toHaveTextContent('Correct');
    expect(onCheck).toHaveBeenCalledWith({ correct: true, answer: 'flood' });
  });

  it('asks to try again without revealing the explanation, and allows a retry', () => {
    const { container } = render(
      <QuizQuestion {...CHOICE} explanation="Floods are hydrological." />
    );
    fireEvent.click(screen.getByLabelText('Earthquake'));
    check();
    expect(container.querySelector('.mg-notice')).toHaveClass(
      'mg-notice--negative'
    );
    expect(screen.getByText('Not quite. Try again.')).toBeInTheDocument();
    expect(screen.queryByText('Floods are hydrological.')).toBeNull();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'incorrect');

    fireEvent.click(screen.getByLabelText('Flood'));
    check();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
  });

  it('does not grade or count an empty attempt', () => {
    const onCheck = jest.fn();
    const { container } = render(
      <QuizQuestion {...CHOICE} onCheck={onCheck} />
    );
    check();
    expect(screen.getByText('Choose an answer first.')).toBeInTheDocument();
    expect(container.querySelector('.mg-notice')).toHaveClass(
      'mg-notice--info'
    );
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'unanswered');
    expect(onCheck).not.toHaveBeenCalled();
  });

  it('keeps an earlier result when a later attempt is empty', () => {
    const { container } = render(<QuizQuestion {...TEXT} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'sendai framework' } });
    check();
    fireEvent.change(input, { target: { value: '   ' } });
    check();
    expect(screen.getByText('Type an answer first.')).toBeInTheDocument();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
  });

  it('signposts several answers and needs the exact set', () => {
    const { container } = render(<QuizQuestion {...MULTI} />);
    const group = screen.getByRole('group');
    expect(group).toHaveAccessibleDescription('Select all that apply.');
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);

    fireEvent.click(screen.getByLabelText('Flood'));
    check();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'incorrect');
    fireEvent.click(screen.getByLabelText('Storm surge'));
    check();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
  });

  it('labels true and false from the language catalogue', () => {
    const { container } = render(
      <QuizQuestion
        type="true_false"
        prompt="مدّ العاصفة هو نفسه التسونامي."
        answer={false}
        lang="ar"
      />
    );
    expect(root(container)).toHaveAttribute('lang', 'ar');
    expect(root(container)).toHaveAttribute('dir', 'rtl');
    fireEvent.click(screen.getByLabelText('خطأ'));
    fireEvent.click(screen.getByRole('button', { name: 'تحقق من الإجابة' }));
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
    expect(screen.getAllByText('إجابة صحيحة').length).toBeGreaterThan(0);
  });

  it('labels the short-answer input with the prompt and checks on Enter', () => {
    const { container } = render(<QuizQuestion {...TEXT} />);
    const input = screen.getByRole('textbox', { name: TEXT.prompt });
    fireEvent.change(input, { target: { value: '  SENDAI   framework ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
  });

  it('honours case sensitivity for short answers', () => {
    const { container } = render(
      <QuizQuestion {...TEXT} expected={['UNDRR']} caseSensitive />
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'undrr' },
    });
    check();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'incorrect');
  });

  it('places blanks in the sentence and names each one', () => {
    const { container } = render(<QuizQuestion {...BLANKS} />);
    expect(
      screen.getByRole('group', { name: 'Complete the sentence' })
    ).toBeInTheDocument();
    const sentence = container.querySelector('.mg-quiz-question__sentence');
    expect(sentence).toHaveTextContent('Adopted in , Japan, in the year .');
    expect(sentence.textContent).not.toContain('[1]');

    const city = screen.getByRole('textbox', { name: 'City' });
    const year = screen.getByRole('textbox', { name: 'Blank 2 of 2' });
    fireEvent.change(city, { target: { value: 'sendai' } });
    check();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'incorrect');
    fireEvent.change(year, { target: { value: '2015' } });
    check();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
  });

  it('lists blanks the prompt does not refer to as labelled fields', () => {
    render(
      <QuizQuestion
        type="fill_blank"
        prompt="Name the city and the year."
        blanks={[
          { label: 'City', expected: ['Sendai'] },
          { expected: ['2015'] },
        ]}
      />
    );
    expect(
      screen.getByRole('group', { name: 'Name the city and the year.' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('City')).toBeInTheDocument();
    expect(screen.getByLabelText('Blank 2 of 2')).toBeInTheDocument();
  });

  it('gives copies of the same question independent groups and ids', () => {
    const { container } = render(
      <>
        <QuizQuestion {...CHOICE} />
        <QuizQuestion {...CHOICE} />
      </>
    );
    const [first, second] = container.querySelectorAll('.mg-quiz-question');
    const firstRadios = within(first).getAllByRole('radio');
    const secondRadios = within(second).getAllByRole('radio');
    expect(firstRadios[0].name).not.toBe(secondRadios[0].name);
    const ids = Array.from(container.querySelectorAll('[id]'), el => el.id);
    expect(new Set(ids).size).toBe(ids.length);

    fireEvent.click(firstRadios[0]);
    fireEvent.click(secondRadios[1]);
    expect(firstRadios[0]).toBeChecked();
    expect(secondRadios[1]).toBeChecked();
  });

  it('numbers questions that share a page and leaves a lone one unnumbered', () => {
    const { container, rerender } = render(<QuizQuestion {...CHOICE} />);
    expect(container.querySelector('.mg-quiz-question__number')).toBeNull();

    rerender(
      <>
        <QuizQuestion {...CHOICE} />
        <QuizQuestion {...TEXT} />
      </>
    );
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();
  });

  it('uses an explicit number and can hide numbering', () => {
    const { rerender } = render(
      <QuizQuestion {...CHOICE} number={3} total={7} />
    );
    expect(screen.getByText('Question 3 of 7')).toBeInTheDocument();
    rerender(
      <QuizQuestion {...CHOICE} number={3} total={7} showNumber={false} />
    );
    expect(screen.queryByText('Question 3 of 7')).toBeNull();
  });

  it('renders media inside the question and applies label overrides', () => {
    const { container } = render(
      <QuizQuestion
        {...CHOICE}
        media={<img src="algae.jpg" alt="Algae on a lake" />}
        labels={{ checkAnswer: 'Submit' }}
      />
    );
    expect(
      container.querySelector('.mg-quiz-question__media img')
    ).toHaveAttribute('alt', 'Algae on a lake');
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('switches labels with lang and keeps overrides', () => {
    const { rerender } = render(<QuizQuestion {...CHOICE} lang="fr" />);
    expect(
      screen.getByRole('button', { name: 'Vérifier la réponse' })
    ).toBeInTheDocument();
    rerender(
      <QuizQuestion {...CHOICE} lang="es" labels={{ checkAnswer: 'Listo' }} />
    );
    expect(screen.getByRole('button', { name: 'Listo' })).toBeInTheDocument();
  });

  it('keeps unsupported language metadata without forcing a direction', () => {
    const { container } = render(<QuizQuestion {...CHOICE} lang="he" />);
    expect(root(container)).toHaveAttribute('lang', 'he');
    expect(root(container)).not.toHaveAttribute('dir');
  });

  it.each([
    [
      'multiple choice',
      CHOICE,
      () => fireEvent.click(screen.getByLabelText('Flood')),
    ],
    [
      'multiple answers',
      MULTI,
      () => fireEvent.click(screen.getByLabelText('Flood')),
    ],
    [
      'true/false',
      { type: 'true_false', prompt: 'True?', answer: true },
      () => {},
    ],
    ['short answer', TEXT, () => {}],
    ['fill in the blank', BLANKS, () => {}],
  ])(
    'has no axe violations: %s, before and after checking',
    async (name, props, answer) => {
      const { container } = render(
        <main>
          <QuizQuestion {...props} explanation="Because." />
        </main>
      );
      expect(await axe(container)).toHaveNoViolations();
      answer();
      check();
      expect(await axe(container)).toHaveNoViolations();
    }
  );
});
