import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { CollectionPage } from '../CollectionPage';
import { clearTaxonomyCache } from '../../../Components/SyndicationSearchWidget/hooks/useTaxonomies';

const noopObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const filtersOf = body =>
  (body.query?.function_score?.query?.bool?.filter || [])
    .map(clause => clause.query_string?.query)
    .filter(Boolean);

let requests;

beforeAll(() => {
  global.IntersectionObserver = noopObserver;
  global.ResizeObserver = noopObserver;
});

beforeEach(() => {
  requests = [];
  clearTaxonomyCache();
  global.fetch = jest.fn((url, options = {}) => {
    if (!options.body) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });
    }
    const body = JSON.parse(options.body);
    const filters = filtersOf(body);
    requests.push({ size: body.size, filters });
    const total = filters.includes('type:collections') ? 4 : 36;
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          hits: { hits: [], total: { value: total, relation: 'eq' } },
          aggregations: {},
          took: 5,
        }),
    });
  });
});

const countRequests = () => requests.filter(request => request.size === 0);

test('orients the reader with one h1, the collection type and a linked count', async () => {
  render(<CollectionPage id="demo" syncUrl={false} />);
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(
    screen.getByRole('heading', { level: 1, name: 'Wildfire risk assessment' })
  ).toBeVisible();
  expect(screen.getByText('Topic guide', { exact: false })).toBeVisible();
  const count = await screen.findByRole('link', { name: '36 items' });
  expect(count).toHaveAttribute('href', '#demo-items');
  expect(document.getElementById('demo-items')).toHaveAccessibleName(
    'In this collection'
  );
  expect(screen.getByText('10 July 2026')).toHaveAttribute(
    'datetime',
    '2026-07-10'
  );
  expect(
    screen.getByRole('link', { name: 'Wildfire and Bushfire' })
  ).toHaveAttribute('href', 'https://www.preventionweb.net/taxonomy/term/357');
});

test('counts with the same filters the content list uses', async () => {
  render(<CollectionPage id="demo" syncUrl={false} />);
  await screen.findByRole('link', { name: '36 items' });
  await waitFor(() =>
    expect(requests.some(request => request.size !== 0)).toBe(true)
  );
  const scoped = filters => filters.includes('field_collections:101264');
  const count = countRequests().find(request => scoped(request.filters));
  const list = requests.find(
    request => request.size !== 0 && scoped(request.filters)
  );
  expect(count.filters).toEqual(list.filters);
  expect(list.filters).toEqual(
    expect.arrayContaining(['field_collections:101264', '_language:en'])
  );
});

test('related collections share a hazard or theme and leave out this one', async () => {
  render(<CollectionPage id="demo" syncUrl={false} />);
  const related = await screen.findByRole('region', {
    name: 'Related collections',
  });
  expect(within(related).queryByRole('searchbox')).not.toBeInTheDocument();
  const relatedCount = countRequests().find(request =>
    request.filters.includes('type:collections')
  );
  expect(relatedCount.filters).toEqual([
    'type:collections',
    'field_hazard:(357) OR field_theme:(311 OR 1176 OR 333)',
    'NOT nid:101264',
    '_language:en',
  ]);
});

test('omits related collections when there are none', async () => {
  global.fetch.mockImplementation((url, options = {}) => {
    const body = options.body ? JSON.parse(options.body) : {};
    const related = filtersOf(body).includes('type:collections');
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          results: [],
          hits: { hits: [], total: { value: related ? 0 : 36 } },
          aggregations: {},
        }),
    });
  });
  render(<CollectionPage id="demo" syncUrl={false} />);
  await screen.findByRole('link', { name: '36 items' });
  expect(
    screen.queryByRole('region', { name: 'Related collections' })
  ).not.toBeInTheDocument();
  const nav = screen.getByRole('navigation', { name: 'On this page' });
  expect(
    within(nav)
      .getAllByRole('link')
      .map(link => link.textContent)
  ).toEqual(['About', 'In this collection']);
});

