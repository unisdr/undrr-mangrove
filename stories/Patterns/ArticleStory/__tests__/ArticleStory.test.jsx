import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ArticleStory } from '../ArticleStory';

test('the headline carries the page, with or without a header image', () => {
  render(<ArticleStory heroImage="none" />);
  expect(
    screen.getByRole('heading', {
      level: 1,
      name: 'Towards knowledge, action and resolve to address non-economic losses in the Pacific Indigenous Communities Nadi, Fiji',
    })
  ).toBeVisible();
});

test('drops the header image when heroImage is "none"', () => {
  const { container } = render(<ArticleStory heroImage="none" />);
  const header = container.querySelector('.mg-demo-article-header');
  expect(within(header).queryByRole('img')).not.toBeInTheDocument();
});

test('the headline sits above the header image, not the other way round', () => {
  const { container } = render(<ArticleStory heroImage="main" />);
  const header = container.querySelector('.mg-demo-article-header');
  const heading = within(header).getByRole('heading', { level: 1 });
  const image = within(header).getByRole('img');
  // eslint-disable-next-line no-bitwise
  expect(
    heading.compareDocumentPosition(image) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
});

test('the main and alternate hero images are visibly different photos', () => {
  const main = render(<ArticleStory heroImage="main" />);
  const mainImg = within(
    main.container.querySelector('.mg-demo-article-header')
  ).getByRole('img');
  main.unmount();

  const alternate = render(<ArticleStory heroImage="alternate" />);
  const alternateImg = within(
    alternate.container.querySelector('.mg-demo-article-header')
  ).getByRole('img');

  expect(alternateImg.getAttribute('src')).not.toBe(
    mainImg.getAttribute('src')
  );
  expect(alternateImg.getAttribute('alt')).not.toBe(mainImg.getAttribute('alt'));
});

test('the large treatment bleeds the header image full width; compact keeps it in the reading column', () => {
  const large = render(<ArticleStory imageProminence="large" />);
  expect(
    large.container.querySelector(
      '.mg-demo-article-header .mg-container-full-width'
    )
  ).toBeInTheDocument();
  large.unmount();

  const compact = render(<ArticleStory imageProminence="compact" />);
  expect(
    compact.container.querySelector(
      '.mg-demo-article-header .mg-container-full-width'
    )
  ).not.toBeInTheDocument();
  expect(
    compact.container.querySelector('.mg-demo-article-media--compact img')
  ).toBeInTheDocument();
});

test('offers social share actions for the article', () => {
  const { container } = render(<ArticleStory />);
  const header = container.querySelector('.mg-demo-article-header');
  expect(within(header).getByRole('button', { name: 'Share on LinkedIn' })).toBeInTheDocument();
  expect(within(header).getByRole('button', { name: 'Share on Facebook' })).toBeInTheDocument();
});

test('lists editors’ recommendations as links', () => {
  render(<ArticleStory />);
  const heading = screen.getByRole('heading', {
    name: "Editors' recommendations",
  });
  const list = heading.nextElementSibling;
  expect(within(list).getAllByRole('link').length).toBeGreaterThan(0);
});

test('groups explore-further tags by taxonomy (hazards, themes, country and region)', () => {
  const { container } = render(<ArticleStory />);
  screen.getByRole('heading', { name: 'Explore further' });
  expect(screen.getByText('Hazards')).toBeInTheDocument();
  expect(screen.getByText('Themes')).toBeInTheDocument();
  expect(screen.getByText('Country and region')).toBeInTheDocument();
  expect(
    container.querySelectorAll('.mg-tag-container a').length
  ).toBeGreaterThan(0);
});

test('asks whether the page was useful and offers to report an issue', () => {
  render(<ArticleStory />);
  expect(
    screen.getByRole('heading', { name: 'Is this page useful?' })
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Report an issue on this page' })
  ).toBeInTheDocument();
});

test('related news and events are listed as linked cards', () => {
  render(<ArticleStory />);
  const related = screen.getByRole('heading', {
    name: 'Related news and events',
  });
  const section = related.closest('section');
  const links = within(section).getAllByRole('link');
  expect(links).toHaveLength(3);
  expect(links[0]).toHaveAttribute('href', expect.stringContaining('https://'));
});

test('has no accessibility violations across the image variants', async () => {
  for (const props of [
    { imageProminence: 'large', heroImage: 'main' },
    { imageProminence: 'compact', heroImage: 'none' },
    { imageProminence: 'compact', heroImage: 'alternate' },
  ]) {
    const { container, unmount } = render(<ArticleStory {...props} />);
    // eslint-disable-next-line no-await-in-loop
    expect(await axe(container)).toHaveNoViolations();
    unmount();
  }
});

test('renders the Arabic locale right-to-left with translated copy', () => {
  const { container } = render(<ArticleStory locale="arabic" />);
  expect(container.firstChild).toHaveAttribute('dir', 'rtl');
  expect(container.firstChild).toHaveAttribute('lang', 'ar');
  expect(
    screen.getByRole('heading', { level: 1 })
  ).toHaveTextContent(/\p{Script=Arabic}/u);
});
