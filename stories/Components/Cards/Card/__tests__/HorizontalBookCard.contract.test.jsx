import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createAjv } from '../../../../../schemas/ajv-setup.js';
import cardSchema from '../../../../../schemas/dist/card.schema.json';
import { HorizontalBookCard } from '../HorizontalBookCard';

describe('HorizontalBookCard contract', () => {
  const validate = createAjv().compile(cardSchema);

  it('minimal fixture validates against card schema', () => {
    const fixture = { items: [{ title: 'Test book' }] };
    expect(validate(fixture)).toBe(true);
  });

  it('renders schema-valid minimal fixture', () => {
    render(<HorizontalBookCard items={[{ title: 'Test book' }]} />);
    expect(screen.getByText('Test book')).toBeInTheDocument();
  });

  it('fixture with image, labels, and summary validates against card schema', () => {
    const fixture = {
      items: [
        {
          title: 'Publication title',
          image: { src: 'https://example.com/cover.jpg', alt: 'Publication cover' },
          labels: ['Report', '2024'],
          summary: 'A comprehensive report on disaster risk.',
          link: 'https://example.com/publication',
        },
      ],
    };
    expect(validate(fixture)).toBe(true);
  });

  it('renders fixture with image, labels, summary, and button', async () => {
    const fixture = {
      items: [
        {
          title: 'Publication title',
          image: { src: 'https://example.com/cover.jpg', alt: 'Publication cover' },
          labels: ['Report', '2024'],
          summary: 'A comprehensive report on disaster risk.',
          link: 'https://example.com/publication',
          button: 'Download',
        },
      ],
    };
    const { container } = render(<HorizontalBookCard {...fixture} />);
    expect(screen.getByText('Publication title')).toBeInTheDocument();
    expect(screen.getByAltText('Publication cover')).toBeInTheDocument();
    expect(screen.getByText('A comprehensive report on disaster risk.')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
