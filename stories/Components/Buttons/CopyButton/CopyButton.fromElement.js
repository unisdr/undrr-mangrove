/**
 * Layer 2: Extract CopyButton props from a DOM container.
 *
 * Expected HTML:
 * <button data-mg-copy-button
 *   data-text-to-copy="https://example.org"
 *   data-aria-label="Copy link"
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
  return {
    textToCopy: dataset.textToCopy || dataset.text || dataset.copyText || '',
    ariaLabel:
      dataset.ariaLabel || dataset.label || dataset.copyLabel || undefined,
    copiedLabel: dataset.copiedLabel || dataset.ariaLiveText || undefined,
    tooltipLabel: dataset.tooltipLabel || dataset.feedbackText || undefined,
    variant: dataset.variant || 'outline',
    size: dataset.size || undefined,
    className: dataset.className || undefined,
  };
}
