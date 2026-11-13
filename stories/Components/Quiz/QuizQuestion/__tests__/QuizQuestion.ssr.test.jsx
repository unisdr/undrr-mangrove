/** @jest-environment node */

import React from 'react';
import { renderToString } from 'react-dom/server';
import QuizQuestion, { getQuizQuestionLabels } from '../QuizQuestion.hydrate';
import QuizScore from '../../QuizScore/QuizScore.hydrate';

describe('quiz server rendering', () => {
  it('renders a question in a selected language without browser globals', () => {
    expect(typeof window).toBe('undefined');
    const html = renderToString(
      <QuizQuestion
        type="true_false"
        prompt="Statement"
        answer
        lang="ar-EG"
        number={1}
        total={2}
      />
    );
    expect(html).toContain('lang="ar-EG"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain(getQuizQuestionLabels('ar').falseLabel);
    expect(html).toContain('data-mg-quiz-state="unanswered"');
  });

  it('renders an empty score status', () => {
    const html = renderToString(<QuizScore lang="fr" />);
    expect(html).toContain('role="status"');
    expect(html).not.toContain('mg-quiz-score--active');
  });
});
