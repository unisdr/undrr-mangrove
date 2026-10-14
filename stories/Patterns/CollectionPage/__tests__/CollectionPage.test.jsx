import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { CollectionPage } from '../CollectionPage';
import { clearTaxonomyCache } from '../../../Components/SyndicationSearchWidget/hooks/useTaxonomies';

// Observers record their instances so a test can report a section in view.
let observers;
class RecordingObserver {
  constructor(callback, options = {}) {
    this.callback = callback;
    this.options = options;
    this.targets = [];
    observers.push(this);
  }
  observe(target) {
    this.targets.push(target);
  }
  unobserve() {}
  disconnect() {}
}

const filtersOf = body =>
  (
    body.query?.function_score?.query?.bool?.filter ||
    body.query?.bool?.filter ||
    []
  )
    .map(clause => clause.query_string?.query)
    .filter(Boolean);

let requests;
let respond;

const reply = body => ({ ok: true, json: () => Promise.resolve(body) });
const hits = (total, sources = []) => ({
  hits: {
    total: { value: total, relation: 'eq' },
    hits: sources.map((source, i) => ({ _id: String(i), _source: source })),
  },
  aggregations: {},
});

// Default endpoint: 36 items, newest 11 November 2025; the ranking finds two
// related collections, which the related widget then lists. `published_at`
// is in the index's own shape: Unix seconds wrapped in an array.
const defaults = ({ body, filters }) => {
  if (body._source?.includes('nid')) {
    return reply(hits(2, [{ nid: [98866] }, { nid: [92055] }]));
  }
  if (body._source?.includes('published_at')) {
    return reply(hits(36, [{ published_at: [1762851600] }]));
  }
  if (filters.some(filter => filter.startsWith('nid:('))) {
    return reply(
      hits(2, [
        { nid: 98866, title: 'Controlled burning', url: '/a' },
        { nid: 92055, title: 'USA: Los Angeles fires 2025', url: '/b' },
      ])
    );
  }
  return reply(hits(36));
};

beforeEach(() => {
  observers = [];
  global.IntersectionObserver = RecordingObserver;
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  requests = [];
  respond = defaults;
  clearTaxonomyCache();
  window.history.replaceState(null, '', '/');
  global.fetch = jest.fn((url, options = {}) => {
    if (!options.body) return Promise.resolve(reply({ results: [] }));
    const body = JSON.parse(options.body);
    const request = { body, filters: filtersOf(body) };
    requests.push(request);
    return Promise.resolve(respond(request));
  });
});

const countRequest = () =>
  requests.find(request => request.body._source?.includes('published_at'));
const rankingRequest = () =>
  requests.find(request => request.body._source?.includes('nid'));

const facts = () =>
  document.querySelector('header .mg-hero__label.detail')?.textContent ?? '';
const waitForFacts = pattern => waitFor(() => expect(facts()).toMatch(pattern));

const renderPage = props =>
  render(<CollectionPage id="demo" syncUrl={false} {...props} />);

test('orients the reader: breadcrumb, type, one h1, a linked count and the newest item', async () => {
  renderPage();
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  const crumbs = screen.getByRole('navigation', { name: 'Breadcrumbs' });
  expect(
    within(crumbs).getByRole('link', { name: 'Collections' })
  ).toHaveAttribute('href', 'https://www.preventionweb.net/collections');
  expect(within(crumbs).getByText('Wildfire risk assessment')).toHaveAttribute(
    'aria-current',
    'page'
  );
  const hero = document.querySelector('header .mg-hero');
  expect(hero).toHaveClass('mg-hero--split', 'mg-hero--neutral');
  expect(hero.querySelector('.mg-hero__label')).toHaveTextContent(
    'Topic guide'
  );
  await waitForFacts(/^36 items · Latest item: 11 November 2025$/);
  expect(within(hero).getByText('11 November 2025')).toHaveAttribute(
    'datetime',
    '2025-11-11'
  );
  const count = within(hero).getByRole('link', { name: '36 items' });
  expect(count).toHaveAttribute('href', '#demo-items');
  expect(count).toHaveAttribute(
    'data-vf-analytics-label',
    'Collection: item count'
  );
  expect(within(hero).queryByRole('link', { name: /Browse/ })).toBeNull();
  expect(within(hero).getByRole('list', { name: 'Topics' })).toContainElement(
    screen.getByRole('link', { name: 'Wildfire and Bushfire' })
  );
});

