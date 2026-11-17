import { labelsFromElement, languageFromElement } from '../../../../src/i18n';
import { cleanQuizLabels } from '../_labels';
import { QUIZ_QUESTION_TYPES, trueFalseKey } from '../quizGrading';

const isObject = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

// Text that can be shown or compared: a string or a finite number.
const isText = value =>
  typeof value === 'string' || (typeof value === 'number' && isFinite(value));

const text = value => (isText(value) ? String(value) : '');

const texts = value =>
  (Array.isArray(value) ? value : [value]).filter(isText).map(String);

const fail = reason => {
  throw new Error(`QuizQuestion: ${reason}`);
};

/**
 * Extract QuizQuestion props from a hydration container.
 *
 * The question, including its answer key, is one JSON object in
 * `data-question`. Its optional `id` becomes the `questionId` prop.
 *
 * The data is checked here, before anything mounts. A container whose
 * question cannot be shown as written throws, which leaves the markup inside
 * it in place: the visitor keeps a readable question and never sees a check
 * button that cannot work. That covers JSON that does not parse, an unknown
 * type, a prompt that is not text, a multiple-choice question with no usable
 * option and a fill-in-the-blank question whose blanks are missing or
 * malformed. Smaller faults are dropped and the question still mounts: an
 * option that is not an object or has nothing to show, an accepted answer
 * that is not text, a `hint` that is not a string, a `showAnswer` that is not
 * the boolean `true`, a label override that is not a non-empty string.
 *
 * The markup inside the container is the no-JavaScript state. It is handed to
 * the component as `serverFallback`, by reference: the component moves the
 * existing `.mg-quiz-question__media` element into itself and puts the whole
 * fallback back when it unmounts or fails to render. This function reads the
 * container and changes nothing in it.
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
  if (!isObject(question) || !QUIZ_QUESTION_TYPES.includes(question.type)) {
    fail('data-question is missing, is not valid JSON or has an unknown type.');
  }
  if (text(question.prompt).trim() === '') {
    fail('data-question has no prompt, or its prompt is not text.');
  }

  const props = {
    ...languageFromElement(container),
    type: question.type,
    prompt: text(question.prompt),
  };

  if (question.type === 'multiple_choice') {
    props.multiple = question.multiple === true;
    props.options = (Array.isArray(question.options) ? question.options : [])
      .filter(isObject)
      .map(option => ({
        value: text(option.value),
        label: text(option.label).trim() ? text(option.label) : '',
        correct: option.correct === true,
      }))
      // The value stands in for a missing label. With neither, there is
      // nothing to show.
      .map(option => ({ ...option, label: option.label || option.value }))
      .filter(option => option.label.trim() !== '');
    if (props.options.length === 0) {
      fail('a multiple_choice question needs at least one usable option.');
    }
  } else if (question.type === 'true_false') {
    // Booleans and the strings "true" and "false" only. Anything else is no
    // key at all: `answer` is left out and no answer is marked correct.
    const key = trueFalseKey({
      answer: question.answer,
      options: (Array.isArray(question.options) ? question.options : []).filter(
        isObject
      ),
    });
    if (key !== null) props.answer = key;
  } else if (question.type === 'text') {
    props.expected = texts(question.expected);
    props.caseSensitive = question.caseSensitive === true;
  } else {
    const blanks = Array.isArray(question.blanks) ? question.blanks : [];
    // The position of a blank is its number in the prompt, so a malformed
    // entry cannot be dropped without moving the others.
    if (blanks.length === 0 || !blanks.every(isObject)) {
      fail('a fill_blank question needs a list of blanks, each an object.');
    }
    props.blanks = blanks.map(blank => ({
      ...(text(blank.label).trim() ? { label: text(blank.label) } : {}),
      expected: texts(blank.expected),
      caseSensitive: blank.caseSensitive === true,
    }));
  }

  if (text(question.explanation).trim()) {
    props.explanation = text(question.explanation);
  }
  // A hint is text an editor wrote, so only a string is one. "Show answer" is
  // offered for the boolean `true` alone: a string or a number is a mistake
  // in the data, and a mistake must not put the answer on screen.
  if (typeof question.hint === 'string' && question.hint.trim() !== '') {
    props.hint = question.hint;
  }
  if (question.showAnswer === true) props.showAnswer = true;
  if (text(question.id).trim() !== '') props.questionId = text(question.id);

  const number = parseInt(dataset.number, 10);
  const total = parseInt(dataset.total, 10);
  if (number > 0) props.number = number;
  if (total > 0) props.total = total;
  if (dataset.showNumber === 'false') props.showNumber = false;

  const labels = cleanQuizLabels(labelsFromElement(container));
  if (labels) props.labels = labels;

  const media = container.querySelector('.mg-quiz-question__media');
  props.serverFallback = {
    container,
    nodes: Array.from(container.childNodes),
    media:
      media && (media.children.length > 0 || media.textContent.trim() !== '')
        ? media
        : null,
  };

  return props;
}
