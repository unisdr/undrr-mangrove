/**
 * @file SortOptions.test.jsx
 * @description Which sorts the Sort dropdown offers.
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import {
  SearchProvider,
  useSearchDispatch,
  actions,
} from '../context/SearchContext';
import { SortOptions } from '../components/SortOptions';

jest.mock('../components/SelectDropdown', () => ({
  SelectDropdown: ({ options }) => (
    <ul>
      {options.map(option => (
        <li key={option.value} data-value={option.value}>
          {option.label}
        </li>
      ))}
    </ul>
  ),
}));

let dispatch;
function DispatchCapture() {
  dispatch = useSearchDispatch();
  return null;
}

const renderSort = config =>
  render(
    <SearchProvider config={config}>
      <DispatchCapture />
      <SortOptions widgetId="test" />
    </SearchProvider>
  );

const offered = () =>
  Array.from(document.querySelectorAll('[data-value]')).map(
    el => el.dataset.value
  );

describe('SortOptions', () => {
  it('offers relevance, newest and oldest by default', () => {
    renderSort({ defaultSort: 'relevance' });
    expect(offered()).toEqual(['relevance', 'newest', 'oldest']);
  });

  it.each(['eventDateAsc', 'eventDateDesc'])(
    'adds both event date sorts when defaultSort is %s',
    defaultSort => {
      renderSort({ defaultSort });
      expect(offered()).toEqual([
        'relevance',
        'newest',
        'oldest',
        'eventDateAsc',
        'eventDateDesc',
      ]);
      expect(
        screen.getByText('Event date (earliest first)')
      ).toBeInTheDocument();
      expect(screen.getByText('Event date (latest first)')).toBeInTheDocument();
    }
  );

  it('adds them when the current sort is an event date sort, e.g. from a shared link', () => {
    renderSort({ defaultSort: 'newest' });
    act(() => {
      dispatch(actions.setSort('eventDateDesc'));
    });
    expect(offered()).toContain('eventDateDesc');
  });
});
