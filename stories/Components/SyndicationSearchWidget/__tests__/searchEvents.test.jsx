/**
 * @file searchEvents.test.jsx
 * @description The `mg-search:filter-change` and `mg-search:sort-change`
 * analytics events: one per visitor action, with stable keys and codes, and
 * none for configuration, defaults, URL restoration or programmatic changes.
 * See unisdr/undrr-mangrove#1477.
 */

import React, { StrictMode } from 'react';
import {
  render,
  screen,
  within,
  waitFor,
  act,
  fireEvent,
} from '@testing-library/react';
import createHydrator from '../../../../src/hydrate';
import { SyndicationSearchWidget } from '../SyndicationSearchWidget';
import fromElement from '../SyndicationSearchWidget.fromElement';
import { useSearchDispatch, actions } from '../context/SearchContext';
import SortOptions from '../components/SortOptions';
import { SearchProvider } from '../context/SearchContext';
import { clearTaxonomyCache } from '../hooks/useTaxonomies';
import { FACET_FIELDS } from '../utils/constants';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useTransition: () => [false, fn => fn()],
  useDeferredValue: value => value,
}));

const TERMS = {
  results: [
    { id: '12', name: 'Flood' },
    { id: '34', name: 'Drought' },
  ],
  pager: { pages: 1 },
};
const AGGREGATIONS = {
  field_hazard: {
    buckets: [
      { key: '12', doc_count: 5 },
      { key: '34', doc_count: 3 },
    ],
  },
  year: {
    buckets: [
      { key: 1704067200000, key_as_string: '2024', doc_count: 4 },
      { key: 1672531200000, key_as_string: '2023', doc_count: 2 },
    ],
  },
  type: { buckets: [{ key: 'news', doc_count: 10 }] },
  field_news_type: { buckets: [{ key: '751', doc_count: 7 }] },
  _language: {
    buckets: [
      { key: 'en', doc_count: 9 },
      { key: 'fr', doc_count: 2 },
    ],
  },
};
const SEARCH_TEXT = 'private words';
const EVENTS = ['mg-search:filter-change', 'mg-search:sort-change'];

const originalFetch = global.fetch;
const originalScrollIntoView = Element.prototype.scrollIntoView;
let events;
let consoleError;
let consoleWarn;
const record = event =>
  events.push({
    type: event.type,
    detail: event.detail,
    bubbles: event.bubbles,
    target: event.target,
  });

beforeEach(() => {
  events = [];
  clearTaxonomyCache();
  Element.prototype.scrollIntoView = jest.fn();
  window.history.replaceState(null, '', '/search');
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  global.fetch = jest.fn(async url => ({
    ok: true,
    json: async () =>
      String(url).includes('/api/v1/taxonomy')
        ? TERMS
        : {
            hits: { hits: [], total: { value: 0 } },
            aggregations: AGGREGATIONS,
            took: 1,
          },
  }));
  EVENTS.forEach(name => document.addEventListener(name, record));
});

afterEach(() => {
  EVENTS.forEach(name => document.removeEventListener(name, record));
  consoleError.mockRestore();
  consoleWarn.mockRestore();
  window.history.replaceState(null, '', '/');
  global.fetch = originalFetch;
  if (originalScrollIntoView)
    Element.prototype.scrollIntoView = originalScrollIntoView;
  else delete Element.prototype.scrollIntoView;
});

const CONFIG = {
  enableHashSync: false,
  debounceDelay: 0,
  minSearchLength: 0,
  defaultQuery: SEARCH_TEXT,
};
const SIDEBAR = '.mg-search__sidebar';
const details = () => events.map(event => event.detail);
const searches = () =>
  global.fetch.mock.calls.filter(
    ([url]) => !String(url).includes('/api/v1/taxonomy')
  ).length;

/** The fieldset of one control inside `scope`, once its options loaded. */
async function control(selector, scope = SIDEBAR) {
  let found;
  await waitFor(() => {
    found = document.querySelector(`${scope} ${selector}`);
    expect(found).not.toBeNull();
  });
  return found;
}
const facet = (key, scope) => control(`[data-facet-key="${key}"]`, scope);
const option = (fieldset, text) =>
  within(fieldset)
    .getAllByRole('option')
    .find(item => item.textContent.includes(text));

