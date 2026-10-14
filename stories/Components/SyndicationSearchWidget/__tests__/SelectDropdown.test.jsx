/**
 * @file SelectDropdown.test.jsx
 * @description Keyboard highlight and pointer hover don't both show.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectDropdown } from '../components/SelectDropdown';

// jsdom has no layout, so no scrollIntoView.
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

it('drops the keyboard highlight when the pointer moves over the list', () => {
  render(
    <SelectDropdown
      id="test"
      label="Test"
      placeholder="Pick"
      options={OPTIONS}
      value={[]}
      onChange={() => {}}
    />
  );
  const trigger = screen.getByRole('button', { name: 'Pick' });
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  expect(
    document.querySelectorAll('.mg-select__option--highlighted')
  ).toHaveLength(1);

  fireEvent.pointerMove(screen.getByRole('listbox'));
  expect(
    document.querySelectorAll('.mg-select__option--highlighted')
  ).toHaveLength(0);
});
