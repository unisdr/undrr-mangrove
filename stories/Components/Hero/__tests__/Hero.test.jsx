import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Hero } from '../Hero';

const baseItem = {
  title: 'Test Hero Title',
  summaryText: 'Test summary text.',
  label: 'Test Label',
  primary_button: 'Primary action',
  imgback: 'https://example.com/image.jpg',
};

const splitItem = {
  ...baseItem,
  media: {
    type: 'image',
    src: 'https://example.com/photo.jpg',
    alt: 'A test photo',
  },
};

describe('Hero — background layout (default)', () => {
  it('renders the section with mg-hero class', () => {
    const { container } = render(<Hero data={[baseItem]} />);
    expect(container.querySelector('.mg-hero')).toBeInTheDocument();
  });

  it('applies background image via inline style', () => {
    const { container } = render(<Hero data={[baseItem]} />);
    const section = container.querySelector('.mg-hero');
    expect(section).toHaveStyle(
      `background-image: url(${baseItem.imgback})`
    );
  });

  it('renders a variant class', () => {
    const { container } = render(<Hero data={[baseItem]} variant="secondary" />);
    expect(container.querySelector('.mg-hero--secondary')).toBeInTheDocument();
  });

  it('renders title text', () => {
    render(<Hero data={[baseItem]} />);
    expect(screen.getByText('Test Hero Title')).toBeInTheDocument();
  });

  it('does not render mg-hero--split class', () => {
    const { container } = render(<Hero data={[baseItem]} />);
    expect(container.querySelector('.mg-hero--split')).not.toBeInTheDocument();
  });
});

describe('Hero — headingLevel', () => {
  it('renders h1 by default', () => {
    render(<Hero data={[baseItem]} />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders h2 when headingLevel="h2"', () => {
    render(<Hero data={[baseItem]} headingLevel="h2" />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('renders h3 when headingLevel="h3"', () => {
    render(<Hero data={[baseItem]} headingLevel="h3" />);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('wraps a link inside the heading element', () => {
    const itemWithLink = { ...baseItem, link: '/some-page' };
    render(<Hero data={[itemWithLink]} headingLevel="h2" />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.querySelector('a[href="/some-page"]')).toBeInTheDocument();
  });
});

describe('Hero — split layout', () => {
  it('renders mg-hero--split class', () => {
    const { container } = render(
      <Hero data={[splitItem]} layout="split" />
    );
    expect(container.querySelector('.mg-hero--split')).toBeInTheDocument();
  });

  it('does not apply background-image inline style', () => {
    const { container } = render(
      <Hero data={[splitItem]} layout="split" />
    );
    const section = container.querySelector('.mg-hero--split');
    expect(section).not.toHaveStyle('background-image: url(https://example.com/image.jpg)');
  });

  it('renders __split-grid container', () => {
    const { container } = render(
      <Hero data={[splitItem]} layout="split" />
    );
    expect(container.querySelector('.mg-hero__split-grid')).toBeInTheDocument();
  });

  it('applies default split class mg-hero--split-2-3', () => {
    const { container } = render(
      <Hero data={[splitItem]} layout="split" />
    );
    expect(container.querySelector('.mg-hero--split-2-3')).toBeInTheDocument();
  });

  it('applies mg-hero--split-1-2 for split="1/2"', () => {
    const { container } = render(
      <Hero data={[splitItem]} layout="split" split="1/2" />
    );
    expect(container.querySelector('.mg-hero--split-1-2')).toBeInTheDocument();
  });

  it('applies mg-hero--split-1-3 for split="1/3"', () => {
    const { container } = render(
      <Hero data={[splitItem]} layout="split" split="1/3" />
    );
    expect(container.querySelector('.mg-hero--split-1-3')).toBeInTheDocument();
  });

  it('applies variant class alongside split', () => {
    const { container } = render(
      <Hero data={[splitItem]} layout="split" variant="secondary" />
    );
    expect(container.querySelector('.mg-hero--split.mg-hero--secondary')).toBeInTheDocument();
  });

  it('renders media image', () => {
    render(<Hero data={[splitItem]} layout="split" />);
    const img = screen.getByRole('img', { name: 'A test photo' });
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('renders img with empty alt when alt is omitted', () => {
    const itemNoAlt = {
      ...baseItem,
      media: { type: 'image', src: 'https://example.com/photo.jpg' },
    };
    const { container } = render(<Hero data={[itemNoAlt]} layout="split" />);
    const img = container.querySelector('.mg-hero__media-img');
    expect(img).toHaveAttribute('alt', '');
  });

  it('renders gracefully without media (no __media element)', () => {
    const { container } = render(
      <Hero data={[baseItem]} layout="split" />
    );
    expect(container.querySelector('.mg-hero__media')).not.toBeInTheDocument();
  });

  it('renders headingLevel inside split layout', () => {
    render(<Hero data={[splitItem]} layout="split" headingLevel="h2" />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('wraps link inside heading in split layout', () => {
    const itemWithLink = { ...splitItem, link: '/topic' };
    render(<Hero data={[itemWithLink]} layout="split" headingLevel="h2" />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.querySelector('a[href="/topic"]')).toBeInTheDocument();
  });
});

describe('Hero — accessibility', () => {
  it('has no axe violations in background layout', async () => {
    const { container } = render(<Hero data={[baseItem]} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations in split layout', async () => {
    const { container } = render(
      <Hero data={[splitItem]} layout="split" headingLevel="h2" />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
