import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Drawer } from '../Drawer';

expect.extend(toHaveNoViolations);

describe('Drawer', () => {
  it('renders closed by default without throwing', () => {
    const { container } = render(
      <Drawer isOpen={false} onClose={jest.fn()} title="Test Drawer">
        <p>Drawer body content</p>
      </Drawer>
    );

    const drawerEl = container.querySelector('.mg-drawer');
    expect(drawerEl).toBeInTheDocument();
    expect(drawerEl).toHaveAttribute('aria-hidden', 'true');
    expect(drawerEl).not.toHaveClass('is-open');
    expect(drawerEl.inert).toBe(true);
  });

  it('renders open with backdrop and title', () => {
    const { container } = render(
      <Drawer isOpen={true} onClose={jest.fn()} title="Open Drawer">
        <p>Drawer body content</p>
      </Drawer>
    );

    const drawerEl = container.querySelector('.mg-drawer');
    expect(drawerEl).toHaveClass('is-open');
    expect(drawerEl).not.toHaveAttribute('aria-hidden');
    expect(drawerEl).toHaveAttribute('aria-modal', 'true');
    expect(drawerEl).toHaveAccessibleName('Open Drawer');
    expect(screen.getByText('Open Drawer')).toBeInTheDocument();
    expect(container.querySelector('.mg-drawer__backdrop')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <Drawer isOpen={true} onClose={handleClose} title="Open Drawer">
        <p>Body</p>
      </Drawer>
    );

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const handleClose = jest.fn();
    const { container } = render(
      <Drawer isOpen={true} onClose={handleClose} title="Open Drawer">
        <p>Body</p>
      </Drawer>
    );

    const backdrop = container.querySelector('.mg-drawer__backdrop');
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = jest.fn();
    render(
      <Drawer isOpen={true} onClose={handleClose} title="Open Drawer">
        <p>Body</p>
      </Drawer>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders floating panel variant with dialog role', () => {
    const { container } = render(
      <Drawer
        isOpen={true}
        onClose={jest.fn()}
        isFloatingPanel={true}
        title="Floating Panel"
      >
        <p>Panel body</p>
      </Drawer>
    );

    const panel = container.querySelector('.mg-floating-panel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute('role', 'dialog');
    expect(container.querySelector('.mg-drawer__backdrop')).toBeNull();
  });

  it('renders string children as text', () => {
    const { container } = render(
      <Drawer
        isOpen={true}
        onClose={jest.fn()}
        children="<span class='custom-html'>HTML Child</span>"
      />
    );

    expect(container.querySelector('.custom-html')).toBeNull();
  });

  it('moves focus in on open and returns it on close', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(
      <Drawer isOpen={false} onClose={jest.fn()} title="Focus" />
    );
    rerender(<Drawer isOpen onClose={jest.fn()} title="Focus" />);
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();

    rerender(<Drawer isOpen={false} onClose={jest.fn()} title="Focus" />);
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('keeps Tab inside an open modal drawer', () => {
    render(
      <Drawer isOpen onClose={jest.fn()} title="Trap">
        <a href="#one">One</a>
      </Drawer>
    );
    const close = screen.getByRole('button', { name: 'Close' });
    const link = screen.getByRole('link', { name: 'One' });

    link.focus();
    fireEvent.keyDown(link, { key: 'Tab' });
    expect(close).toHaveFocus();

    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(link).toHaveFocus();
  });

  it('uses translated labels', () => {
    render(
      <Drawer isOpen onClose={jest.fn()} labels={{ closeLabel: 'Fermer' }} />
    );
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
  });

  it('passes axe accessibility tests when closed', async () => {
    const { container } = render(
      <Drawer isOpen={false} onClose={jest.fn()} title="Closed drawer">
        <a href="#link">Link inside</a>
      </Drawer>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe accessibility tests when open', async () => {
    const { container } = render(
      <Drawer isOpen={true} onClose={jest.fn()} title="Accessible Drawer">
        <p>Accessible content inside drawer</p>
      </Drawer>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
