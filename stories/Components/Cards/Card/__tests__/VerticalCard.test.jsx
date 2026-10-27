import React from 'react';
import { render, screen } from '@testing-library/react';
import { VerticalCard } from '../VerticalCard';

describe('VerticalCard', () => {
  it('shares link destination attributes between its title and CTA', () => {
    render(
      <VerticalCard
        data={[
          {
            title: 'Explore Mangrove',
            summaryText: 'Read the component guidance.',
            button: 'Open guidance',
            link: '#guidance',
            target: '_top',
            rel: 'help',
          },
        ]}
      />
    );

    const title = screen.getByRole('link', { name: 'Explore Mangrove' });
    const action = screen.getByRole('link', { name: 'Open guidance' });

    expect(title).toHaveAttribute('href', '#guidance');
    expect(title).toHaveAttribute('target', '_top');
    expect(title).toHaveAttribute('rel', 'help');
    expect(action).toHaveAttribute('href', '#guidance');
    expect(action).toHaveAttribute('target', '_top');
    expect(action).toHaveAttribute('rel', 'help');
  });
});
