import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { TextInput } from '../TextInput';

describe('TextInput', () => {
  // --------------------------------------------------
  // Rendering
  // --------------------------------------------------

  it('renders with a label', () => {
    render(<TextInput label="Full name" />);
    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
  });

  it('associates label with input via htmlFor', () => {
    render(<TextInput label="Email" id="email-input" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('id', 'email-input');
  });

  it('renders help text with aria-describedby', () => {
    render(<TextInput label="Password" helpText="8 characters minimum" />);
    const input = screen.getByLabelText('Password');
    const helpId = input.getAttribute('aria-describedby');
    expect(helpId).toBeTruthy();
    expect(document.getElementById(helpId)).toHaveTextContent(
      '8 characters minimum',
    );
  });

  it('renders error text with aria-invalid and role="alert"', () => {
    render(
      <TextInput
        label="Email"
        error
        errorText="This field is required"
      />,
    );
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This field is required',
    );
  });

  it('does not set aria-invalid when error is false', () => {
    render(<TextInput label="Name" />);
    const input = screen.getByLabelText('Name');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('does not render error text when error is false', () => {
    render(<TextInput label="Name" errorText="Should not appear" />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  // --------------------------------------------------
  // States
  // --------------------------------------------------

  it('renders as disabled', () => {
    render(<TextInput label="Name" disabled />);
    expect(screen.getByLabelText('Name')).toBeDisabled();
  });

  it('renders as required', () => {
    render(<TextInput label="Name" required />);
    expect(screen.getByLabelText(/Name/)).toBeRequired();
  });

  // --------------------------------------------------
  // Interactions
  // --------------------------------------------------

  it('calls onChange when typing', () => {
    const handleChange = jest.fn();
    render(<TextInput label="Name" onChange={handleChange} />);
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'test' },
    });
    expect(handleChange).toHaveBeenCalled();
  });

  // --------------------------------------------------
  // Fallbacks
  // --------------------------------------------------

  it('uses aria-label from placeholder when no label is provided', () => {
    render(<TextInput placeholder="Search..." />);
    expect(screen.getByPlaceholderText('Search...')).toHaveAttribute(
      'aria-label',
      'Search...',
    );
  });

  it('spreads rest props to the input element', () => {
    render(<TextInput label="Name" data-testid="custom" maxLength={50} />);
    const input = screen.getByTestId('custom');
    expect(input).toHaveAttribute('maxlength', '50');
  });

  // --------------------------------------------------
  // Hidden label
  // --------------------------------------------------

  it('visually hides label when hideLabel is true', () => {
    render(<TextInput label="Search" hideLabel />);
    const label = document.querySelector('.mg-u-sr-only');
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent('Search');
  });

  // --------------------------------------------------
  // Accessibility
  // --------------------------------------------------

  it('has no a11y violations', async () => {
    const { container } = render(
      <TextInput label="Full name" placeholder="Enter your name" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations in error state', async () => {
    const { container } = render(
      <TextInput
        label="Email"
        error
        errorText="This field is required"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
