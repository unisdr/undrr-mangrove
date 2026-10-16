import { expect } from 'storybook/test';

// jsdom cannot see SCSS: these assertions run against the rendered stories.
export async function checkPhotoCardEdges({ canvasElement }) {
  const doc = canvasElement.ownerDocument;
  await doc.fonts.ready;
  const card = canvasElement.querySelector('.mg-card');
  const content = card.querySelector('.mg-card__content');
  const visual = card.querySelector('.mg-card__visual');
  const style = doc.defaultView.getComputedStyle(card);
  const contentStyle = doc.defaultView.getComputedStyle(content);
  const bounds = card.getBoundingClientRect();
  // Resolve the token through layout: themes can use rem, px or calc().
  const probe = doc.createElement('div');
  probe.style.cssText =
    'position: absolute; inline-size: var(--mg-card-padding); block-size: 0; visibility: hidden';
  card.appendChild(probe);
  const padding = probe.getBoundingClientRect().width;
  probe.remove();
  expect(parseFloat(contentStyle.paddingInlineEnd)).toBe(padding);
  expect(parseFloat(contentStyle.paddingBlockEnd)).toBe(padding);

  if (!visual) {
    expect(parseFloat(contentStyle.paddingInlineStart)).toBe(padding);
    expect(parseFloat(contentStyle.paddingBlockStart)).toBe(padding);
    expect(content.getBoundingClientRect().width).toBeCloseTo(
      card.clientWidth,
      0
    );
    return;
  }

  const media = visual.getBoundingClientRect();
  const near = (actual, expected) =>
    expect(Math.abs(actual - expected)).toBeLessThan(1);
  near(media.top, bounds.top + parseFloat(style.borderTopWidth));
  const leadingRight = style.direction === 'rtl';
  near(
    leadingRight ? media.right : media.left,
    leadingRight
      ? bounds.right - parseFloat(style.borderRightWidth)
      : bounds.left + parseFloat(style.borderLeftWidth)
  );
  const beside =
    card.classList.contains('mg-card__hc') &&
    doc.defaultView.matchMedia('(min-width: 640px)').matches;
  if (beside) {
    near(media.bottom, bounds.bottom - parseFloat(style.borderBottomWidth));
  } else {
    near(media.width, card.clientWidth);
  }
}
