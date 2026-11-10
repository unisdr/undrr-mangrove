export default function quoteHighlightFromElement(container) {
  const { dataset } = container;
  const imageSrc = dataset.imageSrc || undefined;
  const imageAlt = dataset.imageAlt || undefined;
  return {
    quote: dataset.quote || '',
    attribution: dataset.attribution || undefined,
    attributionTitle: dataset.attributionTitle || undefined,
    image: imageSrc ? { src: imageSrc, alt: imageAlt } : undefined,
    backgroundColor: dataset.backgroundColor || 'light',
    variant: dataset.variant || 'line',
    alignment: dataset.alignment || 'full',
  };
}
