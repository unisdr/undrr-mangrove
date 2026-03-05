import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Boilerplate } from '../Boilerplate';

describe('Boilerplate', () => {
  const defaultProps = {
    title: 'Test',
    children: <p>Content</p>,
  };

  it('renders title and children', () => {
    render(<Boilerplate {...defaultProps} title="Hello" children={<p>Body text</p>} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Body text')).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    const { container } = render(<Boilerplate {...defaultProps} />);

    expect(container.querySelector('.mg-boilerplate--primary')).toBeInTheDocument();
  });

  it('applies secondary variant when specified', () => {
    const { container } = render(<Boilerplate {...defaultProps} variant="secondary" />);

    expect(container.querySelector('.mg-boilerplate--secondary')).toBeInTheDocument();
  });

  it('renders title as a link when href is provided', () => {
    render(<Boilerplate {...defaultProps} title="Linked" href="https://example.com" />);

    const link = screen.getByRole('link', { name: 'Linked' });
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('renders title as plain text when no href', () => {
    render(<Boilerplate {...defaultProps} title="Plain" />);

    expect(screen.getByText('Plain')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Plain' })).not.toBeInTheDocument();
  });

  it('passes extra props to the root element', () => {
    const { container } = render(<Boilerplate {...defaultProps} data-testid="custom" />);

    expect(container.querySelector('[data-testid="custom"]')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<Boilerplate {...defaultProps} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
