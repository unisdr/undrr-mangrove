import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { FormAction } from '../FormAction';

const renderFormAction = props =>
  render(
    <FormAction
      label="Email address"
      control={<input className="mg-form-input" type="email" />}
      action={
        <button className="mg-button mg-button-primary" type="submit">
          Subscribe
        </button>
      }
      {...props}
    />
  );

describe('FormAction', () => {
  it('associates its label and composes slot classes', () => {
    const { container } = renderFormAction();
    const input = screen.getByLabelText('Email address');

    expect(input).toHaveClass('mg-form-input', 'mg-form-action__control');
    expect(screen.getByRole('button', { name: 'Subscribe' })).toHaveClass(
      'mg-button',
      'mg-form-action__action'
    );
    expect(container.querySelector('.mg-form-action')).toBeInTheDocument();
  });

  it('connects help and error messages without replacing existing descriptions', () => {
    renderFormAction({
      helpText: 'A confirmation email will be sent to this address.',
      errorText: 'Enter a valid email address.',
      control: (
        <input
          className="mg-form-input"
          type="email"
          aria-describedby="external-description"
        />
      ),
    });

    const input = screen.getByLabelText('Email address');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toContain(
      'external-description'
    );
    expect(input.getAttribute('aria-describedby')).toContain('-help');
    expect(input.getAttribute('aria-describedby')).toContain('-error');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a valid email address.'
    );
  });

  it('adds the optional responsive stacking modifier', () => {
    const { container } = renderFormAction({ stackOnMobile: true });

    expect(container.querySelector('.mg-form-action')).toHaveClass(
      'mg-form-action--stack-mobile'
    );
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = renderFormAction({
      helpText: 'A confirmation email will be sent to this address.',
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
