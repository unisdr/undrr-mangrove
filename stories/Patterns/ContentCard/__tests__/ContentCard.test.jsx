import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { axe } from 'jest-axe';
import { ContentCard } from '../ContentCard';
import { ContentTeaser } from '../../ContentTeaser/ContentTeaser';
import {
  cardFixtures,
  mixedLanguageCards,
  cardsWithPublishedDates,
  datedCardStates,
} from '../contentCardFixtures';
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

test('unselected fields stay hidden while a missing deadline creates no placeholder', () => {
  const content = {
    ...cardFixtures.vacancy,
    deadline: undefined,
    image: cardFixtures.news.image,
  };
  const { container } = render(<ContentCard content={content} />);
  expect(container.querySelector('time,img,p,.mg-card__meta')).toBeNull();
  expect(container).not.toHaveTextContent(content.summary);
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

test('programme cards retain session-type links and distinct schedules without promoting theme topics', () => {
  const content = cardFixtures['conference-session'];
  const { container } = render(<ContentCard content={content} />);
  expect(
    screen.getByRole('link', { name: 'Technical session' })
  ).toHaveAttribute('href', '/programme/technical-sessions');
  expect(container.querySelectorAll('time')).toHaveLength(4);
  expect(container).toHaveTextContent('Session:');
  expect(container).toHaveTextContent('Exhibition:');
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

test.each(['vertical', 'book'])(
  '%s cards label primary and optional publication dates independently',
  async layout => {
    const { container } = render(
      <div>
        {cardsWithPublishedDates.map(content => (
          <ContentCard
            key={content.profile}
            content={content}
            layout={layout}
          />
        ))}
      </div>
    );
    const cards = [...container.querySelectorAll('article')];
    for (const [index, card] of cards.entries()) {
      const content = cardsWithPublishedDates[index];
      const times = [...card.querySelectorAll('time')];
      expect(times.at(-1)).toHaveAttribute(
        'datetime',
        content.published.dateTime
      );
      expect(times.at(-1).parentElement).toHaveTextContent(
        'Published on: 13 October 2026'
      );
      expect(times[0]).toHaveAttribute(
        'datetime',
        content.event?.start.dateTime ||
          content.session?.schedule[0].start.dateTime ||
          content.deadline.dateTime
      );
      expect(times[0].closest('p')).toHaveTextContent(
        content.event?.label ||
          content.session?.schedule[0].label ||
          content.deadline.label
      );
    }
    expect(await axe(container)).toHaveNoViolations();
  }
);

test.each(cardsWithPublishedDates.map(content => [content.profile, content]))(
  '%s rejects ambiguous date roles',
  (_, content) => {
    expect(() =>
      renderToStaticMarkup(
        <ContentCard
          content={{
            ...content,
            published: { ...content.published, label: undefined },
          }}
        />
      )
    ).toThrow('published.label');
    const noPrimaryLabel = { ...content };
    if (content.event)
      noPrimaryLabel.event = { ...content.event, label: undefined };
    if (content.deadline)
      noPrimaryLabel.deadline = { ...content.deadline, label: undefined };
    if (content.session)
      noPrimaryLabel.session = {
        ...content.session,
        schedule: content.session.schedule.map(range => ({
          ...range,
          label: undefined,
        })),
      };
    expect(() =>
      renderToStaticMarkup(<ContentCard content={noPrimaryLabel} />)
    ).toThrow(/label/);
  }
);

test('optional publication and explicit states do not invent or replace missing decision dates', () => {
  const content = { ...cardsWithPublishedDates[2], deadline: undefined };
  const { container, rerender } = render(<ContentCard content={content} />);
  expect(container.querySelectorAll('time')).toHaveLength(1);
  expect(container).toHaveTextContent('Published on:');
  expect(container).not.toHaveTextContent('Closing date:');
  rerender(<ContentCard content={datedCardStates[1]} />);
  expect(container).toHaveTextContent('Applications closed');
  expect(container).toHaveTextContent('Closing date: 30 September 2026');
  expect(container).not.toHaveTextContent('Published on:');
});

test('labels remain caller-localized and date ranges preserve time zones', () => {
  const source = cardsWithPublishedDates[0];
  const { container } = render(
    <ContentCard
      content={{
        ...source,
        event: { ...source.event, label: 'Veranstaltung:' },
        published: { ...source.published, label: 'Veröffentlicht am:' },
      }}
    />
  );
  expect(container).toHaveTextContent('Veranstaltung:');
  expect(container).toHaveTextContent('Veröffentlicht am:');
  expect(container).toHaveTextContent(source.event.timeZone);
  expect(container.querySelectorAll('time')).toHaveLength(3);
});
