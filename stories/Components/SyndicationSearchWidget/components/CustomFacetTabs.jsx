import React from 'react';
import {
  useSearchConfig,
  useSearchState,
  useSearchDispatch,
  actions,
} from '../context/SearchContext';
import {
  isTabFacet,
  isValidTabOption,
  tabSelections,
} from '../utils/customFacetTabs';

/** Native radio groups retain their label, checked state and arrow-key behaviour. */
export default function CustomFacetTabs({ widgetId }) {
  const config = useSearchConfig();
  const state = useSearchState();
  const dispatch = useSearchDispatch();
  const facets = (config.customFacets || []).filter(isTabFacet);
  const selected = tabSelections(facets, state.customFacets);
  return facets.map(facet => (
    <fieldset className="mg-search__scope-tabs" key={facet.id}>
      <legend className="mg-u-sr-only">{facet.title}</legend>
      <div className="mg-search__scope-options">
        {facet.options.map((option, index) => (
          <label
            className="mg-search__scope-option"
            key={option.value || index}
          >
            <input
              type="radio"
              name={`${widgetId}-${facet.id}`}
              value={String(index)}
              disabled={!isValidTabOption(option)}
              checked={selected[facet.id][0] === String(index)}
              onChange={() =>
                dispatch(actions.setCustomFacet(facet.id, [String(index)]))
              }
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  ));
}
