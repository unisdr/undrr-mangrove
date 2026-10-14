/**
 * @file useSearch.scheduling.test.jsx
 * @description When the widget searches: at once on mount and on non-text
 * changes, debounced only while typing, never for cosmetic config changes,
 * and never letting a stale response land.
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SyndicationSearchWidget } from '../SyndicationSearchWidget';
import {
  SearchProvider,
  useSearchDispatch,
  useSearchState,
  actions,
} from '../context/SearchContext';
import { useSearch } from '../hooks/useSearch';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useTransition: () => [false, fn => fn()],
  useDeferredValue: value => value,
}));

const response = (hits = []) => ({
  ok: true,
  json: () =>
    Promise.resolve({
      hits: { hits, total: { value: hits.length } },
      took: 1,
      results: [],
    }),
});

const searchCalls = () =>
  global.fetch.mock.calls.filter(
    ([url]) => !String(url).includes('preventionweb.net/api')
  );

const flush = () =>
  act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

beforeEach(() => {
  jest.useFakeTimers();
  global.fetch = jest.fn().mockResolvedValue(response());
});

afterEach(() => {
  jest.useRealTimers();
});

const base = { debounceDelay: 500, enableHashSync: false };

it('searches once on mount without waiting for the debounce', async () => {
  render(<SyndicationSearchWidget config={base} />);
  act(() => {
    jest.advanceTimersByTime(1);
  });
  await flush();
  expect(searchCalls()).toHaveLength(1);
});

it('debounces typing', async () => {
  render(<SyndicationSearchWidget config={base} />);
  act(() => {
    jest.advanceTimersByTime(1);
  });
  await flush();

  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: 'flood' },
  });
  act(() => {
    jest.advanceTimersByTime(100);
  });
  expect(searchCalls()).toHaveLength(1);
  act(() => {
    jest.advanceTimersByTime(500);
  });
  await flush();
  expect(searchCalls()).toHaveLength(2);
});

it('does not search again for a cosmetic config change', async () => {
  const { rerender } = render(
    <SyndicationSearchWidget config={{ ...base, displayMode: 'list' }} />
  );
  act(() => {
    jest.advanceTimersByTime(1);
  });
  await flush();

  rerender(
    <SyndicationSearchWidget
      config={{ ...base, displayMode: 'card', showResultsCount: false }}
    />
  );
  act(() => {
    jest.advanceTimersByTime(1000);
  });
  await flush();
  expect(searchCalls()).toHaveLength(1);
});

it('searches again at once when a query-affecting option changes', async () => {
  const { rerender } = render(<SyndicationSearchWidget config={base} />);
  act(() => {
    jest.advanceTimersByTime(1);
  });
  await flush();

  rerender(
    <SyndicationSearchWidget
      config={{ ...base, customFilters: ['type:news'] }}
    />
  );
  act(() => {
    jest.advanceTimersByTime(1);
  });
  await flush();
  expect(searchCalls()).toHaveLength(2);
  expect(JSON.parse(searchCalls()[1][1].body).query).toBeDefined();
});

describe('with a hook harness', () => {
  let dispatch;
  let state;
  function Harness() {
    useSearch();
    dispatch = useSearchDispatch();
    state = useSearchState();
    return null;
  }

  it('runs a facet change at once and ignores the superseded response', async () => {
    let resolveFirst;
    global.fetch = jest
      .fn()
      .mockImplementationOnce(
        (url, { signal }) =>
          new Promise((resolve, reject) => {
            resolveFirst = () => resolve(response([{ _id: 'stale' }]));
            signal.addEventListener('abort', () =>
              reject(
                Object.assign(new Error('aborted'), { name: 'AbortError' })
              )
            );
          })
      )
      .mockResolvedValue(
        response([{ _id: 'fresh', _source: { teaser: 'x' } }])
      );

    render(
      <SearchProvider config={base}>
        <Harness />
      </SearchProvider>
    );
    act(() => {
      dispatch(actions.initialize({ defaultFilters: [] }));
    });
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    act(() => {
      dispatch(actions.setFacet('type', 'news'));
    });
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[0][1].signal.aborted).toBe(true);

    resolveFirst();
    await flush();
    expect(state.results.map(hit => hit._id)).toEqual(['fresh']);
  });
});

describe('aggregations', () => {
  let dispatch;
  let state;
  function Harness() {
    useSearch();
    dispatch = useSearchDispatch();
    state = useSearchState();
    return null;
  }

  const withAggs = {
    ok: true,
    json: () =>
      Promise.resolve({
        hits: { hits: [], total: { value: 20 } },
        aggregations: { type: { buckets: [{ key: 'news', doc_count: 20 }] } },
        took: 1,
      }),
  };

  const bodies = () =>
    global.fetch.mock.calls.map(([, init]) => JSON.parse(init.body));

  it('are requested again only when the main query changes', async () => {
    global.fetch = jest.fn().mockResolvedValue(withAggs);
    render(
      <SearchProvider config={base}>
        <Harness />
      </SearchProvider>
    );
    act(() => {
      dispatch(actions.initialize({ defaultFilters: [] }));
    });
    const step = async action => {
      act(() => {
        dispatch(action);
      });
      act(() => {
        jest.advanceTimersByTime(600);
      });
      await flush();
      return bodies()[bodies().length - 1];
    };
    act(() => {
      jest.advanceTimersByTime(1);
    });
    await flush();
    expect(bodies()[0].aggs).toBeDefined();

    // Page, sort and facet selections (a post_filter) don't change them.
    const paged = await step(actions.setPage(2));
    expect(paged.from).toBe(5);
    expect(paged.aggs).toBeUndefined();
    expect((await step(actions.setSort('newest'))).aggs).toBeUndefined();
    const faceted = await step(actions.setFacet('type', 'news'));
    expect(faceted.post_filter).toBeDefined();
    expect(faceted.aggs).toBeUndefined();
    expect(state.aggregations.type.buckets[0].key).toBe('news');

    // A new query does.
    expect((await step(actions.setQuery('flood'))).aggs).toBeDefined();
  });
});

describe('searching at once', () => {
  const mount = async () => {
    render(<SyndicationSearchWidget config={base} />);
    act(() => {
      jest.advanceTimersByTime(1);
    });
    await flush();
    expect(searchCalls()).toHaveLength(1);
  };
  const lastQuery = () =>
    JSON.parse(searchCalls()[searchCalls().length - 1][1].body).query
      .function_score.query.bool.must.query_string.query;

  it('runs a typed query waiting for the debounce when the reader presses Enter', async () => {
    await mount();
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'flood' } });
    act(() => {
      jest.advanceTimersByTime(10);
    });
    expect(searchCalls()).toHaveLength(1);

    fireEvent.submit(input.closest('form'));
    await flush();
    expect(searchCalls()).toHaveLength(2);
    expect(lastQuery()).toContain('flood');

    // The debounce doesn't fire a second time.
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    await flush();
    expect(searchCalls()).toHaveLength(2);
  });

  it('runs Clear at once', async () => {
    await mount();
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'flood' } });
    act(() => {
      jest.advanceTimersByTime(600);
    });
    await flush();
    expect(searchCalls()).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: /clear search/i }));
    act(() => {
      jest.advanceTimersByTime(1);
    });
    await flush();
    expect(searchCalls()).toHaveLength(3);
    expect(lastQuery()).toBe('*');
  });
});

describe('back and forward', () => {
  let dispatch;
  function Harness() {
    useSearch();
    dispatch = useSearchDispatch();
    return null;
  }

  it('searches a restored query at once', async () => {
    render(
      <SearchProvider config={base}>
        <Harness />
      </SearchProvider>
    );
    act(() => {
      dispatch(actions.initialize({ defaultFilters: [] }));
    });
    act(() => {
      jest.advanceTimersByTime(1);
    });
    await flush();
    expect(searchCalls()).toHaveLength(1);

    act(() => {
      dispatch(actions.restoreState({ query: 'drought' }));
    });
    act(() => {
      jest.advanceTimersByTime(1);
    });
    await flush();
    expect(searchCalls()).toHaveLength(2);
  });
});
