import { languageFromElement, labelsFromElement } from '../../../src/i18n';
/**
 * Extract UserFeedback props from a hydration container.
 *
 * Label attributes override the language selected by data-lang or HTML lang.
 */
export default function userFeedbackFromElement(container) {
  const { dataset } = container;
  const labels = {
    question: dataset.question,
    yes: dataset.yesLabel,
    no: dataset.noLabel,
    reportIssue: dataset.reportIssueLabel,
    confirmationBeforeLink: dataset.confirmationBeforeLink,
    confirmationSeparator: dataset.confirmationSeparator,
    confirmationLink: dataset.confirmationLink,
    confirmationAfterLink: dataset.confirmationAfterLink,
  };

  return {
    ...languageFromElement(container),
    feedbackUrl:
      dataset.feedbackUrl || 'https://www.undrr.org/contact/website-feedback',
    labels: {
      ...labelsFromElement(container),
      ...Object.fromEntries(
        Object.entries(labels).filter(([, value]) => value !== undefined)
      ),
    },
  };
}
