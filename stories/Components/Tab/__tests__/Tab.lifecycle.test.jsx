import React from 'react';
import { createPortal } from 'react-dom';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Tab } from '../Tab';
import { mgTabsDestroy } from '../../../assets/js/tabs';

// The React wrapper when its node leaves the document without unmounting,
// for example a portal whose target is removed and re-inserted.

const tabdata = [
  { text: 'First', text_id: 'portal-first', data: '<p>First panel</p>' },
  { text: 'Second', text_id: 'portal-second', data: '<p>Second panel</p>' },
];

function PortalTab({ target, labels }) {
  return createPortal(<Tab tabdata={tabdata} labels={labels} />, target);
}

describe('Tab wrapper lifecycle', () => {
  let observers;
  let target;
  const OriginalResizeObserver = global.ResizeObserver;

  beforeEach(() => {
    observers = [];
    global.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
        this.observing = false;
        this.observe = jest.fn(() => {
          this.observing = true;
        });
        this.disconnect = jest.fn(() => {
          this.observing = false;
        });
        observers.push(this);
      }

      trigger() {
        if (this.observing) this.callback([], this);
      }
    };
    target = document.createElement('main');
    document.body.append(target);
  });

  afterEach(() => {
    cleanup();
    mgTabsDestroy(document);
    document.body.innerHTML = '';
    window.history.replaceState(null, '', window.location.pathname);
    global.ResizeObserver = OriginalResizeObserver;
  });

  const triggerObservers = () =>
    observers.forEach(observer => observer.trigger());

  it('stays functional in a portal whose target is removed and re-inserted', async () => {
    const result = render(<PortalTab target={target} />);
    target.remove();
    triggerObservers();
    result.rerender(<PortalTab target={target} />);
    document.body.append(target);

    const second = screen.getByRole('tab', { name: 'Second' });
    fireEvent.pointerDown(second);
    fireEvent.click(second);

    expect(second).toHaveAttribute('aria-selected', 'true');
    expect(window.location.hash).toBe('');
    expect(screen.getByText('Second panel')).toBeVisible();
    expect(screen.getByText('First panel')).not.toBeVisible();
    expect(await axe(target)).toHaveNoViolations();
  });

  it('keeps the selection across a suspension and a prop change', () => {
    const result = render(<PortalTab target={target} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Second' }));

    target.remove();
    triggerObservers();
    document.body.append(target);
    result.rerender(
      <PortalTab target={target} labels={{ tabListLabel: 'Updated' }} />
    );

    expect(screen.getByRole('tablist')).toHaveAttribute(
      'aria-label',
      'Updated'
    );
    expect(screen.getByRole('tab', { name: 'Second' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('releases window listeners on unmount', () => {
    const added = new Set();
    const add = window.addEventListener;
    const remove = window.removeEventListener;
    jest
      .spyOn(window, 'addEventListener')
      .mockImplementation(function (type, handler, options) {
        added.add(handler);
        return add.call(this, type, handler, options);
      });
    jest
      .spyOn(window, 'removeEventListener')
      .mockImplementation(function (type, handler, options) {
        added.delete(handler);
        return remove.call(this, type, handler, options);
      });
    const result = render(<Tab tabdata={tabdata} />);
    expect(added.size).toBeGreaterThan(0);
    result.unmount();
    expect(added.size).toBe(0);
    jest.restoreAllMocks();
  });
});
