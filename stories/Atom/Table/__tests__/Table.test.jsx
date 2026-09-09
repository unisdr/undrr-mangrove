import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { TableTag } from '../Table';

test('scroll mode wraps a native table in a named keyboard-accessible region', async () => {
  const { container } = render(
    <TableTag
      responsive="scroll"
      scrollLabel="Disaster records"
      text="Country"
      tdtext="Nepal"
      details="Earthquake"
    />
  );
  const region = screen.getByRole('region', { name: 'Disaster records' });
  expect(region).toHaveAttribute('tabindex', '0');
  expect(region).toContainElement(screen.getByRole('table'));
  expect(screen.getAllByRole('columnheader')).toHaveLength(3);
  expect(await axe(container)).toHaveNoViolations();
});

test.each(['auto', 'stacked'])(
  '%s preserves the direct table structure',
  responsive => {
    const { container } = render(<TableTag responsive={responsive} />);
    expect(container.firstElementChild.tagName).toBe('TABLE');
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  }
);
