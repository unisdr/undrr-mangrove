import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import ComboBox from '../ComboBox';

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
    render(<ComboBox label="Hazard type" items={items} isDisabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  test('has no accessibility violations at rest', async () => {
    const { container } = render(
      <ComboBox label="Hazard type" items={items} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
