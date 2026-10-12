import React from 'react';
import { render } from '@testing-library/react';
import { PageActions } from '../PageActions.stories';

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
});

test('composes ShareButtons and a secondary Cite this', () => {
  const { container } = render(<PageActions />);
  expect(container.querySelector('.mg-share')).toBeInTheDocument();
  expect(
    container.querySelector('.mg-cite-this--secondary .mg-cite-this__trigger')
  ).toHaveTextContent('Cite this');
});

test.each([
  ['share only', { cite: false }, '.mg-share', '.mg-cite-this'],
  ['cite only', { share: false }, '.mg-cite-this', '.mg-share'],
])('%s renders one component', (_name, props, present, absent) => {
  const { container } = render(<PageActions {...props} />);
  expect(container.querySelector(present)).toBeInTheDocument();
  expect(container.querySelector(absent)).toBeNull();
});
