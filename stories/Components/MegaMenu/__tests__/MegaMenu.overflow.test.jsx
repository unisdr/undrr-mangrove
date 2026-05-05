/**
 * Overflow boundary tests for MegaMenu panel layout.
 *
 * JSDOM does not compute CSS layout, so we cannot assert scroll bars or
 * pixel heights. What we CAN assert is that the React layer never truncates
 * content: all groups and all items must be present in the DOM. Any future
 * regression that limits rendered items (JS pagination, slice(), etc.) will
 * fail here before it reaches CSS.
 *
 * The fixture uses 12 groups × 8 items — enough to overflow a 70vh panel
 * at every standard desktop resolution.
 */
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import MegaMenu from '../MegaMenu';

const GROUP_COUNT = 12;
const ITEMS_PER_GROUP = 8;

const groups = Array.from({ length: GROUP_COUNT }, (_, i) => ({
  title: `Group ${i + 1}`,
  url: `/group-${i + 1}`,
  items: Array.from({ length: ITEMS_PER_GROUP }, (_, j) => ({
    title: `Group ${i + 1} Item ${j + 1}`,
    url: `/group-${i + 1}/item-${j + 1}`,
  })),
}));

const sections = [
  {
    title: 'Overflow Test',
    bannerHeading: 'Overflow Test',
    bannerDescription: 'Tests panel overflow behaviour with many groups and items.',
    items: groups,
  },
];

describe('MegaMenu panel overflow', () => {
  it('renders all left-nav groups in the DOM with no JS truncation', () => {
    render(<MegaMenu sections={sections} />);

    // The section panel is always in the DOM; CSS visibility is controlled by
    // the active class. All groups must be present regardless of panel height.
    const nav = document.querySelector('.mg-mega-content__section-list');
    expect(nav).not.toBeNull();
    expect(nav.querySelectorAll('.mg-mega-content__section-list-item')).toHaveLength(GROUP_COUNT);

    groups.forEach(({ title }) => {
      expect(within(nav).getByText(title)).toBeInTheDocument();
    });
  });

  it('updates the right pane when a left-nav group is hovered', () => {
    render(<MegaMenu sections={sections} />);

    // Hover group 5 (not the default first group) via the section-list link.
    // setItemIndex is a direct state update — no timer needed here.
    const groupFiveItem = screen
      .getAllByRole('menuitem', { name: /^Group 5$/ })
      .find(el => el.closest('.mg-mega-content__section-list-item'));
    fireEvent.mouseEnter(groupFiveItem.closest('.mg-mega-content__section-list-item'));

    // All 8 items for Group 5 should now appear in the desktop right pane
    const desktopMenu = document.querySelector('.mg-mega-content__menu--desktop');
    expect(desktopMenu).not.toBeNull();

    groups[4].items.forEach(({ title }) => {
      expect(within(desktopMenu).getByText(title)).toBeInTheDocument();
    });
  });

  it('renders all items for all groups in the mobile menu without truncation', () => {
    render(<MegaMenu sections={sections} />);

    // Mobile menu renders all items flat — a complete DOM snapshot for all groups
    const mobileMenu = document.querySelector('.mg-mega-content__menu--mobile');
    expect(mobileMenu).not.toBeNull();

    groups.forEach(group => {
      group.items.forEach(({ title }) => {
        expect(within(mobileMenu).getByText(title)).toBeInTheDocument();
      });
    });
  });
});
