const CONTENT_CLASS = 'mg-scroll__content';

/**
 * Find the content wrapper this container owns.
 *
 * A direct child wins. Otherwise the first descendant wrapper is used, as
 * long as no nested scroll container sits between it and this container.
 *
 * @param {Element} container - The scroll container being hydrated
 * @returns {Element|null} The container's own content wrapper, if it has one
 */
function findOwnContent(container) {
  const directChild = Array.from(container.children).find(child =>
    child.classList.contains(CONTENT_CLASS)
  );
  if (directChild) return directChild;

  return (
    Array.from(container.querySelectorAll(`.${CONTENT_CLASS}`)).find(
      candidate => {
        let node = candidate.parentElement;
        while (node && node !== container) {
          if (node.hasAttribute('data-mg-scroll-container')) return false;
          node = node.parentElement;
        }
        return node === container;
      }
    ) || null
  );
}

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
    stretchItems: dataset.stretchItems === 'true',
    stepSize: dataset.stepSize ? parseInt(dataset.stepSize, 10) : null,
  };

  // Extract children as HTML strings from server-rendered content.
  //
  // The lookup reads this container only. A page can hold several scroll
  // containers, and one can hold another: a `.mg-scroll__content` that
  // belongs to a nested scroll container is not this container's content,
  // so it is skipped rather than rendered here as well.
  const contentItems = [];
  const contentContainer = findOwnContent(container);

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
