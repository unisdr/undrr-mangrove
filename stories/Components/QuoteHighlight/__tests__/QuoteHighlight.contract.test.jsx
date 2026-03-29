import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createAjv } from '../../../../schemas/ajv-setup.js';
import quoteSchema from '../../../../schemas/dist/quote.schema.json';
import QuoteHighlight from '../QuoteHighlight';

describe('QuoteHighlight contract', () => {
  const validate = createAjv().compile(quoteSchema);

  it('minimal fixture validates against quote schema', () => {
    const fixture = { quote: 'Building resilience saves lives.' };
    expect(validate(fixture)).toBe(true);
  });

  it('renders schema-valid minimal fixture', () => {
    render(<QuoteHighlight quote="Building resilience saves lives." />);
    expect(screen.getByText('Building resilience saves lives.')).toBeInTheDocument();
  });

  it('full fixture validates against quote schema', () => {
    const fixture = {
      quote: 'We must act now to reduce disaster risk.',
      attribution: 'Mami Mizutori',
      image: { src: 'https://example.com/portrait.jpg', alt: 'Mami Mizutori portrait' },
      backgroundColor: 'dark',
    };
    expect(validate(fixture)).toBe(true);
  });

  it('renders full fixture with attribution and image', async () => {
    const fixture = {
      quote: 'We must act now to reduce disaster risk.',
      attribution: 'Mami Mizutori',
      image: { src: 'https://example.com/portrait.jpg', alt: 'Mami Mizutori portrait' },
      backgroundColor: 'dark',
    };
    const { container } = render(<QuoteHighlight {...fixture} />);
    expect(screen.getByText('We must act now to reduce disaster risk.')).toBeInTheDocument();
    expect(screen.getByText('Mami Mizutori')).toBeInTheDocument();
    expect(screen.getByAltText('Mami Mizutori portrait')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders quote text inside a blockquote', () => {
    const { container } = render(
      <QuoteHighlight quote="Risk reduction for all." />
    );
    const blockquote = container.querySelector('blockquote');
    expect(blockquote).toBeInTheDocument();
    expect(blockquote).toHaveTextContent('Risk reduction for all.');
  });
});
