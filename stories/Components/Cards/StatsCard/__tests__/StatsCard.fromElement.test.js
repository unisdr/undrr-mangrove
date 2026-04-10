import statsCardFromElement from '../StatsCard.fromElement';

function makeContainer(attrs = {}) {
  const el = document.createElement('div');
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(`data-${key}`, value);
  });
  return el;
}

const sampleStats = [
  { icon: 'mg-icon mg-icon-globe', value: '118', bottomLabel: 'Countries' },
  { value: '$223B', bottomLabel: 'Economic losses' },
];

describe('statsCardFromElement', () => {
  it('returns defaults when no data attributes are set', () => {
    const props = statsCardFromElement(makeContainer());
    expect(props).toEqual({
      title: undefined,
      variant: 'default',
      className: '',
      stats: [],
    });
  });

  it('parses stats JSON and all attributes', () => {
    const props = statsCardFromElement(
      makeContainer({
        title: 'Disaster Statistics 2023',
        variant: 'highlighted',
        'class-name': 'custom-class',
        stats: JSON.stringify(sampleStats),
      })
    );
    expect(props.title).toBe('Disaster Statistics 2023');
    expect(props.variant).toBe('highlighted');
    expect(props.className).toBe('custom-class');
    expect(props.stats).toEqual(sampleStats);
  });

  it('returns empty stats array for invalid JSON', () => {
    const props = statsCardFromElement(
      makeContainer({ stats: 'not-json' })
    );
    expect(props.stats).toEqual([]);
  });

  it('supports all variant values', () => {
    ['default', 'compact', 'highlighted', 'negative'].forEach(variant => {
      const props = statsCardFromElement(makeContainer({ variant }));
      expect(props.variant).toBe(variant);
    });
  });
});
