import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '../Header';

describe('Header', () => {
  it('renders the title and children', () => {
    const title = 'Test Header';
    const childContent = 'Test content';

    render(
      <Header title={title}>
        <p>{childContent}</p>
      </Header>
    );

    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(childContent)).toBeInTheDocument();
  });
});
