/**
 * Extract UserFeedback props from a hydration container.
 *
 * Label attributes override the language selected by data-lang or HTML lang.
 */
export default function userFeedbackFromElement(container) {
  const { dataset } = container;
  const lang =
    dataset.lang ?? container.closest('[lang]')?.getAttribute('lang');
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
    ...(lang == null ? {} : { lang }),
    feedbackUrl:
      dataset.feedbackUrl || 'https://www.undrr.org/contact/website-feedback',
    labels: Object.fromEntries(
      Object.entries(labels).filter(([, value]) => value !== undefined)
    ),
  };
}
