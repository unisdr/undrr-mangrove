import React from 'react';
import { render } from '@testing-library/react';
import { PageActions } from '../PageActions.stories';

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
});

test('composes ShareButtons and a compact Cite this as equal columns', () => {
  const { container } = render(<PageActions />);
  expect(
    container.querySelector('.mg-grid__col-2 > .mg-share')
  ).toBeInTheDocument();
  expect(
    container.querySelector(
      '.mg-grid__col-2 > .mg-cite-this--compact .mg-cite-this__header'
    )
  ).toHaveTextContent('Cite this');
});

test('cite only uses the default trigger', () => {
  const { container } = render(<PageActions share={false} />);
  expect(container.querySelector('.mg-cite-this--compact')).toBeNull();
  expect(container.querySelector('.mg-cite-this__trigger')).toHaveTextContent(
    'Cite this'
  );
});

test.each([
  ['share only', { cite: false }, '.mg-share', '.mg-cite-this'],
  ['cite only', { share: false }, '.mg-cite-this', '.mg-share'],
])('%s renders one component', (_name, props, present, absent) => {
  const { container } = render(<PageActions {...props} />);
  expect(container.querySelector(present)).toBeInTheDocument();
  expect(container.querySelector(absent)).toBeNull();
});
