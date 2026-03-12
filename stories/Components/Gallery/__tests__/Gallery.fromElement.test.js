import galleryFromElement from '../Gallery.fromElement';

function makeContainer(attrs = {}) {
  const el = document.createElement('div');
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(`data-${key}`, value);
  });
  return el;
}

const sampleMedia = [
  { id: '1', type: 'image', src: '/a.jpg', title: 'Photo A' },
  { id: '2', type: 'video', src: '/b.mp4', title: 'Video B' },
];

describe('galleryFromElement', () => {
  it('returns defaults when no data attributes are set', () => {
    const props = galleryFromElement(makeContainer());
    expect(props).toEqual({
      media: [],
      initialIndex: 0,
      showThumbnails: true,
      thumbnailPosition: 'left',
      showArrows: true,
      arrowStyle: 'overlay',
      showDescription: true,
      enableKeyboard: true,
      loop: false,
    });
  });

  it('parses media JSON and all attributes', () => {
    const props = galleryFromElement(
      makeContainer({
        media: JSON.stringify(sampleMedia),
        'initial-index': '1',
        'show-thumbnails': 'false',
        'thumbnail-position': 'bottom',
        'show-arrows': 'false',
        'arrow-style': 'corner',
        'show-description': 'false',
        'enable-keyboard': 'false',
        loop: 'true',
      })
    );
    expect(props.media).toEqual(sampleMedia);
    expect(props.initialIndex).toBe(1);
    expect(props.showThumbnails).toBe(false);
    expect(props.thumbnailPosition).toBe('bottom');
    expect(props.showArrows).toBe(false);
    expect(props.arrowStyle).toBe('corner');
    expect(props.showDescription).toBe(false);
    expect(props.enableKeyboard).toBe(false);
    expect(props.loop).toBe(true);
  });

  it('returns empty media array for invalid JSON', () => {
    const props = galleryFromElement(
      makeContainer({ media: 'not-valid-json' })
    );
    expect(props.media).toEqual([]);
  });

  it('defaults booleans to true when attribute is absent', () => {
    const props = galleryFromElement(makeContainer());
    expect(props.showThumbnails).toBe(true);
    expect(props.showArrows).toBe(true);
    expect(props.showDescription).toBe(true);
    expect(props.enableKeyboard).toBe(true);
  });
});
