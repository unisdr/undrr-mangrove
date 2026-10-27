/**
 * @file FacetsSidebar.test.jsx
 * @description Integration test: FacetsSidebar and ActiveFilters with the
 * real useTaxonomies hook, checking that taxonomy readiness reaches
 * FacetSelect and that selected unknown IDs stay removable.
 */

import React, { useLayoutEffect } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import {
  SearchProvider,
  useSearchDispatch,
  actions,
} from '../context/SearchContext';
import FacetsSidebar from '../components/FacetsSidebar';
import ActiveFilters from '../components/ActiveFilters';
import { clearTaxonomyCache } from '../hooks/useTaxonomies';

// Render options as a plain list so the test can read them without opening
// the custom dropdown.
jest.mock('../components/SelectDropdown', () => ({
  SelectDropdown: ({ id, options }) => (
    <ul data-testid={id}>
      {options.map(option => (
        <li key={option.value} data-value={option.value}>
          {option.label}
        </li>
      ))}
    </ul>
  ),
}));

const TERMS = {
  results: [
    { id: '341', name: 'Avalanche' },
    { id: '342', name: 'Cold Wave' },
  ],
  pager: { pages: 1 },
};

function Seed({ selected }) {
  const dispatch = useSearchDispatch();
  useLayoutEffect(() => {
    dispatch(
      actions.setResults({
        hits: { hits: [], total: { value: 3 } },
        aggregations: {
          field_hazard: {
            buckets: [
              { key: '341', doc_count: 9 },
              { key: '342', doc_count: 4 },
              { key: '9999', doc_count: 20 }, // deleted term
            ],
          },
        },
      })
    );
    dispatch(actions.setFacet('field_hazard', selected, true));
  }, [dispatch, selected]);
  return null;
}

const SELECTED = ['8888', '7777'];

function renderSidebar() {
  return render(
    <SearchProvider config={{ visibleFilters: null }}>
      <Seed selected={SELECTED} />
      <ActiveFilters />
      <FacetsSidebar widgetId="t" />
    </SearchProvider>
  );
}

function hazardOptions() {
  return Array.from(
    screen.getByTestId('facet-field_hazard-t').querySelectorAll('li')
  ).map(li => li.getAttribute('data-value'));
}

let consoleError;
beforeEach(() => {
  clearTaxonomyCache();
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => consoleError.mockRestore());

describe('FacetsSidebar with useTaxonomies', () => {
  it('hides unknown taxonomy IDs once terms load, keeping selected ones', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(TERMS) })
    );
    renderSidebar();

    await waitFor(() => expect(screen.getByText('Avalanche')).toBeTruthy());
    await waitFor(() => expect(hazardOptions()).not.toContain('9999'));
    expect(hazardOptions()).toEqual(
      expect.arrayContaining(['341', '342', '8888', '7777'])
    );

    // Active filter chips keep the raw IDs so the filters can be removed
    const chips = document.querySelector('.mg-search__active-filters-list');
    expect(within(chips).getByText(/8888/)).toBeInTheDocument();
    expect(within(chips).getByText(/7777/)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('shows unknown IDs when the taxonomy request fails', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false, status: 500, json: () => ({}) })
    );
    renderSidebar();

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.queryByText(/loading filters/i)).not.toBeInTheDocument()
    );
    expect(hazardOptions()).toEqual(
      expect.arrayContaining(['341', '342', '9999', '8888', '7777'])
    );
  });
});
