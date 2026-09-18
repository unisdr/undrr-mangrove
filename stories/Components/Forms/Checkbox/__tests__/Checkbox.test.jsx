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
      <Checkbox label="Accept terms" value="terms" labelPosition="before" />
    );
    const wrapper = container.querySelector('.mg-form-check');
    const children = Array.from(wrapper.children);
    expect(children[0].tagName).toBe('LABEL');
    expect(children[1].tagName).toBe('INPUT');
  });

  it('renders label after checkbox by default', () => {
    const { container } = render(
      <Checkbox label="Accept terms" value="terms" />
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
      <Checkbox label="Accept terms" value="terms" onChange={handleChange} />
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(handleChange).toHaveBeenCalled();
  });

  it('uses aria-label from value when no label is provided', () => {
    render(<Checkbox value="terms" />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-label', 'terms');
  });

  it('applies BEM class names', () => {
    const { container } = render(
      <Checkbox label="Accept terms" value="terms" />
    );
    expect(container.querySelector('.mg-form-check')).toBeInTheDocument();
    expect(
      container.querySelector('.mg-form-check__input--checkbox')
    ).toBeInTheDocument();
    expect(
      container.querySelector('.mg-form-check__label')
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
      />
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'You must accept the terms'
    );
  });

  it('links error text via aria-describedby', () => {
    render(
      <Checkbox
        label="Accept terms"
        value="terms"
        error
        errorText="You must accept the terms"
      />
    );
    const checkbox = screen.getByRole('checkbox');
    const describedBy = checkbox.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy)).toHaveTextContent(
      'You must accept the terms'
    );
  });

  it('does not set aria-invalid when error is false', () => {
    render(<Checkbox label="Accept terms" value="terms" />);
    expect(screen.getByRole('checkbox')).not.toHaveAttribute('aria-invalid');
  });

  it('does not render error text when error is false', () => {
    render(
      <Checkbox
        label="Accept terms"
        value="terms"
        errorText="Should not appear"
      />
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('applies error BEM class to input', () => {
    const { container } = render(
      <Checkbox label="Accept terms" value="terms" error errorText="Error" />
    );
    expect(
      container.querySelector('.mg-form-check__input--error')
    ).toBeInTheDocument();
  });

  // --------------------------------------------------
  // Accessibility
  // --------------------------------------------------

  it('has no a11y violations', async () => {
    const { container } = render(
      <Checkbox label="Accept terms" value="terms" />
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
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations in a group', async () => {
    const { container } = render(
      <FormGroup legend="Interests">
        <Checkbox label="Option A" value="a" name="group" />
        <Checkbox label="Option B" value="b" name="group" />
      </FormGroup>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

// The switch is CSS-only markup, so these render the documented HTML directly.
describe('Switch pending state markup', () => {
  const PendingSwitch = ({
    checked = false,
    busy = true,
    modifier = false,
  }) => (
    <div>
      <label className={`mg-switch${modifier ? ' mg-switch--pending' : ''}`}>
        <input
          type="checkbox"
          role="switch"
          className="mg-switch__input"
          aria-busy={busy}
          defaultChecked={checked}
        />
        <span className="mg-switch__track" aria-hidden="true">
          <span className="mg-switch__thumb"></span>
        </span>
        <span className="mg-switch__label">Real-time alerts</span>
      </label>
      <p className="mg-form-help" role="status"></p>
    </div>
  );

  it('keeps the switch role, name and requested state while pending', () => {
    render(<PendingSwitch checked />);
    const control = screen.getByRole('switch', { name: 'Real-time alerts' });
    expect(control).toBeChecked();
    expect(control).toHaveAttribute('aria-busy', 'true');
    expect(control).toBeEnabled();
  });

  it('has no a11y violations when pending off', async () => {
    const { container } = render(<PendingSwitch />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations when pending on', async () => {
    const { container } = render(<PendingSwitch checked />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations with the pending modifier class', async () => {
    const { container } = render(<PendingSwitch busy={false} modifier />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations when aria-disabled while pending', async () => {
    const { container } = render(
      <label className="mg-switch">
        <input
          type="checkbox"
          role="switch"
          className="mg-switch__input"
          aria-busy="true"
          aria-disabled="true"
        />
        <span className="mg-switch__track" aria-hidden="true">
          <span className="mg-switch__thumb"></span>
        </span>
        <span className="mg-switch__label">Real-time alerts</span>
      </label>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('Switch error state markup', () => {
  // The switch is CSS only, so what a consumer has to get right is the
  // markup: aria-invalid on the input, the message outside the label so it
  // does not join the accessible name, and aria-describedby joining the two.
  const ErrorSwitch = () => (
    <div>
      <label className="mg-switch">
        <input
          type="checkbox"
          role="switch"
          className="mg-switch__input"
          id="layer"
          defaultChecked
          aria-invalid="true"
          aria-describedby="layer-error"
        />
        <span className="mg-switch__track" aria-hidden="true">
          <span className="mg-switch__thumb"></span>
        </span>
        <span className="mg-switch__label">Seismic hazard layer</span>
      </label>
      <p className="mg-form-error" id="layer-error" role="alert">
        This layer could not load. Try again.
      </p>
    </div>
  );

  // Latest intent wins: the error says the layer failed, it does not undo
  // what the user asked for. See unisdr/undrr-mangrove#1187.
  it('marks the switch invalid without changing its position', () => {
    render(<ErrorSwitch />);
    const input = screen.getByRole('switch');
    expect(input).toBeChecked();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('describes the switch with the error message, as the other controls do', () => {
    render(<ErrorSwitch />);
    expect(screen.getByRole('switch')).toHaveAccessibleDescription(
      'This layer could not load. Try again.'
    );
  });

  // Inside the label the message would become part of the switch's name.
  it('keeps the message out of the accessible name', () => {
    render(<ErrorSwitch />);
    expect(screen.getByRole('switch')).toHaveAccessibleName(
      'Seismic hazard layer'
    );
  });

  it('announces the message, so a failure reaches assistive technology', () => {
    render(<ErrorSwitch />);
    expect(screen.getByRole('alert')).toHaveClass('mg-form-error');
  });

  it('has no a11y violations', async () => {
    const { container } = render(<ErrorSwitch />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations at the small size', async () => {
    const { container } = render(
      <label className="mg-switch mg-switch--small">
        <input type="checkbox" role="switch" className="mg-switch__input" />
        <span className="mg-switch__track" aria-hidden="true">
          <span className="mg-switch__thumb"></span>
        </span>
        <span className="mg-switch__label">Show disabled layers</span>
      </label>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
