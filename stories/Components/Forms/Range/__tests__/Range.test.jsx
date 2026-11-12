import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Range } from '../Range';

expect.extend(toHaveNoViolations);

const TICKS = [
  { value: 0, label: 'Historical' },
  { value: 1, label: '+1.5°C' },
];

describe('Range', () => {
  it('renders a slider with min, max and value', () => {
    render(
      <>
        <label htmlFor="r1">Level</label>
        <Range id="r1" min={0} max={10} value={4} onChange={() => {}} />
      </>
    );
    const slider = screen.getByRole('slider', { name: 'Level' });
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '10');
    expect(slider).toHaveValue('4');
  });

  it('calls onChange', () => {
    const onChange = jest.fn();
    render(<Range id="r2" aria-label="Level" value={1} onChange={onChange} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '5' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('renders ticks and announces the current tick label', () => {
    const { container } = render(
      <Range
        id="r3"
        aria-label="Target"
        min={0}
        max={1}
        step={1}
        value={1}
        onChange={() => {}}
        ticks={TICKS}
      />
    );
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('list', 'r3-ticks');
    expect(slider).toHaveAttribute('aria-valuetext', '+1.5°C');
    expect(container.querySelectorAll('datalist option')).toHaveLength(2);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <label htmlFor="r4">Target</label>
        <Range id="r4" defaultValue={0} min={0} max={1} ticks={TICKS} />
      </>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('Range analytics label', () => {
  it('labels the input for click tracking', () => {
    render(
      <Range
        id="r-analytics"
        aria-label="Niveau"
        defaultValue={1}
        analyticsLabel="Scenario: Warming level"
      />
    );
    expect(screen.getByRole('slider')).toHaveAttribute(
      'data-vf-analytics-label',
      'Scenario: Warming level'
    );
  });

  it('lets a caller attribute win', () => {
    render(
      <Range
        id="r-analytics-override"
        aria-label="Level"
        defaultValue={1}
        analyticsLabel="Scenario: Warming level"
        data-vf-analytics-label="Custom"
      />
    );
    expect(screen.getByRole('slider')).toHaveAttribute(
      'data-vf-analytics-label',
      'Custom'
    );
  });

  it('adds no attribute when unset', () => {
    render(<Range id="r-plain" aria-label="Level" defaultValue={1} />);
    expect(screen.getByRole('slider')).not.toHaveAttribute(
      'data-vf-analytics-label'
    );
  });
});
