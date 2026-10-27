import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Chips } from '../Chips';

describe('Chips', () => {
  it('renders the default variant as a category link', () => {
    render(<Chips label="Climate risk" href="/topics/climate-risk" />);

    expect(screen.getByRole('link', { name: 'Climate risk' })).toHaveAttribute(
      'href',
      '/topics/climate-risk'
    );
  });

  it('renders the dismissible variant as a labelled button', () => {
    render(<Chips label="Earthquake" Type="With X" />);

    expect(
      screen.getByRole('button', { name: 'Remove filter: Earthquake' })
    ).toHaveTextContent('Earthquake');
  });

  it('uses a localised removal label and calls onDismiss', () => {
    const onDismiss = jest.fn();
    render(
      <Chips
        label="Séisme"
        Type="With X"
        removeLabel="Supprimer le filtre : Séisme"
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Supprimer le filtre : Séisme' })
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('composes consumer classes and attributes', () => {
    render(
      <Chips
        label="Flood"
        href="/topics/flood"
        className="listing-filter"
        data-testid="chip"
      />
    );

    expect(screen.getByTestId('chip')).toHaveClass('mg-chip', 'listing-filter');
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(
      <div>
        <Chips label="Climate risk" href="/topics/climate-risk" />
        <Chips label="Flood" Type="With X" />
      </div>
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