test('the sticky On this page bar links every section, related last', async () => {
  render(<CollectionPage id="demo" syncUrl={false} />);
  await screen.findByRole('region', { name: 'Related collections' });
  const nav = screen.getByRole('navigation', { name: 'On this page' });
  expect(nav).toHaveClass('mg-on-this-page-nav');
  expect(nav.previousElementSibling).toHaveAttribute(
    'data-vf-google-analytics-region',
    'collection-header'
  );
  const links = within(nav).getAllByRole('link');
  expect(links.map(link => link.textContent)).toEqual([
    'About',
    'In this collection',
    'Related collections',
  ]);
  for (const link of links) {
    const target = document.getElementById(link.hash.slice(1));
    expect(target.tagName).toBe('SECTION');
    expect(target).toHaveAccessibleName();
  }
  expect(links[0]).toHaveAttribute('aria-current', 'true');
  expect(links.map(link => link.dataset.vfAnalyticsLabel)).toEqual([
    'On this page: About',
    'On this page: In this collection',
    'On this page: Related collections',
  ]);
});

test('names an analytics region for each section and each widget', async () => {
  const { container } = render(<CollectionPage id="demo" syncUrl={false} />);
  await screen.findByRole('region', { name: 'Related collections' });
  const regionOf = name =>
    screen
      .getByRole('region', { name })
      .getAttribute('data-vf-google-analytics-region');
  expect(regionOf('About this collection')).toBe('collection-about');
  expect(regionOf('In this collection')).toBe('collection-content');
  expect(regionOf('Related collections')).toBe('collection-related');
  expect(
    screen
      .getByRole('navigation', { name: 'On this page' })
      .getAttribute('data-vf-google-analytics-region')
  ).toBe('on-this-page-nav');
  const regions = [
    ...container.querySelectorAll('[data-vf-google-analytics-region]'),
  ].map(el => el.getAttribute('data-vf-google-analytics-region'));
  expect(regions).toEqual(
    expect.arrayContaining([
      'collection-content-form',
      'collection-content-results',
      'collection-related-results',
    ])
  );
  expect(regions.some(name => name.startsWith('undrr-search'))).toBe(false);
  expect(screen.getByRole('link', { name: '36 items' })).toHaveAttribute(
    'data-vf-analytics-label',
    'Collection: item count'
  );
});

test('a collection with no items shows an empty state instead of the list', () => {
  render(
    <CollectionPage
      collection="empty"
      itemCount={0}
      id="demo"
      syncUrl={false}
    />
  );
  const list = screen.getByRole('region', { name: 'In this collection' });
  expect(
    within(list).getByRole('heading', {
      level: 3,
      name: 'Nothing has been added to this collection yet',
    })
  ).toBeVisible();
  expect(within(list).queryByRole('searchbox')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: '0 items' })).toBeVisible();
  expect(
    countRequests().some(request =>
      request.filters.some(filter => filter.startsWith('field_collections'))
    )
  ).toBe(false);
});

test('wraps the description in a show-more that only collapses long bodies', () => {
  render(<CollectionPage collection="japan" id="demo" syncUrl={false} />);
  const about = screen.getByRole('region', { name: 'About this collection' });
  const toggle = within(about).getByRole('button', { name: 'Show more' });
  expect(toggle).toHaveAttribute('data-mg-show-more-threshold', '320');
  expect(toggle).toHaveAttribute('aria-controls', 'demo-body');
});

test('the header is a neutral split Hero with the facts line and tags', async () => {
  const { container } = render(<CollectionPage id="demo" syncUrl={false} />);
  const hero = container.querySelector('header .mg-hero');
  expect(hero).toHaveClass('mg-hero--split', 'mg-hero--neutral');
  expect(within(hero).getByRole('heading', { level: 1 })).toHaveTextContent(
    'Wildfire risk assessment'
  );
  const count = await within(hero).findByRole('link', { name: '36 items' });
  expect(count.closest('.mg-hero__label.detail')).toBeInTheDocument();
  expect(hero.querySelector('.mg-hero__tags')).toContainElement(
    screen.getByRole('link', { name: 'Wildfire and Bushfire' })
  );
  expect(hero.querySelector('.mg-hero__media-img')).toHaveAttribute(
    'alt',
    'Aerial view of smoke rising from a fire line in a pine forest'
  );
});

test('has no detectable accessibility violations', async () => {
  const { container } = render(<CollectionPage id="demo" syncUrl={false} />);
  await screen.findByRole('link', { name: '36 items' });
  await screen.findByRole('region', { name: 'Related collections' });
  expect(await axe(container)).toHaveNoViolations();
});
