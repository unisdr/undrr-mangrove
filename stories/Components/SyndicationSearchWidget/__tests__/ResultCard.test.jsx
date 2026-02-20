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
    it('renders the title as a link', () => {
      render(<ResultCard hit={createHit()} />);

      const link = screen.getByRole('link', { name: 'Climate Change Report' });
      expect(link).toBeInTheDocument();
    });

    it('renders the content type badge', () => {
      render(<ResultCard hit={createHit({ type: 'news' })} />);

      expect(screen.getByText('News')).toBeInTheDocument();
    });

    it('renders the formatted date', () => {
      render(<ResultCard hit={createHit()} />);

      const time = screen.getByText('Jun 15, 2024');
      expect(time).toBeInTheDocument();
      expect(time.closest('time')).toHaveAttribute('datetime', '2024-06-15T10:00:00Z');
    });

    it('renders the domain label', () => {
      render(<ResultCard hit={createHit()} />);

      expect(screen.getByText('UNDRR.org')).toBeInTheDocument();
    });

    it('renders highlighted body with <em> preserved', () => {
      const hit = {
        ...createHit(),
        highlight: {
          body: ['...the <em>climate</em> impacts are significant...'],
        },
      };
      render(<ResultCard hit={hit} />);

      const summary = screen.getByText((_, el) =>
        el.tagName === 'P' && el.textContent.includes('climate impacts'),
      );
      expect(summary.innerHTML).toContain('<em>climate</em>');
    });

    it('renders highlighted title with <em> preserved', () => {
      const hit = {
        ...createHit(),
        highlight: {
          title: ['<em>Climate</em> Change Report'],
        },
      };
      render(<ResultCard hit={hit} />);

      const link = screen.getByRole('link');
      expect(link.innerHTML).toContain('<em>Climate</em>');
    });
  });

  describe('URL resolution', () => {
    it('builds absolute URL from relative path', () => {
      render(<ResultCard hit={createHit({ url: '/node/123' })} />);

      const link = screen.getByRole('link');
      expect(link.href).toContain('https://www.undrr.org/node/123');
    });

    it('preserves absolute URLs', () => {
      render(<ResultCard hit={createHit({ url: 'https://example.com/page' })} />);

      const link = screen.getByRole('link');
      expect(link.href).toBe('https://example.com/page');
    });

    it('falls back to /node/{nid} when url is missing', () => {
      render(<ResultCard hit={createHit({ url: undefined })} />);

      const link = screen.getByRole('link');
      expect(link.href).toContain('/node/123');
    });
  });

  describe('card structure', () => {
    it('uses mg-card__vc for vertical variant', () => {
      render(<ResultCard hit={createHit()} />);

      const article = screen.getByRole('article');
      expect(article).toHaveClass('mg-card', 'mg-card__vc', 'mg-search__result-card');
    });

    it('uses mg-card__hc for book variant', () => {
      render(<ResultCard hit={createHit()} variant="book" />);

      const article = screen.getByRole('article');
      expect(article).toHaveClass('mg-card', 'mg-card__hc', 'mg-search__result-card');
    });

    it('defaults to vertical variant', () => {
      render(<ResultCard hit={createHit()} />);

      const article = screen.getByRole('article');
      expect(article).toHaveClass('mg-card__vc');
      expect(article).not.toHaveClass('mg-card__hc');
    });

    it('renders the title inside a <header> element', () => {
      render(<ResultCard hit={createHit()} />);

      const link = screen.getByRole('link', { name: 'Climate Change Report' });
      expect(link.closest('header')).toBeInTheDocument();
    });

    it('sets data-result-type on the article', () => {
      render(<ResultCard hit={createHit({ type: 'event' })} />);

      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('data-result-type', 'event');
    });
  });

  describe('missing data handling', () => {
    it('renders without date when published_at is missing', () => {
      render(<ResultCard hit={createHit({ published_at: undefined })} />);

      expect(document.querySelector('time')).not.toBeInTheDocument();
    });

    it('renders without summary when no highlight available', () => {
      render(<ResultCard hit={createHit()} />);

      // No <p> inside the card content when there's no body highlight
      const article = screen.getByRole('article');
      expect(article.querySelector('p')).not.toBeInTheDocument();
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

  describe('DOMPurify sanitization', () => {
    it('strips script tags from highlighted title', () => {
      const hit = {
        ...createHit(),
        highlight: {
          title: ['<em>Climate</em><script>alert("xss")</script> Report'],
        },
      };
      render(<ResultCard hit={hit} />);

      const link = screen.getByRole('link');
      expect(link.innerHTML).toContain('<em>Climate</em>');
      expect(link.innerHTML).not.toContain('<script>');
    });

    it('strips event handlers from highlighted body', () => {
      const hit = {
        ...createHit(),
        highlight: {
          body: ['Safe text <img src=x onerror=alert(1)> here'],
        },
      };
      render(<ResultCard hit={hit} />);

      const summary = screen.getByText((_, el) =>
        el.tagName === 'P' && el.textContent.includes('Safe text'),
      );
      expect(summary.innerHTML).toContain('Safe text');
      expect(summary.innerHTML).not.toContain('onerror');
    });
  });
});
