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

  await act(async () => {
    release();
  });
  await waitFor(() => expect(screen.getByText('second')).toBeInTheDocument());
  expect(document.querySelector('.mg-search__results--refreshing')).toBeNull();
  expect(document.querySelector('.mg-search__results-loader')).toBeNull();
});
