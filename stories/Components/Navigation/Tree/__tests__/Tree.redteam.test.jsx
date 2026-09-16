import React, { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Tree, TreeItem } from '../Tree';

describe('Tree Red-Team Security & Stress Regressions', () => {
  it('supports deeply nested hierarchies (6+ levels) with continuous roving tabindex', () => {
    const { container } = render(
      <Tree defaultExpandedIds={['l1', 'l2', 'l3', 'l4', 'l5']}>
        <TreeItem id="l1" label="Level 1">
          <TreeItem id="l2" label="Level 2">
            <TreeItem id="l3" label="Level 3">
              <TreeItem id="l4" label="Level 4">
                <TreeItem id="l5" label="Level 5">
                  <TreeItem id="l6" label="Level 6 Deepest" />
                </TreeItem>
              </TreeItem>
            </TreeItem>
          </TreeItem>
        </TreeItem>
      </Tree>
    );

    const l1 = document.getElementById('mg-treeitem-l1');

    act(() => {
      l1.focus();
    });
    expect(document.activeElement).toBe(l1);

    // Navigate to end directly
    act(() => {
      fireEvent.keyDown(l1, { key: 'End' });
    });
    const l6 = document.getElementById('mg-treeitem-l6');
    expect(document.activeElement).toBe(l6);
    expect(l6).toHaveAttribute('tabindex', '0');

    // Navigate to home directly
    act(() => {
      fireEvent.keyDown(l6, { key: 'Home' });
    });
    const topItem = document.getElementById('mg-treeitem-l1');
    expect(document.activeElement).toBe(topItem);
    expect(topItem).toHaveAttribute('tabindex', '0');
  });

  it('safely handles navigation boundary conditions without throwing', () => {
    const { container } = render(
      <Tree>
        <TreeItem id="single" label="Single Item" />
      </Tree>
    );

    const single = container.querySelector('[data-mg-treeitem-id="single"]');
    act(() => {
      single.focus();
    });

    // Up at top
    expect(() =>
      act(() => {
        fireEvent.keyDown(single, { key: 'ArrowUp' });
      })
    ).not.toThrow();

    // Down at bottom
    expect(() =>
      act(() => {
        fireEvent.keyDown(single, { key: 'ArrowDown' });
      })
    ).not.toThrow();

    // Left on collapsed leaf
    expect(() =>
      act(() => {
        fireEvent.keyDown(single, { key: 'ArrowLeft' });
      })
    ).not.toThrow();

    // Right on leaf
    expect(() =>
      act(() => {
        fireEvent.keyDown(single, { key: 'ArrowRight' });
      })
    ).not.toThrow();
  });

  it('preserves focus and state when tree items dynamically mutate', () => {
    function DynamicTree() {
      const [items, setItems] = useState(['A', 'B']);
      return (
        <div>
          <button
            type="button"
            onClick={() =>
              setItems(prev => [...prev, `Item ${prev.length + 1}`])
            }
          >
            Add Item
          </button>
          <Tree>
            {items.map(item => (
              <TreeItem key={item} id={item} label={item} />
            ))}
          </Tree>
        </div>
      );
    }

    const { container } = render(<DynamicTree />);
    const itemA = container.querySelector('[data-mg-treeitem-id="A"]');
    act(() => {
      itemA.focus();
    });

    act(() => {
      fireEvent.click(screen.getByText('Add Item'));
    });

    const item3 = container.querySelector('[data-mg-treeitem-id="Item 3"]');
    expect(item3).toBeInTheDocument();

    // Key navigation still functions
    act(() => {
      fireEvent.keyDown(itemA, { key: 'End' });
    });
    expect(item3).toHaveFocus();
  });

  it('handles link items with Enter key triggering underlying anchor', () => {
    const clickSpy = jest.fn();
    const { container } = render(
      <Tree>
        <TreeItem
          id="link-item"
          label="UNDRR Portal"
          asLink
          href="https://undrr.org"
        />
      </Tree>
    );

    const treeitem = container.querySelector(
      '[data-mg-treeitem-id="link-item"]'
    );
    const link = treeitem.querySelector('a');
    link.addEventListener('click', e => {
      e.preventDefault();
      clickSpy();
    });

    act(() => {
      treeitem.focus();
    });
    act(() => {
      fireEvent.keyDown(treeitem, { key: 'Enter' });
    });

    expect(clickSpy).toHaveBeenCalled();
  });
});
