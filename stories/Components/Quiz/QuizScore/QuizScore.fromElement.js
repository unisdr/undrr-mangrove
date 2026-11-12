import { labelsFromElement, languageFromElement } from '../../../../src/i18n';

/**
 * Extract QuizScore props from a hydration container.
 *
 * @param {HTMLElement} container Element marked `data-mg-quiz-score`
 * @returns {Object} Props for QuizScore
 */
export default function quizScoreFromElement(container) {
  const { dataset } = container;
  const labels = labelsFromElement(container);
  return {
    ...languageFromElement(container),
    ...(dataset.showProgress === 'false' ? { showProgress: false } : {}),
    ...(dataset.showReset === 'false' ? { showReset: false } : {}),
    ...(labels ? { labels } : {}),
  };
}

const QUESTION_HOST = '[data-mg-quiz-question]';
const SCORE_HOST = '[data-mg-quiz-score]';
const SCOPE = '[data-mg-quiz]';

/**
 * Makes sure each group of quiz questions has a score container after its
 * last question, for consumers whose questions are independent blocks with no
 * template that knows which one is last. Call it before hydrating
 * `[data-mg-quiz-score]`, and again whenever questions are added.
 *
 * A container the consumer rendered itself is left where it is. A container
 * this function created is moved so it stays after the last question.
 *
 * @param {Document|Element} [context=document] Where to look for questions
 * @returns {HTMLElement[]} Score containers created by this call
 */
export function ensureQuizScoreHost(context = document) {
  const doc = context.ownerDocument ?? context;
  const groups = new Map();
  doc.querySelectorAll(QUESTION_HOST).forEach(host => {
    const scope = host.closest(SCOPE) ?? doc;
    groups.set(scope, host);
  });

  const created = [];
  groups.forEach((last, scope) => {
    const existing = Array.from(scope.querySelectorAll(SCORE_HOST)).find(
      host => (host.closest(SCOPE) ?? doc) === scope
    );
    if (existing && !existing.hasAttribute('data-mg-quiz-score-auto')) return;
    if (existing) {
      if (last.nextElementSibling !== existing) last.after(existing);
      return;
    }
    const host = doc.createElement('div');
    host.setAttribute('data-mg-quiz-score', '');
    host.setAttribute('data-mg-quiz-score-auto', '');
    last.after(host);
    created.push(host);
  });
  return created;
}
