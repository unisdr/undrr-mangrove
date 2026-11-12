/**
 * @file QuizScore.jsx
 * @description Running score and end summary for the quiz questions on a page.
 *
 * @module QuizScore
 */

import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { getLanguageProps } from '../../../../src/i18n';
import { ProgressBar } from '../../ProgressBar/ProgressBar';
import { formatQuizLabel, getQuizScoreLabels } from '../_labels';
import {
  QUIZ_CHANGE_EVENT,
  getQuizQuestions,
  getQuizScope,
  getQuizSummary,
  onQuizEvent,
  resetQuiz,
} from '../quizScope';

export { DEFAULT_QUIZ_SCORE_LABELS, getQuizScoreLabels } from '../_labels';

const IDLE = { total: 0, answered: 0, correct: 0 };
const FOCUSABLE = 'input:not([disabled]), button:not([disabled])';

const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

/**
 * QuizScore component.
 *
 * Counts the QuizQuestion components that share its scope: the nearest
 * `data-mg-quiz` ancestor, or the whole page. It stays empty until the first
 * answer is checked, then shows the running score with a progress bar, and the
 * final score with a "Start again" action once every question is answered.
 *
 * The score is a count for the visitor only. Nothing is stored or sent.
 */
export function QuizScore({
  showProgress = true,
  showReset = true,
  lang,
  dir,
  labels,
  className,
  ...rest
}) {
  const rootRef = useRef(null);
  const [summary, setSummary] = useState(IDLE);
  const text = getQuizScoreLabels(lang, labels);

  useEffect(() => {
    const root = rootRef.current;
    const count = () => {
      const next = getQuizSummary(getQuizScope(root));
      setSummary(current =>
        current.total === next.total &&
        current.answered === next.answered &&
        current.correct === next.correct
          ? current
          : next
      );
    };
    count();
    return onQuizEvent(root.ownerDocument, QUIZ_CHANGE_EVENT, count);
  }, []);

  const { total, answered, correct } = summary;
  const started = total > 0 && answered > 0;
  const complete = started && answered >= total;

  const handleReset = () => {
    const scope = getQuizScope(rootRef.current);
    // The button is about to leave the page, so focus goes to the first
    // question instead of being dropped on the body.
    const target = getQuizQuestions(scope)[0];
    resetQuiz(scope);
    if (!target) return;
    const view = target.ownerDocument.defaultView;
    const allowMotion = view?.matchMedia?.(
      '(prefers-reduced-motion: no-preference)'
    ).matches;
    target.scrollIntoView?.({
      behavior: allowMotion ? 'smooth' : 'instant',
      block: 'start',
    });
    target.querySelector(FOCUSABLE)?.focus({ preventScroll: true });
  };

  let message = '';
  if (complete) {
    message = formatQuizLabel(text.scoreFinal, summary);
  } else if (started) {
    message = formatQuizLabel(text.scoreSoFar, summary);
  }

  return (
    <div
      ref={rootRef}
      className={joinClasses(
        'mg-quiz-score',
        started && 'mg-quiz-score--active',
        complete && 'mg-quiz-score--complete',
        className
      )}
      {...getLanguageProps(lang, dir)}
      {...rest}
    >
      {/* Always in the page, so the first score is announced as a change. */}
      <p className="mg-quiz-score__summary" role="status">
        {message}
      </p>
      {started && !complete && showProgress && (
        <ProgressBar
          className="mg-quiz-score__progress"
          value={answered}
          max={total}
          label={text.progressLabel}
          showValue
          valueText={formatQuizLabel(text.progressValue, summary)}
        />
      )}
      {complete && showReset && (
        <div className="mg-quiz-score__actions">
          <button
            type="button"
            className="mg-button mg-button-secondary mg-quiz-score__reset"
            data-vf-analytics-label="Quiz: Start again"
            onClick={handleReset}
          >
            {text.reset}
          </button>
        </div>
      )}
    </div>
  );
}

QuizScore.propTypes = {
  /** Show a progress bar of questions answered while the quiz is under way. */
  showProgress: PropTypes.bool,
  /** Offer "Start again" once every question is answered. It clears every question in the scope. */
  showReset: PropTypes.bool,
  /** Language of the built-in labels (en, ar, es, fr, ja, ru, zh), including regional tags. */
  lang: PropTypes.string,
  /** Explicit text direction. Arabic selects right-to-left without it. */
  dir: PropTypes.oneOf(['ltr', 'rtl', 'auto']),
  /** Overrides for individual built-in labels. Placeholders: `{correct}`, `{total}`, `{answered}`. */
  labels: PropTypes.shape({
    scoreSoFar: PropTypes.string,
    scoreFinal: PropTypes.string,
    progressLabel: PropTypes.string,
    progressValue: PropTypes.string,
    reset: PropTypes.string,
  }),
  /** Additional CSS class names for the root. */
  className: PropTypes.string,
};

export default QuizScore;
