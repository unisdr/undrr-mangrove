import { labelsFromElement, languageFromElement } from '../../../../src/i18n';
import { cleanQuizLabels } from '../_labels';
import { refreshQuiz } from '../quizScope';

/**
 * Extract QuizScore props from a hydration container.
 *
 * @param {HTMLElement} container Element marked `data-mg-quiz-score`
 * @returns {Object} Props for QuizScore
 */
export default function quizScoreFromElement(container) {
  const { dataset } = container;
  const labels = cleanQuizLabels(labelsFromElement(container));
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
 * `[data-mg-quiz-score]`, and again whenever questions are added or removed.
 *
 * Only the scopes that have a question container inside `context` are
 * touched, so a Drupal behavior can pass the context it was attached with.
 * Each of those scopes is still measured as a whole: the score goes after the
 * last question container of the scope, wherever that is on the page. A
 * question container counts whether or not it has mounted, so the score stays
 * below a question that is showing its server-rendered fallback.
 *
 * A container the consumer rendered itself is left where it is. A container
 * this function created is moved so it stays after the last question.
 *
 * Every call ends by asking the questions and scores on the page to count
 * again, so it doubles as the "the page changed" signal.
 *
 * @param {Document|Element} [context=document] Where to look for questions
 * @returns {HTMLElement[]} Score containers created by this call
 */
export function ensureQuizScoreHost(context = document) {
  const doc = context.ownerDocument ?? context;
  const scopeOf = host => host.closest(SCOPE) ?? doc;
  // A container inside another question's markup never mounts on its own.
  const isQuestion = host => host.parentElement?.closest(QUESTION_HOST) == null;

  const found = Array.from(context.querySelectorAll(QUESTION_HOST));
  if (context.matches?.(QUESTION_HOST)) found.unshift(context);
  const scopes = new Set(found.filter(isQuestion).map(scopeOf));

  const created = [];
  scopes.forEach(scope => {
    const hosts = Array.from(scope.querySelectorAll(QUESTION_HOST)).filter(
      host => isQuestion(host) && scopeOf(host) === scope
    );
    const last = hosts[hosts.length - 1];
    const existing = Array.from(scope.querySelectorAll(SCORE_HOST)).find(
      host => scopeOf(host) === scope
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
  refreshQuiz(doc);
  return created;
}
