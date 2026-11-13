/**
 * Grading rules for quiz questions.
 *
 * Pure functions with no DOM or React dependency, so a consumer can run the
 * same rules elsewhere. They are based on the Drupal `undrr_training` runtime
 * (undrr/web-backlog#3129): text matching trims and collapses whitespace and
 * ignores case unless the question says otherwise; a choice question needs
 * exactly the correct set of options. Text matching here also folds Unicode
 * compatibility forms (NFKC) and drops zero-width characters.
 *
 * A question with no usable answer key never passes, whatever its type.
 */

export const QUIZ_QUESTION_TYPES = [
  'multiple_choice',
  'true_false',
  'text',
  'fill_blank',
];

// Zero-width space, non-joiner and joiner, word joiner and the byte-order
// mark: invisible characters that arrive with pasted text.
const ZERO_WIDTH = /[\u200B-\u200D\u2060\uFEFF]/g;

/**
 * Normalizes text for comparison.
 *
 * NFKC folds characters that differ only in width or presentation, so
 * full-width digits and letters from a Japanese or Chinese keyboard match
 * their ASCII forms, and composed and decomposed accents match each other.
 * Zero-width characters are removed, whitespace is trimmed and collapsed, and
 * case is ignored with `toLowerCase()` unless `caseSensitive` is set.
 *
 * Limits: there is no language-specific case folding, so `ß` does not match
 * `SS` and a dotted capital `İ` does not match `i`. Accents are significant,
 * and digits of other scripts (Arabic-Indic `٢`) do not match ASCII digits.
 * List each form as its own accepted answer.
 *
 * @param {*} value Submitted or expected text
 * @param {boolean} caseSensitive Keep letter case
 * @returns {string} Comparable text
 */
export function normalizeText(value, caseSensitive) {
  const trimmed = String(value === undefined || value === null ? '' : value)
    .normalize('NFKC')
    .replace(ZERO_WIDTH, '')
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
    .filter(option => option?.correct === true)
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
        expected: toList(blank?.expected),
        caseSensitive: Boolean(blank?.caseSensitive),
      },
      String(answers[index] ?? '')
    )
  );
}

/**
 * Reads one form of a true/false key.
 *
 * @param {*} value A boolean, or the string "true" or "false" in any case
 * @returns {boolean|null} The key, or null for anything else
 */
export function parseTrueFalse(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return null;
  const text = value.toLowerCase();
  if (text === 'true') return true;
  if (text === 'false') return false;
  return null;
}

/**
 * The key of a true/false question, from either form: `answer`, or the legacy
 * `options` pair with values "true" and "false" and one `correct` flag.
 *
 * @param {Object} question Question definition
 * @returns {boolean|null} The key, or null when the question has no usable one
 */
export function trueFalseKey(question) {
  const answer = parseTrueFalse(question.answer);
  if (answer !== null) return answer;
  const flagged = new Set(
    (Array.isArray(question.options) ? question.options : [])
      .filter(option => option && option.correct === true)
      .map(option => parseTrueFalse(option.value))
  );
  // One option flagged, and it is recognizably true or false.
  if (flagged.size !== 1) return null;
  return [...flagged][0];
}

/**
 * The two options of a true/false question. Without a usable key neither is
 * correct, so no answer passes.
 *
 * @param {Object} question Question definition
 * @returns {{value: string, correct: boolean}[]} The true and false options
 */
export function trueFalseOptions(question) {
  const key = trueFalseKey(question);
  return [
    { value: 'true', correct: key === true },
    { value: 'false', correct: key === false },
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
 * to the first blank. Each blank appears once, at its first reference. A
 * second reference to the same blank, or a reference to a blank that does not
 * exist, is left out, so a marker is never shown to the visitor.
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
    }
    last = match.index + match[0].length;
    match = pattern.exec(source);
  }
  pushText(source.slice(last));
  return { parts, inline };
}
