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
      <div style={{ maxWidth: context.parameters.teaserWidth || '22rem' }}>
        <Story />
      </div>
    ),
  ],
};
export const News = { args: { content: teaserFixtures.news } };
export const Publication = { args: { content: teaserFixtures.publication } };
export const Resource = { args: { content: teaserFixtures.resource } };
export const Event = { args: { content: teaserFixtures.event } };
export const MinimumContent = {
  args: {
    content: {
      type: 'news',
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
    <div className="mg-grid mg-grid__col-2">
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
          type: 'news',
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
    <div className="mg-grid mg-grid__col-4">
      {Object.values(teaserFixtures).map(content => (
        <ContentTeaser key={content.type} content={content} />
      ))}
    </div>
  ),
};
