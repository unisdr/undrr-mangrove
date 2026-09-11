/**
 * Extract UserFeedback props from a hydration container.
 *
 * All label attributes are optional; the React component supplies English
 * defaults for omitted values.
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
    feedbackUrl:
      dataset.feedbackUrl || 'https://www.undrr.org/contact/website-feedback',
    labels: Object.fromEntries(
      Object.entries(labels).filter(([, value]) => value !== undefined)
    ),
  };
}
