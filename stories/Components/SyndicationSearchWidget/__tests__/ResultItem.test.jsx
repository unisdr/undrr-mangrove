/**
 * @file ResultItem.test.jsx
 * @description Tests for the ResultItem component and swapCardVariant helper.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ResultItem, swapCardVariant } from '../components/ResultItem';

// Sample teaser HTML mimicking Elasticsearch output
const TEASER_HC = [
  '<div class="mg-card mg-card__hc mg-card-book__hc">',
  '<div class="field field--name-node-title"><a href="/node/1">Title</a></div>',
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
    const html = '<img src="https://www.undrr.org/sites/default/files/styles/landscape_16_9/public/2023-06/photo.jpg?itok=abc">';
    const result = swapCardVariant(html, 'card-book');
    expect(result).toContain('/styles/por/public/');
    expect(result).not.toContain('landscape_16_9');
  });

  it('rewrites Drupal image style to landscape for card mode', () => {
    const html = '<img src="https://www.undrr.org/sites/default/files/styles/por/public/2023-06/photo.jpg?itok=abc">';
    const result = swapCardVariant(html, 'card');
    expect(result).toContain('/styles/landscape_16_9/public/');
    expect(result).not.toContain('/styles/por/');
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
    // Original teaser has hc classes — should remain
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

  it('renders error state when domain is missing', () => {
    render(<ResultItem hit={createHit({ field_domain_access: undefined })} />);

    expect(screen.getByText(/has no assigned domain/)).toBeInTheDocument();
  });
});
