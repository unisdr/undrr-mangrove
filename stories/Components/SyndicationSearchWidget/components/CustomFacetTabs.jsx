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
  tabOptionValue,
} from '../utils/customFacetTabs';
import { useSearchEvents, customOptionValue } from '../hooks/useSearchEvents';

/** Native radio groups retain their label, checked state and arrow-key behaviour. */
export default function CustomFacetTabs({ widgetId }) {
  const config = useSearchConfig();
  const state = useSearchState();
  const dispatch = useSearchDispatch();
  const emit = useSearchEvents();
  const facets = (config.customFacets || []).filter(isTabFacet);
  const selected = tabSelections(facets, state.customFacets);
  return facets.map(facet => (
    <fieldset className="mg-search__scope-tabs" key={facet.id}>
      <legend className="mg-u-sr-only">{facet.title}</legend>
      <div className="mg-search__scope-options">
        {/* Unlinkable options have no stable ID; positional keys are the fallback. */}
        {facet.options.map((option, index) => (
          <label
            className="mg-search__scope-option"
            key={tabOptionValue(facet, index) ?? index}
            data-vf-analytics-label={`Search tab: ${facet.id}: ${tabOptionValue(facet, index) ?? index}`}
          >
            <input
              type="radio"
              required
              name={`${widgetId}-${facet.id}`}
              value={String(index)}
              data-vf-analytics-label={`Search tab: ${facet.id}: ${tabOptionValue(facet, index) ?? index}`}
              disabled={!isValidTabOption(option)}
              checked={selected[facet.id][0] === String(index)}
              onChange={event => {
                dispatch(actions.setCustomFacet(facet.id, [String(index)]));
                if (selected[facet.id][0] === String(index)) return;
                const value = customOptionValue(facet, index);
                emit(event.currentTarget.closest('fieldset'), 'filter-change', {
                  kind: 'tab',
                  key: facet.id,
                  action: 'select',
                  changed: [value],
                  values: [value],
                  operator: null,
                });
              }}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  ));
}
