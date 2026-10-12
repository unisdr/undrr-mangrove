import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  describe('determinate', () => {
    it('renders a native progress element inside the track', () => {
      const { container } = render(
        <ProgressBar label="Uploading report.pdf" value={45} />
      );
      const bar = screen.getByRole('progressbar');
      expect(bar.tagName).toBe('PROGRESS');
      expect(bar).toHaveClass('mg-progress-bar__native');
      expect(bar.parentElement).toHaveClass('mg-progress-bar__track');
      expect(container.firstChild).toHaveClass('mg-progress-bar');
      expect(bar).toHaveAttribute('value', '45');
      expect(bar).toHaveAttribute('max', '100');
    });

    it('treats a value of 0 as determinate', () => {
      render(<ProgressBar label="Uploading" value={0} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('value', '0');
    });

    it('sets no role or ARIA value attributes of its own', () => {
      render(<ProgressBar label="Uploading" value={45} />);
      const bar = screen.getByRole('progressbar');
      expect(bar).not.toHaveAttribute('role');
      expect(bar).not.toHaveAttribute('aria-valuenow');
      expect(bar).not.toHaveAttribute('aria-valuemin');
      expect(bar).not.toHaveAttribute('aria-valuemax');
    });

    it('is named by its visible label', () => {
      render(<ProgressBar label="Uploading report.pdf" value={45} />);
      const bar = screen.getByRole('progressbar');
      const label = screen.getByText('Uploading report.pdf');
      expect(label).toHaveClass('mg-progress-bar__label');
      expect(bar).toHaveAttribute('aria-labelledby', label.id);
      expect(bar).toHaveAccessibleName('Uploading report.pdf');
      expect(bar).not.toHaveAttribute('aria-label');
    });

    it('shows the percentage when asked, hidden from assistive technology', () => {
      const { container } = render(
        <ProgressBar label="Processing" value={3} max={8} showValue />
      );
      const shown = container.querySelector('.mg-progress-bar__value');
      expect(shown).toHaveTextContent('38%');
      expect(shown).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByRole('progressbar')).toHaveAttribute('max', '8');
    });

    it('does not show the value by default', () => {
      const { container } = render(
        <ProgressBar label="Processing" value={3} />
      );
      expect(container.querySelector('.mg-progress-bar__value')).toBeNull();
    });

    it('uses valueText as aria-valuetext and as the visible value', () => {
      const { container } = render(
        <ProgressBar
          label="Uploading files"
          value={3}
          max={12}
          valueText="3 of 12 files"
          showValue
        />
      );
      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'aria-valuetext',
        '3 of 12 files'
      );
      expect(
        container.querySelector('.mg-progress-bar__value')
      ).toHaveTextContent('3 of 12 files');
    });

    it('describes the bar with the help text', () => {
      render(
        <ProgressBar
          label="Uploading"
          value={10}
          helpText="You can leave this page."
        />
      );
      const bar = screen.getByRole('progressbar');
      const help = screen.getByText('You can leave this page.');
      expect(help).toHaveClass('mg-progress-bar__help');
      expect(bar).toHaveAttribute('aria-describedby', help.id);
      expect(bar).toHaveAccessibleDescription('You can leave this page.');
    });

    it('clamps the value to the range from 0 to max', () => {
      const { rerender } = render(<ProgressBar label="Saving" value={150} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('value', '100');
      rerender(<ProgressBar label="Saving" value={-5} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('value', '0');
    });

    it('has no axe violations', async () => {
      const { container } = render(
        <ProgressBar
          label="Uploading report.pdf"
          value={45}
          showValue
          helpText="About a minute left."
        />
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('indeterminate', () => {
    it('leaves out the value attribute when value is undefined', () => {
      render(<ProgressBar label="Loading results" />);
      const bar = screen.getByRole('progressbar');
      expect(bar).not.toHaveAttribute('value');
      expect(bar).toBeEmptyDOMElement();
    });

    it('leaves out the value attribute when value is null', () => {
      render(<ProgressBar label="Loading results" value={null} />);
      expect(screen.getByRole('progressbar')).not.toHaveAttribute('value');
    });

    it('switches between indeterminate and determinate', () => {
      const { rerender } = render(<ProgressBar label="Loading" />);
      expect(screen.getByRole('progressbar')).not.toHaveAttribute('value');
      rerender(<ProgressBar label="Loading" value={20} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('value', '20');
      rerender(<ProgressBar label="Loading" />);
      expect(screen.getByRole('progressbar')).not.toHaveAttribute('value');
    });

    it('never shows a value', () => {
      const { container } = render(
        <ProgressBar label="Loading results" showValue valueText="Working" />
      );
      expect(container.querySelector('.mg-progress-bar__value')).toBeNull();
      expect(screen.getByRole('progressbar')).not.toHaveAttribute(
        'aria-valuetext'
      );
    });

    it('has no axe violations', async () => {
      const { container } = render(<ProgressBar label="Loading results" />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('accessible name', () => {
    it('uses the label as aria-label when it is hidden', () => {
      const { container } = render(
        <ProgressBar label="Loading results" hideLabel />
      );
      const bar = screen.getByRole('progressbar');
      expect(bar).toHaveAttribute('aria-label', 'Loading results');
      expect(bar).toHaveAccessibleName('Loading results');
      expect(container.querySelector('.mg-progress-bar__label')).toBeNull();
    });

    it('accepts aria-labelledby pointing at an external label', () => {
      render(
        <>
          <h2 id="results-heading">Search results</h2>
          <ProgressBar aria-labelledby="results-heading" />
        </>
      );
      const bar = screen.getByRole('progressbar');
      expect(bar).toHaveAccessibleName('Search results');
      expect(bar).not.toHaveAttribute('aria-label');
    });

    it('lets an explicit aria-label win over the label', () => {
      render(<ProgressBar label="Visible" aria-label="Uploading" value={10} />);
      const bar = screen.getByRole('progressbar');
      expect(bar).toHaveAccessibleName('Uploading');
      expect(bar).not.toHaveAttribute('aria-labelledby');
    });

    it('warns when no accessible name is given', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      render(<ProgressBar value={10} />);
      expect(
        spy.mock.calls.some(call =>
          call.join(' ').includes('needs an accessible name')
        )
      ).toBe(true);
      spy.mockRestore();
    });

    it('does not warn when a name is given', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      render(<ProgressBar aria-label="Uploading" value={10} />);
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('flush variant', () => {
    it('renders a thin bar named by aria-label with no visible text', () => {
      const { container } = render(
        <ProgressBar
          label="Updating results"
          variant="flush"
          helpText="Ignored"
          value={40}
          showValue
        />
      );
      expect(container.firstChild).toHaveClass(
        'mg-progress-bar',
        'mg-progress-bar--flush'
      );
      const bar = screen.getByRole('progressbar');
      expect(bar).toHaveAccessibleName('Updating results');
      expect(container.querySelector('.mg-progress-bar__label')).toBeNull();
      expect(container.querySelector('.mg-progress-bar__value')).toBeNull();
      expect(container.querySelector('.mg-progress-bar__help')).toBeNull();
    });

    it('has no axe violations', async () => {
      const { container } = render(
        <div style={{ position: 'relative' }}>
          <ProgressBar label="Updating results" variant="flush" />
        </div>
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it('puts extra classes on the wrapper and passes other props to the bar', () => {
    const { container } = render(
      <ProgressBar label="Saving" value={5} className="custom" id="bar" />
    );
    expect(container.firstChild).toHaveClass('mg-progress-bar', 'custom');
    expect(screen.getByRole('progressbar')).toHaveAttribute('id', 'bar');
  });
});
