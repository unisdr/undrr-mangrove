/**
 * @file loadingStates.test.jsx
 * @description A new search keeps the results on screen, dimmed with a
 * small loader, instead of swapping in the skeleton.
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { SyndicationSearchWidget } from '../SyndicationSearchWidget';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useTransition: () => [false, fn => fn()],
  useDeferredValue: value => value,
}));

const hitsResponse = id => ({
  ok: true,
  json: () =>
    Promise.resolve({
      hits: {
        hits: [
          {
            _id: id,
            _source: {
              teaser: `<p class="hit">${id}</p>`,
              type: 'news',
              field_domain_access: ['www_undrr_org'],
            },
          },
        ],
        total: { value: 1 },
      },
      took: 1,
    }),
});

it('keeps results visible and dimmed while the next search runs', async () => {
  let release;
  let searches = 0;
  global.fetch = jest.fn().mockImplementation(url => {
    if (String(url).includes('preventionweb.net/api')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });
    }
    searches += 1;
    if (searches === 1) return Promise.resolve(hitsResponse('first'));
    return new Promise(resolve => {
      release = () => resolve(hitsResponse('second'));
    });
  });

  render(
    <SyndicationSearchWidget
      config={{ enableHashSync: false, debounceDelay: 0, defaultFilters: [] }}
    />
  );
  await waitFor(() => expect(screen.getByText('first')).toBeInTheDocument());
  expect(
    document.querySelector('.mg-search__results-list.mg-search__enter')
  ).not.toBeNull();

  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: 'flood' },
  });
  await waitFor(() =>
    expect(
      document.querySelector('.mg-search__results--refreshing')
    ).not.toBeNull()
  );
  expect(screen.getByText('first')).toBeInTheDocument();
  expect(document.querySelector('.mg-search__results-loader')).not.toBeNull();
  expect(document.querySelector('.mg-search__skeleton')).toBeNull();
  const region = document.querySelector('.mg-search__main');
  expect(region).toHaveAttribute('aria-busy', 'true');
  const bar = region.querySelector('progress');
  expect(bar).not.toHaveAttribute('value');
  expect(bar.closest('[aria-hidden="true"]')).not.toBeNull();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(bar.closest('[role="status"]')).toBeNull();

  await act(async () => {
    release();
  });
  await waitFor(() => expect(screen.getByText('second')).toBeInTheDocument());
  expect(document.querySelector('.mg-search__results--refreshing')).toBeNull();
  expect(document.querySelector('.mg-search__results-loader')).toBeNull();
  expect(region).toHaveAttribute('aria-busy', 'false');
  expect(region.querySelector('progress')).toBeNull();
  expect(
    region.querySelector('.mg-u-sr-only[role="status"]')
  ).toHaveTextContent('1 result found for flood');
});

it('does not dim the results while a typed query waits for the debounce', async () => {
  let searches = 0;
  global.fetch = jest.fn().mockImplementation(url => {
    if (String(url).includes('preventionweb.net/api')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });
    }
    searches += 1;
    if (searches === 1) return Promise.resolve(hitsResponse('first'));
    // Never answers: stays in flight until aborted.
    return new Promise(() => {});
  });

  render(
    <SyndicationSearchWidget
      config={{ enableHashSync: false, debounceDelay: 50, defaultFilters: [] }}
    />
  );
  await waitFor(() => expect(screen.getByText('first')).toBeInTheDocument());

  const input = screen.getByRole('searchbox');
  fireEvent.change(input, { target: { value: 'flood' } });
  await waitFor(() =>
    expect(
      document.querySelector('.mg-search__results--refreshing')
    ).not.toBeNull()
  );

  // Typing on aborts the request in flight; nothing is sent until the
  // debounce ends, so the results are not dimmed meanwhile.
  fireEvent.change(input, { target: { value: 'flood risk' } });
  expect(document.querySelector('.mg-search__results--refreshing')).toBeNull();
  await waitFor(() =>
    expect(
      document.querySelector('.mg-search__results--refreshing')
    ).not.toBeNull()
  );
});

// A rejected request must clear busy/progress in both first-load and refresh
// paths. Otherwise the native bar would keep implying work after failure.
it.each([false, true])(
  'clears shared progress on failure (refresh=%s)',
  async refresh => {
    let rejectSearch;
    let searches = 0;
    global.fetch = jest.fn().mockImplementation(url => {
      if (String(url).includes('preventionweb.net/api')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [] }),
        });
      }
      searches += 1;
      if (refresh && searches === 1)
        return Promise.resolve(hitsResponse('first'));
      return new Promise((resolve, reject) => {
        rejectSearch = reject;
      });
    });
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(
        <SyndicationSearchWidget
          config={{
            enableHashSync: false,
            debounceDelay: 0,
            defaultFilters: [],
          }}
        />
      );
      if (refresh) {
        await screen.findByText('first');
        fireEvent.change(screen.getByRole('searchbox'), {
          target: { value: 'flood' },
        });
      }
      await waitFor(() =>
        expect(
          document.querySelector('.mg-search__main progress')
        ).not.toBeNull()
      );
      expect(document.querySelector('.mg-search__main')).toHaveAttribute(
        'aria-busy',
        'true'
      );
      expect(Boolean(document.querySelector('.mg-search__skeleton'))).toBe(
        !refresh
      );
      await act(async () => rejectSearch(new Error('Network unavailable')));
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Network unavailable'
      );
      expect(document.querySelector('.mg-search__main')).toHaveAttribute(
        'aria-busy',
        'false'
      );
      expect(document.querySelector('.mg-search__main progress')).toBeNull();
      expect(document.querySelector('.mg-search__results-loader')).toBeNull();
    } finally {
      errorLog.mockRestore();
    }
  }
);

it.each(['list', 'card', 'card-book'])(
  'preserves focused retained results when a %s refresh completes',
  async displayMode => {
    let release;
    let searches = 0;
    const response = () => ({
      ok: true,
      json: async () => ({
        hits: {
          hits: [
            {
              _id: 'retained',
              _source: {
                teaser: '<p><a href="/retained">Retained result</a></p>',
                title: 'Retained result',
                url: '/retained',
                type: 'news',
                field_domain_access: ['www_undrr_org'],
              },
            },
          ],
          total: { value: 1 },
        },
        took: 1,
      }),
    });
    global.fetch = jest.fn().mockImplementation(url => {
      if (String(url).includes('preventionweb.net/api')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ results: [] }),
        });
      }
      searches += 1;
      if (searches === 1) return Promise.resolve(response());
      return new Promise(resolve => {
        release = () => resolve(response());
      });
    });
    render(
      <SyndicationSearchWidget
        config={{
          enableHashSync: false,
          debounceDelay: 0,
          defaultFilters: [],
          displayMode,
        }}
      />
    );
    const link = await screen.findByRole('link', { name: 'Retained result' });
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'flood' },
    });
    await waitFor(() =>
      expect(
        document.querySelector('.mg-search__results--refreshing')
      ).not.toBeNull()
    );
    // A keyboard user can reach retained results while the request is pending.
    link.focus();
    expect(link).toHaveFocus();
    await act(async () => {
      release();
    });
    await waitFor(() =>
      expect(
        document.querySelector('.mg-search__results--refreshing')
      ).toBeNull()
    );
    expect(screen.getByRole('link', { name: 'Retained result' })).toBe(link);
    expect(link).toHaveFocus();
  }
);
