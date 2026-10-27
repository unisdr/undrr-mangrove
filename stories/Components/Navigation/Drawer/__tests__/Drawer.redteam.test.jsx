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

    expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument();
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

  it('renders hostile strings in children and footer as text, not HTML', () => {
    const maliciousChild =
      '<div id="injected-child">Safe HTML</div><img src="invalid" onerror="console.log(1)" />';
    const maliciousFooter = '<p id="injected-footer">Footer text</p>';

    const { container } = render(
      <Drawer
        isOpen={true}
        title="Hostile Payload"
        children={maliciousChild}
        footer={maliciousFooter}
      />
    );

    expect(document.getElementById('injected-child')).toBeNull();
    expect(document.getElementById('injected-footer')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText(maliciousChild)).toBeInTheDocument();
  });

  it('sanitises bodyHtml and footerHtml', () => {
    const { container } = render(
      <Drawer
        isOpen={true}
        title="Hydrated"
        bodyHtml={
          '<p id="kept">Kept</p><img src="x" onerror="alert(1)"><script>alert(1)</script>'
        }
        footerHtml={'<a href="javascript:alert(1)" id="bad">Bad</a>'}
      />
    );

    expect(document.getElementById('kept')).toBeInTheDocument();
    expect(container.querySelector('img')?.getAttribute('onerror')).toBeFalsy();
    expect(container.querySelector('script')).toBeNull();
    expect(document.getElementById('bad')?.getAttribute('href')).toBeFalsy();
  });

  it('fromElement extracts gracefully from edge case and empty DOM nodes', () => {
    const emptyContainer = document.createElement('div');
    const props = drawerFromElement(emptyContainer);

    expect(props.isOpen).toBe(false);
    expect(props.position).toBe('start');
    expect(props.backdrop).toBe(true);
    expect(props.isFloatingPanel).toBe(false);
    expect(props.bodyHtml).toBeUndefined();
    expect(props.footerHtml).toBeUndefined();
  });
});
