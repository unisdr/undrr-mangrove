import fromElement from '../QuizQuestion.fromElement';

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

  it('reads true/false from `answer`, or passes legacy options through', () => {
    expect(
      fromElement(
        makeContainer({ type: 'true_false', prompt: 'P', answer: false })
      )
    ).toEqual({ type: 'true_false', prompt: 'P', answer: false });
    const options = [
      { value: 'true', correct: true },
      { value: 'false', correct: false },
    ];
    expect(
      fromElement(makeContainer({ type: 'true_false', prompt: 'P', options }))
        .options
    ).toEqual(options);
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

  it('throws without a readable question, so the server markup stays', () => {
    expect(() => fromElement(makeContainer())).toThrow(/data-question/);
    expect(() => fromElement(makeContainer('{not json'))).toThrow();
    expect(() => fromElement(makeContainer({ type: 'essay' }))).toThrow();
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
    expect(props.mediaHtml).toBe('<img src="a.jpg" alt="A">');
    expect(props.number).toBe(2);
    expect(props.total).toBe(5);
    expect(props.showNumber).toBe(false);
    expect(props.labels).toEqual({ checkAnswer: 'Submit' });
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