test.each([
  ['an ISO string', '2025-11-11T09:00:00Z', /Latest item: 11 November 2025$/],
  ['milliseconds', 1762851600000, /Latest item: 11 November 2025$/],
])('reads the newest date given as %s', async (_label, value, pattern) => {
  respond = request =>
    request.body._source?.includes('published_at')
      ? reply(hits(36, [{ published_at: value }]))
      : defaults(request);
  renderPage();
  await waitForFacts(pattern);
});

test('leaves the date out when the newest item has no usable date', async () => {
  respond = request =>
    request.body._source?.includes('published_at')
      ? reply(hits(36, [{ published_at: ['not a date'] }]))
      : defaults(request);
  renderPage();
  await waitForFacts(/^36 items$/);
});

test('counts and dates with the list’s own filters, in one query', async () => {
  renderPage();
  await waitForFacts(/36 items/);
  await waitFor(() =>
    expect(
      requests.some(
        request =>
          request.body.size !== 0 &&
          !request.body._source &&
          request.filters.includes('field_collections:101264')
      )
    ).toBe(true)
  );
  const list = requests.find(
    request =>
      !request.body._source &&
      request.filters.includes('field_collections:101264')
  );
  const count = countRequest();
  expect(count.filters).toEqual(list.filters);
  expect(count.body).toEqual(
    expect.objectContaining({
      size: 1,
      track_total_hits: true,
      sort: [{ published_at: { order: 'desc' } }],
    })
  );
});

test('does not mount the list until the count is known', async () => {
  let release;
  respond = request =>
    request.body._source?.includes('published_at')
      ? new Promise(resolve => {
          release = () => resolve(reply(hits(36, [])));
        })
      : defaults(request);
  renderPage();
  const list = screen.getByRole('region', { name: 'In this collection' });
  expect(within(list).queryByRole('searchbox')).toBeNull();
  expect(screen.getByText('Counting items…')).toBeInTheDocument();
  await act(async () => release());
  expect(await within(list).findByRole('searchbox')).toBeInTheDocument();
});

test('a count that resolves to zero shows the empty state and an unlinked count', async () => {
  respond = request =>
    request.body._source?.includes('published_at')
      ? reply(hits(0))
      : defaults(request);
  renderPage({ collection: 'empty' });
  const list = screen.getByRole('region', { name: 'In this collection' });
  expect(
    await within(list).findByRole('heading', {
      level: 3,
      name: 'Nothing has been added to this collection yet',
    })
  ).toBeVisible();
  expect(
    within(list).getByText(
      'Items added to this collection will be listed here.'
    )
  ).toBeInTheDocument();
  expect(within(list).queryByRole('searchbox')).toBeNull();
  const hero = document.querySelector('header .mg-hero');
  expect(within(hero).getByText('No items yet').tagName).not.toBe('A');
  expect(within(hero).queryByRole('link', { name: /items/ })).toBeNull();
  // Related collections exist, so the full listing is not offered as well.
  await screen.findByRole('region', { name: 'Related collections' });
  expect(
    within(list).queryByRole('link', { name: 'Browse all collections' })
  ).toBeNull();
});

test('offers the full listing, as a secondary button, when nothing is related either', async () => {
  respond = request => {
    if (request.body._source?.includes('nid')) return reply(hits(0));
    if (request.body._source?.includes('published_at')) return reply(hits(0));
    return defaults(request);
  };
  renderPage({ collection: 'empty' });
  const cta = await screen.findByRole('link', {
    name: 'Browse all collections',
  });
  expect(cta).toHaveClass('mg-button-secondary');
});

