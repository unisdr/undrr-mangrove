import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import createHydrator from '../../../../../src/hydrate';
import { HydratedTree } from '../HydratedTree';
import { TreeItem } from '../Tree';
import fromElement from '../Tree.fromElement';

expect.extend(toHaveNoViolations);

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

    const about = document.getElementById('mg-treeitem-about');
    expect(about).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('mg-treeitem-topics')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(document.getElementById('mg-treeitem-team')).toHaveAttribute(
      'aria-selected',
      'true'
    );
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

    const about = document.getElementById('mg-treeitem-about');
    expect(about).toHaveAttribute('tabindex', '0');

    act(() => about.focus());
    act(() => {
      fireEvent.keyDown(about, { key: 'ArrowDown' });
    });
    const team = document.getElementById('mg-treeitem-team');
    expect(document.activeElement).toBe(team);
    expect(team).toHaveAttribute('tabindex', '0');

    act(() => {
      fireEvent.keyDown(document.activeElement, { key: 'End' });
    });
    expect(document.activeElement).toBe(
      document.getElementById('mg-treeitem-contact')
    );

    const topics = document.getElementById('mg-treeitem-topics');
    act(() => topics.focus());
    act(() => {
      fireEvent.keyDown(topics, { key: 'ArrowRight' });
    });
    expect(topics).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Floods')).toBeInTheDocument();
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
