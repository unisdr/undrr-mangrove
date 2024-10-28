import React from 'react';
import { Container } from './Container';

export default {
  title: 'Design decisions/Container',
  component: Container,
};

export const Default = () => (
  <Container className="mg-container--spacer">
    <h1>Responsive Container</h1>
    <p>This container adjusts its width based on the screen size.</p>
    <p>The `Container` component can be used in conjunction with column layouts, such as the `mg-grid` system. Here's an example of how to integrate `Container` with `mg-grid`:</p>
      <div className="mg-grid">
        <div className="mg-col-4">
          <h2>Column 1</h2>
          <p>Content for the first column</p>
        </div>
        <div className="mg-col-4">
          <h2>Column 2</h2>
          <p>Content for the second column</p>
        </div>
      </div>
  </Container>
);