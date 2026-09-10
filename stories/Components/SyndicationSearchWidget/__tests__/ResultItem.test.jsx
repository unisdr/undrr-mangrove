/**
 * @file ResultItem.test.jsx
 * @description Tests for the ResultItem component and swapCardVariant helper.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  ResultItem,
  swapCardVariant,
  stripHiddenTeaserFields,
} from '../components/ResultItem';

// Sample teaser HTML mimicking Elasticsearch output
const TEASER_HC = [
  '<div class="mg-card mg-card__hc mg-card-book__hc">',
  '<div class="mg-card__visual"><a href="/node/1"><img src="/image.jpg" alt="Cover" /></a></div>',
  '<div class="mg-card__content">',
  '<div class="field field--name-node-title"><a href="/node/1">Title</a></div>',
  '<div class="mg-card__date">15 Jun 2024</div>',
  '<div class="mg-card__description">Description summary text</div>',
  '</div>',
  '</div>',
].join('');

const TEASER_VC = [
  '<div class="mg-card mg-card__vc">',
  '<div class="field field--name-node-title"><a href="/node/2">Title</a></div>',
  '</div>',
].join('');

// Sample ES hit for testing
const createHit = (overrides = {}) => ({
  _id: 'test-1',
  _score: 8.5,
  _source: {
    nid: '123',
    title: 'Climate Change Report',
    url: '/node/123',
    type: 'publication',
    field_domain_access: ['www_undrr_org'],
    published_at: '2024-06-15T10:00:00Z',
    teaser: TEASER_HC,
    ...overrides,
  },
  highlight: {},
});

describe('swapCardVariant', () => {
  it('returns html unchanged for list mode', () => {
    expect(swapCardVariant(TEASER_HC, 'list')).toBe(TEASER_HC);
  });

  it('returns null/undefined unchanged', () => {
    expect(swapCardVariant(null, 'card')).toBeNull();
    expect(swapCardVariant(undefined, 'card')).toBeUndefined();
  });

  it('swaps hc classes to vc for card mode', () => {
    const result = swapCardVariant(TEASER_HC, 'card');
    expect(result).toContain('mg-card__vc');
    expect(result).not.toContain('mg-card__hc');
    expect(result).not.toContain('mg-card-book__hc');
  });

  it('swaps vc class to vc + book for card-book mode', () => {
    const result = swapCardVariant(TEASER_VC, 'card-book');
    expect(result).toContain('mg-card__vc');
    expect(result).toContain('mg-card__book');
    expect(result).not.toContain('mg-card__hc');
  });

  it('swaps hc classes to vc + book for card-book mode', () => {
    const result = swapCardVariant(TEASER_HC, 'card-book');
    expect(result).toContain('mg-card__vc');
    expect(result).toContain('mg-card__book');
    expect(result).not.toContain('mg-card__hc');
    expect(result).not.toContain('mg-card-book__hc');
  });

  it('preserves non-variant classes', () => {
    const result = swapCardVariant(TEASER_HC, 'card');
    expect(result).toContain('mg-card');
  });

  it('rewrites Drupal image style to portrait for card-book mode', () => {
    const html =
      '<img src="https://www.undrr.org/sites/default/files/styles/landscape_16_9/public/2023-06/photo.jpg?itok=abc">';
    const result = swapCardVariant(html, 'card-book');
    expect(result).toContain('/styles/por/public/');
    expect(result).not.toContain('landscape_16_9');
  });

  it('rewrites Drupal image style to landscape for card mode', () => {
    const html =
      '<img src="https://www.undrr.org/sites/default/files/styles/por/public/2023-06/photo.jpg?itok=abc">';
    const result = swapCardVariant(html, 'card');
    expect(result).toContain('/styles/landscape_16_9/public/');
    expect(result).not.toContain('/styles/por/');
  });
});

describe('stripHiddenTeaserFields', () => {
  it('returns html unchanged when visibleTeaserFields is null or empty', () => {
    expect(stripHiddenTeaserFields(TEASER_HC, null)).toBe(TEASER_HC);
    expect(stripHiddenTeaserFields(TEASER_HC, {})).toBe(TEASER_HC);
  });

  it('removes elements matching hidden field selectors', () => {
    const result = stripHiddenTeaserFields(TEASER_HC, {
      image: false,
      summary: false,
    });
    expect(result).not.toContain('mg-card__visual');
    expect(result).not.toContain('mg-card__description');
    expect(result).toContain('mg-card__date');
  });
});

describe('ResultItem', () => {
  it('renders teaser HTML with card class swap for card mode', () => {
    render(<ResultItem hit={createHit()} displayMode="card" />);

    const wrapper = screen.getByRole('article');
    const inner = wrapper.querySelector('[class*="mg-card"]');
    expect(inner.className).toContain('mg-card__vc');
    expect(inner.className).not.toContain('mg-card__hc');
  });

  it('renders teaser HTML with vertical book classes for card-book mode', () => {
    render(<ResultItem hit={createHit()} displayMode="card-book" />);

    const wrapper = screen.getByRole('article');
    const inner = wrapper.querySelector('[class*="mg-card"]');
    expect(inner.className).toContain('mg-card__vc');
    expect(inner.className).toContain('mg-card__book');
    expect(inner.className).not.toContain('mg-card__hc');
  });

  it('leaves teaser HTML unchanged for list mode', () => {
    render(<ResultItem hit={createHit()} displayMode="list" />);

    const wrapper = screen.getByRole('article');
    const inner = wrapper.querySelector('[class*="mg-card"]');
    // Original teaser has hc classes, should remain
    expect(inner.className).toContain('mg-card__hc');
    expect(inner.className).toContain('mg-card-book__hc');
  });

  it('defaults to list display mode', () => {
    render(<ResultItem hit={createHit()} />);

    const wrapper = screen.getByRole('article');
    const inner = wrapper.querySelector('[class*="mg-card"]');
    // Default list mode: original teaser classes preserved
    expect(inner.className).toContain('mg-card__hc');
  });

  it('injects domain label into teaser HTML', () => {
    render(<ResultItem hit={createHit()} />);

    expect(screen.getByText('www.undrr.org')).toBeInTheDocument();
  });

  it('strips hidden fields programmatically from teaser HTML when visibleTeaserFields is passed', () => {
    render(
      <ResultItem
        hit={createHit()}
        visibleTeaserFields={{ image: false, summary: false, date: false }}
      />
    );

    const wrapper = screen.getByRole('article');
    expect(wrapper.querySelector('.mg-card__visual')).toBeNull();
    expect(wrapper.querySelector('.mg-card__description')).toBeNull();
    expect(wrapper.querySelector('.mg-card__date')).toBeNull();
  });

  it('renders fallback mode respecting visibleTeaserFields', () => {
    const hitWithoutTeaser = createHit({
      teaser: null,
      published_at: '2024-06-15T10:00:00Z',
    });

    render(
      <ResultItem
        hit={hitWithoutTeaser}
        visibleTeaserFields={{ date: false, siteName: false }}
      />
    );

    expect(screen.queryByText('15 Jun 2024')).toBeNull();
    expect(screen.queryByText('UNDRR.org')).toBeNull();
  });

  it('renders error state when domain is missing', () => {
    render(<ResultItem hit={createHit({ field_domain_access: undefined })} />);

    expect(screen.getByText(/currently unavailable/)).toBeInTheDocument();
  });

  it('routes organization results through PreventionWeb regardless of field_domain_access', () => {
    // Organizations are indexed against every domain; field_domain_access[0]
    // is arbitrary (often alphabetically first, e.g. AFRP). Organizations are
    // served authoritatively only through PreventionWeb. See undrr/web-backlog#2906.
    const orgTeaser = [
      '<div class="mg-card mg-card__hc">',
      '<div class="field field--name-node-title"><a href="/node/456">Org</a></div>',
      '</div>',
    ].join('');
    render(
      <ResultItem
        hit={createHit({
          type: 'organization',
          field_domain_access: ['afrp_undrr_org'],
          teaser: orgTeaser,
        })}
      />
    );

    const link = screen.getByRole('link', { name: 'Org' });
    expect(link.getAttribute('href')).toBe(
      'https://www.preventionweb.net/node/456'
    );
  });
});
