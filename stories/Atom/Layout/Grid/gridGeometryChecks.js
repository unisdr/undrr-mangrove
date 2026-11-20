import { expect } from 'storybook/test';

// Matches $mg-breakpoint-tablet, where .mg-grid--article becomes two columns.
const TWO_COLUMN_MIN_WIDTH = 900;
const TEST_WIDTHS = [320, 760, 800, 860, 899, 900, 1164, 1440];
const MAIN_SELECTOR = '.mg-reading__article';

// Vitest Browser Mode only. Storybook's UI and Chromatic cannot resize the
// viewport, so they run the structure check below and skip the width sweep.
async function getBrowserPage() {
  try {
    const { page } = await import('@vitest/browser/context');
    return page;
  } catch {
    return null;
  }
}

/**
 * Finds the two grid items of `.mg-grid--article`: the main column (the
 * direct child that is or contains `.mg-reading__article`) and the rail
 * (the other direct child). Throws when the story markup does not match, so
 * a markup change cannot silently turn the geometry check into a no-op.
 */
function getArticleGridColumns(canvasElement) {
  const grid = canvasElement.querySelector('.mg-grid--article');
  if (!grid) {
    throw new Error('checkArticleGridGeometry: no .mg-grid--article found');
  }

  const items = [...grid.children];
  const main = items.find(
    item => item.matches(MAIN_SELECTOR) || item.querySelector(MAIN_SELECTOR)
  );
  const rails = items.filter(item => item !== main);
  if (!main || rails.length !== 1) {
    throw new Error(
      `checkArticleGridGeometry: expected one ${MAIN_SELECTOR} column and one rail as direct children of .mg-grid--article, found ${items.length} children`
    );
  }

  return { grid, main, rail: rails[0] };
}

/**
 * Sweeps the viewport from 320px to 1440px in both directions and asserts
 * that `.mg-grid--article`:
 * - never makes the main column narrower than the rail (#1504),
 * - stacks the rail and main column below 900px,
 * - places the rail on the inline-end side (right in LTR, left in RTL) from
 *   900px up.
 */
export async function checkArticleGridGeometry({ canvasElement }) {
  await canvasElement.ownerDocument.fonts.ready;
  const { grid, main, rail } = getArticleGridColumns(canvasElement);

  const page = await getBrowserPage();
  if (!page?.viewport) return;

  const view = canvasElement.ownerDocument.defaultView;
  const originalSize = [view.innerWidth, view.innerHeight];
  const originalDir = grid.getAttribute('dir');

  try {
    for (const dir of ['ltr', 'rtl']) {
      grid.setAttribute('dir', dir);
      for (const width of TEST_WIDTHS) {
        await page.viewport(width, 900);
        const mainBox = main.getBoundingClientRect();
        const railBox = rail.getBoundingClientRect();
        const at = `${dir} at ${width}px`;

        // 1px tolerance for subpixel rounding throughout.
        expect(
          mainBox.width,
          `main column width, ${at}`
        ).toBeGreaterThanOrEqual(railBox.width - 1);

        if (width < TWO_COLUMN_MIN_WIDTH) {
          const stacked =
            mainBox.top >= railBox.bottom - 1 ||
            railBox.top >= mainBox.bottom - 1;
          expect(stacked, `rail and main column stacked, ${at}`).toBe(true);
        } else if (dir === 'ltr') {
          expect(
            railBox.left,
            `rail right of main column, ${at}`
          ).toBeGreaterThanOrEqual(mainBox.right - 1);
        } else {
          expect(
            railBox.right,
            `rail left of main column, ${at}`
          ).toBeLessThanOrEqual(mainBox.left + 1);
        }
      }
    }
  } finally {
    if (originalDir === null) grid.removeAttribute('dir');
    else grid.setAttribute('dir', originalDir);
    await page.viewport(...originalSize);
  }
}
