import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Legend } from '../Legend';

expect.extend(toHaveNoViolations);

describe('Legend', () => {
  it('renders a continuous legend named by its title', () => {
    render(
      <Legend
        title="Peak ground acceleration"
        ticks={[
          { label: '0', position: '0%' },
          { label: '1000', position: '100%' },
        ]}
      />
    );

    expect(
      screen.getByRole('group', { name: 'Peak ground acceleration' })
    ).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  it('places a single unpositioned tick at the start instead of NaN', () => {
    const { container } = render(<Legend ticks={[{ label: 'Only' }]} />);
    const tick = container.querySelector('.mg-legend__tick');
    expect(tick.style.getPropertyValue('--mg-legend-tick-pos')).toBe('0%');
  });

  it('gives stepped colours a text alternative', () => {
    render(
      <Legend
        type="stepped"
        items={[
          { color: '#eee', label: 'Low' },
          { color: '#333', label: 'High' },
        ]}
      />
    );
    expect(screen.getByText('Low')).toHaveClass('mg-u-sr-only');
  });

  it('renders categorical items with values', () => {
    render(
      <Legend
        type="categorical"
        items={[{ color: '#f00', label: 'Flood', value: '12' }]}
      />
    );
    expect(screen.getByText('Flood')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Legend
        title="Disaster type"
        type="categorical"
        items={[
          { color: '#f00', label: 'Flood' },
          { color: '#00f', label: 'Storm' },
        ]}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
