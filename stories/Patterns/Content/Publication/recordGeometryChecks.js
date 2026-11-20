import { expect } from 'storybook/test';

// jsdom cannot see SCSS: these assertions run against the rendered stories.
const within = (inner, outer) =>
  inner.left >= outer.left - 1 &&
  inner.right <= outer.right + 1 &&
  inner.top >= outer.top - 1 &&
  inner.bottom <= outer.bottom + 1;

/** The badge sits on the cover and the link covers the whole image. */
export async function checkCoverAffordance({ canvasElement }) {
  await canvasElement.ownerDocument.fonts.ready;
  const figure = canvasElement.querySelector('.mg-publication-record__cover');
  const link = figure.querySelector('.mg-publication-record__cover-link');
  const badge = figure.querySelector('.mg-publication-record__cover-badge');
  const image = figure.querySelector('img');
  const imageBox = image.getBoundingClientRect();
  const linkBox = link.getBoundingClientRect();
  const badgeBox = badge.getBoundingClientRect();
  expect(badgeBox.width).toBeGreaterThan(20);
  expect(within(badgeBox, imageBox)).toBe(true);
  expect(within(imageBox, linkBox)).toBe(true);
  // A click anywhere on the image lands on the link.
  const doc = canvasElement.ownerDocument;
  const hit = doc.elementFromPoint(
    imageBox.left + imageBox.width / 2,
    imageBox.top + imageBox.height / 2
  );
  expect(link.contains(hit)).toBe(true);
}

/**
 * Long identifiers wrap inside the aside in both directions. Drupal's sidebar
 * overflowed 73px in RTL on a long DOI
 * (https://gitlab.com/undrr/web-backlog/-/work_items/3362). The test viewport
 * is narrower than the two-column breakpoint, so the check forces the wide
 * layout's columns (Grid's `.mg-grid--article`: content plus a 16rem rail)
 * to measure the aside at rail width.
 */
export async function checkAsideContainment({ canvasElement }) {
  await canvasElement.ownerDocument.fonts.ready;
  const root = canvasElement.querySelector('.mg-publication-record');
  const original = root.getAttribute('dir');
  const reading = root.querySelector('.mg-publication-record__reading');
  reading.style.gridTemplateColumns = 'minmax(0, 1fr) 16rem';
  try {
    for (const dir of ['ltr', 'rtl']) {
      root.setAttribute('dir', dir);
      const aside = root.querySelector('.mg-publication-record__aside');
      const asideBox = aside.getBoundingClientRect();
      expect(within(asideBox, reading.getBoundingClientRect())).toBe(true);
      expect(aside.scrollWidth).toBeLessThanOrEqual(aside.clientWidth + 1);
      expect(asideBox.width).toBeLessThan(16 * 16 + 1);
      aside.querySelectorAll('figure, dd, li').forEach(node => {
        expect(within(node.getBoundingClientRect(), asideBox)).toBe(true);
        // Text can spill out of a box that itself fits; RTL spills leftwards,
        // which scrollWidth does not report.
        const range = node.ownerDocument.createRange();
        range.selectNodeContents(node);
        expect(within(range.getBoundingClientRect(), asideBox)).toBe(true);
      });
    }
  } finally {
    root.setAttribute('dir', original);
    reading.style.gridTemplateColumns = '';
  }
}
