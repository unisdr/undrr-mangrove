/**
 * @file SelectDropdown.test.jsx
 * @description Keyboard highlight and pointer hover don't both show.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
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

it('preserves a subtype indent, summary and removal through reopening', () => {
  const onChange = jest.fn();
  const props = {
    id: 'type',
    label: 'Type',
    multiple: true,
    options: [
      { value: 'news', label: 'News' },
      { value: 'update', label: 'News: Update', isSubtype: true },
    ],
    value: ['update'],
    onChange,
  };
  render(<SelectDropdown {...props} />);
  const trigger = screen.getByRole('button', { name: 'News: Update' });
  for (let i = 0; i < 2; i++) {
    fireEvent.click(trigger);
    const option = screen.getByRole('option', { name: 'News: Update' });
    expect(option).toHaveClass('mg-select__option--subtype');
    expect(option).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(option);
    expect(onChange).toHaveBeenLastCalledWith([]);
    fireEvent.keyDown(trigger, { key: 'Escape' });
  }
});

it('keeps keyboard identity through asynchronous reordering and clears absent descendants', () => {
  const onChange = jest.fn();
  const view = options => (
    <SelectDropdown
      id="async"
      label="Test"
      options={options}
      value={[]}
      onChange={onChange}
      multiple
    />
  );
  const { rerender } = render(view(OPTIONS));
  const trigger = screen.getByRole('button');
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  rerender(view([OPTIONS[1], OPTIONS[0], { value: 'c', label: 'Gamma' }]));
  expect(screen.getByRole('option', { name: 'Alpha' })).toHaveClass(
    'mg-select__option--highlighted'
  );
  fireEvent.keyDown(trigger, { key: 'Enter' });
  expect(onChange).toHaveBeenLastCalledWith(['a']);
  rerender(view([OPTIONS[1]]));
  expect(trigger).not.toHaveAttribute('aria-activedescendant');
  fireEvent.keyDown(trigger, { key: 'Enter' });
  expect(onChange).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  fireEvent.keyDown(trigger, { key: 'Enter' });
  expect(onChange).toHaveBeenLastCalledWith(['b']);
});

it('has no automated accessibility violations with a selected indented subtype', async () => {
  const { container } = render(
    <SelectDropdown
      id="accessible"
      label="Type"
      options={[{ value: 'update', label: 'News: Update', isSubtype: true }]}
      value={['update']}
      multiple
      onChange={() => {}}
    />
  );
  fireEvent.click(screen.getByRole('button'));
  expect(await axe(container)).toHaveNoViolations();
});
