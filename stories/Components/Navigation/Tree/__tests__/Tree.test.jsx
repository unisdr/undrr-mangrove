import React, { act } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Tree, TreeItem } from '../Tree';

expect.extend(toHaveNoViolations);

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

    const item1 = document.getElementById('mg-treeitem-1');
    const item2 = document.getElementById('mg-treeitem-2');

    expect(item1).toHaveAttribute('tabindex', '0');
    expect(item2).toHaveAttribute('tabindex', '-1');
  });

  it('toggles expand/collapse on toggle button click', () => {
    const onToggle = jest.fn();
    renderSampleTree({ onToggle });

    const item1 = document.getElementById('mg-treeitem-1');
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

    const item2 = document.getElementById('mg-treeitem-2');
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

    const parent = document.getElementById('mg-treeitem-1');
    const child = document.getElementById('mg-treeitem-1-1');

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

      const item1 = document.getElementById('mg-treeitem-1');
      const item2 = document.getElementById('mg-treeitem-2');

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

      const item1 = document.getElementById('mg-treeitem-1');
      act(() => {
        item1.focus();
      });

      // First ArrowRight expands
      fireEvent.keyDown(item1, { key: 'ArrowRight' });
      expect(item1).toHaveAttribute('aria-expanded', 'true');
      expect(document.activeElement).toBe(item1);

      // Second ArrowRight moves to first child
      const item1_1 = document.getElementById('mg-treeitem-1-1');
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
      const item1 = document.getElementById('mg-treeitem-1');
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

      const item1 = document.getElementById('mg-treeitem-1');
      const item1_1 = document.getElementById('mg-treeitem-1-1');

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

      const item1 = document.getElementById('mg-treeitem-1');
      const item2 = document.getElementById('mg-treeitem-2');

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

      const item2 = document.getElementById('mg-treeitem-2');
      act(() => {
        item2.focus();
      });

      fireEvent.keyDown(item2, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalledWith('2');

      fireEvent.keyDown(item2, { key: ' ' });
      expect(onSelect).toHaveBeenCalledWith('2');
    });
  });

  it('renders link when asLink and href are provided', () => {
    render(
      <Tree>
        <TreeItem id="link-1" label="Link Item" href="/test-path" asLink />
      </Tree>
    );

    const link = screen.getByRole('link', { name: 'Link Item' });
    expect(link).toHaveAttribute('href', '/test-path');
  });

  it('passes axe accessibility tests', async () => {
    const { container } = renderSampleTree({ defaultExpandedIds: ['1'] });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
