/**
 * @file useHashSync.test.jsx
 * @description Tests for URL parameter migration and hash sync initialization.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SearchProvider, useSearchState } from '../context/SearchContext';
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

describe('useHashSync — URL parameter migration', () => {
  let replaceStateSpy;

  beforeEach(() => {
    // Mock replaceState so the hook doesn't overwrite our test URL
    replaceStateSpy = jest.spyOn(window.history, 'replaceState').mockImplementation(() => {});
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
      null, '', expect.stringContaining('#query=climate')
    );
  });

  it('migrates ?query= to hash format and sets query state', async () => {
    window.history.pushState({}, '', '/search?query=disaster');
    renderWithHashSync();

    await waitFor(() => {
      expect(screen.getByTestId('query').textContent).toBe('disaster');
    });
    expect(replaceStateSpy).toHaveBeenCalledWith(
      null, '', expect.stringContaining('#query=disaster')
    );
  });

  it('prefers ?text= over ?query= when both are present', async () => {
    window.history.pushState({}, '', '/search?text=from-text&query=from-query');
    renderWithHashSync();

    await waitFor(() => {
      expect(screen.getByTestId('query').textContent).toBe('from-text');
    });
    expect(replaceStateSpy).toHaveBeenCalledWith(
      null, '', expect.stringContaining('#query=from-text')
    );
  });

  it('preserves other query params during migration', async () => {
    window.history.pushState({}, '', '/search?text=climate&lang=fr&page=2');
    renderWithHashSync();

    await waitFor(() => {
      expect(screen.getByTestId('query').textContent).toBe('climate');
    });
    expect(replaceStateSpy).toHaveBeenCalledWith(
      null, '', expect.stringMatching(/\?lang=fr&page=2#query=climate$/)
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
    window.history.pushState({}, '', '/search?text=' + encodeURIComponent('risk reduction & resilience'));
    renderWithHashSync();

    await waitFor(() => {
      expect(screen.getByTestId('query').textContent).toBe('risk reduction & resilience');
    });
    expect(replaceStateSpy).toHaveBeenCalledWith(
      null, '',
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
});
