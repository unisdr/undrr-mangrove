import syndicationSearchWidgetFromElement from '../SyndicationSearchWidget.fromElement';

function makeContainer(attrs = {}) {
  const el = document.createElement('div');
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(`data-${key}`, value);
  });
  return el;
}

describe('syndicationSearchWidgetFromElement', () => {
  it('returns empty config when no data attributes are set', () => {
    const { config } = syndicationSearchWidgetFromElement(makeContainer());
    expect(config).toEqual({});
  });

  it('extracts simple string and number props', () => {
    const { config } = syndicationSearchWidgetFromElement(
      makeContainer({
        'search-endpoint': 'https://example.com/search',
        'results-per-page': '10',
        'debounce-delay': '500',
        'min-search-length': '2',
        'default-query': 'climate',
        'default-sort': 'newest',
        'display-mode': 'card',
        'grid-columns': '3',
        'query-append': 'AND type:news',
      })
    );
    expect(config.searchEndpoint).toBe('https://example.com/search');
    expect(config.resultsPerPage).toBe(10);
    expect(config.debounceDelay).toBe(500);
    expect(config.minSearchLength).toBe(2);
    expect(config.defaultQuery).toBe('climate');
    expect(config.defaultSort).toBe('newest');
    expect(config.displayMode).toBe('card');
    expect(config.gridColumns).toBe(3);
    expect(config.queryAppend).toBe('AND type:news');
  });

  it('extracts boolean props', () => {
    const { config } = syndicationSearchWidgetFromElement(
      makeContainer({
        'show-search-box': 'false',
        'show-facets': 'true',
        'show-active-filters': 'false',
        'show-pager': 'true',
        'show-search-metrics': 'true',
        'show-search-timer': 'true',
        'enable-hash-sync': 'false',
      })
    );
    expect(config.showSearchBox).toBe(false);
    expect(config.showFacets).toBe(true);
    expect(config.showActiveFilters).toBe(false);
    expect(config.showPager).toBe(true);
    expect(config.showSearchMetrics).toBe(true);
    expect(config.showSearchTimer).toBe(true);
    expect(config.enableHashSync).toBe(false);
  });

  it('only includes boolean props when explicitly set', () => {
    const { config } = syndicationSearchWidgetFromElement(makeContainer());
    expect(config).not.toHaveProperty('showSearchBox');
    expect(config).not.toHaveProperty('showFacets');
    expect(config).not.toHaveProperty('enableHashSync');
  });

  it('parses JSON defaultFilters', () => {
    const filters = [{ key: '_language', value: 'fr' }];
    const { config } = syndicationSearchWidgetFromElement(
      makeContainer({ 'default-filters': JSON.stringify(filters) })
    );
    expect(config.defaultFilters).toEqual(filters);
  });

  it('parses JSON allowedTypes', () => {
    const types = ['news', 'event'];
    const { config } = syndicationSearchWidgetFromElement(
      makeContainer({ 'allowed-types': JSON.stringify(types) })
    );
    expect(config.allowedTypes).toEqual(types);
  });

  it('ignores malformed JSON gracefully', () => {
    const { config } = syndicationSearchWidgetFromElement(
      makeContainer({
        'default-filters': 'not-json',
        'allowed-types': '{broken',
      })
    );
    expect(config).not.toHaveProperty('defaultFilters');
    expect(config).not.toHaveProperty('allowedTypes');
  });

  it('extracts requireImage boolean', () => {
    const { config } = syndicationSearchWidgetFromElement(
      makeContainer({ 'require-image': 'true' })
    );
    expect(config.requireImage).toBe(true);
  });

  it('sets requireImage to false when data attribute is "false"', () => {
    const { config } = syndicationSearchWidgetFromElement(
      makeContainer({ 'require-image': 'false' })
    );
    expect(config.requireImage).toBe(false);
  });

  it('parses interestingnessTiers JSON array', () => {
    const tiers = ['promoted', 'announced'];
    const { config } = syndicationSearchWidgetFromElement(
      makeContainer({ 'interestingness-tiers': JSON.stringify(tiers) })
    );
    expect(config.interestingnessTiers).toEqual(tiers);
  });

  it('parses longevityTiers JSON array', () => {
    const tiers = ['today', 'days'];
    const { config } = syndicationSearchWidgetFromElement(
      makeContainer({ 'longevity-tiers': JSON.stringify(tiers) })
    );
    expect(config.longevityTiers).toEqual(tiers);
  });

  it('ignores malformed tier JSON gracefully', () => {
    const { config } = syndicationSearchWidgetFromElement(
      makeContainer({
        'interestingness-tiers': 'not-json',
        'longevity-tiers': '[broken',
      })
    );
    expect(config).not.toHaveProperty('interestingnessTiers');
    expect(config).not.toHaveProperty('longevityTiers');
  });

  it('parses JSON customFilters', () => {
    const filters = ['type:news', 'region:asia'];
    const { config } = syndicationSearchWidgetFromElement(
      makeContainer({ 'custom-filters': JSON.stringify(filters) })
    );
    expect(config.customFilters).toEqual(filters);
  });

  it('parses JSON customFacets', () => {
    const facets = [{ field: 'region', label: 'Region' }];
    const { config } = syndicationSearchWidgetFromElement(
      makeContainer({ 'custom-facets': JSON.stringify(facets) })
    );
    expect(config.customFacets).toEqual(facets);
  });

  it('parses JSON visibleTeaserFields', () => {
    const fields = ['title', 'date'];
    const { config } = syndicationSearchWidgetFromElement(
      makeContainer({ 'visible-teaser-fields': JSON.stringify(fields) })
    );
    expect(config.visibleTeaserFields).toEqual(fields);
  });

  it('ignores malformed JSON for customFilters, customFacets, visibleTeaserFields', () => {
    const { config } = syndicationSearchWidgetFromElement(
      makeContainer({
        'custom-filters': 'not-json',
        'custom-facets': '{broken',
        'visible-teaser-fields': '[bad',
      })
    );
    expect(config).not.toHaveProperty('customFilters');
    expect(config).not.toHaveProperty('customFacets');
    expect(config).not.toHaveProperty('visibleTeaserFields');
  });
});
