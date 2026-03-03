export default function galleryFromElement(container) {
  const { dataset } = container;
  const props = {
    initialIndex: dataset.initialIndex
      ? parseInt(dataset.initialIndex, 10)
      : 0,
    showThumbnails: dataset.showThumbnails !== 'false',
    thumbnailPosition: dataset.thumbnailPosition || 'left',
    showArrows: dataset.showArrows !== 'false',
    arrowStyle: dataset.arrowStyle || 'overlay',
    showDescription: dataset.showDescription !== 'false',
    enableKeyboard: dataset.enableKeyboard !== 'false',
    loop: dataset.loop === 'true',
  };

  // Media array is required — parse from JSON data attribute
  try {
    props.media = dataset.media ? JSON.parse(dataset.media) : [];
  } catch {
    props.media = [];
  }

  return props;
}
