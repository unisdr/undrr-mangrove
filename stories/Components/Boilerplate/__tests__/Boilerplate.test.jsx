import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Boilerplate } from '../Boilerplate';

describe('Boilerplate', () => {
  it('renders title and children', () => {
    render(
      <Boilerplate title="Hello">
        <p>Body text</p>
      </Boilerplate>,
    );

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Body text')).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    const { container } = render(
      <Boilerplate title="Test">
        <p>Content</p>
      </Boilerplate>,
    );

    expect(container.querySelector('.mg-boilerplate--primary')).toBeInTheDocument();
  });

  it('applies secondary variant when specified', () => {
    const { container } = render(
      <Boilerplate title="Test" variant="secondary">
        <p>Content</p>
      </Boilerplate>,
    );

    expect(container.querySelector('.mg-boilerplate--secondary')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(
      <Boilerplate title="Test">
        <p>Content</p>
      </Boilerplate>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
