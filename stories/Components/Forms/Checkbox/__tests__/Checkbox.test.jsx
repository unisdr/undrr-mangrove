import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Checkbox } from '../Checkbox';
import { FormGroup } from '../../FormGroup/FormGroup';

describe('Checkbox', () => {
  it('renders with a label', () => {
    render(<Checkbox label="Accept terms" value="terms" />);
    expect(screen.getByLabelText('Accept terms')).toBeInTheDocument();
  });

  it('renders as a checkbox input', () => {
    render(<Checkbox label="Accept terms" value="terms" />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('associates label with checkbox via htmlFor', () => {
    render(<Checkbox label="Accept terms" value="terms" id="terms-cb" />);
    const checkbox = screen.getByLabelText('Accept terms');
    expect(checkbox).toHaveAttribute('id', 'terms-cb');
  });

  it('renders label before checkbox when labelPosition is "before"', () => {
    const { container } = render(
      <Checkbox label="Accept terms" value="terms" labelPosition="before" />,
    );
    const wrapper = container.querySelector('.mg-form-check');
    const children = Array.from(wrapper.children);
    expect(children[0].tagName).toBe('LABEL');
    expect(children[1].tagName).toBe('INPUT');
  });

  it('renders label after checkbox by default', () => {
    const { container } = render(
      <Checkbox label="Accept terms" value="terms" />,
    );
    const wrapper = container.querySelector('.mg-form-check');
    const children = Array.from(wrapper.children);
    expect(children[0].tagName).toBe('INPUT');
    expect(children[1].tagName).toBe('LABEL');
  });

  it('renders as disabled', () => {
    render(<Checkbox label="Accept terms" value="terms" disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('can be checked by default', () => {
    render(<Checkbox label="Accept terms" value="terms" defaultChecked />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onChange when clicked', () => {
    const handleChange = jest.fn();
    render(
      <Checkbox label="Accept terms" value="terms" onChange={handleChange} />,
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(handleChange).toHaveBeenCalled();
  });

  it('uses aria-label from value when no label is provided', () => {
    render(<Checkbox value="terms" />);
    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-label',
      'terms',
    );
  });

  it('applies BEM class names', () => {
    const { container } = render(
      <Checkbox label="Accept terms" value="terms" />,
    );
    expect(container.querySelector('.mg-form-check')).toBeInTheDocument();
    expect(
      container.querySelector('.mg-form-check__input--checkbox'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('.mg-form-check__label'),
    ).toBeInTheDocument();
  });

  // --------------------------------------------------
  // Error state
  // --------------------------------------------------

  it('renders error text with aria-invalid and role="alert"', () => {
    render(
      <Checkbox
        label="Accept terms"
        value="terms"
        error
        errorText="You must accept the terms"
      />,
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'You must accept the terms',
    );
  });

  it('links error text via aria-describedby', () => {
    render(
      <Checkbox
        label="Accept terms"
        value="terms"
        error
        errorText="You must accept the terms"
      />,
    );
    const checkbox = screen.getByRole('checkbox');
    const describedBy = checkbox.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy)).toHaveTextContent(
      'You must accept the terms',
    );
  });

  it('does not set aria-invalid when error is false', () => {
    render(<Checkbox label="Accept terms" value="terms" />);
    expect(screen.getByRole('checkbox')).not.toHaveAttribute('aria-invalid');
  });

  it('does not render error text when error is false', () => {
    render(
      <Checkbox label="Accept terms" value="terms" errorText="Should not appear" />,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('applies error BEM class to input', () => {
    const { container } = render(
      <Checkbox label="Accept terms" value="terms" error errorText="Error" />,
    );
    expect(
      container.querySelector('.mg-form-check__input--error'),
    ).toBeInTheDocument();
  });

  // --------------------------------------------------
  // Accessibility
  // --------------------------------------------------

  it('has no a11y violations', async () => {
    const { container } = render(
      <Checkbox label="Accept terms" value="terms" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations in error state', async () => {
    const { container } = render(
      <Checkbox
        label="Accept terms"
        value="terms"
        error
        errorText="You must accept the terms"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations in a group', async () => {
    const { container } = render(
      <FormGroup legend="Interests">
        <Checkbox label="Option A" value="a" name="group" />
        <Checkbox label="Option B" value="b" name="group" />
      </FormGroup>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
