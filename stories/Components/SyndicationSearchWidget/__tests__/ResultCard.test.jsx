/**
 * @file ResultCard.test.jsx
 * @description Tests for the ResultCard component.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ResultCard } from '../components/ResultCard';

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
    ...overrides,
  },
  highlight: {},
});

describe('ResultCard', () => {
  describe('field mapping', () => {
    it('renders the title', () => {
      render(<ResultCard hit={createHit()} />);

      expect(screen.getByText('Climate Change Report')).toBeInTheDocument();
    });

    it('renders the content type badge', () => {
      render(<ResultCard hit={createHit({ type: 'news' })} />);

      expect(screen.getByText('News')).toBeInTheDocument();
    });

    it('renders the formatted date', () => {
      render(<ResultCard hit={createHit()} />);

      expect(screen.getByText('Jun 15, 2024')).toBeInTheDocument();
    });

    it('renders the domain label', () => {
      render(<ResultCard hit={createHit()} />);

      expect(screen.getByText('UNDRR.org')).toBeInTheDocument();
    });

    it('renders highlighted body text', () => {
      const hit = {
        ...createHit(),
        highlight: {
          body: ['...the <em>climate</em> impacts are significant...'],
        },
      };
      render(<ResultCard hit={hit} />);

      const summary = document.querySelector('.mg-card__summary');
      expect(summary).toBeInTheDocument();
      expect(summary.innerHTML).toContain('<em>climate</em>');
    });

    it('renders highlighted title when available', () => {
      const hit = {
        ...createHit(),
        highlight: {
          title: ['<em>Climate</em> Change Report'],
        },
      };
      render(<ResultCard hit={hit} />);

      const titleLink = document.querySelector('.mg-card__title a');
      expect(titleLink.innerHTML).toContain('<em>Climate</em>');
    });
  });

  describe('URL resolution', () => {
    it('builds absolute URL from relative path', () => {
      render(<ResultCard hit={createHit({ url: '/node/123' })} />);

      const link = document.querySelector('.mg-card__title a');
      expect(link.href).toContain('https://www.undrr.org/node/123');
    });

    it('preserves absolute URLs', () => {
      render(<ResultCard hit={createHit({ url: 'https://example.com/page' })} />);

      const link = document.querySelector('.mg-card__title a');
      expect(link.href).toBe('https://example.com/page');
    });

    it('falls back to /node/{nid} when url is missing', () => {
      render(<ResultCard hit={createHit({ url: undefined })} />);

      const link = document.querySelector('.mg-card__title a');
      expect(link.href).toContain('/node/123');
    });
  });

  describe('variant classes', () => {
    it('renders with mg-card__vc class for vertical variant', () => {
      render(<ResultCard hit={createHit()} variant="vertical" />);

      const card = document.querySelector('.mg-card__vc');
      expect(card).toBeInTheDocument();
    });

    it('renders with mg-card__book class for book variant', () => {
      render(<ResultCard hit={createHit()} variant="book" />);

      const card = document.querySelector('.mg-card__book');
      expect(card).toBeInTheDocument();
    });

    it('defaults to vertical variant', () => {
      render(<ResultCard hit={createHit()} />);

      const card = document.querySelector('.mg-card__vc');
      expect(card).toBeInTheDocument();
    });
  });

  describe('missing data handling', () => {
    it('renders without date when published_at is missing', () => {
      render(<ResultCard hit={createHit({ published_at: undefined })} />);

      const time = document.querySelector('time');
      expect(time).not.toBeInTheDocument();
    });

    it('renders without body when no highlight available', () => {
      render(<ResultCard hit={createHit()} />);

      const summary = document.querySelector('.mg-card__summary');
      expect(summary).not.toBeInTheDocument();
    });

    it('renders error state when domain is missing', () => {
      render(<ResultCard hit={createHit({ field_domain_access: undefined })} />);

      expect(screen.getByText(/has no assigned domain/)).toBeInTheDocument();
    });
  });

  describe('metrics display', () => {
    it('shows metrics when showMetrics is true', () => {
      const hit = {
        ...createHit(),
        _source: {
          ...createHit()._source,
          field_meta_interestingness: [75],
          field_meta_longevity: [90],
        },
      };
      render(<ResultCard hit={hit} showMetrics />);

      expect(screen.getByText('Score: 8.50')).toBeInTheDocument();
      expect(screen.getByText('Int: 75')).toBeInTheDocument();
      expect(screen.getByText('Long: 90')).toBeInTheDocument();
    });

    it('hides metrics when showMetrics is false', () => {
      render(<ResultCard hit={createHit()} showMetrics={false} />);

      expect(screen.queryByText(/Score:/)).not.toBeInTheDocument();
    });
  });

  describe('data-result-type attribute', () => {
    it('sets data-result-type on the article element', () => {
      render(<ResultCard hit={createHit({ type: 'event' })} />);

      const card = document.querySelector('[data-result-type="event"]');
      expect(card).toBeInTheDocument();
    });
  });
});
