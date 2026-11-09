import React from 'react';
import {
  render,
  screen,
  within,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import {
  SyndicationSearchWidget,
  buildInitialSearchQuery,
} from '../SyndicationSearchWidget';
import { FACET_FIELDS } from '../utils/constants';
import {
  SearchProvider,
  useSearchConfig,
  useSearchState,
  useSearchDispatch,
  actions,
} from '../context/SearchContext';
import { getSharedStore, withSharedControls } from '../context/sharedControls';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useTransition: () => [false, fn => fn()],
  useDeferredValue: value => value,
}));

let groupId = 0;
const countriesOnly = Object.fromEntries(
  FACET_FIELDS.map(field => [field.key, field.key === 'field_country_region'])
);
const latest = endpoint => {
  const calls = global.fetch.mock.calls.filter(([url]) => url === endpoint);
  return calls.length ? JSON.parse(calls.at(-1)[1].body) : null;
};
const requestText = endpoint => JSON.stringify(latest(endpoint));
const callCount = endpoint =>
  global.fetch.mock.calls.filter(([url]) => url === endpoint).length;

function configs() {
  const sharedControls = {
    id: `group-${++groupId}`,
    visibleFilters: countriesOnly,
    defaultFilters: [],
    defaultQuery: '',
  };
  const base = {
    enableHashSync: true,
    debounceDelay: 0,
    minSearchLength: 0,
    facetsTarget: '#shared-facets',
    searchTarget: '#shared-search',
    sharedControls,
  };
  return {
    news: {
      ...base,
      searchEndpoint: '/news',
      customFilters: ['type:news'],
      defaultFilters: [{ key: '_language', value: 'en' }],
      defaultSort: 'newest',
      resultsPerPage: 3,
    },
    events: {
      ...base,
      searchEndpoint: '/events',
      customFilters: ['type:event'],
      defaultFilters: [{ key: '_language', value: 'fr' }],
      defaultSort: 'eventDateAsc',
      resultsPerPage: 7,
    },
    independent: {
      searchEndpoint: '/independent',
      defaultFilters: [],
      enableHashSync: false,
      minSearchLength: 0,
    },
  };
}
function Page({
  config,
  first = true,
  second = true,
  independent = false,
  hidden = false,
  allHidden = false,
}) {
  return (
    <>
      <div id="shared-search" />
      <div id="shared-facets" />
      {first && (
        <section aria-label="News" hidden={allHidden}>
          <SyndicationSearchWidget config={config.news} />
        </section>
      )}
      {second && (
        <section aria-label="Events" hidden={hidden || allHidden}>
          <SyndicationSearchWidget config={config.events} />
        </section>
      )}
      {independent && (
        <section aria-label="Independent">
          <SyndicationSearchWidget config={config.independent} />
        </section>
      )}
    </>
  );
}

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  global.fetch = jest.fn(async (url, options) => {
    if (!String(url).startsWith('/'))
      return {
        ok: true,
        json: async () => ({
          results: ['1', '2', '3'].map(id => ({ id, name: id })),
        }),
      };
    const request = JSON.parse(options.body);
    const selectedThree = JSON.stringify(request).includes('"3"');
    const keys = url === '/news' ? ['1', '2'] : ['2', '3'];
    return {
      ok: true,
      json: async () => ({
        hits: { hits: [], total: { value: 0 } },
        took: 1,
        aggregations: {
          field_country_region: {
            buckets: selectedThree
              ? []
              : keys.map(key => ({ key, doc_count: 99 })),
          },
        },
      }),
    };
  });
});

it('shares queries and union options across scoped displays without leaking sort, context, counts or unrelated widgets', async () => {
  const config = configs();
  render(<Page config={config} independent />);
  await waitFor(() => expect(latest('/news')).not.toBeNull());
  await waitFor(() => expect(latest('/events')).not.toBeNull());
  await waitFor(() => expect(latest('/independent')).not.toBeNull());
  const independentCalls = callCount('/independent');
  const search = document.querySelector('#shared-search input');
  fireEvent.change(search, { target: { value: 'climate' } });
  await waitFor(() => expect(requestText('/news')).toContain('climate'));
  await waitFor(() => expect(requestText('/events')).toContain('climate'));
  expect(callCount('/independent')).toBe(independentCalls);
  expect(requestText('/news')).toContain('type:news');
  expect(requestText('/news')).not.toContain('type:event');
  expect(requestText('/events')).toContain('type:event');
  expect(requestText('/news')).toContain('"en"');
  expect(requestText('/events')).toContain('"fr"');
  expect(latest('/news').size).toBe(3);
  expect(latest('/events').size).toBe(7);
  expect(latest('/news').sort).toEqual([{ published_at: { order: 'desc' } }]);
  expect(latest('/events').sort[0]).toHaveProperty('event_start');
  expect(window.location.hash).toBe('');
  const controls = within(document.getElementById('shared-facets'));
  fireEvent.click(controls.getByRole('button', { name: 'Country and region' }));
  expect(
    controls.getAllByRole('option').map(option => option.textContent)
  ).toEqual(expect.arrayContaining(['1', '2', '3']));
  expect(
    document.querySelector('#shared-facets .mg-select__option-count')
  ).toBeNull();
  fireEvent.click(controls.getByRole('option', { name: '3', exact: true }));
  await waitFor(() => expect(requestText('/news')).toContain('"3"'));
  await waitFor(() => expect(requestText('/events')).toContain('"3"'));
  expect(
    screen.getAllByRole('button', {
      name: 'Remove filter: Country and region is 3',
    })
  ).toBeDefined();
});

