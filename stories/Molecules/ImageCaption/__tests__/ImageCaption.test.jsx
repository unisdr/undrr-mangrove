import React from 'react';
import { render } from '@testing-library/react';
import { Imagecaption } from '../ImageCaption';

test('a text caption renders as a single paragraph before the credit', () => {
  const { container } = render(
    <Imagecaption paragraph="Caption text" label="UNDRR" />
  );
  const figcaption = container.querySelector('figcaption.mg-image-caption');
  expect(figcaption.children).toHaveLength(2);
  expect(figcaption.children[0].tagName).toBe('P');
  expect(figcaption.children[0]).toHaveTextContent('Caption text');
  expect(figcaption.children[1]).toHaveClass('mg-credits');
  expect(
    container.querySelector('.mg-image-caption__text')
  ).not.toBeInTheDocument();
});

test('element content is wrapped in one caption text block before the credit', () => {
  const { container } = render(
    <Imagecaption
      paragraph={[<p key="a">First</p>, <p key="b">Second</p>]}
      label="UNDRR"
    />
  );
  const figcaption = container.querySelector('figcaption.mg-image-caption');
  expect(figcaption.children).toHaveLength(2);
  const text = figcaption.children[0];
  expect(text).toHaveClass('mg-image-caption__text');
  expect(text.querySelectorAll('p')).toHaveLength(2);
  expect(figcaption.children[1]).toHaveClass('mg-credits');
});

test('renders nothing when both caption and credit are off', () => {
  const { container } = render(
    <Imagecaption paragraph="Caption" caption={false} credit={false} />
  );
  expect(container).toBeEmptyDOMElement();
});
