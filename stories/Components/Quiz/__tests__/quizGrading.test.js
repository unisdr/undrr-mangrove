import {
  firstAcceptedAnswer,
  gradeAnswer,
  isEmptyAnswer,
  normalizeText,
  parseBlankPrompt,
  parseTrueFalse,
  trueFalseKey,
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

  it('folds width and presentation forms and drops zero-width characters', () => {
    const question = { type: 'text', expected: ['2015', 'Sendai'] };
    // Full-width digits and letters, as typed with a Japanese or Chinese IME.
    expect(gradeAnswer(question, '\uFF12\uFF10\uFF11\uFF15')).toBe(true);
    expect(gradeAnswer(question, '\uFF33\uFF45\uFF4E\uFF44\uFF41\uFF49')).toBe(
      true
    );
    // Ideographic spaces around the answer, and a pasted zero-width space.
    expect(gradeAnswer(question, '\u30002015\u3000')).toBe(true);
    expect(gradeAnswer(question, '20\u200B15\uFEFF')).toBe(true);
    expect(gradeAnswer(question, '\u200B')).toBe(false);
    // Composed and decomposed accents still match each other.
    expect(
      gradeAnswer({ type: 'text', expected: ['caf\u00E9'] }, 'cafe\u0301')
    ).toBe(true);
    // The full-width form is folded in the key as well.
    expect(
      gradeAnswer({ type: 'text', expected: ['\uFF12\uFF10'] }, '20')
    ).toBe(true);
  });

  it('documents the limits of case folding', () => {
    const question = { type: 'text', expected: ['Stra\u00DFe', 'istanbul'] };
    expect(gradeAnswer(question, 'STRASSE')).toBe(false);
    expect(gradeAnswer(question, '\u0130stanbul')).toBe(false);
    expect(
      gradeAnswer(
        { type: 'text', expected: ['2015'] },
        '\u0662\u0660\u0661\u0665'
      )
    ).toBe(false);
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

  it('reads a true/false key from booleans and the two words only', () => {
    expect(parseTrueFalse(true)).toBe(true);
    expect(parseTrueFalse(false)).toBe(false);
    expect(parseTrueFalse('true')).toBe(true);
    expect(parseTrueFalse('FALSE')).toBe(false);
    expect(parseTrueFalse('False')).toBe(false);
    [
      0,
      1,
      '0',
      '1',
      'no',
      'yes',
      '',
      ' false',
      null,
      undefined,
      {},
      [],
    ].forEach(value => expect(parseTrueFalse(value)).toBeNull());
  });

  it.each([
    ['no answer at all', {}],
    ['null', { answer: null }],
    ['zero', { answer: 0 }],
    ['one', { answer: 1 }],
    ['"0"', { answer: '0' }],
    ['"no"', { answer: 'no' }],
    ['an empty string', { answer: '' }],
    ['an object', { answer: { value: false } }],
    ['legacy options with no flag', { options: [{ value: 'true' }] }],
    [
      'legacy options with both flagged',
      {
        options: [
          { value: 'true', correct: true },
          { value: 'false', correct: true },
        ],
      },
    ],
    [
      'legacy options with other values',
      {
        options: [
          { value: '1', correct: false },
          { value: '0', correct: true },
        ],
      },
    ],
    ['legacy options that are not objects', { options: [null, 'false'] }],
  ])('marks nothing correct for a true/false key of %s', (name, key) => {
    const question = { type: 'true_false', ...key };
    expect(trueFalseKey(question)).toBeNull();
    expect(trueFalseOptions(question)).toEqual([
      { value: 'true', correct: false },
      { value: 'false', correct: false },
    ]);
    expect(gradeAnswer(question, 'true')).toBe(false);
    expect(gradeAnswer(question, 'false')).toBe(false);
  });

  it('accepts the words in any case, in `answer` and in legacy options', () => {
    expect(gradeAnswer({ type: 'true_false', answer: 'false' }, 'false')).toBe(
      true
    );
    expect(gradeAnswer({ type: 'true_false', answer: 'False' }, 'true')).toBe(
      false
    );
    expect(gradeAnswer({ type: 'true_false', answer: 'TRUE' }, 'true')).toBe(
      true
    );
    const capitalized = {
      type: 'true_false',
      options: [
        { value: 'True', correct: false },
        { value: 'False', correct: true },
      ],
    };
    expect(trueFalseKey(capitalized)).toBe(false);
    expect(gradeAnswer(capitalized, 'false')).toBe(true);
    expect(gradeAnswer(capitalized, 'true')).toBe(false);
    const booleans = {
      type: 'true_false',
      options: [
        { value: true, correct: false },
        { value: false, correct: true },
      ],
    };
    expect(gradeAnswer(booleans, 'false')).toBe(true);
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

  it('places each blank once and leaves out other references', () => {
    expect(parseBlankPrompt('[1] and [1] and [3]', 2)).toEqual({
      parts: [{ blank: 0 }, { text: ' and  and ' }],
      inline: [0],
    });
    expect(parseBlankPrompt('[0] [1]', 1)).toEqual({
      parts: [{ text: ' ' }, { blank: 0 }],
      inline: [0],
    });
    expect(parseBlankPrompt('[99999999999999999999]', 1)).toEqual({
      parts: [],
      inline: [],
    });
    expect(parseBlankPrompt('[1][2]', 2)).toEqual({
      parts: [{ blank: 0 }, { blank: 1 }],
      inline: [0, 1],
    });
    expect(parseBlankPrompt('No blanks [1].', 0)).toEqual({
      parts: [{ text: 'No blanks .' }],
      inline: [],
    });
    expect(parseBlankPrompt('No references', 2)).toEqual({
      parts: [{ text: 'No references' }],
      inline: [],
    });
  });

  it('grades a list with a missing blank entry without throwing', () => {
    expect(
      gradeAnswer({ type: 'fill_blank', blanks: [null] }, ['anything'])
    ).toBe(false);
    expect(
      gradeAnswer({ type: 'multiple_choice', options: [null] }, ['a'])
    ).toBe(false);
  });

  it('picks the first accepted answer that could match, as it was written', () => {
    expect(firstAcceptedAnswer(['Sendai Framework', 'Sendai'])).toBe(
      'Sendai Framework'
    );
    expect(firstAcceptedAnswer(['', '  ', '\u200B', ' Sendai '])).toBe(
      'Sendai'
    );
    expect(firstAcceptedAnswer('2015')).toBe('2015');
    expect(firstAcceptedAnswer(2015)).toBe('2015');
    [undefined, null, [], [''], ['  ', null]].forEach(expected => {
      expect(firstAcceptedAnswer(expected)).toBeNull();
    });
    // What is shown is itself a correct answer.
    const question = { type: 'text', expected: ['  ', 'ＳＥＮＤＡＩ'] };
    expect(gradeAnswer(question, firstAcceptedAnswer(question.expected))).toBe(
      true
    );
  });
});
