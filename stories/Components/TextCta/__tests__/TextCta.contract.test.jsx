import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createAjv } from '../../../../schemas/ajv-setup.js';
import textCtaSchema from '../../../../schemas/dist/text-cta.schema.json';
import { TextCta } from '../TextCta';

describe('TextCta contract', () => {
  const validate = createAjv().compile(textCtaSchema);

  it('empty fixture validates against text-cta schema (no required fields)', () => {
    const fixture = {};
    expect(validate(fixture)).toBe(true);
  });

  it('renders with no props without throwing', () => {
    const { container } = render(<TextCta />);
    expect(container.querySelector('section.mg-cta')).toBeInTheDocument();
  });

  it('fixture with headline and text validates against text-cta schema', () => {
    const fixture = {
      headline: 'Act now to reduce disaster risk',
      text: 'Join the global movement for resilience.',
    };
    expect(validate(fixture)).toBe(true);
  });

  it('renders headline and text', async () => {
    const { container } = render(
      <TextCta
        headline="Act now to reduce disaster risk"
        text="Join the global movement for resilience."
      />
    );
    expect(screen.getByText('Act now to reduce disaster risk')).toBeInTheDocument();
    expect(screen.getByText('Join the global movement for resilience.')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('fixture with image validates against text-cta schema', () => {
    const fixture = {
      headline: 'Banner with image',
      image: { src: 'https://example.com/banner.jpg', alt: 'Banner image' },
    };
    expect(validate(fixture)).toBe(true);
  });

  it('renders image when image prop is provided', () => {
    render(
      <TextCta
        headline="Banner with image"
        image={{ src: 'https://example.com/banner.jpg', alt: 'Banner image' }}
      />
    );
    expect(screen.getByAltText('Banner image')).toBeInTheDocument();
  });

  it('fixture with buttons validates against text-cta schema', () => {
    const fixture = {
      headline: 'Take action',
      buttons: [
        { label: 'Learn more', url: 'https://example.com', type: 'Primary' },
        { label: 'Contact us', url: 'https://example.com/contact', type: 'Secondary' },
      ],
    };
    expect(validate(fixture)).toBe(true);
  });

  it('renders buttons from fixture', () => {
    render(
      <TextCta
        headline="Take action"
        buttons={[
          { label: 'Learn more', url: 'https://example.com', type: 'Primary' },
        ]}
      />
    );
    expect(screen.getByRole('link', { name: 'Learn more' })).toBeInTheDocument();
  });
});
