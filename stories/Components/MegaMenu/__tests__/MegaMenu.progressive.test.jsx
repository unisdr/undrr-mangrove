import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import MegaMenu from '../MegaMenu';

const sections = [
  {
    title: 'About',
    bannerHeading: 'Our mandate',
    bannerDescription: '<p>Authored introduction</p>',
    bannerButton: { label: 'About overview', url: '/about' },
    items: [
      {
        title: 'News',
        url: '/news',
        items: [{ title: 'Awards', url: '/awards' }],
      },
    ],
  },
  { title: 'Search', url: '/search' },
];

function openMenu(props = {}) {
  const rendered = render(<MegaMenu sections={sections} {...props} />);
  const opener = screen.getByRole('button', { name: 'Open navigation menu' });
  opener.focus();
  fireEvent.click(opener);
  return { ...rendered, opener, dialog: screen.getByRole('dialog') };
}

describe('mobile progressive menu', () => {
  it('starts closed and exposes expanded state and a matching control target', () => {
    render(<MegaMenu sections={sections} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const opener = screen.getByRole('button', { name: 'Open navigation menu' });
    expect(opener).toHaveAttribute('aria-expanded', 'false');
    expect(
      document.getElementById(opener.getAttribute('aria-controls'))
    ).toHaveAttribute('hidden');
  });

  it('drills into nested groups without losing parent destinations or authored content', () => {
    const { dialog } = openMenu();
    fireEvent.click(within(dialog).getByRole('button', { name: 'About' }));
    expect(
      within(dialog).getByRole('heading', { name: 'About' })
    ).toHaveFocus();
    expect(within(dialog).getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/about'
    );
    expect(
      within(dialog).getByText('Authored introduction')
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'News' }));
    expect(within(dialog).getByRole('link', { name: 'News' })).toHaveAttribute(
      'href',
      '/news'
    );
    expect(
      within(dialog).getByRole('link', { name: 'Awards' })
    ).toHaveAttribute('href', '/awards');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Back' }));
    expect(within(dialog).getByRole('button', { name: 'News' })).toHaveFocus();
  });

  it('restores overview scroll and focus when returning, and opener focus on Escape', () => {
    const { dialog, opener } = openMenu();
    dialog.scrollTop = 180;
    fireEvent.click(within(dialog).getByRole('button', { name: 'About' }));
    expect(dialog.scrollTop).toBe(0);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Back' }));
    expect(dialog.scrollTop).toBe(180);
    expect(within(dialog).getByRole('button', { name: 'About' })).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(opener).toHaveFocus();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('contains keyboard focus and resets the path after Close', () => {
    const { dialog, opener } = openMenu();
    const last = within(dialog).getByRole('link', { name: 'Search' });
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(
      within(dialog).getByRole('button', { name: 'Close mobile navigation' })
    ).toHaveFocus();
    fireEvent.click(within(dialog).getByRole('button', { name: 'About' }));
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Close mobile navigation' })
    );
    fireEvent.click(opener);
    expect(
      within(dialog).getByRole('heading', { name: 'All sections' })
    ).toHaveFocus();
  });

  it('accepts older partial labels and cleans up the body lock on unmount', () => {
    const { unmount, dialog } = openMenu({
      labels: { navLabel: 'Custom navigation' },
    });
    expect(
      within(dialog).getByRole('heading', { name: 'All sections' })
    ).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes when the viewport moves to desktop and removes its listener', () => {
    const previous = window.matchMedia;
    let resize;
    const query = {
      matches: false,
      addEventListener: jest.fn((_, callback) => {
        resize = callback;
      }),
      removeEventListener: jest.fn(),
    };
    window.matchMedia = () => query;
    const { unmount } = openMenu();
    act(() => {
      query.matches = true;
      resize();
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
    unmount();
    expect(query.removeEventListener).toHaveBeenCalled();
    window.matchMedia = previous;
  });

  it('preserves content-only sections and distinct parent and banner URLs', () => {
    const data = [
      {
        title: 'Campaign',
        url: '/campaign',
        bannerDescription: '<p>Campaign details</p>',
        bannerButton: { label: 'Join us', url: '/join' },
      },
    ];
    const { dialog } = openMenu({ sections: data });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Campaign' }));
    expect(
      within(dialog).getByRole('link', { name: 'Campaign' })
    ).toHaveAttribute('href', '/campaign');
    expect(
      within(dialog).getByRole('link', { name: 'Join us' })
    ).toHaveAttribute('href', '/join');
    expect(within(dialog).getByText('Campaign details')).toBeInTheDocument();
  });

  it('keeps the current level on equivalent rerenders and recovers when it is removed', () => {
    const { dialog, rerender } = openMenu();
    fireEvent.click(within(dialog).getByRole('button', { name: 'About' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'News' }));
    rerender(<MegaMenu sections={JSON.parse(JSON.stringify(sections))} />);
    expect(
      within(dialog).getByRole('heading', { name: 'News' })
    ).toBeInTheDocument();
    rerender(<MegaMenu sections={[]} />);
    expect(
      within(dialog).getByRole('heading', { name: 'All sections' })
    ).toHaveFocus();
  });

  it('keeps only an inert exit surface and cancels its timer when reopened', () => {
    jest.useFakeTimers();
    try {
      const { dialog, opener } = openMenu();
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Close mobile navigation' })
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(dialog).not.toHaveAttribute('hidden');
      expect(dialog).toHaveAttribute('inert');
      expect(document.body.style.overflow).toBe('');
      fireEvent.click(opener);
      act(() => jest.advanceTimersByTime(200));
      expect(screen.getByRole('dialog')).toBe(dialog);
      expect(dialog).not.toHaveAttribute('inert');
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Close mobile navigation' })
      );
      act(() => jest.advanceTimersByTime(200));
      expect(dialog).toHaveAttribute('hidden');
    } finally {
      jest.useRealTimers();
    }
  });

  it('has no axe violations in the overview and section dialog', async () => {
    const { dialog } = openMenu();
    expect(await axe(dialog)).toHaveNoViolations();
    fireEvent.click(within(dialog).getByRole('button', { name: 'About' }));
    expect(await axe(dialog)).toHaveNoViolations();
  });
});
