/**
 * Generates a table of contents (TOC) for a given content element.
 * @param {HTMLElement} contentElement - The element containing the content to generate TOC for.
 * @param {string} tocSelector - The selector for the TOC container element.
 */
export function mgTableOfContents(contentElement, tocSelector) {
  // Find or create the TOC element
  let tocElement = document.querySelector(tocSelector);
  if (!tocElement) {
    tocElement = document.createElement("section");
    tocElement.className = tocSelector.replace(".", "");

    // Find the first H1 element and insert the TOC after it
    const firstHeading = contentElement.querySelector("h1");
    if (firstHeading) {
      firstHeading.insertAdjacentElement("afterend", tocElement);
    } else {
      contentElement.insertBefore(tocElement, contentElement.firstChild);
    }
  }

  const tocHeader = document.createElement("h2");
  tocHeader.textContent = "On this page";
  tocHeader.id = "on-this-page";
  tocElement.appendChild(tocHeader);

  const tocList = document.createElement("ul");
  tocElement.appendChild(tocList);

  // Select all H2 elements within the content
  const headings = contentElement.querySelectorAll("h2");

  headings.forEach((heading) => {
    // Exclude the "On this page" header
    if (heading.id === "on-this-page") return;

    // Create an ID if not present
    if (!heading.id) {
      heading.id = heading.textContent
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "") // Remove exotic characters
        .replace(/\s+/g, "-"); // Replace spaces with hyphens
    }

    // Create the list item for the TOC
    const listItem = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;

    listItem.appendChild(link);
    tocList.appendChild(listItem);
  });
}
