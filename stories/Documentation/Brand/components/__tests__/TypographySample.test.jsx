import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { TypographySample } from '../TypographySample';

describe('TypographySample', () => {
  const defaultProps = {
    fontFamily: 'Roboto Condensed',
    fontSize: '42px',
    fontWeight: 700,
    label: 'Page title',
  };

  // --------------------------------------------------
  // Rendering
  // --------------------------------------------------

  it('renders the sample text at the specified style', () => {
    render(<TypographySample {...defaultProps} />);

    const rendered = screen.getByText('Page title');
    expect(rendered).toHaveStyle({
      fontFamily: "'Roboto Condensed', sans-serif",
      fontSize: '42px',
      fontWeight: 700,
    });
  });

  it('uses custom sample text when provided', () => {
    render(
      <TypographySample {...defaultProps} sampleText="Custom sample" />,
    );

    expect(screen.getByText('Custom sample')).toBeInTheDocument();
    expect(screen.queryByText('Page title')).not.toBeInTheDocument();
  });

  it('shows font metadata', () => {
    render(<TypographySample {...defaultProps} />);

    expect(screen.getByText('Roboto Condensed Bold')).toBeInTheDocument();
    expect(screen.getByText('42px / 700')).toBeInTheDocument();
  });

  it('labels regular weight for values below 600', () => {
    render(
      <TypographySample {...defaultProps} fontWeight={400} />,
    );

    expect(screen.getByText('Roboto Condensed Regular')).toBeInTheDocument();
  });

  // --------------------------------------------------
  // Accessibility
  // --------------------------------------------------

  it('has no accessibility violations', async () => {
    const { container } = render(<TypographySample {...defaultProps} />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
