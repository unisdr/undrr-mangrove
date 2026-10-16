import React from 'react';
import { expect, within } from 'storybook/test';
import { ContentTeaser } from './ContentTeaser';
import { teaserFixtures } from './contentTeaserFixtures';

export default {
  title: 'Patterns/Content teaser',
  component: ContentTeaser,
  parameters: { layout: 'padded', docs: { source: { html: true } } },
  decorators: [
    (Story, context) => (
      <div style={{ maxWidth: context.parameters.teaserWidth || '52rem' }}>
        <Story />
      </div>
    ),
  ],
};
export const News = { args: { content: teaserFixtures.news } };
export const Publication = { args: { content: teaserFixtures.publication } };
export const Resource = { args: { content: teaserFixtures.resource } };
export const Event = { args: { content: teaserFixtures.event } };
export const Blog = { args: { content: teaserFixtures.blog } };
export const Organization = {
  name: 'Organization',
  args: { content: teaserFixtures.organization },
};
export const Collection = { args: { content: teaserFixtures.collection } };
export const Vacancy = { args: { content: teaserFixtures.vacancy } };
export const HazardProfile = {
  name: 'Hazard profile',
  args: { content: teaserFixtures['hazard-profile'] },
};
export const ConferenceSession = {
  name: 'Conference session',
  args: { content: teaserFixtures['conference-session'] },
};
export const Commitment = { args: { content: teaserFixtures.commitment } };
export const LandingPage = {
  name: 'Landing page',
  args: { content: teaserFixtures['landing-page'] },
};
export const NationalPlatform = {
  name: 'National platform',
  args: { content: teaserFixtures['national-platform'] },
};
export const Terminology = { args: { content: teaserFixtures.terminology } };
export const Person = { args: { content: teaserFixtures.person } };
export const CollectionCreated = {
  name: 'Collection created',
  args: {
    content: {
      ...teaserFixtures.collection,
      freshness: {
        kind: 'created',
        date: { label: 'Created', dateTime: '2026-09-01', text: '1 Sep 2026' },
      },
    },
  },
};
export const ClosedVacancy = {
  name: 'Closed vacancy',
  args: { content: { ...teaserFixtures.vacancy, status: 'Closed' } },
};

export const MinimumContent = {
  args: {
    content: {
      type: 'article',
      profile: 'news',
      title: 'A result without optional fields',
      link: '/news',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('link', { name: 'A result without optional fields' })
    ).toHaveAttribute('href', '/news');
    await expect(canvasElement.querySelector('.mg-card__visual')).toBeNull();
    await expect(canvasElement.querySelector('.mg-card__meta')).toBeNull();
  },
};
export const MissingCovers = {
  parameters: { teaserWidth: '48rem' },
  render: () => (
    <div>
      {[
        teaserFixtures.publication,
        {
          ...teaserFixtures.publication,
          image: undefined,
          title: 'A publication available as text',
        },
      ].map(item => (
        <ContentTeaser key={item.title} content={item} />
      ))}
    </div>
  ),
};
export const Arabic = {
  render: () => (
    <div dir="rtl">
      <ContentTeaser
        content={{
          type: 'article',
          profile: 'news',
          title: 'مجتمعات أكثر قدرة على الصمود أمام الكوارث',
          typeLabel: 'أخبار',
          link: '/ar/news',
          lang: 'ar',
          summary:
            'المعرفة المحلية والتخطيط المشترك يساعدان المجتمعات على الاستعداد للمخاطر.',
        }}
      />
    </div>
  ),
};

export const MixedContent = {
  parameters: { teaserWidth: '70rem' },
  render: () => (
    <ul className="mg-content-teaser-list">
      {Object.values(teaserFixtures).map(content => (
        <li key={content.type}>
          <ContentTeaser content={content} />
        </li>
      ))}
    </ul>
  ),
};

export const MissingOptionalFields = {
  name: 'Missing optional fields',
  render: () => (
    <ul className="mg-content-teaser-list">
      {Object.keys(teaserFixtures).map(type => (
        <li key={type}>
          <ContentTeaser
            content={{
              type: teaserFixtures[type].type,
              profile: teaserFixtures[type].profile,
              title: `A ${type} result with only required fields`,
              link: `/examples/${type}`,
            }}
          />
        </li>
      ))}
    </ul>
  ),
};
