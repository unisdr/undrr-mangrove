/**
 * @file SyndicationSearchWidget.hydrate.test.jsx
 * @description The widget root repeats `data-mg-search-widget`, the marker its
 * hydration host carries and the documented hydration selector matches. A
 * re-scan must leave one widget, not mount a second inside the first.
 * See undrr/undrr-mangrove#1227.
 */

import { act } from '@testing-library/react';
import createHydrator from '../../../../src/hydrate';
import SyndicationSearchWidget from '../SyndicationSearchWidget';
import fromElement from '../SyndicationSearchWidget.fromElement';

const originalError = console.error;
const originalFetch = global.fetch;

beforeAll(() => {
  console.error = (...args) => {
    if (
      args[0]?.includes?.('not wrapped in act') ||
      args[0]?.includes?.('Search error') ||
      args[0]?.includes?.('Failed to fetch taxonomies')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  global.fetch = originalFetch;
});

beforeEach(() => {
  document.body.innerHTML = '';
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          hits: { hits: [], total: { value: 0 } },
          aggregations: {},
          results: [],
          took: 1,
        }),
    })
  );
});

function hydrate() {
  return createHydrator({
    selector: '[data-mg-search-widget]',
    component: SyndicationSearchWidget,
    fromElement,
  });
}

describe('SyndicationSearchWidget hydration', () => {
  it('leaves exactly one widget root after update() re-scans the page', async () => {
    document.body.innerHTML =
      '<div data-mg-search-widget data-search-endpoint="https://example.test/search"></div>';

    let hydrator;
    await act(async () => {
      hydrator = hydrate();
    });

    expect(hydrator.roots).toHaveLength(1);
    expect(document.querySelectorAll('.mg-search-widget')).toHaveLength(1);

    await act(async () => {
      hydrator.update();
    });

    expect(hydrator.roots).toHaveLength(1);
    expect(document.querySelectorAll('.mg-search-widget')).toHaveLength(1);
    expect(
      document.querySelectorAll('.mg-search-widget .mg-search-widget')
    ).toHaveLength(0);
  });

  it('hydrates a widget added to the page after the first pass', async () => {
    document.body.innerHTML =
      '<div data-mg-search-widget data-search-endpoint="https://example.test/search"></div>';

    let hydrator;
    await act(async () => {
      hydrator = hydrate();
    });

    const added = document.createElement('div');
    added.setAttribute('data-mg-search-widget', '');
    added.dataset.searchEndpoint = 'https://example.test/search';
    document.body.appendChild(added);

    await act(async () => {
      hydrator.update();
    });

    expect(hydrator.roots).toHaveLength(2);
    expect(document.querySelectorAll('.mg-search-widget')).toHaveLength(2);
  });
});
