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
 * The access block stays compact so the Description starts high. The old
 * stacked list measured 237px for one file and 454px for three at 1378px.
 * Budgets are per width: the test runner is narrow.
 */
export const checkAccessBudget = (wide, narrow) =>
  async function checkAccessHeight({ canvasElement }) {
    const doc = canvasElement.ownerDocument;
    await doc.fonts.ready;
    const access = canvasElement.querySelector(
      '.mg-publication-record__access'
    );
    await waitFor(() => expect(access).not.toBeNull());
    const budget = doc.defaultView.innerWidth >= 768 ? wide : narrow;
    expect(access.getBoundingClientRect().height).toBeLessThanOrEqual(budget);
    // The Description follows the access block directly.
    const sections = [...canvasElement.querySelectorAll('main section')];
    const accessSection = access.closest('section');
    expect(
      sections[sections.indexOf(accessSection) + 1].querySelector('h2')
    ).not.toBeNull();
  };

/**
 * Tier 4 (34 files): language and text filters over one table, the first 6
 * rows of the current view, and ShowMore items mode for the rest.
 */
export async function checkCollapsedList({ canvasElement }) {
  const doc = canvasElement.ownerDocument;
  const view = doc.defaultView;
  const root = canvasElement.querySelector('.mg-publication-record');
  const rows = () => [
    ...root.querySelectorAll('.mg-publication-record__files tbody tr'),
  ];
  const shown = () => rows().filter(row => !row.hidden);
  const toggle = () => root.querySelector('.mg-publication-record__show-all');
  const live = () => root.querySelector('.mg-publication-record__status');
  await waitFor(() => expect(toggle()?.hidden).toBe(false));

  expect(rows()).toHaveLength(34);
  expect(shown()).toHaveLength(6);
  // Table rows use plain hidden (until-found doesn't work on rows).
  expect(rows()[6].getAttribute('hidden')).toBe('');
  expect(toggle().textContent).toBe('Show all 34 files');
  expect(toggle()).toHaveAttribute('aria-expanded', 'false');

  // Enter opens and moves focus to row 7's first control.
  toggle().focus();
  await userEvent.keyboard('{Enter}');
  expect(shown()).toHaveLength(34);
  expect(doc.activeElement).toBe(rows()[6].querySelector('a'));
  toggle().focus();
  await userEvent.keyboard(' ');
  expect(shown()).toHaveLength(6);
  expect(doc.activeElement).toBe(toggle());

  // A language filter: focus stays on the control, the count is announced,
  // and four rows need no toggle.
  const french = root.querySelector(
    '.mg-publication-record__language-filter input[value="fr"]'
  );
  french.focus();
  await userEvent.click(french);
  expect(doc.activeElement).toBe(french);
  expect(rows()).toHaveLength(4);
  expect(toggle()).toBeNull();
  expect(live().textContent).toBe('Showing 4 of 34 files');
  expect(
    root.querySelector('.mg-publication-record__files thead').textContent
  ).not.toMatch(/Language/);

  // The text filter combines with the language filter.
  const all = root.querySelector(
    '.mg-publication-record__language-filter input[value="all"]'
  );
  await userEvent.click(all);
  const input = root.querySelector('.mg-publication-record__text-filter input');
  await userEvent.type(input, 'annex 2');
  expect(doc.activeElement).toBe(input);
  // Annex 2 and 20–29 (two are French or Spanish titles: Annexe 21, 28 /
  // Anexo 27 don't contain "annex 2").
  expect(rows().length).toBeGreaterThan(6);
  expect(shown()).toHaveLength(6);
  expect(toggle().textContent).toBe(`Show all ${rows().length} files`);
  await userEvent.click(french);
  expect(rows().every(row => row.textContent.includes('Annexe 2'))).toBe(true);

  // "All downloads (34)" resets the filters and opens the list.
  const jump = root.querySelector('.mg-publication-record__all-downloads a');
  expect(jump.textContent).toBe('All downloads (34)');
  jump.addEventListener('click', event => event.preventDefault(), {
    once: true,
  });
  await userEvent.click(jump);
  expect(input.value).toBe('');
  expect(all.checked).toBe(true);
  expect(rows()).toHaveLength(34);
  expect(shown()).toHaveLength(34);
  // The cover still targets the first resource in source order.
  expect(
    root
      .querySelector('.mg-publication-record__cover-link')
      .getAttribute('href')
  ).toBe(rows()[0].querySelector('a').getAttribute('href'));
  toggle().click(); // Leave the story collapsed, as it loads.
  expect(shown()).toHaveLength(6);
  view.getSelection().removeAllRanges();
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
