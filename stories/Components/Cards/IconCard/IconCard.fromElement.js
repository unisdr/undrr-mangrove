export default function iconCardFromElement(container) {
  const { dataset } = container;
  const props = {
    centered: dataset.centered === 'true',
    variant: dataset.variant || 'default',
    labelPosition: dataset.labelPosition || 'content',
  };

  // Data array is required — parse from JSON data attribute
  try {
    props.data = dataset.items ? JSON.parse(dataset.items) : [];
  } catch {
    props.data = [];
  }

  return props;
}
