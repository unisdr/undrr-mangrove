import textCtaFromElement from '../TextCta.fromElement';

function createContainer(attrs = {}) {
  const el = document.createElement('div');
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(`data-${key}`, value);
  });
  return el;
}

describe('textCtaFromElement', () => {
  // --------------------------------------------------
  // Full extraction
  // --------------------------------------------------

  it('extracts all attributes from a fully-populated element', () => {
    const buttons = JSON.stringify([
      { label: 'Read more', url: '/about' },
      { label: 'Contact', url: '/contact', type: 'Secondary' },
    ]);

    const props = textCtaFromElement(
      createContainer({
        headline: 'Join the platform',
        'headline-size': '800',
        text: '<p>Body text</p>',
        buttons,
        variant: 'tertiary',
        'background-color': '#2c5f2d',
        padding: '4rem 0',
        image: 'https://example.com/photo.jpg',
        'image-alt': 'A photo',
        centered: 'false',
        'class-name': 'my-custom',
      }),
    );

    expect(props.headline).toBe('Join the platform');
    expect(props.headlineSize).toBe('800');
    expect(props.text).toBe('<p>Body text</p>');
    expect(props.buttons).toEqual([
      { label: 'Read more', url: '/about' },
      { label: 'Contact', url: '/contact', type: 'Secondary' },
    ]);
    expect(props.variant).toBe('tertiary');
    expect(props.backgroundColor).toBe('#2c5f2d');
    expect(props.padding).toBe('4rem 0');
    expect(props.image).toBe('https://example.com/photo.jpg');
    expect(props.imageAlt).toBe('A photo');
    expect(props.centered).toBe(false);
    expect(props.className).toBe('my-custom');
  });

  // --------------------------------------------------
  // Defaults for bare element
  // --------------------------------------------------

  it('returns defaults for a bare element', () => {
    const props = textCtaFromElement(createContainer());

    expect(props.headline).toBe('');
    expect(props.headlineSize).toBe('600');
    expect(props.text).toBe('');
    expect(props.buttons).toEqual([]);
    expect(props.variant).toBe('primary');
    expect(props.backgroundColor).toBeUndefined();
    expect(props.padding).toBeUndefined();
    expect(props.image).toBeUndefined();
    expect(props.imageAlt).toBe('');
    expect(props.centered).toBe(true);
    expect(props.className).toBeUndefined();
  });

  // --------------------------------------------------
  // JSON button parsing
  // --------------------------------------------------

  it('parses buttons JSON from data-buttons attribute', () => {
    const buttons = JSON.stringify([{ label: 'Go', url: '/go' }]);
    const props = textCtaFromElement(createContainer({ buttons }));

    expect(props.buttons).toEqual([{ label: 'Go', url: '/go' }]);
    expect(Array.isArray(props.buttons)).toBe(true);
  });

  // --------------------------------------------------
  // Malformed JSON
  // --------------------------------------------------

  it('handles malformed JSON gracefully', () => {
    const props = textCtaFromElement(
      createContainer({ buttons: '{not valid json' }),
    );

    expect(props.buttons).toEqual([]);
  });

  // --------------------------------------------------
  // Boolean centered attribute
  // --------------------------------------------------

  it('treats missing centered as true', () => {
    const props = textCtaFromElement(createContainer());
    expect(props.centered).toBe(true);
  });

  it('treats centered="false" as false', () => {
    const props = textCtaFromElement(createContainer({ centered: 'false' }));
    expect(props.centered).toBe(false);
  });

  it('treats centered="true" as true', () => {
    const props = textCtaFromElement(createContainer({ centered: 'true' }));
    expect(props.centered).toBe(true);
  });
});
