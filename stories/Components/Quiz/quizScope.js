/**
 * Page-level coordination between quiz questions and the quiz score.
 *
 * Questions are independent blocks in the page flow, each possibly its own
 * React root, so they cannot share React state. The document is the shared
 * state instead: every mounted question carries `data-mg-quiz-state` on its
 * root, and a `mg-quiz:change` event tells listeners to count again. The count
 * is always read from the document, so it only has to be told when to look:
 * questions tell it when they mount, unmount or change, and `refreshQuiz` is
 * for code that adds or removes markup without React knowing (Drupal AJAX,
 * BigPipe). It also works with more than one copy of this module on a page.
 *
 * Changes are batched. Every question that mounts, unmounts or changes in one
 * task asks for a count, and the document gets one `mg-quiz:change` for all of
 * them, in a microtask after the task. While that event is being handled,
 * each scope is searched once and every listener reads the same result, so a
 * page of sixty questions costs one search and not sixty times sixty. A
 * question or score that mounts also reads its first numbers at once, so it
 * does not wait for the batch to be right; those first reads share one search
 * per scope as well, and the batch that follows corrects them if more
 * questions arrived in the same task.
 *
 * A scope is the nearest `[data-mg-quiz]` ancestor, or the whole document for
 * questions that have none.
 */

export const QUIZ_SCOPE_SELECTOR = '[data-mg-quiz]';
// Only a mounted question has a state. The server-rendered fallback carries
// the `mg-quiz-question` class too, and a fallback that never mounts cannot be
// answered, so it is neither numbered nor counted.
export const QUIZ_QUESTION_SELECTOR = '.mg-quiz-question[data-mg-quiz-state]';
export const QUIZ_CHANGE_EVENT = 'mg-quiz:change';
export const QUIZ_RESET_EVENT = 'mg-quiz:reset';
const ANSWERED_STATES = ['correct', 'incorrect', 'revealed'];

// The batch belongs to the document, not to this module: QuizQuestion and
// QuizScore are separate bundles with a copy of this file each, and all the
// copies on a page have to share one pending change and one set of counts.
const BATCH_KEY = Symbol.for('undrr.mangrove.quiz.batch');

function getBatch(doc) {
  if (!doc[BATCH_KEY]) {
    Object.defineProperty(doc, BATCH_KEY, {
      value: { pending: false, counts: null, early: null },
    });
  }
  return doc[BATCH_KEY];
}

/**
 * @param {Element} element Question or score element
 * @returns {Element|Document} Its scope
 */
export function getQuizScope(element) {
  return element.closest(QUIZ_SCOPE_SELECTOR) ?? element.ownerDocument;
}

function findQuizQuestions(scope) {
  const isDocument = scope.nodeType === 9;
  return Array.from(scope.querySelectorAll(QUIZ_QUESTION_SELECTOR)).filter(
    question =>
      (isDocument
        ? question.closest(QUIZ_SCOPE_SELECTOR) === null
        : question.closest(QUIZ_SCOPE_SELECTOR) === scope) &&
      // A question nested in another question's markup is not a second one.
      question.parentElement?.closest(QUIZ_QUESTION_SELECTOR) == null
  );
}

// The questions of a scope and the position of each. While a change event is
// being handled the result is kept, so the scope is searched once for all of
// its listeners. A component that is mounting (`early`) shares one result
// with the others that mount before the pending batch runs. At any other
// time the document is read afresh.
function readScope(scope, early = false) {
  const batch = getBatch(scope.ownerDocument ?? scope);
  let { counts } = batch;
  if (!counts && early && batch.pending) {
    batch.early ??= new Map();
    counts = batch.early;
  }
  const known = counts?.get(scope);
  if (known) return known;
  const questions = findQuizQuestions(scope);
  const entry = {
    questions,
    positions: new Map(questions.map((question, index) => [question, index])),
  };
  counts?.set(scope, entry);
  return entry;
}

