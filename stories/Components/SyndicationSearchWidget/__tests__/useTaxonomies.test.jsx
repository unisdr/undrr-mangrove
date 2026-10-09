/**
 * @file useTaxonomies.test.js
 * @description Tests for the taxonomy hook: shared fetch, label resolution,
 * entity decoding and the readiness guard used to hide unlabelled facets.
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTaxonomies, clearTaxonomyCache } from '../hooks/useTaxonomies';
import { SearchProvider } from '../context/SearchContext';
import { DEFAULT_CONFIG, TAXONOMY_API_URL } from '../utils/constants';

const TERMS = {
  results: [
    { id: '341', name: 'Avalanche' },
    { id: '123', name: 'Côte d&#039;Ivoire' },
    { id: 177, name: 'Korea, Dem People&#039;s Rep of' },
  ],
  pager: { count: 3, pages: 1 },
};

function jsonResponse(body, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

let consoleError;
let consoleWarn;

beforeEach(() => {
  clearTaxonomyCache();
  global.fetch = jest.fn(() => jsonResponse(TERMS));
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
  consoleWarn.mockRestore();
});

describe('useTaxonomies', () => {
  it('defaults to the v1 URL without news_type', async () => {
    expect(DEFAULT_CONFIG.taxonomyEndpoint).toBe(TAXONOMY_API_URL);
    expect(TAXONOMY_API_URL).toContain(
      'vid=prevention_web_regions,hazard,theme'
    );
    expect(TAXONOMY_API_URL).not.toContain('news_type');

    const { result } = renderHook(() => useTaxonomies());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(global.fetch).toHaveBeenCalledWith(TAXONOMY_API_URL);
  });

  it('works outside a SearchProvider and resolves decoded labels', async () => {
    const { result } = renderHook(() => useTaxonomies());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.taxonomiesReady).toBe(false);

    await waitFor(() => expect(result.current.taxonomiesReady).toBe(true));

    const { getLabel } = result.current;
    expect(getLabel('field_hazard', '341', 'terms')).toBe('Avalanche');
    expect(getLabel('field_country_region', 123, 'terms')).toBe(
      "Côte d'Ivoire"
    );
    expect(getLabel('field_country_region', '177', 'terms')).toBe(
      "Korea, Dem People's Rep of"
    );
    expect(result.current.taxonomies.terms[1].name).toBe("Côte d'Ivoire");
  });

  it('falls back to the raw ID by default and to the given fallback on request', async () => {
    const { result } = renderHook(() => useTaxonomies());
    await waitFor(() => expect(result.current.taxonomiesReady).toBe(true));

    const { getLabel } = result.current;
    expect(getLabel('field_theme', '1177', 'terms')).toBe('1177');
    expect(
      getLabel('field_theme', '1177', 'terms', { fallback: null })
    ).toBeNull();
    expect(getLabel('field_theme', '341', 'terms', { fallback: null })).toBe(
      'Avalanche'
    );
  });

  it('labels news subtypes from the static list, including 797', async () => {
    const { result } = renderHook(() => useTaxonomies());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.getLabel('field_news_type', '797')).toBe(
      'Opportunities'
    );
  });

  it('fetches once for every consumer on the page', async () => {
    const { result: a } = renderHook(() => useTaxonomies());
    const { result: b } = renderHook(() => useTaxonomies());
    const { result: c } = renderHook(() => useTaxonomies());

    await waitFor(() => {
      expect(a.current.taxonomiesReady).toBe(true);
      expect(b.current.taxonomiesReady).toBe(true);
      expect(c.current.taxonomiesReady).toBe(true);
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // A consumer mounted later starts ready, with no new request
    const { result: d } = renderHook(() => useTaxonomies());
    expect(d.current.taxonomiesReady).toBe(true);
    expect(d.current.isLoading).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('reads taxonomyEndpoint from the SearchProvider config', async () => {
    const endpoint = 'https://example.test/taxonomy';
    const wrapper = ({ children }) => (
      <SearchProvider config={{ taxonomyEndpoint: endpoint }}>
        {children}
      </SearchProvider>
    );
    const { result } = renderHook(() => useTaxonomies(), { wrapper });
    await waitFor(() => expect(result.current.taxonomiesReady).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith(endpoint);
  });

  it('prefers an explicit endpoint argument over config', async () => {
    const wrapper = ({ children }) => (
      <SearchProvider config={{ taxonomyEndpoint: 'https://config.test/' }}>
        {children}
      </SearchProvider>
    );
    const { result } = renderHook(
      () => useTaxonomies('https://argument.test/'),
      { wrapper }
    );
    await waitFor(() => expect(result.current.taxonomiesReady).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith('https://argument.test/');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  describe('readiness guard', () => {
    it('is not ready on an HTTP error', async () => {
      global.fetch = jest.fn(() => jsonResponse({}, false, 403));
      const { result } = renderHook(() => useTaxonomies());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.error).toMatch(/403/);
      expect(result.current.taxonomiesReady).toBe(false);
      expect(result.current.getLabel('field_theme', '1177', 'terms')).toBe(
        '1177'
      );
    });

    it('is not ready on a non-JSON response (e.g. a challenge page)', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.reject(new SyntaxError('Unexpected token <')),
        })
      );
      const { result } = renderHook(() => useTaxonomies());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.error).toMatch(/not JSON/);
      expect(result.current.taxonomiesReady).toBe(false);
    });

    it('is not ready when the response has no terms', async () => {
      global.fetch = jest.fn(() => jsonResponse({ results: [] }));
      const { result } = renderHook(() => useTaxonomies());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.error).toBeNull();
      expect(result.current.taxonomiesReady).toBe(false);
    });

    it('does not cache failures, so refresh retries', async () => {
      global.fetch = jest
        .fn()
        .mockImplementationOnce(() => Promise.reject(new Error('offline')))
        .mockImplementation(() => jsonResponse(TERMS));
      const { result } = renderHook(() => useTaxonomies());
      await waitFor(() => expect(result.current.error).toBe('offline'));

      act(() => {
        result.current.refresh();
      });
      await waitFor(() => expect(result.current.taxonomiesReady).toBe(true));
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('warns when the pager reports more pages than were fetched', async () => {
    global.fetch = jest.fn(() =>
      jsonResponse({ ...TERMS, pager: { count: 1200, pages: 2 } })
    );
    const { result } = renderHook(() => useTaxonomies());
    await waitFor(() => expect(result.current.taxonomiesReady).toBe(true));
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('reports 2 pages')
    );
  });
});
