import { expect } from 'storybook/test';

async function getBrowserPage() {
  try {
    const { page } = await import('@vitest/browser/context');
    return page;
  } catch {
    return null;
  }
}

/**
 * Asserts that the main reading column in .mg-grid--article is never
 * narrower than the rail across responsive widths (320px–1440px),
 * specifically covering the 760px, 800px, 860px, 899px, and 900px boundaries
 * in both LTR and RTL directions.
 */
export async function checkArticleGridGeometry({ canvasElement }) {
  await canvasElement.ownerDocument.fonts.ready;
  const grid = canvasElement.querySelector('.mg-grid--article');
  if (!grid) return;

  const main =
    grid.querySelector('.mg-reading__article, .mg-publication-record__main') ||
    grid.children[0];
  const rail = grid.querySelector(
    '.mg-publication-record__aside, .mg-table-of-contents, .mg-table-of-contents-wrapper, :scope > :last-child'
  );
  if (!main || !rail) return;

  const page = await getBrowserPage();
  if (!page?.viewport) return;

  const originalDir = canvasElement.getAttribute('dir') || 'ltr';
  const testWidths = [320, 760, 800, 860, 899, 900, 1164, 1440];

  try {
    for (const dir of ['ltr', 'rtl']) {
      canvasElement.setAttribute('dir', dir);
      for (const width of testWidths) {
        await page.viewport(width, 900);
        const mainBox = main.getBoundingClientRect();
        const railBox = rail.getBoundingClientRect();

        // The main column must never be narrower than the rail.
        // Allow 1px tolerance for subpixel rounding.
        expect(mainBox.width).toBeGreaterThanOrEqual(railBox.width - 1);
      }
    }
  } finally {
    canvasElement.setAttribute('dir', originalDir);
    await page.viewport(1200, 900);
  }
}
