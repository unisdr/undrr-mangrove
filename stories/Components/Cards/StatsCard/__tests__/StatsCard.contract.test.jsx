import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createAjv } from '../../../../../schemas/ajv-setup.js';
import statisticSchema from '../../../../../schemas/dist/statistic.schema.json';
import { StatsCard } from '../StatsCard';

describe('StatsCard contract', () => {
  const validate = createAjv().compile(statisticSchema);

  it('minimal fixture validates against statistic schema', () => {
    const fixture = { stats: [{ value: '1,500+' }] };
    expect(validate(fixture)).toBe(true);
  });

  it('renders schema-valid minimal fixture', () => {
    render(<StatsCard stats={[{ value: '1,500+' }]} />);
    expect(screen.getByText('1,500+')).toBeInTheDocument();
  });

  it('full fixture validates against statistic schema', () => {
    const fixture = {
      stats: [
        {
          icon: 'mg-icon mg-icon-lightbulb',
          label: 'Target A',
          value: '45%',
          bottomLabel: 'Reduction in losses',
          summary: 'Substantially reduced global disaster mortality.',
        },
      ],
    };
    expect(validate(fixture)).toBe(true);
  });

  it('renders full fixture with icon, label, value, bottomLabel, and summary', async () => {
    const fixture = {
      stats: [
        {
          icon: 'mg-icon mg-icon-lightbulb',
          label: 'Target A',
          value: '45%',
          bottomLabel: 'Reduction in losses',
          summary: 'Substantially reduced global disaster mortality.',
        },
      ],
    };
    const { container } = render(<StatsCard {...fixture} />);
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('Target A')).toBeInTheDocument();
    expect(screen.getByText('Reduction in losses')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders the value for each stat in the array', () => {
    const fixture = {
      stats: [
        { value: '$223B' },
        { value: '1.5M' },
      ],
    };
    expect(validate(fixture)).toBe(true);
    render(<StatsCard {...fixture} />);
    expect(screen.getByText('$223B')).toBeInTheDocument();
    expect(screen.getByText('1.5M')).toBeInTheDocument();
  });
});
