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
  });

  it('renders open with backdrop and title', () => {
    const { container } = render(
      <Drawer isOpen={true} onClose={jest.fn()} title="Open Drawer">
        <p>Drawer body content</p>
      </Drawer>
    );

    const drawerEl = container.querySelector('.mg-drawer');
    expect(drawerEl).toHaveClass('is-open');
    expect(drawerEl).toHaveAttribute('aria-hidden', 'false');
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

  it('renders HTML string children via dangerouslySetInnerHTML', () => {
    const { container } = render(
      <Drawer
        isOpen={true}
        onClose={jest.fn()}
        children="<span class='custom-html'>HTML Child</span>"
      />
    );

    expect(container.querySelector('.custom-html')).toBeInTheDocument();
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
