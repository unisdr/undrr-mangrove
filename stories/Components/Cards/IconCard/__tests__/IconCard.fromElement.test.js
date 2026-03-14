import iconCardFromElement from '../IconCard.fromElement';

function makeContainer(attrs = {}) {
  const el = document.createElement('div');
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(`data-${key}`, value);
  });
  return el;
}

const sampleItems = [
  { icon: 'mg-icon mg-icon-globe', title: 'Global', summaryText: 'Worldwide coverage' },
  { icon: 'mg-icon mg-icon-chart-bar', title: 'Data', link: '/data' },
];

describe('iconCardFromElement', () => {
  it('returns defaults when no data attributes are set', () => {
    const props = iconCardFromElement(makeContainer());
    expect(props).toEqual({
      centered: false,
      variant: 'default',
      labelPosition: 'content',
      data: [],
    });
  });

  it('parses items JSON and boolean/enum attributes', () => {
    const props = iconCardFromElement(
      makeContainer({
        items: JSON.stringify(sampleItems),
        centered: 'true',
        variant: 'negative',
      })
    );
    expect(props.data).toEqual(sampleItems);
    expect(props.centered).toBe(true);
    expect(props.variant).toBe('negative');
  });

  it('returns empty data array for invalid JSON', () => {
    const props = iconCardFromElement(
      makeContainer({ items: '{broken' })
    );
    expect(props.data).toEqual([]);
  });

  it('treats centered as false when not explicitly "true"', () => {
    const props = iconCardFromElement(
      makeContainer({ centered: 'false' })
    );
    expect(props.centered).toBe(false);
  });
});
