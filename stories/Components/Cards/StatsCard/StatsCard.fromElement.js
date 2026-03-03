export default function statsCardFromElement(container) {
  const { dataset } = container;
  const props = {
    title: dataset.title || undefined,
    variant: dataset.variant || 'default',
    className: dataset.className || '',
  };

  // Stats array is required — parse from JSON data attribute
  try {
    props.stats = dataset.stats ? JSON.parse(dataset.stats) : [];
  } catch {
    props.stats = [];
  }

  return props;
}
