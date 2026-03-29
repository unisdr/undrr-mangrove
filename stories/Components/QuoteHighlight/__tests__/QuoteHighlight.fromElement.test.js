import quoteHighlightFromElement from '../QuoteHighlight.fromElement';

function makeContainer(attrs = {}) {
  const el = document.createElement('div');
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(`data-${key}`, value);
  });
  return el;
}

describe('quoteHighlightFromElement', () => {
  it('returns defaults when no data attributes are set', () => {
    const props = quoteHighlightFromElement(makeContainer());
    expect(props).toEqual({
      quote: '',
      attribution: undefined,
      attributionTitle: undefined,
      image: undefined,
      backgroundColor: 'light',
      variant: 'line',
      alignment: 'full',
    });
  });

  it('extracts all data attributes', () => {
    const props = quoteHighlightFromElement(
      makeContainer({
        quote: '<p>Disaster risk reduction saves lives.</p>',
        attribution: 'Secretary-General',
        'attribution-title': 'United Nations',
        'image-src': '/photo.jpg',
        'image-alt': 'Portrait',
        'background-color': 'dark',
        variant: 'image',
        alignment: 'left',
      })
    );
    expect(props).toEqual({
      quote: '<p>Disaster risk reduction saves lives.</p>',
      attribution: 'Secretary-General',
      attributionTitle: 'United Nations',
      image: { src: '/photo.jpg', alt: 'Portrait' },
      backgroundColor: 'dark',
      variant: 'image',
      alignment: 'left',
    });
  });

  it('falls back to defaults for partial attributes', () => {
    const props = quoteHighlightFromElement(
      makeContainer({
        quote: 'Build back better.',
        'background-color': 'bright',
      })
    );
    expect(props.quote).toBe('Build back better.');
    expect(props.backgroundColor).toBe('bright');
    expect(props.attribution).toBeUndefined();
    expect(props.variant).toBe('line');
    expect(props.alignment).toBe('full');
  });
});
