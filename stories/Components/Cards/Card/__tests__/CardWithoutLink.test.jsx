import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { VerticalCard } from '../VerticalCard';
import { HorizontalCard } from '../HorizontalCard';
import { BookCard } from '../BookCard';
import { HorizontalBookCard } from '../HorizontalBookCard';

// Every card shape shares one rule: a card is a link only when it has a
// usable destination. Drupal Gutenberg has been emitting `<a href="">` for
// unlinked cards, which resolves to the current page and swallows clicks
// aimed at the card's own button, so the empty string counts as "no link".
const CARDS = [
  ['VerticalCard', VerticalCard],
  ['HorizontalCard', HorizontalCard],
  ['BookCard', BookCard],
  ['HorizontalBookCard', HorizontalBookCard],
];

const baseItem = {
  title: 'Jobs and Careers',
  summaryText: 'Stay current on the latest vacancies.',
  imgback: '/jobs.png',
  imgalt: 'illustration',
};

describe.each(CARDS)('%s without a link', (name, Card) => {
  it.each([
    ['an omitted link', {}],
    ['an empty link', { link: '' }],
    ['a whitespace-only link', { link: '   ' }],
  ])('renders the title as plain text given %s', (_label, linkProps) => {
    render(<Card data={[{ ...baseItem, ...linkProps }]} />);

    expect(
      screen.queryByRole('link', { name: 'Jobs and Careers' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Jobs and Careers')).toBeInTheDocument();
  });

  it('marks the article so styling can drop the clickable affordances', () => {
    const { container } = render(<Card data={[baseItem]} />);

    expect(container.querySelector('article')).toHaveClass('mg-card--no-link');
  });

  it('still renders the title as a link when a destination is present', () => {
    render(<Card data={[{ ...baseItem, link: '/careers' }]} />);

    expect(
      screen.getByRole('link', { name: 'Jobs and Careers' })
    ).toHaveAttribute('href', '/careers');
  });

  it('has no accessibility violations when unlinked', async () => {
    const { container } = render(<Card data={[baseItem]} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe.each([
  ['VerticalCard', VerticalCard],
  ['HorizontalCard', HorizontalCard],
  ['HorizontalBookCard', HorizontalBookCard],
])('%s labels without a link', (name, Card) => {
  const labelled = { ...baseItem, label1: 'Label 1', label2: 'Label 2' };

  it('keeps the labels visible as plain text', () => {
    render(<Card data={[labelled]} />);

    expect(screen.getByText('Label 1')).toBeInTheDocument();
    expect(screen.getByText('Label 2')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Label 1' })).toBeNull();
  });

  it('drops the interactive modifier from unlinked labels', () => {
    const { container } = render(<Card data={[labelled]} />);

    expect(
      container.querySelector('.mg-card__label--active')
    ).not.toBeInTheDocument();
  });
});

describe.each([
  ['VerticalCard', VerticalCard],
  ['HorizontalCard', HorizontalCard],
  ['HorizontalBookCard', HorizontalBookCard],
])('%s button-only card', (name, Card) => {
  it('gives the CTA its own destination via buttonLink', () => {
    render(
      <Card
        data={[
          {
            ...baseItem,
            button: 'Browse vacancies',
            buttonLink: 'https://www.preventionweb.net/community/careers',
          },
        ]}
      />
    );

    expect(
      screen.queryByRole('link', { name: 'Jobs and Careers' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Browse vacancies' })
    ).toHaveAttribute(
      'href',
      'https://www.preventionweb.net/community/careers'
    );
  });

  it('prefers buttonLink over link when both are given', () => {
    render(
      <Card
        data={[
          {
            ...baseItem,
            link: '/card-target',
            button: 'Browse vacancies',
            buttonLink: '/button-target',
          },
        ]}
      />
    );

    expect(
      screen.getByRole('link', { name: 'Jobs and Careers' })
    ).toHaveAttribute('href', '/card-target');
    expect(
      screen.getByRole('link', { name: 'Browse vacancies' })
    ).toHaveAttribute('href', '/button-target');
  });

  it('omits the CTA entirely when no destination resolves', () => {
    render(<Card data={[{ ...baseItem, button: 'Browse vacancies' }]} />);

    expect(screen.queryByText('Browse vacancies')).not.toBeInTheDocument();
  });
});
