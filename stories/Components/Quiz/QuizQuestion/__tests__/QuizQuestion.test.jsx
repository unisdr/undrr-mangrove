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

  it('steps the check button back to an outline on a page of questions', () => {
    const { rerender } = render(
      <QuizQuestion {...CHOICE} number={2} total={5} />
    );
    const button = () => screen.getByRole('button', { name: 'Check answer' });
    expect(button()).toHaveClass(
      'mg-button',
      'mg-button-secondary',
      'mg-button-outline'
    );
    expect(button()).not.toHaveClass('mg-button-primary');

    rerender(
      <QuizQuestion {...CHOICE} number={2} total={5} showNumber={false} />
    );
    expect(button()).toHaveClass('mg-button-outline');

    rerender(<QuizQuestion {...CHOICE} number={1} total={1} />);
    expect(button()).toHaveClass('mg-button-primary');
    expect(button()).not.toHaveClass('mg-button-outline');
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
    // The Notice is the only statement of the result.
    expect(container.querySelector('.mg-quiz-question__status')).toBeNull();
    expect(screen.getAllByText('Correct')).toHaveLength(1);
    expect(onCheck).toHaveBeenCalledWith({ correct: true, answer: 'flood' });
  });

  it('reflects an optional question id on the root and in onCheck', () => {
    const onCheck = jest.fn();
    const { container } = render(
      <>
        <QuizQuestion {...CHOICE} questionId="hazards-1" onCheck={onCheck} />
        <QuizQuestion {...CHOICE} questionId="hazards-1" />
      </>
    );
    const [first, second] = container.querySelectorAll('.mg-quiz-question');
    expect(first).toHaveAttribute('data-mg-quiz-id', 'hazards-1');
    expect(second).toHaveAttribute('data-mg-quiz-id', 'hazards-1');

    // The id is not used for DOM ids or radio names, so two copies of one
    // question stay independent.
    const ids = Array.from(container.querySelectorAll('[id]'), el => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.some(id => id.includes('hazards-1'))).toBe(false);
    const name = scope => scope.querySelector('input').getAttribute('name');
    expect(name(first)).not.toBe(name(second));
    expect(name(first)).not.toContain('hazards-1');

    fireEvent.click(within(first).getByLabelText('Flood'));
    check(first);
    expect(onCheck).toHaveBeenCalledWith({
      correct: true,
      answer: 'flood',
      questionId: 'hazards-1',
    });
    expect(second).toHaveAttribute('data-mg-quiz-state', 'unanswered');
  });

  it('leaves the id attribute and payload field out when no id is given', () => {
    const onCheck = jest.fn();
    const { container } = render(
      <QuizQuestion {...CHOICE} onCheck={onCheck} />
    );
    expect(root(container)).not.toHaveAttribute('data-mg-quiz-id');
    fireEvent.click(screen.getByLabelText('Earthquake'));
    check();
    expect(onCheck.mock.calls[0][0]).toStrictEqual({
      correct: false,
      answer: 'quake',
    });
  });

  it('marks every answer incorrect when a question has no usable key', () => {
    const onCheck = jest.fn();
    const { container } = render(
      <>
        <QuizQuestion
          type="multiple_choice"
          prompt="Which hazard is water-related?"
          options={[
            { value: 'flood', label: 'Flood' },
            { value: 'quake', label: 'Earthquake' },
          ]}
          explanation="Never shown."
          onCheck={onCheck}
        />
        <QuizQuestion type="text" prompt="Which framework?" />
        <QuizQuestion
          type="fill_blank"
          prompt="Adopted in [1]."
          blanks={[{ label: 'City' }]}
        />
      </>
    );
    const [choice, text, blank] =
      container.querySelectorAll('.mg-quiz-question');

    fireEvent.click(within(choice).getByLabelText('Flood'));
    check(choice);
    fireEvent.change(within(text).getByRole('textbox'), {
      target: { value: 'Sendai Framework' },
    });
    check(text);
    fireEvent.change(within(blank).getByRole('textbox'), {
      target: { value: 'Sendai' },
    });
    check(blank);

    [choice, text, blank].forEach(question => {
      expect(question).toHaveAttribute('data-mg-quiz-state', 'incorrect');
      expect(question).toHaveTextContent('Not correct yet. Try again.');
      expect(
        within(question).getByRole('button', { name: 'Check answer' })
      ).toBeInTheDocument();
    });
    expect(container).not.toHaveTextContent('Never shown.');
    expect(onCheck).toHaveBeenCalledWith({ correct: false, answer: 'flood' });
  });

  it('treats a true/false question with no key as true', () => {
    const { container } = render(
      <QuizQuestion type="true_false" prompt="A statement with no key." />
    );
    fireEvent.click(screen.getByLabelText('True'));
    check();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
  });

  it('asks to try again without revealing the explanation, and allows a retry', () => {
    const { container } = render(
      <QuizQuestion {...CHOICE} explanation="Floods are hydrological." />
    );
    fireEvent.click(screen.getByLabelText('Earthquake'));
    check();
    const notice = container.querySelector('.mg-notice');
    expect(notice).toHaveClass('mg-notice--info');
    expect(notice).not.toHaveAttribute('role');
    expect(screen.getByText('Not correct yet. Try again.')).toBeInTheDocument();
    expect(screen.queryByText('Floods are hydrological.')).toBeNull();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'incorrect');
    expect(container.querySelector('.mg-quiz-question__status')).toBeNull();

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

  it('words an incorrect result and an empty attempt differently', () => {
    render(<QuizQuestion {...CHOICE} />);
    check();
    const empty = screen.getByText('Choose an answer first.');
    fireEvent.click(screen.getByLabelText('Earthquake'));
    check();
    expect(empty).not.toBeInTheDocument();
    expect(screen.getByText('Not correct yet. Try again.')).toBeInTheDocument();
  });

  it('locks a correct choice question and removes the check button', () => {
    const onCheck = jest.fn();
    const { container } = render(
      <QuizQuestion {...CHOICE} explanation="Because." onCheck={onCheck} />
    );
    const flood = screen.getByLabelText('Flood');
    const quake = screen.getByLabelText('Earthquake');
    expect(flood).not.toHaveAttribute('aria-disabled');
    fireEvent.click(flood);
    check();

    expect(screen.queryByRole('button', { name: 'Check answer' })).toBeNull();
    expect(container.querySelector('.mg-quiz-question__actions')).toBeNull();
    // Read-only, not disabled: still focusable, still fully legible.
    [flood, quake].forEach(input => {
      expect(input).toHaveAttribute('aria-disabled', 'true');
      expect(input).not.toBeDisabled();
    });

    fireEvent.click(quake);
    expect(flood).toBeChecked();
    expect(quake).not.toBeChecked();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
    expect(screen.getByText('Because.')).toBeInTheDocument();
    expect(onCheck).toHaveBeenCalledTimes(1);
  });

  it('locks a correct multiple-answer question', () => {
    const { container } = render(<QuizQuestion {...MULTI} />);
    fireEvent.click(screen.getByLabelText('Flood'));
    fireEvent.click(screen.getByLabelText('Storm surge'));
    check();
    fireEvent.click(screen.getByLabelText('Earthquake'));
    fireEvent.click(screen.getByLabelText('Flood'));
    expect(screen.getByLabelText('Earthquake')).not.toBeChecked();
    expect(screen.getByLabelText('Flood')).toBeChecked();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
  });

  it('locks correct text answers as read-only fields', () => {
    const { container } = render(
      <>
        <QuizQuestion {...TEXT} />
        <QuizQuestion {...BLANKS} />
      </>
    );
    const [text, blanks] = container.querySelectorAll('.mg-quiz-question');
    const answer = within(text).getByRole('textbox');
    fireEvent.change(answer, { target: { value: 'sendai framework' } });
    fireEvent.keyDown(answer, { key: 'Enter' });
    expect(answer).toHaveAttribute('readonly');
    expect(answer).not.toBeDisabled();
    expect(answer).toHaveValue('sendai framework');
    fireEvent.change(answer, { target: { value: 'other' } });
    fireEvent.keyDown(answer, { key: 'Enter' });
    expect(answer).toHaveValue('sendai framework');
    expect(text).toHaveAttribute('data-mg-quiz-state', 'correct');
    expect(within(text).queryByRole('button')).toBeNull();

    const [city, year] = within(blanks).getAllByRole('textbox');
    fireEvent.change(city, { target: { value: 'Sendai' } });
    fireEvent.change(year, { target: { value: '2015' } });
    check(blanks);
    expect(city).toHaveAttribute('readonly');
    expect(year).toHaveAttribute('readonly');
    fireEvent.change(year, { target: { value: '1999' } });
    expect(year).toHaveValue('2015');
    expect(blanks).toHaveAttribute('data-mg-quiz-state', 'correct');
  });

  it('moves focus to the feedback when a correct answer removes the button', () => {
    const { container } = render(<QuizQuestion {...CHOICE} />);
    const feedback = container.querySelector('.mg-quiz-question__feedback');
    expect(feedback).toHaveAttribute('tabindex', '-1');

    // Incorrect: the button stays and keeps focus.
    fireEvent.click(screen.getByLabelText('Earthquake'));
    const button = screen.getByRole('button', { name: 'Check answer' });
    button.focus();
    fireEvent.click(button);
    expect(button).toHaveFocus();

    fireEvent.click(screen.getByLabelText('Flood'));
    button.focus();
    fireEvent.click(button);
    expect(button).not.toBeInTheDocument();
    expect(feedback).toHaveFocus();
    expect(document.body).not.toHaveFocus();
  });

  it('leaves focus in the field when Enter gives a correct answer', () => {
    const { container } = render(<QuizQuestion {...TEXT} />);
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.change(input, { target: { value: 'Sendai Framework' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
    expect(input).toHaveFocus();
  });

  it.each([
    [
      'a choice',
      CHOICE,
      () => fireEvent.click(screen.getByLabelText('Earthquake')),
      () => fireEvent.click(screen.getByLabelText('Flood')),
    ],
    [
      'several choices',
      MULTI,
      () => fireEvent.click(screen.getByLabelText('Flood')),
      () => fireEvent.click(screen.getByLabelText('Earthquake')),
    ],
    [
      'a short answer',
      TEXT,
      () =>
        fireEvent.change(screen.getByRole('textbox'), {
          target: { value: 'Hyogo' },
        }),
      () =>
        fireEvent.change(screen.getByRole('textbox'), {
          target: { value: 'Hyogo F' },
        }),
    ],
    [
      'a blank',
      BLANKS,
      () =>
        fireEvent.change(screen.getByRole('textbox', { name: 'City' }), {
          target: { value: 'Tokyo' },
        }),
      () =>
        fireEvent.change(screen.getByRole('textbox', { name: 'City' }), {
          target: { value: 'Tokyo!' },
        }),
    ],
  ])(
    'returns to unanswered when %s changes after an incorrect result',
    (name, props, answerWrongly, change) => {
      const { container } = render(<QuizQuestion {...props} />);
      const onChange = jest.fn();
      document.addEventListener('mg-quiz:change', onChange);
      answerWrongly();
      check();
      expect(root(container)).toHaveAttribute(
        'data-mg-quiz-state',
        'incorrect'
      );
      expect(container.querySelector('.mg-notice')).not.toBeNull();
      onChange.mockClear();

      change();
      expect(root(container)).toHaveAttribute(
        'data-mg-quiz-state',
        'unanswered'
      );
      expect(root(container)).not.toHaveClass('mg-quiz-question--incorrect');
      expect(container.querySelector('.mg-notice')).toBeNull();
      expect(onChange).toHaveBeenCalled();
      expect(
        screen.getByRole('button', { name: 'Check answer' })
      ).toBeInTheDocument();
      document.removeEventListener('mg-quiz:change', onChange);
    }
  );

  it('clears the empty-attempt message when an answer is given', () => {
    const { container } = render(<QuizQuestion {...TEXT} />);
    check();
    expect(screen.getByText('Type an answer first.')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'S' } });
    expect(container.querySelector('.mg-notice')).toBeNull();
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
    fireEvent.click(screen.getByRole('button', { name: 'التحقق من الإجابة' }));
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
    expect(screen.getByText('إجابة صحيحة')).toBeInTheDocument();
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
    // A blank and the punctuation after it wrap as one unit.
    const units = sentence.querySelectorAll('.mg-quiz-question__blank-unit');
    expect(units).toHaveLength(2);
    expect(units[0]).toHaveTextContent(/^,$/);
    expect(units[1]).toHaveTextContent(/^\.$/);
    expect(units[0].querySelector('input')).toHaveAccessibleName('City');

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
