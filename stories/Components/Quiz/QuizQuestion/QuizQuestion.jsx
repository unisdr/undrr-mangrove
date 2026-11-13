/**
 * @file QuizQuestion.jsx
 * @description One self-checking quiz question: multiple choice, true/false,
 * short answer or fill in the blank.
 *
 * @module QuizQuestion
 */

import React, {
  Component,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
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
  firstAcceptedAnswer,
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
export {
  gradeAnswer as gradeQuizAnswer,
  QUIZ_QUESTION_TYPES,
} from '../quizGrading';
export { refreshQuiz } from '../quizScope';

const EMPTY_LIST = [];
// A wrong answer is an invitation to try again, not an error, so it shares the
// quiet `info` variant with the empty attempt. The wording tells them apart.
// A revealed answer is `info` as well: the visitor did not get it, so it is
// not `positive`, and nothing went wrong, so it is not a warning.
const NOTICE_VARIANTS = {
  correct: 'positive',
  revealed: 'info',
  incorrect: 'info',
  empty: 'info',
};
// The states that end a question: the controls are read-only and the buttons
// are removed until the quiz is started again.
const LOCKED_RESULTS = ['correct', 'revealed'];
// Punctuation written straight after a blank ("[1], Japan") stays on the
// blank's line when the sentence wraps.
const TRAILING_PUNCTUATION = /^[^\s\p{L}\p{N}]+/u;

// Fixed click-tracking names. They never carry an option's value or position
// or anything typed, because that would report the visitor's answer.
const ANALYTICS = {
  option: 'Quiz: Answer option',
  field: 'Quiz: Answer field',
  blank: 'Quiz: Blank',
  check: 'Quiz: Check answer',
  reveal: 'Quiz: Show answer',
};

const joinClasses = (...classes) => classes.filter(Boolean).join(' ');
const isRecord = value => value !== null && typeof value === 'object';
const asList = value => (Array.isArray(value) ? value : EMPTY_LIST);
const asText = value =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : '';

// Layout effects do nothing on the server, and React 18 warns about them.
const useBrowserLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * The figure that belongs to the question.
 *
 * A React consumer passes `media` as a node. A hydrated question is given the
 * server's own `.mg-quiz-question__media` element instead, which is moved
 * into a slot as it is: the same nodes, so listeners attached before the
 * mount keep working and nothing loads or runs a second time. The element
 * goes back to where it came from when the question unmounts.
 */
function QuestionMedia({ media, element }) {
  const slotRef = useRef(null);
  useBrowserLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot || !element) return undefined;
    const home = element.parentNode;
    const next = element.nextSibling;
    slot.appendChild(element);
    return () => {
      if (!home) {
        element.remove();
        return;
      }
      home.insertBefore(element, next?.parentNode === home ? next : null);
    };
  }, [element]);

  if (media) return <div className="mg-quiz-question__media">{media}</div>;
  if (!element) return null;
  return <div className="mg-quiz-question__media-slot" ref={slotRef} />;
}

QuestionMedia.propTypes = {
  media: PropTypes.node,
  element: PropTypes.object,
};

/**
 * Keeps the server-rendered fallback of a hydrated question safe.
 *
 * React empties the container when it mounts. If the question then fails to
 * render, the fallback is put back, so the visitor keeps a readable question
 * and the container is never left empty. It is also put back when the
 * question unmounts, which returns the container to its server-rendered
 * state: mounting it again reads the same markup and the same media element.
 */
class ServerFallbackBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidMount() {
    this.sync();
  }

  componentDidUpdate() {
    this.sync();
  }

  componentWillUnmount() {
    this.place(true);
  }

  // The fallback is in the container exactly when the question is not.
  place(show) {
    const { container, nodes } = this.props.fallback;
    nodes.forEach(node => {
      if (show && node.parentNode !== container) container.appendChild(node);
      if (!show && node.parentNode === container) node.remove();
    });
  }

  sync() {
    this.place(this.state.failed);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

ServerFallbackBoundary.propTypes = {
  fallback: PropTypes.shape({
    container: PropTypes.object.isRequired,
    nodes: PropTypes.array.isRequired,
  }).isRequired,
  children: PropTypes.node,
};

function QuizQuestionView({
  type = 'multiple_choice',
  prompt = '',
  options = EMPTY_LIST,
  multiple = false,
  answer,
  expected = EMPTY_LIST,
  caseSensitive = false,
  blanks = EMPTY_LIST,
  explanation,
  hint,
  showAnswer = false,
  media,
  mediaElement,
  number,
  total,
  showNumber = true,
  questionId,
  lang,
  dir,
  labels,
  onCheck,
  onReveal,
  className,
  ...rest
}) {
  const safeType = QUIZ_QUESTION_TYPES.includes(type)
    ? type
    : 'multiple_choice';
  const isChoice = safeType === 'multiple_choice' || safeType === 'true_false';
  const isMultiple = safeType === 'multiple_choice' && multiple;
  const text = getQuizQuestionLabels(lang, labels);

  const promptText = asText(prompt);
  const explanationText = asText(explanation);
  const hintText = typeof hint === 'string' ? hint.trim() : '';
  const blankList = asList(blanks);

  const rootRef = useRef(null);
  const feedbackRef = useRef(null);
  const focusFeedbackRef = useRef(false);
  const id = useId();
  // Options are tracked by position, so an empty value or two options with
  // the same value are still separate, answerable options.
  const [selected, setSelected] = useState(EMPTY_LIST);
  const [texts, setTexts] = useState(EMPTY_LIST);
  const [result, setResult] = useState('unanswered');
  // `attempt` remounts the notice so a repeated message is announced again.
  const [feedback, setFeedback] = useState({ kind: null, attempt: 0 });
  const [position, setPosition] = useState(null);
  // "Show answer" is earned by the first incorrect attempt and then stays, so
  // it does not come and go as the visitor edits the answer.
  const [revealEarned, setRevealEarned] = useState(false);
  const locked = LOCKED_RESULTS.includes(result);

  const choices =
    safeType === 'true_false'
      ? trueFalseOptions({ answer, options: asList(options) }).map(option => ({
          ...option,
          label: option.value === 'true' ? text.trueLabel : text.falseLabel,
        }))
      : asList(options).filter(isRecord);

  // A question with nothing to answer has no check button and no state, so
  // it is not numbered and cannot hold up the score.
  let answerable = true;
  if (isChoice) answerable = choices.length > 0;
  if (safeType === 'fill_blank') answerable = blankList.length > 0;

  // What "Show answer" puts on screen, or null when no answer could be marked
  // correct: then there is nothing to show and the button is never offered.
  let answerKey = null;
  if (isChoice) {
    const correct = choices
      .map((option, index) => (option.correct === true ? index : -1))
      .filter(index => index >= 0);
    // One radio can be selected, so a single-answer question with several
    // options flagged cannot be answered correctly either.
    if (isMultiple ? correct.length > 0 : correct.length === 1) {
      answerKey = { selected: correct };
    }
  } else {
    const answers =
      safeType === 'text'
        ? [firstAcceptedAnswer(expected)]
        : blankList.map(blank => firstAcceptedAnswer(blank?.expected));
    if (answers.length > 0 && answers.every(item => item !== null)) {
      answerKey = { texts: answers };
    }
  }
  const canReveal =
    showAnswer === true && answerable && !locked && answerKey !== null;

  // An answer and its result belong to one question. When the props describe
  // a different one (another `questionId`, or other content when there is no
  // id), the question starts again instead of showing the old result.
  const identity =
    questionId ||
    JSON.stringify([
      safeType,
      promptText,
      isMultiple,
      safeType === 'multiple_choice'
        ? choices.map(option => [
            asText(option.value),
            asText(option.label),
            option.correct === true,
          ])
        : null,
      safeType === 'true_false' ? choices.map(option => option.correct) : null,
      safeType === 'text' ? [expected, Boolean(caseSensitive)] : null,
      safeType === 'fill_blank' ? blankList : null,
    ]);
  const [shownIdentity, setShownIdentity] = useState(identity);
  if (shownIdentity !== identity) {
    setShownIdentity(identity);
    setSelected(EMPTY_LIST);
    setTexts(EMPTY_LIST);
    setResult('unanswered');
    setRevealEarned(false);
    setFeedback(current => ({ kind: null, attempt: current.attempt }));
  }

  // Position among the questions that share this scope, unless given.
  useEffect(() => {
    const root = rootRef.current;
    const doc = root.ownerDocument;
    let offChange = () => {};
    let offReset = () => {};
    // Other code can remove the question's markup without unmounting it
    // (Drupal AJAX replacing a block). The next event finds the root out of
    // the document and lets go of the document listeners, so the removed
    // question is not kept alive by them.
    let wasConnected = root.isConnected;
    const hasLeft = () => {
      if (root.isConnected) {
        wasConnected = true;
        return false;
      }
      if (!wasConnected) return false;
      offChange();
      offReset();
      return true;
    };
    const measure = () => {
      if (hasLeft()) return;
      const next = getQuizPosition(root);
      setPosition(current =>
        current?.number === next.number && current?.total === next.total
          ? current
          : next
      );
    };
    measure();
    offChange = onQuizEvent(doc, QUIZ_CHANGE_EVENT, measure);
    offReset = onQuizEvent(doc, QUIZ_RESET_EVENT, event => {
      if (hasLeft() || event.target !== getQuizScope(root)) return;
      setSelected(EMPTY_LIST);
      setTexts(EMPTY_LIST);
      setResult('unanswered');
      setRevealEarned(false);
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
    // The buttons have just left the page. Focus goes to the result so that
    // it is not dropped on the body: to the Notice, a group named by its
    // title, and not to the live region around it.
    if (LOCKED_RESULTS.includes(result) && focusFeedbackRef.current) {
      feedbackRef.current?.querySelector('.mg-notice')?.focus();
    }
    focusFeedbackRef.current = false;
  }, [result, answerable]);

  // A result or a prompt describes the answer as it was when it was checked.
  const clearAttempt = () => {
    setResult('unanswered');
    setFeedback(current =>
      current.kind ? { kind: null, attempt: current.attempt } : current
    );
  };

  // The answer as `onCheck` reports it: option values as the consumer wrote
  // them, or the text typed.
  const collectAnswer = () => {
    if (safeType === 'text') return texts[0] ?? '';
    if (safeType === 'fill_blank') {
      return blankList.map((blank, index) => texts[index] ?? '');
    }
    const values = selected.map(index => asText(choices[index]?.value));
    return isMultiple ? values : (values[0] ?? '');
  };

  // Whether focus is on a button that is about to be removed.
  const noteFocusInActions = () => {
    const root = rootRef.current;
    const active = root.ownerDocument.activeElement;
    focusFeedbackRef.current =
      active?.closest?.('.mg-quiz-question__actions') != null &&
      root.contains(active);
  };

  const handleCheck = () => {
    if (locked || !answerable) return;
    const submitted = collectAnswer();
    if (isChoice ? selected.length === 0 : isEmptyAnswer(submitted)) {
      setFeedback(current => ({ kind: 'empty', attempt: current.attempt + 1 }));
      return;
    }
    const correct = isChoice
      ? gradeAnswer(
          {
            type: 'multiple_choice',
            options: choices.map((option, index) => ({
              value: String(index),
              correct: option.correct === true,
            })),
          },
          selected.map(String)
        )
      : gradeAnswer(
          { type: safeType, expected, caseSensitive, blanks: blankList },
          submitted
        );
    if (correct) noteFocusInActions();
    else setRevealEarned(true);
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

  // Ends the question with the answer on screen in place of the visitor's.
  // It is not a graded attempt, so `onCheck` is not called.
  const handleReveal = () => {
    if (!canReveal || !revealEarned) return;
    noteFocusInActions();
    if (answerKey.selected) setSelected(answerKey.selected);
    else setTexts(answerKey.texts);
    setResult('revealed');
    setFeedback(current => ({
      kind: 'revealed',
      attempt: current.attempt + 1,
    }));
    onReveal?.(questionId ? { questionId } : {});
  };

  const handleChoice = (index, checked) => {
    if (locked) return;
    clearAttempt();
    setSelected(current => {
      if (!isMultiple) return [index];
      const others = current.filter(item => item !== index);
      return checked ? [...others, index] : others;
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
  const onPage = resolvedTotal > 1;
  const checkClass = onPage
    ? 'mg-button mg-button-secondary mg-button-outline'
    : 'mg-button mg-button-primary';
  // "Show answer" is always one step quieter than the check button beside
  // it: an outline beside the primary button, and an outline without its
  // edge beside the outline button, which is the quietest button Mangrove has.
  const revealClass = joinClasses(
    'mg-button mg-button-secondary mg-button-outline',
    'mg-quiz-question__reveal',
    onPage && 'mg-quiz-question__reveal--quiet'
  );

  const hintId = `${id}-hint`;
  const promptId = `${id}-prompt`;
  const feedbackTitleId = `${id}-result`;
  const blankLabel = index =>
    asText(blankList[index]?.label).trim() ||
    formatQuizLabel(text.blankLabel, {
      number: index + 1,
      total: blankList.length,
    });
  const questionMedia = <QuestionMedia media={media} element={mediaElement} />;

  let body;
  if (isChoice) {
    const Control = isMultiple ? Checkbox : Radio;
    body = (
      <FormGroup
        className="mg-quiz-question__group"
        legend={promptText}
        aria-describedby={isMultiple ? hintId : undefined}
      >
        {isMultiple && (
          <p className="mg-form-help mg-quiz-question__hint" id={hintId}>
            {text.selectAll}
          </p>
        )}
        {questionMedia}
        <div className="mg-quiz-question__options">
          {choices.map((option, index) => (
            <Control
              // Options are identified by position: values may repeat or be empty.
              key={index}
              id={`${id}-option-${index}`}
              className="mg-quiz-question__option"
              name={`${id}-answer`}
              value={asText(option.value)}
              label={asText(option.label) || asText(option.value)}
              checked={selected.includes(index)}
              onChange={event => handleChoice(index, event.target.checked)}
              analyticsLabel={ANALYTICS.option}
              // Read-only, not disabled: the chosen answer keeps its place in
              // the tab order and its full contrast.
              aria-disabled={locked || undefined}
            />
          ))}
        </div>
      </FormGroup>
    );
  } else if (safeType === 'fill_blank') {
    const { parts, inline } = parseBlankPrompt(promptText, blankList.length);
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
    const below = blankList
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
        legend={
          inline.length > 0
            ? text.fillBlankLegend
            : // Any marker left has no blank to stand for, so it is not shown.
              parts.map(part => part.text ?? '').join('')
        }
      >
        {questionMedia}
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
                    data-vf-analytics-label={ANALYTICS.blank}
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
                analyticsLabel={ANALYTICS.blank}
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
          data-vf-analytics-label={ANALYTICS.field}
        >
          {promptText}
        </label>
        {questionMedia}
        <TextInput
          id={`${id}-answer`}
          className="mg-quiz-question__field"
          aria-labelledby={promptId}
          analyticsLabel={ANALYTICS.field}
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
  if (feedback.kind === 'revealed') feedbackTitle = text.revealedMessage;
  if (feedback.kind === 'incorrect') feedbackTitle = text.incorrectMessage;
  if (feedback.kind === 'empty') {
    feedbackTitle = isChoice ? text.emptyChoice : text.emptyText;
  }

  // The two results that end the question: they show the explanation and
  // take focus when the buttons are removed.
  const isFinal = LOCKED_RESULTS.includes(feedback.kind);
  let feedbackBody = null;
  if (isFinal && explanationText) {
    feedbackBody = (
      <p className="mg-quiz-question__explanation">{explanationText}</p>
    );
  } else if (feedback.kind === 'incorrect' && hintText) {
    feedbackBody = (
      <p className="mg-quiz-question__feedback-hint">{hintText}</p>
    );
  }

  return (
    <div
      // First, so that a consumer prop cannot replace what the component
      // publishes about itself.
      {...rest}
      ref={rootRef}
      className={joinClasses(
        'mg-quiz-question',
        `mg-quiz-question--${safeType.replace('_', '-')}`,
        result !== 'unanswered' && `mg-quiz-question--${result}`,
        className
      )}
      data-mg-quiz-state={answerable ? result : undefined}
      data-mg-quiz-id={questionId || undefined}
      {...getLanguageProps(lang, dir)}
    >
      {numberText && (
        <div className="mg-quiz-question__header">
          <p className="mg-quiz-question__number">{numberText}</p>
        </div>
      )}
      {body}
      {answerable && !locked && (
        <div className="mg-quiz-question__actions">
          <button
            type="button"
            className={`${checkClass} mg-quiz-question__check`}
            data-vf-analytics-label={ANALYTICS.check}
            onClick={handleCheck}
          >
            {text.checkAnswer}
          </button>
          {canReveal && revealEarned && (
            <button
              type="button"
              className={revealClass}
              data-vf-analytics-label={ANALYTICS.reveal}
              onClick={handleReveal}
            >
              {text.showAnswer}
            </button>
          )}
        </div>
      )}
      <div
        ref={feedbackRef}
        className="mg-quiz-question__feedback"
        aria-live="polite"
      >
        {feedback.kind && (
          <Notice
            key={feedback.attempt}
            variant={NOTICE_VARIANTS[feedback.kind]}
            // The wrapper is the live region; a second one would announce
            // twice. A result that ends the question is a group named by its
            // title, so it can take focus when the buttons are removed.
            role={isFinal ? 'group' : null}
            aria-labelledby={isFinal ? feedbackTitleId : undefined}
            tabIndex={isFinal ? -1 : undefined}
            headerContent={
              <p
                className="mg-notice__title mg-quiz-question__feedback-title"
                id={feedbackTitleId}
              >
                {feedbackTitle}
              </p>
            }
          >
            {feedbackBody}
          </Notice>
        )}
      </div>
    </div>
  );
}

/**
 * QuizQuestion component.
 *
 * Checks the answer in the browser against the answer key in its props and
 * shows the result as a Notice. The component stores nothing and sends
 * nothing. The key is readable in the page by design, so this is for
 * engagement, never for assessment.
 *
 * Each question publishes its state as `data-mg-quiz-state` on its root, which
 * is how QuizScore counts a page of independent questions.
 *
 * A correct answer locks the question: the controls become read-only and the
 * check button is removed. Changing an answer after any other attempt clears
 * the feedback and returns the question to unanswered, so a result never
 * outlives the answer it was given for.
 *
 * Two optional parts help after a wrong answer. `hint` is shown with the
 * "try again" feedback. `showAnswer` offers a "Show answer" button from the
 * first incorrect attempt on; it puts the answer on screen, locks the
 * question in the `revealed` state and shows the explanation. A revealed
 * question counts as answered and not correct.
 *
 * The answer key is optional in the props. Without a usable key no answer is
 * marked correct, for every type: a `true_false` question with no `answer`
 * has no key.
 */
export function QuizQuestion({ serverFallback, ...props }) {
  // Set by `fromElement` for a hydrated question, never by a React consumer.
  if (!serverFallback) return <QuizQuestionView {...props} />;
  return (
    <ServerFallbackBoundary fallback={serverFallback}>
      <QuizQuestionView {...props} mediaElement={serverFallback.media} />
    </ServerFallbackBoundary>
  );
}

QuizQuestion.propTypes = {
  /** Question type. The values match the Drupal grader types. */
  type: PropTypes.oneOf(QUIZ_QUESTION_TYPES),
  /** The question, as plain text. Line breaks are kept. For `fill_blank`, write `[1]`, `[2]` where each blank belongs in the sentence; a repeated marker or one with no blank is left out. */
  prompt: PropTypes.string.isRequired,
  /** Options for `multiple_choice`: a `value`, a visible `label`, and `correct: true` on each right answer. Options are graded by position, so a repeated or empty `value` still works; `onCheck` reports the values as written, so keep them unique if you read them. */
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
  /** `true_false` only: whether the statement is true. Left out, the question has no key and no answer is marked correct. The True and False labels come from the language catalogue. */
  answer: PropTypes.bool,
  /** `text` only: every accepted answer. */
  expected: PropTypes.arrayOf(PropTypes.string),
  /** `text` only: match letter case exactly. Whitespace, Unicode compatibility forms (NFKC, so full-width digits match) and zero-width characters are always normalized. */
  caseSensitive: PropTypes.bool,
  /** `fill_blank` only: one entry per blank, in order, with its accepted answers, optional case sensitivity and an optional label used as the input's accessible name. With no blanks the question has no check button and is not counted. */
  blanks: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      expected: PropTypes.arrayOf(PropTypes.string),
      caseSensitive: PropTypes.bool,
    })
  ),
  /** Optional plain-text explanation, to say why the answer is right. Shown with the "Correct" feedback, and with "Here is the answer." after "Show answer". */
  explanation: PropTypes.string,
  /** Optional plain-text hint shown with "Not correct yet. Try again." after an incorrect attempt. Never shown before an attempt or for an empty one. Line breaks are kept. */
  hint: PropTypes.string,
  /** Offer a "Show answer" button beside "Check answer" from the first incorrect attempt until the question is answered correctly, revealed or started again. It selects the correct options, or fills in the first accepted answer of each field, locks the question in the `revealed` state and shows the explanation. Never offered for a question with no usable answer key. */
  showAnswer: PropTypes.bool,
  /** Optional image or figure that belongs to the question, shown between the prompt and the answer controls. */
  media: PropTypes.node,
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
    showAnswer: PropTypes.string,
    correct: PropTypes.string,
    incorrectMessage: PropTypes.string,
    revealedMessage: PropTypes.string,
    emptyChoice: PropTypes.string,
    emptyText: PropTypes.string,
    questionNumber: PropTypes.string,
    selectAll: PropTypes.string,
    fillBlankLegend: PropTypes.string,
    blankLabel: PropTypes.string,
    trueLabel: PropTypes.string,
    falseLabel: PropTypes.string,
  }),
  /** Called after each graded attempt with `{ correct, answer }`, and `questionId` when the question has one. An empty attempt is not graded and does not call it. A correct answer locks the question, so it is the last call until the quiz is started again. "Show answer" is not an attempt and does not call it. */
  onCheck: PropTypes.func,
  /** Called when the visitor selects "Show answer", with an object that carries `questionId` when the question has one and is otherwise empty. The question is then locked, so no call to `onCheck` follows until the quiz is started again. */
  onReveal: PropTypes.func,
  /** Additional CSS class names for the root. */
  className: PropTypes.string,
};

QuizQuestionView.propTypes = {
  ...QuizQuestion.propTypes,
  mediaElement: PropTypes.object,
};

export default QuizQuestion;
