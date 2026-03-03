/**
 * Extract SyndicationSearchWidget config from a DOM container.
 *
 * SyndicationSearchWidget is a complex-tier component: most config values
 * have sensible defaults, so only attributes explicitly set on the container
 * are included. Consumer wrappers (Layer 3) can merge additional config
 * (customFacets, customFilters, etc.) that is too complex for data attributes.
 */
export default function syndicationSearchWidgetFromElement(container) {
  const { dataset } = container;
  const config = {};

  // Simple string/number props
  if (dataset.searchEndpoint) config.searchEndpoint = dataset.searchEndpoint;
  if (dataset.resultsPerPage)
    config.resultsPerPage = parseInt(dataset.resultsPerPage, 10);
  if (dataset.debounceDelay)
    config.debounceDelay = parseInt(dataset.debounceDelay, 10);
  if (dataset.minSearchLength)
    config.minSearchLength = parseInt(dataset.minSearchLength, 10);
  if (dataset.defaultQuery) config.defaultQuery = dataset.defaultQuery;
  if (dataset.defaultSort) config.defaultSort = dataset.defaultSort;
  if (dataset.displayMode) config.displayMode = dataset.displayMode;
  if (dataset.gridColumns)
    config.gridColumns = parseInt(dataset.gridColumns, 10);
  if (dataset.queryAppend) config.queryAppend = dataset.queryAppend;

  // Boolean props (only set if explicitly present)
  if (dataset.showSearchBox !== undefined)
    config.showSearchBox = dataset.showSearchBox !== 'false';
  if (dataset.showResultsCount !== undefined)
    config.showResultsCount = dataset.showResultsCount !== 'false';
  if (dataset.showFacets !== undefined)
    config.showFacets = dataset.showFacets !== 'false';
  if (dataset.showActiveFilters !== undefined)
    config.showActiveFilters = dataset.showActiveFilters !== 'false';
  if (dataset.showPager !== undefined)
    config.showPager = dataset.showPager !== 'false';
  if (dataset.showSearchMetrics !== undefined)
    config.showSearchMetrics = dataset.showSearchMetrics === 'true';
  if (dataset.showSearchTimer !== undefined)
    config.showSearchTimer = dataset.showSearchTimer === 'true';
  if (dataset.enableHashSync !== undefined)
    config.enableHashSync = dataset.enableHashSync !== 'false';

  // JSON-encoded complex props
  if (dataset.defaultFilters) {
    try {
      config.defaultFilters = JSON.parse(dataset.defaultFilters);
    } catch {
      /* ignore malformed JSON */
    }
  }
  if (dataset.allowedTypes) {
    try {
      config.allowedTypes = JSON.parse(dataset.allowedTypes);
    } catch {
      /* ignore malformed JSON */
    }
  }

  return { config };
}
