import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { FormErrorSummary } from '../FormErrorSummary';

const errors = [
  { id: 'email', message: 'Enter a valid email address' },
  { id: 'name', message: 'Enter your full name' },
];

describe('FormErrorSummary', () => {
  // --------------------------------------------------
  // Rendering
  // --------------------------------------------------

  it('renders the title and error messages', () => {
    render(<FormErrorSummary errors={errors} />);
    expect(
      screen.getByText('There is a problem'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Enter a valid email address'),
    ).toBeInTheDocument();
    expect(screen.getByText('Enter your full name')).toBeInTheDocument();
  });

  it('renders a custom title', () => {
    render(
      <FormErrorSummary title="Fix the following" errors={errors} />,
    );
    expect(screen.getByText('Fix the following')).toBeInTheDocument();
  });

  it('renders each error as a link to the field id', () => {
    render(<FormErrorSummary errors={errors} />);
    const emailLink = screen.getByText('Enter a valid email address');
    expect(emailLink.tagName).toBe('A');
    expect(emailLink).toHaveAttribute('href', '#email');

    const nameLink = screen.getByText('Enter your full name');
    expect(nameLink.tagName).toBe('A');
    expect(nameLink).toHaveAttribute('href', '#name');
  });

  it('renders nothing when errors array is empty', () => {
    const { container } = render(<FormErrorSummary errors={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when errors is null', () => {
    const { container } = render(<FormErrorSummary errors={null} />);
    expect(container.innerHTML).toBe('');
  });

  // --------------------------------------------------
  // BEM classes
  // --------------------------------------------------

  it('applies BEM class names', () => {
    const { container } = render(<FormErrorSummary errors={errors} />);
    expect(
      container.querySelector('.mg-form-error-summary'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('.mg-form-error-summary__title'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('.mg-form-error-summary__list'),
    ).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <FormErrorSummary errors={errors} className="my-custom" />,
    );
    expect(container.querySelector('.my-custom')).toBeInTheDocument();
    expect(
      container.querySelector('.mg-form-error-summary.my-custom'),
    ).toBeInTheDocument();
  });

  // --------------------------------------------------
  // Accessibility
  // --------------------------------------------------

  it('has role="alert"', () => {
    render(<FormErrorSummary errors={errors} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has tabIndex={-1} for programmatic focus', () => {
    render(<FormErrorSummary errors={errors} />);
    expect(screen.getByRole('alert')).toHaveAttribute('tabindex', '-1');
  });

  it('focuses the container on mount', () => {
    render(<FormErrorSummary errors={errors} />);
    expect(screen.getByRole('alert')).toHaveFocus();
  });

  it('renders an h2 heading for the title', () => {
    render(<FormErrorSummary errors={errors} />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('There is a problem');
  });

  it('renders errors in a list', () => {
    render(<FormErrorSummary errors={errors} />);
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
  });

  it('error links navigate to field ids', async () => {
    render(
      <div>
        <FormErrorSummary errors={errors} />
        <input id="email" aria-label="Email" />
        <input id="name" aria-label="Name" />
      </div>,
    );
    const emailLink = screen.getByText('Enter a valid email address');
    expect(emailLink.closest('a')).toHaveAttribute('href', '#email');
  });

  it('has no a11y violations', async () => {
    const { container } = render(<FormErrorSummary errors={errors} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations with a single error', async () => {
    const { container } = render(
      <FormErrorSummary
        errors={[{ id: 'email', message: 'Enter a valid email address' }]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations with custom title', async () => {
    const { container } = render(
      <FormErrorSummary title="Fix the following errors" errors={errors} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  // --------------------------------------------------
  // Rest props
  // --------------------------------------------------

  it('spreads rest props to the container', () => {
    render(<FormErrorSummary errors={errors} data-testid="summary" />);
    expect(screen.getByTestId('summary')).toBeInTheDocument();
  });
});
