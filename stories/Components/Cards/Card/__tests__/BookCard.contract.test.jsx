import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createAjv } from '../../../../../schemas/ajv-setup.js';
import cardSchema from '../../../../../schemas/dist/card.schema.json';
import { BookCard } from '../BookCard';

describe('BookCard contract', () => {
  const validate = createAjv().compile(cardSchema);

  it('minimal fixture validates against card schema', () => {
    const fixture = { items: [{ title: 'Test book' }] };
    expect(validate(fixture)).toBe(true);
  });

  it('renders schema-valid minimal fixture', () => {
    render(<BookCard items={[{ title: 'Test book' }]} />);
    expect(screen.getByText('Test book')).toBeInTheDocument();
  });

  it('fixture with image validates against card schema', () => {
    const fixture = {
      items: [
        {
          title: 'Book with cover',
          image: { src: 'https://example.com/cover.jpg', alt: 'Book cover' },
          link: 'https://example.com/book',
        },
      ],
    };
    expect(validate(fixture)).toBe(true);
  });

  it('renders fixture with image', async () => {
    const fixture = {
      items: [
        {
          title: 'Book with cover',
          image: { src: 'https://example.com/cover.jpg', alt: 'Book cover' },
          link: 'https://example.com/book',
        },
      ],
    };
    const { container } = render(<BookCard {...fixture} />);
    expect(screen.getByAltText('Book cover')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders title in a link when link is provided', () => {
    const fixture = {
      items: [
        {
          title: 'Linked book title',
          link: 'https://example.com/book',
        },
      ],
    };
    render(<BookCard {...fixture} />);
    const link = screen.getByRole('link', { name: 'Linked book title' });
    expect(link).toHaveAttribute('href', 'https://example.com/book');
  });
});
