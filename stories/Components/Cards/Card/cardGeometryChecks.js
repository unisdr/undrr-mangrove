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

  const title = content.querySelector('.mg-card__title:first-child');
  if (title) {
    expect(parseFloat(contentStyle.paddingBlockStart)).toBe(padding);
    expect(
      Math.abs(
        title.getBoundingClientRect().top -
          content.getBoundingClientRect().top -
          padding
      )
    ).toBeLessThan(1);
    expect(doc.defaultView.getComputedStyle(title).paddingBlockStart).toBe(
      '0px'
    );
  }

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

// A local non-3:4 cover makes cropping regressions independent of the network.
export const publicationCoverFixture =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="240"><rect width="160" height="240" fill="white"/><path d="M0 40h160v60H0z" fill="#00558a"/><text x="12" y="24" font-size="12">Publication cover</text><text x="12" y="225" font-size="12">Complete artwork</text></svg>'
  );

export async function checkPublicationSurface({ canvasElement }) {
  const doc = canvasElement.ownerDocument;
  const card = canvasElement.querySelector('.mg-card');
  const visual = card.querySelector('.mg-card__visual');
  const image = visual.querySelector('img');
  await image.decode();
  const cardStyle = doc.defaultView.getComputedStyle(card);
  const visualStyle = doc.defaultView.getComputedStyle(visual);
  expect(cardStyle.boxShadow).toBe('none');
  expect(cardStyle.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(cardStyle.paddingTop).toBe('0px');
  const beside =
    card.classList.contains('mg-card-book__hc') &&
    doc.defaultView.matchMedia('(min-width: 640px)').matches;
  expect(cardStyle.gridTemplateColumns.split(/\s+/)).toHaveLength(
    beside ? 2 : 1
  );
  expect(visualStyle.borderTopLeftRadius).toBe('0px');
  expect(visualStyle.outlineStyle).toBe('none');
  const bounds = image.getBoundingClientRect();
  expect(bounds.width / bounds.height).toBeCloseTo(
    image.naturalWidth / image.naturalHeight,
    2
  );
}
