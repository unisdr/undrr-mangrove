import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { SyndicationSearchWidget } from '../SyndicationSearchWidget';
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useTransition: () => [false, fn => fn()],
  useDeferredValue: value => value,
}));
test('hidden sort retains bookmarked page on initial load', async () => {
  window.history.replaceState(
    null,
    '',
    '/search#query=flood&page=3&sort=oldest'
  );
  global.fetch = jest.fn(async url => ({
    ok: true,
    json: async () =>
      !String(url).startsWith('/redteam-')
        ? { results: [] }
        : {
            hits: { hits: [], total: { value: 1000 } },
            aggregations: {},
            took: 1,
          },
  }));
  render(
    <SyndicationSearchWidget
      config={{
        searchEndpoint: '/redteam-search',
        enableHashSync: true,
        showSort: false,
        defaultSort: 'newest',
        resultsPerPage: 10,
        showFacets: false,
        debounceDelay: 0,
      }}
    />
  );
  await waitFor(() =>
    expect(
      global.fetch.mock.calls.filter(([url]) => url === '/redteam-search')
        .length
    ).toBeGreaterThan(0)
  );
  const calls = global.fetch.mock.calls.filter(
    ([url]) => url === '/redteam-search'
  );
  const body = JSON.parse(calls.at(-1)[1].body);
  expect(body.from).toBe(20);
  expect(body.sort[0]).toEqual({ published_at: { order: 'desc' } });
  expect(window.location.hash).toContain('page=3');
});
test('dynamic sort lock retains current query and facets while resetting page', async () => {
  window.history.replaceState(
    null,
    '',
    '/search#query=flood&page=3&sort=oldest&f.field_theme=5'
  );
  global.fetch = jest.fn(async url => ({
    ok: true,
    json: async () =>
      !String(url).startsWith('/redteam-')
        ? { results: [] }
        : {
            hits: { hits: [], total: { value: 1000 } },
            aggregations: {},
            took: 1,
          },
  }));
  const config = {
    searchEndpoint: '/redteam-dynamic',
    enableHashSync: true,
    defaultSort: 'newest',
    resultsPerPage: 10,
    showFacets: false,
    debounceDelay: 0,
  };
  const view = render(<SyndicationSearchWidget config={config} />);
  const latest = () => {
    const c = global.fetch.mock.calls.filter(
      ([url]) => url === '/redteam-dynamic'
    );
    return c.length ? JSON.parse(c.at(-1)[1].body) : null;
  };
  await waitFor(() => expect(latest()?.from).toBe(20));
  expect(latest().sort[0].published_at.order).toBe('asc');
  view.rerender(
    <SyndicationSearchWidget config={{ ...config, showSort: false }} />
  );
  await waitFor(() =>
    expect(latest()?.sort[0].published_at.order).toBe('desc')
  );
  expect(JSON.stringify(latest().query)).toContain('flood');
  expect(JSON.stringify(latest().post_filter)).toContain('field_theme');
  expect(latest().from).toBe(0);
});

afterEach(() => {
  window.history.replaceState(null, '', '/');
});
