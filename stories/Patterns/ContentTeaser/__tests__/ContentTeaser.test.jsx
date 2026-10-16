import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { axe } from 'jest-axe';
import { ContentTeaser, resolveTeaserUrl } from '../ContentTeaser';
import { teaserFixtures } from '../contentTeaserFixtures';

describe('Content teaser contract', () => {
  test.each(Object.keys(teaserFixtures))(
    '%s exposes a native heading link and accessible metadata',
    async type => {
      const content = teaserFixtures[type];
      const { container } = render(<ContentTeaser content={content} />);
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
        content.title
      );
      expect(screen.getByRole('link')).toHaveAttribute('href', content.link);
      expect(await axe(container)).toHaveNoViolations();
      const html = renderToStaticMarkup(<ContentTeaser content={content} />);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      expect(doc.querySelector('h3 a').getAttribute('href')).toBe(content.link);
      expect(doc.querySelector('p').textContent).not.toBe('');
    }
  );
  test('optional content produces no empty visual, labels or metadata', () => {
    const { container } = render(
      <ContentTeaser
        content={{
          type: 'publication',
          title: 'Text only',
          link: '/publication',
        }}
        headingLevel={2}
      />
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Text only'
    );
    expect(
      container.querySelector('.mg-card__visual, .mg-card__meta, p')
    ).toBeNull();
  });
  test('short title is an explicit editorial choice, with blank fallback', () => {
    const { rerender } = render(
      <ContentTeaser
        content={{ ...teaserFixtures.news, shortTitle: 'Short title' }}
      />
    );
    expect(screen.getByRole('link')).toHaveTextContent('Short title');
    rerender(
      <ContentTeaser content={{ ...teaserFixtures.news, shortTitle: ' ' }} />
    );
    expect(screen.getByRole('link')).toHaveTextContent(
      teaserFixtures.news.title
    );
  });
  test('plain text cannot inject HTML or additional links in server output', () => {
    const html = renderToStaticMarkup(
      <ContentTeaser
        content={{
          ...teaserFixtures.news,
          summary: '<img src=x onerror=alert(1)>',
          title: '<script>alert(1)</script>',
        }}
      />
    );
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('script')).toBeNull();
    expect(doc.querySelectorAll('img')).toHaveLength(1);
    expect(doc.querySelector('p.mg-card__summary').textContent).toBe(
      '<img src=x onerror=alert(1)>'
    );
  });
  test('event dates are semantic and do not get replaced by publication time', () => {
    const { container } = render(
      <ContentTeaser
        content={{
          ...teaserFixtures.event,
          published: teaserFixtures.news.published,
        }}
      />
    );
    expect(container.querySelectorAll('time')).toHaveLength(2);
    expect(container.querySelector('time')).toHaveAttribute(
      'datetime',
      teaserFixtures.event.event.start.dateTime
    );
    expect(container).toHaveTextContent('Europe/Geneva');
    expect(container).not.toHaveTextContent('13 October');
  });
  test('date-only and incomplete events do not invent a time zone or range', () => {
    const { container, rerender } = render(
      <ContentTeaser
        content={{
          ...teaserFixtures.event,
          event: { start: { dateTime: '2026-11-04', text: '4 November 2026' } },
        }}
      />
    );
    expect(container.querySelectorAll('time')).toHaveLength(1);
    expect(container).not.toHaveTextContent('UTC');
    rerender(
      <ContentTeaser
        content={{
          ...teaserFixtures.event,
          event: { end: teaserFixtures.event.event.end, location: 'Online' },
        }}
      />
    );
    expect(container.querySelector('time')).toBeNull();
    expect(container).toHaveTextContent('Online');
  });
  test('cover sources and language survive server rendering without cropping or domain inference', () => {
    const { container } = render(
      <ContentTeaser content={teaserFixtures.publication} />
    );
    expect(container.querySelector('article')).toHaveAttribute('lang', 'en');
    expect(screen.getByRole('presentation')).toHaveAttribute(
      'src',
      teaserFixtures.publication.image.src
    );
    expect(container.firstChild).toHaveClass('mg-card__book');
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
  test.each([
    'javascript:alert(1)',
    '/\\external.example',
    'https://',
    'https://example.org/with\nnewline',
    'data:text/html,a',
    '//other.example/a',
    ' ',
    undefined,
  ])('rejects unsupported destination %s', link => {
    expect(resolveTeaserUrl(link)).toBeNull();
    expect(() =>
      renderToStaticMarkup(
        <ContentTeaser content={{ ...teaserFixtures.news, link }} />
      )
    ).toThrow(TypeError);
  });
});
