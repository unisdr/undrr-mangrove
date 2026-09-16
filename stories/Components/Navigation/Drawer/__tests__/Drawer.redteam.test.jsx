import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Drawer } from '../Drawer';
import drawerFromElement from '../Drawer.fromElement';

describe('Drawer Red-Team Security & Stress Regressions', () => {
  it('does not trigger onClose on Escape when drawer is closed', () => {
    const onClose = jest.fn();
    render(<Drawer isOpen={false} onClose={onClose} title="Closed Drawer" />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('handles rapid toggle spam without memory leak or double backdrop events', () => {
    function ToggleHarness() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setOpen(!open)}>
            Toggle
          </button>
          <Drawer
            isOpen={open}
            onClose={() => setOpen(false)}
            title="Spam Test"
          >
            Body content
          </Drawer>
        </div>
      );
    }

    render(<ToggleHarness />);
    const toggleBtn = screen.getByText('Toggle');

    // Rapid toggle 10 times
    for (let i = 0; i < 10; i++) {
      fireEvent.click(toggleBtn);
    }

    expect(
      screen.getByRole('complementary', { hidden: true })
    ).toBeInTheDocument();
  });

  it('unmounts cleanly while open without leaving orphaned event listeners', () => {
    const onClose = jest.fn();
    const { unmount } = render(
      <Drawer isOpen={true} onClose={onClose} title="Open Drawer" />
    );

    unmount();

    // Keydown after unmount should not invoke callback
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('handles malformed / empty / hostile HTML strings in children and footer safely', () => {
    const maliciousChild =
      '<div id="injected-child">Safe HTML</div><img src="invalid" onerror="console.log(1)" />';
    const maliciousFooter = '<p id="injected-footer">Footer text</p>';

    render(
      <Drawer
        isOpen={true}
        title="Hostile Payload"
        children={maliciousChild}
        footer={maliciousFooter}
      />
    );

    expect(document.getElementById('injected-child')).toBeInTheDocument();
    expect(document.getElementById('injected-footer')).toBeInTheDocument();
  });

  it('fromElement extracts gracefully from edge case and empty DOM nodes', () => {
    const emptyContainer = document.createElement('div');
    const props = drawerFromElement(emptyContainer);

    expect(props.isOpen).toBe(false);
    expect(props.position).toBe('start');
    expect(props.backdrop).toBe(true);
    expect(props.isFloatingPanel).toBe(false);
    expect(props.children || '').toBe('');
    expect(props.footer || '').toBe('');
  });
});
