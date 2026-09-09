import { render, screen, fireEvent, within, act } from '@testing-library/react';
import MegaMenu from '../MegaMenu';

const sections = [{ title: 'About', items: [{ title: 'News', url: '/news' }] }];

it('dismisses from the backdrop, retains the current level only during exit, and releases focus', () => {
  jest.useFakeTimers();
  try {
    const { container, unmount } = render(<MegaMenu sections={sections} />);
    const opener = screen.getByRole('button', { name: 'Open navigation menu' });
    fireEvent.click(opener);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'About' }));
    const backdrop = container.querySelector('.mg-mega-mobile-sidebar-overlay');
    backdrop.focus();
    fireEvent.click(backdrop);
    expect(opener).toHaveFocus();
    expect(dialog).toHaveAttribute('aria-hidden', 'true');
    expect(dialog).toHaveAttribute('inert');
    expect(dialog.querySelector('h2')).toHaveTextContent('About');
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    expect(outside).toHaveFocus();
    outside.remove();
    act(() => jest.advanceTimersByTime(179));
    expect(dialog).not.toHaveAttribute('hidden');
    act(() => jest.advanceTimersByTime(1));
    expect(dialog).toHaveAttribute('hidden');
    expect(
      container.querySelector('.mg-mega-mobile-sidebar-overlay')
    ).toBeNull();
    fireEvent.click(opener);
    expect(
      within(dialog).getByRole('heading', { name: 'All sections' })
    ).toHaveFocus();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Close mobile navigation' })
    );
    unmount();
    expect(document.body.style.overflow).toBe('');
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    jest.useRealTimers();
  }
});

it('resets a retained nested level when rapidly reopened and keeps the reopened focus trap', () => {
  jest.useFakeTimers();
  try {
    render(<MegaMenu sections={sections} />);
    const opener = screen.getByRole('button', { name: 'Open navigation menu' });
    fireEvent.click(opener);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'About' }));
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Close mobile navigation' })
    );
    act(() => jest.advanceTimersByTime(100));
    fireEvent.click(opener);
    act(() => jest.advanceTimersByTime(100));
    expect(
      within(dialog).getByRole('heading', { name: 'All sections' })
    ).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    opener.focus();
    expect(
      within(dialog).getByRole('heading', { name: 'All sections' })
    ).toHaveFocus();
  } finally {
    jest.useRealTimers();
  }
});
