import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import Snackbar from '../Snackbar';

describe('Snackbar', () => {
  const defaultProps = {
    severity: 'info',
    opened: true,
    message: 'Test notification',
    onClose: jest.fn(),
  };

  afterEach(() => {
    defaultProps.onClose.mockClear();
  });

  // --------------------------------------------------
  // Rendering
  // --------------------------------------------------

  it('renders the message when opened', () => {
    render(<Snackbar {...defaultProps} />);
    expect(screen.getByText('Test notification')).toBeInTheDocument();
  });

  it('renders a close button', () => {
    render(<Snackbar {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: 'Close notification' })
    ).toBeInTheDocument();
  });

  it('renders with role="alert"', () => {
    render(<Snackbar {...defaultProps} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('does not double the alert with an aria-live wrapper', () => {
    const { container } = render(<Snackbar {...defaultProps} />);
    expect(container.querySelector('[aria-live]')).not.toBeInTheDocument();
  });

  it('renders through Notice with the mapped variant', () => {
    const { container } = render(
      <Snackbar {...defaultProps} severity="success" />
    );
    expect(container.querySelector('.mg-notice--positive')).toBeInTheDocument();
    expect(container.querySelector('.mg-notice__icon svg')).toBeInTheDocument();
  });

  it('renders no body or close button while closed', () => {
    render(<Snackbar {...defaultProps} opened={false} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('focuses the close button when opened', () => {
    const { rerender } = render(<Snackbar {...defaultProps} opened={false} />);
    rerender(<Snackbar {...defaultProps} opened />);
    expect(
      screen.getByRole('button', { name: 'Close notification' })
    ).toHaveFocus();
  });

  // --------------------------------------------------
  // Severity variants
  // --------------------------------------------------

  it.each(['error', 'warning', 'info', 'success'])(
    'applies correct class for %s severity',
    severity => {
      const { container } = render(
        <Snackbar {...defaultProps} severity={severity} />
      );
      expect(
        container.querySelector(`.mg-snackbar__${severity}`)
      ).toBeInTheDocument();
    }
  );

  it('renders screen reader text with severity', () => {
    render(<Snackbar {...defaultProps} severity="error" />);
    expect(screen.getByText('error notification:')).toBeInTheDocument();
  });

  // --------------------------------------------------
  // Close behavior
  // --------------------------------------------------

  it('calls onClose when close button is clicked', () => {
    render(<Snackbar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close notification' }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key press', () => {
    render(<Snackbar {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape when not opened', () => {
    render(<Snackbar {...defaultProps} opened={false} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  // --------------------------------------------------
  // Auto-dismiss
  // --------------------------------------------------

  it('auto-dismisses after openedMiliseconds', () => {
    jest.useFakeTimers();

    render(<Snackbar {...defaultProps} openedMiliseconds={3000} />);

    expect(defaultProps.onClose).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('does not auto-dismiss when openedMiliseconds is not set', () => {
    jest.useFakeTimers();

    render(<Snackbar {...defaultProps} />);

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(defaultProps.onClose).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  // --------------------------------------------------
  // Open/close state classes
  // --------------------------------------------------

  it('applies open class when opened is true', () => {
    const { container } = render(<Snackbar {...defaultProps} opened={true} />);
    expect(
      container.querySelector('.mg-snackbar-wrapper__open')
    ).toBeInTheDocument();
  });

  it('does not apply open class when opened is false', () => {
    const { container } = render(<Snackbar {...defaultProps} opened={false} />);
    expect(
      container.querySelector('.mg-snackbar-wrapper__open')
    ).not.toBeInTheDocument();
  });

  // --------------------------------------------------
  // Accessibility
  // --------------------------------------------------

  it('has no a11y violations', async () => {
    const { container } = render(<Snackbar {...defaultProps} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
