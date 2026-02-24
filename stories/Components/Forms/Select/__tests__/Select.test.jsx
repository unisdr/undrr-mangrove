import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Select } from '../Select';

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
  { value: 'c', label: 'Charlie' },
];

describe('Select', () => {
  it('renders with a label', () => {
    render(<Select label="Country" options={options} />);
    expect(screen.getByLabelText('Country')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<Select label="Country" options={options} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Bravo')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('renders placeholder as disabled first option', () => {
    render(
      <Select
        label="Country"
        options={options}
        placeholder="Select one"
      />,
    );
    const placeholder = screen.getByText('Select one');
    expect(placeholder.tagName).toBe('OPTION');
    expect(placeholder).toBeDisabled();
  });

  it('renders help text with aria-describedby', () => {
    render(
      <Select label="Country" options={options} helpText="Choose wisely" />,
    );
    const select = screen.getByLabelText('Country');
    const helpId = select.getAttribute('aria-describedby');
    expect(helpId).toBeTruthy();
    expect(document.getElementById(helpId)).toHaveTextContent('Choose wisely');
  });

  it('renders error text with aria-invalid and role="alert"', () => {
    render(
      <Select
        label="Country"
        options={options}
        error
        errorText="Required"
      />,
    );
    const select = screen.getByLabelText('Country');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });

  it('does not set aria-invalid when error is false', () => {
    render(<Select label="Country" options={options} />);
    expect(screen.getByLabelText('Country')).not.toHaveAttribute(
      'aria-invalid',
    );
  });

  it('renders as disabled', () => {
    render(<Select label="Country" options={options} disabled />);
    expect(screen.getByLabelText('Country')).toBeDisabled();
  });

  it('renders as required', () => {
    render(<Select label="Country" options={options} required />);
    expect(screen.getByLabelText(/Country/)).toBeRequired();
  });

  it('renders disabled options', () => {
    const opts = [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Bravo', disabled: true },
    ];
    render(<Select label="Country" options={opts} />);
    expect(screen.getByText('Bravo')).toBeDisabled();
  });

  it('calls onChange when selection changes', () => {
    const handleChange = jest.fn();
    render(
      <Select label="Country" options={options} onChange={handleChange} />,
    );
    fireEvent.change(screen.getByLabelText('Country'), {
      target: { value: 'b' },
    });
    expect(handleChange).toHaveBeenCalled();
  });

  it('uses aria-label when no label is provided', () => {
    render(<Select options={options} placeholder="Pick one" />);
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-label',
      'Pick one',
    );
  });

  it('has no a11y violations', async () => {
    const { container } = render(
      <Select label="Country" options={options} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations in error state', async () => {
    const { container } = render(
      <Select label="Country" options={options} error errorText="Required" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
