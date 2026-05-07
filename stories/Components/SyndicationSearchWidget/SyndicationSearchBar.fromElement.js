/**
 * Extract SyndicationSearchBar props from a DOM container.
 *
 * Unlike SyndicationSearchWidget (which receives a single `config` object),
 * the bar takes its props at the top level — placeholder, searchTargetUrl,
 * etc. — so this function returns the props object directly. createHydrator
 * spreads the result onto the component.
 */
export default function syndicationSearchBarFromElement(container) {
  const { dataset } = container;
  const props = {};

  if (dataset.placeholder) props.placeholder = dataset.placeholder;
  if (dataset.defaultQuery) props.defaultQuery = dataset.defaultQuery;
  if (dataset.searchTargetUrl)
    props.searchTargetUrl = dataset.searchTargetUrl;
  if (dataset.paramName) props.paramName = dataset.paramName;
  if (dataset.submitLabel) props.submitLabel = dataset.submitLabel;
  if (dataset.ariaLabel) props.ariaLabel = dataset.ariaLabel;

  return props;
}
