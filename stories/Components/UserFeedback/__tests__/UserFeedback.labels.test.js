import {
  DEFAULT_USER_FEEDBACK_LABELS,
  getUserFeedbackLabels,
} from '../UserFeedback.hydrate';

describe('getUserFeedbackLabels', () => {
  it.each(['fr', 'FR', 'fr-CA', 'fr_CA', ' fr-CA '])(
    'normalises %s to the existing French translation',
    lang => {
      expect(getUserFeedbackLabels(lang).yes).toBe('Oui');
    }
  );

  it.each([
    undefined,
    '',
    'de',
    'invalid-language',
    'constructor',
    '__proto__',
  ])('falls back to English for %s', lang => {
    expect(getUserFeedbackLabels(lang)).toEqual(DEFAULT_USER_FEEDBACK_LABELS);
  });

  it('merges label overrides without mutating translations or caller data', () => {
    const labels = Object.freeze({ yes: 'Proceed', confirmationSeparator: '' });

    expect(getUserFeedbackLabels('fr', labels)).toMatchObject({
      yes: 'Proceed',
      no: 'Non',
      confirmationSeparator: '',
    });
    expect(getUserFeedbackLabels('fr')).toMatchObject({
      yes: 'Oui',
      confirmationSeparator: ' ',
    });
    expect(DEFAULT_USER_FEEDBACK_LABELS.yes).toBe('Yes');
  });
});