/**
 * @param {Element|Document} scope Scope to search
 * @returns {Element[]} Question roots that belong to the scope, in document order
 */
export function getQuizQuestions(scope) {
  return readScope(scope).questions;
}

/**
 * A question is answered when it is `correct`, `incorrect` or `revealed`. A
 * revealed question was ended by "Show answer": it is answered, so the quiz
 * can complete, and it is never correct.
 *
 * @param {Element|Document} scope Scope to count
 * @param {boolean} [early=false] The caller is mounting: share the search
 *   with the others that mount before the pending batch runs
 * @returns {{total: number, answered: number, correct: number}} Current score
 */
export function getQuizSummary(scope, early = false) {
  const { questions } = readScope(scope, early);
  const states = questions.map(question => question.dataset.mgQuizState);
  const correct = states.filter(state => state === 'correct').length;
  const answered = states.filter(state => ANSWERED_STATES.includes(state));
  return { total: questions.length, answered: answered.length, correct };
}

/**
 * @param {Element} element Question root
 * @param {boolean} [early=false] The caller is mounting: share the search
 *   with the others that mount before the pending batch runs
 * @returns {{number: number, total: number}} One-based position in its scope
 */
export function getQuizPosition(element, early = false) {
  const { questions, positions } = readScope(getQuizScope(element), early);
  return {
    number: (positions.get(element) ?? -1) + 1,
    total: questions.length,
  };
}

function dispatch(target, type) {
  const view = (target.ownerDocument ?? target).defaultView;
  if (!view) return;
  target.dispatchEvent(new view.CustomEvent(type, { bubbles: true }));
}

// One event for everything that asked since the last one. The counts made
// while it is handled are shared by its listeners and dropped afterwards.
function flushQuizChange(doc) {
  const batch = getBatch(doc);
  batch.pending = false;
  batch.early = null;
  const outer = batch.counts;
  batch.counts = new Map();
  try {
    dispatch(doc, QUIZ_CHANGE_EVENT);
  } finally {
    batch.counts = outer;
  }
}

/**
 * Tells listeners that a question was added, removed or checked. The event is
 * sent once for every call made in the same task, in a microtask after it.
 *
 * @param {Document} doc Document the question belongs to
 */
export function notifyQuizChange(doc) {
  const view = doc?.defaultView;
  if (!view) return;
  const batch = getBatch(doc);
  if (batch.pending) return;
  batch.pending = true;
  const flush = () => {
    // Already sent by `refreshQuiz`, which does not wait.
    if (batch.pending) flushQuizChange(doc);
  };
  view.queueMicrotask(flush);
}

/**
 * Asks every question and score on the page to count again. Call it after
 * code outside React has added, moved or removed quiz markup: the questions
 * renumber, the scores recount, and a question whose root has left the
 * document stops listening.
 *
 * The count is made at once, and includes any change that was still waiting
 * for its batch.
 *
 * @param {Document|Element} [context=document] Any node of the page
 * @param {Object} [options]
 * @param {boolean} [options.defer=false] Count after the current task has
 *   finished, for a caller that runs just before the markup is removed, such
 *   as a Drupal behavior's `detach`
 */
export function refreshQuiz(context = document, { defer = false } = {}) {
  const doc = context?.ownerDocument ?? context;
  if (!doc?.defaultView) return;
  if (defer) doc.defaultView.setTimeout(() => flushQuizChange(doc), 0);
  else flushQuizChange(doc);
}

/** Asks every question in the scope to return to its unanswered state. */
export function resetQuiz(scope) {
  dispatch(scope, QUIZ_RESET_EVENT);
}

/**
 * @param {Document} doc Document to listen on
 * @param {string} type Event name
 * @param {Function} listener Handler
 * @returns {Function} Unsubscribe
 */
export function onQuizEvent(doc, type, listener) {
  doc.addEventListener(type, listener);
  return () => doc.removeEventListener(type, listener);
}
