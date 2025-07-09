import React from 'react';
import { Container } from './Container';

export default {
  title: 'Design decisions/Container',
  component: Container,
};

export const Default = () => (
  <Container className="mg-container--spacer">
    <h2>Default Container</h2>
    <p>
      This container has NO vertical padding - content goes right to the edges.
    </p>
    <div className="mg-grid">
      <div>
        <h2>Column 1</h2>
        <p>Content for the first column</p>
      </div>
      <div>
        <h2>Column 2</h2>
        <p>Content for the second column</p>
      </div>
    </div>
  </Container>
);

export const PaddedVariant = () => (
  <div style={{ border: '1px dashed black', backgroundColor: '#e0f7fa' }}>
    <Container className="mg-container--padded">
      <div style={{ border: '1px dashed black', backgroundColor: '#fff' }}>
        <h2>Padded Container</h2>
        <p>
          The `.mg-container--padded` variant is useful when you need padding
          above and below your container, without having to manually add padding
          to individual elements.
        </p>
      </div>
    </Container>
  </div>
);
