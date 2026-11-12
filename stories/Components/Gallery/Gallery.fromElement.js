import { languageFromElement, labelsFromElement } from '../../../src/i18n';
export default function galleryFromElement(container) {
  const { dataset } = container;
  const labels = labelsFromElement(container);
  const props = {
    ...languageFromElement(container),
    ...(labels ? { labels } : {}),
    initialIndex: dataset.initialIndex ? parseInt(dataset.initialIndex, 10) : 0,
    showThumbnails: dataset.showThumbnails !== 'false',
    thumbnailPosition: dataset.thumbnailPosition || 'left',
    showArrows: dataset.showArrows !== 'false',
    arrowStyle: dataset.arrowStyle || 'overlay',
    showDescription: dataset.showDescription !== 'false',
    enableKeyboard: dataset.enableKeyboard !== 'false',
    loop: dataset.loop === 'true',
  };

  // A host region on the container would be shadowed by the default one on
  // the gallery root, so carry it over instead.
  if (dataset.vfGoogleAnalyticsRegion) {
    props.analyticsRegion = dataset.vfGoogleAnalyticsRegion;
  }

  // Media array is required — parse from JSON data attribute
  try {
    props.media = dataset.media ? JSON.parse(dataset.media) : [];
  } catch {
    props.media = [];
  }

  return props;
}
