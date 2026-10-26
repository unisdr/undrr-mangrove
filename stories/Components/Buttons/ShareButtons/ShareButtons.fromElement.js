import { languageFromElement, labelsFromElement } from '../../../../src/i18n';
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
  const language = languageFromElement(container);
  return {
    ...language,
    labels: {
      ...(language.lang === undefined
        ? { mainLabel: 'Share this', onCopy: 'Link copied' }
        : {}),
      ...labelsFromElement(container),
      ...(dataset.mainLabel === undefined
        ? {}
        : { mainLabel: dataset.mainLabel }),
      ...(dataset.onCopyLabel === undefined
        ? {}
        : { onCopy: dataset.onCopyLabel }),
    },
    SharingSubject: dataset.sharingSubject || 'Sharing Link',
    SharingTextBody: dataset.sharingBody || '',
  };
}
