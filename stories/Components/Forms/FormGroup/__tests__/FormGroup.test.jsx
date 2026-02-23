import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { FormGroup } from '../FormGroup';

describe('FormGroup', () => {
  it('renders a fieldset with a legend', () => {
    render(
      <FormGroup legend="Choose an option">
        <input type="checkbox" aria-label="A" />
      </FormGroup>,
    );
    expect(screen.getByRole('group')).toBeInTheDocument();
    expect(screen.getByText('Choose an option')).toBeInTheDocument();
  });

  it('renders children inside the fieldset', () => {
    render(
      <FormGroup legend="Options">
        <label>
          <input type="checkbox" /> Option A
        </label>
      </FormGroup>,
    );
    expect(screen.getByText('Option A')).toBeInTheDocument();
  });

  it('applies BEM class names', () => {
    const { container } = render(
      <FormGroup legend="Options">
        <span>child</span>
      </FormGroup>,
    );
    expect(container.querySelector('.mg-form-group')).toBeInTheDocument();
    expect(
      container.querySelector('.mg-form-group__legend'),
    ).toBeInTheDocument();
  });

  it('applies disabled class and attribute', () => {
    const { container } = render(
      <FormGroup legend="Options" disabled>
        <input type="checkbox" aria-label="A" />
      </FormGroup>,
    );
    const fieldset = container.querySelector('fieldset');
    expect(fieldset).toBeDisabled();
    expect(fieldset).toHaveClass('mg-form-group--disabled');
  });

  it('disables child controls natively via fieldset', () => {
    render(
      <FormGroup legend="Options" disabled>
        <input type="checkbox" aria-label="A" />
      </FormGroup>,
    );
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('applies error class and shows error text', () => {
    const { container } = render(
      <FormGroup legend="Options" error errorText="Select at least one">
        <input type="checkbox" aria-label="A" />
      </FormGroup>,
    );
    expect(container.querySelector('.mg-form-group--error')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Select at least one');
  });

  it('does not show error text when error is false', () => {
    render(
      <FormGroup legend="Options" errorText="Select at least one">
        <input type="checkbox" aria-label="A" />
      </FormGroup>,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('visually hides the legend when hideLegend is true', () => {
    const { container } = render(
      <FormGroup legend="Options" hideLegend>
        <input type="checkbox" aria-label="A" />
      </FormGroup>,
    );
    const legend = container.querySelector('legend');
    expect(legend).toHaveClass('mg-u-sr-only');
    // Still accessible
    expect(screen.getByText('Options')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <FormGroup legend="Options" className="my-custom-class">
        <span>child</span>
      </FormGroup>,
    );
    expect(container.querySelector('.my-custom-class')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(
      <FormGroup legend="Select your interests">
        <label>
          <input type="checkbox" /> Disaster risk reduction
        </label>
        <label>
          <input type="checkbox" /> Climate change
        </label>
      </FormGroup>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations with error', async () => {
    const { container } = render(
      <FormGroup legend="Select your interests" error errorText="Required">
        <label>
          <input type="checkbox" /> Disaster risk reduction
        </label>
      </FormGroup>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
