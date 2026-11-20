import { expect, userEvent, waitFor } from 'storybook/test';

// jsdom cannot see SCSS: these assertions run against the rendered stories.
const within = (inner, outer) =>
  inner.left >= outer.left - 1 &&
  inner.right <= outer.right + 1 &&
  inner.top >= outer.top - 1 &&
  inner.bottom <= outer.bottom + 1;

// Finds a rule that reveals the badge on hover, inside @media (hover: hover).
// Play functions cannot produce a real :hover, so the reveal is checked in
// the stylesheet and the badge position with the badge forced visible.
function hasHoverReveal(doc) {
  const visit = (rules, inHoverMedia) =>
    [...rules].some(rule => {
      if (rule.media && rule.cssRules)
        return visit(
          rule.cssRules,
          inHoverMedia || /\(hover:\s*hover\)/.test(rule.media.mediaText)
        );
      if (rule.cssRules && rule.cssRules.length && !rule.style)
        return visit(rule.cssRules, inHoverMedia);
      return (
        inHoverMedia &&
        /cover-link:hover\s+\.mg-publication-record__cover-badge/.test(
          rule.selectorText || ''
        ) &&
        rule.style?.display === 'grid'
      );
    });
  return [...doc.styleSheets].some(sheet => {
    try {
      return visit(sheet.cssRules, false);
    } catch {
      return false; // Cross-origin sheet.
    }
  });
}

/**
 * The badge is hidden until hover. When shown, it sits in the cover's bottom
 * inline-end corner, in LTR and RTL, and the link covers the whole image. The
 * record root's dir is switched in place, as in the aside check, rather than
 * adding a dedicated RTL story.
 */
export async function checkCoverAffordance({ canvasElement }) {
  const doc = canvasElement.ownerDocument;
  await doc.fonts.ready;
  const root = canvasElement.querySelector('.mg-publication-record');
  const original = root.getAttribute('dir');
  const figure = root.querySelector('.mg-publication-record__cover');
  const link = figure.querySelector('.mg-publication-record__cover-link');
  const badge = figure.querySelector('.mg-publication-record__cover-badge');
  const image = figure.querySelector('img');
  const view = doc.defaultView;
  expect(view.getComputedStyle(badge).display).toBe('none');
  expect(hasHoverReveal(doc)).toBe(true);
  try {
    badge.style.display = 'grid';
    for (const dir of ['ltr', 'rtl']) {
      root.setAttribute('dir', dir);
      figure.scrollIntoView({ block: 'center' });
      const imageBox = image.getBoundingClientRect();
      const linkBox = link.getBoundingClientRect();
      const badgeBox = badge.getBoundingClientRect();
      expect(badgeBox.width).toBeGreaterThan(20);
      expect(within(badgeBox, imageBox)).toBe(true);
      expect(within(imageBox, linkBox)).toBe(true);
      // Bottom half, on the inline-end side: right in LTR, left in RTL.
      const middle = imageBox.left + imageBox.width / 2;
      expect(badgeBox.top).toBeGreaterThan(imageBox.top + imageBox.height / 2);
      if (dir === 'ltr') expect(badgeBox.left).toBeGreaterThan(middle);
      else expect(badgeBox.right).toBeLessThan(middle);
      // A click anywhere on the image lands on the link.
      const hit = doc.elementFromPoint(
        middle,
        imageBox.top + imageBox.height / 2
      );
      expect(link.contains(hit)).toBe(true);
    }
  } finally {
    badge.style.display = '';
    root.setAttribute('dir', original);
  }
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
      // Each identifier keeps the direction its own text resolves to, so a
      // Latin DOI is not reordered on an RTL page or after an Arabic entry.
      aside.querySelectorAll('dd li').forEach(item => {
        const view = item.ownerDocument.defaultView;
        expect(view.getComputedStyle(item).direction).toBe(
          item.matches(':dir(rtl)') ? 'rtl' : 'ltr'
        );
        // ASCII text with a Latin letter (a DOI, a symbol) is always LTR.
        if (/^[\x20-\x7e]*[a-z][\x20-\x7e]*$/i.test(item.textContent)) {
          expect(view.getComputedStyle(item).direction).toBe('ltr');
        }
      });
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

/**
 * A long list shows two groups; ShowMore's items mode hides the rest with
 * hidden="until-found". The toggle is a disclosure button that works with
 * Enter and Space, opening leaves focus on it, closing pulls focus out of a
 * hidden group, and a find-in-page match opens the list.
 */
export async function checkCollapsedList({ canvasElement }) {
  const doc = canvasElement.ownerDocument;
  const toggle = canvasElement.querySelector(
    '.mg-publication-record__show-all'
  );
  const items = [
    ...canvasElement.querySelectorAll('.mg-publication-record__resources > li'),
  ];
  const shown = () =>
    items.filter(item => !item.hidden && item.offsetHeight > 0);
  await waitFor(() => expect(toggle.hidden).toBe(false));
  expect(items).toHaveLength(34);
  expect(shown()).toHaveLength(2);
  // A hidden group takes no space: its padding and border are dropped too.
  expect(items[20].getBoundingClientRect().height).toBe(0);
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(toggle.textContent).toBe('Show all 34 files');

  // Enter opens, focus stays on the toggle; Space closes; Enter reopens.
  toggle.focus();
  await userEvent.keyboard('{Enter}');
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(shown()).toHaveLength(34);
  expect(doc.activeElement).toBe(toggle);
  expect(toggle.textContent).toBe('Show fewer files');
  await userEvent.keyboard(' ');
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(shown()).toHaveLength(2);

  // Closing while focus is in a group that is about to be hidden moves
  // focus to the toggle, never to a hidden or off-screen control.
  await userEvent.keyboard('{Enter}');
  items[33].querySelector('a').focus();
  toggle.click();
  expect(doc.activeElement).toBe(toggle);

  // Find-in-page revealing a hidden group opens the whole list.
  items[20].dispatchEvent(new Event('beforematch', { bubbles: true }));
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(shown()).toHaveLength(34);
  toggle.click();

  // "All downloads (34)" opens the list before jumping to it.
  const jump = canvasElement.querySelector(
    '.mg-publication-record__all-downloads a'
  );
  expect(jump.textContent).toBe('All downloads (34)');
  jump.addEventListener('click', event => event.preventDefault(), {
    once: true,
  });
  await userEvent.click(jump);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  toggle.click(); // Leave the story collapsed, as it loads.
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
}
