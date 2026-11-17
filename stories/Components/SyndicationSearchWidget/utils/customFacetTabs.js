export const isValidTabOption = option =>
  typeof option?.query === 'string' && !!option.query.trim() && !!option.label;

/** Required single-choice result scopes, presented separately from filters. */
export const isTabFacet = facet =>
  facet?.display === 'tabs' &&
  facet.multiSelect !== true &&
  facet.options?.some(isValidTabOption);

export function tabSelections(configs = [], selections = {}) {
  return Object.fromEntries(
    (configs || []).filter(isTabFacet).map(facet => {
      const valid = value =>
        /^\d+$/.test(String(value)) &&
        isValidTabOption(facet.options[Number(value)]);
      const values = Array.isArray(selections[facet.id])
        ? selections[facet.id]
        : [];
      const selected = values.find(valid);
      const fallback = valid(facet.defaultValue)
        ? facet.defaultValue
        : facet.options.findIndex(isValidTabOption);
      return [facet.id, [String(Number(selected ?? fallback))]];
    })
  );
}

/** Only unique, URL-safe authored identifiers can round-trip through a link. */
export function tabOptionValue(facet, index) {
  const value = facet.options[index]?.value;
  return typeof value === 'string' &&
    /^[a-zA-Z0-9_-]{1,80}$/.test(value) &&
    facet.options.filter(option => option.value === value).length === 1
    ? value
    : null;
}
