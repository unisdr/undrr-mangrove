import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { SyndicationSearchWidget } from '../SyndicationSearchWidget';
import { buildHashString, parseHashState } from '../utils/hashState';
import { tabSelections } from '../utils/customFacetTabs';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useTransition: () => [false, fn => fn()],
  useDeferredValue: value => value,
}));

const period = {
  id: 'event-status',
  title: 'Event period',
  display: 'tabs',
  defaultValue: '0',
  options: [
    { label: 'Upcoming', value: 'upcoming', query: 'event_end:[now TO *]' },
    { label: 'Previous', value: 'past', query: 'event_end:[* TO now}' },
  ],
};
const config = {
  searchEndpoint: '/search',
  enableHashSync: false,
  minSearchLength: 0,
  showFacets: false,
  showSearchBox: true,
  defaultQuery: 'climate',
  defaultFilters: [{ key: 'field_country_region', value: '4' }],
  customFacets: [period],
};
const requests = () =>
  global.fetch.mock.calls
    .filter(([url]) => url === '/search')
    .map(([, options]) => JSON.parse(options.body));
const asText = request => JSON.stringify(request);

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  global.fetch = jest.fn(async url => ({
    ok: true,
    json: async () =>
      String(url).includes('/search')
        ? { hits: { hits: [], total: { value: 0 } }, aggregations: {}, took: 1 }
        : { results: [] },
  }));
});

afterEach(() => window.history.replaceState(null, '', '/'));

it('defaults the first request and preserves search, country and empty-result selections across periods', async () => {
  render(<SyndicationSearchWidget config={config} />);
  await waitFor(() => expect(requests().length).toBe(1));
  expect(asText(requests()[0].query)).toContain(period.options[0].query);
  expect(screen.getByRole('radio', { name: 'Upcoming' })).toBeChecked();
  fireEvent.click(screen.getByRole('radio', { name: 'Previous' }));
  await waitFor(() => expect(requests().length).toBe(2));
  const next = requests()[1];
  expect(asText(next.query)).toContain(period.options[1].query);
  expect(asText(next.query)).toContain('climate');
  expect(asText(next.post_filter)).toContain('field_country_region');
  expect(asText(next.post_filter)).toContain('4');
  expect(next.from).toBe(0);
  expect(screen.getByRole('searchbox')).toHaveValue('climate');
  expect(screen.getByRole('radio', { name: 'Previous' })).toBeChecked();
  expect(
    await axe(screen.getByRole('group', { name: 'Event period' }))
  ).toHaveNoViolations();
});

it('honours an edited initial period before issuing the replacement request', async () => {
  const view = render(<SyndicationSearchWidget config={config} />);
  await waitFor(() => expect(requests().length).toBe(1));
  view.rerender(
    <SyndicationSearchWidget
      config={{ ...config, customFacets: [{ ...period, defaultValue: '1' }] }}
    />
  );
  await waitFor(() => expect(requests().length).toBe(2));
  expect(asText(requests()[1].query)).toContain(period.options[1].query);
});

it('retains the period on clear all while removing ordinary filters', async () => {
  window.history.replaceState(
    null,
    '',
    '/#f.field_country_region=5&f.year=2026&t.event-status=past'
  );
  render(
    <SyndicationSearchWidget
      config={{
        ...config,
        enableHashSync: true,
        showFacets: true,
        defaultFilters: [],
      }}
    />
  );
  await waitFor(() => expect(requests().length).toBe(1));
  fireEvent.click(screen.getByRole('button', { name: /clear all/i }));
  await waitFor(() => expect(requests().length).toBe(2));
  expect(asText(requests()[1].query)).toContain(period.options[1].query);
  expect(asText(requests()[1].post_filter) || '').not.toContain(
    'field_country_region'
  );
  expect(screen.getByRole('radio', { name: 'Previous' })).toBeChecked();
});

it('restores the selected period through browser history without changing ordinary custom dropdown behaviour', async () => {
  render(
    <SyndicationSearchWidget config={{ ...config, enableHashSync: true }} />
  );
  await waitFor(() => expect(requests().length).toBe(1));
  fireEvent.click(screen.getByRole('radio', { name: 'Previous' }));
  await waitFor(() =>
    expect(window.location.hash).toContain('t.event-status=past')
  );
  window.history.replaceState(null, '', '/#query=climate');
  fireEvent(window, new PopStateEvent('popstate'));
  await waitFor(() =>
    expect(screen.getByRole('radio', { name: 'Upcoming' })).toBeChecked()
  );
});

it('uses stable validated option values in links and ignores unknown selections', () => {
  const options = { facetFields: [], defaultFacets: {}, tabFacets: [period] };
  const hash = buildHashString(
    { customFacets: { 'event-status': ['1'] } },
    options
  );
  expect(hash).toBe('t.event-status=past');
  expect(parseHashState(hash, options).customFacets).toEqual({
    'event-status': ['1'],
  });
  expect(
    parseHashState('t.event-status=unknown', options).customFacets
  ).toEqual({ 'event-status': ['0'] });
  expect(tabSelections([period], { 'event-status': ['99'] })).toEqual({
    'event-status': ['0'],
  });
  expect(tabSelections([{ ...period, display: undefined }])).toEqual({});
});
