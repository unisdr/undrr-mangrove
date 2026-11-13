import { act, fireEvent } from '@testing-library/react';
import createHydrator from '../../../../src/hydrate';
import QuizQuestion, {
  fromElement as questionFromElement,
} from '../QuizQuestion/QuizQuestion.hydrate';
import QuizScore, {
  ensureQuizScoreHost,
  fromElement as scoreFromElement,
} from '../QuizScore/QuizScore.hydrate';
import {
  QUIZ_CHANGE_EVENT,
  QUIZ_QUESTION_SELECTOR,
  notifyQuizChange,
  refreshQuiz,
} from '../quizScope';

const TRUE = { type: 'true_false', prompt: 'Water is wet.', answer: true };

const host = question =>
  `<div data-mg-quiz-question data-mg-ssr data-question='${JSON.stringify(
    question
  )}'><div class="mg-quiz-question"><p>fallback</p></div></div>`;

const settle = () =>
  act(async () => {
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });
  });

/**
 * Counts what the page does while `run` and the work it starts complete: the
 * searches for mounted questions (every recount is one) and the change events
 * on the document.
 */
async function measure(run) {
  const counts = { recounts: 0, events: 0 };
  const patched = [Document.prototype, Element.prototype].map(proto => {
    const original = proto.querySelectorAll;
    proto.querySelectorAll = function count(selector) {
      if (selector === QUIZ_QUESTION_SELECTOR) counts.recounts += 1;
      return original.call(this, selector);
    };
    return () => {
      proto.querySelectorAll = original;
    };
  });
  const onChange = () => {
    counts.events += 1;
  };
  document.addEventListener(QUIZ_CHANGE_EVENT, onChange);
  const started = performance.now();
  try {
    await run();
    await settle();
  } finally {
    document.removeEventListener(QUIZ_CHANGE_EVENT, onChange);
    patched.forEach(restore => restore());
  }
  return { ...counts, ms: Math.round(performance.now() - started) };
}

function hydrateQuiz() {
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
  return { question, score };
}

const numbers = () =>
  Array.from(
    document.querySelectorAll('.mg-quiz-question__number'),
    element => element.textContent
  );

async function mountCost(count, scopes = 1) {
  const perScope = count / scopes;
  const questions = Array.from({ length: perScope }, () => host(TRUE)).join('');
  document.body.innerHTML =
    scopes === 1
      ? questions
      : Array.from(
          { length: scopes },
          () => `<section data-mg-quiz>${questions}</section>`
        ).join('');
  let handles;
  const mount = await measure(() =>
    act(() => {
      handles = hydrateQuiz();
    })
  );
  // The measurement is only worth anything if the page ended up right.
  expect(numbers()).toHaveLength(count);
  expect(numbers()[perScope - 1]).toBe(`Question ${perScope} of ${perScope}`);

  const check = await measure(() =>
    act(() => {
      const first = document.querySelector('.mg-quiz-question');
      fireEvent.click(first.querySelector('input'));
      fireEvent.click(first.querySelector('.mg-quiz-question__check'));
    })
  );
  expect(document.querySelector('[role="status"]')).toHaveTextContent(
    `1 of ${perScope} correct so far.`
  );

  const unmount = await measure(() =>
    act(() => {
      handles.question.unmountAll();
      handles.score.unmountAll();
    })
  );
  return { mount, check, unmount };
}

jest.setTimeout(60000);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('the cost of counting a page of questions', () => {
  const results = {};

  afterAll(() => {
    if (process.env.QUIZ_MOUNT_COST_REPORT) {
      require('fs').writeFileSync(
        process.env.QUIZ_MOUNT_COST_REPORT,
        `${JSON.stringify(results, null, 2)}\n`
      );
    }
  });

  it.each([5, 20, 60])(
    'does not grow with the number of questions: %i questions and a score',
    async count => {
      const cost = await mountCost(count);
      results[count] = cost;
      // Mounting searches the scope twice whatever the number of questions:
      // once for the first numbers and once for the batch that confirms
      // them. Its two events are `ensureQuizScoreHost` and that batch. Before
      // batching, 60 questions cost 1,891 searches and 61 events.
      expect(cost.mount).toMatchObject({ recounts: 2, events: 2 });
      // One answer checked: one batch, one search.
      expect(cost.check).toMatchObject({ recounts: 1, events: 1 });
      // Every question leaving at once is one batch with nothing to count.
      expect(cost.unmount).toMatchObject({ recounts: 0, events: 1 });
    }
  );

  it('counts each scope once in a batch, not once per question', async () => {
    const cost = await mountCost(60, 3);
    results['60 in 3 scopes'] = cost;
    expect(cost.mount).toMatchObject({ recounts: 3 * 2, events: 2 });
    expect(cost.check).toMatchObject({ recounts: 3, events: 1 });
  });
});

describe('batched change events', () => {
  let heard;
  beforeEach(() => {
    heard = jest.fn();
    document.addEventListener(QUIZ_CHANGE_EVENT, heard);
  });
  afterEach(() => {
    document.removeEventListener(QUIZ_CHANGE_EVENT, heard);
  });

  it('sends one event for every change made in a task, after the task', async () => {
    notifyQuizChange(document);
    notifyQuizChange(document);
    notifyQuizChange(document);
    expect(heard).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(heard).toHaveBeenCalledTimes(1);
    expect(heard.mock.calls[0][0].target).toBe(document);

    // The next task starts a new batch.
    notifyQuizChange(document);
    await Promise.resolve();
    expect(heard).toHaveBeenCalledTimes(2);
  });

  it('counts at once for refreshQuiz, and takes the waiting batch with it', async () => {
    notifyQuizChange(document);
    refreshQuiz(document);
    expect(heard).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    expect(heard).toHaveBeenCalledTimes(1);
  });

  it('counts after the current task for a deferred refreshQuiz', async () => {
    jest.useFakeTimers();
    try {
      refreshQuiz(document, { defer: true });
      await Promise.resolve();
      expect(heard).not.toHaveBeenCalled();
      jest.runAllTimers();
      expect(heard).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('shares one batch between two copies of the module', async () => {
    // QuizQuestion and QuizScore are separate bundles, each with its own copy.
    let copy;
    jest.isolateModules(() => {
      copy = require('../quizScope');
    });
    expect(copy.notifyQuizChange).not.toBe(notifyQuizChange);
    notifyQuizChange(document);
    copy.notifyQuizChange(document);
    await Promise.resolve();
    expect(heard).toHaveBeenCalledTimes(1);
  });

  it('reads the document afresh outside a batch', async () => {
    document.body.innerHTML = host(TRUE) + host(TRUE);
    let handles;
    await act(async () => {
      handles = hydrateQuiz();
    });
    expect(numbers()).toEqual(['Question 1 of 2', 'Question 2 of 2']);

    document.querySelector('[data-mg-quiz-question]').remove();
    act(() => refreshQuiz(document));
    expect(numbers()).toEqual([]);

    await act(async () => {
      handles.question.unmountAll();
      handles.score.unmountAll();
    });
  });
});