test.each([
  ['a 403', () => Promise.resolve({ ok: false, status: 403 })],
  ['a network error', () => Promise.reject(new TypeError('Failed to fetch'))],
])('when counting fails with %s, the list still shows', async (_name, fail) => {
  respond = request =>
    request.body._source?.includes('published_at') ? fail() : defaults(request);
  renderPage();
  const list = screen.getByRole('region', { name: 'In this collection' });
  expect(await within(list).findByRole('searchbox')).toBeInTheDocument();
  expect(screen.queryByText('Counting items…')).toBeNull();
  expect(screen.queryByRole('link', { name: /items/ })).toBeNull();
});

test('gives up counting after the timeout', async () => {
  jest.useFakeTimers();
  try {
    respond = request =>
      request.body._source?.includes('published_at')
        ? new Promise(() => {})
        : defaults(request);
    global.fetch.mockImplementation((url, options = {}) => {
      if (!options.body) return Promise.resolve(reply({ results: [] }));
      const body = JSON.parse(options.body);
      const request = { body, filters: filtersOf(body) };
      requests.push(request);
      if (body._source?.includes('published_at')) {
        return new Promise((resolve, reject) =>
          options.signal.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError'))
          )
        );
      }
      return Promise.resolve(defaults(request));
    });
    renderPage();
    expect(screen.getByText('Counting items…')).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(8000);
    });
    expect(screen.queryByText('Counting items…')).toBeNull();
  } finally {
    jest.useRealTimers();
  }
});

test('ranks related collections hazard first, country next, then specific themes', async () => {
  renderPage({ collection: 'jasper' });
  await screen.findByRole('region', { name: 'Related collections' });
  const { body, filters } = rankingRequest();
  expect(filters).toEqual(
    expect.arrayContaining([
      'type:collections',
      'NOT nid:101346',
      '_language:en',
      // Preparedness is too broad; Risk identification and assessment counts.
      'field_hazard:(357) OR field_theme:(333)',
    ])
  );
  expect(body.query.bool.should).toEqual([
    expect.objectContaining({
      constant_score: expect.objectContaining({ boost: 100 }),
    }),
    expect.objectContaining({
      constant_score: {
        filter: { query_string: { query: 'field_country_region:(110)' } },
        boost: 10,
      },
    }),
  ]);
  expect(body.track_total_hits).toBe(true);
  await waitFor(() =>
    expect(
      requests.find(request =>
        request.filters.some(filter => filter.startsWith('nid:('))
      )?.filters
    ).toContain('nid:(98866 OR 92055)')
  );
});

test('leaves out only the broad themes, and skips the ranking with nothing to relate on', async () => {
  renderPage();
  await screen.findByRole('region', { name: 'Related collections' });
  // Climate change (311) is left out; the other two themes count.
  expect(rankingRequest().filters).toContain(
    'field_hazard:(357) OR field_theme:(1176 OR 333)'
  );
  requests = [];
  document.body.innerHTML = '';
  renderPage({ collection: 'planned' });
  await waitForFacts(/36 items/);
  expect(rankingRequest()).toBeUndefined();
  expect(
    screen.queryByRole('region', { name: 'Related collections' })
  ).toBeNull();
});

