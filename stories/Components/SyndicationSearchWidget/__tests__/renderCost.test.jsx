/**
 * @file renderCost.test.jsx
 * @description Typing a query doesn't re-render facet dropdowns or
 * re-process result teasers.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SyndicationSearchWidget } from '../SyndicationSearchWidget';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useTransition: () => [false, fn => fn()],
  useDeferredValue: value => value,
}));

let dropdownRenders = 0;
jest.mock('../components/SelectDropdown', () => ({
  SelectDropdown: () => {
    dropdownRenders += 1;
    return null;
  },
}));

const TEASER =
  '<div class="mg-card"><div class="field field--name-node-title"><a href="/n/1">T</a></div><div class="mg-card__summary">S</div></div>';

beforeEach(() => {
  dropdownRenders = 0;
  global.fetch = jest.fn().mockImplementation(url =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve(
          String(url).includes('preventionweb.net/api')
            ? { results: [] }
            : {
                hits: {
                  hits: [
                    {
                      _id: '1',
                      _source: {
                        teaser: TEASER,
                        type: 'news',
                        field_domain_access: ['www_undrr_org'],
                      },
                    },
                  ],
                  total: { value: 1 },
                },
                aggregations: {
                  type: { buckets: [{ key: 'news', doc_count: 1 }] },
                },
                took: 1,
              }
        ),
    })
  );
});

it('keeps facets and results out of the render while typing', async () => {
  const parse = jest.spyOn(DOMParser.prototype, 'parseFromString');
  render(
    <SyndicationSearchWidget
      config={{
        enableHashSync: false,
        debounceDelay: 10000,
        visibleTeaserFields: { summary: false },
      }}
    />
  );
  await waitFor(() =>
    expect(document.querySelector('.mg-search__result')).not.toBeNull()
  );

  const dropdownsBefore = dropdownRenders;
  const parsesBefore = parse.mock.calls.length;

  const input = screen.getByRole('searchbox');
  for (const value of ['f', 'fl', 'flo', 'floo', 'flood']) {
    fireEvent.change(input, { target: { value } });
  }

  expect(dropdownRenders).toBe(dropdownsBefore);
  expect(parse.mock.calls.length).toBe(parsesBefore);
  parse.mockRestore();
});
