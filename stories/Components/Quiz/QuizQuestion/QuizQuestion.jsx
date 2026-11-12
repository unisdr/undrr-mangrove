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
const NOTICE_VARIANTS = {
  correct: 'positive',
  incorrect: 'negative',
  empty: 'info',
};

const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

const CorrectIcon = () => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M16.59 7.58 10 14.17l-3.59-3.58L5 12l5 5 8-8zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
  </svg>
);

const IncorrectIcon = () => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M7 11h10v2H7zm5-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
  </svg>
);

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
  const id = useId();
  const [selected, setSelected] = useState(EMPTY_LIST);
  const [texts, setTexts] = useState(EMPTY_LIST);
  const [result, setResult] = useState('unanswered');
  // `attempt` remounts the notice so a repeated message is announced again.
  const [feedback, setFeedback] = useState({ kind: null, attempt: 0 });
  const [position, setPosition] = useState(null);

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
  }, [result]);

  const collectAnswer = () => {
    if (safeType === 'text') return texts[0] ?? '';
    if (safeType === 'fill_blank') {
      return blanks.map((blank, index) => texts[index] ?? '');
    }
    return isMultiple ? selected : (selected[0] ?? '');
  };

  const handleCheck = () => {
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
    setResult(correct ? 'correct' : 'incorrect');
    setFeedback(current => ({
      kind: correct ? 'correct' : 'incorrect',
      attempt: current.attempt + 1,
    }));
    onCheck?.({ correct, answer: submitted });
  };

  const handleChoice = event => {
    const { value, checked } = event.target;
    setSelected(current => {
      if (!isMultiple) return [value];
      return checked
        ? [...current, value]
        : current.filter(item => item !== value);
    });
  };

  const setText = (index, value) =>
    setTexts(current => {
      const next = [...current];
      next[index] = value;
      return next;
    });

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
          <p className="mg-quiz-question__hint" id={hintId}>
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
            />
          ))}
        </div>
      </FormGroup>
    );
  } else if (safeType === 'fill_blank') {
    const { parts, inline } = parseBlankPrompt(prompt, blanks.length);
    const below = blanks
      .map((blank, index) => index)
      .filter(index => !inline.includes(index));
    body = (
      <FormGroup
        // The instruction is the legend and the sentence carries the blanks.
        // With no blank placed in the sentence, the prompt is the legend and
        // the blanks are listed under it, as they were before inline blanks.
        className={joinClasses(
          'mg-quiz-question__group',
          inline.length > 0 && 'mg-quiz-question__group--sentence'
        )}
        legend={inline.length > 0 ? text.fillBlankLegend : prompt}
      >
        <QuestionMedia media={media} mediaHtml={mediaHtml} />
        {inline.length > 0 && (
          <p className="mg-quiz-question__sentence">
            {parts.map((part, index) =>
              'text' in part ? (
                <span key={`text-${index}`}>{part.text}</span>
              ) : (
                <input
                  key={`blank-${part.blank}`}
                  className="mg-form-input mg-quiz-question__blank"
                  type="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-label={blankLabel(part.blank)}
                  value={texts[part.blank] ?? ''}
                  onChange={event => setText(part.blank, event.target.value)}
                  onKeyDown={handleTextKeyDown}
                />
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
      {...getLanguageProps(lang, dir)}
      {...rest}
    >
      {(numberText || result !== 'unanswered') && (
        <div className="mg-quiz-question__header">
          {numberText && (
            <p className="mg-quiz-question__number">{numberText}</p>
          )}
          {result !== 'unanswered' && (
            <p
              className={`mg-quiz-question__status mg-quiz-question__status--${result}`}
            >
              {result === 'correct' ? <CorrectIcon /> : <IncorrectIcon />}
              {result === 'correct' ? text.correct : text.incorrect}
            </p>
          )}
        </div>
      )}
      {body}
      <div className="mg-quiz-question__actions">
        <button
          type="button"
          className="mg-button mg-button-primary mg-quiz-question__check"
          data-vf-analytics-label="Quiz: Check answer"
          onClick={handleCheck}
        >
          {text.checkAnswer}
        </button>
      </div>
      <div className="mg-quiz-question__feedback" aria-live="polite">
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
  /** Language of the built-in labels (en, ar, es, fr, ja, ru, zh), including regional tags. */
  lang: PropTypes.string,
  /** Explicit text direction. Arabic selects right-to-left without it. */
  dir: PropTypes.oneOf(['ltr', 'rtl', 'auto']),
  /** Overrides for individual built-in labels. */
  labels: PropTypes.shape({
    checkAnswer: PropTypes.string,
    correct: PropTypes.string,
    incorrect: PropTypes.string,
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
  /** Called after each graded attempt with `{ correct, answer }`. An empty attempt is not graded and does not call it. */
  onCheck: PropTypes.func,
  /** Additional CSS class names for the root. */
  className: PropTypes.string,
};

export default QuizQuestion;
