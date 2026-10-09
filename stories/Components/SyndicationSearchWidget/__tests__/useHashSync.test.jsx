/**
 * @file useHashSync.test.jsx
 * @description Tests for URL parameter migration and hash sync initialization.
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import {
  SearchProvider,
  useSearchState,
  useSearchDispatch,
  useSearchConfig,
  actions,
} from '../context/SearchContext';
import { useHashSync } from '../hooks/useHashSync';

function HashSyncConsumer({ enabled = true }) {
  const state = useSearchState();
  useHashSync({ enabled });
  return <span data-testid="query">{state.query}</span>;
}

function renderWithHashSync(config = {}, enabled = true) {
  return render(
    <SearchProvider config={{ enableHashSync: true, ...config }}>
      <HashSyncConsumer enabled={enabled} />
    </SearchProvider>
  );
}

describe('useHashSync: URL parameter migration', () => {
  let replaceStateSpy;

  beforeEach(() => {
    // Mock replaceState so the hook doesn't overwrite our test URL
    replaceStateSpy = jest
      .spyOn(window.history, 'replaceState')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    replaceStateSpy.mockRestore();
    // Reset URL to clean state
    window.history.pushState({}, '', '/');
  });

  it('migrates ?text= to hash format and sets query state', async () => {
    window.history.pushState({}, '', '/search?text=climate');
    renderWithHashSync();

    await waitFor(() => {
      expect(screen.getByTestId('query').textContent).toBe('climate');
    });
    expect(replaceStateSpy).toHaveBeenCalledWith(
      null,
      '',
      expect.stringContaining('#query=climate')
    );
  });

  it('migrates ?query= to hash format and sets query state', async () => {
    window.history.pushState({}, '', '/search?query=disaster');
    renderWithHashSync();

    await waitFor(() => {
      expect(screen.getByTestId('query').textContent).toBe('disaster');
    });
    expect(replaceStateSpy).toHaveBeenCalledWith(
      null,
      '',
      expect.stringContaining('#query=disaster')
    );
  });

  it('prefers ?text= over ?query= when both are present', async () => {
    window.history.pushState({}, '', '/search?text=from-text&query=from-query');
    renderWithHashSync();

    await waitFor(() => {
      expect(screen.getByTestId('query').textContent).toBe('from-text');
    });
    expect(replaceStateSpy).toHaveBeenCalledWith(
      null,
      '',
      expect.stringContaining('#query=from-text')
    );
  });

  it('preserves other query params during migration', async () => {
    window.history.pushState({}, '', '/search?text=climate&lang=fr&page=2');
    renderWithHashSync();

    await waitFor(() => {
      expect(screen.getByTestId('query').textContent).toBe('climate');
    });
    expect(replaceStateSpy).toHaveBeenCalledWith(
      null,
      '',
      expect.stringMatching(/\?lang=fr&page=2#query=climate$/)
    );
  });

  it('reads query from existing hash fragment', async () => {
    window.history.pushState({}, '', '/search#query=resilience');
    renderWithHashSync();

    await waitFor(() => {
      expect(screen.getByTestId('query').textContent).toBe('resilience');
    });
  });

  it('encodes special characters in migrated query', async () => {
    window.history.pushState(
      {},
      '',
      '/search?text=' + encodeURIComponent('risk reduction & resilience')
    );
    renderWithHashSync();

    await waitFor(() => {
      expect(screen.getByTestId('query').textContent).toBe(
        'risk reduction & resilience'
      );
    });
    expect(replaceStateSpy).toHaveBeenCalledWith(
      null,
      '',
      expect.stringContaining('#query=risk%20reduction%20%26%20resilience')
    );
  });

  it('does nothing when no query params or hash are present', () => {
    window.history.pushState({}, '', '/search');
    renderWithHashSync();

    expect(screen.getByTestId('query').textContent).toBe('');
  });

  it('does nothing when disabled', () => {
    window.history.pushState({}, '', '/search?text=climate');
    renderWithHashSync({}, false);

    expect(screen.getByTestId('query').textContent).toBe('');
  });

  // Regression: Drupal data attributes are always strings, so enableHashSync
  // arrives as 'true' / 'false' / 'auto'. The hook must treat the string
  // 'true' the same as the boolean true; otherwise editors who pick "Always
  // enabled" in Gutenberg get hash sync silently disabled.
  it('treats enableHashSync: "true" (string) the same as boolean true', async () => {
    window.history.pushState({}, '', '/search#query=resilience');
    renderWithHashSync({ enableHashSync: 'true' });

    await waitFor(() => {
      expect(screen.getByTestId('query').textContent).toBe('resilience');
    });
  });

  it('treats enableHashSync: "false" (string) as disabled', () => {
    window.history.pushState({}, '', '/search#query=resilience');
    renderWithHashSync({ enableHashSync: 'false' });

    expect(screen.getByTestId('query').textContent).toBe('');
  });
});

/**
 * Harness mirroring the widget: hash sync plus INITIALIZE with the hash
 * state read on mount.
 */
