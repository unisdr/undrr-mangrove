import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { CopyButton } from '../CopyButton';

describe('CopyButton', () => {
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    Object.assign(navigator, {
      clipboard: originalClipboard,
    });
  });

  it('renders an accessible icon button with standard Mangrove classes', () => {
    render(<CopyButton textToCopy="https://undrr.org" />);

    const button = screen.getByRole('button', { name: 'Copy to clipboard' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass(
      'mg-button',
      'mg-button-primary',
      'mg-button-outline',
      'mg-button--icon',
      'mg-copy-button'
    );
    expect(button.querySelector('.mg-icon-copy')).toBeInTheDocument();
  });

  it('copies text and shows feedback on click', async () => {
    jest.useFakeTimers();
    try {
      render(
        <CopyButton
          textToCopy="npm install @undrr/mangrove"
          tooltipLabel="Copied!"
          copiedLabel="Copied to clipboard."
        />
      );

      const button = screen.getByRole('button', { name: 'Copy to clipboard' });

      await act(async () => {
        fireEvent.click(button);
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'npm install @undrr/mangrove'
      );
      expect(button).toHaveClass('mg-copy-button--copied');

      // Tooltip is visible
      const tooltip = screen.getByText('Copied!');
      expect(tooltip).toHaveClass('mg-copy-button__feedback--visible');

      // Screen reader announcement is in the sr-only element
      const srAnnouncement = screen.getByText('Copied to clipboard.');
      expect(srAnnouncement).toHaveClass('mg-u-sr-only');

      // Auto-dismiss after 2000ms
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(button).not.toHaveClass('mg-copy-button--copied');
    } finally {
      jest.useRealTimers();
    }
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(
      <CopyButton textToCopy="https://undrr.org" ariaLabel="Copy link" />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
