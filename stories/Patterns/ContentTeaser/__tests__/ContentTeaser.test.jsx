import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { axe } from 'jest-axe';
import { ContentTeaser, resolveTeaserUrl } from '../ContentTeaser';
import { DRUPAL_CONTENT_PATTERNS } from '../../../Integrations/Drupal/contentPatterns';
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
      expect(
        within(screen.getByRole('heading')).getByRole('link')
      ).toHaveAttribute('href', content.link);
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
    expect(container).toHaveTextContent('4–5 November 2026');
    expect(container).not.toHaveTextContent('UTC');
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
    expect(container.firstChild).toHaveClass('mg-card__hc', 'mg-card-book__hc');
    expect(
      screen.getByRole('link', { name: teaserFixtures.publication.title })
    ).toHaveAttribute('href', teaserFixtures.publication.link);
    expect(screen.getByRole('link', { name: 'Guidance' })).toHaveAttribute(
      'href',
      '/publications/guidance'
    );
  });
  test.each(['news', 'publication'])(
    '%s date precedes the heading as configured in Display Suite',
    type => {
      const { container } = render(
        <ContentTeaser content={teaserFixtures[type]} />
      );
      expect(
        container
          .querySelector('time')
          .compareDocumentPosition(container.querySelector('h3'))
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    }
  );
  test.each(['resource', 'event'])(
    '%s omits media and publication dates even when present upstream',
    type => {
      const { container } = render(
        <ContentTeaser
          content={{
            ...teaserFixtures[type],
            image: teaserFixtures.news.image,
            published: teaserFixtures.news.published,
            source: 'Hidden event attribution',
          }}
        />
      );
      expect(container.querySelector('img')).toBeNull();
      expect(container).not.toHaveTextContent('13 October 2026');
      if (type === 'event')
        expect(container).not.toHaveTextContent('Hidden event attribution');
      expect(
        container
          .querySelector('.mg-card__meta')
          .compareDocumentPosition(container.querySelector('h3'))
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    }
  );
  test('publication symbol follows the title and precedes the summary', () => {
    const { container } = render(
      <ContentTeaser content={teaserFixtures.publication} />
    );
    const paragraphs = [...container.querySelectorAll('p')];
    expect(paragraphs[0]).toHaveTextContent('UNDRR/2026/1');
    expect(paragraphs[1]).toHaveClass('mg-card__summary');
  });
  test('an empty event creates no empty metadata container', () => {
    const { container } = render(
      <ContentTeaser
        content={{ type: 'event', title: 'Event', link: '/event', event: {} }}
      />
    );
    expect(container.querySelector('.mg-card__meta')).toBeNull();
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

describe('Complete indexed content coverage', () => {
  test('explicit bundle mapping covers the fifteen configured node types', () => {
    expect(Object.keys(DRUPAL_CONTENT_PATTERNS).sort()).toEqual(
      [
        'blog',
        'collections',
        'commitment',
        'conference_event',
        'event',
        'hazard_information_profile',
        'landing_page_gutenberg',
        'national_platform',
        'news',
        'organization',
        'people',
        'publication',
        'resource',
        'terminology',
        'vacancy',
      ].sort()
    );
    expect(
      Object.values(DRUPAL_CONTENT_PATTERNS)
        .map(binding => `${binding.type}/${binding.profile}`)
        .sort()
    ).toEqual(
      Object.values(teaserFixtures)
        .map(content => `${content.type}/${content.profile}`)
        .sort()
    );
  });
  test.each(Object.keys(teaserFixtures))(
    '%s remains accessible with only required fields',
    async type => {
      const { container } = render(
        <ContentTeaser
          content={{
            type: teaserFixtures[type].type,
            profile: teaserFixtures[type].profile,
            title: 'Minimal result',
            link: '/minimal',
          }}
        />
      );
      expect(screen.getByRole('link')).toHaveTextContent('Minimal result');
      expect(container.querySelector('img, p, ul, .mg-card__meta')).toBeNull();
      expect(await axe(container)).toHaveNoViolations();
    }
  );
  test('blog authors remain separate list items before the title', () => {
    const { container } = render(
      <ContentTeaser content={teaserFixtures.blog} />
    );
    expect(
      within(screen.getByRole('list')).getAllByRole('listitem')
    ).toHaveLength(2);
    expect(
      screen
        .getByRole('list')
        .compareDocumentPosition(container.querySelector('h3'))
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
  test('multiple source organizations survive static HTML without becoming links', () => {
    const doc = new DOMParser().parseFromString(
      renderToStaticMarkup(
        <ContentTeaser content={teaserFixtures.publication} />
      ),
      'text/html'
    );
    expect(
      [...doc.querySelectorAll('li')].map(item => item.textContent)
    ).toEqual(['UNDRR', 'Partner organization']);
    expect(doc.querySelector('li a')).toBeNull();
  });
  test('metadata links are independent siblings of the primary title link', () => {
    const { container } = render(
      <ContentTeaser
        content={{
          ...teaserFixtures.publication,
          labels: [
            { label: 'Topic', link: '/topic' },
            { label: 'Untrusted', link: 'javascript:alert(1)' },
          ],
        }}
      />
    );
    expect(screen.getByRole('link', { name: 'Topic' })).toHaveAttribute(
      'href',
      '/topic'
    );
    expect(screen.queryByRole('link', { name: 'Untrusted' })).toBeNull();
    expect(container.querySelector('a a')).toBeNull();
    expect(
      screen.getByRole('link', { name: teaserFixtures.publication.title })
    ).toHaveAttribute('href', teaserFixtures.publication.link);
  });
  test('organization logo keeps its source while organization type follows summary', () => {
    const { container } = render(
      <ContentTeaser content={teaserFixtures.organization} />
    );
    expect(container.firstChild).toHaveClass('mg-content-pattern--logo');
    expect(screen.getByRole('presentation')).toHaveAttribute(
      'src',
      teaserFixtures.organization.image.src
    );
    expect(
      [...container.querySelectorAll('p')].map(p => p.textContent)
    ).toEqual([
      teaserFixtures.organization.summary,
      teaserFixtures.organization.organizationType.join(' '),
    ]);
  });
  test.each(['updated', 'created'])(
    'collection %s freshness is supplied explicitly, never substituted with published_at',
    kind => {
      const content = {
        ...teaserFixtures.collection,
        published: teaserFixtures.news.published,
        freshness: {
          kind,
          date: {
            label: kind === 'updated' ? 'Last updated' : 'Created',
            dateTime: '2026-09-01',
            text: '1 Sep 2026',
          },
        },
      };
      const { container } = render(<ContentTeaser content={content} />);
      expect(container.querySelector('time')).toHaveAttribute(
        'datetime',
        '2026-09-01'
      );
      expect(container.querySelector('[data-freshness-kind]')).toHaveAttribute(
        'data-freshness-kind',
        kind
      );
      expect(container).not.toHaveTextContent('13 October');
    }
  );
  test('vacancy renders its closing date and supplied status, without using publication time', () => {
    const { container } = render(
      <ContentTeaser
        content={{
          ...teaserFixtures.vacancy,
          status: 'Closed',
          published: teaserFixtures.news.published,
        }}
      />
    );
    expect(container).toHaveTextContent('Closing date: 30 Nov 2026');
    expect(container).toHaveTextContent('Closed');
    expect(container.querySelector('time')).toHaveAttribute(
      'datetime',
      '2026-11-30'
    );
    expect(container).not.toHaveTextContent('13 October');
  });
  test('hazard notation and classification precede its title', () => {
    const { container } = render(
      <ContentTeaser content={teaserFixtures['hazard-profile']} />
    );
    expect(container.querySelector('.mg-card__meta')).toHaveTextContent(
      'Hydrological EX-001'
    );
    expect(screen.getByRole('link', { name: 'Hydrological' })).toHaveAttribute(
      'href',
      '/hazards/hydrological'
    );
  });
  test('conference sessions preserve separate schedules, exhibit ranges, room hierarchy and linked themes', () => {
    const { container } = render(
      <ContentTeaser content={teaserFixtures['conference-session']} />
    );
    expect(container.querySelectorAll('time')).toHaveLength(4);
    expect(container.querySelector('.mg-card__meta')).toHaveTextContent(
      'Technical session'
    );
    expect(container.querySelector('.mg-card__meta')).toHaveTextContent(
      'Exhibition:'
    );
    expect(container.querySelector('.mg-card__meta')).toHaveTextContent(
      'Conference centre / Level 1 / Room A'
    );
    expect(container.querySelector('.mg-card__meta')).toHaveTextContent(
      'Onsite & Online'
    );
    expect(
      screen.getByRole('link', { name: 'Risk governance' })
    ).toHaveAttribute('href', '/programme/themes/risk-governance');
  });
  test('people do not inherit hidden profile fields from the full view', () => {
    const { container } = render(
      <ContentTeaser
        content={{
          ...teaserFixtures.person,
          image: teaserFixtures.news.image,
          sources: ['Hidden organization'],
          published: teaserFixtures.news.published,
          location: 'Hidden location',
        }}
      />
    );
    expect(container.querySelector('img, time, ul, .mg-card__meta')).toBeNull();
    expect(container).not.toHaveTextContent('Hidden');
  });
  test.each(['toString', '__proto__', 'unknown'])(
    'unknown type %s cannot select an inherited presentation',
    type => {
      expect(() =>
        renderToStaticMarkup(
          <ContentTeaser
            content={{ type, title: 'Unknown', link: '/unknown' }}
          />
        )
      ).toThrow(TypeError);
    }
  );
});

describe('Red-team regression cases', () => {
  test('multi-value locations, organization categories and commitment statuses retain order', () => {
    const { container, rerender } = render(
      <ContentTeaser
        content={{ ...teaserFixtures.resource, location: ['Africa', 'Asia'] }}
      />
    );
    expect(container.querySelector('.mg-card__meta')).toHaveTextContent(
      'Training toolkit Africa Asia Online'
    );
    rerender(
      <ContentTeaser
        content={{
          ...teaserFixtures.organization,
          organizationType: ['Category A', 'Category B'],
        }}
      />
    );
    expect(container.querySelector('p:last-child')).toHaveTextContent(
      'Category A Category B'
    );
    rerender(
      <ContentTeaser
        content={{
          ...teaserFixtures.commitment,
          status: ['In progress', 'Ongoing'],
        }}
      />
    );
    expect(container.querySelector('.mg-card__meta')).toHaveTextContent(
      'National In progress Ongoing 1 September 2026'
    );
  });
  test('static metadata contains textual boundaries between fields, authors, topics and ranges', () => {
    const html = renderToStaticMarkup(
      <ContentTeaser content={teaserFixtures.blog} />
    );
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('.mg-card__meta').textContent).toBe(
      'Opinion 12 Oct 2026 Amira Khan Daniel Okoro'
    );
    const session = teaserFixtures['conference-session'];
    const content = {
      ...session,
      session: {
        ...session.session,
        schedule: [
          session.session.schedule[0],
          {
            label: 'Second session:',
            start: { dateTime: '2026-11-06', text: '6 Nov 2026' },
          },
        ],
      },
    };
    const sessionDoc = new DOMParser().parseFromString(
      renderToStaticMarkup(<ContentTeaser content={content} />),
      'text/html'
    );
    expect(sessionDoc.querySelector('.mg-card__meta').textContent).toContain(
      'Europe/Geneva (UTC+01:00)) Second session: 6 Nov 2026 Exhibition:'
    );
    expect(sessionDoc.querySelector('p:last-child').textContent).toBe(
      'Risk governance Local action'
    );
  });
  test.each(['updated', 'created'])(
    'visible %s freshness requires a caller-localized role label',
    kind => {
      const content = {
        ...teaserFixtures.collection,
        freshness: {
          kind,
          date: { dateTime: '2026-09-01', text: '1 Sep 2026' },
        },
      };
      expect(() =>
        renderToStaticMarkup(<ContentTeaser content={content} />)
      ).toThrow(/freshness.date.label/);
    }
  );
  test('visible vacancy deadlines require a role label, while the whole deadline remains optional', () => {
    const content = {
      ...teaserFixtures.vacancy,
      deadline: { dateTime: '2026-11-30', text: '30 Nov 2026' },
    };
    expect(() =>
      renderToStaticMarkup(<ContentTeaser content={content} />)
    ).toThrow(/deadline.label/);
    expect(() =>
      renderToStaticMarkup(
        <ContentTeaser content={{ ...content, deadline: undefined }} />
      )
    ).not.toThrow();
  });
  test('session and exhibition labels are required when both meanings are displayed', () => {
    const content = teaserFixtures['conference-session'];
    const { label, ...unlabelled } = content.session.schedule[0];
    expect(() =>
      renderToStaticMarkup(
        <ContentTeaser
          content={{
            ...content,
            session: { ...content.session, schedule: [unlabelled] },
          }}
        />
      )
    ).toThrow(/session.schedule/);
    const { label: exhibitionLabel, ...unlabelledExhibition } =
      content.session.exhibitions[0];
    expect(() =>
      renderToStaticMarkup(
        <ContentTeaser
          content={{
            ...content,
            session: {
              ...content.session,
              exhibitions: [unlabelledExhibition],
            },
          }}
        />
      )
    ).toThrow(/session.exhibitions/);
    expect(() =>
      renderToStaticMarkup(
        <ContentTeaser
          content={{
            ...content,
            session: {
              ...content.session,
              schedule: [unlabelled],
              exhibitions: [],
            },
          }}
        />
      )
    ).not.toThrow();
  });
  test('date-role validation does not invent English labels in translated content', () => {
    const { container } = render(
      <ContentTeaser
        content={{
          ...teaserFixtures.collection,
          lang: 'ar',
          freshness: {
            kind: 'updated',
            date: {
              label: 'آخر تحديث',
              dateTime: '2026-09-01',
              text: '١ سبتمبر ٢٠٢٦',
            },
          },
        }}
      />
    );
    expect(container).toHaveTextContent('آخر تحديث ١ سبتمبر ٢٠٢٦');
    expect(container).not.toHaveTextContent('Last updated');
  });
});

describe('Archetype and profile selection', () => {
  test.each(['commentary', 'toString'])(
    'incompatible Event profile %s fails explicitly',
    profile => {
      expect(() =>
        renderToStaticMarkup(
          <ContentTeaser
            content={{
              type: 'event',
              profile,
              title: 'Example',
              link: '/example',
            }}
          />
        )
      ).toThrow(TypeError);
    }
  );
  test('omitted Article profile uses news, while commentary preserves author selection', () => {
    const article = {
      ...teaserFixtures.blog,
      profile: undefined,
      shortTitle: 'Brief title',
    };
    const defaultHtml = renderToStaticMarkup(
      <ContentTeaser content={article} />
    );
    expect(defaultHtml).toContain('Brief title');
    for (const author of article.authors)
      expect(defaultHtml).not.toContain(author);
    const commentaryHtml = renderToStaticMarkup(
      <ContentTeaser content={{ ...article, profile: 'commentary' }} />
    );
    expect(commentaryHtml).toContain(article.title);
    for (const author of article.authors)
      expect(commentaryHtml).toContain(author);
  });
});

test('a closing-date label and its time occupy one metadata flex item', () => {
  const { container } = render(
    <ContentTeaser content={teaserFixtures.vacancy} />
  );
  const time = container.querySelector('time');
  expect(time.parentElement.tagName).toBe('SPAN');
  expect(time.parentElement).toHaveTextContent('Closing date: 30 Nov 2026');
  expect(time.parentElement.parentElement).toHaveClass(
    'mg-content-meta__before-title'
  );
});

test.each([
  ['4', '5 November 2026', '2026-11-04', '2026-11-05', '4–5 November 2026'],
  [
    '30 November',
    '2 December 2026',
    '2026-11-30',
    '2026-12-02',
    '30 November–2 December 2026',
  ],
  [
    '31 December 2026',
    '2 January 2027',
    '2026-12-31',
    '2027-01-02',
    '31 December 2026–2 January 2027',
  ],
])(
  'localized range %s to %s preserves both machine-readable endpoints',
  (start, end, startDate, endDate, visible) => {
    const { container } = render(
      <ContentTeaser
        content={{
          ...teaserFixtures.event,
          event: {
            start: { dateTime: startDate, text: start },
            end: { dateTime: endDate, text: end },
          },
        }}
      />
    );
    expect(container).toHaveTextContent(visible);
    const dates = container.querySelectorAll('time');
    expect(dates).toHaveLength(2);
    expect(dates[0]).toHaveAttribute('datetime', startDate);
    expect(dates[1]).toHaveAttribute('datetime', endDate);
  }
);