const harness = {};
function Harness() {
  harness.renders = (harness.renders || 0) + 1;
  const state = useSearchState();
  const dispatch = useSearchDispatch();
  const config = useSearchConfig();
  const { initialHashState } = useHashSync({ enabled: true });
  React.useEffect(() => {
    dispatch(
      actions.initialize({
        defaultFilters: config.defaultFilters,
        defaultSort: config.defaultSort,
        initialFacets: initialHashState?.facets || null,
        initialFacetOperators: initialHashState?.facetOperators || null,
        initialSort: initialHashState?.sort || null,
      })
    );
  }, [dispatch, config, initialHashState]);
  harness.state = state;
  harness.dispatch = dispatch;
  return null;
}

function renderHarness(config = {}) {
  return render(
    <SearchProvider
      config={{
        enableHashSync: true,
        defaultFilters: [{ key: '_language', value: 'en' }],
        ...config,
      }}
    >
      <Harness />
    </SearchProvider>
  );
}

const currentHash = () => window.location.hash.replace(/^#/, '');

describe('useHashSync: facets, sort and history', () => {
  let pushSpy;
  let replaceSpy;

  beforeEach(() => {
    window.history.replaceState(null, '', '/search');
    pushSpy = jest.spyOn(window.history, 'pushState');
    replaceSpy = jest.spyOn(window.history, 'replaceState');
  });

  afterEach(() => {
    pushSpy.mockRestore();
    replaceSpy.mockRestore();
    window.history.replaceState(null, '', '/');
  });

  it('restores facets, operators and sort from the hash over the defaults', async () => {
    window.history.replaceState(
      null,
      '',
      '/search#sort=newest&f.field_hazard=12&f.field_hazard=34&op.field_hazard=AND'
    );
    renderHarness();
    await waitFor(() => expect(harness.state.isInitialized).toBe(true));
    expect(harness.state.facets).toEqual({ field_hazard: ['12', '34'] });
    expect(harness.state.facetOperators).toEqual({ field_hazard: 'AND' });
    expect(harness.state.sortBy).toBe('newest');
    // Loading the page doesn't add a history entry
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it('applies defaults when the hash has no f.* params', async () => {
    window.history.replaceState(null, '', '/search#query=flood&f.foo=1');
    renderHarness();
    await waitFor(() => expect(harness.state.isInitialized).toBe(true));
    expect(harness.state.query).toBe('flood');
    expect(harness.state.facets).toEqual({ _language: ['en'] });
    // The unknown key is dropped from the URL, in place
    expect(currentHash()).toBe('query=flood');
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it('ignores unknown and invalid params', async () => {
    window.history.replaceState(
      null,
      '',
      '/search#f.foo=1&f.field_theme=5&op.field_theme=XOR&sort=random'
    );
    renderHarness();
    await waitFor(() => expect(harness.state.isInitialized).toBe(true));
    expect(harness.state.facets).toEqual({ field_theme: ['5'] });
    expect(harness.state.facets.foo).toBeUndefined();
    expect(harness.state.facetOperators).toEqual({});
    expect(harness.state.sortBy).toBe('relevance');
  });

  it('reads a query containing a literal % without throwing', async () => {
    window.history.replaceState(
      null,
      '',
      '/search#query=100%25%20renewable&label=50%25%20off'
    );
    document.body.innerHTML = '<h1>Title</h1>';
    renderHarness();
    await waitFor(() => expect(harness.state.query).toBe('100% renewable'));
    expect(document.querySelector('h1').textContent).toBe('50% off');
    document.body.innerHTML = '';
  });

  it('pushes a history entry for facet, operator, sort and page changes', async () => {
    renderHarness();
    await waitFor(() => expect(harness.state.isInitialized).toBe(true));
    expect(pushSpy).not.toHaveBeenCalled();

    act(() => {
      harness.dispatch(actions.setFacet('field_hazard', ['12', '34']));
    });
    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(new URLSearchParams(currentHash()).getAll('f.field_hazard')).toEqual(
      ['12', '34']
    );

    act(() => {
      harness.dispatch(actions.setFacetOperator('field_hazard', 'AND'));
    });
    act(() => {
      harness.dispatch(actions.setSort('oldest'));
    });
    act(() => {
      harness.dispatch(actions.setPage(2));
    });
    expect(pushSpy).toHaveBeenCalledTimes(4);
    const params = new URLSearchParams(currentHash());
    expect(params.get('op.field_hazard')).toBe('AND');
    expect(params.get('sort')).toBe('oldest');
    expect(params.get('page')).toBe('2');
  });

  it('replaces the entry while a query is typed', async () => {
    renderHarness();
    await waitFor(() => expect(harness.state.isInitialized).toBe(true));
    act(() => {
      harness.dispatch(actions.setQuery('flo'));
    });
    act(() => {
      harness.dispatch(actions.setQuery('flood'));
    });
    expect(pushSpy).not.toHaveBeenCalled();
    expect(currentHash()).toBe('query=flood');
  });

  it('restores the previous state on back, without pushing', async () => {
    renderHarness();
    await waitFor(() => expect(harness.state.isInitialized).toBe(true));

    act(() => {
      harness.dispatch(actions.setFacet('field_hazard', ['12']));
    });
    act(() => {
      harness.dispatch(actions.setSort('newest'));
    });
    expect(pushSpy).toHaveBeenCalledTimes(2);

    await act(async () => {
      window.history.back();
    });
    await waitFor(() => expect(harness.state.sortBy).toBe('relevance'));
    expect(harness.state.facets).toEqual({
      _language: ['en'],
      field_hazard: ['12'],
    });

    // Back to the entry with no f.* params: defaults apply again
    await act(async () => {
      window.history.back();
    });
    await waitFor(() =>
      expect(harness.state.facets).toEqual({ _language: ['en'] })
    );
    expect(currentHash()).toBe('');

    // Forward again
    await act(async () => {
      window.history.forward();
    });
    await waitFor(() =>
      expect(harness.state.facets).toEqual({
        _language: ['en'],
        field_hazard: ['12'],
      })
    );
    expect(pushSpy).toHaveBeenCalledTimes(2);
  });

  it('restores state on popstate alone (no hashchange)', async () => {
    renderHarness();
    await waitFor(() => expect(harness.state.isInitialized).toBe(true));

    // Simulate traversal to an entry, firing only popstate
    window.history.replaceState(
      null,
      '',
      '/search#sort=oldest&f.field_theme=7'
    );
    await act(async () => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(harness.state.sortBy).toBe('oldest');
    expect(harness.state.facets).toEqual({ field_theme: ['7'] });
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it('tidies a hand-edited hash in place without adding an entry', async () => {
    renderHarness();
    await waitFor(() => expect(harness.state.isInitialized).toBe(true));

    await act(async () => {
      window.location.hash = '#f.field_hazard=12&f.foo=1&sort=bogus';
    });
    await waitFor(() =>
      expect(harness.state.facets).toEqual({ field_hazard: ['12'] })
    );
    expect(currentHash()).toBe('f.field_hazard=12');
    expect(pushSpy).not.toHaveBeenCalled();
  });

  describe('in-page anchors', () => {
    it('ignores an anchor hashchange and keeps the anchor', async () => {
      window.history.replaceState(
        null,
        '',
        '/search#query=flood&f._language=en&f.field_hazard=12'
      );
      renderHarness();
      await waitFor(() => expect(harness.state.isInitialized).toBe(true));

      await act(async () => {
        window.location.hash = '#main-content';
      });
      expect(currentHash()).toBe('main-content');
      expect(harness.state.query).toBe('flood');
      expect(harness.state.facets).toEqual({
        _language: ['en'],
        field_hazard: ['12'],
      });
      expect(pushSpy).not.toHaveBeenCalled();
    });

    it('ignores Back and Forward onto an anchor entry', async () => {
      renderHarness();
      await waitFor(() => expect(harness.state.isInitialized).toBe(true));
      act(() => {
        harness.dispatch(actions.setFacet('field_hazard', ['12']));
      });
      const searchHash = currentHash();

      await act(async () => {
        window.location.hash = '#toc-section';
      });
      await act(async () => {
        window.history.back();
      });
      await waitFor(() => expect(currentHash()).toBe(searchHash));
      await act(async () => {
        window.history.forward();
      });
      await waitFor(() => expect(currentHash()).toBe('toc-section'));
      expect(harness.state.facets).toEqual({
        _language: ['en'],
        field_hazard: ['12'],
      });
      expect(pushSpy).toHaveBeenCalledTimes(1);
    });

    it('keeps an anchor the page loaded on, until the reader changes something', async () => {
      window.history.replaceState(null, '', '/search#main-content');
      renderHarness({ defaultQuery: 'risk' });
      await waitFor(() => expect(harness.state.isInitialized).toBe(true));
      expect(currentHash()).toBe('main-content');
      expect(harness.state.facets).toEqual({ _language: ['en'] });

      act(() => {
        harness.dispatch(actions.setFacet('field_hazard', ['12']));
      });
      expect(pushSpy).toHaveBeenCalledTimes(1);
      expect(currentHash()).toContain('f.field_hazard=12');
    });
  });

  it('handles popstate followed by hashchange for one navigation once', async () => {
    renderHarness();
    await waitFor(() => expect(harness.state.isInitialized).toBe(true));

    window.history.replaceState(null, '', '/search#sort=oldest');
    await act(async () => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(harness.state.sortBy).toBe('oldest');
    const rendersAfterFirst = harness.renders;

    await act(async () => {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(harness.renders).toBe(rendersAfterFirst);
  });

  it('ignores a page beyond the Elasticsearch result window', async () => {
    window.history.replaceState(null, '', '/search#query=flood&page=999999');
    renderHarness({ resultsPerPage: 5 });
    await waitFor(() => expect(harness.state.isInitialized).toBe(true));
    expect(harness.state.page).toBe(1);
    expect(currentHash()).toBe('query=flood');
  });
});
