import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Loader, LOADER_LABEL_DELAY_MS } from '../Loader';

// The label is added after mount, so most tests render and then let the
// delay pass.
function renderLoaded(ui) {
  const result = render(ui);
  act(() => {
    jest.advanceTimersByTime(LOADER_LABEL_DELAY_MS);
  });
  return result;
}

describe('Loader', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('announces the default label as text inside a status region', () => {
    renderLoaded(<Loader />);
    const status = screen.getByRole('status');
    expect(status).toHaveClass('mg-loader');
    expect(status).toHaveTextContent('Loading');
    expect(screen.getByText('Loading')).toHaveClass('mg-u-sr-only');
  });

  it('inserts the status region empty and adds the label after a delay', () => {
    render(<Loader />);
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();
    act(() => {
      jest.advanceTimersByTime(LOADER_LABEL_DELAY_MS - 1);
    });
    expect(status).toBeEmptyDOMElement();
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(status).toHaveTextContent('Loading');
  });

  it('does not set state after unmounting', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(<Loader />);
    unmount();
    act(() => {
      jest.advanceTimersByTime(LOADER_LABEL_DELAY_MS);
    });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('renders a translated label', () => {
    renderLoaded(<Loader label="Chargement" />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement');
  });

  it('does not mark itself busy or repeat the implicit live setting', () => {
    renderLoaded(<Loader />);
    const status = screen.getByRole('status');
    expect(status).not.toHaveAttribute('aria-busy');
    expect(status).not.toHaveAttribute('aria-live');
    expect(status).not.toHaveAttribute('aria-label');
  });

  it('appends extra classes', () => {
    renderLoaded(<Loader className="custom" />);
    expect(screen.getByRole('status')).toHaveClass('mg-loader', 'custom');
  });

  it('ends with the same markup as before: a div with no size modifier', () => {
    const { container } = renderLoaded(<Loader />);
    expect(container.innerHTML).toBe(
      '<div class="mg-loader" role="status"><span class="mg-u-sr-only">Loading</span></div>'
    );
  });

  it('has no axe violations', async () => {
    const { container } = renderLoaded(<Loader />);
    jest.useRealTimers();
    expect(await axe(container)).toHaveNoViolations();
  });

  describe('inline size', () => {
    it('adds the modifier and renders a span', () => {
      renderLoaded(<Loader size="inline" />);
      const status = screen.getByRole('status');
      expect(status.tagName).toBe('SPAN');
      expect(status).toHaveClass('mg-loader', 'mg-loader--inline');
      expect(status).toHaveTextContent('Loading');
    });

    it('keeps the default size a div', () => {
      renderLoaded(<Loader />);
      const status = screen.getByRole('status');
      expect(status.tagName).toBe('DIV');
      expect(status).not.toHaveClass('mg-loader--inline');
    });

    it('is valid inside a button next to a visible label', async () => {
      const { container } = renderLoaded(
        <button
          type="button"
          className="mg-button mg-button-primary"
          aria-disabled="true"
        >
          <Loader size="inline" decorative />
          Saving…
        </button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName('Saving…');
      expect(button.querySelector('.mg-loader--inline').tagName).toBe('SPAN');
      jest.useRealTimers();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no axe violations inline in a paragraph', async () => {
      const { container } = renderLoaded(
        <p>
          Fetching figures <Loader size="inline" /> from the monitor.
        </p>
      );
      jest.useRealTimers();
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('decorative', () => {
    it('hides the spinner and drops the status role and label', () => {
      const { container } = renderLoaded(<Loader decorative />);
      const spinner = container.querySelector('.mg-loader');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
      expect(spinner).not.toHaveAttribute('role');
      expect(spinner).toBeEmptyDOMElement();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('renders the same markup at once, with nothing to wait for', () => {
      const { container } = render(<Loader size="inline" decorative />);
      expect(container.innerHTML).toBe(
        '<span class="mg-loader mg-loader--inline" aria-hidden="true"></span>'
      );
    });

    it('has no axe violations', async () => {
      const { container } = renderLoaded(
        <Loader size="inline" decorative className="custom" />
      );
      expect(container.firstChild).toHaveClass('custom');
      jest.useRealTimers();
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
