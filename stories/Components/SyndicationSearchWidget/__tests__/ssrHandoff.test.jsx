/**
 * @file ssrHandoff.test.jsx
 * @description Server-rendered results stay on screen until the first client
 * results commit, then are removed.
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SyndicationSearchWidget } from '../SyndicationSearchWidget';
import syndicationSearchWidgetFromElement from '../SyndicationSearchWidget.fromElement';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useTransition: () => [false, fn => fn()],
  useDeferredValue: value => value,
}));

function deferredFetch() {
  let resolveSearch;
  global.fetch = jest.fn().mockImplementation(url => {
    if (String(url).includes('preventionweb.net/api')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });
    }
    return new Promise(resolve => {
      resolveSearch = () =>
        resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              hits: {
                hits: [
                  {
                    _id: '1',
                    _source: {
                      teaser: '<p class="client-hit">Client hit</p>',
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
    });
  });
  return () => resolveSearch();
}

function mountWithSsr(extraConfig = {}) {
  const container = document.createElement('div');
  container.setAttribute('data-mg-search-widget', '');
  container.setAttribute('data-mg-ssr', '');
  container.innerHTML =
    '<div data-mg-search-ssr><p class="ssr-hit">Server hit</p></div>';
  document.body.appendChild(container);
  const { config } = syndicationSearchWidgetFromElement(container);
  const view = render(
    <SyndicationSearchWidget
      config={{ ...config, enableHashSync: false, ...extraConfig }}
    />,
    { container }
  );
  return { container, view };
}

afterEach(() => {
  document.body.innerHTML = '';
});

it('fromElement picks up the server-rendered results element', () => {
  const container = document.createElement('div');
  container.innerHTML = '<div data-mg-search-ssr>SSR</div>';
  const ssr = container.firstChild;
  expect(syndicationSearchWidgetFromElement(container).config.ssrResults).toBe(
    ssr
  );
  expect(
    syndicationSearchWidgetFromElement(document.createElement('div')).config
  ).not.toHaveProperty('ssrResults');
});

it('keeps the server results in the results region until client results arrive', async () => {
  const resolveSearch = deferredFetch();
  const { container } = mountWithSsr();

  // React's first commit cleared the container; the SSR element is back,
  // inside the widget's results region, and nothing else stands in for it.
  const slot = container.querySelector('[data-mg-search-ssr-slot]');
  expect(slot).not.toBeNull();
  expect(slot.querySelector('.ssr-hit')).not.toBeNull();
  expect(slot).toHaveAttribute('aria-busy', 'true');
  expect(container.querySelector('.mg-search__skeleton')).toBeNull();

  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  await act(async () => {
    resolveSearch();
  });
  await waitFor(() =>
    expect(container.querySelector('.client-hit')).not.toBeNull()
  );
  expect(container.querySelector('.ssr-hit')).toBeNull();
  expect(document.querySelector('[data-mg-search-ssr]')).toBeNull();
});

it('drops the server results when the first search fails', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 500,
    statusText: 'Error',
  });
  jest.spyOn(console, 'error').mockImplementation(() => {});
  const { container } = mountWithSsr();

  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  expect(container.querySelector('.ssr-hit')).toBeNull();
  console.error.mockRestore();
});
