import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { axe } from 'jest-axe';
import { ContentCard } from '../ContentCard';
import { ContentTeaser } from '../../ContentTeaser/ContentTeaser';
import { cardFixtures, mixedLanguageCards } from '../contentCardFixtures';
import { CONTENT_FAMILIES } from '../../Content/contentFamilies';
import {
  CONTENT_FIELDS,
  resolveContentPresentation,
} from '../../Content/contentPresentations';

const cases = Object.entries(cardFixtures).flatMap(([key, content]) =>
  ['vertical', 'book'].map(layout => [key, layout, content])
);
test.each(cases)(
  '%s %s card has a native heading link, static output and accessible structure',
  async (_, layout, content) => {
    const { container } = render(
      <ContentCard content={content} layout={layout} />
    );
    const heading = screen.getByRole('heading', { level: 3 });
    expect(within(heading).getByRole('link')).toHaveAttribute(
      'href',
      content.link
    );
    expect(heading).toHaveTextContent(content.shortTitle || content.title);
    expect(await axe(container)).toHaveNoViolations();
    expect(
      renderToStaticMarkup(<ContentCard content={content} layout={layout} />)
    ).toContain(content.link);
    expect(container.firstChild).toHaveAttribute(
      'data-content-profile',
      content.profile
    );
  }
);

test('card selection omits teaser-only data, including unlabelled hidden dates', () => {
  const content = {
    ...cardFixtures.vacancy,
    deadline: { dateTime: '2026-11-01', text: 'Hidden closing date' },
    published: { dateTime: '2026', text: 'Hidden year' },
    image: cardFixtures.news.image,
  };
  const { container } = render(<ContentCard content={content} />);
  expect(container.querySelector('time,img,p,.mg-card__meta')).toBeNull();
  expect(container).not.toHaveTextContent('Hidden');
});

test('vertical and book layouts share card selection; teaser keeps its richer hierarchy', () => {
  const content = cardFixtures.publication;
  const vertical = renderToStaticMarkup(<ContentCard content={content} />);
  const book = renderToStaticMarkup(
    <ContentCard content={content} layout="book" />
  );
  for (const html of [vertical, book]) {
    expect(html).not.toContain(content.summary);
    expect(html).not.toContain(content.published.text);
    expect(html).toContain(content.title);
  }
  expect(renderToStaticMarkup(<ContentTeaser content={content} />)).toContain(
    content.summary
  );
});

test('cover/logo semantics and absent media are explicit, not inferred from card layout', () => {
  const { container, rerender } = render(
    <ContentCard content={cardFixtures.publication} />
  );
  expect(container.firstChild).toHaveClass('mg-card__book');
  rerender(<ContentCard content={cardFixtures.organization} layout="book" />);
  expect(container.firstChild).toHaveClass('mg-content-pattern--logo');
  expect(container.firstChild).not.toHaveClass('mg-card__book');
  rerender(
    <ContentCard
      content={{ ...cardFixtures.publication, image: undefined }}
      layout="book"
    />
  );
  expect(container.querySelector('.mg-card__visual')).toBeNull();
});

test('missing labels create no empty metadata row, and fields remain plain text', () => {
  const { container } = render(
    <ContentCard
      content={{
        ...cardFixtures.news,
        typeLabel: undefined,
        labels: [],
        title: '<script>unsafe</script>',
      }}
    />
  );
  expect(container.querySelector('.mg-card__meta,script')).toBeNull();
  expect(screen.getByRole('heading')).toHaveTextContent(
    '<script>unsafe</script>'
  );
});

test('resource and programme taxonomy destinations retain separate native links', () => {
  render(<ContentCard content={cardFixtures.resource} />);
  expect(
    screen.getByRole('link', { name: 'Training toolkit' })
  ).toHaveAttribute('href', '/resource-types/training-toolkit');
});

test('all profile projections use known fields; all card references expose both layouts', () => {
  for (const family of CONTENT_FAMILIES)
    for (const [id, profile] of Object.entries(family.profiles)) {
      for (const name of ['teaser', 'card']) {
        const resolved = resolveContentPresentation(family.id, id, name);
        expect(resolved).not.toBeNull();
        expect(
          [...resolved.fields.before, ...resolved.fields.after].every(field =>
            CONTENT_FIELDS.includes(field)
          )
        ).toBe(true);
      }
      expect(profile.presentations.card.layouts).toEqual(['vertical', 'book']);
      expect(profile.presentations.card.layoutReferences.book.id).toMatch(
        /-book$/
      );
    }
});

test.each(['sideways', 'horizontal'])(
  'unsupported card layout %s is rejected',
  layout => {
    expect(() =>
      renderToStaticMarkup(
        <ContentCard content={cardFixtures.news} layout={layout} />
      )
    ).toThrow(TypeError);
  }
);

test('resolved defaults and mixed-language direction are present in static output', () => {
  const { container } = render(
    <div dir="ltr">
      {mixedLanguageCards.map((content, index) => (
        <ContentCard key={index} content={content} />
      ))}
    </div>
  );
  const arabic = container.querySelector('article[lang="ar"]');
  expect(arabic).toHaveAttribute('dir', 'auto');
  const html = renderToStaticMarkup(
    <ContentCard content={{ ...cardFixtures.news, profile: undefined }} />
  );
  expect(html).toContain('data-content-profile="news"');
});

test.each(['resource', 'event', 'person'])(
  '%s card can show media that its teaser omits',
  key => {
    const content = { ...cardFixtures[key], image: cardFixtures.news.image };
    const { container, rerender } = render(<ContentTeaser content={content} />);
    expect(container.querySelector('img')).toBeNull();
    rerender(<ContentCard content={content} />);
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      content.image.src
    );
  }
);

test('programme cards retain session-type links without promoting theme topics or schedules', () => {
  const content = cardFixtures['conference-session'];
  const { container } = render(<ContentCard content={content} />);
  expect(
    screen.getByRole('link', { name: 'Technical session' })
  ).toHaveAttribute('href', '/programme/technical-sessions');
  expect(container.querySelector('time')).toBeNull();
  expect(container).not.toHaveTextContent('Risk governance');
});

test('asset meaning can preserve a resource cover without revealing media hidden by its presentation', () => {
  const cover = { ...cardFixtures.publication.image, kind: 'cover' };
  const { container, rerender } = render(
    <ContentCard
      content={{ ...cardFixtures.resource, image: cover }}
      layout="book"
    />
  );
  expect(container.firstChild).toHaveClass('mg-card__book');
  expect(container.firstChild).toHaveAttribute('data-content-media', 'cover');
  rerender(
    <ContentCard
      content={{ ...cardFixtures.vacancy, image: cover }}
      layout="book"
    />
  );
  expect(container.querySelector('img')).toBeNull();
});
