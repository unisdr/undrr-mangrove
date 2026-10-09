import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Loader } from '../Loader';

describe('Loader', () => {
  it('announces the default label as text inside a status region', () => {
    render(<Loader />);
    const status = screen.getByRole('status');
    expect(status).toHaveClass('mg-loader');
    expect(status).toHaveTextContent('Loading');
    expect(screen.getByText('Loading')).toHaveClass('mg-u-sr-only');
  });

  it('renders a translated label', () => {
    render(<Loader label="Chargement" />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement');
  });

  it('does not mark itself busy or repeat the implicit live setting', () => {
    render(<Loader />);
    const status = screen.getByRole('status');
    expect(status).not.toHaveAttribute('aria-busy');
    expect(status).not.toHaveAttribute('aria-live');
    expect(status).not.toHaveAttribute('aria-label');
  });

  it('appends extra classes', () => {
    render(<Loader className="custom" />);
    expect(screen.getByRole('status')).toHaveClass('mg-loader', 'custom');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Loader />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
