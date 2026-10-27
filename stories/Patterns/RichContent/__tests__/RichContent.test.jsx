import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { RichContent } from '../RichContent';
import { Boundaries } from '../RichContent.stories';

test.each(['ltr', 'rtl'])(
  'editorial specimen retains native semantics in %s',
  async dir => {
    const { container } = render(<RichContent dir={dir} />);
    expect(container.querySelector('article')).toHaveAttribute('dir', dir);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Planning'
    );
    const tables = screen.getAllByRole('table');
    expect(tables).toHaveLength(2);
    expect(within(tables[0]).getAllByRole('columnheader')).toHaveLength(2);
    expect(within(tables[0]).getAllByRole('rowheader')).toHaveLength(2);
    expect(screen.getByRole('img')).toHaveAccessibleName(/Illustrative/);
    expect(container.querySelector('blockquote cite a')).toHaveTextContent(
      'Sendai Framework'
    );
    expect(tables[0].parentElement).not.toHaveAttribute('tabindex');
    expect(
      screen.getByRole('region', { name: /Wide example/ })
    ).toHaveAttribute('tabindex', '0');
    expect(
      screen.getByRole('region', { name: /Scrollable code/ })
    ).toHaveAttribute('tabindex', '0');
    expect(await axe(container)).toHaveNoViolations();
  }
);

test('boundary specimen includes real components, legacy wrappers and classed prose', async () => {
  const { container } = render(Boundaries.render());
  expect(
    screen.getByRole('link', { name: 'classed editorial reference' })
  ).toHaveClass('editorial-reference');
  expect(
    screen.getByRole('link', { name: 'Paragraph-wrapped action' })
  ).toHaveClass('mg-button');
  expect(
    container.querySelector('#rich-boundaries .mg-card')
  ).toBeInTheDocument();
  expect(
    screen.getByRole('tab', { name: 'Editorial panel' })
  ).toBeInTheDocument();
  expect(screen.getByLabelText('Panel field')).toBeInTheDocument();
  expect(
    screen.getByRole('navigation', { name: 'Panel navigation' })
  ).not.toHaveAttribute('class');
  expect(screen.getByLabelText('Classless form field')).toBeInTheDocument();
  expect(container.querySelector('#legacy-body')).not.toHaveClass('mg-content');
  expect(container.querySelector('#both-boundaries')).toHaveClass(
    'mg-body',
    'mg-content'
  );
  expect(await axe(container)).toHaveNoViolations();
});
