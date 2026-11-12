/**
 * Page-level coordination between quiz questions and the quiz score.
 *
 * Questions are independent blocks in the page flow, each possibly its own
 * React root, so they cannot share React state. The document is the shared
 * state instead: every question carries `data-mg-quiz-state` on its root, and
 * a `mg-quiz:change` event tells listeners to count again. That survives
 * questions arriving or leaving in batches (AJAX, BigPipe) and more than one
 * copy of this module on a page.
 *
 * A scope is the nearest `[data-mg-quiz]` ancestor, or the whole document for
 * questions that have none.
 */

export const QUIZ_SCOPE_SELECTOR = '[data-mg-quiz]';
export const QUIZ_QUESTION_SELECTOR = '.mg-quiz-question';
export const QUIZ_CHANGE_EVENT = 'mg-quiz:change';
export const QUIZ_RESET_EVENT = 'mg-quiz:reset';

/**
 * @param {Element} element Question or score element
 * @returns {Element|Document} Its scope
 */
export function getQuizScope(element) {
  return element.closest(QUIZ_SCOPE_SELECTOR) ?? element.ownerDocument;
}

/**
 * @param {Element|Document} scope Scope to search
 * @returns {Element[]} Question roots that belong to the scope, in document order
 */
export function getQuizQuestions(scope) {
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

/**
 * @param {Element|Document} scope Scope to count
 * @returns {{total: number, answered: number, correct: number}} Current score
 */
export function getQuizSummary(scope) {
  const questions = getQuizQuestions(scope);
  const states = questions.map(question => question.dataset.mgQuizState);
  const correct = states.filter(state => state === 'correct').length;
  const incorrect = states.filter(state => state === 'incorrect').length;
  return { total: questions.length, answered: correct + incorrect, correct };
}

/**
 * @param {Element} element Question root
 * @returns {{number: number, total: number}} One-based position in its scope
 */
export function getQuizPosition(element) {
  const questions = getQuizQuestions(getQuizScope(element));
  return { number: questions.indexOf(element) + 1, total: questions.length };
}

function dispatch(target, type) {
  const view = (target.ownerDocument ?? target).defaultView;
  if (!view) return;
  target.dispatchEvent(new view.CustomEvent(type, { bubbles: true }));
}

/** Tells listeners that a question was added, removed or checked. */
export function notifyQuizChange(doc) {
  dispatch(doc, QUIZ_CHANGE_EVENT);
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
