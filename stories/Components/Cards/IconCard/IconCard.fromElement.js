export default function iconCardFromElement(container) {
  const { dataset } = container;
  const props = {
    centered: dataset.centered === 'true',
    variant: dataset.variant || 'default',
  };

  // Data array is required — parse from JSON data attribute
  try {
    props.items = dataset.items ? JSON.parse(dataset.items) : [];
  } catch {
    props.items = [];
  }

  return props;
}
