import React, { act } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Tree, TreeItem } from '../Tree';

expect.extend(toHaveNoViolations);

const getItem = id => document.querySelector(`[data-mg-treeitem-id="${id}"]`);

describe('Tree and TreeItem', () => {
  const renderSampleTree = (props = {}, itemProps = {}) => {
    return render(
      <Tree {...props}>
        <TreeItem id="1" label="Node 1" {...itemProps}>
          <TreeItem id="1-1" label="Node 1.1" />
          <TreeItem id="1-2" label="Node 1.2">
            <TreeItem id="1-2-1" label="Node 1.2.1" />
          </TreeItem>
        </TreeItem>
        <TreeItem id="2" label="Node 2" />
      </Tree>
    );
  };

  it('renders tree and treeitem with correct ARIA roles', () => {
    const { container } = renderSampleTree();

    const tree = screen.getByRole('tree');
    expect(tree).toBeInTheDocument();
    expect(tree).toHaveClass('mg-tree', 'mg-tree--guides');

    const treeItems = screen.getAllByRole('treeitem');
    expect(treeItems.length).toBe(2); // Initially only visible root items 1 and 2
  });

  it('sets roving tabindex="0" on first treeitem and "-1" on others', () => {
    renderSampleTree();

    const item1 = getItem('1');
    const item2 = getItem('2');

    expect(item1).toHaveAttribute('tabindex', '0');
    expect(item2).toHaveAttribute('tabindex', '-1');
  });

  it('toggles expand/collapse on toggle button click', () => {
    const onToggle = jest.fn();
    renderSampleTree({ onToggle });

    const item1 = getItem('1');
    expect(item1).toHaveAttribute('aria-expanded', 'false');

    const toggleBtn = item1.querySelector('.mg-tree__toggle');
    expect(toggleBtn).toHaveAttribute('aria-hidden', 'true');
    fireEvent.click(toggleBtn);

    expect(item1).toHaveAttribute('aria-expanded', 'true');
    expect(onToggle).toHaveBeenCalledWith('1', true);
    expect(screen.getByText('Node 1.1')).toBeInTheDocument();

    const collapseBtn = item1.querySelector('.mg-tree__toggle');
    fireEvent.click(collapseBtn);

    expect(item1).toHaveAttribute('aria-expanded', 'false');
    expect(onToggle).toHaveBeenCalledWith('1', false);
    expect(screen.queryByText('Node 1.1')).toBeNull();
  });

  it('selects item on click and triggers onSelect callback', () => {
    const onSelect = jest.fn();
    renderSampleTree({ onSelect });

    fireEvent.click(screen.getByText('Node 2'));
    expect(onSelect).toHaveBeenCalledWith('2');

    const item2 = getItem('2');
    expect(item2).toHaveClass('mg-tree__item--selected');
    expect(item2).toHaveAttribute('aria-selected', 'true');
  });

  it('supports controlled expandedIds and selectedId', () => {
    const { rerender } = render(
      <Tree expandedIds={['1']} selectedId="1-1">
        <TreeItem id="1" label="Parent">
          <TreeItem id="1-1" label="Child" />
        </TreeItem>
      </Tree>
    );

    const parent = getItem('1');
    const child = getItem('1-1');

    expect(parent).toHaveAttribute('aria-expanded', 'true');
    expect(child).toHaveAttribute('aria-selected', 'true');
    expect(child).toHaveClass('mg-tree__item--selected');

    // Rerender with collapsed state
    rerender(
      <Tree expandedIds={[]} selectedId="1">
        <TreeItem id="1" label="Parent">
          <TreeItem id="1-1" label="Child" />
        </TreeItem>
      </Tree>
    );

    expect(parent).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Child')).toBeNull();
    expect(parent).toHaveAttribute('aria-selected', 'true');
  });

  describe('ARIA APG Keyboard Navigation', () => {
    it('navigates with ArrowDown and ArrowUp', () => {
      renderSampleTree();

      const item1 = getItem('1');
      const item2 = getItem('2');

      act(() => {
        item1.focus();
      });
      expect(document.activeElement).toBe(item1);

      fireEvent.keyDown(item1, { key: 'ArrowDown' });
      expect(document.activeElement).toBe(item2);
      expect(item2).toHaveAttribute('tabindex', '0');

      fireEvent.keyDown(item2, { key: 'ArrowUp' });
      expect(document.activeElement).toBe(item1);
      expect(item1).toHaveAttribute('tabindex', '0');
    });

    it('expands collapsed node on ArrowRight, and focuses child on second ArrowRight', () => {
      renderSampleTree();

      const item1 = getItem('1');
      act(() => {
        item1.focus();
      });

      // First ArrowRight expands
      fireEvent.keyDown(item1, { key: 'ArrowRight' });
      expect(item1).toHaveAttribute('aria-expanded', 'true');
      expect(document.activeElement).toBe(item1);

      // Second ArrowRight moves to first child
      const item1_1 = getItem('1-1');
      fireEvent.keyDown(item1, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(item1_1);
    });

    it('swaps ArrowRight and ArrowLeft in RTL', () => {
      render(
        <div dir="rtl" style={{ direction: 'rtl' }}>
          <Tree>
            <TreeItem id="1" label="Node 1">
              <TreeItem id="1-1" label="Node 1.1" />
            </TreeItem>
          </Tree>
        </div>
      );
      const item1 = getItem('1');
      act(() => {
        item1.focus();
      });

      fireEvent.keyDown(item1, { key: 'ArrowLeft' });
      expect(item1).toHaveAttribute('aria-expanded', 'true');

      fireEvent.keyDown(item1, { key: 'ArrowRight' });
      expect(item1).toHaveAttribute('aria-expanded', 'false');
    });

    it('collapses expanded node on ArrowLeft, and moves to parent on child ArrowLeft', () => {
      renderSampleTree({ defaultExpandedIds: ['1'] });

      const item1 = getItem('1');
      const item1_1 = getItem('1-1');

      act(() => {
        item1_1.focus();
      });
      // ArrowLeft on child moves to parent
      fireEvent.keyDown(item1_1, { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(item1);

      // ArrowLeft on open parent collapses it
      fireEvent.keyDown(item1, { key: 'ArrowLeft' });
      expect(item1).toHaveAttribute('aria-expanded', 'false');
    });

    it('moves to first item on Home and last item on End', () => {
      renderSampleTree({ defaultExpandedIds: ['1', '1-2'] });

      const item1 = getItem('1');
      const item2 = getItem('2');

      act(() => {
        item1.focus();
      });
      fireEvent.keyDown(item1, { key: 'End' });
      expect(document.activeElement).toBe(item2);

      fireEvent.keyDown(item2, { key: 'Home' });
      expect(document.activeElement).toBe(item1);
    });

    it('selects and triggers action on Enter and Space', () => {
      const onSelect = jest.fn();
      renderSampleTree({ onSelect });

      const item2 = getItem('2');
      act(() => {
        item2.focus();
      });

      fireEvent.keyDown(item2, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalledWith('2');

      fireEvent.keyDown(item2, { key: ' ' });
      expect(onSelect).toHaveBeenCalledWith('2');
    });
  });

  describe('Enter and Space on a parent', () => {
    const renderParents = props =>
      render(
        <Tree defaultExpandedIds={['topics', 'about']} {...props}>
          <TreeItem id="topics" label="Topics">
            <TreeItem id="floods" label="Floods" href="#floods" asLink />
          </TreeItem>
          <TreeItem id="about" label="About" href="#about" asLink>
            <TreeItem id="team" label="Team" href="#team" asLink />
          </TreeItem>
        </Tree>
      );

    const spyOnLink = name => {
      const spy = jest.fn(e => e.preventDefault());
      screen.getByRole('link', { name }).addEventListener('click', spy);
      return spy;
    };

    it.each(['Enter', ' '])(
      'toggles and selects an expanded unlinked parent on %p, without following its first child link',
      key => {
        const onSelect = jest.fn();
        renderParents({ onSelect });
        const floods = spyOnLink('Floods');
        const topics = getItem('topics');
        act(() => topics.focus());

        fireEvent.keyDown(topics, { key });

        expect(floods).not.toHaveBeenCalled();
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith('topics');
        expect(topics).toHaveAttribute('aria-selected', 'true');
        expect(topics).toHaveAttribute('aria-expanded', 'false');
      }
    );

    it('follows the parent own link, not its child link, on Enter', () => {
      renderParents();
      const about = spyOnLink('About');
      const team = spyOnLink('Team');
      const aboutItem = getItem('about');
      act(() => aboutItem.focus());

      fireEvent.keyDown(aboutItem, { key: 'Enter' });

      expect(about).toHaveBeenCalledTimes(1);
      expect(team).not.toHaveBeenCalled();
    });
  });

  describe('tab stop', () => {
    it('is the selected item rather than the first item', () => {
      renderSampleTree({
        defaultExpandedIds: ['1', '1-2'],
        defaultSelectedId: '1-2-1',
      });
      expect(getItem('1-2-1')).toHaveAttribute('tabindex', '0');
      expect(getItem('1')).toHaveAttribute('tabindex', '-1');
      expect(
        document.querySelectorAll('[role="treeitem"][tabindex="0"]')
      ).toHaveLength(1);
    });

    it('falls back to the nearest visible ancestor of a hidden selected item', () => {
      renderSampleTree({
        defaultExpandedIds: ['1'],
        defaultSelectedId: '1-2-1',
      });
      expect(getItem('1-2')).toHaveAttribute('tabindex', '0');
      expect(getItem('1')).toHaveAttribute('tabindex', '-1');
    });

    it('falls back to the first item when the selected id is not in the tree', () => {
      renderSampleTree({ selectedId: 'missing' });
      expect(getItem('1')).toHaveAttribute('tabindex', '0');
    });

    it('follows focus in the tree and returns to the selected item when focus leaves', () => {
      const onBlur = jest.fn();
      render(
        <>
          <Tree defaultSelectedId="2" onBlur={onBlur}>
            <TreeItem id="1" label="Node 1" />
            <TreeItem id="2" label="Node 2" />
            <TreeItem id="3" label="Node 3" />
          </Tree>
          <button type="button">Outside</button>
        </>
      );
      const item2 = getItem('2');
      act(() => item2.focus());
      fireEvent.keyDown(item2, { key: 'ArrowDown' });
      expect(getItem('3')).toHaveAttribute('tabindex', '0');

      act(() => screen.getByRole('button', { name: 'Outside' }).focus());
      expect(onBlur).toHaveBeenCalled();
      expect(getItem('2')).toHaveAttribute('tabindex', '0');
      expect(getItem('3')).toHaveAttribute('tabindex', '-1');
    });
  });

  it('scopes item DOM ids to each tree', () => {
    render(
      <>
        <Tree aria-label="Desktop">
          <TreeItem id="1" label="Desktop node" />
        </Tree>
        <Tree aria-label="Mobile">
          <TreeItem id="1" label="Mobile node" />
        </Tree>
      </>
    );
    const [desktop, mobile] = screen.getAllByRole('treeitem');
    expect(desktop.id).toMatch(/^mg-tree.*item-1$/);
    expect(mobile.id).toMatch(/^mg-tree.*item-1$/);
    expect(desktop.id).not.toBe(mobile.id);
    expect(document.getElementById(desktop.id)).toBe(desktop);
  });

  it('renders link when asLink and href are provided', () => {
    render(
      <Tree>
        <TreeItem id="link-1" label="Link Item" href="/test-path" asLink />
      </Tree>
    );

    const link = screen.getByRole('link', { name: 'Link Item' });
    expect(link).toHaveAttribute('href', '/test-path');
    expect(link).not.toHaveAttribute('aria-current');
  });

  it('sets aria-current on the link when current is given', () => {
    render(
      <Tree>
        <TreeItem
          id="link-1"
          label="Link Item"
          href="/test-path"
          asLink
          current="page"
        />
        <TreeItem id="plain" label="Plain Item" current="page" />
      </Tree>
    );

    expect(screen.getByRole('link', { name: 'Link Item' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByText('Plain Item')).not.toHaveAttribute('aria-current');
  });

  describe('toggleIcon', () => {
    it('uses mg-icon-right by default', () => {
      const { container } = renderSampleTree();
      const icon = container.querySelector('.mg-tree__icon');
      expect(icon).toHaveClass('mg-icon', 'mg-icon-right');
    });

    it('applies a Tree-level toggleIcon to every toggle', () => {
      const { container } = renderSampleTree({
        toggleIcon: 'mg-icon-arrow-right',
        defaultExpandedIds: ['1'],
      });
      const icons = container.querySelectorAll('.mg-tree__icon');
      expect(icons.length).toBe(2);
      icons.forEach(icon => {
        expect(icon).toHaveClass('mg-icon', 'mg-icon-arrow-right');
        expect(icon).not.toHaveClass('mg-icon-right');
      });
    });

    it('lets a TreeItem override the Tree toggleIcon', () => {
      const { container } = renderSampleTree(
        { toggleIcon: 'mg-icon-arrow-right' },
        { toggleIcon: 'mg-icon-plus' }
      );
      const icon = container.querySelector(
        '[data-mg-treeitem-id="1"] > .mg-tree__label-container .mg-tree__icon'
      );
      expect(icon).toHaveClass('mg-icon-plus');
      expect(icon).not.toHaveClass('mg-icon-arrow-right');
    });

    it('keeps the expanded class with a custom glyph', () => {
      const { container } = renderSampleTree({
        toggleIcon: 'mg-icon-arrow-right',
        defaultExpandedIds: ['1'],
      });
      const icon = container.querySelector('.mg-tree__icon');
      expect(icon).toHaveClass('mg-icon-arrow-right', 'is-expanded');
    });
  });

  it('passes axe accessibility tests', async () => {
    const { container } = renderSampleTree({ defaultExpandedIds: ['1'] });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
