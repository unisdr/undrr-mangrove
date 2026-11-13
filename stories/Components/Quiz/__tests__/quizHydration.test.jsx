import { act, fireEvent, screen, within } from '@testing-library/react';
import createHydrator from '../../../../src/hydrate';
import { getServerMarkup } from '../_storyFixtures';
import QuizQuestion, {
  fromElement as questionFromElement,
  refreshQuiz,
} from '../QuizQuestion/QuizQuestion.hydrate';
import QuizScore, {
  ensureQuizScoreHost,
  fromElement as scoreFromElement,
} from '../QuizScore/QuizScore.hydrate';

const TRUE = { type: 'true_false', prompt: 'Water is wet.', answer: true };
const MEDIA =
  '<div class="mg-quiz-question__media"><img src="a.jpg" alt="A lake" data-once="lightbox"></div>';

const host = (question, { attrs = '', fallback = '<p>fallback</p>' } = {}) =>
  `<div data-mg-quiz-question data-mg-ssr ${attrs} data-question='${
    typeof question === 'string' ? question : JSON.stringify(question)
  }'><div class="mg-quiz-question">${fallback}</div></div>`;

const hydrate = (questionConfig = {}) => {
  let handles;
  act(() => {
    const question = createHydrator({
      selector: '[data-mg-quiz-question]',
      component: QuizQuestion,
      fromElement: questionFromElement,
      ...questionConfig,
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

const unmount = handles =>
  act(() => {
    handles.question.unmountAll();
    handles.score.unmountAll();
  });

const mounted = () =>
  Array.from(
    document.querySelectorAll('.mg-quiz-question[data-mg-quiz-state]')
  );
const numbers = () =>
  Array.from(
    document.querySelectorAll('.mg-quiz-question__number'),
    element => element.textContent
  );
const answerTrue = question =>
  act(() => {
    fireEvent.click(within(question).getByLabelText('True'));
    fireEvent.click(
      within(question).getByRole('button', { name: 'Check answer' })
    );
  });
const settle = () =>
  act(async () => {
    await new Promise(resolve => {
      setTimeout(resolve, 10);
    });
  });

let error;
beforeEach(() => {
  error = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  error.mockRestore();
  document.body.innerHTML = '';
});

describe('a question that does not mount', () => {
  it('is left out of the numbering and the score', () => {
    document.body.innerHTML = `${host(TRUE)}${host('{broken')}${host(TRUE)}`;
    const handles = hydrate();

    expect(document.querySelectorAll('.mg-quiz-question')).toHaveLength(3);
    expect(mounted()).toHaveLength(2);
    expect(numbers()).toEqual(['Question 1 of 2', 'Question 2 of 2']);

    answerTrue(mounted()[0]);
    expect(screen.getByRole('status')).toHaveTextContent(
      '1 of 2 correct so far.'
    );
    expect(document.querySelector('progress')).toHaveAttribute('max', '2');

    answerTrue(mounted()[1]);
    expect(screen.getByRole('status')).toHaveTextContent(
      'You got 2 of 2 correct.'
    );
    // The fallback is still there, untouched, after the score completes.
    expect(document.body).toHaveTextContent('fallback');

    fireEvent.click(screen.getByRole('button', { name: 'Start again' }));
    expect(mounted().map(question => question.dataset.mgQuizState)).toEqual([
      'unanswered',
      'unanswered',
    ]);
    expect(within(mounted()[0]).getByLabelText('True')).toHaveFocus();
    unmount(handles);
  });

  it('keeps a lone mounted question unnumbered beside a fallback', () => {
    document.body.innerHTML = `${host('{broken')}${host(TRUE)}`;
    const handles = hydrate();
    expect(numbers()).toEqual([]);
    expect(screen.getByRole('button', { name: 'Check answer' })).toHaveClass(
      'mg-button-primary'
    );
    answerTrue(mounted()[0]);
    expect(screen.getByRole('status')).toHaveTextContent(
      'You got 1 of 1 correct.'
    );
    unmount(handles);
  });

  it('does not count a fallback nested in a mounted question as a question', () => {
    document.body.innerHTML = host(TRUE, {
      fallback:
        '<div class="mg-quiz-question__media"><div class="mg-quiz-question"><img src="a.jpg" alt=""></div></div>',
    });
    const handles = hydrate();
    expect(document.querySelectorAll('.mg-quiz-question')).toHaveLength(2);
    expect(mounted()).toHaveLength(1);
    expect(numbers()).toEqual([]);
    unmount(handles);
  });
});

describe('data that parses but cannot be shown', () => {
  it.each([
    [
      'a true/false option that is null, with no prompt',
      '{"type":"true_false","options":[null]}',
    ],
    [
      'multiple-choice options that are null',
      '{"type":"multiple_choice","prompt":"x","options":[null]}',
    ],
    ['a prompt that is an object', '{"type":"text","prompt":{"evil":1}}'],
    [
      'a blank that is null',
      '{"type":"fill_blank","prompt":"[1]","blanks":[null]}',
    ],
    ['no blanks', '{"type":"fill_blank","prompt":"[1]","blanks":[]}'],
    ['an unknown type', '{"type":"essay","prompt":"x"}'],
    ['a list', '[1,2]'],
  ])('leaves the fallback in place for %s', (name, json) => {
    document.body.innerHTML = host(json);
    const fallback = document.querySelector('.mg-quiz-question');
    const handles = hydrate();
    const container = document.querySelector('[data-mg-quiz-question]');

    expect(container.firstElementChild).toBe(fallback);
    expect(container).toHaveTextContent('fallback');
    expect(container).not.toHaveAttribute('data-mg-hydrated');
    expect(screen.queryByRole('button')).toBeNull();
    expect(mounted()).toHaveLength(0);
    expect(error).toHaveBeenCalled();
    unmount(handles);
  });

  it.each([
    ['an object', '{"checkAnswer":{"a":1}}'],
    ['null', '{"checkAnswer":null}'],
    ['an empty string', '{"checkAnswer":""}'],
    ['a number', '{"checkAnswer":5}'],
  ])(
    'mounts with the built-in label when an override is %s',
    (name, labels) => {
      document.body.innerHTML = host(TRUE, {
        attrs: `data-labels='${labels}'`,
      });
      const handles = hydrate();
      expect(mounted()).toHaveLength(1);
      expect(
        screen.getByRole('button', { name: 'Check answer' })
      ).toBeInTheDocument();
      expect(error).not.toHaveBeenCalled();
      unmount(handles);
    }
  );

  it('mounts a true/false question with a null option and marks nothing correct', () => {
    document.body.innerHTML = host({
      type: 'true_false',
      prompt: 'x',
      options: [null],
    });
    const handles = hydrate();
    answerTrue(mounted()[0]);
    expect(mounted()[0]).toHaveAttribute('data-mg-quiz-state', 'incorrect');
    expect(error).not.toHaveBeenCalled();
    unmount(handles);
  });

  it('puts the fallback back when the question throws while rendering', async () => {
    document.body.innerHTML = `${host(TRUE, { fallback: `${MEDIA}<p>fallback</p>` })}${host(TRUE)}`;
    const [broken] = document.querySelectorAll('[data-mg-quiz-question]');
    const fallback = broken.firstElementChild;
    const image = broken.querySelector('img');
    const onError = jest.fn();
    let handles;
    await act(async () => {
      handles = hydrate({
        // A plain object is not something React can render.
        fromElement: container => ({
          ...questionFromElement(container),
          ...(container === broken ? { media: { not: 'a node' } } : {}),
        }),
        options: { onError },
      });
    });
    await settle();

    expect(broken.childNodes).toHaveLength(1);
    expect(broken.firstElementChild).toBe(fallback);
    expect(broken).toHaveTextContent('fallback');
    expect(broken.querySelector('img')).toBe(image);
    expect(image.parentElement).toHaveClass('mg-quiz-question__media');
    expect(within(broken).queryByRole('button')).toBeNull();
    expect(onError).toHaveBeenCalledWith(expect.any(Error), broken);

    // The other question is unaffected and is the only one counted.
    expect(mounted()).toHaveLength(1);
    expect(numbers()).toEqual([]);
    answerTrue(mounted()[0]);
    expect(screen.getByRole('status')).toHaveTextContent(
      'You got 1 of 1 correct.'
    );
    unmount(handles);
    expect(broken.childNodes).toHaveLength(1);
    expect(broken.firstElementChild).toBe(fallback);
  });
});

describe('the documented server markup', () => {
  const radioGroups = () =>
    Array.from(document.querySelectorAll('[data-mg-quiz-question]'))
      .map(container =>
        Array.from(container.querySelectorAll('input[type="radio"]'))
      )
      .filter(radios => radios.length > 0);

  it('gives the radios of each question one name that no other question has', () => {
    document.body.innerHTML = getServerMarkup('a.jpg');
    const groups = radioGroups();
    expect(groups).toHaveLength(2);
    const names = groups.map(radios => {
      const group = new Set(radios.map(radio => radio.getAttribute('name')));
      expect(group.size).toBe(1);
      return [...group][0];
    });
    names.forEach(name => expect(name).toBeTruthy());
    expect(new Set(names).size).toBe(names.length);

    // One choice per question, and the questions do not affect each other.
    groups.forEach(radios => radios.forEach(radio => fireEvent.click(radio)));
    groups.forEach(radios => {
      expect(radios.filter(radio => radio.checked)).toEqual([
        radios[radios.length - 1],
      ]);
    });
  });

  it('labels the fallback controls for click tracking without their values', () => {
    document.body.innerHTML = getServerMarkup('a.jpg');
    const tracked = document.querySelectorAll(
      '[data-mg-quiz-question] input, [data-mg-quiz-question] label'
    );
    expect(tracked.length).toBeGreaterThan(10);
    tracked.forEach(element => {
      expect(element.getAttribute('data-vf-analytics-label')).toMatch(
        /^Quiz: (Answer option|Blank)$/
      );
    });
  });

  it('replaces the fallback names with its own, so copies stay independent', () => {
    // The same rendered block twice: identical names before the mount.
    document.body.innerHTML = `${getServerMarkup('a.jpg')}${getServerMarkup('b.jpg')}`;
    const fallbackNames = new Set(
      radioGroups().map(radios => radios[0].getAttribute('name'))
    );
    expect(fallbackNames.size).toBe(2);
    const handles = hydrate();

    expect(mounted()).toHaveLength(6);
    const groups = radioGroups();
    const names = groups.map(radios => radios[0].name);
    expect(new Set(names).size).toBe(4);
    names.forEach(name => expect(fallbackNames.has(name)).toBe(false));

    fireEvent.click(groups[0][0]);
    fireEvent.click(groups[2][1]);
    expect(groups[0][0]).toBeChecked();
    expect(groups[2][1]).toBeChecked();
    unmount(handles);
  });
});

describe('media carried over from the server markup', () => {
  const setup = () => {
    document.body.innerHTML = `${host(TRUE, { fallback: `${MEDIA}<p>fallback</p>` })}${host(TRUE)}`;
    const image = document.querySelector('img');
    const wrapper = image.parentElement;
    const clicks = jest.fn();
    image.addEventListener('click', clicks);
    wrapper.addEventListener('click', clicks);
    return { image, wrapper, clicks, handles: hydrate() };
  };

  it('moves the existing nodes into the question, listeners and all', () => {
    const { image, wrapper, clicks, handles } = setup();
    const [question] = mounted();

    expect(document.querySelectorAll('img')).toHaveLength(1);
    expect(question.querySelector('img')).toBe(image);
    expect(image.parentElement).toBe(wrapper);
    expect(wrapper).toHaveClass('mg-quiz-question__media');
    expect(document.querySelectorAll('.mg-quiz-question__media')).toHaveLength(
      1
    );
    // Between the prompt and the options, inside the group.
    const group = within(question).getByRole('group');
    expect(group).toContainElement(image);
    expect(
      // eslint-disable-next-line no-bitwise -- compareDocumentPosition returns a bitmask
      image.compareDocumentPosition(within(question).getByLabelText('True')) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(document.body).not.toHaveTextContent('fallback');

    fireEvent.click(image);
    // Once on the image and once, bubbling, on its wrapper.
    expect(clicks).toHaveBeenCalledTimes(2);
    expect(image).toHaveAttribute('data-once', 'lightbox');
    unmount(handles);
  });

  it('keeps one copy through an answer and "Start again"', () => {
    const { image, handles } = setup();
    mounted().forEach(answerTrue);
    expect(mounted()[0].querySelector('img')).toBe(image);
    fireEvent.click(screen.getByRole('button', { name: 'Start again' }));
    expect(mounted()[0]).toHaveAttribute('data-mg-quiz-state', 'unanswered');
    expect(document.querySelectorAll('img')).toHaveLength(1);
    expect(mounted()[0].querySelector('img')).toBe(image);
    unmount(handles);
  });

  it('returns the container to its server markup on unmount, and mounts again', () => {
    const { image, wrapper, clicks, handles } = setup();
    const container = document.querySelector('[data-mg-quiz-question]');
    unmount(handles);

    expect(container).not.toHaveAttribute('data-mg-hydrated');
    expect(container.innerHTML).toBe(
      `<div class="mg-quiz-question">${MEDIA}<p>fallback</p></div>`
    );
    expect(container.querySelector('img')).toBe(image);
    expect(mounted()).toHaveLength(0);

    const again = hydrate();
    expect(mounted()).toHaveLength(2);
    expect(document.querySelectorAll('img')).toHaveLength(1);
    expect(mounted()[0].querySelector('img')).toBe(image);
    expect(image.parentElement).toBe(wrapper);
    fireEvent.click(image);
    expect(clicks).toHaveBeenCalledTimes(2);

    // Scanning again changes nothing.
    act(() => {
      again.question.update(document);
    });
    expect(document.querySelectorAll('img')).toHaveLength(1);
    expect(mounted()).toHaveLength(2);
    unmount(again);
    expect(container.querySelector('img')).toBe(image);
  });
});

describe('markup removed without an unmount', () => {
  const setup = () => {
    document.body.innerHTML = `${host(TRUE)}${host(TRUE)}${host(TRUE)}`;
    const handles = hydrate();
    answerTrue(mounted()[0]);
    expect(screen.getByRole('status')).toHaveTextContent(
      '1 of 3 correct so far.'
    );
    return handles;
  };
  const removeLast = () =>
    Array.from(document.querySelectorAll('[data-mg-quiz-question]'))
      .pop()
      .remove();

  it('recounts and renumbers when told that the page changed', () => {
    const handles = setup();
    removeLast();
    act(() => refreshQuiz(document));
    expect(screen.getByRole('status')).toHaveTextContent(
      '1 of 2 correct so far.'
    );
    expect(numbers()).toEqual(['Question 1 of 2', 'Question 2 of 2']);

    answerTrue(mounted()[1]);
    expect(screen.getByRole('status')).toHaveTextContent(
      'You got 2 of 2 correct.'
    );
    unmount(handles);
  });

  it('recounts after the removal when asked just before it', async () => {
    const handles = setup();
    // The order of a Drupal behavior's detach: told first, removed after.
    refreshQuiz(document.querySelector('[data-mg-quiz-question]'), {
      defer: true,
    });
    removeLast();
    expect(screen.getByRole('status')).toHaveTextContent(
      '1 of 3 correct so far.'
    );
    await settle();
    expect(screen.getByRole('status')).toHaveTextContent(
      '1 of 2 correct so far.'
    );
    unmount(handles);
  });

  it('recounts when ensureQuizScoreHost runs again', () => {
    const handles = setup();
    removeLast();
    const scoreHost = document.querySelector('[data-mg-quiz-score]');
    act(() => {
      expect(ensureQuizScoreHost(document)).toHaveLength(0);
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      '1 of 2 correct so far.'
    );
    // The score it created follows the question that is now last.
    const hosts = document.querySelectorAll('[data-mg-quiz-question]');
    expect(hosts[hosts.length - 1].nextElementSibling).toBe(scoreHost);
    unmount(handles);
  });

  it('releases the document listeners of a removed question', () => {
    const handles = setup();
    const remove = jest.spyOn(document, 'removeEventListener');
    const released = () =>
      remove.mock.calls.filter(([type]) => String(type).startsWith('mg-quiz:'))
        .length;

    // Nothing is released while every question is in the document.
    act(() => refreshQuiz(document));
    expect(released()).toBe(0);

    removeLast();
    act(() => refreshQuiz(document));
    // The removed question's change and reset listeners.
    expect(released()).toBe(2);

    // It no longer hears anything: a later count finds nothing more to drop.
    act(() => refreshQuiz(document));
    expect(released()).toBe(2);
    remove.mockRestore();
    unmount(handles);
  });

  it('releases the listener of a removed score', () => {
    const handles = setup();
    const remove = jest.spyOn(document, 'removeEventListener');
    document.querySelector('[data-mg-quiz-score]').remove();
    act(() => refreshQuiz(document));
    expect(
      remove.mock.calls.filter(([type]) => type === 'mg-quiz:change')
    ).toHaveLength(1);
    remove.mockRestore();
    unmount(handles);
  });
});

describe('ensureQuizScoreHost', () => {
  it('only touches the scopes that have a question inside the context', () => {
    document.body.innerHTML = `<section data-mg-quiz id="one">${host(TRUE)}<div id="added">${host(TRUE)}</div></section><section data-mg-quiz id="two">${host(TRUE)}</div>`;
    const added = document.getElementById('added');

    const created = ensureQuizScoreHost(added);
    expect(created).toHaveLength(1);
    expect(document.querySelectorAll('[data-mg-quiz-score]')).toHaveLength(1);
    // After the last question of the whole scope, not only of the context.
    expect(created[0].closest('[data-mg-quiz]').id).toBe('one');
    expect(created[0].previousElementSibling).toBe(
      added.querySelector('[data-mg-quiz-question]')
    );

    expect(ensureQuizScoreHost(document)).toHaveLength(1);
    expect(document.querySelectorAll('#two [data-mg-quiz-score]')).toHaveLength(
      1
    );
  });

  it('accepts a question container as the context, and one with no questions', () => {
    document.body.innerHTML = `${host(TRUE)}<p id="plain">Text</p>`;
    expect(ensureQuizScoreHost(document.getElementById('plain'))).toHaveLength(
      0
    );
    expect(document.querySelector('[data-mg-quiz-score]')).toBeNull();
    expect(
      ensureQuizScoreHost(document.querySelector('[data-mg-quiz-question]'))
    ).toHaveLength(1);
  });

  it('asks the page to count again each time it runs', () => {
    document.body.innerHTML = host(TRUE);
    const heard = jest.fn();
    document.addEventListener('mg-quiz:change', heard);
    ensureQuizScoreHost(document);
    ensureQuizScoreHost(document.body);
    expect(heard).toHaveBeenCalledTimes(2);
    document.removeEventListener('mg-quiz:change', heard);
  });
});
