import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Loader } from '../Loader';

describe('Loader', () => {
  it('announces the default label as text inside a status region', () => {
    render(<Loader />);
    const status = screen.getByRole('status');
    expect(status).toHaveClass('mg-loader');
    expect(status).toHaveTextContent('Loading');
    expect(screen.getByText('Loading')).toHaveClass('mg-u-sr-only');
  });

  it('renders a translated label', () => {
    render(<Loader label="Chargement" />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement');
  });

  it('does not mark itself busy or repeat the implicit live setting', () => {
    render(<Loader />);
    const status = screen.getByRole('status');
    expect(status).not.toHaveAttribute('aria-busy');
    expect(status).not.toHaveAttribute('aria-live');
    expect(status).not.toHaveAttribute('aria-label');
  });

  it('appends extra classes', () => {
    render(<Loader className="custom" />);
    expect(screen.getByRole('status')).toHaveClass('mg-loader', 'custom');
  });

  it('keeps the default markup: a div with no size modifier', () => {
    const { container } = render(<Loader />);
    expect(container.innerHTML).toBe(
      '<div class="mg-loader" role="status"><span class="mg-u-sr-only">Loading</span></div>'
    );
  });

  it('has no axe violations', async () => {
    const { container } = render(<Loader />);
    expect(await axe(container)).toHaveNoViolations();
  });

  describe('small size', () => {
    it('adds the modifier and renders a span so it can sit inline', () => {
      render(<Loader size="small" />);
      const status = screen.getByRole('status');
      expect(status.tagName).toBe('SPAN');
      expect(status).toHaveClass('mg-loader', 'mg-loader--small');
      expect(status).toHaveTextContent('Loading');
    });

    it('can be rendered as a div', () => {
      render(<Loader size="small" as="div" />);
      expect(screen.getByRole('status').tagName).toBe('DIV');
    });

    it('can render the default size as a span', () => {
      render(<Loader as="span" />);
      const status = screen.getByRole('status');
      expect(status.tagName).toBe('SPAN');
      expect(status).not.toHaveClass('mg-loader--small');
    });

    it('is valid inside a button next to a label', async () => {
      const { container } = render(
        <button type="button" className="mg-button mg-button-primary">
          <Loader size="small" announce={false} />
          Saving…
        </button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName('Saving…');
      expect(button.querySelector('.mg-loader--small').tagName).toBe('SPAN');
      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no axe violations inline in a paragraph', async () => {
      const { container } = render(
        <p>
          Fetching figures <Loader size="small" /> from the monitor.
        </p>
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('decorative mode', () => {
    it('hides the spinner and drops the status role and label', () => {
      const { container } = render(<Loader announce={false} />);
      const spinner = container.querySelector('.mg-loader');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
      expect(spinner).not.toHaveAttribute('role');
      expect(spinner).toBeEmptyDOMElement();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('has no axe violations', async () => {
      const { container } = render(
        <Loader size="small" announce={false} className="custom" />
      );
      expect(container.firstChild).toHaveClass('custom');
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('visible label', () => {
    it('shows the label next to a hidden spinner inside the status region', () => {
      render(<Loader size="small" showLabel label="Saving…" />);
      const status = screen.getByRole('status');
      expect(status).toHaveClass('mg-loader-group');
      expect(status.tagName).toBe('SPAN');
      expect(status).toHaveTextContent('Saving…');
      expect(screen.getByText('Saving…')).toHaveClass('mg-loader-group__label');
      expect(screen.getByText('Saving…')).not.toHaveClass('mg-u-sr-only');
      const spinner = status.querySelector('.mg-loader');
      expect(spinner).toHaveClass('mg-loader--small');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });

    it('hides the whole group when announced elsewhere', () => {
      const { container } = render(
        <Loader size="small" showLabel announce={false} />
      );
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    });

    it('has no axe violations', async () => {
      const { container } = render(<Loader size="small" showLabel />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
