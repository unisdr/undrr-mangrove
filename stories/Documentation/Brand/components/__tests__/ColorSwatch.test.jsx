import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ColorSwatch } from '../ColorSwatch';

describe('ColorSwatch', () => {
  const originalClipboard = navigator.clipboard;

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
  });

  // --------------------------------------------------
  // Rendering with explicit color
  // --------------------------------------------------

  it('renders the swatch with an explicit color', () => {
    render(<ColorSwatch color="#004f91" name="Primary blue" usage="Headers and navigation" />);

    expect(screen.getByText('Primary blue')).toBeInTheDocument();
    expect(screen.getByText('Headers and navigation')).toBeInTheDocument();
    expect(screen.getByText('#004f91')).toBeInTheDocument();
  });

  it('renders without a usage description', () => {
    render(<ColorSwatch color="#004f91" name="Primary blue" />);

    expect(screen.getByText('Primary blue')).toBeInTheDocument();
    expect(screen.queryByClassName?.('mg-color-swatch__usage')).toBeFalsy();
  });

  // --------------------------------------------------
  // Contrast detection
  // --------------------------------------------------

  it('uses white text on dark backgrounds', () => {
    render(<ColorSwatch color="#004f91" name="Dark blue" />);

    const hex = screen.getByText('#004f91');
    expect(hex).toHaveStyle({ color: '#fff' });
  });

  it('uses dark text on light backgrounds', () => {
    render(<ColorSwatch color="#fbc412" name="Yellow" />);

    const hex = screen.getByText('#fbc412');
    expect(hex).toHaveStyle({ color: '#1a1a1a' });
  });

  // --------------------------------------------------
  // Copy to clipboard
  // --------------------------------------------------

  it('copies hex value on click and shows feedback', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ColorSwatch color="#004f91" name="Primary blue" />);

    const button = screen.getByRole('button');
    await act(async () => {
      fireEvent.click(button);
    });

    expect(writeText).toHaveBeenCalledWith('#004f91');
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('shows error feedback when clipboard fails', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockRejectedValue(new Error('denied')) },
    });

    render(<ColorSwatch color="#004f91" name="Primary blue" />);

    const button = screen.getByRole('button');
    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText('Copy failed')).toBeInTheDocument();
  });

  // --------------------------------------------------
  // Probe fallback
  // --------------------------------------------------

  it('falls back to #000000 when probe resolves nothing', () => {
    render(<ColorSwatch probe="mg-nonexistent-class" name="Unknown" />);

    // Should still render without crashing
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  // --------------------------------------------------
  // Accessibility
  // --------------------------------------------------

  it('has an accessible copy button with aria-label', () => {
    render(<ColorSwatch color="#004f91" name="Primary blue" />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute(
      'aria-label',
      'Copy hex value #004f91 for Primary blue',
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ColorSwatch color="#004f91" name="Primary blue" usage="Headers" />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
