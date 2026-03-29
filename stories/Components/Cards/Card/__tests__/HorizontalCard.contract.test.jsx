import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createAjv } from '../../../../../schemas/ajv-setup.js';
import cardSchema from '../../../../../schemas/dist/card.schema.json';
import { HorizontalCard } from '../HorizontalCard';

describe('HorizontalCard contract', () => {
  const validate = createAjv().compile(cardSchema);

  it('minimal fixture validates against card schema', () => {
    const fixture = { items: [{ title: 'Test card' }] };
    expect(validate(fixture)).toBe(true);
  });

  it('renders schema-valid minimal fixture', () => {
    render(<HorizontalCard items={[{ title: 'Test card' }]} />);
    expect(screen.getByText('Test card')).toBeInTheDocument();
  });

  it('full fixture validates against card schema', () => {
    const fixture = {
      items: [
        {
          title: 'Card title',
          image: { src: 'https://example.com/img.jpg', alt: 'Example image' },
          labels: ['Category', 'Tag'],
          summary: 'Body text',
          link: 'https://example.com',
        },
      ],
    };
    expect(validate(fixture)).toBe(true);
  });

  it('renders full fixture with image, labels, summary, link, and button', async () => {
    const fixture = {
      items: [
        {
          title: 'Card title',
          image: { src: 'https://example.com/img.jpg', alt: 'Example image' },
          labels: ['Category', 'Tag'],
          summary: 'Body text',
          link: 'https://example.com',
          button: 'Read more',
        },
      ],
    };
    const { container } = render(<HorizontalCard {...fixture} />);
    expect(screen.getByText('Card title')).toBeInTheDocument();
    expect(screen.getByAltText('Example image')).toBeInTheDocument();
    expect(screen.getByText('Body text')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('does not render an image element when image is absent', () => {
    render(<HorizontalCard items={[{ title: 'No image card' }]} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders all items when items array has multiple entries', () => {
    const fixture = {
      items: [
        { title: 'First card' },
        { title: 'Second card' },
      ],
    };
    expect(validate(fixture)).toBe(true);
    render(<HorizontalCard {...fixture} />);
    expect(screen.getByText('First card')).toBeInTheDocument();
    expect(screen.getByText('Second card')).toBeInTheDocument();
  });
});
