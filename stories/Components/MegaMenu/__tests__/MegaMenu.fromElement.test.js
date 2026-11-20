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
    expect(props).toEqual({});
  });

  it('ignores the timing attributes deprecated in MegaMenu 2.0', () => {
    const props = megaMenuFromElement(
      makeContainer({ delay: '500', 'hover-delay': '250' })
    );
    expect(props).not.toHaveProperty('delay');
    expect(props).not.toHaveProperty('hoverDelay');
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
    const props = megaMenuFromElement(makeContainer({ sections: '{broken' }));
    expect(props.sections).toEqual([]);
  });

  it('omits sections when attribute is not present', () => {
    const props = megaMenuFromElement(makeContainer());
    expect(props).not.toHaveProperty('sections');
  });

  it('extracts logo props from data attributes', () => {
    const props = megaMenuFromElement(
      makeContainer({
        'logo-src': 'https://assets.undrr.org/logos/pw/pw-logo.svg',
        'logo-alt': 'PreventionWeb',
        'logo-href': '/ar/',
        'logo-width': '160',
        'logo-height': '40',
      })
    );
    expect(props.logoSrc).toBe('https://assets.undrr.org/logos/pw/pw-logo.svg');
    expect(props.logoAlt).toBe('PreventionWeb');
    expect(props.logoHref).toBe('/ar/');
    expect(props.logoWidth).toBe(160);
    expect(props.logoHeight).toBe(40);
  });

  it('omits logo props when attributes are not present', () => {
    const props = megaMenuFromElement(makeContainer());
    expect(props).not.toHaveProperty('logoSrc');
    expect(props).not.toHaveProperty('logoAlt');
    expect(props).not.toHaveProperty('logoHref');
  });
});
