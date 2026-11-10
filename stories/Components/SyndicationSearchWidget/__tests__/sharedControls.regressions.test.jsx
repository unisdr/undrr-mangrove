import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SyndicationSearchWidget } from '../SyndicationSearchWidget';
import { actions } from '../context/SearchContext';
import { getSharedStore, withSharedControls } from '../context/sharedControls';
import { FACET_FIELDS } from '../utils/constants';
const visible = Object.fromEntries(
  FACET_FIELDS.map(f => [f.key, f.key === 'field_country_region'])
);
const originalFetch = global.fetch;
const originalScrollIntoView = Element.prototype.scrollIntoView;
const shared = {
  id: 'regression-default-change',
  visibleFilters: visible,
  defaultFilters: [],
  defaultQuery: '',
};
beforeEach(() => {
  Element.prototype.scrollIntoView = jest.fn();
});
afterEach(() => {
  window.history.replaceState(null, '', '/');
  global.fetch = originalFetch;
  if (originalScrollIntoView)
    Element.prototype.scrollIntoView = originalScrollIntoView;
  else delete Element.prototype.scrollIntoView;
});

test('grouped configuration edits retain each visitor-selected sort', async () => {
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      hits: { hits: [], total: { value: 0 } },
      aggregations: {},
      results: [{ id: '2', name: 'Country 2' }],
    }),
  }));
  const config = {
    searchEndpoint: '/regression-sort',
    defaultSort: 'newest',
    sharedControls: { ...shared, id: 'regression-sort' },
    minSearchLength: 0,
    showFacets: true,
  };
  const view = render(<SyndicationSearchWidget config={config} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Sort' }));
  fireEvent.click(screen.getByRole('option', { name: 'Oldest', exact: true }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Sort' })).toHaveTextContent(
      'Oldest'
    )
  );
  view.rerender(
    <SyndicationSearchWidget
      config={{
        ...config,
        sharedControls: {
          ...config.sharedControls,
          defaultFilters: [{ key: 'field_country_region', value: '2' }],
        },
      }}
    />
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Sort' })).toHaveTextContent(
      'Oldest'
    )
  );
  // An explicit change to the display's configured sort must still take effect.
  view.rerender(
    <SyndicationSearchWidget config={{ ...config, defaultSort: 'relevance' }} />
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Sort' })).toHaveTextContent(
      'Relevance'
    )
  );
});

test('real widget starts a new group on page one when store revisions happen to match', async () => {
  const one = { ...shared, id: 'real-regression-first' };
  const two = { ...shared, id: 'real-regression-second' };
  const target = getSharedStore(
    document,
    withSharedControls({ sharedControls: two })
  );
  target.dispatch(actions.setQuery('other query'));
  global.fetch = jest.fn(async url => ({
    ok: true,
    json: async () =>
      String(url).startsWith('/regression-real')
        ? {
            hits: {
              hits: [
                {
                  _id: '1',
                  _source: { title: 'Result', url: '/result', type: 'news' },
                },
              ],
              total: { value: 100 },
            },
            aggregations: {},
          }
        : { results: [{ id: '2', name: 'Country 2' }] },
  }));
  const config = {
    searchEndpoint: '/regression-real-pager',
    sharedControls: one,
    minSearchLength: 0,
    debounceDelay: 0,
    showFacets: false,
    showSort: false,
    defaultFilters: [],
    resultsPerPage: 10,
  };
  const view = render(<SyndicationSearchWidget config={config} />);
  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: 'first query' },
  });
  const latest = () => {
    const calls = global.fetch.mock.calls.filter(
      ([url]) => url === '/regression-real-pager'
    );
    return calls.length ? JSON.parse(calls.at(-1)[1].body) : null;
  };
  await waitFor(() =>
    expect(JSON.stringify(latest()?.query)).toContain('first query')
  );
  fireEvent.click(
    await screen.findByRole('button', { name: 'Page 3', exact: true })
  );
  await waitFor(() => expect(latest()?.from).toBe(20));
  view.rerender(
    <SyndicationSearchWidget config={{ ...config, sharedControls: two }} />
  );
  await waitFor(() =>
    expect(JSON.stringify(latest()?.query)).toContain('other query')
  );
  expect(latest().from).toBe(0);
  // Returning to an existing group also starts at its first page.
  fireEvent.click(
    await screen.findByRole('button', { name: 'Page 3', exact: true })
  );
  await waitFor(() => expect(latest()?.from).toBe(20));
  view.rerender(<SyndicationSearchWidget config={config} />);
  await waitFor(() =>
    expect(JSON.stringify(latest()?.query)).toContain('first query')
  );
  expect(latest().from).toBe(0);
});
