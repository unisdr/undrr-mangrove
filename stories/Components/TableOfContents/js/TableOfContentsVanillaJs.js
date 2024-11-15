/**
 * Generates a table of contents (TOC) for a given content element.
 * @param {HTMLElement} contentElement - The element containing the content to generate TOC for. This only selects h2 elements, be sure to pass the dom element and not the query selector.
 * @param {HTMLElement} tocElement - The TOC container element, be sure to pass the dom element and not the query selector.
 * @param {boolean} showNumbers - Whether to use ordered list (true) or unordered list (false).
 */
// stories\Components\TableOfContents\js\TableOfContentsVanillaJs.js
export function mgTableOfContents(contentElement, tocElement, showNumbers = false) {
  if (!contentElement || !tocElement) {
    console.error("Content element or TOC element is not provided.");
    return;
  }

  // Ensure tocElement is a valid DOM element
  if (!(tocElement instanceof HTMLElement)) {
    console.error("TOC element is not a valid DOM element.");
    return;
  }

  const ListComponent = showNumbers ? "ol" : "ul";
  const tocHeader = document.createElement("h2");
  tocHeader.textContent = tocElement.getAttribute('data-mg-table-of-contents-title') || "On this page";
  tocHeader.id = "on-this-page";
  tocHeader.classList.add("mg-on-this-page-header");
  if (tocHeader.textContent != "hidden") {
    tocElement.prepend(tocHeader);
  }

  const tocList = document.createElement(ListComponent);
  tocElement.appendChild(tocList);

  // Select all H2 elements within the content
  const headings = contentElement.querySelectorAll("h2");

  headings.forEach((heading) => {
    if (heading.id === "on-this-page") return;
    if (heading.classList.contains("mg-table-of-contents--exclude")) return;

    if (!heading.id) {
      heading.id = heading.textContent
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
    }

    const listItem = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;

    listItem.appendChild(link);
    tocList.appendChild(listItem);
  });
}
