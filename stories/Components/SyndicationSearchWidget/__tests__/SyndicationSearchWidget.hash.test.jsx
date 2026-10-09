/**
 * @file SyndicationSearchWidget.hash.test.jsx
 * @description Integration tests: the full widget reading and writing
 * facets and sort order in the URL hash.
 */

import React from 'react';
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from '@testing-library/react';
import { SyndicationSearchWidget } from '../SyndicationSearchWidget';
import { clearTaxonomyCache } from '../hooks/useTaxonomies';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useTransition: () => [false, fn => fn()],
  useDeferredValue: value => value,
}));

const TERMS = {
  results: [
    { id: '12', name: 'Flood' },
    { id: '34', name: 'Drought' },
  ],
  pager: { pages: 1 },
};

function mockFetch() {
  return jest.fn(url => {
    if (String(url).includes('/api/v1/taxonomy')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(TERMS) });
    }
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          hits: { hits: [], total: { value: 0 } },
          aggregations: {},
          took: 1,
        }),
    });
  });
}

/** Parsed body of the most recent search request. */
function lastSearchBody() {
  const calls = global.fetch.mock.calls.filter(
    ([url]) => !String(url).includes('/api/v1/taxonomy')
  );
  if (calls.length === 0) return null;
  return JSON.parse(calls[calls.length - 1][1].body);
}

const CONFIG = {
  enableHashSync: true,
  debounceDelay: 0,
  defaultFilters: [{ key: '_language', value: 'en' }],
};

const chipLabels = () =>
  Array.from(document.querySelectorAll('.mg-search__filter-chip-label')).map(
    el => el.textContent
  );

let pushSpy;
let consoleError;

beforeEach(() => {
  clearTaxonomyCache();
  global.fetch = mockFetch();
  window.history.replaceState(null, '', '/search');
  pushSpy = jest.spyOn(window.history, 'pushState');
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  pushSpy.mockRestore();
  consoleError.mockRestore();
  window.history.replaceState(null, '', '/');
});

describe('SyndicationSearchWidget URL hash state', () => {
  it('applies filters and sort from the hash, not the defaults', async () => {
    window.history.replaceState(
      null,
      '',
      '/search#sort=newest&f.field_hazard=12&f.field_hazard=34&f.foo=bar'
    );
    render(<SyndicationSearchWidget config={CONFIG} />);

    await waitFor(() =>
      expect(chipLabels()).toEqual(expect.arrayContaining(['Flood', 'Drought']))
    );
    // The hash replaced defaultFilters, so there is no language filter
    await waitFor(() => expect(lastSearchBody()).not.toBeNull());
    const body = lastSearchBody();
    // The hash replaced defaultFilters: hazard only, no language filter,
    // and the unknown f.foo key never reached the query
    expect(body.post_filter).toEqual({
      terms: { field_hazard: ['12', '34'] },
    });
    expect(JSON.stringify(body)).not.toContain('foo');
    expect(body.sort).toEqual([{ published_at: { order: 'desc' } }]);
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it('pushes a hash entry when a filter changes, and back restores it', async () => {
    window.history.replaceState(
      null,
      '',
      '/search#f.field_hazard=12&f.field_hazard=34'
    );
    render(<SyndicationSearchWidget config={CONFIG} />);
    await waitFor(() =>
      expect(chipLabels()).toEqual(expect.arrayContaining(['Flood', 'Drought']))
    );

    fireEvent.click(
      screen.getByRole('button', { name: /Remove filter: Hazard is Flood/ })
    );
    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('#f.field_hazard=34');
    await waitFor(() => expect(chipLabels()).toEqual(['Drought']));

    await act(async () => {
      window.history.back();
    });
    await waitFor(() =>
      expect(chipLabels()).toEqual(expect.arrayContaining(['Flood', 'Drought']))
    );
    expect(window.location.hash).toBe('#f.field_hazard=12&f.field_hazard=34');
    expect(pushSpy).toHaveBeenCalledTimes(1);
  });

  it('loads a query containing a literal % without throwing', async () => {
    window.history.replaceState(null, '', '/search#query=100%25%20renewable');
    render(<SyndicationSearchWidget config={CONFIG} />);
    await waitFor(() =>
      expect(screen.getByRole('searchbox')).toHaveValue('100% renewable')
    );
  });

  it('uses the defaults, not the load-time hash, when re-initialised later', async () => {
    window.history.replaceState(
      null,
      '',
      '/search#f.field_hazard=12&f.field_hazard=34'
    );
    const { rerender } = render(<SyndicationSearchWidget config={CONFIG} />);
    await waitFor(() =>
      expect(chipLabels()).toEqual(expect.arrayContaining(['Flood', 'Drought']))
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Remove filter: Hazard is Flood/ })
    );
    await waitFor(() => expect(chipLabels()).toEqual(['Drought']));

    // A new defaultFilters identity re-runs INITIALIZE
    rerender(
      <SyndicationSearchWidget
        config={{ ...CONFIG, defaultFilters: [...CONFIG.defaultFilters] }}
      />
    );
    await waitFor(() => expect(chipLabels()).toEqual([]));
    await waitFor(() =>
      expect(lastSearchBody().post_filter).toEqual({
        term: { _language: 'en' },
      })
    );
  });
});
