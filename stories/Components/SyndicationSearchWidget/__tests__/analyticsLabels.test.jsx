/**
 * @file analyticsLabels.test.jsx
 * @description Fixed English data-vf-analytics-label values on the widget's
 * icon-only and translated controls (undrr/web-backlog#3320).
 */

import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import {
  SearchProvider,
  useSearchDispatch,
  actions,
} from '../context/SearchContext';
import SearchForm from '../components/SearchForm';
import ActiveFilters from '../components/ActiveFilters';
import FacetSelect from '../components/FacetSelect';
import { SelectDropdown } from '../components/SelectDropdown';
import { MobileFilterDrawer } from '../components/MobileFilterDrawer';
import CustomFacetTabs from '../components/CustomFacetTabs';
import { FACET_FIELDS } from '../utils/constants';

jest.mock('../hooks/useTaxonomies', () => ({
  useTaxonomies: () => ({ getLabel: (_key, value) => value }),
}));

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

const LABEL = 'data-vf-analytics-label';

it('labels the search input, its label, clear and submit', () => {
  render(
    <SearchProvider config={{}}>
      <SearchForm value="floods" onChange={() => {}} widgetId="t" />
    </SearchProvider>
  );
  const input = screen.getByRole('searchbox');
  expect(input).toHaveAttribute(LABEL, 'Search: Query');
  expect(input).not.toHaveAttribute('name');
  expect(document.querySelector('label[for="search-t"]')).toHaveAttribute(
    LABEL,
    'Search: Query'
  );
  expect(screen.getByRole('button', { name: /clear/i })).toHaveAttribute(
    LABEL,
    'Search: Clear'
  );
  expect(screen.getByRole('button', { name: /submit/i })).toHaveAttribute(
    LABEL,
    'Search: Submit'
  );
});

it('labels filter chips and Clear all', () => {
  let dispatch;
  function Harness() {
    dispatch = useSearchDispatch();
    return <ActiveFilters />;
  }
  render(
    <SearchProvider config={{ visibleFilters: ['field_hazard'] }}>
      <Harness />
    </SearchProvider>
  );
  act(() => dispatch(actions.setFacet('field_hazard', ['12', '34'])));
  const chips = document.querySelectorAll('.mg-search__filter-chip');
  expect(chips).toHaveLength(2);
  chips.forEach(chip =>
    expect(chip).toHaveAttribute(LABEL, 'Search: Remove filter')
  );
  expect(screen.getByRole('button', { name: /clear all/i })).toHaveAttribute(
    LABEL,
    'Search: Clear all filters'
  );
});

it('labels the dropdown trigger and its search input from analyticsLabel', () => {
  const options = Array.from({ length: 10 }, (_, i) => ({
    value: String(i),
    label: `Option ${i}`,
  }));
  render(
    <SelectDropdown
      id="d"
      label="Hazard"
      placeholder="All hazards"
      options={options}
      onChange={() => {}}
      analyticsLabel="Search filter: field_hazard"
    />
  );
  const trigger = screen.getByRole('button', { name: 'All hazards' });
  expect(trigger).toHaveAttribute(LABEL, 'Search filter: field_hazard');
  fireEvent.click(trigger);
  expect(screen.getByRole('combobox')).toHaveAttribute(
    LABEL,
    'Search filter: field_hazard: Search'
  );
});

it('sets no label on the dropdown without analyticsLabel', () => {
  render(<SelectDropdown id="d" label="X" onChange={() => {}} />);
  expect(screen.getByRole('button')).not.toHaveAttribute(LABEL);
});

it('labels a facet trigger by field key and its match-mode toggle', () => {
  render(
    <SearchProvider config={{}}>
      <FacetSelect
        field={FACET_FIELDS.find(f => f.key === 'field_hazard')}
        buckets={[
          { key: '1', doc_count: 2 },
          { key: '2', doc_count: 1 },
        ]}
        getLabel={(_key, value) => value}
        widgetId="t"
        selectedValues={['1', '2']}
      />
    </SearchProvider>
  );
  expect(document.querySelector('.mg-select__trigger')).toHaveAttribute(
    LABEL,
    'Search filter: field_hazard'
  );
  const [any, all] = screen.getAllByRole('radio');
  expect(any).toHaveAttribute(LABEL, 'Search: Match any');
  expect(any.closest('label')).toHaveAttribute(LABEL, 'Search: Match any');
  expect(all).toHaveAttribute(LABEL, 'Search: Match all');
  expect(all.closest('label')).toHaveAttribute(LABEL, 'Search: Match all');
});

it('labels the drawer close and apply buttons and the sort trigger', () => {
  render(
    <SearchProvider config={{ visibleFilters: [] }}>
      <MobileFilterDrawer isOpen onClose={() => {}} widgetId="w" />
    </SearchProvider>
  );
  expect(document.querySelector('.mg-search__drawer-close')).toHaveAttribute(
    LABEL,
    'Search: Close filters'
  );
  expect(document.querySelector('.mg-search__drawer-apply')).toHaveAttribute(
    LABEL,
    'Search: View results'
  );
  expect(
    document.querySelector('.mg-search__sort .mg-select__trigger')
  ).toHaveAttribute(LABEL, 'Search: Sort');
});

it('labels each result tab by facet id and stable value', () => {
  const facet = {
    id: 'event-status',
    title: 'Event period',
    display: 'tabs',
    defaultValue: '0',
    options: [
      { label: 'Upcoming', value: 'upcoming', query: 'a' },
      { label: 'Previous', value: 'past', query: 'b' },
    ],
  };
  render(
    <SearchProvider config={{ customFacets: [facet] }}>
      <CustomFacetTabs widgetId="w" />
    </SearchProvider>
  );
  const expected = [
    'Search tab: event-status: upcoming',
    'Search tab: event-status: past',
  ];
  screen.getAllByRole('radio').forEach((radio, index) => {
    expect(radio).toHaveAttribute(LABEL, expected[index]);
    expect(radio.closest('label')).toHaveAttribute(LABEL, expected[index]);
  });
});
