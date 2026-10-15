/**
 * @file SyndicationSearchWidget.typing.test.jsx
 * @description Fast typing keeps every keystroke while the deferred query
 * lags behind the input.
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SyndicationSearchWidget } from '../SyndicationSearchWidget';

// useDeferredValue in a real browser keeps returning an older value while
// the reader types on. Reproduce that lag deterministically: the deferred
// value catches up LAG_MS after each change, so it trails the input by a
// keystroke or two.
const LAG_MS = 10;
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useTransition: () => [false, fn => fn()],
    useDeferredValue: value => {
      const [lagged, setLagged] = actual.useState(value);
      actual.useEffect(() => {
        setTimeout(() => setLagged(value), 10);
      }, [value]);
      return lagged;
    },
  };
});

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        hits: { hits: [], total: { value: 0 } },
        took: 1,
        results: [],
      }),
  });
});

afterEach(() => {
  jest.useRealTimers();
});

it('keeps every keystroke when typing fast', async () => {
  jest.useFakeTimers();
  render(
    <SyndicationSearchWidget
      config={{ enableHashSync: false, debounceDelay: 1000 }}
    />
  );
  const input = screen.getByRole('searchbox');
  const text = 'earthquake damage';

  // Type like a reader: each key is appended to whatever the box shows,
  // with the deferred query catching up between keys.
  for (const char of text) {
    fireEvent.change(input, { target: { value: input.value + char } });
    act(() => {
      jest.advanceTimersByTime(LAG_MS / 2 + 1);
    });
  }
  act(() => {
    jest.advanceTimersByTime(LAG_MS * 2);
  });

  expect(input).toHaveValue(text);
});
