/**
 * Layer 2: Extract ShareButtons props from a DOM container.
 *
 * Expected HTML:
 * <section data-mg-share-buttons
 *   data-main-label="Share this"
 *   data-on-copy-label="Link copied"
 *   data-sharing-subject="Sharing Link"
 *   data-sharing-body="Check out this link: ">
 * </section>
 *
 * @param {Element} container - DOM element with data attributes
 * @returns {object} Props for the ShareButtons component
 */
export default function shareButtonsFromElement(container) {
  const { dataset } = container;
  return {
    labels: {
      mainLabel: dataset.mainLabel || 'Share this',
      onCopy: dataset.onCopyLabel || 'Link copied',
    },
    SharingSubject: dataset.sharingSubject || 'Sharing Link',
    SharingTextBody: dataset.sharingBody || '',
  };
}
