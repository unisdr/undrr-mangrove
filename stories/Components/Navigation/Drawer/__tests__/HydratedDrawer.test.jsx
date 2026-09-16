import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { HydratedDrawer, OPEN_EVENT, CLOSE_EVENT } from '../HydratedDrawer';

describe('HydratedDrawer', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('opens and closes from a data-mg-drawer-trigger button', () => {
    const trigger = document.createElement('button');
    trigger.setAttribute('data-mg-drawer-trigger', 'filters');
    trigger.textContent = 'Filters';
    document.body.appendChild(trigger);

    const { container } = render(
      <HydratedDrawer controlsId="filters" title="Filters" />
    );
    const drawer = container.querySelector('.mg-drawer');
    expect(drawer).not.toHaveClass('is-open');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);
    expect(drawer).toHaveClass('is-open');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', 'filters');

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(drawer).not.toHaveClass('is-open');
  });

  it('ignores triggers for other drawers', () => {
    const trigger = document.createElement('button');
    trigger.setAttribute('data-mg-drawer-trigger', 'other');
    document.body.appendChild(trigger);

    const { container } = render(<HydratedDrawer controlsId="filters" />);
    fireEvent.click(trigger);
    expect(container.querySelector('.mg-drawer')).not.toHaveClass('is-open');
  });

  it('responds to open and close events on the container', () => {
    const host = document.createElement('div');
    host.id = 'filters';
    document.body.appendChild(host);

    render(<HydratedDrawer controlsId="filters" title="Filters" />, {
      container: host,
    });
    const drawer = host.querySelector('.mg-drawer');

    act(() => {
      host.dispatchEvent(new CustomEvent(OPEN_EVENT));
    });
    expect(drawer).toHaveClass('is-open');

    act(() => {
      host.dispatchEvent(new CustomEvent(CLOSE_EVENT));
    });
    expect(drawer).not.toHaveClass('is-open');
  });
});
