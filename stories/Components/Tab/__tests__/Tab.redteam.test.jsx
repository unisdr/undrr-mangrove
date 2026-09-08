import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Tab } from '../Tab';
import { mgTabsDestroy } from '../../../assets/js/tabs';

const tabdata = [
  {
    text: 'First',
    text_id: 'red-first',
    data: '<input aria-label="First input" />',
  },
  {
    text: 'Second',
    text_id: 'red-second',
    data: '<input aria-label="Second input" />',
  },
];

afterEach(() => {
  mgTabsDestroy(document);
  cleanup();
});

test('preserves active panel and focused control when React receives equivalent data', () => {
  const result = render(<Tab tabdata={tabdata} />);
  fireEvent.click(screen.getByRole('tab', { name: 'Second' }));
  const input = screen.getByRole('textbox', { name: 'Second input' });
  input.focus();
  input.value = 'in progress';
  result.rerender(<Tab tabdata={[...tabdata]} />);
  expect(screen.getByRole('tab', { name: 'Second' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  expect(input).toBeVisible();
  expect(input).toHaveFocus();
  expect(input).toHaveValue('in progress');
});

test('preserves independent disclosure state when React receives equivalent data', () => {
  const result = render(<Tab tabdata={tabdata} variant="stacked" />);
  fireEvent.click(screen.getByRole('button', { name: 'Second' }));
  result.rerender(<Tab tabdata={[...tabdata]} variant="stacked" />);
  expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute(
    'aria-expanded',
    'true'
  );
  expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute(
    'aria-expanded',
    'true'
  );
});

test('preserves selected panel while updating the accessible group label', () => {
  const result = render(<Tab tabdata={tabdata} />);
  fireEvent.click(screen.getByRole('tab', { name: 'Second' }));
  result.rerender(
    <Tab tabdata={tabdata} labels={{ tabListLabel: 'Translated sections' }} />
  );
  expect(screen.getByRole('tablist')).toHaveAttribute(
    'aria-label',
    'Translated sections'
  );
  expect(screen.getByRole('tab', { name: 'Second' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
});

test('falls back to an available panel when React removes the selected panel', () => {
  const result = render(<Tab tabdata={tabdata} />);
  fireEvent.click(screen.getByRole('tab', { name: 'Second' }));
  screen.getByRole('textbox', { name: 'Second input' }).focus();
  result.rerender(<Tab tabdata={[tabdata[0]]} />);
  expect(screen.getByRole('tab', { name: 'First' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  expect(screen.getByRole('textbox', { name: 'First input' })).toBeVisible();
  expect(document.activeElement.closest('[hidden]')).toBeNull();
});

test('preserves selection by panel ID after React reorders data', () => {
  const result = render(<Tab tabdata={tabdata} />);
  fireEvent.click(screen.getByRole('tab', { name: 'Second' }));
  result.rerender(<Tab tabdata={[tabdata[1], tabdata[0]]} />);
  expect(screen.getByRole('tab', { name: 'Second' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  expect(screen.getByRole('textbox', { name: 'Second input' })).toBeVisible();
});

test('preserves an active disclosure filter across equivalent React data updates', () => {
  const result = render(<Tab tabdata={tabdata} variant="stacked" filterable />);
  const filter = screen.getByRole('searchbox');
  filter.focus();
  fireEvent.change(filter, { target: { value: 'Second' } });
  fireEvent(filter, new Event('search', { bubbles: true }));
  expect(
    screen.getByRole('button', { name: 'First' }).closest('li')
  ).toHaveClass('mg-tabs__item--hidden');
  result.rerender(<Tab tabdata={[...tabdata]} variant="stacked" filterable />);
  expect(screen.getByRole('searchbox')).toHaveValue('Second');
  expect(screen.getByRole('searchbox')).toHaveFocus();
  expect(
    screen.getByRole('button', { name: 'First' }).closest('li')
  ).toHaveClass('mg-tabs__item--hidden');
});

test('preserves live controls when equivalent data objects are freshly copied', () => {
  const result = render(<Tab tabdata={tabdata} />);
  fireEvent.click(screen.getByRole('tab', { name: 'Second' }));
  const input = screen.getByRole('textbox', { name: 'Second input' });
  input.focus();
  input.value = 'unsaved';
  result.rerender(<Tab tabdata={tabdata.map(tab => ({ ...tab }))} />);
  expect(screen.getByRole('textbox', { name: 'Second input' })).toBe(input);
  expect(input).toHaveFocus();
  expect(input).toHaveValue('unsaved');
});

test('updates actual HTML changes while retaining the selected panel', () => {
  const result = render(<Tab tabdata={tabdata} />);
  fireEvent.click(screen.getByRole('tab', { name: 'Second' }));
  const updated = tabdata.map(tab =>
    tab.text_id === 'red-second'
      ? { ...tab, data: '<p>Updated panel content</p>' }
      : tab
  );
  result.rerender(<Tab tabdata={updated} />);
  expect(screen.getByRole('tab', { name: 'Second' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  expect(screen.getByText('Updated panel content')).toBeVisible();
  expect(screen.queryByRole('textbox', { name: 'Second input' })).toBeNull();
});

test('applies singleOpen to subsequent interactions while retaining existing disclosure state', () => {
  const result = render(<Tab tabdata={tabdata} variant="stacked" />);
  fireEvent.click(screen.getByRole('button', { name: 'Second' }));
  result.rerender(<Tab tabdata={tabdata} variant="stacked" singleOpen />);
  expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute(
    'aria-expanded',
    'true'
  );
  expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute(
    'aria-expanded',
    'true'
  );
  fireEvent.click(screen.getByRole('button', { name: 'Second' }));
  fireEvent.click(screen.getByRole('button', { name: 'Second' }));
  expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute(
    'aria-expanded',
    'false'
  );
  expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute(
    'aria-expanded',
    'true'
  );
  expect(
    screen
      .getAllByRole('button')
      .filter(button => button.getAttribute('aria-expanded') === 'true')
  ).toHaveLength(1);
});
