import { expect, userEvent, waitFor } from 'storybook/test';
import { checkArticleGridGeometry } from '../../../Atom/Layout/Grid/gridGeometryChecks';

/**
 * A story-level play replaces the meta play, so record stories with their
 * own checks run the article grid check (#1504) first through this wrapper.
 * The marker lets a unit test prove every record story keeps it.
 */
export function withGridCheck(play) {
  const combined = async context => {
    await checkArticleGridGeometry(context);
    await play(context);
  };
  combined.runsGridCheck = true;
  return combined;
}

// Vitest Browser Mode can resize the viewport; Storybook's UI cannot.
async function browserPage() {
  try {
    const { page } = await import('@vitest/browser/context');
    return page?.viewport ? page : null;
  } catch {
    return null;
  }
}

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
 * (https://gitlab.com/undrr/web-backlog/-/work_items/3362). The aside is
 * measured in the real two-column layout: in Vitest the viewport is set to
 * 1164px, above the 900px article-grid breakpoint (#1504, #1508). Where the
 * viewport can't be resized (Storybook's UI), the grid's columns are forced
 * to the rail width instead.
 */
export async function checkAsideContainment({ canvasElement }) {
  await canvasElement.ownerDocument.fonts.ready;
  const root = canvasElement.querySelector('.mg-publication-record');
  const original = root.getAttribute('dir');
  const reading = root.querySelector('.mg-publication-record__reading');
  const view = canvasElement.ownerDocument.defaultView;
  const page = await browserPage();
  const size = [view.innerWidth, view.innerHeight];
  if (page) await page.viewport(1164, 900);
  else reading.style.gridTemplateColumns = 'minmax(0, 1fr) 16rem';
  try {
    for (const dir of ['ltr', 'rtl']) {
      root.setAttribute('dir', dir);
      const aside = root.querySelector('.mg-publication-record__aside');
      const asideBox = aside.getBoundingClientRect();
      expect(within(asideBox, reading.getBoundingClientRect())).toBe(true);
      expect(aside.scrollWidth).toBeLessThanOrEqual(aside.clientWidth + 1);
      expect(asideBox.width).toBeLessThan(16 * 16 + 1);
      // In the real layout the aside is beside the main column.
      if (page) {
        const main = root
          .querySelector('.mg-publication-record__main')
          .getBoundingClientRect();
        expect(asideBox.top).toBeLessThan(main.bottom);
      }
      // Each identifier keeps the direction its own text resolves to, so a
      // Latin DOI is not reordered on an RTL page or after an Arabic entry.
      aside.querySelectorAll('dd li').forEach(item => {
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
    if (page) await page.viewport(...size);
  }
}

/**
 * Every tier: the Description comes straight after the header, the files
 * section follows it, the header's "Files (N)" link points at the files
 * heading, and the link under the cover is always there: "All downloads (N)"
 * for several files, "Download options" for one.
 */
export async function checkDescriptionFirst({ canvasElement }) {
  const doc = canvasElement.ownerDocument;
  await doc.fonts.ready;
  const header = canvasElement.querySelector('.mg-publication-record__header');
  const description = canvasElement
    .querySelector('.mg-content')
    .closest('section');
  const files = canvasElement.querySelector(
    '.mg-publication-record__files-section'
  );
  expect(description.compareDocumentPosition(files)).toBe(
    doc.defaultView.Node.DOCUMENT_POSITION_FOLLOWING
  );
  // The Description starts directly under the header (and its jump link).
  const gap =
    description.getBoundingClientRect().top -
    header.getBoundingClientRect().bottom;
  expect(gap).toBeLessThan(120);
  const jump = header.querySelector('.mg-publication-record__files-jump a');
  expect(jump).not.toBeNull();
  expect(jump).toHaveAttribute('data-vf-analytics-label', 'nav_files_jump');
  const target = doc.getElementById(jump.getAttribute('href').slice(1));
  expect(target).toBe(files.querySelector('h2'));
  // The heading keeps a scroll margin so the jump doesn't land flush.
  expect(
    parseFloat(doc.defaultView.getComputedStyle(target).scrollMarginTop)
  ).toBeGreaterThan(0);
  const count = files.querySelectorAll(
    '.mg-publication-record__files tbody tr, .mg-publication-record__access-row'
  ).length;
  const cue = canvasElement.querySelector(
    '.mg-publication-record__all-downloads a'
  );
  if (canvasElement.querySelector('.mg-publication-record__cover-link')) {
    expect(cue).not.toBeNull();
    expect(cue.getAttribute('href')).toBe(jump.getAttribute('href'));
    expect(cue.textContent).toMatch(
      count > 1 ? /^All downloads \(\d+\)$/ : /^Download options$/
    );
  }
}

/**
 * Many files (34, three languages): the full table, every row visible, so
 * the browser's find-in-page reaches a late row; the language filter keeps
 * focus and announces the count; "All downloads (34)" resets it to All.
 */
export async function checkManyFiles({ canvasElement }) {
  const doc = canvasElement.ownerDocument;
  const view = doc.defaultView;
  const root = canvasElement.querySelector('.mg-publication-record');
  const rows = () => [
    ...root.querySelectorAll('.mg-publication-record__files tbody tr'),
  ];
  const live = () => root.querySelector('.mg-publication-record__status');
  await waitFor(() =>
    expect(
      root.querySelector('.mg-publication-record__language-filter')
    ).not.toBeNull()
  );

  expect(rows()).toHaveLength(34);
  expect(
    rows().filter(row => row.hidden || row.offsetHeight === 0)
  ).toHaveLength(0);
  expect(root.querySelector('[data-mg-show-more]')).toBeNull();
  expect(root.querySelector('input[type="search"]')).toBeNull();

  // Find-in-page reaches a late row (wrapping from wherever the selection is).
  view.getSelection().removeAllRanges();
  expect(view.find('Annex 30', false, false, true)).toBe(true);
  view.getSelection().removeAllRanges();

  // The language filter keeps focus and announces at once.
  const french = root.querySelector(
    '.mg-publication-record__language-filter input[value="fr"]'
  );
  french.focus();
  await userEvent.click(french);
  expect(doc.activeElement).toBe(french);
  expect(rows()).toHaveLength(4);
  expect(live().textContent).toBe('Showing 4 of 34 files');
  expect(
    root.querySelector('.mg-publication-record__files thead').textContent
  ).not.toMatch(/Language/);

  // "All downloads (34)" resets the filter to All.
  const jump = root.querySelector('.mg-publication-record__all-downloads a');
  expect(jump.textContent).toBe('All downloads (34)');
  jump.addEventListener('click', event => event.preventDefault(), {
    once: true,
  });
  await userEvent.click(jump);
  const all = root.querySelector(
    '.mg-publication-record__language-filter input[value="all"]'
  );
  expect(all.checked).toBe(true);
  expect(rows()).toHaveLength(34);
  // The cover still targets the first resource in source order.
  expect(
    root
      .querySelector('.mg-publication-record__cover-link')
      .getAttribute('href')
  ).toBe(rows()[0].querySelector('a').getAttribute('href'));
}

/** Seven languages: the language filter is a native select. */
export async function checkLanguageSelect({ canvasElement }) {
  const root = canvasElement.querySelector('.mg-publication-record');
  await waitFor(() =>
    expect(
      root.querySelector('.mg-publication-record__language-select select')
    ).not.toBeNull()
  );
  const select = root.querySelector(
    '.mg-publication-record__language-select select'
  );
  expect(select.options[0].textContent).toBe('All languages (7)');
  expect(select).toHaveAttribute(
    'data-vf-analytics-label',
    'nav_filter_language'
  );
  await userEvent.selectOptions(select, 'fr');
  expect(
    root.querySelectorAll('.mg-publication-record__files tbody tr')
  ).toHaveLength(1);
  await userEvent.selectOptions(select, 'all');
}
