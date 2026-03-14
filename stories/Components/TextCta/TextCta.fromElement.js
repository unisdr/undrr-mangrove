export default function textCtaFromElement(container) {
  const { dataset } = container;

  // Parse buttons array from JSON attribute
  let buttons = [];
  try {
    buttons = dataset.buttons ? JSON.parse(dataset.buttons) : [];
  } catch {
    buttons = [];
  }

  return {
    headline: dataset.headline || '',
    headlineSize: dataset.headlineSize || '600',
    text: dataset.text || '',
    buttons,
    variant: dataset.variant || 'primary',
    backgroundColor: dataset.backgroundColor || undefined,
    padding: dataset.padding || undefined,
    image: dataset.image || undefined,
    imageAlt: dataset.imageAlt || '',
    centered: dataset.centered !== 'false',
    className: dataset.className || undefined,
  };
}
