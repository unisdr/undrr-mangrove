import React from 'react';
import { render } from '@testing-library/react';
import { StatsCard } from '../StatsCard';

/** Builds an array of `n` minimal, valid stat objects. */
function makeStats(n) {
  return Array.from({ length: n }, (_, i) => ({
    value: `${i + 1}`,
    bottomLabel: `Label ${i + 1}`,
  }));
}

/** Returns the grid wrapper (`.mg-grid`) rendered inside the stats card. */
function renderGrid(stats) {
  const { container } = render(<StatsCard stats={stats} />);
  return container.querySelector('.mg-grid');
}

describe('StatsCard grid layout', () => {
  it('emits a numbered column class matching the stat count within range', () => {
    const grid = renderGrid(makeStats(3));
    expect(grid).toHaveClass('mg-grid', 'mg-grid__col-3');
    expect(grid).not.toHaveClass('mg-grid--auto-fit');
  });

  it('uses the highest numbered column class at the 12-stat boundary', () => {
    const grid = renderGrid(makeStats(12));
    expect(grid).toHaveClass('mg-grid__col-12');
    expect(grid).not.toHaveClass('mg-grid--auto-fit');
  });

  it('falls back to the single-row auto-fit modifier beyond 12 stats', () => {
    const grid = renderGrid(makeStats(13));
    expect(grid).toHaveClass('mg-grid', 'mg-grid--auto-fit');
    // No numbered class past the supported range — that was the bug (col-13
    // matched no rule and collapsed to a stacked single column).
    expect(grid.className).not.toMatch(/mg-grid__col-\d+/);
  });

  it('renders a bare grid with no column class when there are no stats', () => {
    const grid = renderGrid([]);
    expect(grid).toHaveClass('mg-grid');
    expect(grid.className).not.toMatch(/mg-grid__col-\d+/);
    expect(grid).not.toHaveClass('mg-grid--auto-fit');
  });
});
