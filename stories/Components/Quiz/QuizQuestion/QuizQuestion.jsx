/**
 * @file QuizQuestion.jsx
 * @description One self-checking quiz question: multiple choice, true/false,
 * short answer or fill in the blank.
 *
 * @module QuizQuestion
 */

import React, { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { getLanguageProps } from '../../../../src/i18n';
import { Checkbox } from '../../Forms/Checkbox/Checkbox';
import { FormGroup } from '../../Forms/FormGroup/FormGroup';
import { Radio } from '../../Forms/Radio/Radio';
import { TextInput } from '../../Forms/TextInput/TextInput';
import { Notice } from '../../Notice/Notice';
import { formatQuizLabel, getQuizQuestionLabels } from '../_labels';
import {
  QUIZ_QUESTION_TYPES,
  gradeAnswer,
  isEmptyAnswer,
  parseBlankPrompt,
  trueFalseOptions,
} from '../quizGrading';
import {
  QUIZ_CHANGE_EVENT,
  QUIZ_RESET_EVENT,
  getQuizPosition,
  getQuizScope,
  notifyQuizChange,
  onQuizEvent,
} from '../quizScope';

export {
  DEFAULT_QUIZ_QUESTION_LABELS,
  getQuizQuestionLabels,
} from '../_labels';
export { gradeAnswer, QUIZ_QUESTION_TYPES } from '../quizGrading';

const EMPTY_LIST = [];
// A wrong answer is an invitation to try again, not an error, so it shares the
// quiet `info` variant with the empty attempt. The wording tells them apart.
const NOTICE_VARIANTS = {
  correct: 'positive',
  incorrect: 'info',
  empty: 'info',
};
// Punctuation written straight after a blank ("[1], Japan") stays on the
// blank's line when the sentence wraps.
const TRAILING_PUNCTUATION = /^[^\s\p{L}\p{N}]+/u;

const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

/** The figure that belongs to the question, from a node or trusted HTML. */
function QuestionMedia({ media, mediaHtml }) {
  if (media) return <div className="mg-quiz-question__media">{media}</div>;
  if (!mediaHtml) return null;
  return (
    <div
      className="mg-quiz-question__media"
      // eslint-disable-next-line react/no-danger -- caller-sanitized contract: server-rendered media markup read by fromElement, documented on the prop
      dangerouslySetInnerHTML={{ __html: mediaHtml }}
    />
  );
}

QuestionMedia.propTypes = {
  media: PropTypes.node,
  mediaHtml: PropTypes.string,
};

/**
 * QuizQuestion component.
 *
 * Checks the answer in the browser against the answer key in its props and
 * shows the result as a Notice. Nothing is stored or sent anywhere. The key is
 * readable in the page by design, so this is for engagement, never for
 * assessment.
 *
 * Each question publishes its state as `data-mg-quiz-state` on its root, which
 * is how QuizScore counts a page of independent questions.
 *
 * A correct answer locks the question: the controls become read-only and the
 * check button is removed. Changing an answer after any other attempt clears
 * the feedback and returns the question to unanswered, so a result never
 * outlives the answer it was given for.
 *
 * The answer key is optional in the props. Without a usable key no answer is
 * marked correct, except that `true_false` treats a missing `answer` as true.
 */
export function QuizQuestion({
  type = 'multiple_choice',
  prompt = '',
  options = EMPTY_LIST,
  multiple = false,
  answer,
  expected = EMPTY_LIST,
  caseSensitive = false,
  blanks = EMPTY_LIST,
  explanation,
  media,
  mediaHtml,
  number,
  total,
  showNumber = true,
  questionId,
  lang,
  dir,
  labels,
  onCheck,
  className,
  ...rest
}) {
  const safeType = QUIZ_QUESTION_TYPES.includes(type)
    ? type
    : 'multiple_choice';
  const isChoice = safeType === 'multiple_choice' || safeType === 'true_false';
  const isMultiple = safeType === 'multiple_choice' && multiple;
  const text = getQuizQuestionLabels(lang, labels);

  const rootRef = useRef(null);
  const feedbackRef = useRef(null);
  const focusFeedbackRef = useRef(false);
  const id = useId();
  const [selected, setSelected] = useState(EMPTY_LIST);
  const [texts, setTexts] = useState(EMPTY_LIST);
  const [result, setResult] = useState('unanswered');
  // `attempt` remounts the notice so a repeated message is announced again.
  const [feedback, setFeedback] = useState({ kind: null, attempt: 0 });
  const [position, setPosition] = useState(null);
  const locked = result === 'correct';

  const choices =
    safeType === 'true_false'
      ? trueFalseOptions({ answer, options }).map(option => ({
          ...option,
          label: option.value === 'true' ? text.trueLabel : text.falseLabel,
        }))
      : options;

  // Position among the questions that share this scope, unless given.
  useEffect(() => {
    const root = rootRef.current;
    const doc = root.ownerDocument;
    const measure = () => {
      const next = getQuizPosition(root);
      setPosition(current =>
        current?.number === next.number && current?.total === next.total
          ? current
          : next
      );
    };
    measure();
    const offChange = onQuizEvent(doc, QUIZ_CHANGE_EVENT, measure);
    const offReset = onQuizEvent(doc, QUIZ_RESET_EVENT, event => {
      if (event.target !== getQuizScope(root)) return;
      setSelected(EMPTY_LIST);
      setTexts(EMPTY_LIST);
      setResult('unanswered');
      setFeedback(current => ({ kind: null, attempt: current.attempt }));
    });
    return () => {
      offChange();
      offReset();
      // Runs after React has removed the root, so the count no longer has it.
      doc.defaultView?.queueMicrotask(() => notifyQuizChange(doc));
    };
  }, []);

  // The score reads the state attribute, so it is told after each commit.
  useEffect(() => {
    notifyQuizChange(rootRef.current.ownerDocument);
    // The check button has just left the page. Focus goes to the feedback so
    // that it is not dropped on the body.
    if (result === 'correct' && focusFeedbackRef.current) {
      feedbackRef.current?.focus();
    }
    focusFeedbackRef.current = false;
  }, [result]);

  // A result or a prompt describes the answer as it was when it was checked.
  const clearAttempt = () => {
    setResult('unanswered');
    setFeedback(current =>
      current.kind ? { kind: null, attempt: current.attempt } : current
    );
  };

  const collectAnswer = () => {
    if (safeType === 'text') return texts[0] ?? '';
    if (safeType === 'fill_blank') {
      return blanks.map((blank, index) => texts[index] ?? '');
    }
    return isMultiple ? selected : (selected[0] ?? '');
  };

  const handleCheck = () => {
    if (locked) return;
    const submitted = collectAnswer();
    if (isEmptyAnswer(submitted)) {
      setFeedback(current => ({ kind: 'empty', attempt: current.attempt + 1 }));
      return;
    }
    const correct = gradeAnswer(
      {
        type: safeType,
        options: choices,
        answer,
        expected,
        caseSensitive,
        blanks,
      },
      submitted
    );
    if (correct) {
      const root = rootRef.current;
      const active = root.ownerDocument.activeElement;
      focusFeedbackRef.current =
        active?.closest?.('.mg-quiz-question__actions') != null &&
        root.contains(active);
    }
    setResult(correct ? 'correct' : 'incorrect');
    setFeedback(current => ({
      kind: correct ? 'correct' : 'incorrect',
      attempt: current.attempt + 1,
    }));
    onCheck?.({
      correct,
      answer: submitted,
      ...(questionId ? { questionId } : {}),
    });
  };

  const handleChoice = event => {
    if (locked) return;
    const { value, checked } = event.target;
    clearAttempt();
    setSelected(current => {
      if (!isMultiple) return [value];
      return checked
        ? [...current, value]
        : current.filter(item => item !== value);
    });
  };

  const setText = (index, value) => {
    if (locked) return;
    clearAttempt();
    setTexts(current => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  // A question is not a form, so Enter in a text field checks the answer.
  const handleTextKeyDown = event => {
    if (event.key === 'Enter' && !event.nativeEvent?.isComposing) {
      event.preventDefault();
      handleCheck();
    }
  };

  const resolvedNumber = number ?? position?.number;
  const resolvedTotal = total ?? position?.total;
  // A lone question is not "Question 1 of 1" unless the consumer numbers it.
  const numberText =
    showNumber && resolvedNumber > 0 && (number != null || resolvedTotal > 1)
      ? formatQuizLabel(text.questionNumber, {
          number: resolvedNumber,
          total: resolvedTotal ?? resolvedNumber,
        })
      : null;

  // One primary action per view: on a page of questions each card's check
  // button steps back to an outline, and only a lone question keeps primary.
  const checkClass =
    resolvedTotal > 1
      ? 'mg-button mg-button-secondary mg-button-outline'
      : 'mg-button mg-button-primary';

  const hintId = `${id}-hint`;
  const promptId = `${id}-prompt`;
  const blankLabel = index =>
    blanks[index]?.label?.trim() ||
    formatQuizLabel(text.blankLabel, {
      number: index + 1,
      total: blanks.length,
    });

  let body;
  if (isChoice) {
    const Control = isMultiple ? Checkbox : Radio;
    body = (
      <FormGroup
        className="mg-quiz-question__group"
        legend={prompt}
        aria-describedby={isMultiple ? hintId : undefined}
      >
        {isMultiple && (
          <p className="mg-form-help mg-quiz-question__hint" id={hintId}>
            {text.selectAll}
          </p>
        )}
        <QuestionMedia media={media} mediaHtml={mediaHtml} />
        <div className="mg-quiz-question__options">
          {choices.map((option, index) => (
            <Control
              key={String(option.value)}
              id={`${id}-option-${index}`}
              className="mg-quiz-question__option"
              name={`${id}-answer`}
              value={String(option.value)}
              label={option.label}
              checked={selected.includes(String(option.value))}
              onChange={handleChoice}
              // Read-only, not disabled: the chosen answer keeps its place in
              // the tab order and its full contrast.
              aria-disabled={locked || undefined}
            />
          ))}
        </div>
      </FormGroup>
    );
  } else if (safeType === 'fill_blank') {
    const { parts, inline } = parseBlankPrompt(prompt, blanks.length);
    // Each blank takes the punctuation that follows it into one unit.
    const sentenceParts = [];
    parts.forEach((part, index) => {
      if ('blank' in part) {
        const next = parts[index + 1];
        const after =
          next && 'text' in next
            ? (next.text.match(TRAILING_PUNCTUATION)?.[0] ?? '')
            : '';
        sentenceParts.push({ blank: part.blank, after });
        return;
      }
      const previous = sentenceParts[sentenceParts.length - 1];
      const taken = previous && 'blank' in previous ? previous.after.length : 0;
      const rest = part.text.slice(taken);
      if (rest) sentenceParts.push({ text: rest });
    });
    const below = blanks
      .map((blank, index) => index)
      .filter(index => !inline.includes(index));
    body = (
      <FormGroup
        // The instruction is the legend and the sentence carries the blanks.
        // With no blank placed in the sentence, the prompt is the legend and
        // the blanks are listed under it.
        className={joinClasses(
          'mg-quiz-question__group',
          inline.length > 0 && 'mg-quiz-question__group--sentence'
        )}
        legend={inline.length > 0 ? text.fillBlankLegend : prompt}
      >
        <QuestionMedia media={media} mediaHtml={mediaHtml} />
        {inline.length > 0 && (
          <p className="mg-quiz-question__sentence">
            {sentenceParts.map((part, index) =>
              'text' in part ? (
                <span key={`text-${index}`}>{part.text}</span>
              ) : (
                <span
                  key={`blank-${part.blank}`}
                  className="mg-quiz-question__blank-unit"
                >
                  <input
                    className="mg-form-input mg-quiz-question__blank"
                    type="text"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-label={blankLabel(part.blank)}
                    value={texts[part.blank] ?? ''}
                    readOnly={locked}
                    onChange={event => setText(part.blank, event.target.value)}
                    onKeyDown={handleTextKeyDown}
                  />
                  {part.after}
                </span>
              )
            )}
          </p>
        )}
        {below.length > 0 && (
          <div className="mg-quiz-question__fields">
            {below.map(index => (
              <TextInput
                key={index}
                id={`${id}-blank-${index}`}
                className="mg-quiz-question__field"
                label={blankLabel(index)}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={texts[index] ?? ''}
                readOnly={locked}
                onChange={event => setText(index, event.target.value)}
                onKeyDown={handleTextKeyDown}
              />
            ))}
          </div>
        )}
      </FormGroup>
    );
  } else {
    body = (
      <div className="mg-quiz-question__group">
        <label
          className="mg-quiz-question__prompt"
          id={promptId}
          htmlFor={`${id}-answer`}
        >
          {prompt}
        </label>
        <QuestionMedia media={media} mediaHtml={mediaHtml} />
        <TextInput
          id={`${id}-answer`}
          className="mg-quiz-question__field"
          aria-labelledby={promptId}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={texts[0] ?? ''}
          readOnly={locked}
          onChange={event => setText(0, event.target.value)}
          onKeyDown={handleTextKeyDown}
        />
      </div>
    );
  }

  let feedbackTitle = null;
  if (feedback.kind === 'correct') feedbackTitle = text.correct;
  if (feedback.kind === 'incorrect') feedbackTitle = text.incorrectMessage;
  if (feedback.kind === 'empty') {
    feedbackTitle = isChoice ? text.emptyChoice : text.emptyText;
  }

  return (
    <div
      ref={rootRef}
      className={joinClasses(
        'mg-quiz-question',
        `mg-quiz-question--${safeType.replace('_', '-')}`,
        result !== 'unanswered' && `mg-quiz-question--${result}`,
        className
      )}
      data-mg-quiz-state={result}
      data-mg-quiz-id={questionId || undefined}
      {...getLanguageProps(lang, dir)}
      {...rest}
    >
      {numberText && (
        <div className="mg-quiz-question__header">
          <p className="mg-quiz-question__number">{numberText}</p>
        </div>
      )}
      {body}
      {!locked && (
        <div className="mg-quiz-question__actions">
          <button
            type="button"
            className={`${checkClass} mg-quiz-question__check`}
            data-vf-analytics-label="Quiz: Check answer"
            onClick={handleCheck}
          >
            {text.checkAnswer}
          </button>
        </div>
      )}
      <div
        ref={feedbackRef}
        className="mg-quiz-question__feedback"
        aria-live="polite"
        // Takes focus when a correct answer removes the check button.
        tabIndex={-1}
      >
        {feedback.kind && (
          <Notice
            key={feedback.attempt}
            variant={NOTICE_VARIANTS[feedback.kind]}
            // The wrapper is the live region; a second one would announce twice.
            role={null}
            headerContent={
              <p className="mg-notice__title mg-quiz-question__feedback-title">
                {feedbackTitle}
              </p>
            }
          >
            {feedback.kind === 'correct' && explanation ? (
              <p className="mg-quiz-question__explanation">{explanation}</p>
            ) : null}
          </Notice>
        )}
      </div>
    </div>
  );
}

QuizQuestion.propTypes = {
  /** Question type. The values match the Drupal grader types. */
  type: PropTypes.oneOf(QUIZ_QUESTION_TYPES),
  /** The question, as plain text. Line breaks are kept. For `fill_blank`, write `[1]`, `[2]` where each blank belongs in the sentence. */
  prompt: PropTypes.string.isRequired,
  /** Options for `multiple_choice`: a unique `value`, a visible `label`, and `correct: true` on each right answer. */
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string,
      correct: PropTypes.bool,
    })
  ),
  /** `multiple_choice` only: several options are correct, so the question uses checkboxes and says "Select all that apply". */
  multiple: PropTypes.bool,
  /** `true_false` only: whether the statement is true. The True and False labels come from the language catalogue. */
  answer: PropTypes.bool,
  /** `text` only: every accepted answer. */
  expected: PropTypes.arrayOf(PropTypes.string),
  /** `text` only: match letter case exactly. Whitespace and Unicode form are always normalized. */
  caseSensitive: PropTypes.bool,
  /** `fill_blank` only: one entry per blank, in order, with its accepted answers, optional case sensitivity and an optional label used as the input's accessible name. */
  blanks: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      expected: PropTypes.arrayOf(PropTypes.string),
      caseSensitive: PropTypes.bool,
    })
  ),
  /** Optional plain-text explanation shown with the "Correct" feedback, to say why the answer is right. */
  explanation: PropTypes.string,
  /** Optional image or figure that belongs to the question, shown between the prompt and the answer controls. */
  media: PropTypes.node,
  /** Server-rendered media markup, used by hydration in place of `media`. Inserted as HTML: pass only markup the server has already sanitized. */
  mediaHtml: PropTypes.string,
  /** Position of the question. Left out, it is counted from the questions that share the page or the nearest `data-mg-quiz` wrapper. */
  number: PropTypes.number,
  /** Number of questions. Left out, it is counted in the same way as `number`. */
  total: PropTypes.number,
  /** Show "Question 2 of 5" above the prompt. A question on its own is not numbered unless `number` is passed. */
  showNumber: PropTypes.bool,
  /** Optional stable identifier for the question, for consumers that tie a result to a question. Reflected as `data-mg-quiz-id` on the root and passed to `onCheck`. DOM ids and radio names do not use it, so the same question can appear twice on a page. */
  questionId: PropTypes.string,
  /** Language of the built-in labels (en, ar, es, fr, ja, ru, zh), including regional tags. */
  lang: PropTypes.string,
  /** Explicit text direction. Arabic selects right-to-left without it. */
  dir: PropTypes.oneOf(['ltr', 'rtl', 'auto']),
  /** Overrides for individual built-in labels. */
  labels: PropTypes.shape({
    checkAnswer: PropTypes.string,
    correct: PropTypes.string,
    incorrectMessage: PropTypes.string,
    emptyChoice: PropTypes.string,
    emptyText: PropTypes.string,
    questionNumber: PropTypes.string,
    selectAll: PropTypes.string,
    fillBlankLegend: PropTypes.string,
    blankLabel: PropTypes.string,
    trueLabel: PropTypes.string,
    falseLabel: PropTypes.string,
  }),
  /** Called after each graded attempt with `{ correct, answer }`, and `questionId` when the question has one. An empty attempt is not graded and does not call it. A correct answer locks the question, so it is the last call until the quiz is started again. */
  onCheck: PropTypes.func,
  /** Additional CSS class names for the root. */
  className: PropTypes.string,
};

export default QuizQuestion;
