import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createAjv } from '../../../../../schemas/ajv-setup.js';
import cardSchema from '../../../../../schemas/dist/card.schema.json';
import { IconCard } from '../IconCard';

describe('IconCard contract', () => {
  const validate = createAjv().compile(cardSchema);

  it('minimal fixture validates against card schema', () => {
    const fixture = { items: [{ title: 'Test card' }] };
    expect(validate(fixture)).toBe(true);
  });

  it('renders schema-valid minimal fixture', () => {
    render(<IconCard items={[{ title: 'Test card' }]} />);
    expect(screen.getByText('Test card')).toBeInTheDocument();
  });

  it('fixture with icon validates against card schema', () => {
    const fixture = {
      items: [
        {
          title: 'Globe card',
          icon: 'mg-icon mg-icon-globe',
          summary: 'A card with an icon.',
        },
      ],
    };
    expect(validate(fixture)).toBe(true);
  });

  it('renders fixture with icon', async () => {
    const fixture = {
      items: [
        {
          title: 'Globe card',
          icon: 'mg-icon mg-icon-globe',
          summary: 'A card with an icon.',
        },
      ],
    };
    const { container } = render(<IconCard {...fixture} />);
    expect(screen.getByText('Globe card')).toBeInTheDocument();
    expect(screen.getByText('A card with an icon.')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('fixture with image validates against card schema', () => {
    const fixture = {
      items: [
        {
          title: 'Image card',
          image: { src: 'https://example.com/icon.png', alt: 'Icon image' },
        },
      ],
    };
    expect(validate(fixture)).toBe(true);
  });

  it('renders fixture with image', () => {
    const fixture = {
      items: [
        {
          title: 'Image card',
          image: { src: 'https://example.com/icon.png', alt: 'Icon image' },
        },
      ],
    };
    render(<IconCard {...fixture} />);
    expect(screen.getByAltText('Icon image')).toBeInTheDocument();
  });

  it('fixture with labels validates against card schema', () => {
    const fixture = {
      items: [
        {
          title: 'Labelled card',
          labels: ['Category'],
        },
      ],
    };
    expect(validate(fixture)).toBe(true);
  });

  it('renders fixture with label', () => {
    render(<IconCard items={[{ title: 'Labelled card', labels: ['Category'] }]} />);
    expect(screen.getByText('Category')).toBeInTheDocument();
  });
});
