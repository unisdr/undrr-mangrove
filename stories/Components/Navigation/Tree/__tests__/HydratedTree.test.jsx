import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import createHydrator from '../../../../../src/hydrate';
import { HydratedTree } from '../HydratedTree';
import { TreeItem } from '../Tree';
import fromElement from '../Tree.fromElement';

expect.extend(toHaveNoViolations);

const getItem = id => document.querySelector(`[data-mg-treeitem-id="${id}"]`);

const MARKUP = `
  <ul>
    <li data-id="about" data-expanded>
      <a href="/about">About</a>
      <ul>
        <li data-id="team"><a href="/about/team" aria-current="page">Team</a></li>
        <li data-id="history"><a href="/about/history">History</a></li>
      </ul>
    </li>
    <li data-id="topics">
      Topics
      <ul>
        <li data-id="floods">Floods</li>
      </ul>
    </li>
    <li data-id="contact"><a href="/contact">Contact</a></li>
  </ul>`;

function mountContainer(attrs = {}) {
  const container = document.createElement('div');
  container.setAttribute('data-mg-tree', '');
  container.setAttribute('data-aria-label', 'Section navigation');
  Object.entries(attrs).forEach(([key, value]) => {
    container.setAttribute(`data-${key}`, value);
  });
  container.innerHTML = MARKUP;
  document.body.appendChild(container);
  return container;
}

describe('HydratedTree', () => {
  let hydrator;

  afterEach(() => {
    if (hydrator) {
      act(() => hydrator.unmountAll());
      hydrator = null;
    }
    document.body.innerHTML = '';
  });

  const hydrate = () => {
    act(() => {
      hydrator = createHydrator({
        selector: '[data-mg-tree]',
        component: HydratedTree,
        fromElement,
      });
    });
  };

  it('hydrates a nested list into an accessible tree', async () => {
    const container = mountContainer();
    hydrate();

    const tree = screen.getByRole('tree', { name: 'Section navigation' });
    expect(container).toHaveAttribute('data-mg-hydrated', 'true');
    expect(tree).toHaveClass('mg-tree', 'mg-tree--guides');

    const about = getItem('about');
    expect(about).toHaveAttribute('aria-expanded', 'true');
    expect(getItem('topics')).toHaveAttribute('aria-expanded', 'false');
    expect(getItem('team')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Team').closest('a')).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByText('History').closest('a')).toHaveAttribute(
      'href',
      '/about/history'
    );
    expect(screen.getByText('History').closest('a')).not.toHaveAttribute(
      'aria-current'
    );
    expect(screen.queryByText('Floods')).not.toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('supports the same keyboard navigation as Tree', () => {
    mountContainer();
    hydrate();

    // The selected item, not the first one, is the tab stop.
    const about = getItem('about');
    expect(about).toHaveAttribute('tabindex', '-1');
    expect(getItem('team')).toHaveAttribute('tabindex', '0');

    act(() => about.focus());
    act(() => {
      fireEvent.keyDown(about, { key: 'ArrowDown' });
    });
    const team = getItem('team');
    expect(document.activeElement).toBe(team);
    expect(team).toHaveAttribute('tabindex', '0');

    act(() => {
      fireEvent.keyDown(document.activeElement, { key: 'End' });
    });
    expect(document.activeElement).toBe(getItem('contact'));

    const topics = getItem('topics');
    act(() => topics.focus());
    act(() => {
      fireEvent.keyDown(topics, { key: 'ArrowRight' });
    });
    expect(topics).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Floods')).toBeInTheDocument();
  });

  it('toggles an unlinked parent on Enter without following a child link', () => {
    const container = mountContainer();
    container.innerHTML = container.innerHTML.replace(
      '<li data-id="floods">Floods</li>',
      '<li data-id="floods"><a href="#floods">Floods</a></li>'
    );
    hydrate();

    const topics = getItem('topics');
    act(() => topics.focus());
    act(() => {
      fireEvent.keyDown(topics, { key: 'ArrowRight' });
    });
    const floodsLink = screen.getByRole('link', { name: 'Floods' });
    const followed = jest.fn(e => e.preventDefault());
    floodsLink.addEventListener('click', followed);

    act(() => {
      fireEvent.keyDown(topics, { key: 'Enter' });
    });
    expect(followed).not.toHaveBeenCalled();
    expect(topics).toHaveAttribute('aria-expanded', 'false');
    expect(topics).toHaveAttribute('aria-selected', 'true');
    expect(getItem('team')).toHaveAttribute('aria-selected', 'false');
  });

  it('gives two trees with the same data-ids unique DOM ids', () => {
    mountContainer();
    mountContainer();
    hydrate();

    const trees = screen.getAllByRole('tree');
    expect(trees).toHaveLength(2);
    const ids = Array.from(document.querySelectorAll('[id]'), el => el.id);
    expect(new Set(ids).size).toBe(ids.length);

    const [first, second] = trees.map(tree =>
      tree.querySelector('[data-mg-treeitem-id="team"]')
    );
    expect(first.id).not.toBe(second.id);

    // Keyboard navigation stays within each tree.
    act(() => second.focus());
    act(() => {
      fireEvent.keyDown(second, { key: 'ArrowDown' });
    });
    expect(document.activeElement).toBe(
      trees[1].querySelector('[data-mg-treeitem-id="history"]')
    );
    expect(
      trees[0].querySelector('[data-mg-treeitem-id="team"]')
    ).toHaveAttribute('tabindex', '0');
  });

  it('applies data-toggle-icon to every toggle', () => {
    mountContainer({ 'toggle-icon': 'mg-icon-arrow-right', guides: 'false' });
    hydrate();

    const icons = document.querySelectorAll('.mg-tree__icon');
    expect(icons.length).toBe(2);
    icons.forEach(icon => {
      expect(icon).toHaveClass('mg-icon', 'mg-icon-arrow-right');
      expect(icon).not.toHaveClass('mg-icon-right');
    });
    expect(screen.getByRole('tree')).not.toHaveClass('mg-tree--guides');
  });

  it('passes children through when no items are given', () => {
    render(
      <HydratedTree aria-label="Plain">
        <TreeItem id="only" label="Only item" />
      </HydratedTree>
    );
    expect(
      screen.getByRole('treeitem', { name: 'Only item' })
    ).toBeInTheDocument();
  });
});
