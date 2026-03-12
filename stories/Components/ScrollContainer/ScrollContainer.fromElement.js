/**
 * Layer 2: Extract ScrollContainer props from a DOM container.
 *
 * Expected HTML:
 * <div data-mg-scroll-container
 *   data-height="300px"
 *   data-min-width="200px"
 *   data-item-width="250px"
 *   data-padding="16"
 *   data-show-arrows="true"
 *   data-step-size="300">
 *   <div class="mg-scroll__content">
 *     <div class="card">...</div>
 *     <div class="card">...</div>
 *   </div>
 * </div>
 *
 * @param {Element} container - DOM element with data attributes and server-rendered content
 * @returns {object} Props for the ScrollContainer component
 */
export default function scrollContainerFromElement(container) {
  const { dataset } = container;
  const props = {
    height: dataset.height || 'auto',
    minWidth: dataset.minWidth || 'auto',
    itemWidth: dataset.itemWidth || 'auto',
    padding: dataset.padding || '0',
    showArrows: dataset.showArrows === 'true',
    stepSize: dataset.stepSize ? parseInt(dataset.stepSize, 10) : null,
  };

  // Extract children as HTML strings from server-rendered content
  const contentItems = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(container.innerHTML, 'text/html');
  const contentContainer = doc.querySelector('.mg-scroll__content');

  if (contentContainer) {
    Array.from(contentContainer.children).forEach(child => {
      contentItems.push(child.outerHTML);
    });
  } else if (container.innerHTML.trim()) {
    contentItems.push(container.innerHTML);
  }

  props.children = contentItems;
  return props;
}
