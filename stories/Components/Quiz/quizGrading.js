/**
 * Grading rules for quiz questions.
 *
 * Pure functions with no DOM or React dependency, so a consumer can run the
 * same rules elsewhere. They mirror the Drupal `undrr_training` runtime
 * (undrr/web-backlog#3129): text matching trims and collapses whitespace,
 * normalizes Unicode to NFC and ignores case unless the question says
 * otherwise; a choice question needs exactly the correct set of options.
 */

export const QUIZ_QUESTION_TYPES = [
  'multiple_choice',
  'true_false',
  'text',
  'fill_blank',
];

/**
 * Normalizes text for comparison.
 *
 * @param {*} value Submitted or expected text
 * @param {boolean} caseSensitive Keep letter case
 * @returns {string} Comparable text
 */
export function normalizeText(value, caseSensitive) {
  const trimmed = String(value === undefined || value === null ? '' : value)
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ');
  return caseSensitive ? trimmed : trimmed.toLowerCase();
}

// Accepted answers as a list, tolerating a hand-edited scalar value.
function toList(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Whether the visitor has not answered at all: nothing selected, or every
 * text field blank. Such an attempt is neither graded nor counted.
 *
 * @param {string|string[]} answer Collected answer
 * @returns {boolean} True when there is nothing to grade
 */
export function isEmptyAnswer(answer) {
  const values = Array.isArray(answer) ? answer : [answer];
  return values.every(value => String(value ?? '').trim() === '');
}

function gradeChoice(question, submitted) {
  const correct = (question.options || [])
    .filter(option => option.correct === true)
    .map(option => String(option.value))
    .sort();
  const selected = (Array.isArray(submitted) ? submitted : [submitted])
    .map(String)
    .filter(value => value !== '')
    .sort();
  return (
    correct.length > 0 && JSON.stringify(correct) === JSON.stringify(selected)
  );
}

function gradeText(question, submitted) {
  if (Array.isArray(submitted)) return false;
  const caseSensitive = Boolean(question.caseSensitive);
  const needle = normalizeText(submitted, caseSensitive);
  if (needle === '') return false;
  return toList(question.expected).some(
    expected => normalizeText(expected, caseSensitive) === needle
  );
}

function gradeFillBlank(question, submitted) {
  const blanks = question.blanks || [];
  if (blanks.length === 0) return false;
  const answers = Array.isArray(submitted) ? submitted : [submitted];
  if (answers.length !== blanks.length) return false;
  return blanks.every((blank, index) =>
    gradeText(
      {
        expected: toList(blank.expected),
        caseSensitive: Boolean(blank.caseSensitive),
      },
      String(answers[index] ?? '')
    )
  );
}

/**
 * The two options of a true/false question, from either form of the key:
 * `answer: true` or the legacy `options` pair with `correct` flags.
 *
 * @param {Object} question Question definition
 * @returns {{value: string, correct: boolean}[]} The true and false options
 */
export function trueFalseOptions(question) {
  let answer = question.answer;
  if (typeof answer !== 'boolean') {
    const legacy = (question.options || []).find(
      option => option.correct === true
    );
    answer = legacy ? String(legacy.value) !== 'false' : true;
  }
  return [
    { value: 'true', correct: answer },
    { value: 'false', correct: !answer },
  ];
}

/**
 * Grades an answer against a question definition. Unknown types never pass.
 *
 * @param {Object} question Question definition, including its answer key
 * @param {string|string[]} submitted One value, or a list for multiple
 *   selection and fill in the blank
 * @returns {boolean} Whether the answer is correct
 */
export function gradeAnswer(question, submitted) {
  switch (question.type) {
    case 'multiple_choice':
      return gradeChoice(question, submitted);
    case 'true_false':
      return gradeChoice({ options: trueFalseOptions(question) }, submitted);
    case 'text':
      return gradeText(question, submitted);
    case 'fill_blank':
      return gradeFillBlank(question, submitted);
    default:
      return false;
  }
}

/**
 * Splits a fill-in-the-blank prompt into text and blank parts. `[1]` refers
 * to the first blank. A reference to a blank that does not exist, or a second
 * reference to the same blank, stays as text.
 *
 * @param {string} prompt Prompt such as "Adopted in [1], Japan, in [2]."
 * @param {number} blankCount Number of blanks the question defines
 * @returns {{parts: Array<{text: string}|{blank: number}>, inline: number[]}}
 *   The parts in order, and the zero-based indexes of blanks placed inline
 */
export function parseBlankPrompt(prompt, blankCount) {
  const parts = [];
  const inline = [];
  const pattern = /\[(\d+)\]/g;
  const source = String(prompt ?? '');
  let last = 0;
  let match = pattern.exec(source);
  const pushText = text => {
    if (!text) return;
    const previous = parts[parts.length - 1];
    if (previous && 'text' in previous) previous.text += text;
    else parts.push({ text });
  };
  while (match) {
    const index = Number(match[1]) - 1;
    pushText(source.slice(last, match.index));
    if (index >= 0 && index < blankCount && !inline.includes(index)) {
      parts.push({ blank: index });
      inline.push(index);
    } else {
      pushText(match[0]);
    }
    last = match.index + match[0].length;
    match = pattern.exec(source);
  }
  pushText(source.slice(last));
  return { parts, inline };
}