test('the On this page bar links every section with full headings, updated in place', async () => {
  let releaseRanking;
  respond = request =>
    request.body._source?.includes('nid')
      ? new Promise(resolve => {
          releaseRanking = () => resolve(reply(hits(1, [{ nid: [98866] }])));
        })
      : defaults(request);
  renderPage();
  const nav = screen.getByRole('navigation', { name: 'On this page' });
  expect(nav).toHaveClass('mg-on-this-page-nav--align-container');
  expect(nav.previousElementSibling).toHaveAttribute(
    'data-vf-google-analytics-region',
    'collection-header'
  );
  const texts = () =>
    within(nav)
      .getAllByRole('link')
      .map(link => link.textContent);
  expect(texts()).toEqual(['About this collection', 'In this collection']);
  await act(async () => releaseRanking());
  await screen.findByRole('region', { name: 'Related collections' });
  // Same element: updated in place, not remounted.
  expect(screen.getByRole('navigation', { name: 'On this page' })).toBe(nav);
  expect(texts()).toEqual([
    'About this collection',
    'In this collection',
    'Related collections',
  ]);
  const links = within(nav).getAllByRole('link');
  for (const link of links) {
    expect(document.getElementById(link.hash.slice(1)).tagName).toBe('SECTION');
  }
  expect(links.map(link => link.dataset.vfAnalyticsLabel)).toEqual([
    'On this page: About this collection',
    'On this page: In this collection',
    'On this page: Related collections',
  ]);
  expect(links[0]).toHaveAttribute('aria-current', 'true');
});

test('drops related collections and their link when the list comes back empty', async () => {
  respond = request =>
    request.filters.some(filter => filter.startsWith('nid:('))
      ? reply(hits(0))
      : defaults(request);
  renderPage();
  await waitFor(() =>
    expect(
      requests.some(request =>
        request.filters.some(filter => filter.startsWith('nid:('))
      )
    ).toBe(true)
  );
  await waitFor(() =>
    expect(
      screen.queryByRole('region', { name: 'Related collections' })
    ).toBeNull()
  );
  const nav = screen.getByRole('navigation', { name: 'On this page' });
  expect(within(nav).getAllByRole('link')).toHaveLength(2);
});

test('names an analytics region for each section and each widget', async () => {
  const { container } = renderPage();
  await screen.findByRole('region', { name: 'Related collections' });
  const regionOf = name =>
    screen
      .getByRole('region', { name })
      .getAttribute('data-vf-google-analytics-region');
  expect(regionOf('About this collection')).toBe('collection-about');
  expect(regionOf('In this collection')).toBe('collection-content');
  expect(regionOf('Related collections')).toBe('collection-related');
  await waitFor(() => {
    const regions = [
      ...container.querySelectorAll('[data-vf-google-analytics-region]'),
    ].map(el => el.getAttribute('data-vf-google-analytics-region'));
    expect(regions).toEqual(
      expect.arrayContaining([
        'on-this-page-nav',
        'collection-content-form',
        'collection-content-results',
        'collection-related-results',
      ])
    );
    expect(regions.some(name => name.startsWith('undrr-search'))).toBe(false);
  });
});

test('wraps the description in a show-more that only collapses long bodies', () => {
  renderPage({ collection: 'japan' });
  const about = screen.getByRole('region', { name: 'About this collection' });
  const toggle = about.querySelector('[data-mg-show-more]');
  expect(toggle).toHaveAttribute('data-mg-show-more-min-hidden-lines', '6');
  expect(toggle).toHaveAttribute('aria-controls', 'demo-body');
  expect(toggle).toHaveClass('mg-button-secondary');
  expect(toggle).toHaveTextContent('Show more about this collection');
  expect(toggle).toHaveAttribute(
    'data-vf-analytics-label',
    'Collection: show more'
  );
});

test('a collection without a summary shows no standfirst', async () => {
  renderPage({ collection: 'planned' });
  const hero = document.querySelector('header .mg-hero');
  expect(hero.querySelector('.mg-hero__summaryText')).toBeNull();
  expect(within(hero).queryByRole('list', { name: 'Topics' })).toBeNull();
  await waitForFacts(/36 items/);
});

test('follows the locale toolbar direction', () => {
  const { container } = renderPage({ dir: 'rtl' });
  expect(container.firstChild).toHaveAttribute('dir', 'rtl');
});

test('has no detectable accessibility violations', async () => {
  const { container } = renderPage();
  await screen.findByRole('region', { name: 'Related collections' });
  await waitForFacts(/36 items/);
  expect(await axe(container)).toHaveNoViolations();
});
