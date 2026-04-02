/**
 * Generates a table of contents (TOC) for a given content element.
 *
 * Can be used in two ways:
 * 1. Auto-init: place a `<section data-mg-table-of-contents>` element on the
 *    page and this script will find it, locate the content area, and build the
 *    TOC automatically on DOMContentLoaded.
 * 2. Manual: import `mgTableOfContents` and call it with your own elements.
 *
 * Data attributes (for auto-init):
 *   data-mg-table-of-contents              — Required. Activates the component.
 *   data-mg-table-of-contents-content      — CSS selector for the content area
 *                                            to scan for headings. Defaults to
 *                                            document.body.
 *   data-mg-table-of-contents-title        — Title text for the TOC header.
 *                                            Defaults to "On this page".
 *                                            Set to "hidden" for sr-only.
 *   data-mg-table-of-contents-show-title   — Set to "false" to hide the title.
 *   data-mg-table-of-contents-skip-auto-init — Opt out of auto-init.
 *
 * @param {HTMLElement} contentElement - The element containing the content to
 *   generate TOC for. This only selects h2 elements.
 * @param {HTMLElement} tocElement - The TOC container element.
 * @param {boolean} showNumbers - Whether to use ordered list (true) or
 *   unordered list (false).
 */
export function mgTableOfContents(
  contentElement,
  tocElement,
  showNumbers = false
) {
  if (!contentElement || !tocElement) {
    console.error('Content element or TOC element is not provided.');
    return;
  }

  // Ensure tocElement is a valid DOM element
  if (!(tocElement instanceof HTMLElement)) {
    console.error('TOC element is not a valid DOM element.');
    return;
  }

  const showTitle =
    tocElement.getAttribute('data-mg-table-of-contents-show-title') !== 'false';

  if (showTitle) {
    const tocHeader = document.createElement('h2');
    tocHeader.textContent =
      tocElement.getAttribute('data-mg-table-of-contents-title') ||
      'On this page';
    tocHeader.id = 'on-this-page';
    tocHeader.classList.add('mg-on-this-page-header');
    if (tocHeader.textContent === 'hidden') {
      tocHeader.classList.add('mg-u-sr-only');
    }
    tocElement.prepend(tocHeader);
  }

  const ListComponent = showNumbers ? 'ol' : 'ul';
  const tocList = document.createElement(ListComponent);
  tocElement.appendChild(tocList);

  // Select all H2 elements within the content
  const headings = contentElement.querySelectorAll('h2');

  headings.forEach(heading => {
    if (heading.id === 'on-this-page') return;
    if (heading.classList.contains('mg-table-of-contents--exclude')) return;
    if (heading.classList.contains('mg-u-sr-only')) return;

    if (!heading.id) {
      heading.id = heading.textContent
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
    }

    const listItem = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;

    // Smooth scroll on click
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById(heading.id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (window.history && window.history.pushState) {
          window.history.pushState(null, null, `#${heading.id}`);
        }
      }
    });

    listItem.appendChild(link);
    tocList.appendChild(listItem);
  });
}

/**
 * Auto-initialize TOC elements on the page.
 * @param {NodeList|HTMLElement[]|HTMLElement} [scope] - Elements to init.
 *   Defaults to all [data-mg-table-of-contents] on the page.
 */
export function mgTableOfContentsInit(scope) {
  const containers = scope
    ? scope instanceof HTMLElement
      ? [scope]
      : scope
    : document.querySelectorAll('[data-mg-table-of-contents]');

  containers.forEach(tocElement => {
    if (
      !scope &&
      tocElement.hasAttribute('data-mg-table-of-contents-skip-auto-init')
    )
      return;
    if (tocElement.dataset.mgTableOfContentsInitialized) return;
    tocElement.dataset.mgTableOfContentsInitialized = 'true';

    // Determine content element from data attribute or default to document.body
    const contentSelector = tocElement.getAttribute(
      'data-mg-table-of-contents-content'
    );
    const contentElement = contentSelector
      ? document.querySelector(contentSelector)
      : document.body;

    if (contentElement) {
      mgTableOfContents(contentElement, tocElement);
    } else if (contentSelector) {
      console.warn(
        `[mg-table-of-contents] Content element not found: "${contentSelector}"`
      );
    }
  });
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    () => mgTableOfContentsInit(),
    false
  );
} else {
  mgTableOfContentsInit();
}
