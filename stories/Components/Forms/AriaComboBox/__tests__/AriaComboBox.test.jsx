import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import AriaComboBox from '../AriaComboBox';

const items = [
  { id: 'flood', label: 'Flood' },
  { id: 'drought', label: 'Drought' },
];

describe('AriaComboBox', () => {
  test('labels its input and supports translated button text', () => {
    render(
      <AriaComboBox
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
      <AriaComboBox
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

  test('renders disabled state', () => {
    render(<AriaComboBox label="Hazard type" items={items} isDisabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  test('has no accessibility violations at rest', async () => {
    const { container } = render(
      <AriaComboBox label="Hazard type" items={items} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
