/** @jest-environment node */

import {
  DEFAULT_QUIZ_QUESTION_LABELS,
  DEFAULT_QUIZ_SCORE_LABELS,
  formatQuizLabel,
  getQuizQuestionLabels,
  getQuizScoreLabels,
} from '../_labels';

const LANGUAGES = ['ar', 'es', 'fr', 'ja', 'ru', 'zh'];
const placeholders = text => (text.match(/\{\w+\}/g) ?? []).sort();

describe('quiz labels', () => {
  it('works without a DOM', () => {
    expect(typeof document).toBe('undefined');
    expect(getQuizQuestionLabels('fr').checkAnswer).toBe('Vérifier la réponse');
  });

  it('falls back to English for a missing or unsupported language', () => {
    expect(getQuizQuestionLabels()).toEqual(DEFAULT_QUIZ_QUESTION_LABELS);
    expect(getQuizQuestionLabels('de')).toEqual(DEFAULT_QUIZ_QUESTION_LABELS);
    expect(getQuizScoreLabels('he')).toEqual(DEFAULT_QUIZ_SCORE_LABELS);
  });

  it('selects by primary subtag and keeps partial overrides', () => {
    const labels = getQuizQuestionLabels('ar-EG', { checkAnswer: 'تحقق' });
    expect(labels.checkAnswer).toBe('تحقق');
    expect(labels.falseLabel).toBe('خطأ');
    expect(getQuizScoreLabels('fr_CA').reset).toBe('Recommencer');
  });

  it.each(LANGUAGES)('%s translates every key and keeps placeholders', lang => {
    [
      [DEFAULT_QUIZ_QUESTION_LABELS, getQuizQuestionLabels(lang)],
      [DEFAULT_QUIZ_SCORE_LABELS, getQuizScoreLabels(lang)],
    ].forEach(([defaults, translated]) => {
      Object.entries(defaults).forEach(([key, english]) => {
        expect(translated[key]).toBeTruthy();
        expect(placeholders(translated[key])).toEqual(placeholders(english));
      });
    });
    expect(getQuizQuestionLabels(lang).checkAnswer).not.toBe(
      DEFAULT_QUIZ_QUESTION_LABELS.checkAnswer
    );
  });

  it('keeps the short running score free of the answered count', () => {
    ['en', ...LANGUAGES].forEach(lang => {
      const labels = getQuizScoreLabels(lang);
      expect(placeholders(labels.scoreSoFar)).toEqual(['{correct}', '{total}']);
      expect(placeholders(labels.scoreSoFarWithAnswered)).toEqual([
        '{answered}',
        '{correct}',
        '{total}',
      ]);
      expect(labels.scoreSoFar.length).toBeLessThan(
        labels.scoreSoFarWithAnswered.length
      );
    });
  });

  it('fills every label without leaving a placeholder behind', () => {
    const values = { number: 2, total: 5, correct: 1, answered: 21 };
    ['en', ...LANGUAGES].forEach(lang => {
      Object.values({
        ...getQuizQuestionLabels(lang),
        ...getQuizScoreLabels(lang),
      }).forEach(label => {
        expect(formatQuizLabel(label, values)).not.toMatch(/[{}]/);
      });
    });
  });

  it('keeps the feedback wording apart from the true and false options', () => {
    ['en', ...LANGUAGES].forEach(lang => {
      const labels = getQuizQuestionLabels(lang);
      expect(labels.correct).not.toBe(labels.trueLabel);
      expect(labels.incorrectMessage).not.toContain(labels.falseLabel);
    });
  });

  it('words a revealed answer as neither correct nor true or false', () => {
    ['en', ...LANGUAGES].forEach(lang => {
      const labels = getQuizQuestionLabels(lang);
      [labels.correct, labels.trueLabel, labels.falseLabel].forEach(word => {
        expect(labels.revealedMessage).not.toContain(word);
      });
      expect(labels.revealedMessage).not.toBe(labels.incorrectMessage);
      expect(labels.showAnswer).not.toBe(labels.checkAnswer);
    });
    LANGUAGES.forEach(lang => {
      const labels = getQuizQuestionLabels(lang);
      expect(labels.showAnswer).not.toBe(
        DEFAULT_QUIZ_QUESTION_LABELS.showAnswer
      );
      expect(labels.revealedMessage).not.toBe(
        DEFAULT_QUIZ_QUESTION_LABELS.revealedMessage
      );
    });
  });

  it('follows the editorial and typographic conventions', () => {
    ['en', ...LANGUAGES].forEach(lang => {
      Object.values({
        ...getQuizQuestionLabels(lang),
        ...getQuizScoreLabels(lang),
      }).forEach(label => {
        expect(label).not.toMatch(/[!！¡]/);
        expect(label).toBe(label.trim());
      });
    });
    // French: a no-break space before each colon.
    Object.values(getQuizScoreLabels('fr')).forEach(label => {
      expect(label).not.toMatch(/[^\u00a0]:/);
    });
    // Chinese and Japanese: full-width punctuation only.
    ['ja', 'zh'].forEach(lang => {
      Object.values({
        ...getQuizQuestionLabels(lang),
        ...getQuizScoreLabels(lang),
      }).forEach(label => {
        expect(label).not.toMatch(/[.,:;?()/]/);
      });
    });
  });

  it('has no label for the removed header status', () => {
    ['en', ...LANGUAGES].forEach(lang => {
      expect(getQuizQuestionLabels(lang)).not.toHaveProperty('incorrect');
    });
  });

  it('fills placeholders and leaves unknown ones as written', () => {
    expect(
      formatQuizLabel('Question {number} of {total} {other}', {
        number: 2,
        total: 5,
      })
    ).toBe('Question 2 of 5 {other}');
  });
});
