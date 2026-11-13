import { labelsFromElement, languageFromElement } from '../../../../src/i18n';
import { QUIZ_QUESTION_TYPES } from '../quizGrading';

const strings = value =>
  (Array.isArray(value) ? value : value == null ? [] : [value]).map(String);

/**
 * Extract QuizQuestion props from a hydration container.
 *
 * The question, including its answer key, is one JSON object in
 * `data-question`. Its optional `id` becomes the `questionId` prop. The markup
 * inside the container is the no-JavaScript state; only its media element is
 * carried over. A container without a
 * readable question throws, which leaves that markup in place: the visitor
 * keeps a readable question and never sees a check button that cannot work.
 *
 * @param {HTMLElement} container Element marked `data-mg-quiz-question`
 * @returns {Object} Props for QuizQuestion
 */
export default function quizQuestionFromElement(container) {
  const { dataset } = container;
  let question;
  try {
    question = JSON.parse(dataset.question);
  } catch {
    question = null;
  }
  if (
    !question ||
    typeof question !== 'object' ||
    !QUIZ_QUESTION_TYPES.includes(question.type)
  ) {
    throw new Error(
      'QuizQuestion: data-question is missing, is not valid JSON or has an unknown type.'
    );
  }

  const props = {
    ...languageFromElement(container),
    type: question.type,
    prompt: String(question.prompt ?? ''),
  };

  if (question.type === 'multiple_choice') {
    props.multiple = question.multiple === true;
    props.options = (
      Array.isArray(question.options) ? question.options : []
    ).map(option => ({
      value: String(option.value),
      label: String(option.label ?? option.value),
      correct: option.correct === true,
    }));
  } else if (question.type === 'true_false') {
    if (typeof question.answer === 'boolean') props.answer = question.answer;
    else if (Array.isArray(question.options)) props.options = question.options;
  } else if (question.type === 'text') {
    props.expected = strings(question.expected);
    props.caseSensitive = question.caseSensitive === true;
  } else {
    props.blanks = (Array.isArray(question.blanks) ? question.blanks : []).map(
      blank => ({
        ...(blank.label ? { label: String(blank.label) } : {}),
        expected: strings(blank.expected),
        caseSensitive: blank.caseSensitive === true,
      })
    );
  }

  if (question.explanation) props.explanation = String(question.explanation);
  if (
    (typeof question.id === 'string' || typeof question.id === 'number') &&
    String(question.id).trim() !== ''
  ) {
    props.questionId = String(question.id);
  }

  const media = container.querySelector('.mg-quiz-question__media');
  if (media && media.innerHTML.trim()) props.mediaHtml = media.innerHTML;

  const number = parseInt(dataset.number, 10);
  const total = parseInt(dataset.total, 10);
  if (number > 0) props.number = number;
  if (total > 0) props.total = total;
  if (dataset.showNumber === 'false') props.showNumber = false;

  const labels = labelsFromElement(container);
  if (labels) props.labels = labels;

  return props;
}
