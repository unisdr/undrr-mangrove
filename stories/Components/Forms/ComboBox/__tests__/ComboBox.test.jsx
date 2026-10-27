import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import ComboBox from '../ComboBox';
import { Drawer } from '../../../Navigation/Drawer/Drawer';

const items = [
  { id: 'flood', label: 'Flood' },
  { id: 'drought', label: 'Drought' },
];

describe('ComboBox', () => {
  test('labels its input and supports translated button text', () => {
    render(
      <ComboBox
        label="Hazard type"
        items={items}
        openButtonLabel="Show hazards"
      />
    );
    expect(screen.getByRole('combobox', { name: 'Hazard type' })).toBeVisible();
    expect(screen.getByRole('button', { name: /Show hazards/ })).toBeVisible();
  });

  test('passes input changes to a controlled consumer', () => {
    const onInputChange = jest.fn();
    render(
      <ComboBox
        label="Hazard type"
        items={items}
        inputValue=""
        onInputChange={onInputChange}
      />
    );
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'Flood' },
    });
    expect(onInputChange).toHaveBeenCalledWith('Flood');
  });

  test('filters suggestions as the user types', async () => {
    render(<ComboBox label="Hazard type" items={items} />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(
      await screen.findByRole('option', { name: 'Drought' })
    ).toBeVisible();
    fireEvent.change(input, {
      target: { value: 'flo' },
    });
    expect(await screen.findByRole('option', { name: 'Flood' })).toBeVisible();
    expect(screen.queryByRole('option', { name: 'Drought' })).toBeNull();
  });

  test('renders disabled state', () => {
    render(<ComboBox label="Hazard type" items={items} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  test('shows native required validation feedback after an empty submit', async () => {
    render(
      <form>
        <ComboBox
          label="Hazard type"
          items={items}
          required
          errorText="Pick a hazard"
        />
        <button type="submit">Submit</button>
      </form>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    const input = screen.getByRole('combobox', { name: 'Hazard type' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(await screen.findByText('Pick a hazard')).toBeVisible();
    expect(input).toHaveAttribute('aria-describedby');
  });

  test('a controlled form can clear an earlier error', () => {
    const props = {
      label: 'Hazard type',
      items,
      errorText: 'Pick a hazard',
    };
    const { rerender } = render(<ComboBox {...props} error />);
    const input = screen.getByRole('combobox', { name: 'Hazard type' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    rerender(<ComboBox {...props} selectedKey="flood" error={false} />);
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText('Pick a hazard')).toBeNull();
  });

  test('shares Mangrove field props and describes help text', () => {
    render(
      <ComboBox
        id="hazard-type"
        label="Hazard type"
        hideLabel
        items={items}
        required
        helpText="Choose one hazard"
        defaultSelectedKey="flood"
      />
    );
    const input = screen.getByRole('combobox', { name: 'Hazard type' });
    expect(input).toHaveAttribute('id', 'hazard-type');
    expect(input).toHaveValue('Flood');
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-describedby');
    expect(screen.getByText('Choose one hazard')).toBeVisible();
    expect(screen.getByText('Hazard type')).toHaveClass('mg-u-sr-only');
  });

  test('Escape closes suggestions before their containing Drawer', async () => {
    const onClose = jest.fn();
    render(
      <Drawer isOpen title="Choose a hazard" onClose={onClose}>
        <ComboBox label="Hazard type" items={items} />
      </Drawer>
    );
    const input = screen.getByRole('combobox', { name: 'Hazard type' });
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(await screen.findByRole('option', { name: 'Flood' })).toBeVisible();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole('option', { name: 'Flood' })).toBeNull();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('has no accessibility violations at rest', async () => {
    const { container } = render(
      <ComboBox label="Hazard type" items={items} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
