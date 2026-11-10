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

it('exposes highlighted inclusion descriptions from the focused searchable combobox', async () => {
  const options = Array.from({ length: 9 }, (_, i) => ({
    value: `option-${i}`,
    label: `Option ${i}`,
    selectionState: i === 0 ? 'inherited' : undefined,
    description: i === 0 ? 'Included through parent type' : undefined,
  }));
  const { container } = render(
    <SelectDropdown
      id="search-type"
      label="Type"
      options={options}
      value={[]}
      multiple
      onChange={() => {}}
    />
  );
  const trigger = screen.getByRole('button');
  fireEvent.click(trigger);
  const search = screen.getByRole('combobox', { name: 'Search Type' });
  expect(search).toHaveFocus();
  expect(fireEvent.keyDown(search, { key: ' ' })).toBe(true);
  expect(search).toHaveAttribute('aria-controls', 'search-type-listbox');
  fireEvent.keyDown(search, { key: 'ArrowDown' });
  const highlighted = screen.getByRole('option', { name: 'Option 0' });
  expect(search).toHaveAttribute('aria-activedescendant', highlighted.id);
  expect(highlighted).toHaveAccessibleDescription(
    'Included through parent type'
  );
  expect(trigger).not.toHaveAttribute('aria-activedescendant');
  expect(await axe(container)).toHaveNoViolations();
});

it('keeps search and focus stable through count changes until the dropdown reopens', () => {
  const options = Array.from({ length: 9 }, (_, i) => ({
    value: String(i),
    label: `Option ${i}`,
  }));
  const view = currentOptions => (
    <SelectDropdown
      id="threshold"
      label="Type"
      options={currentOptions}
      value={[]}
      multiple
      onChange={() => {}}
    />
  );
  const { rerender } = render(view(options));
  const trigger = screen.getByRole('button');
  fireEvent.click(trigger);
  const search = screen.getByRole('combobox');
  fireEvent.change(search, { target: { value: 'Option 2' } });
  rerender(view(options.slice(0, 8)));
  expect(search).toBeInTheDocument();
  expect(search).toHaveFocus();
  expect(search).toHaveValue('Option 2');
  expect(screen.getAllByRole('option')).toHaveLength(1);
  fireEvent.keyDown(search, { key: 'Escape' });
  fireEvent.click(trigger);
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(screen.getAllByRole('option')).toHaveLength(8);
  rerender(view(options));
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  fireEvent.keyDown(trigger, { key: 'Escape' });
  fireEvent.click(trigger);
  expect(screen.getByRole('combobox')).toHaveFocus();
});

it.each([2, 9])(
  'returns focus to the owning control after a pointer selection with %i options',
  count => {
    render(
      <SelectDropdown
        label="Type"
        options={Array.from({ length: count }, (_, i) => ({
          value: String(i),
          label: `Option ${i}`,
        }))}
        multiple
        value={[]}
        onChange={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    const owner = screen.queryByRole('combobox') || screen.getByRole('button');
    owner.focus();
    owner.blur(); // Native pointer mousedown on the non-focusable option blurs it.
    fireEvent.click(screen.getByRole('option', { name: 'Option 0' }));
    expect(owner).toHaveFocus();
  }
);

it('consumes Escape for the open dropdown before its enclosing drawer', () => {
  const onDrawerKeyDown = jest.fn();
  render(
    <div onKeyDown={onDrawerKeyDown}>
      <SelectDropdown
        label="Type"
        options={OPTIONS}
        value={[]}
        multiple
        onChange={() => {}}
      />
    </div>
  );
  const trigger = screen.getByRole('button');
  fireEvent.click(trigger);
  fireEvent.keyDown(trigger, { key: 'Escape' });
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(onDrawerKeyDown).not.toHaveBeenCalled();
  fireEvent.keyDown(trigger, { key: 'Escape' });
  expect(onDrawerKeyDown).toHaveBeenCalledTimes(1);
});
