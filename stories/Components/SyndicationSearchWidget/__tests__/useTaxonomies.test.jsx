/**
 * @file useTaxonomies.test.js
 * @description Tests for the taxonomy hook: shared fetch, label resolution,
 * entity decoding and the readiness guard used to hide unlabelled facets.
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useTaxonomies,
  clearTaxonomyCache,
  MAX_TAXONOMY_PAGES,
} from '../hooks/useTaxonomies';
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

    it('treats an empty term list as a failure and retries on next mount', async () => {
      global.fetch = jest
        .fn()
        .mockImplementationOnce(() => jsonResponse({ results: [] }))
        .mockImplementation(() => jsonResponse(TERMS));
      const { result } = renderHook(() => useTaxonomies());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.error).toMatch(/no terms/);
      expect(result.current.taxonomiesReady).toBe(false);

      const { result: later } = renderHook(() => useTaxonomies());
      await waitFor(() => expect(later.current.taxonomiesReady).toBe(true));
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('does not cache failures: a later mount retries without refresh', async () => {
      global.fetch = jest
        .fn()
        .mockImplementationOnce(() => Promise.reject(new Error('offline')))
        .mockImplementation(() => jsonResponse(TERMS));
      const { result: first } = renderHook(() => useTaxonomies());
      await waitFor(() => expect(first.current.error).toBe('offline'));
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const { result: second } = renderHook(() => useTaxonomies());
      await waitFor(() => expect(second.current.taxonomiesReady).toBe(true));
      expect(global.fetch).toHaveBeenCalledTimes(2);
      // The consumer that saw the failure gets the retry's result too
      expect(first.current.taxonomiesReady).toBe(true);
      expect(first.current.error).toBeNull();
    });

    it('refresh() retries, returns a promise and updates every consumer', async () => {
      global.fetch = jest
        .fn()
        .mockImplementationOnce(() => Promise.reject(new Error('offline')))
        .mockImplementation(() => jsonResponse(TERMS));
      const { result: a } = renderHook(() => useTaxonomies());
      const { result: b } = renderHook(() => useTaxonomies());
      await waitFor(() => expect(a.current.error).toBe('offline'));
      expect(b.current.error).toBe('offline');

      let returned;
      await act(async () => {
        returned = a.current.refresh();
        await returned;
      });
      expect(returned).toBeInstanceOf(Promise);
      expect(a.current.taxonomiesReady).toBe(true);
      expect(b.current.taxonomiesReady).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('stays ready while a refresh is in flight after a good load', async () => {
      const { result } = renderHook(() => useTaxonomies());
      await waitFor(() => expect(result.current.taxonomiesReady).toBe(true));

      let resolveRefresh;
      global.fetch = jest.fn(
        () =>
          new Promise(resolve => {
            resolveRefresh = () =>
              resolve({ ok: true, status: 200, json: () => TERMS });
          })
      );
      let pending;
      act(() => {
        pending = result.current.refresh();
      });
      expect(result.current.isLoading).toBe(true);
      expect(result.current.taxonomiesReady).toBe(true);
      expect(result.current.getLabel('field_hazard', '341')).toBe('Avalanche');

      await act(async () => {
        resolveRefresh();
        await pending;
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.taxonomiesReady).toBe(true);
    });

    it('keeps the last good terms if a refresh fails', async () => {
      const { result } = renderHook(() => useTaxonomies());
      await waitFor(() => expect(result.current.taxonomiesReady).toBe(true));
      global.fetch = jest.fn(() => jsonResponse({}, false, 503));
      await act(async () => {
        await result.current.refresh();
      });
      expect(result.current.error).toMatch(/503/);
      expect(result.current.taxonomiesReady).toBe(true);
    });
  });

  describe('paged responses', () => {
    it('fetches every page and merges the terms', async () => {
      global.fetch = jest.fn(url =>
        url.includes('page=1')
          ? jsonResponse({
              results: [{ id: '999', name: 'Page two term' }],
              pager: { pages: 2, current_page: 1 },
            })
          : jsonResponse({
              results: TERMS.results,
              pager: { pages: 2, current_page: 0 },
            })
      );
      const { result } = renderHook(() =>
        useTaxonomies('https://example.test/api/v1/taxonomy?vid=hazard')
      );
      await waitFor(() => expect(result.current.taxonomiesReady).toBe(true));
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenLastCalledWith(
        'https://example.test/api/v1/taxonomy?vid=hazard&page=1'
      );
      expect(result.current.getLabel('field_hazard', '999')).toBe(
        'Page two term'
      );
      expect(result.current.getLabel('field_hazard', '341')).toBe('Avalanche');
    });

    it.each([
      [
        'absolute',
        'https://example.test/api/t?vid=x',
        'https://example.test/api/t?vid=x&page=1',
      ],
      [
        'protocol-relative',
        '//cdn.test/api/t?vid=x',
        `${window.location.protocol}//cdn.test/api/t?vid=x&page=1`,
      ],
      [
        'root-relative',
        '/api/t?vid=x',
        new URL('/api/t?vid=x&page=1', window.location.href).href,
      ],
      [
        'path-relative',
        'api/t?x=1',
        new URL('api/t?x=1&page=1', window.location.href).href,
      ],
    ])(
      'resolves %s endpoints against the page when paging',
      async (_, endpoint, expected) => {
        global.fetch = jest.fn(() =>
          jsonResponse({ results: TERMS.results, pager: { pages: 2 } })
        );
        const { result } = renderHook(() => useTaxonomies(endpoint));
        await waitFor(() => expect(result.current.taxonomiesReady).toBe(true));
        expect(global.fetch).toHaveBeenNthCalledWith(1, endpoint);
        expect(global.fetch).toHaveBeenLastCalledWith(expected);
      }
    );

    it('is not ready when a later page fails', async () => {
      global.fetch = jest.fn(url =>
        url.includes('page=1')
          ? jsonResponse({}, false, 500)
          : jsonResponse({ results: TERMS.results, pager: { pages: 2 } })
      );
      const { result } = renderHook(() => useTaxonomies());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.taxonomiesReady).toBe(false);
      expect(result.current.error).toMatch(/500/);
    });

    it('is not ready when the response reports too many pages', async () => {
      global.fetch = jest.fn(() =>
        jsonResponse({
          results: TERMS.results,
          pager: { pages: MAX_TAXONOMY_PAGES + 1 },
        })
      );
      const { result } = renderHook(() => useTaxonomies());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.taxonomiesReady).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
