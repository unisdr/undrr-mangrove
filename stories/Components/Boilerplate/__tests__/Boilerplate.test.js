import React from 'react';
import { render, screen } from '@testing-library/react';
import Boilerplate from '../Boilerplate';

describe('Boilerplate', () => {
  it('renders the title and children', () => {
    const title = 'Test Boilerplate';
    const childContent = 'Test content';

    render(
      <Boilerplate title={title}>
        <p>{childContent}</p>
      </Boilerplate>
    );

    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(childContent)).toBeInTheDocument();
  });
});