it('keeps shared state through first-owner removal, hidden displays, zero results and late mounts', async () => {
  const config = configs();
  const view = render(<Page config={config} second={false} />);
  await waitFor(() => expect(latest('/news')).not.toBeNull());
  fireEvent.change(document.querySelector('#shared-search input'), {
    target: { value: 'flood' },
  });
  await waitFor(() => expect(requestText('/news')).toContain('flood'));
  view.rerender(<Page config={config} hidden />);
  await waitFor(() => expect(requestText('/events')).toContain('flood'));
  view.rerender(<Page config={config} first={false} hidden={false} />);
  await waitFor(() =>
    expect(document.querySelector('#shared-search input')).toHaveValue('flood')
  );
  const controls = within(document.getElementById('shared-facets'));
  fireEvent.click(controls.getByRole('button', { name: 'Country and region' }));
  await waitFor(() =>
    expect(
      controls.getByRole('option', { name: '3', exact: true })
    ).toBeDefined()
  );
  expect(controls.queryByRole('option', { name: '1', exact: true })).toBeNull();
  fireEvent.click(controls.getByRole('option', { name: '3', exact: true }));
  await waitFor(() => expect(requestText('/events')).toContain('"3"'));
  await waitFor(() =>
    expect(document.querySelector('#shared-search input')).toHaveValue('flood')
  );
  expect(
    controls.getByRole('button', { name: 'Country and region' })
  ).toHaveTextContent('3');
  view.rerender(<Page config={config} />);
  await waitFor(() => expect(requestText('/news')).toContain('"3"'));
  expect(requestText('/news')).toContain('flood');
});

it('resets each page and clears group filters while preserving per-display sort, hidden defaults and required tabs', async () => {
  const config = configs();
  const period = {
    id: 'period',
    title: 'Period',
    display: 'tabs',
    defaultValue: '0',
    options: [
      { label: 'Upcoming', query: 'event_end:[now TO *]' },
      { label: 'Previous', query: 'event_end:[* TO now}' },
    ],
  };
  const shared = {
    ...config.news.sharedControls,
    defaultFilters: [{ key: 'field_country_region', value: '2' }],
    customFacets: [
      {
        id: 'format',
        title: 'Format',
        options: [{ label: 'Online', query: 'format:online' }],
      },
    ],
  };
  const values = {};
  function Probe({ name }) {
    const ownConfig = useSearchConfig();
    const state = useSearchState();
    const dispatch = useSearchDispatch();
    React.useEffect(() => {
      dispatch(
        actions.initialize({
          defaultFilters: ownConfig.defaultFilters,
          customFacets: ownConfig.customFacets,
          defaultSort: ownConfig.defaultSort,
        })
      );
    }, [dispatch, ownConfig]);
    values[name] = { state, dispatch };
    return null;
  }
  render(
    <>
      <SearchProvider config={{ ...config.news, sharedControls: shared }}>
        <Probe name="news" />
      </SearchProvider>
      <SearchProvider
        config={{
          ...config.events,
          sharedControls: shared,
          customFacets: [period],
        }}
      >
        <Probe name="events" />
      </SearchProvider>
    </>
  );
  await waitFor(() => expect(values.events.state.isInitialized).toBe(true));
  act(() => {
    values.news.dispatch(actions.setQuery('flood'));
    values.news.dispatch(actions.setFacet('field_country_region', '3'));
    values.news.dispatch(actions.setCustomFacet('format', ['0']));
    values.events.dispatch(actions.setCustomFacet('period', ['1']));
    values.news.dispatch(actions.setSort('oldest'));
  });
  act(() => {
    values.news.dispatch(actions.setPage(3));
    values.events.dispatch(actions.setPage(4));
  });
  expect(values.news.state.page).toBe(3);
  expect(values.events.state.page).toBe(4);
  act(() =>
    values.events.dispatch(actions.setFacet('field_country_region', '1'))
  );
  expect(values.news.state.page).toBe(1);
  expect(values.events.state.page).toBe(1);
  act(() =>
    values.news.dispatch(
      actions.clearFacets({ defaultFilters: config.news.defaultFilters })
    )
  );
  for (const name of ['news', 'events']) {
    expect(values[name].state.facets.field_country_region).toEqual(['2']);
    expect(values[name].state.query).toBe('flood');
    expect(values[name].state.customFacets.format).toBeUndefined();
  }
  expect(values.news.state.facets._language).toEqual(['en']);
  expect(values.events.state.facets._language).toEqual(['fr']);
  expect(values.news.state.sortBy).toBe('oldest');
  expect(values.events.state.sortBy).toBe('eventDateAsc');
  expect(values.events.state.customFacets.period).toEqual(['1']);
  expect(values.news.state.customFacets.period).toBeUndefined();
});