/** Open the dropdown if needed and click the option containing `text`. */
async function choose(fieldset, text) {
  const trigger = fieldset.querySelector('.mg-select__trigger');
  if (trigger.getAttribute('aria-expanded') !== 'true')
    fireEvent.click(trigger);
  await waitFor(() => expect(option(fieldset, text)).toBeTruthy());
  fireEvent.click(option(fieldset, text));
}

describe('search filter and sort events', () => {
  it('stays silent on mount, for configured defaults and for hidden constraints', async () => {
    render(
      <SyndicationSearchWidget
        config={{
          ...CONFIG,
          defaultFilters: [
            { key: '_language', value: 'en' },
            { key: 'field_hazard', value: '12' },
          ],
          customFilters: ['type:news'],
          defaultSort: 'newest',
        }}
      />
    );
    await facet('field_hazard');
    expect(events).toEqual([]);
  });

  it('reports a multi-select dropdown choice once, then its removal', async () => {
    render(<SyndicationSearchWidget config={CONFIG} />);
    const hazard = await facet('field_hazard');
    await choose(hazard, 'Flood');
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('mg-search:filter-change');
    expect(events[0].bubbles).toBe(true);
    expect(events[0].target).toBe(hazard);
    expect(hazard.closest('[data-vf-google-analytics-region]')).toHaveAttribute(
      'data-vf-google-analytics-region',
      'undrr-search-facets'
    );
    expect(events[0].detail).toEqual({
      region: 'undrr-search-facets',
      kind: 'field',
      key: 'field_hazard',
      action: 'select',
      changed: ['12'],
      values: ['12'],
      operator: 'or',
    });

    await choose(hazard, 'Drought');
    await choose(hazard, 'Flood');
    expect(details().slice(1)).toEqual([
      expect.objectContaining({
        action: 'select',
        changed: ['34'],
        values: ['12', '34'],
      }),
      expect.objectContaining({
        action: 'clear',
        changed: ['12'],
        values: ['34'],
      }),
    ]);
    expect(JSON.stringify(details())).not.toContain(SEARCH_TEXT);
    expect(JSON.stringify(details())).not.toMatch(/Flood|Drought/);
  });

  it('reports a keyboard selection like a pointer one', async () => {
    render(<SyndicationSearchWidget config={CONFIG} />);
    const hazard = await facet('field_hazard');
    const trigger = hazard.querySelector('.mg-select__trigger');
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(details()).toEqual([
      expect.objectContaining({
        key: 'field_hazard',
        action: 'select',
        changed: [expect.stringMatching(/^(12|34)$/)],
      }),
    ]);
  });

  it('reports the match mode once a facet has two values', async () => {
    render(<SyndicationSearchWidget config={CONFIG} />);
    const hazard = await facet('field_hazard');
    await choose(hazard, 'Flood');
    await choose(hazard, 'Drought');
    events.length = 0;
    fireEvent.click(await within(hazard).findByRole('radio', { name: /all/i }));
    expect(details()).toEqual([
      {
        region: 'undrr-search-facets',
        kind: 'field',
        key: 'field_hazard',
        action: 'operator',
        changed: [],
        values: ['12', '34'],
        operator: 'and',
      },
    ]);
    events.length = 0;
    await choose(hazard, 'Flood');
    expect(details()).toEqual([
      expect.objectContaining({
        action: 'clear',
        values: ['34'],
        operator: 'and',
      }),
    ]);
  });

  it('reports a single-select replacement as one selection and ignores a repeat', async () => {
    render(<SyndicationSearchWidget config={CONFIG} />);
    const language = await facet('_language');
    await choose(language, 'French');
    await choose(language, 'French');
    expect(details()).toEqual([
      {
        region: 'undrr-search-facets',
        kind: 'field',
        key: '_language',
        action: 'select',
        changed: ['fr'],
        values: ['fr'],
        operator: 'or',
      },
    ]);
  });

  it('reports the year facet with the year, not the histogram key', async () => {
    render(<SyndicationSearchWidget config={CONFIG} />);
    await choose(await facet('year'), '2024');
    expect(details()).toEqual([
      expect.objectContaining({
        key: 'year',
        action: 'select',
        changed: ['2024'],
        values: ['2024'],
      }),
    ]);
  });

  it('reports parent and subtype choices of the hierarchical Type facet', async () => {
    render(<SyndicationSearchWidget config={CONFIG} />);
    const type = await facet('type');
    await choose(type, 'Update');
    await choose(type, 'News');
    expect(details()).toEqual([
      expect.objectContaining({
        key: 'type',
        action: 'select',
        changed: ['field_news_type:751'],
        values: ['field_news_type:751'],
      }),
      expect.objectContaining({
        key: 'type',
        action: 'select',
        changed: ['news'],
        values: ['field_news_type:751', 'news'],
      }),
    ]);
  });

  const chips = () => screen.getAllByRole('button', { name: /^Remove/ });

  it('reports a removed chip once', async () => {
    render(<SyndicationSearchWidget config={CONFIG} />);
    const hazard = await facet('field_hazard');
    await choose(hazard, 'Flood');
    await choose(hazard, 'Drought');
    events.length = 0;

    await waitFor(() => expect(chips()).toHaveLength(2));
    fireEvent.click(chips()[0]);
    expect(events).toHaveLength(1);
    expect(events[0].bubbles).toBe(true);
    expect(events[0].target).toHaveClass('mg-search__active-filters');
    expect(events[0].detail).toEqual({
      region: 'undrr-search-facets',
      kind: 'field',
      key: 'field_hazard',
      action: 'clear',
      changed: ['12'],
      values: ['34'],
      operator: 'or',
    });
  });

  it('reports clear all once', async () => {
    render(<SyndicationSearchWidget config={CONFIG} />);
    await choose(await facet('field_hazard'), 'Flood');
    await choose(await facet('year'), '2024');
    events.length = 0;

    await waitFor(() => expect(chips()).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', { name: /^Clear all/ }));
    expect(details()).toEqual([
      {
        region: 'undrr-search-facets',
        kind: null,
        key: null,
        action: 'clear-all',
        changed: [],
        values: [],
        operator: null,
      },
    ]);
    await waitFor(() =>
      expect(document.querySelector('.mg-search__filter-chip')).toBeNull()
    );
    expect(events).toHaveLength(1);
  });

  it('reports custom dropdown filters by option value or position, never label or query', async () => {
    const customFacets = [
      {
        id: 'region',
        title: 'Region',
        options: [
          { label: 'Africa', value: 'africa', query: 'field_region:1' },
          { label: 'Asia', query: 'field_region:2' },
        ],
      },
      {
        id: 'series',
        title: 'Series',
        multiSelect: true,
        options: [
          { label: 'Reports', value: 'reports', query: 'series:1' },
          { label: 'Briefs', value: 'briefs', query: 'series:2' },
        ],
      },
    ];
    render(<SyndicationSearchWidget config={{ ...CONFIG, customFacets }} />);
    const region = await control('[data-custom-facet="region"]');
    await choose(region, 'Africa');
    await choose(region, 'Asia');
    const series = await control('[data-custom-facet="series"]');
    await choose(series, 'Reports');
    await choose(series, 'Briefs');
    await choose(series, 'Reports');
    const custom = (key, action, changed, values) => ({
      region: 'undrr-search-facets',
      kind: 'custom',
      key,
      action,
      changed,
      values,
      operator: null,
    });
    expect(details()).toEqual([
      custom('region', 'select', ['africa'], ['africa']),
      custom('region', 'select', ['1'], ['1']),
      custom('series', 'select', ['reports'], ['reports']),
      custom('series', 'select', ['briefs'], ['reports', 'briefs']),
      custom('series', 'clear', ['reports'], ['briefs']),
    ]);
    expect(events[0].target).toBe(region);
    expect(JSON.stringify(details())).not.toMatch(/Africa|Asia|field_region/);

    events.length = 0;
    await waitFor(() => expect(chips()).toHaveLength(2));
    fireEvent.click(chips()[0]);
    expect(details()).toEqual([custom('region', 'clear', ['1'], [])]);
  });

  it('reports a result tab change once and only when the tab changes', async () => {
    const period = {
      id: 'event-status',
      title: 'Event period',
      display: 'tabs',
      defaultValue: '0',
      options: [
        { label: 'Upcoming', value: 'upcoming', query: 'event_end:[now TO *]' },
        { label: 'Previous', value: 'past', query: 'event_end:[* TO now}' },
      ],
    };
    render(
      <SyndicationSearchWidget
        config={{ ...CONFIG, showFacets: false, customFacets: [period] }}
      />
    );
    await waitFor(() => expect(searches()).toBe(1));
    expect(events).toEqual([]);
    fireEvent.click(screen.getByRole('radio', { name: 'Previous' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Previous' }));
    expect(events).toHaveLength(1);
    expect(events[0].bubbles).toBe(true);
    expect(events[0].target).toHaveClass('mg-search__scope-tabs');
    expect(events[0].detail).toEqual({
      region: 'undrr-search-facets',
      kind: 'tab',
      key: 'event-status',
      action: 'select',
      changed: ['past'],
      values: ['past'],
      operator: null,
    });
  });

  it('reports a sort change once and ignores the current order', async () => {
    render(<SyndicationSearchWidget config={CONFIG} />);
    const sort = await control('.mg-search__sort');
    await choose(sort, 'Newest');
    await choose(sort, 'Newest');
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('mg-search:sort-change');
    expect(events[0].bubbles).toBe(true);
    expect(events[0].target).toBe(sort);
    expect(events[0].detail).toEqual({
      region: 'undrr-search-facets',
      sort: 'newest',
    });
  });

  it('emits once under StrictMode', async () => {
    render(
      <StrictMode>
        <SyndicationSearchWidget config={CONFIG} />
      </StrictMode>
    );
    await choose(await facet('field_hazard'), 'Flood');
    await choose(await control('.mg-search__sort'), 'Oldest');
    expect(events.map(event => event.type)).toEqual([
      'mg-search:filter-change',
      'mg-search:sort-change',
    ]);
  });
});

describe('state the visitor did not change', () => {
  it('restores filters and sort from the URL without events', async () => {
    window.history.replaceState(
      null,
      '',
      '/search#f.field_hazard=12&f.year=2024&sort=newest'
    );
    render(
      <SyndicationSearchWidget config={{ ...CONFIG, enableHashSync: true }} />
    );
    const hazard = await facet('field_hazard');
    await waitFor(() =>
      expect(hazard.querySelector('.mg-select__trigger')).toHaveTextContent(
        'Flood'
      )
    );
    expect(events).toEqual([]);

    await act(async () => {
      window.history.replaceState(null, '', '/search#f.field_hazard=34');
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    await waitFor(() =>
      expect(hazard.querySelector('.mg-select__trigger')).toHaveTextContent(
        'Drought'
      )
    );
    expect(events).toEqual([]);
  });

  it('applies configuration edits without events', async () => {
    const view = render(<SyndicationSearchWidget config={CONFIG} />);
    await facet('field_hazard');
    const edit = async change => {
      const before = searches();
      view.rerender(
        <SyndicationSearchWidget config={{ ...CONFIG, ...change }} />
      );
      await waitFor(() => expect(searches()).toBeGreaterThan(before));
    };
    await edit({ defaultFilters: [{ key: 'field_hazard', value: '34' }] });
    await edit({ defaultSort: 'oldest' });
    await edit({ defaultSort: 'newest', showSort: false });
    await edit({
      customFilters: ['type:news'],
      visibleFilters: { year: false },
    });
    expect(events).toEqual([]);
  });

  it('ignores programmatic dispatches', async () => {
    function Programmatic() {
      const dispatch = useSearchDispatch();
      return (
        <button
          type="button"
          onClick={() => {
            dispatch(actions.setFacet('field_hazard', ['12']));
            dispatch(actions.setSort('oldest'));
            dispatch(actions.clearFacets());
            dispatch(actions.reset());
          }}
        >
          Run
        </button>
      );
    }
    render(
      <SearchProvider config={CONFIG}>
        <Programmatic />
        <SortOptions />
      </SearchProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(events).toEqual([]);
  });
});

describe('several widgets on a page', () => {
  it('names the widget the change came from', async () => {
    render(
      <>
        <section id="first">
          <SyndicationSearchWidget
            config={{ ...CONFIG, analyticsRegionPrefix: 'collection-content' }}
          />
        </section>
        <section id="second">
          <SyndicationSearchWidget
            config={{ ...CONFIG, analyticsRegionPrefix: 'collection-related' }}
          />
        </section>
      </>
    );
    await choose(await facet('field_hazard', `#second ${SIDEBAR}`), 'Flood');
    await choose(
      await control('.mg-search__sort', `#first ${SIDEBAR}`),
      'Oldest'
    );
    expect(details()).toEqual([
      expect.objectContaining({
        region: 'collection-related-facets',
        key: 'field_hazard',
      }),
      { region: 'collection-content-facets', sort: 'oldest' },
    ]);
  });

  it('reports one change from shared controls, not one per grouped display', async () => {
    const sharedControls = {
      id: 'events-group',
      visibleFilters: Object.fromEntries(
        FACET_FIELDS.map(field => [field.key, field.key === 'field_hazard'])
      ),
      defaultFilters: [],
      defaultQuery: '',
    };
    const base = {
      ...CONFIG,
      defaultQuery: '',
      facetsTarget: '#shared-facets',
      sharedControls,
    };
    render(
      <>
        <div id="shared-facets" />
        <section id="news">
          <SyndicationSearchWidget
            config={{
              ...base,
              searchEndpoint: '/news',
              analyticsRegionPrefix: 'news',
            }}
          />
        </section>
        <section id="reports">
          <SyndicationSearchWidget
            config={{
              ...base,
              searchEndpoint: '/reports',
              analyticsRegionPrefix: 'reports',
            }}
          />
        </section>
      </>
    );
    const requests = endpoint =>
      global.fetch.mock.calls.filter(([url]) => url === endpoint).length;
    await waitFor(() => expect(requests('/reports')).toBeGreaterThan(0));
    const before = [requests('/news'), requests('/reports')];
    const hazard = await facet('field_hazard', '#shared-facets');
    expect(
      document.querySelectorAll('#shared-facets [data-facet-key]')
    ).toHaveLength(1);
    const heard = jest.fn();
    document
      .getElementById('shared-facets')
      .addEventListener('mg-search:filter-change', heard);
    await choose(hazard, 'Flood');
    await waitFor(() => {
      expect(requests('/news')).toBeGreaterThan(before[0]);
      expect(requests('/reports')).toBeGreaterThan(before[1]);
    });
    expect(heard).toHaveBeenCalledTimes(1);
    expect(details()).toEqual([
      {
        region: 'news-facets',
        kind: 'field',
        key: 'field_hazard',
        action: 'select',
        changed: ['12'],
        values: ['12'],
        operator: 'or',
      },
    ]);

    events.length = 0;
    await choose(await control('.mg-search__sort', '#reports'), 'Oldest');
    expect(details()).toEqual([{ region: 'reports-facets', sort: 'oldest' }]);
  });
});

describe('hydrated widgets', () => {
  it('emit from the server-rendered host with its region prefix', async () => {
    document.body.innerHTML = `
      <div id="hero-facets"></div>
      <div data-mg-search-widget
        data-search-endpoint="https://example.test/search"
        data-enable-hash-sync="false"
        data-analytics-region-prefix="landing"
        data-facets-target="#hero-facets"
        data-default-filters='[{"key":"field_hazard","value":"34"}]'></div>
      <div data-mg-search-widget
        data-search-endpoint="https://example.test/other"
        data-enable-hash-sync="false"></div>`;
    let hydrator;
    await act(async () => {
      hydrator = createHydrator({
        selector: '[data-mg-search-widget]',
        component: SyndicationSearchWidget,
        fromElement,
      });
    });
    const hazard = await facet('field_hazard', '#hero-facets');
    await waitFor(() =>
      expect(hazard.querySelector('.mg-select__trigger')).toHaveTextContent(
        'Drought'
      )
    );
    expect(events).toEqual([]);

    await act(async () => {
      await choose(hazard, 'Flood');
    });
    await act(async () => {
      await choose(await control('.mg-search__sort', '#hero-facets'), 'Newest');
    });
    expect(events.every(event => event.bubbles)).toBe(true);
    expect(details()).toEqual([
      {
        region: 'landing-facets',
        kind: 'field',
        key: 'field_hazard',
        action: 'select',
        changed: ['12'],
        values: ['34', '12'],
        operator: 'or',
      },
      { region: 'landing-facets', sort: 'newest' },
    ]);
    await act(async () => {
      hydrator.unmountAll();
    });
  });
});
