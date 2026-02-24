import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Textarea } from '../Textarea';

describe('Textarea', () => {
  it('renders with a label', () => {
    render(<Textarea label="Description" />);
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('associates label with textarea via htmlFor', () => {
    render(<Textarea label="Comments" id="comments" />);
    const textarea = screen.getByLabelText('Comments');
    expect(textarea).toHaveAttribute('id', 'comments');
  });

  it('renders help text with aria-describedby', () => {
    render(<Textarea label="Comments" helpText="Max 500 characters" />);
    const textarea = screen.getByLabelText('Comments');
    const helpId = textarea.getAttribute('aria-describedby');
    expect(helpId).toBeTruthy();
    expect(document.getElementById(helpId)).toHaveTextContent(
      'Max 500 characters',
    );
  });

  it('renders error text with aria-invalid and role="alert"', () => {
    render(
      <Textarea label="Description" error errorText="This field is required" />,
    );
    const textarea = screen.getByLabelText('Description');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This field is required',
    );
  });

  it('does not set aria-invalid when error is false', () => {
    render(<Textarea label="Description" />);
    expect(screen.getByLabelText('Description')).not.toHaveAttribute(
      'aria-invalid',
    );
  });

  it('renders as disabled', () => {
    render(<Textarea label="Description" disabled />);
    expect(screen.getByLabelText('Description')).toBeDisabled();
  });

  it('renders as required', () => {
    render(<Textarea label="Description" required />);
    expect(screen.getByLabelText(/Description/)).toBeRequired();
  });

  it('applies rows attribute', () => {
    render(<Textarea label="Description" rows={10} />);
    expect(screen.getByLabelText('Description')).toHaveAttribute('rows', '10');
  });

  it('calls onChange when typing', () => {
    const handleChange = jest.fn();
    render(<Textarea label="Description" onChange={handleChange} />);
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'test' },
    });
    expect(handleChange).toHaveBeenCalled();
  });

  it('uses aria-label from placeholder when no label is provided', () => {
    render(<Textarea placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText('Enter text...')).toHaveAttribute(
      'aria-label',
      'Enter text...',
    );
  });

  it('visually hides label when hideLabel is true', () => {
    render(<Textarea label="Description" hideLabel />);
    const label = document.querySelector('.mg-u-sr-only');
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent('Description');
  });

  it('has no a11y violations', async () => {
    const { container } = render(
      <Textarea label="Description" placeholder="Enter text" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations in error state', async () => {
    const { container } = render(
      <Textarea label="Description" error errorText="Required" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
