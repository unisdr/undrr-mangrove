import megaMenuFromElement from '../MegaMenu.fromElement';

function makeContainer(attrs = {}) {
  const el = document.createElement('div');
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(`data-${key}`, value);
  });
  return el;
}

describe('megaMenuFromElement', () => {
  it('returns defaults when no data attributes are set', () => {
    const props = megaMenuFromElement(makeContainer());
    expect(props).toEqual({
      delay: 300,
      hoverDelay: 180,
    });
  });

  it('extracts timing props from data attributes', () => {
    const props = megaMenuFromElement(
      makeContainer({ delay: '500', 'hover-delay': '250' })
    );
    expect(props.delay).toBe(500);
    expect(props.hoverDelay).toBe(250);
  });

  it('parses sections from JSON data attribute', () => {
    const sections = [
      {
        title: 'Knowledge Hub',
        bannerHeading: 'Knowledge Hub',
        items: [{ title: 'Publications', url: '/publications' }],
      },
    ];
    const props = megaMenuFromElement(
      makeContainer({ sections: JSON.stringify(sections) })
    );
    expect(props.sections).toEqual(sections);
  });

  it('returns empty sections array for invalid JSON', () => {
    const props = megaMenuFromElement(
      makeContainer({ sections: '{broken' })
    );
    expect(props.sections).toEqual([]);
  });

  it('omits sections when attribute is not present', () => {
    const props = megaMenuFromElement(makeContainer());
    expect(props).not.toHaveProperty('sections');
  });
});
