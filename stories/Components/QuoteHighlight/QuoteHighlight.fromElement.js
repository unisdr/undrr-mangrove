export default function quoteHighlightFromElement(container) {
  const { dataset } = container;
  return {
    quote: dataset.quote || '',
    attribution: dataset.attribution || undefined,
    attributionTitle: dataset.attributionTitle || undefined,
    imageSrc: dataset.imageSrc || undefined,
    imageAlt: dataset.imageAlt || undefined,
    backgroundColor: dataset.backgroundColor || 'light',
    variant: dataset.variant || 'line',
    alignment: dataset.alignment || 'full',
  };
}
