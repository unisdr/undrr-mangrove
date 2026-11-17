import { render, screen, fireEvent, within } from '@testing-library/react';
import MegaMenu from '../MegaMenu';
import * as filterUtils from '../filterUtils';

afterEach(() => jest.restoreAllMocks());

it('defers the mobile search traversal until typing and reuses it between keystrokes', () => {
  const flatten = jest.spyOn(filterUtils, 'flattenMenuItems');
  const sections = [
    { title: 'About', items: [{ title: 'Careers', url: '/careers' }] },
  ];
  const { rerender } = render(<MegaMenu sections={sections} enableFilter />);
  expect(flatten).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
  const input = within(screen.getByRole('dialog')).getByRole('searchbox');
  expect(flatten).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: 'care' } });
  expect(flatten).toHaveBeenCalledTimes(1);
  fireEvent.change(input, { target: { value: 'career' } });
  expect(flatten).toHaveBeenCalledTimes(1);
  rerender(
    <MegaMenu
      enableFilter
      sections={[
        { title: 'About', items: [{ title: 'Career advice', url: '/advice' }] },
      ]}
    />
  );
  expect(flatten).toHaveBeenCalledTimes(2);
  expect(
    within(screen.getByRole('dialog')).getByRole('link', {
      name: /Career advice/,
    })
  ).toHaveAttribute('href', '/advice');
});

it('reads shared ancestor styles once per Tab and rechecks them after visibility changes', () => {
  render(
    <MegaMenu
      sections={[
        {
          title: 'About',
          bannerDescription:
            '<div data-test-links><a href="/first">First authored</a><a href="/last">Last authored</a></div>',
        },
      ]}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'About' }));
  const close = within(dialog).getByRole('button', {
    name: 'Close mobile navigation',
  });
  const back = within(dialog).getByRole('button', { name: 'Back' });
  const last = within(dialog).getByRole('link', { name: 'Last authored' });
  const shared = last.parentElement;
  last.focus();
  const readStyle = jest.spyOn(window, 'getComputedStyle');
  fireEvent.keyDown(last, { key: 'Tab' });
  expect(
    readStyle.mock.calls.filter(([element]) => element === shared)
  ).toHaveLength(1);
  expect(close).toHaveFocus();
  shared.style.display = 'none';
  readStyle.mockClear();
  fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
  expect(
    readStyle.mock.calls.filter(([element]) => element === shared)
  ).toHaveLength(1);
  expect(back).toHaveFocus();
});
