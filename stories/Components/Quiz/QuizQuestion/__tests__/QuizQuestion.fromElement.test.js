import readElement from '../QuizQuestion.fromElement';
import { gradeAnswer } from '../../quizGrading';

// The question data, without the reference to the server markup.
const fromElement = container => {
  const { serverFallback, ...props } = readElement(container);
  expect(serverFallback.container).toBe(container);
  return props;
};

function makeContainer(question, attrs = {}, html = '') {
  const el = document.createElement('div');
  el.setAttribute('data-mg-quiz-question', '');
  if (question !== undefined) {
    el.setAttribute(
      'data-question',
      typeof question === 'string' ? question : JSON.stringify(question)
    );
  }
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  el.innerHTML = html;
  return el;
}

describe('quizQuestionFromElement', () => {
  it('reads a multiple choice question and its key', () => {
    const props = fromElement(
      makeContainer({
        type: 'multiple_choice',
        prompt: 'Pick one',
        multiple: true,
        options: [
          { value: 1, label: 'Flood', correct: true },
          { value: 2, label: 'Earthquake' },
        ],
        explanation: 'Because.',
      })
    );
    expect(props).toEqual({
      type: 'multiple_choice',
      prompt: 'Pick one',
      multiple: true,
      options: [
        { value: '1', label: 'Flood', correct: true },
        { value: '2', label: 'Earthquake', correct: false },
      ],
      explanation: 'Because.',
    });
  });

  it('reads true/false from `answer`, or from legacy options', () => {
    const question = { type: 'true_false', prompt: 'P' };
    expect(fromElement(makeContainer({ ...question, answer: false }))).toEqual({
      ...question,
      answer: false,
    });
    expect(
      fromElement(
        makeContainer({
          ...question,
          options: [
            { value: 'true', correct: false },
            { value: 'false', correct: true },
          ],
        })
      )
    ).toEqual({ ...question, answer: false });
  });

  it.each([
    ['"true"', 'true', true],
    ['"false"', 'false', false],
    ['"False"', 'False', false],
    ['"TRUE"', 'TRUE', true],
  ])('reads the true/false answer %s as a boolean', (name, answer, key) => {
    const props = fromElement(
      makeContainer({ type: 'true_false', prompt: 'P', answer })
    );
    expect(props.answer).toBe(key);
    expect(gradeAnswer(props, String(key))).toBe(true);
    expect(gradeAnswer(props, String(!key))).toBe(false);
  });

  it.each([
    ['0', 0],
    ['1', 1],
    ['"0"', '0'],
    ['"no"', 'no'],
    ['"yes"', 'yes'],
    ['an empty string', ''],
    ['null', null],
    ['a list', [false]],
    ['an object', { value: false }],
  ])('treats the true/false answer %s as no key', (name, answer) => {
    const props = fromElement(
      makeContainer({ type: 'true_false', prompt: 'P', answer })
    );
    expect(props).not.toHaveProperty('answer');
    expect(gradeAnswer(props, 'true')).toBe(false);
    expect(gradeAnswer(props, 'false')).toBe(false);
  });

  it('matches legacy true/false option values in any case, and nothing else', () => {
    const read = options =>
      fromElement(makeContainer({ type: 'true_false', prompt: 'P', options }));
    expect(
      read([
        { value: 'True', correct: false },
        { value: 'False', correct: true },
      ]).answer
    ).toBe(false);
    expect(
      read([
        { value: '1', correct: false },
        { value: '0', correct: true },
      ])
    ).not.toHaveProperty('answer');
    expect(read([null])).not.toHaveProperty('answer');
    expect(read('false')).not.toHaveProperty('answer');
  });

  it('reads text and fill-in-the-blank keys, tolerating scalars', () => {
    expect(
      fromElement(
        makeContainer({
          type: 'text',
          prompt: 'P',
          expected: 'Sendai',
          caseSensitive: true,
        })
      )
    ).toEqual({
      type: 'text',
      prompt: 'P',
      expected: ['Sendai'],
      caseSensitive: true,
    });
    expect(
      fromElement(
        makeContainer({
          type: 'fill_blank',
          prompt: 'In [1]',
          blanks: [{ label: 'City', expected: ['Sendai'] }, { expected: 2015 }],
        })
      ).blanks
    ).toEqual([
      { label: 'City', expected: ['Sendai'], caseSensitive: false },
      { expected: ['2015'], caseSensitive: false },
    ]);
  });

  it('maps an optional `id` to questionId', () => {
    const question = { type: 'true_false', prompt: 'Q', answer: true };
    expect(fromElement(makeContainer(question))).not.toHaveProperty(
      'questionId'
    );
    expect(
      fromElement(makeContainer({ ...question, id: 'hazards-1' })).questionId
    ).toBe('hazards-1');
    expect(fromElement(makeContainer({ ...question, id: 42 })).questionId).toBe(
      '42'
    );
    [' ', '', null, {}, true].forEach(id => {
      expect(
        fromElement(makeContainer({ ...question, id }))
      ).not.toHaveProperty('questionId');
    });
  });

  it('reads a question that has no answer key', () => {
    expect(
      fromElement(
        makeContainer({
          type: 'multiple_choice',
          prompt: 'Pick one',
          options: [{ value: 'a', label: 'A' }],
        })
      )
    ).toEqual({
      type: 'multiple_choice',
      prompt: 'Pick one',
      multiple: false,
      options: [{ value: 'a', label: 'A', correct: false }],
    });
    expect(fromElement(makeContainer({ type: 'text', prompt: 'Q' }))).toEqual({
      type: 'text',
      prompt: 'Q',
      expected: [],
      caseSensitive: false,
    });
    expect(
      fromElement(makeContainer({ type: 'true_false', prompt: 'Q' }))
    ).toEqual({ type: 'true_false', prompt: 'Q' });
  });

  it('throws without a readable question, so the server markup stays', () => {
    expect(() => readElement(makeContainer())).toThrow(/data-question/);
    expect(() => readElement(makeContainer('{not json'))).toThrow();
    expect(() => readElement(makeContainer({ type: 'essay' }))).toThrow();
    expect(() => readElement(makeContainer('[]'))).toThrow();
    expect(() => readElement(makeContainer('null'))).toThrow();
  });

  it.each([
    ['a prompt that is an object', { type: 'text', prompt: { evil: 1 } }],
    ['a missing prompt', { type: 'text' }],
    ['a blank prompt', { type: 'true_false', prompt: '  ', answer: true }],
    [
      'options that are not objects',
      { type: 'multiple_choice', prompt: 'P', options: [null, 'a', 3] },
    ],
    ['no options', { type: 'multiple_choice', prompt: 'P' }],
    [
      'options with nothing to show',
      { type: 'multiple_choice', prompt: 'P', options: [{ correct: true }] },
    ],
    [
      'a blank that is null',
      { type: 'fill_blank', prompt: '[1]', blanks: [null] },
    ],
    ['no blanks', { type: 'fill_blank', prompt: 'P [1]', blanks: [] }],
    [
      'blanks that are not a list',
      { type: 'fill_blank', prompt: 'P', blanks: 2 },
    ],
  ])('throws for %s', (name, question) => {
    const container = makeContainer(question, {}, '<p>fallback</p>');
    expect(() => readElement(container)).toThrow(/^QuizQuestion: /);
    expect(container.innerHTML).toBe('<p>fallback</p>');
  });

  it('drops malformed entries and keeps the rest of the question', () => {
    expect(
      fromElement(
        makeContainer({
          type: 'multiple_choice',
          prompt: 'P',
          multiple: 'yes',
          explanation: { html: '<b>x</b>' },
          options: [
            null,
            { value: { a: 1 }, label: ['<b>x</b>'] },
            { label: 'No value', correct: 'true' },
            { value: 'b', label: null, correct: true },
            { value: 3, label: 7 },
          ],
        })
      )
    ).toEqual({
      type: 'multiple_choice',
      prompt: 'P',
      multiple: false,
      options: [
        { value: '', label: 'No value', correct: false },
        { value: 'b', label: 'b', correct: true },
        { value: '3', label: '7', correct: false },
      ],
    });
    expect(
      fromElement(
        makeContainer({
          type: 'text',
          prompt: 'P',
          expected: ['Sendai', null, { a: 1 }, 2015, ['x']],
        })
      ).expected
    ).toEqual(['Sendai', '2015']);
    expect(
      fromElement(
        makeContainer({
          type: 'fill_blank',
          prompt: '[1]',
          blanks: [
            { label: { a: 1 }, expected: [null, 'a'], caseSensitive: 1 },
          ],
        })
      ).blanks
    ).toEqual([{ expected: ['a'], caseSensitive: false }]);
  });

  it('keeps only label overrides that are non-empty strings', () => {
    const question = { type: 'true_false', prompt: 'P', answer: true };
    const labels = value =>
      fromElement(makeContainer(question, { 'data-labels': value })).labels;
    expect(
      labels(
        '{"checkAnswer":{"a":1},"correct":null,"trueLabel":"  ","falseLabel":7,"selectAll":"Pick all"}'
      )
    ).toEqual({ selectAll: 'Pick all' });
    expect(labels('{"checkAnswer":null}')).toBeUndefined();
    expect(labels('{"__proto__":{"polluted":1}}')).toBeUndefined();
    expect({}.polluted).toBeUndefined();
    expect(labels('["a"]')).toBeUndefined();
  });

  it('keeps empty and repeated option values, which are graded by position', () => {
    expect(
      fromElement(
        makeContainer({
          type: 'multiple_choice',
          prompt: 'P',
          options: [
            { value: '', label: 'None of these', correct: true },
            { value: 'a', label: 'First' },
            { value: 'a', label: 'Second' },
          ],
        })
      ).options.map(option => option.value)
    ).toEqual(['', 'a', 'a']);
  });

  it('carries over server-rendered media, numbering and label overrides', () => {
    const props = fromElement(
      makeContainer(
        { type: 'text', prompt: 'P', expected: ['a'] },
        {
          'data-number': '2',
          'data-total': '5',
          'data-show-number': 'false',
          'data-labels': '{"checkAnswer":"Submit"}',
        },
        '<div class="mg-quiz-question"><div class="mg-quiz-question__media"><img src="a.jpg" alt="A"></div></div>'
      )
    );
    expect(props).not.toHaveProperty('mediaHtml');
    expect(props.number).toBe(2);
    expect(props.total).toBe(5);
    expect(props.showNumber).toBe(false);
    expect(props.labels).toEqual({ checkAnswer: 'Submit' });
  });

  it('hands over the server markup by reference and leaves it untouched', () => {
    const container = makeContainer(
      { type: 'text', prompt: 'P', expected: ['a'] },
      {},
      '<div class="mg-quiz-question"><div class="mg-quiz-question__media"><img src="a.jpg" alt="A"></div><p>fallback</p></div>'
    );
    const before = container.innerHTML;
    const fallback = container.firstElementChild;
    const media = container.querySelector('.mg-quiz-question__media');
    const { serverFallback } = readElement(container);
    expect(serverFallback.nodes).toEqual([fallback]);
    expect(serverFallback.media).toBe(media);
    expect(container.innerHTML).toBe(before);

    const empty = makeContainer(
      { type: 'text', prompt: 'P' },
      {},
      '<div class="mg-quiz-question"><div class="mg-quiz-question__media">  </div></div>'
    );
    expect(readElement(empty).serverFallback.media).toBeNull();
    expect(
      readElement(makeContainer({ type: 'text', prompt: 'P' })).serverFallback
        .media
    ).toBeNull();
  });

  it('selects language from data-lang, then the nearest lang', () => {
    const section = document.createElement('section');
    section.setAttribute('lang', 'fr');
    const question = { type: 'text', prompt: 'P', expected: ['a'] };
    const inherited = makeContainer(question);
    const local = makeContainer(question, { 'data-lang': 'ar', dir: 'rtl' });
    section.append(inherited, local);
    expect(fromElement(inherited).lang).toBe('fr');
    expect(fromElement(local)).toMatchObject({ lang: 'ar', dir: 'rtl' });
    expect(fromElement(makeContainer(question))).not.toHaveProperty('lang');
  });
});
