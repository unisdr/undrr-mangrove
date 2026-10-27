import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import {
  SearchProvider,
  useSearchDispatch,
  useSearchState,
  actions,
} from '../context/SearchContext';
import ActiveFilters from '../components/ActiveFilters';

jest.mock('../hooks/useTaxonomies', () => ({
  useTaxonomies: () => ({ getLabel: (_key, value) => value }),
}));
let dispatch, state;
function Harness() {
  dispatch = useSearchDispatch();
  state = useSearchState();
  return <ActiveFilters />;
}
const defaults = [
  { key: '_language', value: 'en' },
  { key: 'field_domain_access', value: 'www_undrr_org' },
  { key: 'field_hazard', value: '12' },
  { key: 'field_hazard', value: '34' },
  { key: 'field_hazard', value: '12' },
];
const config = {
  defaultFilters: defaults,
  visibleFilters: ['field_hazard', 'field_theme'],
  customFacets: [
    {
      id: 'period',
      title: 'Period',
      options: [{ label: 'Recent', query: 'published_at:[now-1y TO *]' }],
    },
  ],
};

it('Clear all restores hidden scopes and complete multi-value defaults without baseline chips', async () => {
  const { container } = render(
    <SearchProvider config={config}>
      <Harness />
    </SearchProvider>
  );
  act(() => {
    dispatch(
      actions.initialize({
        defaultFilters: defaults,
        defaultQuery: 'risk',
        defaultSort: 'oldest',
      })
    );
    dispatch(actions.setFacet('field_hazard', ['34', '12', '56']));
    dispatch(actions.setFacetOperator('field_hazard', 'AND'));
    dispatch(actions.setFacet('field_theme', '7'));
    dispatch(actions.setCustomFacet('period', '0'));
    dispatch(actions.setPage(3));
  });
  expect(
    screen.getByRole('region', { name: 'Active filters' })
  ).toBeInTheDocument();
  expect(screen.getByText('56')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /clear all/i }));
  expect(state.facets).toEqual({
    _language: ['en'],
    field_domain_access: ['www_undrr_org'],
    field_hazard: ['12', '34', '12'],
  });
  expect(state.facetOperators).toEqual({});
  expect(state.customFacets).toEqual({});
  expect(state.page).toBe(1);
  expect(state.query).toBe('risk');
  expect(state.sortBy).toBe('oldest');
  expect(screen.queryByRole('region', { name: 'Active filters' })).toBeNull();
  expect(await axe(container)).toHaveNoViolations();
});

it('hides an unchanged default group regardless of order or duplicates, while a subset remains removable', () => {
  render(
    <SearchProvider config={config}>
      <Harness />
    </SearchProvider>
  );
  act(() => {
    dispatch(actions.initialize({ defaultFilters: defaults }));
    dispatch(actions.setFacet('field_hazard', ['34', '12']));
  });
  expect(screen.queryByRole('region', { name: 'Active filters' })).toBeNull();
  act(() => dispatch(actions.setFacet('field_hazard', ['12'])));
  expect(
    screen.getByRole('button', { name: /remove filter/i })
  ).toBeInTheDocument();
});

it('shows an AND constraint on default values until Clear all restores OR', () => {
  render(
    <SearchProvider config={config}>
      <Harness />
    </SearchProvider>
  );
  act(() => {
    dispatch(actions.initialize({ defaultFilters: defaults }));
    dispatch(actions.setFacetOperator('field_hazard', 'AND'));
  });
  expect(
    screen.getByRole('region', { name: 'Active filters' })
  ).toBeInTheDocument();
  expect(screen.getAllByText('and').length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button', { name: /clear all/i }));
  expect(state.facetOperators).toEqual({});
  expect(screen.queryByRole('region', { name: 'Active filters' })).toBeNull();
});
