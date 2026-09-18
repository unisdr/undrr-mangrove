/**
 * Layer 2: Extract CopyButton props from a DOM container.
 *
 * Expected HTML:
 * <button data-mg-copy-button
 *   data-text-to-copy="https://example.org"
 *   aria-label="Copy link"
 *   data-copied-label="Link copied to clipboard."
 *   data-tooltip-label="Copied!"
 *   data-variant="outline"
 *   data-size="small">
 * </button>
 *
 * @param {Element} container - DOM element with data attributes
 * @returns {object} Props for the CopyButton component
 */
export default function copyButtonFromElement(container) {
  const { dataset } = container;

  let parsedLabels = {};
  if (dataset.labels) {
    try {
      parsedLabels = JSON.parse(dataset.labels);
    } catch {
      parsedLabels = {};
    }
  }

  // `aria-label` first: it is what the docs teach and what the vanilla path
  // reads, so markup that names the button the standard way keeps its name
  // when it is hydrated instead (WCAG 4.1.2). The `data-*` spellings stay
  // supported for markup written against the older reference table.
  const ariaLabel =
    container.getAttribute('aria-label') ||
    dataset.ariaLabel ||
    dataset.label ||
    dataset.copyLabel ||
    parsedLabels.ariaLabel ||
    undefined;
  const copiedLabel =
    dataset.copiedLabel ||
    dataset.ariaLiveText ||
    parsedLabels.copiedLabel ||
    undefined;
  const tooltipLabel =
    dataset.tooltipLabel ||
    dataset.feedbackText ||
    parsedLabels.tooltipLabel ||
    undefined;

  return {
    textToCopy: dataset.textToCopy || dataset.text || dataset.copyText || '',
    ariaLabel,
    copiedLabel,
    tooltipLabel,
    labels: (() => {
      const merged = { ...parsedLabels };
      if (dataset.failedLabel) merged.failedLabel = dataset.failedLabel;
      if (dataset.failedTooltipLabel) {
        merged.failedTooltipLabel = dataset.failedTooltipLabel;
      }
      return Object.keys(merged).length > 0 ? merged : undefined;
    })(),
    variant: dataset.variant || 'outline',
    size: dataset.size || undefined,
    className: dataset.className || undefined,
  };
}
