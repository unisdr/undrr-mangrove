import {
  gradeAnswer,
  isEmptyAnswer,
  normalizeText,
  parseBlankPrompt,
  trueFalseOptions,
} from '../quizGrading';

describe('quiz grading', () => {
  it('normalizes whitespace, Unicode form and case', () => {
    expect(normalizeText('  Sendai \n  Framework ', false)).toBe(
      'sendai framework'
    );
    expect(normalizeText('Café', false)).toBe('café');
    expect(normalizeText('UNDRR', true)).toBe('UNDRR');
  });

  it('treats nothing selected or only whitespace as empty', () => {
    expect(isEmptyAnswer('')).toBe(true);
    expect(isEmptyAnswer([])).toBe(true);
    expect(isEmptyAnswer(['', '  '])).toBe(true);
    expect(isEmptyAnswer(['', 'x'])).toBe(false);
    expect(isEmptyAnswer('a')).toBe(false);
  });

  it('requires the exact correct option set for multiple choice', () => {
    const question = {
      type: 'multiple_choice',
      options: [
        { value: 'a', correct: true },
        { value: 'b', correct: true },
        { value: 'c', correct: false },
      ],
    };
    expect(gradeAnswer(question, ['b', 'a'])).toBe(true);
    expect(gradeAnswer(question, ['a'])).toBe(false);
    expect(gradeAnswer(question, ['a', 'b', 'c'])).toBe(false);
    expect(gradeAnswer({ type: 'multiple_choice', options: [] }, [])).toBe(
      false
    );
  });

  it('grades true/false from `answer` or from legacy options', () => {
    expect(gradeAnswer({ type: 'true_false', answer: false }, 'false')).toBe(
      true
    );
    expect(gradeAnswer({ type: 'true_false', answer: false }, 'true')).toBe(
      false
    );
    const legacy = {
      type: 'true_false',
      options: [
        { value: 'true', correct: false },
        { value: 'false', correct: true },
      ],
    };
    expect(trueFalseOptions(legacy)).toEqual([
      { value: 'true', correct: false },
      { value: 'false', correct: true },
    ]);
    expect(gradeAnswer(legacy, 'false')).toBe(true);
  });

  it('matches text against every accepted answer', () => {
    const question = {
      type: 'text',
      expected: ['Sendai Framework', 'Café'],
    };
    expect(gradeAnswer(question, ' sendai   FRAMEWORK ')).toBe(true);
    expect(gradeAnswer(question, 'café')).toBe(true);
    expect(gradeAnswer(question, 'Hyogo')).toBe(false);
    expect(gradeAnswer(question, '')).toBe(false);
    expect(
      gradeAnswer({ ...question, caseSensitive: true }, 'sendai framework')
    ).toBe(false);
    expect(gradeAnswer({ type: 'text', expected: 'Sendai' }, 'sendai')).toBe(
      true
    );
  });

  it('grades blanks in order, each with its own case setting', () => {
    const question = {
      type: 'fill_blank',
      blanks: [
        { expected: ['Sendai'] },
        { expected: ['UNDRR'], caseSensitive: true },
      ],
    };
    expect(gradeAnswer(question, ['sendai', 'UNDRR'])).toBe(true);
    expect(gradeAnswer(question, ['sendai', 'undrr'])).toBe(false);
    expect(gradeAnswer(question, ['UNDRR', 'Sendai'])).toBe(false);
    expect(gradeAnswer(question, ['sendai'])).toBe(false);
    expect(gradeAnswer({ type: 'fill_blank', blanks: [] }, [])).toBe(false);
  });

  it('never passes an unknown type', () => {
    expect(gradeAnswer({ type: 'essay' }, 'anything')).toBe(false);
  });

  it('splits a prompt into text and blanks', () => {
    expect(parseBlankPrompt('In [1], Japan, in [2].', 2)).toEqual({
      parts: [
        { text: 'In ' },
        { blank: 0 },
        { text: ', Japan, in ' },
        { blank: 1 },
        { text: '.' },
      ],
      inline: [0, 1],
    });
  });

  it('keeps unknown or repeated references as text', () => {
    expect(parseBlankPrompt('[1] and [1] and [3]', 2)).toEqual({
      parts: [{ blank: 0 }, { text: ' and [1] and [3]' }],
      inline: [0],
    });
    expect(parseBlankPrompt('No references', 2)).toEqual({
      parts: [{ text: 'No references' }],
      inline: [],
    });
  });
});