it('keeps same-named groups in separate documents isolated', () => {
  const config = withSharedControls(configs().news);
  const docA = document.implementation.createHTMLDocument();
  const docB = document.implementation.createHTMLDocument();
  const first = getSharedStore(docA, config);
  const second = getSharedStore(docB, config);
  first.dispatch(actions.setQuery('first document'));
  expect(first.getSnapshot().query).toBe('first document');
  expect(second.getSnapshot().query).toBe('');
});

it('retains one group subscription through StrictMode remount checks', async () => {
  const config = configs();
  const view = render(
    <React.StrictMode>
      <Page config={config} />
    </React.StrictMode>
  );
  await waitFor(() => expect(latest('/events')).not.toBeNull());
  fireEvent.change(document.querySelector('#shared-search input'), {
    target: { value: 'resilience' },
  });
  await waitFor(() => expect(requestText('/news')).toContain('resilience'));
  await waitFor(() => expect(requestText('/events')).toContain('resilience'));
  view.unmount();
  const second = render(<Page config={config} first={false} />);
  await waitFor(() =>
    expect(document.querySelector('#shared-search input')).toHaveValue(
      'resilience'
    )
  );
  second.unmount();
});

it('updates untouched group defaults while preserving visitor changes', () => {
  const config = withSharedControls(configs().news);
  const doc = document.implementation.createHTMLDocument();
  const store = getSharedStore(doc, config);
  store.configure({
    ...config,
    sharedControls: {
      ...config.sharedControls,
      defaultQuery: 'initial',
      defaultFilters: [{ key: 'field_country_region', value: '2' }],
    },
  });
  expect(store.getSnapshot().query).toBe('initial');
  expect(store.getSnapshot().facets.field_country_region).toEqual(['2']);
  store.dispatch(actions.setQuery('reader query'));
  store.dispatch(actions.setFacet('field_country_region', '3'));
  store.configure({
    ...config,
    sharedControls: {
      ...config.sharedControls,
      defaultQuery: 'new default',
      defaultFilters: [{ key: 'field_country_region', value: '1' }],
    },
  });
  expect(store.getSnapshot().query).toBe('reader query');
  expect(store.getSnapshot().facets.field_country_region).toEqual(['3']);
});

it('keeps exactly one external controller while all displays are hidden and transfers ownership safely', async () => {
  const config = configs();
  const view = render(<Page config={config} allHidden />);
  const search = () =>
    document.querySelectorAll('#shared-search input[type="search"]');
  const facets = () =>
    document.querySelectorAll('#shared-facets [data-mg-search-facets]');
  await waitFor(() => expect(search()).toHaveLength(1));
  expect(facets()).toHaveLength(1);
  expect(search()[0].closest('[hidden]')).toBeNull();
  fireEvent.change(search()[0], { target: { value: 'disaster' } });
  await waitFor(() => expect(requestText('/news')).toContain('disaster'));
  await waitFor(() => expect(requestText('/events')).toContain('disaster'));
  view.rerender(<Page config={config} first={false} allHidden />);
  await waitFor(() => expect(search()).toHaveLength(1));
  expect(search()[0]).toHaveValue('disaster');
  expect(facets()).toHaveLength(1);
  view.rerender(<Page config={config} first={false} />);
  await waitFor(() => expect(search()).toHaveLength(1));
  expect(facets()).toHaveLength(1);
  expect(search()[0]).toHaveValue('disaster');
});

it('builds server defaults equal to the first request without capturing later shared visitor selections', async () => {
  const config = configs();
  config.news.sharedControls.defaultQuery = 'initial';
  config.news.sharedControls.defaultFilters = [
    { key: 'field_country_region', value: '2' },
  ];
  const stable = value =>
    JSON.parse(
      JSON.stringify(value, (key, entry) => (key === 'now' ? undefined : entry))
    );
  const expected = buildInitialSearchQuery(config.news);
  render(<Page config={config} />);
  await waitFor(() => expect(latest('/news')).not.toBeNull());
  expect(stable(latest('/news'))).toEqual(stable(expected));
  expect(stable(latest('/events'))).toEqual(
    stable(buildInitialSearchQuery(config.events))
  );
  fireEvent.change(document.querySelector('#shared-search input'), {
    target: { value: 'reader selection' },
  });
  await waitFor(() =>
    expect(requestText('/news')).toContain('reader selection')
  );
  expect(stable(buildInitialSearchQuery(config.news))).toEqual(
    stable(expected)
  );
});
