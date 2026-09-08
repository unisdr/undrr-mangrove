import { render, screen, fireEvent, within } from '@testing-library/react';
import MegaMenu from '../MegaMenu';

function openMenu(sections) {
  const view = render(<MegaMenu sections={sections} />);
  fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
  return { ...view, dialog: screen.getByRole('dialog') };
}

describe('MegaMenu red-team regressions', () => {
  it('does not steal page focus when a closed desktop menu first mounts', () => {
    const previous = window.matchMedia;
    window.matchMedia = () => ({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
    const before = document.createElement('button');
    before.textContent = 'Existing focused control';
    document.body.append(before);
    before.focus();
    try {
      render(<MegaMenu sections={[{ title: 'About', items: [] }]} />);
      expect(before).toHaveFocus();
    } finally {
      before.remove();
      window.matchMedia = previous;
    }
  });

  it('does not include nested summaries hidden by an outer closed disclosure in the focus loop', () => {
    const { dialog } = openMenu([
      {
        title: 'About',
        bannerHeading: 'Introduction',
        bannerDescription:
          '<details><summary>Outer disclosure</summary><details><summary>Hidden nested disclosure</summary></details></details>',
      },
    ]);
    fireEvent.click(within(dialog).getByRole('button', { name: 'About' }));
    within(dialog).getByText('Introduction').closest('details').open = true;
    const back = within(dialog).getByRole('button', { name: 'All sections' });
    back.focus();
    fireEvent.keyDown(back, { key: 'Tab', shiftKey: true });
    expect(within(dialog).getByText('Outer disclosure')).toHaveFocus();
  });

  it('allows native Tab from an expanded introduction into its authored form fields', () => {
    const { dialog } = openMenu([
      {
        title: 'Search',
        bannerHeading: 'Search this site',
        bannerDescription:
          '<form><label>Search terms<input name="q" /></label></form>',
      },
    ]);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Search' }));
    const summary = within(dialog).getByText('Search this site');
    summary.closest('details').open = true;
    summary.focus();
    const tab = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    fireEvent(summary, tab);
    expect(tab.defaultPrevented).toBe(false);
    expect(summary).toHaveFocus();
  });

  it('wraps Tab from the final authored input to the first control', () => {
    const { dialog } = openMenu([
      {
        title: 'Search',
        bannerHeading: 'Search this site',
        bannerDescription:
          '<form><label>Search terms<input name="q" /></label></form>',
      },
    ]);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Search' }));
    within(dialog).getByText('Search this site').closest('details').open = true;
    const input = within(dialog).getByRole('textbox', { name: 'Search terms' });
    input.focus();
    const tab = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    fireEvent(input, tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(
      within(dialog).getByRole('button', { name: 'All sections' })
    ).toHaveFocus();
  });

  it('restores focus within an open level when data updates remove the focused link', () => {
    const { dialog, rerender } = openMenu([
      {
        title: 'About',
        items: [{ title: 'News', url: '/news' }],
      },
    ]);
    fireEvent.click(within(dialog).getByRole('button', { name: 'About' }));
    within(dialog).getByRole('link', { name: 'News' }).focus();
    rerender(<MegaMenu sections={[{ title: 'About', items: [] }]} />);
    expect(
      within(dialog).getByRole('heading', { name: 'About' })
    ).toHaveFocus();
  });
});
