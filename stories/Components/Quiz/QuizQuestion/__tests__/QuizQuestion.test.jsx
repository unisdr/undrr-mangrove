import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
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
// Questions tell the page about a change in a batch, one microtask after the
// task that made it. This waits for that batch, as a visitor always has.
const batch = () => act(async () => {});

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
    // A named group, never a second live region inside the first.
    expect(notice).toHaveAttribute('role', 'group');
    expect(notice).toHaveAccessibleName('Correct');
    expect(
      container.querySelectorAll('[aria-live], [role="status"]')
    ).toHaveLength(1);
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

  it.each([
    ['is left out', {}],
    ['is undefined', { answer: undefined }],
    ['is null', { answer: null }],
    ['is not a boolean', { answer: 'no' }],
  ])('marks neither true nor false correct when `answer` %s', (name, key) => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const onCheck = jest.fn();
    const { container } = render(
      <QuizQuestion
        type="true_false"
        prompt="A statement with no key."
        explanation="Never shown."
        onCheck={onCheck}
        {...key}
      />
    );
    ['True', 'False'].forEach(label => {
      fireEvent.click(screen.getByLabelText(label));
      check();
      expect(root(container)).toHaveAttribute(
        'data-mg-quiz-state',
        'incorrect'
      );
      expect(container).toHaveTextContent('Not correct yet. Try again.');
    });
    expect(container).not.toHaveTextContent('Never shown.');
    expect(onCheck).toHaveBeenCalledTimes(2);
    expect(onCheck).not.toHaveBeenCalledWith(
      expect.objectContaining({ correct: true })
    );
    error.mockRestore();
  });

  it('grades a true/false question with a key either way round', () => {
    const { container, unmount } = render(
      <QuizQuestion
        type="true_false"
        prompt="False statement."
        answer={false}
      />
    );
    fireEvent.click(screen.getByLabelText('True'));
    check();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'incorrect');
    fireEvent.click(screen.getByLabelText('False'));
    check();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
    unmount();
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

  // The row is Forms' option row; the quiz class only adds the locked state.
  // The server fallback prints the same classes on each option's label.
  it.each([
    ['radios', CHOICE, 2],
    ['checkboxes', MULTI, 3],
  ])('renders %s as Forms option rows', (kind, question, count) => {
    const { container } = render(<QuizQuestion {...question} />);
    const rows = container.querySelectorAll('.mg-quiz-question__option');
    expect(rows).toHaveLength(count);
    rows.forEach(row =>
      expect(row).toHaveClass(
        'mg-form-check',
        'mg-form-check--row',
        'mg-quiz-question__option',
        { exact: true }
      )
    );
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

  it('moves focus to the named result when a correct answer removes the button', () => {
    const { container } = render(
      <QuizQuestion {...CHOICE} explanation="Floods are hydrological." />
    );
    const feedback = container.querySelector('.mg-quiz-question__feedback');
    // The live region itself is never a focus target.
    expect(feedback).toHaveAttribute('aria-live', 'polite');
    expect(feedback).not.toHaveAttribute('tabindex');

    // Incorrect: the button stays and keeps focus, and the message is not
    // focusable.
    fireEvent.click(screen.getByLabelText('Earthquake'));
    const button = screen.getByRole('button', { name: 'Check answer' });
    button.focus();
    fireEvent.click(button);
    expect(button).toHaveFocus();
    expect(feedback.querySelector('.mg-notice')).not.toHaveAttribute(
      'tabindex'
    );
    expect(feedback.querySelector('.mg-notice')).not.toHaveAttribute('role');

    fireEvent.click(screen.getByLabelText('Flood'));
    button.focus();
    fireEvent.click(button);
    expect(button).not.toBeInTheDocument();
    const result = screen.getByRole('group', { name: 'Correct' });
    expect(result).toHaveFocus();
    expect(result).toHaveClass('mg-notice');
    expect(result).toHaveAttribute('tabindex', '-1');
    expect(result).not.toHaveAttribute('aria-live');
    expect(result).not.toBe(feedback);
    expect(feedback).toContainElement(result);
    expect(feedback).not.toHaveFocus();
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
    async (name, props, answerWrongly, change) => {
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
      await batch();
      onChange.mockClear();

      change();
      await batch();
      expect(root(container)).toHaveAttribute(
        'data-mg-quiz-state',
        'unanswered'
      );
      expect(root(container)).not.toHaveClass('mg-quiz-question--incorrect');
      expect(container.querySelector('.mg-notice')).toBeNull();
      // One event for the change, however many updates it took.
      expect(onChange).toHaveBeenCalledTimes(1);
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

  it('numbers questions that share a page and leaves a lone one unnumbered', async () => {
    const { container, rerender } = render(<QuizQuestion {...CHOICE} />);
    await batch();
    expect(container.querySelector('.mg-quiz-question__number')).toBeNull();

    rerender(
      <>
        <QuizQuestion {...CHOICE} />
        <QuizQuestion {...TEXT} />
      </>
    );
    await batch();
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

  it('gives every answer control a fixed analytics label that carries no answer', () => {
    const page = (
      <>
        <QuizQuestion
          type="multiple_choice"
          prompt="Pick"
          options={[
            { value: 'secret-flood', label: 'Flood label', correct: true },
            { value: 'secret-quake', label: 'Quake label' },
          ]}
        />
        <QuizQuestion {...MULTI} />
        <QuizQuestion type="true_false" prompt="True?" answer />
        <QuizQuestion {...TEXT} />
        <QuizQuestion {...BLANKS} />
        <QuizQuestion
          type="fill_blank"
          prompt="Name the city."
          blanks={[{ label: 'City', expected: ['Sendai'] }]}
        />
      </>
    );
    const { container } = render(page);
    const labelOf = element => element.getAttribute('data-vf-analytics-label');

    // What the UNDRR click tracker names: inputs, their labels and buttons.
    const tracked = Array.from(
      container.querySelectorAll('input, label, button, a, select, textarea')
    );
    expect(tracked.length).toBeGreaterThan(20);
    tracked.forEach(element => expect(labelOf(element)).toBeTruthy());
    expect(new Set(tracked.map(labelOf))).toEqual(
      new Set([
        'Quiz: Answer option',
        'Quiz: Answer field',
        'Quiz: Blank',
        'Quiz: Check answer',
      ])
    );
    container
      .querySelectorAll('input[type="radio"], input[type="checkbox"]')
      .forEach(input => {
        expect(labelOf(input)).toBe('Quiz: Answer option');
        expect(
          labelOf(container.querySelector(`label[for="${input.id}"]`))
        ).toBe('Quiz: Answer option');
      });

    // The labels are the same whatever is chosen or typed.
    const before = tracked.map(labelOf);
    fireEvent.click(screen.getByLabelText('Flood label'));
    fireEvent.change(screen.getByRole('textbox', { name: TEXT.prompt }), {
      target: { value: 'typed-secret' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Blank 2 of 2' }), {
      target: { value: 'typed-secret' },
    });
    expect(tracked.map(labelOf)).toEqual(before);
    const labels = Array.from(
      container.querySelectorAll('[data-vf-analytics-label]'),
      labelOf
    ).join('|');
    ['secret', 'Flood', 'Quake', 'typed', 'Sendai', 'true', 'false'].forEach(
      answer => expect(labels).not.toContain(answer)
    );
  });

  it('starts again when the props describe another question', () => {
    const { container, rerender } = render(
      <QuizQuestion
        type="true_false"
        prompt="First statement."
        answer
        explanation="one"
      />
    );
    fireEvent.click(screen.getByLabelText('True'));
    check();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');

    rerender(
      <QuizQuestion
        type="text"
        prompt="New question"
        expected={['z']}
        explanation="two"
      />
    );
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'unanswered');
    expect(root(container)).not.toHaveClass('mg-quiz-question--correct');
    expect(container.querySelector('.mg-notice')).toBeNull();
    expect(container).not.toHaveTextContent('two');
    const input = screen.getByRole('textbox');
    expect(input).not.toHaveAttribute('readonly');
    expect(input).toHaveValue('');
    expect(
      screen.getByRole('button', { name: 'Check answer' })
    ).toBeInTheDocument();
  });

  it('starts again when the same shape of question gets new content', () => {
    const second = {
      ...CHOICE,
      options: [
        { value: 'flood', label: 'Flood' },
        { value: 'quake', label: 'Earthquake', correct: true },
      ],
    };
    const { container, rerender } = render(<QuizQuestion {...CHOICE} />);
    fireEvent.click(screen.getByLabelText('Flood'));
    check();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
    rerender(<QuizQuestion {...second} />);
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'unanswered');
    expect(screen.getByLabelText('Flood')).not.toBeChecked();
  });

  it('keeps the answer when the same question is rendered again', () => {
    const fresh = () => ({
      ...CHOICE,
      options: CHOICE.options.map(option => ({ ...option })),
    });
    const { container, rerender } = render(
      <QuizQuestion {...fresh()} labels={{ checkAnswer: 'Check' }} />
    );
    fireEvent.click(screen.getByLabelText('Flood'));
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    // New object identities, another language, another callback: same question.
    rerender(<QuizQuestion {...fresh()} lang="fr" onCheck={() => {}} />);
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
    expect(screen.getByLabelText('Flood')).toBeChecked();
  });

  it('follows questionId, not content, when the question has an id', () => {
    const { container, rerender } = render(
      <QuizQuestion {...CHOICE} questionId="q1" />
    );
    fireEvent.click(screen.getByLabelText('Flood'));
    check();
    rerender(
      <QuizQuestion {...CHOICE} questionId="q1" prompt="Reworded prompt?" />
    );
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
    rerender(<QuizQuestion {...CHOICE} questionId="q2" />);
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'unanswered');
    expect(screen.getByLabelText('Flood')).not.toBeChecked();
  });

  it('lets an option with an empty or whitespace value be the answer', () => {
    const onCheck = jest.fn();
    const { container } = render(
      <QuizQuestion
        type="multiple_choice"
        prompt="P"
        options={[
          { value: '', label: 'None of these', correct: true },
          { value: ' ', label: 'Blank' },
          { value: 'a', label: 'A' },
        ]}
        onCheck={onCheck}
      />
    );
    fireEvent.click(screen.getByLabelText('Blank'));
    check();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'incorrect');
    expect(container).not.toHaveTextContent('Choose an answer first.');
    fireEvent.click(screen.getByLabelText('None of these'));
    expect(screen.getByLabelText('Blank')).not.toBeChecked();
    check();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
    expect(onCheck).toHaveBeenLastCalledWith({ correct: true, answer: '' });
  });

  it('grades options that share a value by position, without key warnings', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(
      <QuizQuestion
        type="multiple_choice"
        prompt="P"
        options={[
          { value: 'a', label: 'First', correct: true },
          { value: 'a', label: 'Second' },
          { value: 'b', label: 'Third' },
        ]}
      />
    );
    fireEvent.click(screen.getByLabelText('Second'));
    expect(screen.getByLabelText('Second')).toBeChecked();
    expect(screen.getByLabelText('First')).not.toBeChecked();
    check();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'incorrect');
    fireEvent.click(screen.getByLabelText('First'));
    expect(screen.getByLabelText('Second')).not.toBeChecked();
    check();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('grades several answers that share a value by position', () => {
    const { container } = render(
      <QuizQuestion
        type="multiple_choice"
        multiple
        prompt="P"
        options={[
          { value: 'a', label: 'First', correct: true },
          { value: 'a', label: 'Second' },
          { value: '', label: 'Third', correct: true },
        ]}
      />
    );
    fireEvent.click(screen.getByLabelText('First'));
    fireEvent.click(screen.getByLabelText('Second'));
    check();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'incorrect');
    fireEvent.click(screen.getByLabelText('Second'));
    fireEvent.click(screen.getByLabelText('Third'));
    check();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
  });

  it('shows each blank once and never shows a marker', () => {
    const { container } = render(
      <QuizQuestion
        type="fill_blank"
        prompt="In [1], then [1] again, [0] and [3]."
        blanks={[{ expected: ['a'] }, { expected: ['b'] }]}
      />
    );
    const sentence = container.querySelector('.mg-quiz-question__sentence');
    expect(sentence.textContent).not.toMatch(/\[\d+\]/);
    expect(sentence.querySelectorAll('input')).toHaveLength(1);
    // The blank the prompt never mentions follows the sentence.
    const below = container.querySelectorAll('.mg-quiz-question__fields input');
    expect(below).toHaveLength(1);
    expect(below[0]).toHaveAccessibleName('Blank 2 of 2');

    fireEvent.change(screen.getByRole('textbox', { name: 'Blank 1 of 2' }), {
      target: { value: 'a' },
    });
    fireEvent.change(below[0], { target: { value: 'b' } });
    check();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'correct');
  });

  it('offers no check button for a question with nothing to answer', () => {
    const { container } = render(
      <>
        <QuizQuestion type="fill_blank" prompt="No blanks [1]." blanks={[]} />
        <QuizQuestion type="multiple_choice" prompt="No options" options={[]} />
        <QuizQuestion {...CHOICE} />
      </>
    );
    const [noBlanks, noOptions, real] =
      container.querySelectorAll('.mg-quiz-question');
    [noBlanks, noOptions].forEach(question => {
      expect(within(question).queryByRole('button')).toBeNull();
      // No state, so it is not numbered and the score does not wait for it.
      expect(question).not.toHaveAttribute('data-mg-quiz-state');
      expect(question.querySelector('.mg-quiz-question__number')).toBeNull();
    });
    expect(noBlanks).toHaveTextContent('No blanks .');
    expect(noBlanks.textContent).not.toContain('[1]');
    expect(real).toHaveAttribute('data-mg-quiz-state', 'unanswered');
    expect(real.querySelector('.mg-quiz-question__number')).toBeNull();
    expect(
      within(real).getByRole('button', { name: 'Check answer' })
    ).toHaveClass('mg-button-primary');
  });

  it('does not let a consumer prop replace the published state', () => {
    const { container } = render(
      <QuizQuestion
        {...CHOICE}
        data-mg-quiz-state="correct"
        data-testid="kept"
      />
    );
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'unanswered');
    expect(root(container)).toHaveAttribute('data-testid', 'kept');
  });

  it('keeps a built-in label when an override is not usable text', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <QuizQuestion
        type="true_false"
        prompt="True?"
        answer
        labels={{ checkAnswer: null, trueLabel: { a: 1 }, falseLabel: '' }}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Check answer' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('True')).toBeInTheDocument();
    expect(screen.getByLabelText('False')).toBeInTheDocument();
    error.mockRestore();
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

const showAnswerButton = () =>
  screen.queryByRole('button', { name: 'Show answer' });
const answerWrongly = label => {
  fireEvent.click(screen.getByLabelText(label));
  check();
};

describe('QuizQuestion hint', () => {
  it('shows the hint only with the feedback of an incorrect attempt', () => {
    const { container } = render(
      <QuizQuestion
        {...CHOICE}
        hint={'Think about rivers.\nAnd rain.'}
        explanation="Floods are hydrological."
      />
    );
    expect(screen.queryByText(/Think about rivers/)).toBeNull();

    // An empty attempt is not an incorrect one.
    check();
    expect(screen.getByText('Choose an answer first.')).toBeInTheDocument();
    expect(screen.queryByText(/Think about rivers/)).toBeNull();

    answerWrongly('Earthquake');
    const hint = screen.getByText(/Think about rivers/);
    expect(hint).toHaveClass('mg-quiz-question__feedback-hint');
    // Line breaks are kept in the text; the stylesheet shows them.
    expect(hint.textContent).toBe('Think about rivers.\nAnd rain.');
    // One live region holds the message and the hint.
    const feedback = container.querySelector('.mg-quiz-question__feedback');
    expect(feedback).toContainElement(hint);
    expect(feedback).toContainElement(
      screen.getByText('Not correct yet. Try again.')
    );
    expect(container.querySelectorAll('[aria-live], [role="status"]')).toEqual(
      expect.objectContaining({ length: 1 })
    );
    expect(feedback.querySelector('.mg-notice')).toHaveClass('mg-notice--info');
    expect(screen.queryByText('Floods are hydrological.')).toBeNull();

    // Changing the answer clears the feedback and the hint with it.
    fireEvent.click(screen.getByLabelText('Flood'));
    expect(screen.queryByText(/Think about rivers/)).toBeNull();
    check();
    expect(screen.queryByText(/Think about rivers/)).toBeNull();
    expect(screen.getByText('Floods are hydrological.')).toBeInTheDocument();
  });

  it.each([[undefined], [''], ['   '], [42], [{ text: 'no' }]])(
    'adds nothing to the feedback for the hint %p',
    hint => {
      const { container } = render(<QuizQuestion {...CHOICE} hint={hint} />);
      answerWrongly('Earthquake');
      expect(
        container.querySelector('.mg-quiz-question__feedback-hint')
      ).toBeNull();
      expect(container.querySelector('.mg-notice__content')).toBeNull();
    }
  );
});

describe('QuizQuestion show answer', () => {
  it('offers no button by default, whatever the attempt', () => {
    render(<QuizQuestion {...CHOICE} />);
    expect(showAnswerButton()).toBeNull();
    answerWrongly('Earthquake');
    expect(showAnswerButton()).toBeNull();
  });

  it('offers the button only after the first incorrect attempt', () => {
    render(<QuizQuestion {...CHOICE} showAnswer />);
    expect(showAnswerButton()).toBeNull();
    // An empty attempt does not earn it.
    check();
    expect(showAnswerButton()).toBeNull();

    answerWrongly('Earthquake');
    const button = showAnswerButton();
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute(
      'data-vf-analytics-label',
      'Quiz: Show answer'
    );
    expect(button.closest('.mg-quiz-question__actions')).toContainElement(
      screen.getByRole('button', { name: 'Check answer' })
    );
    // After "Check answer" in the source, so it follows it in the tab order.
    expect(
      Array.from(
        button.closest('.mg-quiz-question__actions').querySelectorAll('button'),
        item => item.textContent
      )
    ).toEqual(['Check answer', 'Show answer']);
  });

  it('keeps the button once earned, while the answer is edited', () => {
    const { container } = render(<QuizQuestion {...CHOICE} showAnswer />);
    answerWrongly('Earthquake');
    fireEvent.click(screen.getByLabelText('Flood'));
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'unanswered');
    expect(container.querySelector('.mg-notice')).toBeNull();
    expect(showAnswerButton()).toBeInTheDocument();
  });

  it('removes the button when the question is then answered correctly', () => {
    render(<QuizQuestion {...CHOICE} showAnswer />);
    answerWrongly('Earthquake');
    fireEvent.click(screen.getByLabelText('Flood'));
    check();
    expect(showAnswerButton()).toBeNull();
    expect(screen.getByText('Correct')).toBeInTheDocument();
  });

  it('is one step quieter than the check button in both cases', () => {
    const { unmount } = render(<QuizQuestion {...CHOICE} showAnswer />);
    answerWrongly('Earthquake');
    expect(screen.getByRole('button', { name: 'Check answer' })).toHaveClass(
      'mg-button-primary'
    );
    expect(showAnswerButton()).toHaveClass(
      'mg-button',
      'mg-button-secondary',
      'mg-button-outline',
      'mg-quiz-question__reveal'
    );
    expect(showAnswerButton()).not.toHaveClass(
      'mg-quiz-question__reveal--quiet'
    );
    unmount();

    render(<QuizQuestion {...CHOICE} showAnswer number={2} total={5} />);
    answerWrongly('Earthquake');
    expect(screen.getByRole('button', { name: 'Check answer' })).toHaveClass(
      'mg-button-outline'
    );
    expect(showAnswerButton()).toHaveClass(
      'mg-button',
      'mg-button-secondary',
      'mg-button-outline',
      'mg-quiz-question__reveal',
      'mg-quiz-question__reveal--quiet'
    );
    expect(showAnswerButton()).not.toHaveClass('mg-button-primary');
  });

  it('reveals a choice question: the right option replaces the wrong one', () => {
    const onCheck = jest.fn();
    const onReveal = jest.fn();
    const { container } = render(
      <QuizQuestion
        {...CHOICE}
        showAnswer
        hint="Think about rivers."
        explanation="Floods are hydrological."
        questionId="hazards-1"
        onCheck={onCheck}
        onReveal={onReveal}
      />
    );
    answerWrongly('Earthquake');
    expect(onCheck).toHaveBeenCalledTimes(1);
    fireEvent.click(showAnswerButton());

    expect(screen.getByLabelText('Flood')).toBeChecked();
    expect(screen.getByLabelText('Earthquake')).not.toBeChecked();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'revealed');
    expect(root(container)).toHaveClass('mg-quiz-question--revealed');
    expect(root(container)).not.toHaveClass('mg-quiz-question--correct');

    // Neutral feedback with the explanation, and no hint.
    const notice = container.querySelector('.mg-notice');
    expect(notice).toHaveClass('mg-notice--info');
    expect(notice).not.toHaveClass('mg-notice--positive');
    expect(screen.getByText('Here is the answer.')).toBeInTheDocument();
    expect(screen.queryByText('Correct')).toBeNull();
    expect(screen.getByText('Floods are hydrological.')).toBeInTheDocument();
    expect(screen.queryByText('Think about rivers.')).toBeNull();
    expect(container.querySelectorAll('.mg-notice')).toHaveLength(1);
    expect(container.querySelectorAll('[aria-live], [role="status"]')).toEqual(
      expect.objectContaining({ length: 1 })
    );

    // Locked as a correct answer locks: read-only, both buttons removed.
    expect(screen.queryByRole('button')).toBeNull();
    screen
      .getAllByRole('radio')
      .forEach(radio => expect(radio).toHaveAttribute('aria-disabled', 'true'));
    fireEvent.click(screen.getByLabelText('Earthquake'));
    expect(screen.getByLabelText('Flood')).toBeChecked();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'revealed');

    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(onReveal).toHaveBeenCalledWith({ questionId: 'hazards-1' });
    expect(onCheck).toHaveBeenCalledTimes(1);
  });

  it('calls onReveal with an empty payload when the question has no id', () => {
    const onReveal = jest.fn();
    render(<QuizQuestion {...CHOICE} showAnswer onReveal={onReveal} />);
    answerWrongly('Earthquake');
    fireEvent.click(showAnswerButton());
    expect(onReveal).toHaveBeenCalledWith({});
  });

  it('reveals every correct option of a multiple-answer question', () => {
    render(<QuizQuestion {...MULTI} showAnswer />);
    fireEvent.click(screen.getByLabelText('Flood'));
    fireEvent.click(screen.getByLabelText('Earthquake'));
    check();
    fireEvent.click(showAnswerButton());
    expect(screen.getByLabelText('Flood')).toBeChecked();
    expect(screen.getByLabelText('Storm surge')).toBeChecked();
    expect(screen.getByLabelText('Earthquake')).not.toBeChecked();
    screen
      .getAllByRole('checkbox')
      .forEach(box => expect(box).toHaveAttribute('aria-disabled', 'true'));
  });

  it('reveals a true/false question', () => {
    render(
      <QuizQuestion
        type="true_false"
        prompt="True?"
        answer={false}
        showAnswer
      />
    );
    answerWrongly('True');
    fireEvent.click(showAnswerButton());
    expect(screen.getByLabelText('False')).toBeChecked();
    expect(screen.getByLabelText('True')).not.toBeChecked();
  });

  it('reveals a short answer as its first accepted answer', () => {
    const { container } = render(
      <QuizQuestion
        {...TEXT}
        expected={['  ', 'Sendai Framework', 'Sendai']}
        showAnswer
      />
    );
    const field = screen.getByRole('textbox');
    fireEvent.change(field, { target: { value: 'Hyogo' } });
    check();
    fireEvent.click(showAnswerButton());
    expect(field).toHaveValue('Sendai Framework');
    expect(field).toHaveAttribute('readonly');
    fireEvent.change(field, { target: { value: 'changed' } });
    expect(field).toHaveValue('Sendai Framework');
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'revealed');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('reveals each blank as its first accepted answer', () => {
    const { container } = render(
      <QuizQuestion
        type="fill_blank"
        prompt="Adopted in [1], Japan, in [2]. Third:"
        blanks={[
          { label: 'City', expected: ['Sendai', 'Sendai City'] },
          { label: 'Year', expected: ['2015'] },
          { label: 'Country', expected: ['Japan'] },
        ]}
        showAnswer
      />
    );
    fireEvent.change(screen.getByLabelText('City'), {
      target: { value: 'Kobe' },
    });
    check();
    fireEvent.click(showAnswerButton());
    expect(screen.getByLabelText('City')).toHaveValue('Sendai');
    expect(screen.getByLabelText('Year')).toHaveValue('2015');
    // A blank listed under the sentence is filled in too.
    expect(screen.getByLabelText('Country')).toHaveValue('Japan');
    screen
      .getAllByRole('textbox')
      .forEach(input => expect(input).toHaveAttribute('readonly'));
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'revealed');
  });

  it.each([
    [
      'a choice question with no option flagged',
      {
        ...CHOICE,
        options: [
          { value: 'a', label: 'Flood' },
          { value: 'b', label: 'Earthquake' },
        ],
      },
      () => fireEvent.click(screen.getByLabelText('Earthquake')),
    ],
    [
      'a single-answer question with two options flagged',
      {
        ...CHOICE,
        options: [
          { value: 'a', label: 'Flood', correct: true },
          { value: 'b', label: 'Earthquake', correct: true },
        ],
      },
      () => fireEvent.click(screen.getByLabelText('Earthquake')),
    ],
    [
      'a true/false question with no answer',
      { type: 'true_false', prompt: 'True?' },
      () => fireEvent.click(screen.getByLabelText('True')),
    ],
    [
      'a short answer with no accepted answer',
      { ...TEXT, expected: ['', '  '] },
      () =>
        fireEvent.change(screen.getByRole('textbox'), {
          target: { value: 'x' },
        }),
    ],
    [
      'a blank with no accepted answer',
      {
        ...BLANKS,
        blanks: [{ label: 'City', expected: ['Sendai'] }, { expected: [] }],
      },
      () =>
        fireEvent.change(screen.getByLabelText('City'), {
          target: { value: 'x' },
        }),
    ],
  ])('never offers the button for %s', (name, props, answer) => {
    const { container } = render(<QuizQuestion {...props} showAnswer />);
    answer();
    check();
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'incorrect');
    expect(showAnswerButton()).toBeNull();
  });

  it('ignores a showAnswer value that is not the boolean true', () => {
    render(<QuizQuestion {...CHOICE} showAnswer="true" />);
    answerWrongly('Earthquake');
    expect(showAnswerButton()).toBeNull();
  });

  it('moves focus to the named result, in the one live region', () => {
    const { container } = render(
      <QuizQuestion {...CHOICE} showAnswer explanation="Because." />
    );
    answerWrongly('Earthquake');
    const button = showAnswerButton();
    button.focus();
    fireEvent.click(button);
    expect(button).not.toBeInTheDocument();
    const feedback = container.querySelector('.mg-quiz-question__feedback');
    const result = screen.getByRole('group', { name: 'Here is the answer.' });
    expect(result).toHaveFocus();
    expect(result).toHaveClass('mg-notice');
    expect(result).toHaveAttribute('tabindex', '-1');
    expect(result).not.toHaveAttribute('aria-live');
    expect(feedback).toContainElement(result);
    expect(feedback).not.toHaveFocus();
    expect(document.body).not.toHaveFocus();
  });

  it('starts again when the props describe another question', () => {
    const { container, rerender } = render(
      <QuizQuestion {...CHOICE} showAnswer />
    );
    answerWrongly('Earthquake');
    fireEvent.click(showAnswerButton());
    rerender(<QuizQuestion {...MULTI} showAnswer />);
    expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'unanswered');
    expect(root(container)).not.toHaveClass('mg-quiz-question--revealed');
    expect(showAnswerButton()).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Check answer' })
    ).toBeInTheDocument();
  });

  it('translates the button and the message, and takes overrides', () => {
    const { unmount } = render(
      <QuizQuestion {...CHOICE} showAnswer lang="fr" />
    );
    fireEvent.click(screen.getByLabelText('Earthquake'));
    fireEvent.click(
      screen.getByRole('button', { name: 'Vérifier la réponse' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Afficher la réponse' })
    );
    expect(screen.getByText('Voici la réponse.')).toBeInTheDocument();
    unmount();

    render(
      <QuizQuestion
        {...CHOICE}
        showAnswer
        labels={{ showAnswer: 'Reveal', revealedMessage: 'Answer shown.' }}
      />
    );
    answerWrongly('Earthquake');
    fireEvent.click(screen.getByRole('button', { name: 'Reveal' }));
    expect(
      screen.getByRole('group', { name: 'Answer shown.' })
    ).toBeInTheDocument();
  });

  it.each([
    ['multiple choice', CHOICE, () => answerWrongly('Earthquake')],
    ['multiple answers', MULTI, () => answerWrongly('Earthquake')],
    [
      'short answer',
      TEXT,
      () => {
        fireEvent.change(screen.getByRole('textbox'), {
          target: { value: 'x' },
        });
        check();
      },
    ],
    [
      'fill in the blank',
      BLANKS,
      () => {
        fireEvent.change(screen.getByLabelText('City'), {
          target: { value: 'x' },
        });
        check();
      },
    ],
  ])(
    'has no axe violations: %s with a hint, the button and the revealed answer',
    async (name, props, answerIncorrectly) => {
      const { container } = render(
        <main>
          <QuizQuestion
            {...props}
            showAnswer
            hint="A hint."
            explanation="Because."
          />
        </main>
      );
      answerIncorrectly();
      expect(screen.getByText('A hint.')).toBeInTheDocument();
      expect(showAnswerButton()).toBeInTheDocument();
      expect(await axe(container)).toHaveNoViolations();
      fireEvent.click(showAnswerButton());
      expect(root(container)).toHaveAttribute('data-mg-quiz-state', 'revealed');
      expect(await axe(container)).toHaveNoViolations();
    }
  );
});
